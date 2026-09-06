"use client";

import React, { useState, memo } from "react";
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
  Palette,
} from "lucide-react";
import { ImageStudioModal } from "@/components/studio/ImageStudioModal";

interface ImageCardProps {
  src: string;
  alt?: string;
}

function ImageCardComponent({ src, alt }: ImageCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
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
    <div className="my-3 max-w-xl w-full select-none [contain:paint_layout] isolate">
      <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-md transition-shadow duration-200 hover:shadow-xl hover:border-sky-500/40">
        
        {/* Stable Aspect Ratio Viewport Frame */}
        <div className="relative w-full aspect-[16/10] sm:aspect-video bg-slate-100 dark:bg-slate-900/80 overflow-hidden flex items-center justify-center">
          
          {/* Shimmering Skeleton Loader (Underneath Image) */}
          {!error && (
            <div
              className={`absolute inset-0 z-0 flex flex-col items-center justify-center bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-pulse text-[var(--muted-foreground)] p-6 transition-opacity duration-300 pointer-events-none ${
                loaded ? "opacity-0" : "opacity-100"
              }`}
            >
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
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-500/5 text-red-500 p-6 border border-red-500/20">
              <ImageIcon className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-xs font-semibold mb-1">Failed to render image</p>
              <p className="text-[11px] text-[var(--muted-foreground)] mb-3 text-center">
                The image server may be busy. Click retry to generate again.
              </p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-700 transition-colors shadow-sm cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
                <span>Retry Generation</span>
              </button>
            </div>
          )}

          {/* Main Image Layer with Smooth Crossfade & Async Decoding */}
          {!error && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeSrc}
              alt={cleanAlt}
              decoding="async"
              loading="lazy"
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
              className={`relative z-10 w-full h-full object-cover transition-opacity duration-300 cursor-pointer ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => setIsLightboxOpen(true)}
            />
          )}

          {/* Top Badges */}
          {loaded && !error && (
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 pointer-events-none">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 text-white text-[11px] font-medium border border-white/10 shadow-sm">
                <Sparkles className="w-3 h-3 text-sky-400" />
                <span>AI Generated</span>
              </span>
            </div>
          )}

          {/* Hover Action Bar (GPU Optimized) */}
          {loaded && !error && (
            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button
                onClick={() => setIsStudioOpen(true)}
                title="Open in AI Image Studio (Styles & Variations)"
                className="w-8 h-8 rounded-full bg-purple-600/90 hover:bg-purple-600 text-white flex items-center justify-center transition-colors border border-purple-400/30 shadow-sm cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopyLink}
                title="Copy Image URL"
                className="w-8 h-8 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center transition-colors border border-white/15 shadow-sm cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleDownload}
                title="Download High-Res Image"
                className="w-8 h-8 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center transition-colors border border-white/15 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsLightboxOpen(true)}
                title="View Fullscreen"
                className="w-8 h-8 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center transition-colors border border-white/15 shadow-sm cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Caption Bar */}
        {cleanAlt && (
          <div className="px-3.5 py-2 border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span className="truncate pr-2 italic">&ldquo;{cleanAlt}&rdquo;</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setIsStudioOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-500 hover:text-purple-600 transition-colors cursor-pointer"
              >
                <Palette className="w-3 h-3" />
                <span>Studio Remix</span>
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-500 hover:text-sky-600 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Save HD</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-150"
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
              decoding="async"
              className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-white/10"
            />
            <div className="mt-3 flex items-center gap-3 bg-black/85 px-4 py-2 rounded-full border border-white/15 text-white text-xs">
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
      {/* Image Studio Modal */}
      <ImageStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        initialPrompt={cleanAlt}
        initialSrc={src}
      />
    </div>
  );
}

export const ImageCard = memo(ImageCardComponent);

