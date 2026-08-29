"use client";

import React, { useEffect } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  X,
  SidebarClose,
  SidebarOpen,
  Bot,
  User,
} from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
}

export function Sidebar({
  isOpenMobile,
  onCloseMobile,
  isCollapsedDesktop,
  onToggleCollapseDesktop,
}: SidebarProps) {
  const {
    conversations,
    activeConversationId,
    selectConversation,
    createNewConversation,
    deleteConversation,
  } = useChat();

  // Handle keyboard shortcut Ctrl+K / Cmd+K for new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        createNewConversation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createNewConversation]);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--sidebar)] text-[var(--foreground)] border-r border-[var(--sidebar-border)] select-none">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--sidebar-border)]">
        {!isCollapsedDesktop && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-[var(--foreground)]">
                My AI
              </span>
              <span className="text-[10px] text-sky-500 font-mono ml-1.5 px-1.5 py-0.2 rounded bg-sky-500/10">
                v1.0
              </span>
            </div>
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapseDesktop}
          className="hidden md:flex p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
          title={isCollapsedDesktop ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsedDesktop ? (
            <SidebarOpen className="w-4 h-4" />
          ) : (
            <SidebarClose className="w-4 h-4" />
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
          title="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={() => {
            createNewConversation();
            onCloseMobile();
          }}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs shadow-sm shadow-sky-500/20 transition-all cursor-pointer active:scale-[0.98]",
            isCollapsedDesktop && "md:px-2 md:justify-center"
          )}
          title="New Chat (Ctrl+K)"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          {!isCollapsedDesktop && <span>New Chat</span>}
          {!isCollapsedDesktop && (
            <kbd className="hidden lg:inline-block ml-auto text-[10px] bg-sky-600/60 px-1.5 py-0.5 rounded text-sky-100 font-sans">
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
        {!isCollapsedDesktop && (
          <div className="px-2 py-1 text-[11px] font-semibold tracking-wider text-[var(--muted-foreground)] uppercase">
            Recent Conversations
          </div>
        )}

        {conversations.map((conv) => {
          const isActive = conv.id === activeConversationId;
          return (
            <div
              key={conv.id}
              onClick={() => {
                selectConversation(conv.id);
                onCloseMobile();
              }}
              className={cn(
                "group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer select-none",
                isActive
                  ? "bg-[var(--card)] text-[var(--foreground)] font-medium shadow-xs border border-[var(--border)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
              title={conv.title}
            >
              <MessageSquare
                className={cn(
                  "w-3.5 h-3.5 flex-shrink-0",
                  isActive ? "text-sky-500" : "text-[var(--muted-foreground)]"
                )}
              />

              {!isCollapsedDesktop && (
                <>
                  <span className="truncate flex-1 text-left">{conv.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-500 hover:bg-red-500/10 transition-opacity cursor-pointer"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Section */}
      <div className="p-3 border-t border-[var(--sidebar-border)] space-y-2.5">
        {!isCollapsedDesktop && <ThemeToggle />}

        {/* User Status Bar */}
        <div
          className={cn(
            "flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-xs text-[var(--muted-foreground)]",
            isCollapsedDesktop && "justify-center px-0"
          )}
        >
          <div className="w-7 h-7 rounded-full bg-slate-700/20 border border-[var(--border)] flex items-center justify-center text-[var(--foreground)] font-semibold flex-shrink-0">
            <User className="w-3.5 h-3.5" />
          </div>
          {!isCollapsedDesktop && (
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-[var(--foreground)] truncate text-xs">
                My AI User
              </span>
              <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Ready
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:block h-full transition-all duration-300 ease-in-out flex-shrink-0",
          isCollapsedDesktop ? "w-16" : "w-64 lg:w-72"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
