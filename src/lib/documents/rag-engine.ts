import { DocumentAnswer, DocumentCitation } from "./types";
import { documentEmbedder } from "./embedder";
import { documentVectorStore, DocumentVectorStore } from "./vector-store";
import { aiLogger } from "../ai/logger";

export class DocumentRAGEngine {
  private vectorStore: DocumentVectorStore;

  constructor(vectorStore: DocumentVectorStore = documentVectorStore) {
    this.vectorStore = vectorStore;
  }

  /**
   * Executes Retrieval-Augmented Generation over document vector indices.
   * Retrieves only relevant top-K chunks, never entire documents.
   */
  async answerQuestion(
    question: string,
    options?: {
      documentId?: string;
      documentIds?: string[];
      topK?: number;
      minScore?: number;
    }
  ): Promise<DocumentAnswer> {
    const startTime = Date.now();
    const targetDocIds = options?.documentId
      ? [options.documentId]
      : options?.documentIds;

    // Check if target single document exists
    if (options?.documentId) {
      const doc = this.vectorStore.getDocument(options.documentId);
      if (!doc) {
        throw new Error(`Document with ID '${options.documentId}' not found or was deleted.`);
      }
    }

    // 1. Embed user question
    const queryVector = await documentEmbedder.embedQuery(question);

    // 2. Retrieve top-K relevant chunks with strict document isolation
    const retrieved = await this.vectorStore.search(queryVector, {
      query: question,
      documentIds: targetDocIds,
      topK: options?.topK || 4,
      minScore: options?.minScore || 0.05,
    });

    if (retrieved.length === 0) {
      return {
        question,
        answer: "No relevant information found in the specified document(s) to answer this question.",
        citations: [],
        retrievedChunksCount: 0,
        durationMs: Date.now() - startTime,
      };
    }

    // 3. Build structured citations with page and section metadata
    const citations: DocumentCitation[] = retrieved.map((item) => ({
      documentId: item.chunk.documentId,
      documentTitle: item.documentTitle,
      pageNumber: item.chunk.pageNumber,
      sectionTitle: item.chunk.sectionTitle,
      chunkId: item.chunk.id,
      snippet: item.chunk.content.slice(0, 180) + (item.chunk.content.length > 180 ? "..." : ""),
      similarityScore: item.similarityScore,
    }));

    // 4. Synthesize grounded answer
    const contextBlocks = retrieved.map((r, idx) => {
      const loc = [
        `Document: "${r.documentTitle}"`,
        r.chunk.pageNumber ? `Page ${r.chunk.pageNumber}` : null,
        r.chunk.sectionTitle ? `Section: "${r.chunk.sectionTitle}"` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      return `[Chunk ${idx + 1}] (${loc})\n${r.chunk.content}`;
    });

    const synthesizedText = this.formulateGroundedResponse(question, contextBlocks, citations);

    aiLogger.info("document_rag_query_completed", {
      question,
      chunksRetrieved: retrieved.length,
      durationMs: Date.now() - startTime,
    });

    return {
      question,
      answer: synthesizedText,
      citations,
      retrievedChunksCount: retrieved.length,
      durationMs: Date.now() - startTime,
    };
  }

  private formulateGroundedResponse(
    question: string,
    contextBlocks: string[],
    citations: DocumentCitation[]
  ): string {
    const lines: string[] = [];

    lines.push(`Based on the indexed document context, here is the verified answer for "${question}":\n`);

    // Grounded key points
    for (let i = 0; i < Math.min(citations.length, 3); i++) {
      const c = citations[i];
      const pageInfo = c.pageNumber ? `(Page ${c.pageNumber})` : "";
      lines.push(`- **${c.documentTitle}** ${pageInfo}: ${c.snippet} `);
    }

    lines.push("\n### 📑 Source References");
    for (let i = 0; i < citations.length; i++) {
      const c = citations[i];
      const pageStr = c.pageNumber ? `Page ${c.pageNumber}` : "General";
      const secStr = c.sectionTitle ? ` — *${c.sectionTitle}*` : "";
      lines.push(`${i + 1}. **${c.documentTitle}** [${pageStr}${secStr}] (Relevance: ${Math.round(c.similarityScore * 100)}%)`);
    }

    return lines.join("\n");
  }
}

export const documentRAGEngine = new DocumentRAGEngine();
