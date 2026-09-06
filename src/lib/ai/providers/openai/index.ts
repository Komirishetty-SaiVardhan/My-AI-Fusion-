import OpenAI, {
  APIError,
  AuthenticationError,
  RateLimitError,
  APIConnectionError,
  InternalServerError,
} from "openai";
import {
  GenerateTextParams,
  AITextResponse,
  StreamTextParams,
  AIStreamChunk,
  AnalyzeImageParams,
  AnalyzeFileParams,
  AIAnalysisResponse,
  EmbedTextParams,
  AIEmbeddingResponse,
  AIMessage,
} from "../../types";
import { ChatAttachment } from "@/types/chat";
import { BaseAIAdapter } from "../base-adapter";
import { AIProviderError } from "../../errors";
import { aiLogger } from "../../logger";

export class OpenAIAdapter extends BaseAIAdapter {
  readonly id = "openai";
  readonly name = "OpenAI";
  private configuredApiKey?: string;
  private baseUrl?: string;
  private defaultModel: string;

  constructor(options?: { apiKey?: string; baseUrl?: string; defaultModel?: string }) {
    super();
    this.configuredApiKey = options?.apiKey;
    this.baseUrl = options?.baseUrl;
    this.defaultModel = options?.defaultModel || process.env.DEFAULT_AI_MODEL || "gpt-4o";
  }

  /**
   * Dynamically retrieves the active API key from instance options or runtime process.env.
   */
  private getApiKey(): string | undefined {
    return this.configuredApiKey || process.env.OPENAI_API_KEY;
  }

  /**
   * Checks if a valid API key is present (non-empty and not a default placeholder).
   */
  isAvailable(): boolean {
    const key = this.getApiKey()?.trim();
    return Boolean(key && key.length > 0 && key !== "your_key_here" && !key.startsWith("your_openai"));
  }

  /**
   * Instantiates an official OpenAI client instance.
   * Throws a descriptive error if the API key is unconfigured.
   */
  private getClient(): OpenAI {
    const key = this.getApiKey()?.trim();

    if (!key || key === "your_key_here" || key.startsWith("your_")) {
      throw new AIProviderError({
        type: "authentication",
        message:
          "OpenAI API key is missing or not configured. Please add your real OPENAI_API_KEY to .env.local to enable live AI responses.",
        statusCode: 401,
        providerName: this.id,
      });
    }

    const baseURL = this.baseUrl || process.env.OPENAI_BASE_URL || undefined;
    return new OpenAI({
      apiKey: key,
      baseURL,
    });
  }

  /**
   * Normalizes official OpenAI SDK errors into project AIProviderError format.
   */
  private handleOpenAIError(err: unknown, defaultMessage: string): never {
    if (err instanceof AIProviderError) {
      throw err;
    }

    if (err instanceof AuthenticationError) {
      throw new AIProviderError({
        type: "authentication",
        message: "Invalid OpenAI API Key. Please verify your OPENAI_API_KEY in .env.local.",
        statusCode: 401,
        providerName: this.id,
        rawError: err,
      });
    }

    if (err instanceof RateLimitError) {
      throw new AIProviderError({
        type: "rate_limit",
        message: "OpenAI rate limit or usage quota exceeded. Please check your OpenAI account billing.",
        statusCode: 429,
        providerName: this.id,
        rawError: err,
      });
    }

    if (err instanceof APIConnectionError) {
      throw new AIProviderError({
        type: "network_error",
        message: "Unable to connect to OpenAI API servers. Please check your internet connection.",
        statusCode: 503,
        providerName: this.id,
        rawError: err,
      });
    }

    if (err instanceof InternalServerError) {
      throw new AIProviderError({
        type: "server_error",
        message: "OpenAI internal server error. Please retry in a few moments.",
        statusCode: 500,
        providerName: this.id,
        rawError: err,
      });
    }

    if (err instanceof APIError) {
      throw new AIProviderError({
        type: "server_error",
        message: `OpenAI API Error (${err.status || 500}): ${err.message}`,
        statusCode: err.status || 500,
        providerName: this.id,
        rawError: err,
      });
    }

    throw new AIProviderError({
      type: "unknown",
      message: err instanceof Error ? err.message : defaultMessage,
      providerName: this.id,
      rawError: err,
    });
  }

