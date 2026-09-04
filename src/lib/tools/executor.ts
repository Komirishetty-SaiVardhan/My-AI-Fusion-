import {
  ITool,
  ToolCallContext,
  ToolExecutionResult,
} from "./types";
import { toolRegistry, ToolRegistry } from "./registry";
import { permissionManager, PermissionManager } from "./permissions";
import { calculatorTool } from "./tools/calculator";
import { webSearchTool } from "./tools/web-search";
import { fileSearchTool } from "./tools/file-search";
import { imageGeneratorTool } from "./tools/image-generator";
import { documentGeneratorTool } from "./tools/document-generator";
import { aiLogger } from "../ai/logger";

export class ToolExecutor {
  private registry: ToolRegistry;
  private permissions: PermissionManager;

  constructor(options?: { registry?: ToolRegistry; permissions?: PermissionManager }) {
    this.registry = options?.registry || toolRegistry;
    this.permissions = options?.permissions || permissionManager;

    // Auto-register default initial tools if not already present
    if (!this.registry.getTool("calculator")) {
      this.registry.registerTool(calculatorTool);
    }
    if (!this.registry.getTool("web_search")) {
      this.registry.registerTool(webSearchTool);
    }
    if (!this.registry.getTool("file_search")) {
      this.registry.registerTool(fileSearchTool);
    }
    if (!this.registry.getTool("image_generator")) {
      this.registry.registerTool(imageGeneratorTool);
    }
    if (!this.registry.getTool("document_generator")) {
      this.registry.registerTool(documentGeneratorTool);
    }
  }

  /**
   * Executes a tool with sandboxing, loop prevention, input validation, timeouts, and secret-redacted logging.
   */
  async executeTool<T = unknown>(
    toolName: string,
    input: unknown,
    context: ToolCallContext
  ): Promise<ToolExecutionResult<T>> {
    const startTime = Date.now();

    // 1. Loop Guard: Execution Limits
    if (context.executionCount >= context.maxExecutionsPerTurn) {
      const errorMsg = `Infinite loop prevention: Maximum execution limit (${context.maxExecutionsPerTurn} calls/turn) exceeded for tool '${toolName}'.`;
      aiLogger.warn("tool_execution_limit_exceeded", {
        toolName,
        executionCount: context.executionCount,
        maxLimit: context.maxExecutionsPerTurn,
      });

      return {
        success: false,
        toolName,
        error: errorMsg,
        durationMs: Date.now() - startTime,
      };
    }

    // 2. Registry Lookup & Enablement Check
    const tool = this.registry.getTool(toolName);
    if (!tool) {
      return {
        success: false,
        toolName,
        error: `Tool '${toolName}' is not registered.`,
        durationMs: Date.now() - startTime,
      };
    }

    if (!tool.isEnabled) {
      return {
        success: false,
        toolName,
        error: `Tool '${toolName}' is currently disabled by system configuration.`,
        durationMs: Date.now() - startTime,
      };
    }

    // 3. Runtime Input Schema Validation
    const validation = tool.validate(input);
    if (!validation.isValid || !validation.parsed) {
      aiLogger.warn("tool_validation_failed", {
        toolName,
        error: validation.error,
      });

      return {
        success: false,
        toolName,
        error: `Tool argument validation error: ${validation.error}`,
        durationMs: Date.now() - startTime,
      };
    }

    // 4. Permission & User Approval Check
    const approvalCheck = this.permissions.checkApprovalRequired(tool as ITool, context);
    if (approvalCheck.requiresApproval) {
      aiLogger.info("tool_requires_user_approval", {
        toolName,
        userId: context.userId,
        token: approvalCheck.token,
      });

      return {
        success: false,
        toolName,
        requiresApproval: true,
        approvalToken: approvalCheck.token,
        error: `Tool '${toolName}' is sensitive and requires explicit user confirmation.`,
        durationMs: Date.now() - startTime,
      };
    }

    // 5. Secret-Redacted Start Log
    aiLogger.info("tool_call_start", {
      toolName,
      userId: context.userId,
      executionCount: context.executionCount + 1,
    });

    // 6. Timeout-Wrapped Execution with Graceful Failure Recovery
    try {
      const data = await this.executeWithTimeout(
        () => tool.execute(validation.parsed!, context),
        context.timeoutMs || 5000
      );

      const durationMs = Date.now() - startTime;
      aiLogger.info("tool_call_completed", {
        toolName,
        durationMs,
      });

      return {
        success: true,
        toolName,
        data: data as T,
        durationMs,
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);

      aiLogger.warn("tool_call_failed", {
        toolName,
        error: errorMsg,
        durationMs,
      });

      // Tool failure recovery: return formatted error instead of crashing
      return {
        success: false,
        toolName,
        error: `Tool execution failed: ${errorMsg}`,
        durationMs,
      };
    }
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      let isTimedOut = false;

      const timer = setTimeout(() => {
        isTimedOut = true;
        reject(new Error(`Tool execution timed out after ${timeoutMs}ms.`));
      }, timeoutMs);

      fn()
        .then((result) => {
          if (!isTimedOut) {
            clearTimeout(timer);
            resolve(result);
          }
        })
        .catch((err) => {
          if (!isTimedOut) {
            clearTimeout(timer);
            reject(err);
          }
        });
    });
  }
}

export const toolExecutor = new ToolExecutor();
