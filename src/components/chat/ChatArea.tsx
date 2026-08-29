"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Menu,
  Plus,
  Trash2,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { ChatMessage } from "./ChatMessage";
import { MessageComposer } from "./MessageComposer";
import { EmptyState } from "./EmptyState";

interface ChatAreaProps {
  onToggleSidebar?: () => void;
}

export function ChatArea({ onToggleSidebar }: ChatAreaProps) {
  const {
    messages,
    conversations,
    activeConversationId,
    createNewConversation,
    clearConversation,
    isStreaming,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const userScrolledUpRef = useRef(false);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  // Check scroll position to determine if user scrolled away from bottom
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isUp = distanceFromBottom > 120;
    setShowScrollBottom(isUp);
    userScrolledUpRef.current = isUp;
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
    userScrolledUpRef.current = false;
    setShowScrollBottom(false);
  }, []);

  // Auto-scroll when messages update or stream unless user manually scrolled up
  useEffect(() => {
    if (!userScrolledUpRef.current) {
      scrollToBottom(false);
    }
  }, [messages, scrollToBottom]);

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--background)] relative">
      {/* Top Header Bar */}
      <header className="flex-shrink-0 flex items-center justify-between h-14 px-4 sm:px-6 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md z-10 select-none">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 -ml-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
            title="Open sidebar"
            aria-label="Open sidebar navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Conversation Title & Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-semibold text-sm sm:text-base text-[var(--foreground)] truncate">
              {activeConversation?.title || "My AI Chat"}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 font-medium">
              <Sparkles className="w-3 h-3" /> My AI Pro
            </span>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => createNewConversation()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--muted)] text-[var(--foreground)] hover:bg-sky-500 hover:text-white transition-all cursor-pointer shadow-sm"
            title="Start a new chat"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              disabled={isStreaming}
              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-40"
              title="Clear messages in this chat"
              aria-label="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Messages Scroll Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto flex flex-col relative"
      >
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex-1 max-w-4xl mx-auto w-full py-4 sm:py-6 space-y-1">
            {messages.map((msg, index) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isLast={index === messages.length - 1}
              />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            onClick={() => scrollToBottom(true)}
            className="fixed bottom-24 right-6 sm:right-10 z-20 flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] shadow-lg hover:border-sky-500 transition-all cursor-pointer text-xs font-medium animate-bounce"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-3.5 h-3.5 text-sky-500" />
            <span>Scroll to bottom</span>
          </button>
        )}
      </div>

      {/* Message Composer Area */}
      <footer className="flex-shrink-0">
        <MessageComposer />
      </footer>
    </main>
  );
}