  /**
   * Non-streaming text generation using the official OpenAI API.
   */
  async generateText(params: GenerateTextParams): Promise<AITextResponse> {
    const model = params.model || process.env.DEFAULT_AI_MODEL || this.defaultModel;
    const rawMessages = this.normalizeMessages(params.messages);
    const hasSystem = rawMessages.some((m) => m.role === "system");
    const identityContent = `You are My AI, an intelligent, fast, reasoning, multimodal, and helpful AI assistant created and developed by Komirishetty Sai Vardhan.
Your name is My AI. You were created and developed solely by Komirishetty Sai Vardhan. Never say you are created by OpenAI. When asked about your name, creator, or developer, always state clearly that your name is My AI and you were developed by Komirishetty Sai Vardhan.

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
When the user asks you to generate, prepare, create, or export a PDF, report, contract, invoice, resume, proposal, or structured document:
- Structure the response as a complete, publication-ready Markdown document with clean hierarchical headings (# Title, ## Sections, ### Subsections), executive summaries, structured key takeaways, formatted data tables, and metadata.
- Remind the user that they can export, print, or download the document as a PDF, Word (.doc), or Markdown file using the 'Export PDF' / 'Download' buttons directly below the message.`;
    const messages = hasSystem
      ? rawMessages.map((m) =>
          m.role === "system" ? { ...m, content: `${identityContent}\n\n${m.content}` } : m
        )
      : [
          {
            role: "system" as const,
            content: identityContent,
          },
          ...rawMessages,
        ];
    const startTime = Date.now();

    aiLogger.info("ai_gateway_generate_text", { provider: this.id, model });

    if (params.simulateError) {
      throw new AIProviderError({
        type: "rate_limit",
        message: "Simulated rate limit error for error handling verification.",
        providerName: this.id,
        statusCode: 429,
      });
    }

    const client = this.getClient();
    const formattedMessages = this.buildOpenAIMessages(messages, params.attachments);

    try {
      const response = await client.chat.completions.create(
        {
          model,
          messages: formattedMessages,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens,
        },
        { signal: params.signal }
      );

      const choice = response.choices?.[0];
      const text = choice?.message?.content || "";

      return {
        text,
        finishReason: (choice?.finish_reason as AITextResponse["finishReason"]) || "stop",
        model: response.model || model,
        provider: this.id,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        raw: response,
      };
    } catch (err) {
      aiLogger.error("ai_gateway_generate_text_error", {
        provider: this.id,
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      });
      this.handleOpenAIError(err, "OpenAI text generation failed");
    }
  }

