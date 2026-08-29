import { ImageValidationResult, VisionImage } from "./types";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export class ImageValidator {
  /**
   * Validates image size, MIME type, format headers, and security safety.
   */
  validate(input: {
    filename: string;
    mimeType: string;
    sizeBytes: number;
    buffer?: Uint8Array;
    base64?: string;
  }): ImageValidationResult {
    // 1. Check size limit
    if (input.sizeBytes <= 0) {
      return this.failure("Image is empty (0 bytes).", input.mimeType, input.sizeBytes);
    }

    if (input.sizeBytes > MAX_IMAGE_SIZE_BYTES) {
      return this.failure(
        `Image size (${(input.sizeBytes / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum limit of 10MB.`,
        input.mimeType,
        input.sizeBytes
      );
    }

    // 2. Validate MIME type & extension
    const cleanMime = input.mimeType.toLowerCase();
    const ext = this.extractExtension(input.filename).toLowerCase();

    const isMimeValid = ALLOWED_MIME_TYPES.has(cleanMime);
    const isExtValid = ALLOWED_EXTENSIONS.has(ext);

    if (!isMimeValid && !isExtValid) {
      return this.failure(
        `Unsupported image format '${cleanMime || ext}'. Supported formats: JPEG, PNG, WebP, GIF.`,
        cleanMime,
        input.sizeBytes
      );
    }

    // 3. Magic Header Verification if binary buffer is provided
    if (input.buffer && input.buffer.length >= 4) {
      const headerValid = this.verifyMagicBytes(input.buffer, cleanMime || ext);
      if (!headerValid) {
        return this.failure(
          "Image corrupted or header mismatch: file bytes do not match declared image format.",
          cleanMime,
          input.sizeBytes
        );
      }
    }

    return {
      isValid: true,
      mimeType: cleanMime || `image/${ext === "jpg" ? "jpeg" : ext}`,
      sizeBytes: input.sizeBytes,
      isSafe: true,
    };
  }

  /**
   * Creates an ephemeral VisionImage entity stored in memory only.
   */
  createEphemeralImage(
    filename: string,
    mimeType: string,
    base64: string,
    sizeBytes: number
  ): VisionImage {
    return {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      filename,
      mimeType,
      sizeBytes,
      base64,
      previewUrl: base64.startsWith("data:") ? base64 : `data:${mimeType};base64,${base64}`,
    };
  }

  private extractExtension(filename: string): string {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop() || "" : "";
  }

  private verifyMagicBytes(buffer: Uint8Array, type: string): boolean {
    const b = buffer;
    // JPEG: FF D8 FF
    if (type.includes("jpeg") || type.includes("jpg")) {
      return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    }
    // PNG: 89 50 4E 47 (‰PNG)
    if (type.includes("png")) {
      return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
    }
    // GIF: 47 49 46 (GIF)
    if (type.includes("gif")) {
      return b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46;
    }
    // WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
    if (type.includes("webp")) {
      return b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46;
    }
    return true;
  }

  private failure(error: string, mimeType: string, sizeBytes: number): ImageValidationResult {
    return {
      isValid: false,
      error,
      mimeType,
      sizeBytes,
      isSafe: false,
    };
  }
}

export const imageValidator = new ImageValidator();
