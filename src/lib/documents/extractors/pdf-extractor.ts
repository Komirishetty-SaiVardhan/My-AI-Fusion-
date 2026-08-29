import { DocumentExtractor, ExtractionResult } from "./types";
import { DocumentPage, DocumentSection } from "../types";

export class PDFExtractor implements DocumentExtractor {
  readonly supportedFormats = ["pdf" as const];

  async extract(content: string | Uint8Array, filename: string): Promise<ExtractionResult> {
    const rawString = typeof content === "string" ? content : new TextDecoder("utf-8", { fatal: false }).decode(content);

    const pages: DocumentPage[] = [];
    const sections: DocumentSection[] = [];

    // Split pages by standard form feeds (\f) or synthetic page delimiters
    let rawPages: string[];
    if (rawString.includes("--- Page ") || rawString.includes("=== Page ")) {
      rawPages = rawString.split(/(?:---|===)\s*Page\s*\d+\s*(?:---|===)/i).filter((p) => p.trim().length > 0);
    } else if (rawString.includes("\f")) {
      rawPages = rawString.split("\f").filter((p) => p.trim().length > 0);
    } else {
      // If no page marker, chunk by paragraph size ~2000 chars per page
      rawPages = this.splitIntoSyntheticPages(rawString, 2000);
    }

    if (rawPages.length === 0) {
      rawPages = [rawString];
    }

    let sectionIndex = 1;
    let fullText = "";

    rawPages.forEach((pageContent, idx) => {
      const pageNumber = idx + 1;
      const cleanPageText = this.cleanPdfText(pageContent);
      fullText += cleanPageText + "\n\n";

      // Detect sub-sections within page
      const pageSections = this.extractPageSections(cleanPageText, pageNumber, sectionIndex);
      sectionIndex += pageSections.length;
      sections.push(...pageSections);

      pages.push({
        pageNumber,
        content: cleanPageText,
        sections: pageSections,
      });
    });

    const title = this.inferTitle(filename, fullText);

    return {
      title,
      format: "pdf",
      pageCount: pages.length,
      pages,
      sections,
      totalCharacters: fullText.length,
      rawText: fullText.trim(),
    };
  }

  private cleanPdfText(text: string): string {
    return text
      .replace(/stream[\s\S]*?endstream/gi, "")
      .replace(/obj[\s\S]*?endobj/gi, "")
      .replace(/<<[\s\S]*?>>/gi, "")
      .replace(/xref[\s\S]*?trailer/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private splitIntoSyntheticPages(text: string, pageSize: number): string[] {
    const pages: string[] = [];
    let cur = 0;
    while (cur < text.length) {
      pages.push(text.slice(cur, cur + pageSize));
      cur += pageSize;
    }
    return pages;
  }

  private extractPageSections(pageText: string, pageNumber: number, startIndex: number): DocumentSection[] {
    const lines = pageText.split(/(?<=[.\n])\s+/).filter((l) => l.trim().length > 0);
    const sections: DocumentSection[] = [];

    let currentSectionTitle = `Page ${pageNumber} Section`;
    let currentContent: string[] = [];
    let idx = startIndex;

    for (const line of lines) {
      // Check if line looks like a section header (short, title cased or capitalized)
      if (line.length < 60 && /^[A-Z0-9\s:_-]+$/.test(line.trim()) && line.trim().length > 3) {
        if (currentContent.length > 0) {
          sections.push({
            index: idx++,
            title: currentSectionTitle,
            pageNumber,
            content: currentContent.join(" "),
          });
          currentContent = [];
        }
        currentSectionTitle = line.trim();
      } else {
        currentContent.push(line);
      }
    }

    if (currentContent.length > 0) {
      sections.push({
        index: idx,
        title: currentSectionTitle,
        pageNumber,
        content: currentContent.join(" "),
      });
    }

    return sections;
  }

  private inferTitle(filename: string, text: string): string {
    const firstLine = text.split("\n")[0]?.trim();
    if (firstLine && firstLine.length > 5 && firstLine.length < 80) {
      return firstLine;
    }
    return filename.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
  }
}

export const pdfExtractor = new PDFExtractor();
