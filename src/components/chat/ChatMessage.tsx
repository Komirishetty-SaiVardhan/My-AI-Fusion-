"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  User,
  Copy,
  Check,
  RotateCw,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Square,
  FileDown,
  FileText,
  FileType,
  Printer,
  Download,
} from "lucide-react";
import { ChatMessage as ChatMessageType } from "@/types/chat";
import { CodeBlock } from "./CodeBlock";
import { AutoInspectionDrawer } from "./AutoInspectionDrawer";
import { ImageCard } from "./ImageCard";
import { AudioReaderButton } from "./AudioReaderButton";
import { ChartRenderer, parseChartCodeBlock } from "./ChartRenderer";
import { formatTime, cn } from "@/lib/utils";
import { useChat } from "@/context/ChatContext";
import {
  exportToPdf,
  downloadAsMarkdown,
  downloadAsDoc,
  downloadAsTxt,
} from "@/lib/export-document";

interface ChatMessageProps {
  message: ChatMessageType;
  isLast?: boolean;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { regenerateResponse, retryMessage, isStreaming } = useChat();
  const [copied, setCopied] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(true);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  // Extract a clean title from the document if available
  const firstHeadingMatch = message.content.match(/^#+\s+(.+)$/m);
  const docTitle = firstHeadingMatch ? firstHeadingMatch[1].trim() : "My AI Document";

  // Check if content looks like a structured document, report, or proposal
  const isDocumentLike =
    isAssistant &&
    message.content.length > 200 &&
    (message.content.includes("# ") ||
      message.content.includes("## ") ||
      message.content.includes("| ---") ||
      message.content.includes("Executive Summary") ||
      message.content.includes("Table of Contents"));

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleExportPdf = () => {
    exportToPdf({
      title: docTitle,
      content: message.content,
      author: "Komirishetty Sai Vardhan",
    });
    setExportMenuOpen(false);
  };

  const handleDownloadDoc = () => {
    downloadAsDoc(docTitle, message.content, "Komirishetty Sai Vardhan");
    setExportMenuOpen(false);
  };

  const handleDownloadMd = () => {
    downloadAsMarkdown(docTitle, message.content);
    setExportMenuOpen(false);
  };

  const handleDownloadTxt = () => {
    downloadAsTxt(docTitle, message.content);
    setExportMenuOpen(false);
  };

  return (
    <div
      className={cn(
        "group relative flex w-full gap-3.5 py-4 px-3 sm:px-5 transition-colors rounded-xl",
        isUser ? "justify-end" : "justify-start hover:bg-slate-500/5"
      )}
    >
      {/* Assistant Avatar */}
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/20 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      {/* Message Body */}
      <div
        className={cn(
          "flex flex-col min-w-0 max-w-[88%] sm:max-w-[80%]",
          isUser && "items-end"
        )}
      >
        {/* Author / Timestamp Header */}
        <div className="flex items-center gap-2 mb-1 text-[11px] text-[var(--muted-foreground)] select-none">
          <span className="font-medium">{isUser ? "You" : "My AI"}</span>
          <span>•</span>
          <span>{formatTime(message.createdAt)}</span>
          {message.status === "stopped" && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">
              <Square className="w-2.5 h-2.5 fill-current" /> Stopped
            </span>
          )}
        </div>

        {/* User Bubble */}
        {isUser ? (
          <div className="flex flex-col items-end gap-1.5">
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-end mb-1">
                {message.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="relative overflow-hidden rounded-xl border border-[var(--border)] shadow-sm bg-[var(--card)] max-w-[240px] max-h-[160px]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={att.url}
                      alt={att.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="px-4 py-2.5 rounded-2xl bg-[var(--user-bubble)] text-[var(--user-bubble-foreground)] text-sm shadow-sm whitespace-pre-wrap break-words">
              {message.content}
            </div>
          </div>
        ) : (
          /* Assistant Response Box */
          <div className="w-full text-sm text-[var(--foreground)]">
            {/* Collapsible Reasoning Process if available */}
            {message.reasoning && (
              <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 overflow-hidden text-xs">
                <button
                  onClick={() => setReasoningOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer select-none font-medium"
                >
                  <span className="flex items-center gap-1.5 text-sky-500">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Reasoning Process</span>
                  </span>
                  {reasoningOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
                {reasoningOpen && (
                  <div className="px-3.5 py-2.5 border-t border-[var(--border)] text-[var(--muted-foreground)] font-mono text-[11px] whitespace-pre-wrap leading-relaxed bg-[var(--card)]/40">
                    {message.reasoning}
                  </div>
                )}
              </div>
            )}

            {/* Document Header Banner for structured documents / reports */}
            {isDocumentLike && message.status !== "streaming" && (
              <div className="mb-3 p-2.5 rounded-xl border border-sky-500/20 bg-sky-500/5 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-[var(--foreground)] truncate block">
                      {docTitle}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      Publication Ready Document
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={handleExportPdf}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-[11px] shadow-sm transition-colors cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Export PDF</span>
                  </button>
                  <button
                    onClick={handleDownloadDoc}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] font-medium text-[11px] transition-colors cursor-pointer"
                  >
                    <FileType className="w-3 h-3" />
                    <span>Word .doc</span>
                  </button>
                </div>
              </div>
            )}

            {/* Loading / Thinking indicator */}
            {message.status === "sending" && !message.content && (
              <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] py-2">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce"></span>
                </div>
                <span>Thinking...</span>
              </div>
            )}

            {/* Rendered Markdown Content */}
            {message.content && (
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img({ src, alt }) {
                      if (!src) return null;
                      return <ImageCard src={String(src)} alt={alt} />;
                    },
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const rawCode = String(children).replace(/\n$/, "");
                      const isInline = !match && !String(children).includes("\n");

                      if (isInline) {
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }

                      if (match && (match[1] === "chart" || match[1] === "json")) {
                        const chartConfig = parseChartCodeBlock(rawCode);
                        if (chartConfig) {
                          return <ChartRenderer chartData={chartConfig} />;
                        }
                      }

                      return (
                        <CodeBlock
                          language={match ? match[1] : ""}
                          value={rawCode}
                        />
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>

                {/* Streaming Blinking Cursor */}
                {message.status === "streaming" && (
                  <span className="animate-cursor" aria-hidden="true" />
                )}

                {/* Collapsible Auto Mode Execution Details for Advanced Users */}
                {message.autoDetails && (
                  <AutoInspectionDrawer details={message.autoDetails} />
                )}
              </div>
            )}

            {/* Error Message & Retry Banner */}
            {message.status === "error" && (
              <div className="mt-2.5 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{message.error || "An error occurred during generation."}</span>
                </div>
                <button
                  onClick={() => retryMessage(message.id)}
                  disabled={isStreaming}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer text-xs flex-shrink-0 shadow-sm"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Action Bar (Copy, Export PDF, Download, Regenerate) */}
            {message.content && message.status !== "streaming" && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[var(--muted-foreground)] opacity-85 group-hover:opacity-100 transition-opacity">
                {/* Copy Button */}
                <button
                  onClick={handleCopyMessage}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-xs cursor-pointer border border-transparent hover:border-[var(--border)]"
                  title="Copy message"
                  aria-label="Copy full message"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {/* Audio Listen / TTS Button */}
                <AudioReaderButton text={message.content} />

                {/* PDF Export Button */}
                <button
                  onClick={handleExportPdf}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-sky-500/10 hover:text-sky-500 transition-colors text-xs cursor-pointer border border-transparent hover:border-sky-500/20"
                  title="Export response as PDF document"
                  aria-label="Export response as PDF"
                >
                  <FileDown className="w-3 h-3 text-sky-500" />
                  <span>Export PDF</span>
                </button>

                {/* Document Download Dropdown Menu */}
                <div className="relative">
                  <button
                    onClick={() => setExportMenuOpen((prev) => !prev)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-xs cursor-pointer border border-transparent hover:border-[var(--border)]"
                    title="Download document in different formats"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                    <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                  </button>

                  {exportMenuOpen && (
                    <div
                      className="absolute left-0 bottom-full mb-1 w-44 rounded-xl border border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] shadow-lg p-1 z-40 animate-in fade-in zoom-in-95 duration-100"
                      onMouseLeave={() => setExportMenuOpen(false)}
                    >
                      <button
                        onClick={handleExportPdf}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-sky-500/10 hover:text-sky-500 transition-colors cursor-pointer text-left font-medium"
                      >
                        <Printer className="w-3.5 h-3.5 text-sky-500" />
                        <span>Print / PDF Document</span>
                      </button>
                      <button
                        onClick={handleDownloadDoc}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer text-left"
                      >
                        <FileType className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Word Document (.doc)</span>
                      </button>
                      <button
                        onClick={handleDownloadMd}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer text-left"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Markdown (.md)</span>
                      </button>
                      <button
                        onClick={handleDownloadTxt}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer text-left"
                      >
                        <FileDown className="w-3.5 h-3.5 text-slate-500" />
                        <span>Plain Text (.txt)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Regenerate Button */}
                <button
                  onClick={() => regenerateResponse(message.id)}
                  disabled={isStreaming}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-xs cursor-pointer disabled:opacity-40 border border-transparent hover:border-[var(--border)] ml-auto sm:ml-0"
                  title="Regenerate response"
                  aria-label="Regenerate this response"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground)] mt-0.5 shadow-sm">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
