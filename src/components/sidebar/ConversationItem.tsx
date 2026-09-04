"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Pin, PinOff, Edit2, Trash2, Check, X } from "lucide-react";
import { ChatConversation } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ConversationItemProps {
  conversation: ChatConversation;
  isActive: boolean;
  isPinned: boolean;
  isCollapsed: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onCloseMobile?: () => void;
}

export function ConversationItem({
  conversation,
  isActive,
  isPinned,
  isCollapsed,
  onSelect,
  onDelete,
  onTogglePin,
  onRename,
  onCloseMobile,
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditTitle(conversation.title);
  }, [conversation.title]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSaveRename = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== conversation.title) {
      onRename(conversation.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancelRename = () => {
    setEditTitle(conversation.title);
    setIsEditing(false);
  };

  if (isCollapsed) {
    return (
      <button
        onClick={() => onSelect(conversation.id)}
        className={cn(
          "w-full flex items-center justify-center p-2.5 rounded-xl transition-colors relative group",
          isActive
            ? "bg-sky-500/15 text-sky-500 font-medium"
            : "text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--foreground)]"
        )}
        title={conversation.title}
      >
        <MessageSquare className="w-4 h-4 flex-shrink-0" />
        {isPinned && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-500" />
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer",
        isActive
          ? "bg-sky-500/15 text-sky-500 font-medium shadow-xs"
          : "text-[var(--foreground)] hover:bg-[var(--sidebar-accent)]"
      )}
      onClick={() => {
        if (!isEditing) {
          onSelect(conversation.id);
          onCloseMobile?.();
        }
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
        <MessageSquare className={cn("w-3.5 h-3.5 flex-shrink-0 opacity-70", isActive && "text-sky-500 opacity-100")} />

        {isEditing ? (
          <form onSubmit={handleSaveRename} className="flex-1 flex items-center gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-1.5 py-0.5 rounded border border-sky-500 bg-[var(--card)] text-xs text-[var(--foreground)] focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Escape") handleCancelRename();
              }}
            />
            <button
              type="submit"
              className="p-1 text-emerald-500 hover:text-emerald-600 rounded"
              title="Save title"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleCancelRename}
              className="p-1 text-red-500 hover:text-red-600 rounded"
              title="Cancel"
            >
              <X className="w-3 h-3" />
            </button>
          </form>
        ) : (
          <span
            className="truncate flex-1 select-none"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            {conversation.title}
          </span>
        )}
      </div>

      {!isEditing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Pin Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(conversation.id);
            }}
            className={cn(
              "p-1 rounded hover:bg-[var(--muted)] transition-colors",
              isPinned ? "text-sky-500" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
            title={isPinned ? "Unpin chat" : "Pin chat to top"}
          >
            {isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
          </button>

          {/* Edit / Rename Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            title="Rename conversation"
          >
            <Edit2 className="w-3 h-3" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(conversation.id);
            }}
            className="p-1 rounded text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title="Delete conversation"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
