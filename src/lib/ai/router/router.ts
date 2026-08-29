import {
  ClassificationResult,
  RouterRequest,
  RoutingDecision,
} from "./types";
import { defaultPolicyManager, PolicyManager } from "./policies";
import { requestClassifier, RequestClassifier } from "./classifier";
import { aiLogger } from "../logger";

export class IntelligentAIRouter {
  private classifier: RequestClassifier;
  private policyManager: PolicyManager;
  private decisionHistory: RoutingDecision[] = [];
  private readonly maxHistorySize = 100;

  constructor(
    classifier: RequestClassifier = requestClassifier,
    policyManager: PolicyManager = defaultPolicyManager
  ) {
    this.classifier = classifier;
    this.policyManager = policyManager;
  }

  /**
   * Evaluates an incoming request and determines the optimal model and capability tier.
   * Performs confidence-based escalation if classification certainty is low.
   */
  route(request: RouterRequest): RoutingDecision {
    const startTime = Date.now();
    const requestId = `route-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const promptSummary = this.getPromptSummary(request);

    // 1. Check for explicit category override
    let classification: ClassificationResult;
    if (request.explicitCategory) {
      classification = {
        category: request.explicitCategory,
        confidence: 1.0,
        reason: `Explicit category override: ${request.explicitCategory}`,
        detectedFeatures: ["explicit_override"],
      };
    } else {
      classification = this.classifier.classify(request);
    }

    const initialPolicy = this.policyManager.getPolicy(classification.category);
    let finalCategory = classification.category;
    let selectedModel = request.explicitModel || initialPolicy.primaryModel;
    let wasEscalated = false;
    let escalationReason: string | undefined;

    // 2. Confidence-Based Escalation Evaluation
    // If the model confidence is below policy threshold, escalate to the stronger tier
    if (
      !request.explicitModel &&
      !request.explicitCategory &&
      classification.confidence < initialPolicy.confidenceThreshold &&
      initialPolicy.escalationTarget
    ) {
      const escalatedPolicy = this.policyManager.getPolicy(initialPolicy.escalationTarget);
      wasEscalated = true;
      escalationReason = `Confidence score (${classification.confidence.toFixed(2)}) is below threshold (${initialPolicy.confidenceThreshold.toFixed(2)}). Escalated from ${classification.category} to ${initialPolicy.escalationTarget}.`;
      finalCategory = initialPolicy.escalationTarget;
      selectedModel = escalatedPolicy.primaryModel;

      aiLogger.info("router_confidence_escalation", {
        requestId,
        fromCategory: classification.category,
        toCategory: finalCategory,
        confidence: classification.confidence,
        escalatedModel: selectedModel,
      });
    }

    const decision: RoutingDecision = {
      requestId,
      timestamp: Date.now(),
      promptSummary,
      classifiedCategory: classification.category,
      finalCategory,
      confidence: classification.confidence,
      primaryModel: initialPolicy.primaryModel,
      selectedModel,
      wasEscalated,
      escalationReason,
      fallbackAttempted: false,
      durationMs: Date.now() - startTime,
      routeReason: wasEscalated
        ? `${classification.reason} -> Escalated: ${escalationReason}`
        : classification.reason,
      detectedFeatures: classification.detectedFeatures,
    };

    this.recordDecision(decision);

    aiLogger.info("router_decision_made", {
      requestId,
      category: finalCategory,
      model: selectedModel,
      wasEscalated,
      confidence: classification.confidence,
    });

    return decision;
  }

  /**
   * Executes a model call with timeout and automatic fallback progression.
   */
  async executeWithFallback<T>(
    request: RouterRequest,
    executor: (model: string, timeoutMs: number) => Promise<T>
  ): Promise<{ result: T; decision: RoutingDecision }> {
    const decision = this.route(request);
    const policy = this.policyManager.getPolicy(decision.finalCategory);
    const candidateModels = [decision.selectedModel, ...policy.fallbackModels.filter((m) => m !== decision.selectedModel)];

    let lastError: unknown = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const currentModel = candidateModels[i];
      const isFallback = i > 0;

      if (isFallback) {
        decision.fallbackAttempted = true;
        decision.fallbackModelUsed = currentModel;
        aiLogger.warn("router_fallback_invoked", {
          requestId: decision.requestId,
          attempt: i + 1,
          fallbackModel: currentModel,
        });
      }

      try {
        const result = await executor(currentModel, policy.timeoutMs);
        decision.selectedModel = currentModel;
        return { result, decision };
      } catch (err) {
        lastError = err;
        aiLogger.error("router_model_execution_failed", {
          requestId: decision.requestId,
          model: currentModel,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    throw lastError || new Error(`All candidate models failed for category ${decision.finalCategory}`);
  }

  getRecentDecisions(limit = 20): RoutingDecision[] {
    return this.decisionHistory.slice(-limit).reverse();
  }

  clearDecisions(): void {
    this.decisionHistory = [];
  }

  private recordDecision(decision: RoutingDecision): void {
    this.decisionHistory.push(decision);
    if (this.decisionHistory.length > this.maxHistorySize) {
      this.decisionHistory.shift();
    }
  }

  private getPromptSummary(request: RouterRequest): string {
    let raw = "";
    if (request.prompt) raw = request.prompt;
    else if (typeof request.messages === "string") raw = request.messages;
    else if (Array.isArray(request.messages) && request.messages.length > 0) {
      raw = request.messages[request.messages.length - 1].content || "";
    }
    const clean = raw.replace(/\s+/g, " ").trim();
    return clean.length > 60 ? clean.substring(0, 60) + "..." : clean || "[Attachment/Empty]";
  }
}

export const intelligentRouter = new IntelligentAIRouter();
