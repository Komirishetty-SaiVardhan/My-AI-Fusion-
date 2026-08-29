import { DocumentExtractor, ExtractionResult } from "./types";
import { DocumentPage, DocumentSection } from "../types";

export class DOCXExtractor implements DocumentExtractor {
  readonly supportedFormats = ["docx" as const];

  async extract(content: string | Uint8Array, filename: string): Promise<ExtractionResult> {
    const rawString = typeof content === "string" ? content : new TextDecoder("utf-8", { fatal: false }).decode(content);

    // Strip Word XML tags if raw XML, or extract clean text lines
    const cleanText = this.cleanDocxContent(rawString);

    const sections: DocumentSection[] = [];
    const lines = cleanText.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 0);

    let currentTitle = "Introduction";
    let currentBody: string[] = [];
    let sectionIdx = 1;

    for (const line of lines) {
      const isHeading =
        (line.length < 70 && /^(Chapter|Section|\d+\.|\b[A-Z\s]{4,}\b)/i.test(line)) ||
        line.startsWith("#");

      if (isHeading) {
        if (currentBody.length > 0) {
          sections.push({
            index: sectionIdx++,
            title: currentTitle,
            pageNumber: Math.ceil(sectionIdx / 3),
            content: currentBody.join(" "),
          });
          currentBody = [];
        }
        currentTitle = line.replace(/^#+\s*/, "").trim();
      } else {
        currentBody.push(line);
      }
    }

    if (currentBody.length > 0) {
      sections.push({
        index: sectionIdx,
        title: currentTitle,
        pageNumber: Math.ceil(sectionIdx / 3),
        content: currentBody.join(" "),
      });
    }

    const pages: DocumentPage[] = [
      {
        pageNumber: 1,
        content: cleanText,
        sections,
      },
    ];

    const title = filename.replace(/\.docx?$/i, "").replace(/[-_]/g, " ");

    return {
      title,
      format: "docx",
      pageCount: Math.max(1, Math.ceil(cleanText.length / 2500)),
      pages,
      sections,
      totalCharacters: cleanText.length,
      rawText: cleanText,
    };
  }

  private cleanDocxContent(text: string): string {
    return text
      .replace(/<w:p[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .replace(/\n\s+/g, "\n")
      .trim();
  }
}

export const docxExtractor = new DOCXExtractor();
