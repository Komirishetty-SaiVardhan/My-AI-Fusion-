"use client";

import React, { useState, memo } from "react";
import { Check, Copy, Play } from "lucide-react";
import { PythonSandbox } from "@/components/repl/PythonSandbox";

interface CodeBlockProps {
  language?: string;
  value: string;
  onOpenSandbox?: () => void;
}

function CodeBlockComponent({ language, value, onOpenSandbox }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [showPythonRepl, setShowPythonRepl] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const displayLang = (language || "text").toLowerCase();
  const isPython = displayLang === "python" || displayLang === "py";
  const isPreviewable =
    ["html", "jsx", "tsx", "javascript", "js", "svg", "css"].includes(displayLang) ||
    value.includes("<!DOCTYPE html>") ||
    value.includes("<svg");

  if (isPython && showPythonRepl) {
    return (
      <div className="relative my-3">
        <div className="flex justify-end mb-1">
          <button
            onClick={() => setShowPythonRepl(false)}
            className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 cursor-pointer"
          >
            ← View Raw Code
          </button>
        </div>
        <PythonSandbox initialCode={value} />
      </div>
    );
  }

  return (
    <div className="relative my-3 rounded-lg overflow-hidden border border-[var(--code-border)] bg-[var(--code-bg)] text-[var(--code-foreground)] shadow-md [contain:content]">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[var(--code-header)] border-b border-[var(--code-border)] text-xs text-slate-400 select-none">
        <span className="font-mono font-medium tracking-wider uppercase text-[11px] text-sky-400">
          {displayLang}
        </span>
        <div className="flex items-center gap-2">
          {isPython && (
            <button
              onClick={() => setShowPythonRepl(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:text-white transition-colors cursor-pointer text-[11px] font-medium"
              title="Execute in In-Browser Python WebAssembly Sandbox"
            >
              <Play className="w-3 h-3 fill-current text-emerald-400" />
              <span>Run Python</span>
            </button>
          )}
          {isPreviewable && onOpenSandbox && (
            <button
              onClick={onOpenSandbox}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 hover:text-white transition-colors cursor-pointer text-[11px] font-medium"
              title="Open in Interactive Live Sandbox"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Preview Sandbox</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
            title="Copy code"
            aria-label="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content */}
      <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed selection:bg-sky-500/30">
        <code>{value}</code>
      </pre>
    </div>
  );
}

export const CodeBlock = memo(CodeBlockComponent);
