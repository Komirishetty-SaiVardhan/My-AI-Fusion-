/**
 * Types and Configuration for the Deterministic Handwriting Rendering Engine
 * Developed for My AI by Komirishetty Sai Vardhan
 */

export type PaperStyle =
  | "lined"
  | "legal-pad"
  | "blank"
  | "grid"
  | "parchment"
  | "chalkboard";

export type InkColor =
  | "blue"
  | "black"
  | "royal-blue"
  | "gel-black"
  | "red"
  | "emerald"
  | "pencil"
  | "chalk"
  | "white";

export type HandwritingFont =
  | "caveat"
  | "kalam"
  | "patrick"
  | "architect"
  | "architects"
  | "apple"
  | "dancing"
  | "indie"
  | "shadows";

export interface HandwritingConfig {
  text: string;
  title?: string;
  paper?: PaperStyle;
  ink?: InkColor;
  font?: HandwritingFont;
  fontSize?: number;
  lineHeight?: number;
  lineSpacing?: number;
  showDate?: boolean;
  date?: string;
}

export interface PaperTheme {
  id: PaperStyle;
  name: string;
  background: string;
  lineColor: string;
  marginLineColor?: string;
  gridColor?: string;
  hasRedMargin: boolean;
  hasHorizontalLines: boolean;
  hasGrid: boolean;
  textureEffect?: string;
  isDark: boolean;
}

export interface InkTheme {
  id: InkColor;
  name: string;
  color: string;
  hex: string;
  opacity: number;
  glow?: string;
}

export interface FontTheme {
  id: HandwritingFont;
  name: string;
  description?: string;
  fontFamily: string;
  cssFamily: string;
  fallbackFont: string;
  defaultSize: number;
  lineHeightRatio: number;
}

export interface RenderedPage {
  pageNumber: number;
  totalPages: number;
  lines: string[];
  title?: string;
  date?: string;
}

export interface HandwritingRenderResult {
  pages: RenderedPage[];
  totalPages: number;
  totalWords: number;
  totalCharacters: number;
  config: Required<HandwritingConfig>;
}
