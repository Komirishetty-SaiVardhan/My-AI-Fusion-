"use client";

import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import {
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Printer,
  FileText,
  Sliders,
  Sparkles,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Palette,
  Type,
  Scroll,
} from "lucide-react";
import {
  PaperStyle,
  InkColor,
  HandwritingFont,
  HandwritingConfig,
} from "@/lib/handwriting/types";
import {
  PAPER_THEMES,
  INK_THEMES,
  FONT_THEMES,
  layoutHandwriting,
  renderPageToCanvas,
  generatePageSvg,
} from "@/lib/handwriting/engine";
import { cn } from "@/lib/utils";

interface HandwrittenNoteCardProps {
  initialText: string;
  initialPaper?: PaperStyle;
  initialInk?: InkColor;
  initialFont?: HandwritingFont;
  initialTitle?: string;
  className?: string;
}

function HandwrittenNoteCardComponent({
  initialText,
  initialPaper = "lined",
  initialInk = "blue",
  initialFont = "caveat",
  initialTitle,
  className,
}: HandwrittenNoteCardProps) {
  const [paper, setPaper] = useState<PaperStyle>(initialPaper);
  const [ink, setInk] = useState<InkColor>(initialInk);
  const [font, setFont] = useState<HandwritingFont>(initialFont);
  const [fontSize, setFontSize] = useState<number>(24);
  const [lineHeight, setLineHeight] = useState<number>(36);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showRawText, setShowRawText] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Compute multi-page layout deterministically
  const layoutResult = useMemo(() => {
    const config: HandwritingConfig = {
      text: initialText,
      paper,
      ink,
      font,
      fontSize,
      lineHeight,
      title: initialTitle,
    };
    return layoutHandwriting(config);
  }, [initialText, paper, ink, font, fontSize, lineHeight, initialTitle]);

  const totalPages = layoutResult.totalPages;
  const safePageIndex = Math.max(0, Math.min(currentPageIndex, totalPages - 1));
  const currentPage = layoutResult.pages[safePageIndex] || layoutResult.pages[0];

  // Render to canvas whenever page or styles change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentPage) return;

    // Render using engine
    renderPageToCanvas(canvas, currentPage, layoutResult.config);
  }, [currentPage, layoutResult]);

  // Ensure fonts are loaded before drawing
  useEffect(() => {
    if (typeof document !== "undefined" && (document as any).fonts) {
      (document as any).fonts.ready.then(() => {
        const canvas = canvasRef.current;
        if (canvas && currentPage) {
          renderPageToCanvas(canvas, currentPage, layoutResult.config);
        }
      });
    }
  }, [font, currentPage, layoutResult]);

  // Handle PNG Download
  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    const safeTitle = (initialTitle || "handwritten_note")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");
    link.download = `${safeTitle}_page_${safePageIndex + 1}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Handle SVG Download
  const handleDownloadSvg = () => {
    if (!currentPage) return;
    const svgStr = generatePageSvg(currentPage, layoutResult.config);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement("a");
    const safeTitle = (initialTitle || "handwritten_note")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");
    link.download = `${safeTitle}_page_${safePageIndex + 1}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Handle Copy Image to Clipboard
  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }, "image/png");
    } catch {
      // Fallback: Copy raw text if clipboard image writing is blocked
      handleCopyRawText();
    }
  };

  // Handle Copy Raw Text
  const handleCopyRawText = async () => {
    try {
      await navigator.clipboard.writeText(initialText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // ignore
    }
  };

  // Handle Print
  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${initialTitle || "Handwritten Note"} - Page ${safePageIndex + 1}</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; background: #fff; }
            img { max-width: 100%; height: auto; display: block; }
            @media print {
              body { margin: 0; }
              img { width: 100%; page-break-after: always; }
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print();window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "my-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg overflow-hidden transition-all text-[var(--foreground)]",
        isFullscreen && "fixed inset-4 z-50 overflow-y-auto max-h-[calc(100vh-2rem)]",
        className
      )}
    >
      {/* Top Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[var(--muted)]/40 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="font-semibold text-xs text-[var(--foreground)] block truncate">
              {initialTitle || "Handwritten Note"}
            </span>
            <span className="text-[10px] text-[var(--muted-foreground)] block">
              100% Deterministic Handwriting • {totalPages} {totalPages === 1 ? "Page" : "Pages"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Settings Customizer Toggle */}
          <button
            onClick={() => setShowSettings((prev) => !prev)}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
              showSettings
                ? "bg-sky-500/15 border-sky-500/30 text-sky-500"
                : "border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
            title="Customize Paper, Ink & Handwriting Font"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Customize</span>
          </button>

          {/* Toggle Raw Text */}
          <button
            onClick={() => setShowRawText((prev) => !prev)}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
              showRawText
                ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-500"
                : "border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
            title="View Text"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Text</span>
          </button>

          {/* Copy Image */}
          <button
            onClick={handleCopyImage}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] text-xs font-medium transition-colors cursor-pointer"
            title="Copy rendered handwriting image to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold text-[11px]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] hidden sm:inline">Copy Image</span>
              </>
            )}
          </button>

          {/* Download PNG */}
          <button
            onClick={handleDownloadPng}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
            title="Download crisp PNG image"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px]">Download</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="p-1 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Settings Panel (Paper, Ink, Font customizers) */}
      {showSettings && (
        <div className="p-3.5 bg-[var(--muted)]/20 border-b border-[var(--border)] grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs animate-in fade-in duration-150">
          {/* Paper Style */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 font-medium text-[var(--foreground)] text-[11px]">
              <Scroll className="w-3.5 h-3.5 text-amber-500" />
              <span>Paper Background</span>
            </label>
            <select
              value={paper}
              onChange={(e) => setPaper(e.target.value as PaperStyle)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
            >
              {Object.values(PAPER_THEMES).map((theme) => (
                <option key={theme.id} value={theme.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {theme.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ink Color */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 font-medium text-[var(--foreground)] text-[11px]">
              <Palette className="w-3.5 h-3.5 text-sky-500" />
              <span>Ink & Pen Style</span>
            </label>
            <select
              value={ink}
              onChange={(e) => setInk(e.target.value as InkColor)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
            >
              {Object.values(INK_THEMES).map((theme) => (
                <option key={theme.id} value={theme.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {theme.name}
                </option>
              ))}
            </select>
          </div>

          {/* Handwriting Font */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 font-medium text-[var(--foreground)] text-[11px]">
              <Type className="w-3.5 h-3.5 text-indigo-500" />
              <span>Handwriting Font</span>
            </label>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value as HandwritingFont)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
            >
              {Object.values(FONT_THEMES).map((theme) => (
                <option key={theme.id} value={theme.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {theme.name} ({theme.description})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Raw Text Drawer if toggled */}
      {showRawText && (
        <div className="p-3.5 bg-[var(--muted)]/40 border-b border-[var(--border)] text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-[11px] text-[var(--muted-foreground)]">
              Verbatim Text Content ({initialText.length} characters, {layoutResult.totalWords} words)
            </span>
            <button
              onClick={handleCopyRawText}
              className="inline-flex items-center gap-1 text-[11px] text-sky-500 hover:underline cursor-pointer"
            >
              {copiedText ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>Text Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>
          <div className="max-h-36 overflow-y-auto p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] whitespace-pre-wrap font-sans text-xs leading-relaxed select-text">
            {initialText}
          </div>
        </div>
      )}

      {/* Canvas Note Rendering Container */}
      <div className="relative p-3 sm:p-6 flex flex-col items-center justify-center bg-slate-900/5 dark:bg-black/30 overflow-hidden">
        {/* Zoom Controls Overlay */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-[var(--card)]/90 backdrop-blur-md border border-[var(--border)] rounded-lg p-0.5 shadow-sm z-10 text-xs">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
            className="p-1 rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] px-1 font-mono text-[var(--muted-foreground)]">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.1))}
            className="p-1 rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Paper Canvas Shadow Box */}
        <div
          className="transition-transform duration-150 origin-top flex justify-center w-full max-w-2xl overflow-x-auto py-2"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto rounded-lg shadow-2xl border border-black/10 dark:border-white/10"
            style={{
              aspectRatio: "800 / 1050",
              width: "100%",
              maxWidth: "680px",
            }}
          />
        </div>
      </div>

      {/* Bottom Pagination & Footer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[var(--muted)]/40 border-t border-[var(--border)] text-xs">
        {/* Pagination */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
            disabled={safePageIndex <= 0}
            className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
            Page <span className="font-semibold text-[var(--foreground)]">{safePageIndex + 1}</span> of{" "}
            <span className="font-semibold text-[var(--foreground)]">{totalPages}</span>
          </span>

          <button
            onClick={() => setCurrentPageIndex((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePageIndex >= totalPages - 1}
            className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Page Info & SVG Vector Link */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSvg}
            className="text-[11px] text-sky-500 hover:underline cursor-pointer font-medium"
            title="Download scalable vector SVG"
          >
            Vector SVG
          </button>
          <span className="text-[var(--border)]">•</span>
          <span className="text-[11px] text-[var(--muted-foreground)]">
            {PAPER_THEMES[paper].name} • {INK_THEMES[ink].name}
          </span>
        </div>
      </div>
    </div>
  );
}

export const HandwrittenNoteCard = memo(HandwrittenNoteCardComponent);

