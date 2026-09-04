"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Maximize2,
  X,
  ExternalLink,
  RotateCw,
  Image as ImageIcon,
} from "lucide-react";

interface ImageCardProps {
  src: string;
  alt?: string;
}

export function ImageCard({ src, alt }: ImageCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const cleanAlt = alt || "AI Generated Artwork";
  const filename = `${cleanAlt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_") || "my_ai_image"}.jpg`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(src);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = async () => {
    try {
      const downloadEndpoint = `/api/generate-image?url=${encodeURIComponent(src)}&filename=${encodeURIComponent(
        filename
      )}`;
      const link = document.createElement("a");
      link.href = downloadEndpoint;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(src, "_blank");
    }
  };

  const handleRetry = () => {
    setError(false);
    setLoaded(false);
    setRetryCount((prev) => prev + 1);
  };

  const activeSrc = retryCount > 0 ? `${src}${src.includes("?") ? "&" : "?"}retry=${retryCount}` : src;

  return (
    <div className="my-3 max-w-xl w-full">
      <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-md transition-all duration-300 hover:shadow-xl hover:border-sky-500/40">
        {/* Shimmering Skeleton Loader */}
        {!loaded && !error && (
          <div className="aspect-square sm:aspect-video w-full flex flex-col items-center justify-center bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-pulse text-[var(--muted-foreground)] p-6">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-500 flex items-center justify-center mb-2.5 animate-bounce">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-center max-w-xs line-clamp-2">
              Rendering AI Image: &ldquo;{cleanAlt}&rdquo;...
            </p>
          </div>
        )}

        {/* Error Fallback */}
        {error && (
          <div className="aspect-video w-full flex flex-col items-center justify-center bg-red-500/5 text-red-500 p-6 border border-red-500/20 rounded-2xl">
            <ImageIcon className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-xs font-semibold mb-1">Failed to render image</p>
            <p className="text-[11px] text-[var(--muted-foreground)] mb-3 text-center">
              The image server may be busy. Click retry to generate again.
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-700 transition-colors shadow-sm"
            >
              <RotateCw className="w-3 h-3" />
              <span>Retry Generation</span>
            </button>
          </div>
        )}

        {/* Main Image */}
        {!error && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeSrc}
            alt={cleanAlt}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={`w-full h-auto max-h-[500px] object-cover transition-all duration-500 cursor-pointer ${
              loaded ? "opacity-100 scale-100" : "opacity-0 absolute h-0 scale-95"
            }`}
            onClick={() => setIsLightboxOpen(true)}
          />
        )}

        {/* Top Badges */}
        {loaded && !error && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium border border-white/10 shadow-sm">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>AI Generated</span>
            </span>
          </div>
        )}

        {/* Hover Action Bar */}
        {loaded && !error && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={handleCopyLink}
              title="Copy Image URL"
              className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-md hover:bg-black text-white flex items-center justify-center transition-all border border-white/15 shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleDownload}
              title="Download High-Res Image"
              className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-md hover:bg-black text-white flex items-center justify-center transition-all border border-white/15 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsLightboxOpen(true)}
              title="View Fullscreen"
              className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-md hover:bg-black text-white flex items-center justify-center transition-all border border-white/15 shadow-sm"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Bottom Caption */}
        {loaded && !error && cleanAlt && (
          <div className="px-3.5 py-2 border-t border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-sm flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span className="truncate pr-2 italic">&ldquo;{cleanAlt}&rdquo;</span>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-500 hover:text-sky-600 transition-colors flex-shrink-0"
            >
              <Download className="w-3 h-3" />
              <span>Save HD</span>
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeSrc}
              alt={cleanAlt}
              className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-white/10"
            />
            <div className="mt-3 flex items-center gap-3 bg-black/75 backdrop-blur-lg px-4 py-2 rounded-full border border-white/15 text-white text-xs">
              <span className="font-medium truncate max-w-xs sm:max-w-md">{cleanAlt}</span>
              <div className="h-3 w-[1px] bg-white/20" />
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1 hover:text-sky-400 transition-colors font-medium cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
              <button
                onClick={() => window.open(src, "_blank")}
                className="inline-flex items-center gap-1 hover:text-sky-400 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Raw</span>
              </button>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="hover:text-red-400 transition-colors ml-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
