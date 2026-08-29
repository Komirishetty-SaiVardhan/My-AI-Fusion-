import { DocumentExtractor, ExtractionResult } from "./types";
import { DocumentFormat, DocumentPage, DocumentSection } from "../types";

export class TextExtractor implements DocumentExtractor {
  readonly supportedFormats: DocumentFormat[] = ["txt", "md"];

  async extract(content: string | Uint8Array, filename: string): Promise<ExtractionResult> {
    const rawString = typeof content === "string" ? content : new TextDecoder("utf-8", { fatal: false }).decode(content);

    const isMarkdown = filename.endsWith(".md") || filename.endsWith(".markdown") || rawString.includes("# ");
    const format: DocumentFormat = isMarkdown ? "md" : "txt";

    const sections: DocumentSection[] = [];
    const lines = rawString.split(/\r?\n/);

    let currentTitle = isMarkdown ? "Preamble" : "Overview";
    let currentLines: string[] = [];
    let sectionIdx = 1;

    for (const line of lines) {
      const isHeader = isMarkdown ? /^#{1,4}\s+(.+)$/.test(line.trim()) : false;

      if (isHeader) {
        if (currentLines.length > 0) {
          sections.push({
            index: sectionIdx++,
            title: currentTitle,
            pageNumber: 1,
            content: currentLines.join("\n").trim(),
          });
          currentLines = [];
        }
        const match = line.trim().match(/^#{1,4}\s+(.+)$/);
        currentTitle = match ? match[1].trim() : "Section";
      } else {
        currentLines.push(line);
      }
    }

    if (currentLines.length > 0) {
      sections.push({
        index: sectionIdx,
        title: currentTitle,
        pageNumber: 1,
        content: currentLines.join("\n").trim(),
      });
    }

    const title = this.extractTitle(filename, rawString, isMarkdown);
    const pages: DocumentPage[] = [
      {
        pageNumber: 1,
        content: rawString.trim(),
        sections,
      },
    ];

    return {
      title,
      format,
      pageCount: 1,
      pages,
      sections,
      totalCharacters: rawString.length,
      rawText: rawString.trim(),
    };
  }

  private extractTitle(filename: string, text: string, isMarkdown: boolean): string {
    if (isMarkdown) {
      const h1Match = text.match(/^#\s+(.+)$/m);
      if (h1Match) return h1Match[1].trim();
    }
    return filename.replace(/\.(txt|md|markdown)$/i, "").replace(/[-_]/g, " ");
  }
}

export const textExtractor = new TextExtractor();
