"use client";

import React, { useState } from "react";
import { FileText, Columns, AlignLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentDiffViewerProps {
  originalText: string;
  modifiedText: string;
  originalTitle?: string;
  modifiedTitle?: string;
  onClose?: () => void;
  className?: string;
}

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  text: string;
}

function computeSimpleDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const result: DiffLine[] = [];

  const maxLen = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === newLine) {
      if (oldLine !== undefined) {
        result.push({ type: "unchanged", text: oldLine });
      }
    } else {
      if (oldLine !== undefined && !newLines.includes(oldLine)) {
        result.push({ type: "removed", text: oldLine });
      }
      if (newLine !== undefined && !oldLines.includes(newLine)) {
        result.push({ type: "added", text: newLine });
      }
    }
  }

  return result;
}

export function DocumentDiffViewer({
  originalText,
  modifiedText,
  originalTitle = "Original Document",
  modifiedTitle = "Modified Version",
  onClose,
  className,
}: DocumentDiffViewerProps) {
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");

  const diffLines = computeSimpleDiff(originalText, modifiedText);

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-xl overflow-hidden my-4",
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--muted)]/50 border-b border-[var(--border)] text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-xs text-[var(--foreground)]">
            Document Diff Comparison
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-[var(--muted)] p-0.5 rounded-lg border border-[var(--border)]">
            <button
              onClick={() => setViewMode("split")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer",
                viewMode === "split" ? "bg-[var(--card)] text-sky-500 shadow-sm" : "text-[var(--muted-foreground)]"
              )}
            >
              <Columns className="w-3 h-3" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode("unified")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer",
                viewMode === "unified" ? "bg-[var(--card)] text-sky-500 shadow-sm" : "text-[var(--muted-foreground)]"
              )}
            >
              <AlignLeft className="w-3 h-3" />
              <span>Unified</span>
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-[var(--muted-foreground)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Diff Content Area */}
      {viewMode === "split" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)] text-xs font-mono max-h-80 overflow-y-auto">
          {/* Left: Original */}
          <div className="p-3 bg-red-500/5">
            <span className="font-sans font-semibold text-[11px] text-red-500 uppercase tracking-wider block mb-2">
              {originalTitle}
            </span>
            <div className="space-y-1 select-text">
              {originalText.split("\n").map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300">
                  {line || <br />}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Modified */}
          <div className="p-3 bg-emerald-500/5">
            <span className="font-sans font-semibold text-[11px] text-emerald-500 uppercase tracking-wider block mb-2">
              {modifiedTitle}
            </span>
            <div className="space-y-1 select-text">
              {modifiedText.split("\n").map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300">
                  {line || <br />}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Unified Diff */
        <div className="p-3 max-h-80 overflow-y-auto text-xs font-mono space-y-1 select-text">
          {diffLines.map((line, idx) => (
            <div
              key={idx}
              className={cn(
                "px-2 py-0.5 rounded whitespace-pre-wrap break-words",
                line.type === "added" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium",
                line.type === "removed" && "bg-red-500/15 text-red-600 dark:text-red-400 line-through opacity-75",
                line.type === "unchanged" && "text-slate-700 dark:text-slate-300 opacity-90"
              )}
            >
              <span className="inline-block w-4 select-none opacity-50 font-bold">
                {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
              </span>
              {line.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
