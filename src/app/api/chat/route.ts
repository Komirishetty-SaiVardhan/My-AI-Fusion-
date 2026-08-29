import { NextRequest } from "next/server";
import { aiService } from "@/server/ai-service";
import { ChatRequestPayload } from "@/types/chat";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Input validation
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { conversationId, messages, model, mode, simulateError } = body as Partial<ChatRequestPayload>;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array must not be empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload: ChatRequestPayload = {
      conversationId: conversationId || "default",
      messages: messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
        content: String(m.content || ""),
      })),
      model,
      mode,
      simulateError: Boolean(simulateError),
    };

    const encoder = new TextEncoder();
    const abortSignal = req.signal;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of aiService.streamChat(payload, abortSignal)) {
            if (abortSignal.aborted) {
              break;
            }
            const sseChunk = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(sseChunk));
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Unknown stream error";
          const errorEvent = {
            type: "error",
            error: errorMessage,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
        } finally {
          controller.close();
        }
      },
      cancel() {
        // Stream cancelled by client
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
