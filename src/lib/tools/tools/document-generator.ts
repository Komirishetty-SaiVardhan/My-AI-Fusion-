import { ITool, ToolCallContext, ToolInputSchema, ToolPermission } from "../types";

export interface DocumentGeneratorInput {
  title: string;
  documentType: "report" | "proposal" | "invoice" | "resume" | "contract" | "documentation" | "whitepaper" | "article";
  summary?: string;
  sections: Array<{
    heading: string;
    content: string;
    subsections?: Array<{ title: string; content: string }>;
  }>;
  author?: string;
  date?: string;
  metadata?: Record<string, string>;
}

export interface DocumentGeneratorOutput {
  title: string;
  documentType: string;
  formattedMarkdown: string;
  wordCount: number;
  author: string;
  date: string;
  isPrintReady: boolean;
}

export class DocumentGeneratorTool implements ITool<DocumentGeneratorInput, DocumentGeneratorOutput> {
  readonly name = "document_generator";
  readonly description =
    "Prepares and formats comprehensive, publication-ready documents, PDF reports, proposals, invoices, contracts, and technical whitepapers with structured layouts.";

  readonly inputSchema: ToolInputSchema = {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Document main title.",
        required: true,
      },
      documentType: {
        type: "string",
        description: "Type of document: 'report', 'proposal', 'invoice', 'resume', 'contract', 'documentation', 'whitepaper', or 'article'.",
        required: true,
      },
      summary: {
        type: "string",
        description: "Executive summary or abstract of the document.",
        required: false,
      },
      sections: {
        type: "array",
        description: "Array of document sections with headings and contents.",
        required: true,
      },
      author: {
        type: "string",
        description: "Author name (defaults to 'Komirishetty Sai Vardhan').",
        required: false,
      },
      date: {
        type: "string",
        description: "Publication date.",
        required: false,
      },
    },
    required: ["title", "documentType", "sections"],
  };

  readonly permissions: ToolPermission = {
    level: "computation",
    requiresUserApproval: false,
    dangerous: false,
  };

  isEnabled = true;

  validate(input: unknown): { isValid: boolean; error?: string; parsed?: DocumentGeneratorInput } {
    if (!input || typeof input !== "object") {
      return { isValid: false, error: "Input must be a valid JSON object." };
    }

    const { title, documentType, summary, sections, author, date, metadata } = input as Record<
      string,
      unknown
    >;

    if (typeof title !== "string" || title.trim().length === 0) {
      return { isValid: false, error: "Document 'title' is required and must be a non-empty string." };
    }

    if (!Array.isArray(sections) || sections.length === 0) {
      return { isValid: false, error: "Document must contain at least one section in 'sections' array." };
    }

    return {
      isValid: true,
      parsed: {
        title: title.trim(),
        documentType: (documentType as DocumentGeneratorInput["documentType"]) || "report",
        summary: typeof summary === "string" ? summary.trim() : undefined,
        sections: sections as DocumentGeneratorInput["sections"],
        author: typeof author === "string" ? author.trim() : "Komirishetty Sai Vardhan",
        date: typeof date === "string" ? date.trim() : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        metadata: typeof metadata === "object" && metadata !== null ? (metadata as Record<string, string>) : undefined,
      },
    };
  }

  async execute(
    input: DocumentGeneratorInput,
    _context: ToolCallContext
  ): Promise<DocumentGeneratorOutput> {
    const author = input.author || "Komirishetty Sai Vardhan";
    const date = input.date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const lines: string[] = [];

    // Header metadata block
    lines.push(`# ${input.title}`);
    lines.push(`**Document Type:** ${input.documentType.toUpperCase()} | **Prepared By:** ${author} | **Date:** ${date}`);
    lines.push("");

    if (input.metadata && Object.keys(input.metadata).length > 0) {
      lines.push("| Metadata | Details |");
      lines.push("| :--- | :--- |");
      for (const [key, val] of Object.entries(input.metadata)) {
        lines.push(`| **${key}** | ${val} |`);
      }
      lines.push("");
    }

    // Summary block
    if (input.summary) {
      lines.push("## Executive Summary");
      lines.push(input.summary);
      lines.push("");
    }

    // Sections
    for (const section of input.sections) {
      lines.push(`## ${section.heading}`);
      lines.push(section.content);
      lines.push("");

      if (section.subsections && section.subsections.length > 0) {
        for (const sub of section.subsections) {
          lines.push(`### ${sub.title}`);
          lines.push(sub.content);
          lines.push("");
        }
      }
    }

    // Document Footer
    lines.push("---");
    lines.push(`*Generated by My AI — Developed by ${author}. Ready for PDF Export.*`);

    const formattedMarkdown = lines.join("\n");
    const wordCount = formattedMarkdown.split(/\s+/).filter(Boolean).length;

    return {
      title: input.title,
      documentType: input.documentType,
      formattedMarkdown,
      wordCount,
      author,
      date,
      isPrintReady: true,
    };
  }
}

export const documentGeneratorTool = new DocumentGeneratorTool();
