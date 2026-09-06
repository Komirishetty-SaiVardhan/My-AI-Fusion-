"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Printer,
  Sparkles,
  Layout,
  Palette,
  FileText,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Slide {
  title: string;
  subtitle?: string;
  bullets: string[];
  stat?: { value: string; label: string };
  notes?: string;
}

interface SlideDeckViewerProps {
  rawContent: string;
  initialTitle?: string;
  className?: string;
}

type SlideTheme = "midnight" | "corporate" | "emerald" | "sunset";

const THEMES: Record<
  SlideTheme,
  { name: string; bg: string; text: string; accent: string; cardBg: string }
> = {
  midnight: {
    name: "Midnight Glow",
    bg: "bg-slate-950",
    text: "text-slate-100",
    accent: "text-sky-400 bg-sky-500/10 border-sky-500/30",
    cardBg: "bg-slate-900/80 border-slate-800",
  },
  corporate: {
    name: "Clean Corporate",
    bg: "bg-white",
    text: "text-slate-900",
    accent: "text-blue-600 bg-blue-50 border-blue-200",
    cardBg: "bg-slate-50 border-slate-200",
  },
  emerald: {
    name: "Emerald Tech",
    bg: "bg-emerald-950",
    text: "text-emerald-50",
    accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    cardBg: "bg-emerald-900/60 border-emerald-800",
  },
  sunset: {
    name: "Sunset Gradient",
    bg: "bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950",
    text: "text-purple-100",
    accent: "text-pink-400 bg-pink-500/10 border-pink-500/30",
    cardBg: "bg-purple-900/40 border-purple-800/60",
  },
};

