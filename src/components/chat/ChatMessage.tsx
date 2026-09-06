"use client";

import React, { useState, memo } from "react";
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
  FileCode,
  Video,
  Music,
  Printer,
  Download,
  PenTool,
} from "lucide-react";
import { ChatMessage as ChatMessageType } from "@/types/chat";
import { CodeBlock } from "./CodeBlock";
import { AutoInspectionDrawer } from "./AutoInspectionDrawer";
import { ImageCard } from "./ImageCard";
import { AudioReaderButton } from "./AudioReaderButton";
import { ChartRenderer, parseChartCodeBlock } from "./ChartRenderer";
import { HandwrittenNoteCard } from "./HandwrittenNoteCard";
import { SlideDeckViewer } from "@/components/slides/SlideDeckViewer";
import { MindMapViewer } from "@/components/mindmap/MindMapViewer";
import { ArtifactViewer } from "@/components/artifacts/ArtifactViewer";
import { InfiniteCanvas } from "@/components/canvas/InfiniteCanvas";
import { DebateViewer } from "@/components/debate/DebateViewer";
import { PythonSandbox } from "@/components/repl/PythonSandbox";
import { FlashcardDeck } from "@/components/study/FlashcardDeck";
import { AudioMeetingViewer } from "@/components/audio/AudioMeetingViewer";
import { DeepResearchViewer } from "@/components/research/DeepResearchViewer";
import { AgentTaskViewer } from "@/components/agent/AgentTaskViewer";
import { CognitiveStreamViewer } from "@/components/chat/CognitiveStreamViewer";
import { DocumentInspectorViewer } from "@/components/documents/DocumentInspectorViewer";
import { ProjectWorkspaceModal } from "@/components/workspace/ProjectWorkspaceModal";
import { EmotionalBadge } from "@/components/chat/EmotionalBadge";
import { ProactiveActionChips } from "@/components/chat/ProactiveActionChips";
import { analyzeMessageSentiment } from "@/lib/eq/engine";
import { generateProactiveSuggestions } from "@/lib/proactive/engine";
import { parseHandwrittenBlock } from "@/lib/handwriting/engine";
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

