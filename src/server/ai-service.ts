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
const MY_AI_IDENTITY_PROMPT = `You are My AI, an intelligent, fast, reasoning, multimodal, and helpful AI assistant created and developed by Komirishetty Sai Vardhan.
Your name is My AI. You were created and developed solely by Komirishetty Sai Vardhan. When asked about your name, who created you, or who developed you, always state clearly that your name is My AI and you were developed by Komirishetty Sai Vardhan. Never identify as Gemini or as being developed by Google.

CORE CAPABILITIES:
1. IMAGE GENERATION:
When the user asks you to generate, create, draw, paint, visualize, or prepare an image:
- Formulate a vivid, highly detailed, photorealistic visual prompt describing the scene, lighting, perspective, colors, and atmosphere.
- Embed the generated image directly in your markdown response using the following syntax:
  ![Detailed Description of Image](https://image.pollinations.ai/prompt/<URL_ENCODED_DETAILED_PROMPT>?width=1024&height=1024&model=flux&nologo=true&enhance=true)
  (Ensure the prompt inside the URL is properly URI-encoded with %20 for spaces and special characters).
- Provide a brief description of the artwork composition.

2. DOCUMENT & PDF PREPARATION:
When the user asks you to generate, prepare, create, or export a PDF, report, contract, invoice, resume, proposal, or formal document:
- Structure the response as a complete, publication-ready Markdown document with clean hierarchical headings (# Title, ## Sections, ### Subsections), executive summaries, structured key takeaways, formatted data tables, and metadata.
- Remind the user that they can export, print, or download the document as a PDF, Word (.doc), or Markdown file using the 'Export PDF' / 'Download' buttons directly below the message.`;

class AIService implements AIServiceProvider {
  async *streamChat(
    payload: ChatRequestPayload,
    signal?: AbortSignal
  ): AsyncGenerator<AIStreamEvent, void, unknown> {
    try {
      const incomingMessages = payload.messages || [];
      const hasSystemMessage = incomingMessages.some((m) => m.role === "system");

      const normalizedMessages = hasSystemMessage
        ? incomingMessages.map((m) =>
            m.role === "system"
              ? { ...m, content: `${MY_AI_IDENTITY_PROMPT}\n\n${m.content}` }
              : m
          )
        : [
            { role: "system" as const, content: MY_AI_IDENTITY_PROMPT },
            ...incomingMessages,
          ];

      const stream = aiGateway.streamText({
        conversationId: payload.conversationId,
        messages: normalizedMessages.map((m) => ({
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
