/**
 * Deterministic Handwriting Rendering Engine
 * Developed for My AI by Komirishetty Sai Vardhan
 *
 * Renders user-provided text with 100% spelling, punctuation, and formatting fidelity
 * onto authentic paper textures using SVG & Canvas.
 */

import {
  HandwritingConfig,
  HandwritingFont,
  HandwritingRenderResult,
  InkColor,
  InkTheme,
  PaperStyle,
  PaperTheme,
  FontTheme,
  RenderedPage,
} from "./types";

export const PAPER_THEMES: Record<PaperStyle, PaperTheme> = {
  lined: {
    id: "lined",
    name: "Lined Notebook",
    background: "#fdfbf7",
    lineColor: "#cbd5e1",
    marginLineColor: "#f87171",
    hasRedMargin: true,
    hasHorizontalLines: true,
    hasGrid: false,
    isDark: false,
  },
  "legal-pad": {
    id: "legal-pad",
    name: "Yellow Legal Pad",
    background: "#fef9c3",
    lineColor: "#e2e8f0",
    marginLineColor: "#f87171",
    hasRedMargin: true,
    hasHorizontalLines: true,
    hasGrid: false,
    isDark: false,
  },
  blank: {
    id: "blank",
    name: "Blank White Paper",
    background: "#ffffff",
    lineColor: "transparent",
    hasRedMargin: false,
    hasHorizontalLines: false,
    hasGrid: false,
    isDark: false,
  },
  grid: {
    id: "grid",
    name: "Graph / Grid Paper",
    background: "#ffffff",
    lineColor: "#e2e8f0",
    gridColor: "#e2e8f0",
    hasRedMargin: false,
    hasHorizontalLines: true,
    hasGrid: true,
    isDark: false,
  },
  parchment: {
    id: "parchment",
    name: "Vintage Parchment",
    background: "#f6ede0",
    lineColor: "#d6c7a1",
    hasRedMargin: false,
    hasHorizontalLines: true,
    hasGrid: false,
    isDark: false,
  },
  chalkboard: {
    id: "chalkboard",
    name: "Chalkboard",
    background: "#1e293b",
    lineColor: "#334155",
    hasRedMargin: false,
    hasHorizontalLines: true,
    hasGrid: false,
    isDark: true,
  },
};

export const INK_THEMES: Record<InkColor, InkTheme> = {
  blue: {
    id: "blue",
    name: "Royal Blue Ink",
    color: "#0c3285",
    hex: "#0c3285",
    opacity: 0.95,
  },
  "royal-blue": {
    id: "royal-blue",
    name: "Deep Royal Blue",
    color: "#1d4ed8",
    hex: "#1d4ed8",
    opacity: 0.96,
  },
  black: {
    id: "black",
    name: "Midnight Black Gel",
    color: "#18181b",
    hex: "#18181b",
    opacity: 0.96,
  },
  "gel-black": {
    id: "gel-black",
    name: "Dark Rollerball Ink",
    color: "#09090b",
    hex: "#09090b",
    opacity: 0.98,
  },
  red: {
    id: "red",
    name: "Teacher Red Ink",
    color: "#b91c1c",
    hex: "#b91c1c",
    opacity: 0.95,
  },
  emerald: {
    id: "emerald",
    name: "Emerald Green Ink",
    color: "#047857",
    hex: "#047857",
    opacity: 0.94,
  },
  pencil: {
    id: "pencil",
    name: "Graphite Pencil",
    color: "#475569",
    hex: "#475569",
    opacity: 0.88,
  },
  chalk: {
    id: "chalk",
    name: "White Chalk",
    color: "#f8fafc",
    hex: "#f8fafc",
    opacity: 0.92,
  },
  white: {
    id: "white",
    name: "Bright White Chalk",
    color: "#ffffff",
    hex: "#ffffff",
    opacity: 0.96,
  },
};

