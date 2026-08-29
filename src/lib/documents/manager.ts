import { Document, DocumentAnswer, DocumentChunk, EmbeddingVector, UploadedFile } from "./types";
import { documentValidator, DocumentValidator } from "./validator";
import { extractorRegistry, ExtractorRegistry } from "./extractors";
import { semanticChunker, SemanticDocumentChunker } from "./chunker";
import { documentEmbedder, DocumentEmbedder } from "./embedder";
import { documentVectorStore, DocumentVectorStore } from "./vector-store";
import { DocumentRAGEngine } from "./rag-engine";
import { aiLogger } from "../ai/logger";

export class DocumentManager {
  private validator: DocumentValidator;
  private extractorRegistry: ExtractorRegistry;
  private chunker: SemanticDocumentChunker;
  private embedder: DocumentEmbedder;
  private vectorStore: DocumentVectorStore;
  private ragEngine: DocumentRAGEngine;
  private files: Map<string, UploadedFile> = new Map();

  constructor(options?: {
    validator?: DocumentValidator;
    extractorRegistry?: ExtractorRegistry;
    chunker?: SemanticDocumentChunker;
    embedder?: DocumentEmbedder;
    vectorStore?: DocumentVectorStore;
    ragEngine?: DocumentRAGEngine;
  }) {
    this.validator = options?.validator || documentValidator;
    this.extractorRegistry = options?.extractorRegistry || extractorRegistry;
    this.chunker = options?.chunker || semanticChunker;
    this.embedder = options?.embedder || documentEmbedder;
    this.vectorStore = options?.vectorStore || documentVectorStore;
    this.ragEngine = options?.ragEngine || new DocumentRAGEngine(this.vectorStore);
  }

  /**
   * Uploads, validates, extracts, chunks, embeds, and indexes a document.
   */
  async uploadAndProcess(upload: {
    filename: string;
    mimeType: string;
    sizeBytes: number;
    content: string | Uint8Array;
    title?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ document: Document; chunks: DocumentChunk[]; file: UploadedFile }> {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const documentId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Validate Upload
    const validation = this.validator.validate({
      filename: upload.filename,
      mimeType: upload.mimeType,
      sizeBytes: upload.sizeBytes,
      content: upload.content,
    });

    if (!validation.isValid) {
      throw new Error(`Document validation failed: ${validation.error}`);
    }

    const uploadedFile: UploadedFile = {
      id: fileId,
      originalFilename: upload.filename,
      sanitizedFilename: validation.sanitizedFilename,
      mimeType: upload.mimeType,
      sizeBytes: upload.sizeBytes,
      checksum: validation.checksum,
      uploadedAt: new Date().toISOString(),
      storageKey: `uploads/${fileId}/${validation.sanitizedFilename}`,
    };

    this.files.set(fileId, uploadedFile);

    // 2. Extract Document Content
    const extraction = await this.extractorRegistry.extract(
      upload.content,
      validation.sanitizedFilename,
      validation.format
    );

    // 3. Chunk Document
    const chunks = this.chunker.chunkDocument(extraction, documentId, fileId);

    // 4. Generate Embedding Vectors
    const vectors: EmbeddingVector[] = await this.embedder.embedChunks(chunks);

    // 5. Store & Index in Isolated Vector Store
    const document: Document = {
      id: documentId,
      fileId,
      title: upload.title || extraction.title,
      format: validation.format,
      pageCount: extraction.pageCount,
      sectionCount: extraction.sections.length,
      chunkCount: chunks.length,
      totalTokens: chunks.reduce((sum, c) => sum + c.tokenCount, 0),
      status: "indexed",
      metadata: { ...upload.metadata, originalFilename: upload.filename },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.vectorStore.storeDocument(document, chunks, vectors);

    aiLogger.info("document_indexed_successfully", {
      documentId,
      title: document.title,
      chunks: chunks.length,
      format: document.format,
    });

    return { document, chunks, file: uploadedFile };
  }

  /**
   * Performs retrieval-augmented Q&A over indexed documents.
   */
  async askDocument(
    question: string,
    options?: { documentId?: string; documentIds?: string[]; topK?: number }
  ): Promise<DocumentAnswer> {
    return await this.ragEngine.answerQuestion(question, options);
  }

  /**
   * Deletes a document, cleanly purging its file metadata, chunks, and vector index.
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    const doc = this.vectorStore.getDocument(documentId);
    if (!doc) return false;

    // Purge uploaded file record
    this.files.delete(doc.fileId);

    // Purge vector store
    const deleted = await this.vectorStore.deleteDocument(documentId);

    aiLogger.info("document_deleted_cleanly", { documentId });
    return deleted;
  }

  getDocument(documentId: string): Document | undefined {
    return this.vectorStore.getDocument(documentId);
  }

  listDocuments(): Document[] {
    return this.vectorStore.listDocuments();
  }

  getFile(fileId: string): UploadedFile | undefined {
    return this.files.get(fileId);
  }
}

export const documentManager = new DocumentManager();