export function parseSlideDeck(rawContent: string): { title: string; slides: Slide[] } {
  const sections = rawContent.split(/\n---\n/).map((s) => s.trim()).filter(Boolean);
  const slides: Slide[] = [];
  let deckTitle = "Interactive AI Presentation";

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    const lines = sec.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let title = `Slide ${i + 1}`;
    let subtitle: string | undefined;
    const bullets: string[] = [];
    let stat: { value: string; label: string } | undefined;
    let notes: string | undefined;

    for (const line of lines) {
      if (line.startsWith("# ")) {
        title = line.replace(/^#\s+/, "").trim();
        if (i === 0) deckTitle = title;
      } else if (line.startsWith("## ")) {
        subtitle = line.replace(/^##\s+/, "").trim();
      } else if (line.startsWith("- ") || line.startsWith("* ") || /^\d+\.\s/.test(line)) {
        bullets.push(line.replace(/^[-*]|\d+\.\s*/, "").trim());
      } else if (line.toLowerCase().startsWith("notes:") || line.toLowerCase().startsWith("speaker notes:")) {
        notes = line.replace(/^(notes|speaker notes):\s*/i, "").trim();
      } else if (line.includes(":") && (line.includes("%") || line.includes("$") || /\d+/.test(line))) {
        const parts = line.split(":");
        if (parts.length === 2) {
          stat = { label: parts[0].trim(), value: parts[1].trim() };
        } else {
          bullets.push(line);
        }
      } else if (!subtitle && bullets.length === 0) {
        subtitle = line;
      } else {
        bullets.push(line);
      }
    }

    slides.push({
      title,
      subtitle,
      bullets,
      stat,
      notes,
    });
  }

  if (slides.length === 0) {
    slides.push({
      title: "AI Presentation Slide",
      bullets: [rawContent.slice(0, 200)],
    });
  }

  return { title: deckTitle, slides };
}

export function SlideDeckViewer({
  rawContent,
  initialTitle,
  className,
}: SlideDeckViewerProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [theme, setTheme] = useState<SlideTheme>("midnight");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const { title: parsedTitle, slides } = parseSlideDeck(rawContent);
  const title = initialTitle || parsedTitle;
  const currentSlide = slides[currentSlideIndex] || slides[0];
  const activeTheme = THEMES[theme];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "f" || e.key === "F") {
        setIsFullscreen((prev) => !prev);
      } else if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length, isFullscreen]);

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div
      className={cn(
        "my-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl overflow-hidden transition-all text-[var(--foreground)]",
        isFullscreen && "fixed inset-0 z-50 rounded-none border-none",
        className
      )}
    >
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[var(--muted)]/40 border-b border-[var(--border)] text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
            <Layout className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="font-semibold text-[var(--foreground)] block truncate text-xs">
              {title}
            </span>
            <span className="text-[10px] text-[var(--muted-foreground)]">
              Interactive AI Presentation • {slides.length} Slides
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Theme Switcher */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as SlideTheme)}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
          >
            {Object.entries(THEMES).map(([k, v]) => (
              <option key={k} value={k} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                {v.name}
              </option>
            ))}
          </select>

          {/* Notes Toggle */}
          {currentSlide?.notes && (
            <button
              onClick={() => setShowNotes((prev) => !prev)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer",
                showNotes
                  ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-500"
                  : "border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
              )}
            >
              <FileText className="w-3 h-3" />
              <span>Notes</span>
            </button>
          )}

          {/* Print PDF */}
          <button
            onClick={handlePrintPdf}
            className="p-1 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] cursor-pointer"
            title="Print Presentation / Export to PDF"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View (Press F)"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Slide Screen */}
      <div
        className={cn(
          "relative p-6 sm:p-12 min-h-[320px] sm:min-h-[420px] flex flex-col justify-between transition-colors",
          activeTheme.bg,
          activeTheme.text
        )}
      >
        <div>
          {/* Slide Tagline / Subtitle */}
          {currentSlide?.subtitle && (
            <span
              className={cn(
                "inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-3 border",
                activeTheme.accent
              )}
            >
              {currentSlide.subtitle}
            </span>
          )}

          {/* Slide Title */}
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight mb-6">
            {currentSlide?.title}
          </h2>

          {/* Slide Bullets */}
          {currentSlide?.bullets && currentSlide.bullets.length > 0 && (
            <div className="space-y-3 max-w-2xl">
              {currentSlide.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                  <p className="text-sm sm:text-base leading-relaxed opacity-90">
                    {bullet}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Highlight / Metric Callout */}
          {currentSlide?.stat && (
            <div
              className={cn(
                "mt-6 p-4 rounded-2xl border max-w-sm",
                activeTheme.cardBg
              )}
            >
              <span className="text-2xl sm:text-3xl font-black text-sky-400 block">
                {currentSlide.stat.value}
              </span>
              <span className="text-xs opacity-80 uppercase tracking-wider font-semibold block mt-1">
                {currentSlide.stat.label}
              </span>
            </div>
          )}
        </div>

        {/* Presenter Notes Drawer */}
        {showNotes && currentSlide?.notes && (
          <div className="mt-6 p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white/80 animate-in fade-in">
            <span className="font-semibold text-[10px] uppercase text-amber-400 block mb-1">
              Presenter Notes:
            </span>
            {currentSlide.notes}
          </div>
        )}
      </div>

      {/* Slide Navigation Footer Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--muted)]/40 border-t border-[var(--border)] text-xs">
        {/* Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentSlideIndex <= 0}
            className="p-1 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Previous Slide (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
            Slide <span className="font-semibold text-[var(--foreground)]">{currentSlideIndex + 1}</span> of{" "}
            <span className="font-semibold text-[var(--foreground)]">{slides.length}</span>
          </span>

          <button
            onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlideIndex >= slides.length - 1}
            className="p-1 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Next Slide (Right Arrow / Space)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail Dots */}
        <div className="hidden sm:flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlideIndex(idx)}
              className={cn(
                "h-2 rounded-full transition-all cursor-pointer",
                idx === currentSlideIndex
                  ? "w-6 bg-sky-500"
                  : "w-2 bg-[var(--border)] hover:bg-[var(--muted-foreground)]"
              )}
              title={`Jump to Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
