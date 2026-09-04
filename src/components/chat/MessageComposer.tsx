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
  X,
  Mic,
  Search,
} from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { VoiceInputButton } from "./VoiceInputButton";
import { cn } from "@/lib/utils";

interface UploadedImageState {
  id: string;
  name: string;
  url: string;
  sizeBytes: number;
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
  const [attachedImage, setAttachedImage] = useState<UploadedImageState | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

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

  const handleFileSelect = (file: File) => {
    setUploadError(null);

    // Validate size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image exceeds maximum 10MB limit.");
      return;
    }

    // Validate MIME
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files (JPEG, PNG, WebP, GIF) are supported.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setAttachedImage({
        id: `img-${Date.now()}`,
        name: file.name,
        url,
        sizeBytes: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleVoiceToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setInput((prev) => (prev ? `${prev} ` : "") + "Voice input query...");
      setTimeout(() => setIsRecording(false), 2000);
    } else {
      setIsRecording(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isStreaming) {
      stopGeneration();
      return;
    }

    const text = input.trim();
    if (!text && !attachedImage) return;

    sendMessage(text || (attachedImage ? `Analyze attached image: ${attachedImage.name}` : ""), {
      mode: selectedMode,
      simulateError,
      attachments: attachedImage
        ? [
            {
              id: attachedImage.id,
              type: "image",
              name: attachedImage.name,
              url: attachedImage.url,
              sizeBytes: attachedImage.sizeBytes,
            },
          ]
        : undefined,
    });

    setInput("");
    handleRemoveImage();
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

  const canSubmit = input.trim().length > 0 || attachedImage !== null;

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pb-4 sm:pb-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
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
        {/* Attached Image Thumbnail Preview Card */}
        {attachedImage && (
          <div className="px-4 pt-3 pb-1">
            <div className="relative inline-flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachedImage.url}
                alt={attachedImage.name}
                className="w-12 h-12 rounded-lg object-cover border border-[var(--border)]"
              />
              <div className="flex flex-col text-xs max-w-[200px] truncate">
                <span className="font-medium text-[var(--foreground)] truncate">
                  {attachedImage.name}
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  {(attachedImage.sizeBytes / 1024).toFixed(0)} KB • Image
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-1 rounded-full bg-[var(--card)] text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 border border-[var(--border)] transition-colors cursor-pointer ml-1"
                title="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
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
              : attachedImage
              ? "Ask a question about this image, extract data, or describe..."
              : "What can I help you with? Ask anything, research, or code..."
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

            {/* Attach Image / Document Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer",
                attachedImage
                  ? "text-sky-500 bg-sky-500/15"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
              title="Attach image or document"
              aria-label="Attach file"
            >
              {attachedImage ? (
                <ImageIcon className="w-3.5 h-3.5" />
              ) : (
                <Paperclip className="w-3.5 h-3.5" />
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
    </div>
  );
}
