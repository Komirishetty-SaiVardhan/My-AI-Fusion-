import { DocumentChunk } from "./types";
import { ExtractionResult } from "./extractors/types";

export interface ChunkerOptions {
  maxChunkSize?: number; // Target characters per chunk (default 600)
  chunkOverlap?: number; // Overlap characters (default 80)
}

export class SemanticDocumentChunker {
  chunkDocument(
    extraction: ExtractionResult,
    documentId: string,
    fileId: string,
    options?: ChunkerOptions
  ): DocumentChunk[] {
    const maxChunkSize = options?.maxChunkSize || 600;
    const chunkOverlap = options?.chunkOverlap || 80;

    const chunks: DocumentChunk[] = [];
    let chunkIndex = 1;

    // Strategy 1: If document has multiple structured sections, chunk per section
    if (extraction.sections && extraction.sections.length > 1) {
      for (const section of extraction.sections) {
        const sectionChunks = this.chunkText(
          section.content,
          maxChunkSize,
          chunkOverlap,
          section.pageNumber || 1,
          section.title
        );

        for (const rawChunk of sectionChunks) {
          chunks.push({
            id: `${documentId}-chunk-${chunkIndex}`,
            documentId,
            fileId,
            chunkIndex: chunkIndex++,
            pageNumber: section.pageNumber || 1,
            sectionTitle: section.title,
            content: rawChunk.text,
            tokenCount: Math.ceil(rawChunk.text.length / 4),
            metadata: { format: extraction.format, sectionTitle: section.title },
          });
        }
      }
    } else if (extraction.pages.length > 0) {
      // Strategy 2: If document has multiple pages, chunk within each page
      for (const page of extraction.pages) {
        const pageChunks = this.chunkText(
          page.content,
          maxChunkSize,
          chunkOverlap,
          page.pageNumber,
          this.findSectionTitle(page.pageNumber, extraction)
        );

        for (const rawChunk of pageChunks) {
          chunks.push({
            id: `${documentId}-chunk-${chunkIndex}`,
            documentId,
            fileId,
            chunkIndex: chunkIndex++,
            pageNumber: page.pageNumber,
            sectionTitle: rawChunk.sectionTitle,
            content: rawChunk.text,
            tokenCount: Math.ceil(rawChunk.text.length / 4),
            metadata: { format: extraction.format, pageNumber: page.pageNumber },
          });
        }
      }
    } else {
      // Strategy 3: Fallback to full rawText chunking
      const rawChunks = this.chunkText(extraction.rawText, maxChunkSize, chunkOverlap, 1, extraction.title);
      for (const rawChunk of rawChunks) {
        chunks.push({
          id: `${documentId}-chunk-${chunkIndex}`,
          documentId,
          fileId,
          chunkIndex: chunkIndex++,
          pageNumber: 1,
          sectionTitle: rawChunk.sectionTitle,
          content: rawChunk.text,
          tokenCount: Math.ceil(rawChunk.text.length / 4),
          metadata: { format: extraction.format },
        });
      }
    }

    return chunks;
  }

  private chunkText(
    text: string,
    maxSize: number,
    overlap: number,
    pageNumber: number,
    defaultSection: string
  ): Array<{ text: string; sectionTitle: string }> {
    if (!text || text.trim().length === 0) return [];

    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length <= maxSize) {
      return [{ text: clean, sectionTitle: defaultSection }];
    }

    // Split text by sentence boundaries
    const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [clean];
    const chunks: Array<{ text: string; sectionTitle: string }> = [];

    let currentChunk = "";

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxSize) {
        currentChunk += sentence;
      } else {
        if (currentChunk.trim().length > 0) {
          chunks.push({
            text: currentChunk.trim(),
            sectionTitle: defaultSection,
          });

          // Take overlap from end of current chunk
          const words = currentChunk.trim().split(" ");
          const overlapWords = words.slice(-Math.max(1, Math.floor(overlap / 6))).join(" ");
          currentChunk = overlapWords + " " + sentence;
        } else {
          // Single sentence is larger than maxSize: hard split
          chunks.push({ text: sentence.slice(0, maxSize).trim(), sectionTitle: defaultSection });
          currentChunk = sentence.slice(maxSize - overlap);
        }
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        sectionTitle: defaultSection,
      });
    }

    return chunks;
  }

  private findSectionTitle(pageNumber: number, extraction: ExtractionResult): string {
    const sec = extraction.sections.find((s) => s.pageNumber === pageNumber);
    return sec ? sec.title : `Page ${pageNumber}`;
  }
}

export const semanticChunker = new SemanticDocumentChunker();
