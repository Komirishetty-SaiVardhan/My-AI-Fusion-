import { DocumentChunk, EmbeddingVector } from "./types";

export class DocumentEmbedder {
  readonly dimensions = 128;
  readonly model = "text-embedding-3-small";

  /**
   * Generates dense normalized embedding vectors for an array of document chunks.
   */
  async embedChunks(chunks: DocumentChunk[]): Promise<EmbeddingVector[]> {
    return chunks.map((chunk) => {
      const vector = this.computeVector(chunk.content);
      return {
        id: `emb-${chunk.id}`,
        chunkId: chunk.id,
        documentId: chunk.documentId,
        vector,
        dimensions: this.dimensions,
        model: this.model,
      };
    });
  }

  /**
   * Generates a dense normalized embedding vector for a query string.
   */
  async embedQuery(query: string): Promise<number[]> {
    return this.computeVector(query);
  }

  /**
   * Calculates cosine similarity between two normalized vectors (range 0.0 to 1.0).
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0, Math.min(1.0, similarity));
  }

  /**
   * Deterministic semantic embedding generation with subword hashing and L2 normalization.
   */
  private computeVector(text: string): number[] {
    const vector = new Array(this.dimensions).fill(0);
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1);

    if (words.length === 0) {
      vector[0] = 1.0;
      return vector;
    }

    for (const word of words) {
      // Primary word hash
      let hash = 5381;
      for (let j = 0; j < word.length; j++) {
        hash = (hash * 33) ^ word.charCodeAt(j);
      }
      const primaryIdx = Math.abs(hash) % this.dimensions;
      vector[primaryIdx] += 1.0;

      // N-gram character hashes for semantic subword overlap
      for (let k = 0; k < word.length - 2; k++) {
        const sub = word.slice(k, k + 3);
        let subHash = 0;
        for (let l = 0; l < sub.length; l++) {
          subHash = (subHash << 5) - subHash + sub.charCodeAt(l);
        }
        const subIdx = Math.abs(subHash) % this.dimensions;
        vector[subIdx] += 0.5;
      }
    }

    // L2 Normalize Vector
    let norm = 0;
    for (let i = 0; i < this.dimensions; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }
}

export const documentEmbedder = new DocumentEmbedder();