export const FONT_THEMES: Record<HandwritingFont, FontTheme> = {
  caveat: {
    id: "caveat",
    name: "Casual Cursive",
    description: "Natural everyday notes",
    fontFamily: "Caveat",
    cssFamily: "'Caveat', cursive, sans-serif",
    fallbackFont: "cursive",
    defaultSize: 24,
    lineHeightRatio: 1.5,
  },
  kalam: {
    id: "kalam",
    name: "Neat Penmanship",
    description: "Student notebook print",
    fontFamily: "Kalam",
    cssFamily: "'Kalam', cursive, sans-serif",
    fallbackFont: "cursive",
    defaultSize: 21,
    lineHeightRatio: 1.5,
  },
  patrick: {
    id: "patrick",
    name: "Clean Print",
    description: "Clear legible handwriting",
    fontFamily: "Patrick Hand",
    cssFamily: "'Patrick Hand', cursive, sans-serif",
    fallbackFont: "cursive",
    defaultSize: 22,
    lineHeightRatio: 1.5,
  },
  architect: {
    id: "architect",
    name: "Architect Draft",
    description: "Technical drafting print",
    fontFamily: "Architects Daughter",
    cssFamily: "'Architects Daughter', cursive, sans-serif",
    fallbackFont: "cursive",
    defaultSize: 20,
    lineHeightRatio: 1.5,
  },
  architects: {
    id: "architects",
    name: "Architect Draft",
    description: "Technical drafting print",
    fontFamily: "Architects Daughter",
    cssFamily: "'Architects Daughter', cursive, sans-serif",
    fallbackFont: "cursive",
    defaultSize: 20,
    lineHeightRatio: 1.5,
  },
  apple: {
    id: "apple",
    name: "Fountain Signature",
    description: "Vintage cursive fountain pen",
    fontFamily: "Homemade Apple",
    cssFamily: "'Homemade Apple', cursive, sans-serif",
    fallbackFont: "cursive",
    defaultSize: 18,
    lineHeightRatio: 1.6,
  },
  dancing: {
    id: "dancing",
    name: "Elegant Calligraphy",
    description: "Flowing flourished calligraphy",
    fontFamily: "Dancing Script",
    cssFamily: "'Dancing Script', cursive, sans-serif",
    fallbackFont: "cursive",
    defaultSize: 23,
    lineHeightRatio: 1.5,
  },
  indie: {
    id: "indie",
    name: "Casual Notes",
    description: "Relaxed artistic print",
    fontFamily: "Indie Flower",
    cssFamily: "'Indie Flower', cursive, sans-serif",
    fallbackFont: "cursive",
    defaultSize: 22,
    lineHeightRatio: 1.5,
  },
  shadows: {
    id: "shadows",
    name: "Sketchy Hand",
    description: "Expressive sketched style",
    fontFamily: "Shadows Into Light",
    cssFamily: "'Shadows Into Light', cursive, sans-serif",
    fallbackFont: "cursive",
    defaultSize: 22,
    lineHeightRatio: 1.5,
  },
};

export const PAGE_WIDTH = 800;
export const PAGE_HEIGHT = 1100;
export const LINE_HEIGHT = 36;
export const TOP_MARGIN = 90;
export const BOTTOM_MARGIN = 70;
export const LEFT_MARGIN_LINED = 90;
export const LEFT_MARGIN_PLAIN = 60;
export const RIGHT_MARGIN = 60;

/**
 * Calculates max characters per line based on font size and printable width
 */
function getApproxCharsPerLine(fontSize: number, printableWidth: number): number {
  // Handwriting fonts average approx 0.52 to 0.58 width per character at 1em
  const avgCharWidth = fontSize * 0.54;
  return Math.max(15, Math.floor(printableWidth / avgCharWidth));
}

/**
 * Word wraps user text with exact preservation of words, punctuation, and newlines
 */
