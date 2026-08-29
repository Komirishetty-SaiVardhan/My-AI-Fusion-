import { DocumentFormat, DocumentPage, DocumentSection } from "../types";

export interface ExtractionResult {
  title: string;
  format: DocumentFormat;
  pageCount: number;
  pages: DocumentPage[];
  sections: DocumentSection[];
  totalCharacters: number;
  rawText: string;
}

export interface DocumentExtractor {
  readonly supportedFormats: DocumentFormat[];
  extract(content: string | Uint8Array, filename: string): Promise<ExtractionResult>;
}
