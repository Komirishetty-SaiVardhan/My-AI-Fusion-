import {
  AIProviderAdapter,
  AIMessage,
  GenerateTextParams,
  AITextResponse,
  StreamTextParams,
  AIStreamChunk,
  AnalyzeImageParams,
  AnalyzeFileParams,
  AIAnalysisResponse,
  EmbedTextParams,
  AIEmbeddingResponse,
} from "../types";
import { ProviderUnavailableError } from "../errors";

export abstract class BaseAIAdapter implements AIProviderAdapter {
  abstract readonly id: string;
  abstract readonly name: string;

  abstract isAvailable(): boolean;

  abstract generateText(params: GenerateTextParams): Promise<AITextResponse>;
  abstract streamText(params: StreamTextParams): AsyncGenerator<AIStreamChunk, void, unknown>;
  abstract analyzeImage(params: AnalyzeImageParams): Promise<AIAnalysisResponse>;
  abstract analyzeFile(params: AnalyzeFileParams): Promise<AIAnalysisResponse>;
  abstract embedText(params: EmbedTextParams): Promise<AIEmbeddingResponse>;

  protected normalizeMessages(messages: AIMessage[] | string): AIMessage[] {
    if (typeof messages === "string") {
      return [{ role: "user", content: messages }];
    }
    return messages;
  }

  protected ensureAvailable(): void {
    if (!this.isAvailable()) {
      throw new ProviderUnavailableError(
        this.name,
        `Provider "${this.name}" is not available because required API credentials are not configured.`
      );
    }
  }

  protected imageToDataUrl(
    image: string | Uint8Array | ArrayBuffer,
    mimeType = "image/jpeg"
  ): string {
    if (typeof image === "string") {
      if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("data:")) {
        return image;
      }
      return `data:${mimeType};base64,${image}`;
    }

    const uint8 = image instanceof Uint8Array ? image : new Uint8Array(image);
    const base64 = Buffer.from(uint8).toString("base64");
    return `data:${mimeType};base64,${base64}`;
  }
}