export function wrapTextToLines(
  rawText: string,
  fontSize: number,
  printableWidth: number
): string[] {
  if (!rawText) return [""];

  // Normalize line endings
  const normalized = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const paragraphs = normalized.split("\n");
  const maxChars = getApproxCharsPerLine(fontSize, printableWidth);

  const lines: string[] = [];

  for (const para of paragraphs) {
    if (para.trim() === "") {
      lines.push("");
      continue;
    }

    const words = para.split(" ");
    let currentLine = "";

    for (const word of words) {
      if (!currentLine) {
        currentLine = word;
      } else if (currentLine.length + 1 + word.length <= maxChars) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Paginates lines across multiple notebook sheets
 */
export function paginateLines(
  lines: string[],
  maxLinesPerPage: number,
  title?: string,
  date?: string
): RenderedPage[] {
  if (lines.length === 0) {
    return [
      {
        pageNumber: 1,
        totalPages: 1,
        lines: [""],
        title,
        date,
      },
    ];
  }

  const pages: RenderedPage[] = [];
  const totalPages = Math.max(1, Math.ceil(lines.length / maxLinesPerPage));

  for (let p = 0; p < totalPages; p++) {
    const pageLines = lines.slice(p * maxLinesPerPage, (p + 1) * maxLinesPerPage);
    pages.push({
      pageNumber: p + 1,
      totalPages,
      lines: pageLines,
      title,
      date,
    });
  }

  return pages;
}

/**
 * Main handwriting layout engine
 */
export function layoutHandwriting(config: HandwritingConfig): HandwritingRenderResult {
  const paper = config.paper || "lined";
  const ink = config.ink || (paper === "chalkboard" ? "chalk" : "blue");
  const font = config.font || "caveat";
  const fontTheme = FONT_THEMES[font] || FONT_THEMES.caveat;
  const fontSize = config.fontSize || fontTheme.defaultSize;

  const paperTheme = PAPER_THEMES[paper] || PAPER_THEMES.lined;
  const leftMargin = paperTheme.hasRedMargin ? LEFT_MARGIN_LINED : LEFT_MARGIN_PLAIN;
  const printableWidth = PAGE_WIDTH - leftMargin - RIGHT_MARGIN;

  const maxLinesPerPage = Math.floor((PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN) / LINE_HEIGHT);

  const lines = wrapTextToLines(config.text, fontSize, printableWidth);
  const pages = paginateLines(lines, maxLinesPerPage, config.title, config.date);

  const words = config.text.trim().split(/\s+/).filter(Boolean).length;
  const chars = config.text.length;

  const fullConfig: Required<HandwritingConfig> = {
    text: config.text,
    title: config.title || "",
    paper,
    ink,
    font,
    fontSize,
    lineHeight: config.lineHeight || LINE_HEIGHT,
    lineSpacing: config.lineSpacing || config.lineHeight || LINE_HEIGHT,
    showDate: config.showDate ?? true,
    date: config.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  };

  return {
    pages,
    totalPages: pages.length,
    totalWords: words,
    totalCharacters: chars,
    config: fullConfig,
  };
}

/**
 * Renders a single page onto an HTML5 Canvas
 */
export async function renderPageToCanvas(
  canvas: HTMLCanvasElement,
  page: RenderedPage,
  config: Required<HandwritingConfig>
): Promise<void> {
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 2, 2) : 2;
  const width = PAGE_WIDTH;
  const height = PAGE_HEIGHT;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.scale(dpr, dpr);

  const paperTheme = PAPER_THEMES[config.paper] || PAPER_THEMES.lined;
  const inkTheme = INK_THEMES[config.ink] || INK_THEMES.blue;
  const fontTheme = FONT_THEMES[config.font] || FONT_THEMES.caveat;

  // 1. Draw Paper Background
  ctx.fillStyle = paperTheme.background;
  ctx.fillRect(0, 0, width, height);

  // Subtle paper texture gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  if (paperTheme.isDark) {
    grad.addColorStop(0, "rgba(255, 255, 255, 0.02)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0.2)");
  } else {
    grad.addColorStop(0, "rgba(255, 255, 255, 0.4)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0.04)");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Draw Grid Pattern if grid paper
  if (paperTheme.hasGrid) {
    ctx.strokeStyle = paperTheme.lineColor;
    ctx.lineWidth = 0.5;
    const gridSize = 20;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // 3. Draw Ruled Horizontal Lines
  if (paperTheme.hasHorizontalLines && !paperTheme.hasGrid) {
    ctx.strokeStyle = paperTheme.lineColor;
    ctx.lineWidth = 1;
    for (let y = TOP_MARGIN; y <= height - BOTTOM_MARGIN; y += LINE_HEIGHT) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // 4. Draw Vertical Red Margin Line
  if (paperTheme.hasRedMargin && paperTheme.marginLineColor) {
    ctx.strokeStyle = paperTheme.marginLineColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(LEFT_MARGIN_LINED - 15, 0);
    ctx.lineTo(LEFT_MARGIN_LINED - 15, height);
    ctx.stroke();
  }

  // 5. Draw Header (Date & Page Number)
  ctx.fillStyle = paperTheme.isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)";
  ctx.font = `13px sans-serif`;
  if (config.showDate && config.date) {
    ctx.fillText(`Date: ${config.date}`, width - 180, 45);
  }
  ctx.fillText(`Page: ${page.pageNumber} of ${page.totalPages}`, width - 180, 65);

  if (page.title) {
    ctx.fillStyle = inkTheme.hex;
    ctx.font = `bold ${config.fontSize + 4}px ${fontTheme.cssFamily}`;
    ctx.fillText(page.title, paperTheme.hasRedMargin ? LEFT_MARGIN_LINED : LEFT_MARGIN_PLAIN, TOP_MARGIN - 20);
  }

  // 6. Draw Handwritten Text Lines
  ctx.fillStyle = inkTheme.hex;
  ctx.font = `${config.fontSize}px ${fontTheme.cssFamily}`;
  ctx.textBaseline = "alphabetic";

  const startX = paperTheme.hasRedMargin ? LEFT_MARGIN_LINED : LEFT_MARGIN_PLAIN;
  let currentY = TOP_MARGIN - 6;

  for (let i = 0; i < page.lines.length; i++) {
    const lineText = page.lines[i];
    if (lineText) {
      // Add a tiny organic jitter (+/- 0.3px) for human handwriting realism
      const subtleJitter = ((i % 3) - 1) * 0.35;
      ctx.fillText(lineText, startX, currentY + subtleJitter);
    }
    currentY += LINE_HEIGHT;
  }
}

/**
 * Generates an SVG string representation of a page for scalable embedding
 */
export function generatePageSvg(
  page: RenderedPage,
  config: Required<HandwritingConfig>
): string {
  const paperTheme = PAPER_THEMES[config.paper] || PAPER_THEMES.lined;
  const inkTheme = INK_THEMES[config.ink] || INK_THEMES.blue;
  const fontTheme = FONT_THEMES[config.font] || FONT_THEMES.caveat;

  const leftMargin = paperTheme.hasRedMargin ? LEFT_MARGIN_LINED : LEFT_MARGIN_PLAIN;

  let horizontalLinesSvg = "";
  if (paperTheme.hasHorizontalLines && !paperTheme.hasGrid) {
    for (let y = TOP_MARGIN; y <= PAGE_HEIGHT - BOTTOM_MARGIN; y += LINE_HEIGHT) {
      horizontalLinesSvg += `<line x1="0" y1="${y}" x2="${PAGE_WIDTH}" y2="${y}" stroke="${paperTheme.lineColor}" stroke-width="1" />\n`;
    }
  }

  let marginLineSvg = "";
  if (paperTheme.hasRedMargin && paperTheme.marginLineColor) {
    marginLineSvg = `<line x1="${LEFT_MARGIN_LINED - 15}" y1="0" x2="${LEFT_MARGIN_LINED - 15}" y2="${PAGE_HEIGHT}" stroke="${paperTheme.marginLineColor}" stroke-width="1.5" />\n`;
  }

  let textLinesSvg = "";
  let currentY = TOP_MARGIN - 6;

  for (let i = 0; i < page.lines.length; i++) {
    const line = page.lines[i];
    if (line) {
      const escaped = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
      textLinesSvg += `<text x="${leftMargin}" y="${currentY}" font-family="${fontTheme.cssFamily}" font-size="${config.fontSize}" fill="${inkTheme.hex}">${escaped}</text>\n`;
    }
    currentY += LINE_HEIGHT;
  }

  const escapedTitle = page.title
    ? page.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}" width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Architects+Daughter&amp;family=Caveat:wght@400;700&amp;family=Dancing+Script:wght@400;700&amp;family=Homemade+Apple&amp;family=Indie+Flower&amp;family=Kalam:wght@400;700&amp;family=Patrick+Hand&amp;display=swap');
    </style>
  </defs>
  <!-- Paper Background -->
  <rect width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" fill="${paperTheme.background}" />
  
  <!-- Horizontal Lines -->
  ${horizontalLinesSvg}
  
  <!-- Red Margin Line -->
  ${marginLineSvg}
  
  <!-- Header Info -->
  <text x="${PAGE_WIDTH - 180}" y="45" font-family="system-ui, sans-serif" font-size="12" fill="${paperTheme.isDark ? '#94a3b8' : '#64748b'}">${config.showDate ? `Date: ${config.date}` : ""}</text>
  <text x="${PAGE_WIDTH - 180}" y="65" font-family="system-ui, sans-serif" font-size="12" fill="${paperTheme.isDark ? '#94a3b8' : '#64748b'}">Page: ${page.pageNumber} of ${page.totalPages}</text>
  
  ${escapedTitle ? `<text x="${leftMargin}" y="${TOP_MARGIN - 20}" font-family="${fontTheme.cssFamily}" font-size="${config.fontSize + 4}" font-weight="bold" fill="${inkTheme.hex}">${escapedTitle}</text>` : ""}
  
  <!-- Handwritten Text -->
  ${textLinesSvg}
</svg>`;
}

export interface ParsedHandwrittenBlock {
  text: string;
  paper?: PaperStyle;
  ink?: InkColor;
  font?: HandwritingFont;
  title?: string;
}

/**
 * Parses a ````handwritten ... ```` markdown code block to extract optional metadata headers
 * (like Paper:, Ink:, Font:, Title:) and returns the verbatim text.
 */
export function parseHandwrittenBlock(rawCode: string): ParsedHandwrittenBlock {
  const lines = rawCode.split("\n");
  let headerEndIndex = -1;
  let paper: PaperStyle | undefined;
  let ink: InkColor | undefined;
  let font: HandwritingFont | undefined;
  let title: string | undefined;

  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i].trim();
    if (line === "---" || line === "===") {
      headerEndIndex = i;
      break;
    }
    const colonIdx = line.indexOf(":");
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim().toLowerCase();
      const val = line.slice(colonIdx + 1).trim();
      if (key === "paper" && (val in PAPER_THEMES || val.toLowerCase() in PAPER_THEMES)) {
        paper = val.toLowerCase() as PaperStyle;
      } else if (key === "ink" && (val in INK_THEMES || val.toLowerCase() in INK_THEMES)) {
        ink = val.toLowerCase() as InkColor;
      } else if (key === "font" && (val in FONT_THEMES || val.toLowerCase() in FONT_THEMES)) {
        font = val.toLowerCase() as HandwritingFont;
      } else if (key === "title") {
        title = val;
      }
    } else if (i > 0 && (paper || ink || font || title)) {
      headerEndIndex = i - 1;
      break;
    }
  }

  const bodyText =
    headerEndIndex !== -1
      ? lines.slice(headerEndIndex + 1).join("\n").trim()
      : rawCode.trim();

  return {
    text: bodyText || rawCode.trim(),
    paper,
    ink,
    font,
    title,
  };
}

