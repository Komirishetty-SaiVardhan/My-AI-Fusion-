"use client";

import React, { useState } from "react";
import { ImageStylePresetId, ImageAspectRatio, ImageStudioConfig } from "@/lib/image-studio/types";
import {
  IMAGE_STYLE_PRESETS,
  ASPECT_RATIO_DIMENSIONS,
  buildStudioImageUrl,
} from "@/lib/image-studio/presets";
import {
  Palette,
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCw,
  X,
  Maximize2,
  Wand2,
  Sliders,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  initialSrc?: string;
}

export function ImageStudioModal({
  isOpen,
  onClose,
  initialPrompt = "Futuristic city with flying vehicles and glowing neon spires",
  initialSrc,
}: ImageStudioModalProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedStyle, setSelectedStyle] = useState<ImageStylePresetId>("photoreal");
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("16:9");
  const [enhance, setEnhance] = useState(true);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000000));
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const currentConfig: ImageStudioConfig = {
    prompt,
    style: selectedStyle,
    aspectRatio,
    seed,
    enhance,
  };

  const currentImageUrl = buildStudioImageUrl(currentConfig);
  const activePreset = IMAGE_STYLE_PRESETS[selectedStyle];

  const handleRollSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000));
  };

  const handleDownload = () => {
    const filename = `${prompt.slice(0, 25).replace(/[^a-zA-Z0-9]/g, "_") || "studio_art"}.jpg`;
    const downloadEndpoint = `/api/generate-image?url=${encodeURIComponent(currentImageUrl)}&filename=${encodeURIComponent(
      filename
    )}`;
    const link = document.createElement("a");
    link.href = downloadEndpoint;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentImageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[92vh] rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 border-b border-slate-800 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-sky-500 flex items-center justify-center text-white font-bold shadow-md shadow-purple-500/20">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-white">
                AI Image Studio & Variation Lab
              </h3>
              <p className="text-[11px] text-slate-400">
                Remix styles, aspect ratios, seeds, and artistic presets in real time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRollSeed}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              title="Generate new random seed variation"
            >
              <RotateCw className="w-3.5 h-3.5 text-purple-400" />
              <span>Remix Variation</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-md transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download HD</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Studio Workspace Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Controls & Style Selector (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-slate-800 overflow-y-auto space-y-4 text-xs">
            {/* Prompt Input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span>Prompt Concept</span>
                <span className="text-[10px] font-mono text-purple-400">Seed: #{seed}</span>
              </label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your artwork or scene in detail..."
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
              />
            </div>

            {/* Aspect Ratio Picker */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Aspect Ratio & Framing
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {(["1:1", "16:9", "9:16", "4:3", "3:2"] as ImageAspectRatio[]).map((ar) => (
                  <button
                    key={ar}
                    onClick={() => setAspectRatio(ar)}
                    className={cn(
                      "py-2 px-1 rounded-xl border text-[11px] font-mono transition-all cursor-pointer text-center",
                      aspectRatio === ar
                        ? "bg-purple-500/20 border-purple-500 text-purple-300 font-bold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Presets Grid */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Artistic Style Presets ({Object.keys(IMAGE_STYLE_PRESETS).length})
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {Object.values(IMAGE_STYLE_PRESETS).map((preset) => {
                  const isSelected = selectedStyle === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedStyle(preset.id as ImageStylePresetId)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                        isSelected
                          ? "bg-purple-500/15 border-purple-500 text-white ring-1 ring-purple-500/30 shadow-md"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">{preset.icon}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {preset.badge}
                        </span>
                      </div>
                      <span className="font-semibold text-xs text-white block truncate">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Enhancement Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="font-semibold text-xs text-white block">Auto Prompt Enhancer</span>
                  <span className="text-[10px] text-slate-400">Inject high dynamic range & sharp focus modifiers</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enhance}
                onChange={(e) => setEnhance(e.target.checked)}
                className="w-4 h-4 accent-purple-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Right Live Visual Canvas (7 cols) */}
          <div className="lg:col-span-7 p-5 bg-[#060a12] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="relative w-full max-w-xl max-h-[500px] flex items-center justify-center rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900/60">
              {/* Image Component */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImageUrl}
                alt={prompt}
                key={`${selectedStyle}-${aspectRatio}-${seed}`}
                className="w-full h-auto max-h-[460px] object-contain rounded-2xl transition-opacity duration-300"
              />

              {/* Overlay Style Badge */}
              <div className="absolute top-3 left-3 pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-semibold border border-white/10 shadow-md">
                  <span>{activePreset.icon}</span>
                  <span>{activePreset.name}</span>
                </span>
              </div>

              {/* Overlay Bottom Info */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                <button
                  onClick={handleCopyUrl}
                  className="px-2.5 py-1 rounded-full bg-black/80 hover:bg-black text-white text-[11px] font-medium border border-white/15 transition-colors cursor-pointer"
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
