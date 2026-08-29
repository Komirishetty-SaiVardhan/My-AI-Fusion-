import { ITool, ToolCallContext, ToolInputSchema, ToolPermission } from "../types";
import { documentVectorStore } from "../../documents/vector-store";
import { documentEmbedder } from "../../documents/embedder";

export interface FileSearchInput {
  query: string;
  documentId?: string;
  topK?: number;
}

export interface FileSearchResultItem {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  text: string;
  score: number;
  pageNumber?: number;
  sectionTitle?: string;
}

export interface FileSearchOutput {
  query: string;
  totalMatches: number;
  results: FileSearchResultItem[];
}

export class FileSearchTool implements ITool<FileSearchInput, FileSearchOutput> {
  readonly name = "file_search";
  readonly description =
    "Search across indexed files, documents, and codebases using semantic vector retrieval.";
  readonly inputSchema: ToolInputSchema = {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query or keyword to find within documents",
        required: true,
      },
      documentId: {
        type: "string",
        description: "Optional specific document ID to restrict search to",
      },
      topK: {
        type: "number",
        description: "Maximum number of document chunks to return (default: 3)",
      },
    },
    required: ["query"],
  };

  readonly permissions: ToolPermission = {
    level: "read_only",
    requiresUserApproval: false,
    dangerous: false,
  };

  isEnabled = true;

  validate(input: unknown): { isValid: boolean; error?: string; parsed?: FileSearchInput } {
    if (!input || typeof input !== "object") {
      return { isValid: false, error: "Input must be an object containing a 'query' string." };
    }

    const obj = input as Record<string, unknown>;
    if (typeof obj.query !== "string" || !obj.query.trim()) {
      return { isValid: false, error: "Field 'query' is required and must be a non-empty string." };
    }

    const topK = typeof obj.topK === "number" ? Math.min(10, Math.max(1, obj.topK)) : 3;

    return {
      isValid: true,
      parsed: {
        query: obj.query.trim(),
        documentId: typeof obj.documentId === "string" ? obj.documentId.trim() : undefined,
        topK,
      },
    };
  }

  async execute(input: FileSearchInput, _context: ToolCallContext): Promise<FileSearchOutput> {
    void _context;
    const queryVector = await documentEmbedder.embedQuery(input.query);

    const matches = await documentVectorStore.search(queryVector, {
      query: input.query,
      topK: input.topK || 3,
      documentIds: input.documentId ? [input.documentId] : undefined,
      minScore: 0.1,
    });

    const results: FileSearchResultItem[] = matches.map((m) => ({
      chunkId: m.chunk.id,
      documentId: m.chunk.documentId,
      documentTitle: m.documentTitle,
      text: m.chunk.content,
      score: m.similarityScore,
      pageNumber: m.chunk.pageNumber,
      sectionTitle: m.chunk.sectionTitle,
    }));

    return {
      query: input.query,
      totalMatches: results.length,
      results,
    };
  }
}

export const fileSearchTool = new FileSearchTool();
