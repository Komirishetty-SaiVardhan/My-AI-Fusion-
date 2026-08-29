import { AIMessage } from "../ai/types";

export type VisionCategory =
  | "screenshot"
  | "photograph"
  | "diagram"
  | "chart"
  | "handwriting"
  | "scanned_document"
  | "general";

export interface VisionImage {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  base64?: string;
  previewUrl?: string;
  width?: number;
  height?: number;
}

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  mimeType: string;
  sizeBytes: number;
  isSafe: boolean;
}

export interface VisionAnalysisRequest {
  image: VisionImage;
  prompt?: string;
  category?: VisionCategory;
  messages?: AIMessage[];
  detailLevel?: "low" | "high" | "auto";
}

export interface VisionStructuredData {
  category: VisionCategory;
  description: string;
  detectedObjects: string[];
  extractedText?: string;
  chartData?: {
    title?: string;
    labels: string[];
    values: number[];
    unit?: string;
  };
  keyTakeaways: string[];
}

export interface VisionAnalysisResult {
  id: string;
  category: VisionCategory;
  textResponse: string;
  structuredData: VisionStructuredData;
  modelUsed: string;
  wasFallback: boolean;
  durationMs: number;
}
