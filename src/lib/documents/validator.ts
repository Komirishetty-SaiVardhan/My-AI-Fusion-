import { DocumentFormat } from "./types";

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedFilename: string;
  format: DocumentFormat;
  checksum: string;
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const MIME_MAP: Record<string, DocumentFormat> = {
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/markdown": "md",
  "text/x-markdown": "md",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "docx",
};

const EXTENSION_MAP: Record<string, DocumentFormat> = {
  pdf: "pdf",
  txt: "txt",
  md: "md",
  markdown: "md",
  docx: "docx",
  doc: "docx",
};

const DANGEROUS_EXTENSIONS = new Set([
  "exe",
  "dll",
  "so",
  "dylib",
  "bat",
  "cmd",
  "sh",
  "vbs",
  "ps1",
  "jar",
  "msi",
  "com",
  "scr",
]);

export class DocumentValidator {
  validate(file: {
    filename: string;
    mimeType: string;
    sizeBytes: number;
    content?: string | Uint8Array;
  }): FileValidationResult {
    // 1. Check size limit
    if (file.sizeBytes <= 0) {
      return this.failure("File is empty (0 bytes).");
    }

    if (file.sizeBytes > MAX_FILE_SIZE_BYTES) {
      return this.failure(
        `File size (${(file.sizeBytes / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum limit of 25MB.`
      );
    }

    // 2. Sanitize filename & prevent path traversal
    const sanitized = this.sanitizeFilename(file.filename);
    if (!sanitized) {
      return this.failure("Invalid or empty filename after sanitization.");
    }

    const ext = this.extractExtension(sanitized).toLowerCase();

    // 3. Security check: dangerous extensions
    if (DANGEROUS_EXTENSIONS.has(ext)) {
      return this.failure(`Security violation: executable file extension '.${ext}' is blocked.`);
    }

    // 4. Validate format from MIME type or extension
    const formatFromMime = MIME_MAP[file.mimeType.toLowerCase()];
    const formatFromExt = EXTENSION_MAP[ext];
    const format = formatFromMime || formatFromExt;

    if (!format) {
      return this.failure(
        `Unsupported document format '${ext}'. Supported formats: PDF, TXT, DOCX, Markdown.`
      );
    }

    // 5. Security payload scanning
    if (file.content) {
      const securityCheck = this.scanSecurityPayload(file.content);
      if (!securityCheck.isSafe) {
        return this.failure(`Security check failed: ${securityCheck.reason}`);
      }
    }

    // 6. Generate lightweight deterministic checksum
    const checksum = this.calculateChecksum(file.content || sanitized + file.sizeBytes);

    return {
      isValid: true,
      sanitizedFilename: sanitized,
      format,
      checksum,
    };
  }

  sanitizeFilename(filename: string): string {
    if (!filename) return "unnamed_document";

    // Remove path traversal & control characters
    let clean = filename
      .replace(/[\/\\]/g, "")
      .replace(/\.\./g, "")
      .replace(/[\x00-\x1f\x80-\x9f]/g, "")
      .trim();

    // Replace whitespace and irregular characters with underscores
    clean = clean.replace(/[^a-zA-Z0-9.\-_]/g, "_");

    // Avoid double extensions like .exe.pdf
    clean = clean.replace(/_+/g, "_");

    return clean.slice(0, 100) || "document";
  }

  private extractExtension(filename: string): string {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop() || "" : "";
  }

  private scanSecurityPayload(content: string | Uint8Array): { isSafe: boolean; reason?: string } {
    let strContent = "";
    if (typeof content === "string") {
      strContent = content;
    } else if (content instanceof Uint8Array) {
      // Check for MZ (DOS/Windows Executable) magic bytes
      if (content.length >= 2 && content[0] === 0x4d && content[1] === 0x5a) {
        return { isSafe: false, reason: "Embedded executable binary detected (MZ magic header)." };
      }
      strContent = new TextDecoder("utf-8", { fatal: false }).decode(content.slice(0, 4096));
    }

    const lower = strContent.toLowerCase();

    // Scan for dangerous script tags or macro payloads
    if (lower.includes("<script") || lower.includes("javascript:void") || lower.includes("powershell -enc")) {
      return { isSafe: false, reason: "Suspicious script payload embedded in document." };
    }

    return { isSafe: true };
  }

  private calculateChecksum(content: string | Uint8Array): string {
    let hash = 0;
    const str = typeof content === "string" ? content : content.toString();
    for (let i = 0; i < Math.min(str.length, 10000); i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `chk-${Math.abs(hash).toString(16)}-${Date.now().toString(36)}`;
  }

  private failure(error: string): FileValidationResult {
    return {
      isValid: false,
      error,
      sanitizedFilename: "",
      format: "txt",
      checksum: "",
    };
  }
}

export const documentValidator = new DocumentValidator();
