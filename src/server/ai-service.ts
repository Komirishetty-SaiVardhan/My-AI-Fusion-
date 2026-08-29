import { AIStreamEvent, ChatRequestPayload } from "@/types/chat";
import { aiGateway } from "@/lib/ai/gateway";
import { AIProviderError } from "@/lib/ai/errors";
import { aiLogger } from "@/lib/ai/logger";

export interface AIServiceProvider {
  streamChat(
    payload: ChatRequestPayload,
    signal?: AbortSignal
  ): AsyncGenerator<AIStreamEvent, void, unknown>;
}

/**
 * Server-Side AI Service Layer
 * Bridges API routes with the isolated AI Gateway abstraction.
 * Enforces server-side credentials and provider-agnostic streaming events.
 */
class AIService implements AIServiceProvider {
  async *streamChat(
    payload: ChatRequestPayload,
    signal?: AbortSignal
  ): AsyncGenerator<AIStreamEvent, void, unknown> {
    try {
      const stream = aiGateway.streamText({
        conversationId: payload.conversationId,
        messages: payload.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        model: payload.model,
        mode: payload.mode,
        simulateError: payload.simulateError,
        signal,
      });

      for await (const chunk of stream) {
        if (signal?.aborted) {
          yield { type: "done", finishReason: "abort" };
          return;
        }

        if (chunk.type === "status" && chunk.statusMessage) {
          yield {
            type: "status",
            message: chunk.statusMessage,
          };
        } else if (chunk.type === "reasoning" && chunk.content) {
          yield {
            type: "reasoning-delta",
            delta: chunk.content,
          };
        } else if (chunk.type === "text" && chunk.content) {
          yield {
            type: "text-delta",
            delta: chunk.content,
          };
        } else if (chunk.type === "done") {
          yield {
            type: "done",
            finishReason: chunk.finishReason || "stop",
          };
        }
      }
    } catch (err: unknown) {
      if (signal?.aborted) {
        yield { type: "done", finishReason: "abort" };
        return;
      }

      if (err instanceof AIProviderError) {
        aiLogger.error("ai_service_provider_error", {
          type: err.type,
          message: err.message,
          statusCode: err.statusCode,
          retryAfterMs: err.retryAfterMs,
        });

        yield {
          type: "error",
          error: err.message,
        };
        return;
      }

      const msg = err instanceof Error ? err.message : "An unexpected service error occurred.";
      aiLogger.error("ai_service_unexpected_error", { message: msg });
      yield {
        type: "error",
        error: msg,
      };
    }
  }
}

export const aiService = new AIService();
