import { Document, DocumentChunk, EmbeddingVector, RetrievalQuery, RetrievedChunk } from "./types";
import { documentEmbedder } from "./embedder";

export class DocumentVectorStore {
  private documents: Map<string, Document> = new Map();
  private chunks: Map<string, DocumentChunk> = new Map();
  private vectors: Map<string, EmbeddingVector> = new Map();

  async storeDocument(
    document: Document,
    chunks: DocumentChunk[],
    vectors: EmbeddingVector[]
  ): Promise<void> {
    this.documents.set(document.id, { ...document });

    for (const chunk of chunks) {
      this.chunks.set(chunk.id, { ...chunk });
    }

    for (const vector of vectors) {
      this.vectors.set(vector.chunkId, { ...vector });
    }
  }

  /**
   * Retrieves relevant chunks with cosine similarity and strict document isolation.
   */
  async search(queryVector: number[], options: RetrievalQuery): Promise<RetrievedChunk[]> {
    const topK = options.topK || 4;
    const minScore = options.minScore || 0.1;
    const allowedDocIds = options.documentIds ? new Set(options.documentIds) : null;

    const scored: RetrievedChunk[] = [];

    for (const [chunkId, chunk] of this.chunks.entries()) {
      // 1. Strict Document Isolation: reject if chunk doesn't belong to filtered documentIds
      if (allowedDocIds && !allowedDocIds.has(chunk.documentId)) {
        continue;
      }

      const doc = this.documents.get(chunk.documentId);
      if (!doc) continue;

      const vectorEntry = this.vectors.get(chunkId);
      if (!vectorEntry) continue;

      const similarity = documentEmbedder.cosineSimilarity(queryVector, vectorEntry.vector);

      if (similarity >= minScore) {
        scored.push({
          chunk,
          similarityScore: Number(similarity.toFixed(4)),
          documentTitle: doc.title,
        });
      }
    }

    // Sort descending by similarity
    scored.sort((a, b) => b.similarityScore - a.similarityScore);

    return scored.slice(0, topK);
  }

  getDocument(documentId: string): Document | undefined {
    const doc = this.documents.get(documentId);
    return doc ? { ...doc } : undefined;
  }

  listDocuments(): Document[] {
    return Array.from(this.documents.values()).map((d) => ({ ...d }));
  }

  /**
   * Cleanly deletes a document and purges all its chunks and vector embeddings.
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    if (!this.documents.has(documentId)) {
      return false;
    }

    // Delete document record
    this.documents.delete(documentId);

    // Purge all associated chunks and vectors
    const chunkIdsToDelete: string[] = [];
    for (const [chunkId, chunk] of this.chunks.entries()) {
      if (chunk.documentId === documentId) {
        chunkIdsToDelete.push(chunkId);
      }
    }

    for (const chunkId of chunkIdsToDelete) {
      this.chunks.delete(chunkId);
      this.vectors.delete(chunkId);
    }

    return true;
  }

  clear(): void {
    this.documents.clear();
    this.chunks.clear();
    this.vectors.clear();
  }

  getStats(): { documentCount: number; chunkCount: number; vectorCount: number } {
    return {
      documentCount: this.documents.size,
      chunkCount: this.chunks.size,
      vectorCount: this.vectors.size,
    };
  }
}

export const documentVectorStore = new DocumentVectorStore();
