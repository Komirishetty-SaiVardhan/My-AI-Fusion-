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

CORE CAPABILITIES & RESPONSE FORMATTING:

1. HANDWRITTEN NOTES, LETTERS & ASSIGNMENTS:
When the user asks you to write, generate, or prepare handwritten notes, handwritten letters, essays, assignments, cursive writing, calligraphy, or text written in handwriting:
- Output an interactive \`\`\`handwritten\`\`\` code block that renders with 100% deterministic spelling, punctuation, and multi-page formatting fidelity.
- Format the block with optional metadata headers followed by the EXACT verbatim text:
\`\`\`handwritten
Title: [Optional Title]
Paper: [lined | legal-pad | blank | grid | parchment | chalkboard]
Ink: [blue | black | royal-blue | gel-black | red | emerald | pencil | white]
Font: [caveat | kalam | patrick | architects | apple | dancing | indie | shadows]
---
[Your exact text or user-requested text here with natural paragraphs and line breaks]
\`\`\`
- Preserve every single word, spelling, punctuation, and paragraph break. The user will be able to customize paper textures, switch handwriting fonts, copy the image, and download high-resolution PNG/SVG files.

2. ARTISTIC & PHOTOREALISTIC IMAGE GENERATION:
When the user asks you to generate, create, draw, paint, visualize, or prepare visual artwork, photos, scenery, 3D renders, anime art, or illustrations (non-handwritten text):
- Formulate a vivid, highly detailed visual prompt describing the scene, lighting, perspective, colors, and art medium.
- Embed the generated image directly in your markdown response using:
  ![Artwork Description](https://image.pollinations.ai/prompt/<URL_ENCODED_DETAILED_PROMPT>?width=1024&height=1024&model=flux&nologo=true&enhance=true)
  (Ensure the prompt inside the URL is properly URI-encoded with %20 for spaces and special characters).

3. DOCUMENT & PDF PREPARATION:
When the user asks you to generate, prepare, create, or export a PDF, report, contract, invoice, resume, proposal, or formal document:
- Structure the response as a complete, publication-ready Markdown document with clean hierarchical headings (# Title, ## Sections, ### Subsections), executive summaries, structured key takeaways, formatted data tables, and metadata.
- Remind the user that they can export, print, or download the document as a PDF, Word (.doc), or Markdown file using the 'Export PDF' / 'Download' buttons directly below the message.

4. PRESENTATION SLIDES & DECKS:
When the user asks for a presentation, pitch deck, slide deck, or slides:
- Output an interactive \`\`\`slides\`\`\` code block containing a valid JSON array of slide objects:
\`\`\`slides
[
  {
    "title": "Introduction to AI",
    "subtitle": "The Next Frontier of Technology",
    "bullets": ["Foundation models and multimodal reasoning", "Real-time edge intelligence", "Transforming developer workflows"],
    "notes": "Introduce the core premise and welcome the audience."
  },
  {
    "title": "Key Architectures",
    "subtitle": "Transformers and Beyond",
    "bullets": ["Attention mechanisms and context scaling", "Mixture of Experts (MoE) efficiency", "State-space models and hybrids"],
    "notes": "Highlight technical breakthroughs."
  }
]
\`\`\`
- The user will get an interactive slide deck presentation with full-screen presentation mode, multiple themes (Midnight, Emerald, Corporate, Sunset), speaker notes, and instant PDF/Print export.

5. MIND MAPS & IDEA TREES:
When the user asks for a mind map, concept map, knowledge tree, or visual breakdown of a topic:
- Output an interactive \`\`\`mindmap\`\`\` code block containing a valid hierarchical JSON tree:
\`\`\`mindmap
{
  "name": "Artificial Intelligence",
  "children": [
    {
      "name": "Machine Learning",
      "children": [
        { "name": "Supervised Learning" },
        { "name": "Unsupervised Learning" },
        { "name": "Reinforcement Learning" }
      ]
    },
    {
      "name": "Deep Learning",
      "children": [
        { "name": "Computer Vision" },
        { "name": "Natural Language Processing" },
        { "name": "Generative Models" }
      ]
    }
  ]
}
\`\`\`
- The user will get an interactive, pan-and-zoom node graph with collapsible nodes, click-to-deep-dive research, and SVG download.

6. INTERACTIVE CODE ARTIFACTS:
When writing HTML/CSS/JS or interactive web components, write clean, complete code in standard \`\`\`html or \`\`\`jsx/\`\`\`tsx code blocks. The user has an instant interactive live preview sandbox button embedded on all code blocks.`;


class AIService implements AIServiceProvider {
  async *streamChat(
    payload: ChatRequestPayload,
    signal?: AbortSignal
  ): AsyncGenerator<AIStreamEvent, void, unknown> {
    try {
      const incomingMessages = payload.messages || [];

      // Speed Optimization: Sliding-Window Context Pruning
      // Preserves original user goal + last 14 messages with stripped historical attachments
      let prunedMessages = incomingMessages;
      if (incomingMessages.length > 16) {
        const systemMsgs = incomingMessages.filter((m) => m.role === "system");
        const nonSystemMsgs = incomingMessages.filter((m) => m.role !== "system");
        const firstTurn = nonSystemMsgs.slice(0, 2);
        const recentTurns = nonSystemMsgs.slice(-12);
        const sanitizedRecent = recentTurns.map((m, idx) => ({
          ...m,
          attachments:
            idx >= recentTurns.length - 2
              ? m.attachments
              : m.attachments?.map((a) => ({
                  ...a,
                  url: a.url?.startsWith("data:") ? "" : a.url,
                })),
        }));
        prunedMessages = [...systemMsgs, ...firstTurn, ...sanitizedRecent];
      }

      const hasSystemMessage = prunedMessages.some((m) => m.role === "system");

      const normalizedMessages = hasSystemMessage
        ? prunedMessages.map((m) =>
            m.role === "system"
              ? { ...m, content: `${MY_AI_IDENTITY_PROMPT}\n\n${m.content}` }
              : m
          )
        : [
            { role: "system" as const, content: MY_AI_IDENTITY_PROMPT },
            ...prunedMessages,
          ];

      const stream = aiGateway.streamText({
        conversationId: payload.conversationId,
        messages: normalizedMessages.map((m) => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments,
        })),
        model: payload.model,
        mode: payload.mode,
        temperature: payload.temperature,
        attachments: payload.attachments,
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
