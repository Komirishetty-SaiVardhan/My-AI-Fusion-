"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Code,
  Eye,
  Smartphone,
  Tablet,
  Monitor,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  X,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ArtifactViewerProps {
  code: string;
  language: string;
  title?: string;
  onClose?: () => void;
  className?: string;
}

type ViewportSize = "mobile" | "tablet" | "desktop";

export function ArtifactViewer({
  code,
  language,
  title = "AI Interactive Sandbox",
  onClose,
  className,
}: ArtifactViewerProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate safe sandboxed HTML content
  const generateSandboxedHtml = (rawCode: string, lang: string) => {
    const isSvg = lang === "svg" || rawCode.trim().startsWith("<svg");
    const isHtml = lang === "html" || rawCode.includes("<!DOCTYPE html>") || rawCode.includes("<html");

    if (isSvg) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0f172a; color: white; font-family: sans-serif; }
              svg { max-width: 90%; max-height: 90vh; }
            </style>
          </head>
          <body>${rawCode}</body>
        </html>
      `;
    }

    if (isHtml) {
      return rawCode;
    }

    // Default: wrap JS/CSS/JSX snippets in interactive playground with Tailwind CSS CDN
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
          <style>
            body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #ffffff; color: #0f172a; }
            @media (prefers-color-scheme: dark) {
              body { background: #090d16; color: #f8fafc; }
            }
          </style>
        </head>
        <body class="p-6">
          <div id="root">
            ${rawCode}
          </div>
        </body>
      </html>
    `;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const viewportWidths: Record<ViewportSize, string> = {
    mobile: "max-w-[375px]",
    tablet: "max-w-[768px]",
    desktop: "w-full",
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-2xl overflow-hidden",
        isFullscreen && "fixed inset-0 z-50 rounded-none border-none",
        className
      )}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[var(--muted)]/50 border-b border-[var(--border)] text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-xs text-[var(--foreground)] truncate">
            {title}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 font-mono uppercase">
            {language || "HTML"}
          </span>
        </div>

        {/* Viewport Switcher (Only in Preview Mode) */}
        {activeTab === "preview" && (
          <div className="hidden sm:flex items-center gap-1 bg-[var(--muted)] p-0.5 rounded-lg border border-[var(--border)]">
            <button
              onClick={() => setViewport("desktop")}
              className={cn(
                "p-1 rounded cursor-pointer transition-colors",
                viewport === "desktop" ? "bg-[var(--card)] text-sky-500 shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
              title="Desktop View (100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport("tablet")}
              className={cn(
                "p-1 rounded cursor-pointer transition-colors",
                viewport === "tablet" ? "bg-[var(--card)] text-sky-500 shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport("mobile")}
              className={cn(
                "p-1 rounded cursor-pointer transition-colors",
                viewport === "mobile" ? "bg-[var(--card)] text-sky-500 shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab & Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-[var(--muted)] p-0.5 rounded-lg border border-[var(--border)]">
            <button
              onClick={() => setActiveTab("preview")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer",
                activeTab === "preview" ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer",
                activeTab === "code" ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Code className="w-3 h-3" />
              <span>Code</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] cursor-pointer"
            title="Copy Source Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] cursor-pointer"
            title="Download Standalone HTML File"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-red-500/10 hover:text-red-500 text-[var(--muted-foreground)] cursor-pointer"
              title="Close Sandbox"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Sandbox Area */}
      <div className="flex-1 min-h-[360px] bg-slate-900/5 dark:bg-black/30 overflow-hidden flex justify-center items-center p-2 sm:p-4">
        {activeTab === "preview" ? (
          <div
            className={cn(
              "h-full w-full mx-auto transition-all duration-200 bg-white dark:bg-slate-950 rounded-xl shadow-md border border-[var(--border)] overflow-hidden",
              viewportWidths[viewport]
            )}
          >
            <iframe
              ref={iframeRef}
              srcDoc={generateSandboxedHtml(code, language)}
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              className="w-full h-full border-none"
              title="Sandbox Preview"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-[#0f172a] text-[#f8fafc] rounded-xl p-4 overflow-auto font-mono text-xs leading-relaxed select-text border border-[#334155]">
            <pre>{code}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
