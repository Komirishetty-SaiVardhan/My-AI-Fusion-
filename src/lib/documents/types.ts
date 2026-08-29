export type DocumentFormat = "pdf" | "txt" | "docx" | "md";

export type DocumentStatus = "pending" | "processing" | "indexed" | "error";

export interface UploadedFile {
  id: string;
  originalFilename: string;
  sanitizedFilename: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  uploadedAt: string;
  storageKey: string;
}

export interface DocumentSection {
  index: number;
  title: string;
  pageNumber?: number;
  content: string;
}

export interface DocumentPage {
  pageNumber: number;
  content: string;
  sections?: DocumentSection[];
}

export interface Document {
  id: string;
  fileId: string;
  title: string;
  format: DocumentFormat;
  pageCount: number;
  sectionCount: number;
  chunkCount: number;
  totalTokens: number;
  status: DocumentStatus;
  errorMessage?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  fileId: string;
  chunkIndex: number;
  pageNumber?: number;
  sectionTitle?: string;
  content: string;
  tokenCount: number;
  embeddingId?: string;
  metadata?: Record<string, unknown>;
}

export interface EmbeddingVector {
  id: string;
  chunkId: string;
  documentId: string;
  vector: number[];
  dimensions: number;
  model: string;
}

export interface RetrievalQuery {
  query: string;
  documentIds?: string[]; // Isolation filter
  topK?: number;
  minScore?: number;
}

export interface RetrievedChunk {
  chunk: DocumentChunk;
  similarityScore: number;
  documentTitle: string;
}

export interface DocumentCitation {
  documentId: string;
  documentTitle: string;
  pageNumber?: number;
  sectionTitle?: string;
  chunkId: string;
  snippet: string;
  similarityScore: number;
}

export interface DocumentAnswer {
  question: string;
  answer: string;
  citations: DocumentCitation[];
  retrievedChunksCount: number;
  durationMs: number;
}
