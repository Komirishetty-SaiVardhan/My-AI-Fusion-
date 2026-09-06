"use client";

import React, { useState, memo } from "react";
import { runPythonCode } from "@/lib/repl/python-runner";
import { PythonExecutionResult } from "@/lib/repl/types";
import {
  Play,
  Terminal,
  Clock,
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  BarChart3,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PythonSandboxProps {
  initialCode: string;
  title?: string;
  className?: string;
}

function PythonSandboxComponent({
  initialCode,
  title = "In-Browser Python REPL",
  className,
}: PythonSandboxProps) {
  const [code, setCode] = useState(initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<PythonExecutionResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await runPythonCode(code);
      setResult(res);
    } catch (err: any) {
      setResult({
        stdout: "",
        stderr: err.message || "Failed to execute Python code.",
        plots: [],
        executionTimeMs: 0,
        success: false,
        error: err.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={cn(
        "my-4 rounded-2xl border border-[var(--border)] bg-slate-950 text-slate-100 shadow-xl overflow-hidden [contain:content]",
        className
      )}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold">
            🐍
          </div>
          <div className="truncate">
            <span className="font-semibold text-xs text-white block truncate">
              {title}
            </span>
            <span className="text-[10px] text-slate-400 block">
              WebAssembly Pyodide Sandbox • Client-Side Execution
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer",
              isRunning && "opacity-60 cursor-not-allowed"
            )}
            title="Execute Python code in WebAssembly sandbox"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Python</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              setCode(initialCode);
              setResult(null);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Reset code"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="relative">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={Math.min(14, Math.max(5, code.split("\n").length + 1))}
          className="w-full p-4 font-mono text-xs sm:text-sm bg-slate-950 text-emerald-400 border-none focus:outline-none resize-y leading-relaxed selection:bg-emerald-500/30"
          placeholder="# Write or edit Python code here..."
          spellCheck={false}
        />
      </div>

      {/* Execution Output Console */}
      {result && (
        <div className="border-t border-slate-800 bg-[#070b14] p-4 text-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Console Output</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                <Clock className="w-3 h-3 text-sky-400" />
                <span>{result.executionTimeMs}ms</span>
              </span>
              {result.success ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-semibold">
                  Exit 0
                </span>
              ) : (
                <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded font-semibold">
                  Error
                </span>
              )}
            </div>
          </div>

          {/* Stdout Output */}
          {result.stdout && (
            <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed py-1">
              {result.stdout}
            </pre>
          )}

          {/* Stderr / Error Output */}
          {result.stderr && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs whitespace-pre-wrap my-1.5 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{result.stderr}</span>
            </div>
          )}

          {/* Matplotlib Rendered Plots */}
          {result.plots && result.plots.length > 0 && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-1.5 text-sky-400 text-xs font-semibold">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Rendered Matplotlib Charts ({result.plots.length})</span>
              </div>
              {result.plots.map((plotSvg, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center shadow-lg"
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: plotSvg }}
                    className="max-w-full overflow-x-auto flex justify-center py-2"
                  />
                  <div className="w-full flex justify-end pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => {
                        const blob = new Blob([plotSvg], { type: "image/svg+xml;charset=utf-8" });
                        const link = document.createElement("a");
                        link.download = `plot_${idx + 1}.svg`;
                        link.href = URL.createObjectURL(blob);
                        link.click();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download SVG Chart</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const PythonSandbox = memo(PythonSandboxComponent);
