"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowUp,
  Square,
  Sparkles,
  Zap,
  Brain,
  Globe,
  AlertCircle,
  Paperclip,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  FileCode,
  X,
  Search,
  Wand2,
  Radio,
  Link,
  Undo2,
  Loader2,
} from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { VoiceInputButton } from "./VoiceInputButton";
import { VoiceModeModal } from "@/components/voice/VoiceModeModal";
import { cn } from "@/lib/utils";
import { ChatAttachment } from "@/types/chat";

interface UploadedAttachmentState extends ChatAttachment {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "file";
  url: string;
  mimeType: string;
  sizeBytes: number;
  extractedText?: string;
}

export function MessageComposer() {
  const {
    sendMessage,
    isStreaming,
    stopGeneration,
    selectedMode,
    setSelectedMode,
    activeStatusMessage,
  } = useChat();

  const [input, setInput] = useState("");
  const [simulateError, setSimulateError] = useState(false);
  const [attachments, setAttachments] = useState<UploadedAttachmentState[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // New Feature States
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [previousPrompt, setPreviousPrompt] = useState<string | null>(null);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [input]);

  // URL Detection in prompt
  useEffect(() => {
    const urlMatch = input.match(/https?:\/\/[^\s]+/);
    if (urlMatch && urlMatch[0] !== detectedUrl) {
      setDetectedUrl(urlMatch[0]);
    } else if (!urlMatch && detectedUrl) {
      setDetectedUrl(null);
    }
  }, [input, detectedUrl]);

  const handleScrapeDetectedUrl = async () => {
    if (!detectedUrl || isScrapingUrl) return;
    setIsScrapingUrl(true);
    try {
      const res = await fetch("/api/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: detectedUrl }),
      });
      const data = await res.json();
      if (data.success && data.content) {
        const newAtt: UploadedAttachmentState = {
          id: `att-url-${Date.now()}`,
          name: data.title || "Webpage Document",
          type: "file",
          url: detectedUrl,
          mimeType: "text/plain",
          sizeBytes: data.extractedLength || data.content.length,
          extractedText: `--- Webpage Content (${data.url}) ---\nTitle: ${data.title}\n\n${data.content}`,
        };
        setAttachments((prev) => [...prev, newAtt]);
        setDetectedUrl(null);
      } else {
        setUploadError(data.error || "Failed to read webpage content");
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to read webpage content");
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!input.trim() || isEnhancing) return;
    setIsEnhancing(true);
    setPreviousPrompt(input);
    try {
      const res = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      if (data.success && data.enhanced) {
        setInput(data.enhanced);
      }
    } catch {
      // fallback
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUndoEnhance = () => {
    if (previousPrompt) {
      setInput(previousPrompt);
      setPreviousPrompt(null);
    }
  };

  const detectAttachmentType = (file: File): "image" | "video" | "audio" | "file" => {
    const mime = file.type.toLowerCase();
    const name = file.name.toLowerCase();

    if (mime.startsWith("image/") || /\.(jpe?g|png|webp|gif|svg|bmp|heic|heif)$/i.test(name)) {
      return "image";
    }
    if (mime.startsWith("video/") || /\.(mp4|webm|mov|avi|mkv|mpeg|m4v)$/i.test(name)) {
      return "video";
    }
    if (mime.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(name)) {
      return "audio";
    }
    return "file";
  };

  const handleFilesSelect = async (filesList: FileList | File[]) => {
    setUploadError(null);
    const files = Array.from(filesList);
    if (files.length === 0) return;

    for (const file of files) {
      // Validate individual size (< 25MB)
      if (file.size > 25 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds maximum 25MB limit.`);
        continue;
      }

      const type = detectAttachmentType(file);
      const mimeType = file.type || (type === "video" ? "video/mp4" : type === "audio" ? "audio/mp3" : type === "image" ? "image/jpeg" : "application/octet-stream");

      // Check if text-based file to extract raw text
      const isTextFile =
        type === "file" &&
        (mimeType.startsWith("text/") ||
          /\.(txt|csv|md|json|ts|tsx|js|jsx|py|html|css|xml|yaml|yml|sql|log)$/i.test(file.name));

      let extractedText: string | undefined = undefined;
      if (isTextFile) {
        try {
          extractedText = await file.text();
          if (extractedText.length > 50000) {
            extractedText = extractedText.substring(0, 50000) + "\n\n... [Content truncated at 50,000 characters]";
          }
        } catch {
          // Fallback
        }
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = (e.target?.result as string) || "";
        setAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            type,
            url,
            mimeType,
            sizeBytes: file.size,
            extractedText,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesSelect(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilesSelect(files);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isStreaming) {
      stopGeneration();
      return;
    }

    const text = input.trim();
    if (!text && attachments.length === 0) return;

    const defaultPrompt =
      attachments.length === 1
        ? `Analyze the attached ${attachments[0].type}: ${attachments[0].name}`
        : `Analyze the attached files: ${attachments.map((a) => a.name).join(", ")}`;

    sendMessage(text || defaultPrompt, {
      mode: selectedMode,
      simulateError,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    setInput("");
    setAttachments([]);
    setUploadError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = input.trim().length > 0 || attachments.length > 0;

  const renderAttachmentIcon = (type: "image" | "video" | "audio" | "file", name: string) => {
    if (type === "image") return <ImageIcon className="w-4 h-4 text-sky-500" />;
    if (type === "video") return <Video className="w-4 h-4 text-purple-500" />;
    if (type === "audio") return <Music className="w-4 h-4 text-emerald-500" />;
    if (/\.(ts|tsx|js|jsx|py|html|css|json|sql)$/i.test(name)) {
      return <FileCode className="w-4 h-4 text-amber-500" />;
    }
    return <FileText className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pb-4 sm:pb-6">
      {/* Hidden Multi-format File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.md,.json,.ts,.tsx,.js,.jsx,.py,.html,.css,.xml,.yaml,.yml,.sql,.log"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Streaming Status Helper Pill */}
      {isStreaming && activeStatusMessage && (
        <div className="flex items-center justify-center mb-2 select-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-500 text-xs font-medium animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{activeStatusMessage}</span>
          </div>
        </div>
      )}

      {/* Upload Error Alert */}
      {uploadError && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="hover:opacity-75 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Webpage Link Ingestion Pill Banner */}
      {detectedUrl && (
        <div className="mb-2 px-3 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 flex items-center justify-between text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <Link className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
            <span className="truncate text-[11px] text-[var(--foreground)]">
              Webpage Detected: <span className="font-mono text-sky-500">{detectedUrl}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={handleScrapeDetectedUrl}
            disabled={isScrapingUrl}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-[10px] shadow-sm transition-colors cursor-pointer flex-shrink-0 ml-2"
          >
            {isScrapingUrl ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Reading...</span>
              </>
            ) : (
              <span>Ingest & Summarize</span>
            )}
          </button>
        </div>
      )}

      {/* Main Composer Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg shadow-black/5 dark:shadow-black/20 focus-within:border-sky-500/60 focus-within:ring-2 focus-within:ring-sky-500/10 transition-all duration-200",
          isDragging && "border-sky-500 ring-2 ring-sky-500/20 bg-sky-500/5"
        )}
      >
        {/* Attached Files / Media Chips Preview Area */}
        {attachments.length > 0 && (
          <div className="px-3.5 pt-3 pb-1 flex flex-wrap gap-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative inline-flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-[var(--muted)] border border-[var(--border)] group max-w-[260px] animate-in fade-in duration-150"
              >
                {att.type === "image" && att.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-9 h-9 rounded-lg object-cover border border-[var(--border)] flex-shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-[var(--card)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                    {renderAttachmentIcon(att.type, att.name)}
                  </div>
                )}
                <div className="flex flex-col text-xs min-w-0 flex-1">
                  <span className="font-medium text-[var(--foreground)] truncate text-[11px]" title={att.name}>
                    {att.name}
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)] capitalize">
                    {(att.sizeBytes / 1024).toFixed(0)} KB • {att.type}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="p-1 rounded-full bg-[var(--card)] text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 border border-[var(--border)] transition-colors cursor-pointer flex-shrink-0"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isStreaming
              ? "My AI is streaming a response..."
              : attachments.length > 0
              ? `Ask anything about the ${attachments.length} attached ${attachments.length === 1 ? attachments[0].type : "files"}...`
              : "What can I help you with? Ask anything, research, analyze files..."
          }
          rows={1}
          disabled={isStreaming}
          className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none max-h-[180px] leading-relaxed"
          style={{ minHeight: "44px" }}
        />

        {/* Toolbar & Controls Bar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1 text-xs select-none">
          {/* Mode Selector Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {/* Auto Mode (Default) */}
            <button
              type="button"
              onClick={() => setSelectedMode("auto")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium text-xs",
                selectedMode === "auto"
                  ? "bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-500 font-semibold border border-sky-500/30 shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
              title="Auto Mode: Automatically chooses models, tools, and research depth"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode("fast")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium text-xs",
                selectedMode === "fast"
                  ? "bg-sky-500/15 text-sky-500 font-semibold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Fast</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode("reasoning")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium text-xs",
                selectedMode === "reasoning"
                  ? "bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 font-semibold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Reasoning</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode("research")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium text-xs",
                selectedMode === "research"
                  ? "bg-emerald-500/15 text-emerald-500 font-semibold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Research</span>
            </button>

            {/* Error Simulator Toggle for Testing */}
            <button
              type="button"
              onClick={() => setSimulateError((prev) => !prev)}
              title="Toggle simulated error to test retry UX"
              className={cn(
                "hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer text-[11px]",
                simulateError
                  ? "bg-red-500/15 text-red-500 font-medium"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Simulate Error</span>
            </button>
          </div>

          {/* Right Composer Actions */}
          <div className="flex items-center gap-1.5 ml-2">
            {/* Prompt Enhancer (Magic Wand) */}
            {input.trim() && (
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || isStreaming}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer text-amber-500 hover:bg-amber-500/15",
                  isEnhancing && "bg-amber-500/20 animate-pulse"
                )}
                title="Magic Wand: Expand and enhance prompt with high-context instructions"
                aria-label="Enhance prompt"
              >
                {isEnhancing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {/* Undo Enhanced Prompt */}
            {previousPrompt && (
              <button
                type="button"
                onClick={handleUndoEnhance}
                className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
                title="Undo prompt enhancement"
                aria-label="Undo enhance"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Real-Time Conversational Voice Mode (Gemini Live Orb) */}
            <button
              type="button"
              onClick={() => setIsVoiceModeOpen(true)}
              className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-500/15 hover:text-indigo-600 transition-colors cursor-pointer"
              title="Start Real-Time Voice Mode (Conversational Audio Orb)"
              aria-label="Voice Mode"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </button>

            {/* Web Search Toggle */}
            <button
              type="button"
              onClick={() => setSelectedMode(selectedMode === "research" ? "auto" : "research")}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer",
                selectedMode === "research"
                  ? "text-emerald-500 bg-emerald-500/15"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
              title="Toggle Web Search mode"
              aria-label="Web Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Voice Dictation Button */}
            <VoiceInputButton
              onTranscript={(text) => setInput((prev) => (prev ? prev + " " + text : text))}
              disabled={isStreaming}
            />

            {/* Attach Image / Video / Document Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer relative",
                attachments.length > 0
                  ? "text-sky-500 bg-sky-500/15"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
              title="Attach images, videos, audio, or documents"
              aria-label="Attach file"
            >
              <Paperclip className="w-3.5 h-3.5" />
              {attachments.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-sky-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {attachments.length}
                </span>
              )}
            </button>

            {/* Send OR Stop Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={stopGeneration}
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-transform active:scale-95 cursor-pointer shadow-sm shadow-red-500/20"
                title="Stop generation"
                aria-label="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!canSubmit}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 cursor-pointer shadow-sm",
                  canSubmit
                    ? "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/25 active:scale-95"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)] opacity-50 cursor-not-allowed"
                )}
                title="Send message (Enter)"
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Helper text */}
      <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[var(--muted-foreground)] select-none">
        <span>
          <kbd className="font-sans px-1 py-0.5 rounded bg-[var(--muted)] border border-[var(--border)] text-[10px]">Enter</kbd> to send, <kbd className="font-sans px-1 py-0.5 rounded bg-[var(--muted)] border border-[var(--border)] text-[10px]">Shift+Enter</kbd> for new line
        </span>
        <span className="hidden sm:inline">⚡ Auto Mode: Automatic Research & Reasoning</span>
      </div>

      {/* Voice Mode Floating Modal */}
      <VoiceModeModal
        isOpen={isVoiceModeOpen}
        onClose={() => setIsVoiceModeOpen(false)}
      />
    </div>
  );
}

