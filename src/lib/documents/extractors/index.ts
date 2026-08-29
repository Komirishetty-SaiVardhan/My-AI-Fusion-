import { DocumentExtractor, ExtractionResult } from "./types";
import { DocumentFormat } from "../types";
import { pdfExtractor } from "./pdf-extractor";
import { docxExtractor } from "./docx-extractor";
import { textExtractor } from "./text-extractor";

export * from "./types";
export * from "./pdf-extractor";
export * from "./docx-extractor";
export * from "./text-extractor";

export class ExtractorRegistry {
  private extractors: Map<DocumentFormat, DocumentExtractor> = new Map();

  constructor() {
    this.register(pdfExtractor);
    this.register(docxExtractor);
    this.register(textExtractor);
  }

  register(extractor: DocumentExtractor): void {
    for (const format of extractor.supportedFormats) {
      this.extractors.set(format, extractor);
    }
  }

  getExtractor(format: DocumentFormat): DocumentExtractor {
    const extractor = this.extractors.get(format);
    if (!extractor) {
      throw new Error(`No extractor registered for document format '${format}'.`);
    }
    return extractor;
  }

  async extract(
    content: string | Uint8Array,
    filename: string,
    format: DocumentFormat
  ): Promise<ExtractionResult> {
    const extractor = this.getExtractor(format);
    return await extractor.extract(content, filename);
  }
}

export const extractorRegistry = new ExtractorRegistry();