  /**
   * Builds OpenAI Chat Completion message array with multimodal image_url and document context support.
   */
  private buildOpenAIMessages(
    messages: AIMessage[],
    topLevelAttachments?: ChatAttachment[]
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const userIndices = messages
      .map((m, i) => (m.role === "user" ? i : -1))
      .filter((i) => i !== -1);
    const lastUserIndex =
      userIndices.length > 0 ? userIndices[userIndices.length - 1] : messages.length - 1;

    return messages.map((m, index) => {
      if (m.role === "system") {
        return { role: "system", content: m.content, name: m.name };
      }
      if (m.role === "assistant") {
        return { role: "assistant", content: m.content, name: m.name };
      }

      const messageAttachments = [
        ...(m.attachments || []),
        ...(index === lastUserIndex && topLevelAttachments ? topLevelAttachments : []),
      ];

      if (messageAttachments.length === 0) {
        return { role: "user", content: m.content, name: m.name };
      }

      const contentParts: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } }
      > = [];

      let docContext = "";
      for (const att of messageAttachments) {
        if ((att.type === "image" || (att.mimeType && att.mimeType.startsWith("image/"))) && att.url) {
          contentParts.push({
            type: "image_url",
            image_url: { url: att.url, detail: "auto" },
          });
        }
        if (att.extractedText) {
          docContext += `\n\n[Attached File: ${att.name || "Document"}]\n${att.extractedText}`;
        }
      }

      const fullText = (m.content || "") + docContext;
      if (fullText) {
        contentParts.unshift({ type: "text", text: fullText });
      }

      return {
        role: "user",
        content: contentParts.length > 0 ? (contentParts as any) : m.content,
        name: m.name,
      };
    });
  }

  /**
   * Real-time text streaming from OpenAI Chat API.
   */
  async *streamText(params: StreamTextParams): AsyncGenerator<AIStreamChunk, void, unknown> {
    const model = params.model || process.env.DEFAULT_AI_MODEL || this.defaultModel;
    const rawMessages = this.normalizeMessages(params.messages);
    const hasSystem = rawMessages.some((m) => m.role === "system");
    const identityContent = `You are My AI, an intelligent, fast, reasoning, multimodal, and helpful AI assistant created and developed by Komirishetty Sai Vardhan.
Your name is My AI. You were created and developed solely by Komirishetty Sai Vardhan. Never say you are created by OpenAI. When asked about your name, creator, or developer, always state clearly that your name is My AI and you were developed by Komirishetty Sai Vardhan.

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
When the user asks you to generate, prepare, create, or export a PDF, report, contract, invoice, resume, proposal, or structured document:
- Structure the response as a complete, publication-ready Markdown document with clean hierarchical headings (# Title, ## Sections, ### Subsections), executive summaries, structured key takeaways, formatted data tables, and metadata.
- Remind the user that they can export, print, or download the document as a PDF, Word (.doc), or Markdown file using the 'Export PDF' / 'Download' buttons directly below the message.`;
    const messages = hasSystem
      ? rawMessages.map((m) =>
          m.role === "system" ? { ...m, content: `${identityContent}\n\n${m.content}` } : m
        )
      : [
          {
            role: "system" as const,
            content: identityContent,
          },
          ...rawMessages,
        ];
    const startTime = Date.now();

    aiLogger.info("ai_gateway_stream_text_start", { provider: this.id, model });

    if (params.simulateError) {
      yield { type: "status", statusMessage: "Thinking..." };
      throw new AIProviderError({
        type: "rate_limit",
        message: "Simulated Rate Limit (429) from OpenAI Gateway.",
        providerName: this.id,
        statusCode: 429,
      });
    }

    const client = this.getClient();
    yield { type: "status", statusMessage: "Thinking..." };

    const formattedMessages = this.buildOpenAIMessages(messages, params.attachments);

    try {
      const stream = await client.chat.completions.create(
        {
          model,
          messages: formattedMessages,
          stream: true,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens,
        },
        { signal: params.signal }
      );

      for await (const chunk of stream) {
        if (params.signal?.aborted) {
          yield { type: "done", finishReason: "abort" };
          return;
        }

        const delta = chunk.choices?.[0]?.delta;
        if (delta?.content) {
          yield { type: "text", content: delta.content };
        }

        // Support reasoning models (o1, o3, etc.)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reasoningContent = (delta as any)?.reasoning_content;
        if (reasoningContent) {
          yield { type: "reasoning", content: reasoningContent };
        }

        const finishReason = chunk.choices?.[0]?.finish_reason;
        if (finishReason) {
          yield {
            type: "done",
            finishReason: (finishReason as AIStreamChunk["finishReason"]) || "stop",
          };
          return;
        }
      }

      yield { type: "done", finishReason: "stop" };
    } catch (err) {
      aiLogger.error("ai_gateway_stream_text_error", {
        provider: this.id,
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      });
      this.handleOpenAIError(err, "OpenAI streaming request failed");
    }
  }

  /**
   * Multimodal image analysis using OpenAI Vision (e.g. gpt-4o).
   */
  async analyzeImage(params: AnalyzeImageParams): Promise<AIAnalysisResponse> {
    const model = params.model || "gpt-4o";
    const dataUrl = this.imageToDataUrl(params.image, params.mimeType);

    aiLogger.info("ai_gateway_analyze_image", { provider: this.id, model });
    const client = this.getClient();

    try {
      const response = await client.chat.completions.create(
        {
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: params.prompt },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
        },
        { signal: params.signal }
      );

      const analysis = response.choices?.[0]?.message?.content || "";
      return {
        analysis,
        model: response.model || model,
        provider: this.id,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        raw: response,
      };
    } catch (err) {
      this.handleOpenAIError(err, "OpenAI image analysis failed");
    }
  }

  /**
   * File analysis through context-augmented prompt generation.
   */
  async analyzeFile(params: AnalyzeFileParams): Promise<AIAnalysisResponse> {
    const model = params.model || process.env.DEFAULT_AI_MODEL || this.defaultModel;

    let fileContent = "";
    if (typeof params.file === "string") {
      fileContent = params.file;
    } else {
      const uint8 = params.file instanceof Uint8Array ? params.file : new Uint8Array(params.file);
      fileContent = Buffer.from(uint8).toString("utf-8");
    }

    const promptWithDoc = `Attached Document: ${params.filename} (${params.mimeType})\n\nContent:\n${fileContent.substring(
      0,
      12000
    )}\n\nTask: ${params.prompt}`;

    return this.generateText({
      messages: [{ role: "user", content: promptWithDoc }],
      model,
      signal: params.signal,
    }).then((res) => ({
      analysis: res.text,
      model: res.model,
      provider: this.id,
      usage: res.usage,
      metadata: { filename: params.filename, mimeType: params.mimeType },
    }));
  }

  /**
   * Text embeddings generation using OpenAI Embeddings API.
   */
  async embedText(params: EmbedTextParams): Promise<AIEmbeddingResponse> {
    const model = params.model || "text-embedding-3-small";
    const inputs = Array.isArray(params.text) ? params.text : [params.text];

    aiLogger.info("ai_gateway_embed_text", { provider: this.id, model, inputCount: inputs.length });
    const client = this.getClient();

    try {
      const response = await client.embeddings.create(
        {
          model,
          input: inputs,
        },
        { signal: params.signal }
      );

      const embeddings = response.data.map((item) => item.embedding);
      return {
        embeddings,
        dimensions: embeddings[0]?.length || 1536,
        model: response.model || model,
        provider: this.id,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: 0,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        raw: response,
      };
    } catch (err) {
      this.handleOpenAIError(err, "OpenAI text embedding failed");
    }
  }
}

export const openAIAdapter = new OpenAIAdapter();