function ChatMessageComponent({ message, isLast }: ChatMessageProps) {
  const { regenerateResponse, retryMessage, isStreaming, sendMessage } = useChat();
  const [copied, setCopied] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(true);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [showHandwrittenView, setShowHandwrittenView] = useState(false);
  const [activeSandbox, setActiveSandbox] = useState<{ code: string; language: string } | null>(null);
  const [activeWorkspaceRaw, setActiveWorkspaceRaw] = useState<string | null>(null);

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
              <div className="flex flex-wrap gap-2 justify-end mb-1 max-w-xl">
                {message.attachments.map((att) => {
                  if (att.type === "image" && att.url) {
                    return (
                      <div
                        key={att.id}
                        className="relative overflow-hidden rounded-xl border border-[var(--border)] shadow-sm bg-[var(--card)] max-w-[240px] max-h-[160px]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={att.url}
                          alt={att.name}
                          decoding="async"
                          loading="lazy"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                    );
                  }

                  if (att.type === "video" && att.url) {
                    return (
                      <div
                        key={att.id}
                        className="relative overflow-hidden rounded-xl border border-[var(--border)] shadow-sm bg-black max-w-[280px]"
                      >
                        <video
                          src={att.url}
                          controls
                          className="w-full max-h-[180px] rounded-xl"
                        />
                      </div>
                    );
                  }

                  if (att.type === "audio" && att.url) {
                    return (
                      <div
                        key={att.id}
                        className="p-2 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm max-w-[280px]"
                      >
                        <audio src={att.url} controls className="w-full h-8" />
                      </div>
                    );
                  }

                  const isCode = /\.(ts|tsx|js|jsx|py|html|css|json|sql)$/i.test(att.name);
                  return (
                    <div
                      key={att.id}
                      className="inline-flex items-center gap-2 p-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm text-xs"
                    >
                      {isCode ? (
                        <FileCode className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                      <div className="flex flex-col text-left max-w-[180px] truncate">
                        <span className="font-medium text-[var(--foreground)] truncate text-[11px]" title={att.name}>
                          {att.name}
                        </span>
                        {att.sizeBytes ? (
                          <span className="text-[10px] text-[var(--muted-foreground)]">
                            {(att.sizeBytes / 1024).toFixed(0)} KB
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="px-4 py-2.5 rounded-2xl bg-[var(--user-bubble)] text-[var(--user-bubble-foreground)] text-sm shadow-sm whitespace-pre-wrap break-words">
              {message.content}
            </div>
          </div>
        ) : (
          /* Assistant Response Box */
          <div className="w-full text-sm text-[var(--foreground)]">
            {/* EQ Emotional & Contextual Tone Badge */}
            {isAssistant && message.content && message.content.length > 20 && (
              <div className="mb-2">
                <EmotionalBadge profile={analyzeMessageSentiment(message.content)} />
              </div>
            )}

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
                    p({ node, children, ...props }) {
                      const hasBlockChild =
                        node?.children?.some(
                          (child: any) =>
                            child.type === "element" &&
                            (child.tagName === "img" ||
                              child.tagName === "div" ||
                              child.tagName === "pre" ||
                              child.tagName === "table")
                        ) ||
                        React.Children.toArray(children).some(
                          (child) =>
                            React.isValidElement(child) &&
                            (typeof child.type === "function" ||
                              child.type === "div" ||
                              child.type === "pre")
                        );

                      if (hasBlockChild) {
                        return (
                          <div className="mb-3 last:mb-0 leading-relaxed" {...props}>
                            {children}
                          </div>
                        );
                      }
                      return (
                        <p className="mb-3 last:mb-0 leading-relaxed" {...props}>
                          {children}
                        </p>
                      );
                    },
                    pre({ children }) {
                      return <>{children}</>;
                    },
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

                      if (
                        match &&
                        (match[1] === "handwritten" ||
                          match[1] === "handwriting" ||
                          match[1] === "handnote" ||
                          match[1] === "cursive" ||
                          match[1] === "notes")
                      ) {
                        const parsed = parseHandwrittenBlock(rawCode);
                        return (
                          <HandwrittenNoteCard
                            initialText={parsed.text}
                            initialPaper={parsed.paper}
                            initialInk={parsed.ink}
                            initialFont={parsed.font}
                            initialTitle={parsed.title || docTitle}
                          />
                        );
                      }

                      if (
                        match &&
                        (match[1] === "slides" ||
                          match[1] === "presentation" ||
                          match[1] === "slidedeck" ||
                          match[1] === "deck")
                      ) {
                        return (
                          <SlideDeckViewer
                            rawContent={rawCode}
                            initialTitle={docTitle}
                          />
                        );
                      }

                      if (
                        match &&
                        (match[1] === "mindmap" ||
                          match[1] === "ideatree" ||
                          match[1] === "tree")
                      ) {
                        return (
                          <MindMapViewer
                            rawContent={rawCode}
                            initialTitle={docTitle}
                          />
                        );
                      }

                      if (
                        match &&
                        (match[1] === "canvas" ||
                          match[1] === "diagram" ||
                          match[1] === "whiteboard" ||
                          match[1] === "flowchart")
                      ) {
                        return (
                          <InfiniteCanvas
                            rawContent={rawCode}
                            initialTitle={docTitle}
                          />
                        );
                      }

                      if (
                        match &&
                        (match[1] === "debate" ||
                          match[1] === "experts" ||
                          match[1] === "panel")
                      ) {
                        return (
                          <DebateViewer
                            rawContent={rawCode}
                            initialTopic={docTitle}
                          />
                        );
                      }

                      if (
                        match &&
                        (match[1] === "python-repl" ||
                          match[1] === "python-run" ||
                          match[1] === "pyodide" ||
                          match[1] === "repl")
                      ) {
                        return (
                          <PythonSandbox
                            initialCode={rawCode}
                            title={docTitle}
                          />
                        );
                      }

                      if (
                        match &&
                        (match[1] === "flashcards" ||
                          match[1] === "quiz" ||
                          match[1] === "study" ||
                          match[1] === "deck")
                      ) {
                        return (
                          <FlashcardDeck
                            rawContent={rawCode}
                            initialTitle={docTitle}
                          />
                        );
                      }

                      if (
                        match &&
                        (match[1] === "meeting-summary" ||
                          match[1] === "audio-summary" ||
                          match[1] === "minutes")
                      ) {
                        return (
                          <AudioMeetingViewer
                            rawContent={rawCode}
                            initialTitle={docTitle}
                          />
                        );
                      }

                      if (
                        match &&
                        (match[1] === "deep-research" ||
                          match[1] === "research-report" ||
                          match[1] === "research-paper")
                      ) {
                        return (
                          <DeepResearchViewer
                            rawContent={rawCode}
                            initialTopic={docTitle}
                          />
                        );
                      }

                      if (
                        match &&
                        (match[1] === "agent-task" ||
                          match[1] === "agent" ||
                          match[1] === "autonomous-task")
                      ) {
                        return <AgentTaskViewer rawMarkdown={rawCode} />;
                      }

                      if (
                        match &&
                        (match[1] === "cognitive-stream" ||
                          match[1] === "thought-stream" ||
                          match[1] === "monologue")
                      ) {
                        return <CognitiveStreamViewer rawMarkdown={rawCode} defaultOpen={true} />;
                      }

                      if (
                        match &&
                        (match[1] === "document-inspect" ||
                          match[1] === "doc-inspect" ||
                          match[1] === "pdf-inspect")
                      ) {
                        return <DocumentInspectorViewer rawMarkdown={rawCode} />;
                      }

                      if (
                        match &&
                        (match[1] === "workspace" ||
                          match[1] === "project-files" ||
                          match[1] === "project-workspace")
                      ) {
                        return (
                          <div className="my-3 p-4 rounded-2xl border border-blue-500/30 bg-blue-950/20 text-white space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileCode className="w-5 h-5 text-blue-400" />
                                <span className="font-semibold text-xs text-blue-300">
                                  Multi-File Project Workspace
                                </span>
                              </div>
                              <button
                                onClick={() => setActiveWorkspaceRaw(rawCode)}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold shadow-md transition"
                              >
                                Open in IDE Workspace
                              </button>
                            </div>
                            <p className="text-xs text-zinc-400">
                              Interactive project workspace with file tree, editor, and live sandbox runner.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <CodeBlock
                          language={match ? match[1] : ""}
                          value={rawCode}
                          onOpenSandbox={() =>
                            setActiveSandbox({
                              code: rawCode,
                              language: match ? match[1] : "html",
                            })
                          }
                        />
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>

                {/* Optional Handwritten View expanded from Action Toolbar */}
                {showHandwrittenView && (
                  <HandwrittenNoteCard
                    initialText={message.content}
                    initialTitle={docTitle}
                  />
                )}

                {/* Interactive Code Sandbox Modal Drawer */}
                {activeSandbox && (
                  <div className="fixed inset-4 sm:inset-10 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-in fade-in">
                    <div className="w-full h-full max-w-5xl shadow-2xl rounded-2xl overflow-hidden">
                      <ArtifactViewer
                        code={activeSandbox.code}
                        language={activeSandbox.language}
                        title={docTitle}
                        onClose={() => setActiveSandbox(null)}
                      />
                    </div>
                  </div>
                )}

                {/* Interactive Multi-File Project Workspace Modal */}
                {activeWorkspaceRaw && (
                  <ProjectWorkspaceModal
                    isOpen={true}
                    onClose={() => setActiveWorkspaceRaw(null)}
                    rawMarkdown={activeWorkspaceRaw}
                  />
                )}

                {/* Proactive Anticipated Follow-up Action Chips */}
                {isAssistant && message.content && message.status !== "streaming" && isLast && (
                  <ProactiveActionChips
                    actions={generateProactiveSuggestions(message.content)}
                    onActionClick={(prompt) => sendMessage(prompt)}
                  />
                )}

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

            {/* Action Bar (Copy, Export PDF, Download, Handwrite, Regenerate) */}
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

                {/* Handwrite Convert Button */}
                <button
                  onClick={() => setShowHandwrittenView((prev) => !prev)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors text-xs cursor-pointer border",
                    showHandwrittenView
                      ? "bg-amber-500/15 border-amber-500/30 text-amber-500 font-medium"
                      : "border-transparent hover:border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-500"
                  )}
                  title="Render this response as a realistic handwritten note"
                  aria-label="Convert to handwritten note"
                >
                  <PenTool className="w-3 h-3 text-amber-500" />
                  <span>{showHandwrittenView ? "Hide Handwriting" : "Handwrite"}</span>
                </button>

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
                      className="absolute left-0 bottom-full mb-1 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5 dark:ring-white/10"
                      onMouseLeave={() => setExportMenuOpen(false)}
                    >
                      <button
                        onClick={() => {
                          setShowHandwrittenView(true);
                          setExportMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-amber-500/10 hover:text-amber-500 transition-colors cursor-pointer text-left font-medium"
                      >
                        <PenTool className="w-3.5 h-3.5 text-amber-500" />
                        <span>Handwritten Note (.png/.svg)</span>
                      </button>
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

export const ChatMessage = memo(ChatMessageComponent);

