"use client";

import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { ChatMessage, ChatConversation, AIStreamEvent, ChatAttachment } from "@/types/chat";
import { generateId } from "@/lib/utils";

interface SendMessageOptions {
  mode?: "auto" | "fast" | "reasoning" | "research";
  simulateError?: boolean;
  attachments?: ChatAttachment[];
}

interface ChatContextType {
  conversations: ChatConversation[];
  activeConversationId: string;
  messages: ChatMessage[];
  isStreaming: boolean;
  activeStatusMessage: string | null;
  selectedMode: "auto" | "fast" | "reasoning" | "research";
  setSelectedMode: (mode: "auto" | "fast" | "reasoning" | "research") => void;
  sendMessage: (content: string, options?: SendMessageOptions) => Promise<void>;
  stopGeneration: () => void;
  regenerateResponse: (messageId: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  createNewConversation: () => string;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  clearConversation: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const INITIAL_CONVERSATION_ID = "conv-welcome";

const INITIAL_CONVERSATIONS: ChatConversation[] = [
  {
    id: INITIAL_CONVERSATION_ID,
    title: "Welcome to My AI",
    createdAt: Date.now() - 1000 * 60 * 60,
    updatedAt: Date.now() - 1000 * 60 * 60,
  },
];

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<ChatConversation[]>(INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string>(INITIAL_CONVERSATION_ID);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({
    [INITIAL_CONVERSATION_ID]: [],
  });
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [activeStatusMessage, setActiveStatusMessage] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<"auto" | "fast" | "reasoning" | "research">("auto");

  const abortControllerRef = useRef<AbortController | null>(null);

  const activeMessages = messagesByConversation[activeConversationId] || [];

  const updateMessage = useCallback(
    (convId: string, messageId: string, updater: (prev: ChatMessage) => ChatMessage) => {
      setMessagesByConversation((prev) => {
        const list = prev[convId] || [];
        const nextList = list.map((msg) => (msg.id === messageId ? updater(msg) : msg));
        return { ...prev, [convId]: nextList };
      });
    },
    []
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setActiveStatusMessage(null);

    // Update active streaming message to stopped status
    setMessagesByConversation((prev) => {
      const list = prev[activeConversationId] || [];
      const updated = list.map((msg) =>
        msg.status === "streaming" || msg.status === "sending"
          ? { ...msg, status: "stopped" as const }
          : msg
      );
      return { ...prev, [activeConversationId]: updated };
    });
  }, [activeConversationId]);

  const executeStream = useCallback(
    async (
      convId: string,
      assistantMessageId: string,
      conversationMessages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
      options?: SendMessageOptions
    ) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsStreaming(true);
      setActiveStatusMessage("Thinking...");

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: convId,
            messages: conversationMessages,
            mode: options?.mode || selectedMode,
            attachments: options?.attachments,
            simulateError: options?.simulateError,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: "Server response error" }));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body received from stream");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const jsonStr = trimmed.replace(/^data:\s*/, "");
            if (!jsonStr) continue;

            try {
              const event: AIStreamEvent = JSON.parse(jsonStr);

              if (event.type === "status") {
                setActiveStatusMessage(event.message || null);
              } else if (event.type === "reasoning-delta" && event.delta) {
                updateMessage(convId, assistantMessageId, (prev) => ({
                  ...prev,
                  reasoning: (prev.reasoning || "") + event.delta,
                  status: "streaming",
                }));
              } else if (event.type === "text-delta" && event.delta) {
                updateMessage(convId, assistantMessageId, (prev) => ({
                  ...prev,
                  content: prev.content + event.delta,
                  status: "streaming",
                }));
              } else if (event.type === "error") {
                updateMessage(convId, assistantMessageId, (prev) => ({
                  ...prev,
                  status: "error",
                  error: event.error || "An unexpected error occurred",
                }));
              } else if (event.type === "done") {
                updateMessage(convId, assistantMessageId, (prev) => ({
                  ...prev,
                  status: event.finishReason === "abort" ? "stopped" : "completed",
                }));
              }
            } catch (parseErr) {
              console.error("Failed to parse SSE line:", line, parseErr);
            }
          }
        }

        // Finalize status
        updateMessage(convId, assistantMessageId, (prev) => ({
          ...prev,
          status: prev.status === "error" || prev.status === "stopped" ? prev.status : "completed",
        }));
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          updateMessage(convId, assistantMessageId, (prev) => ({
            ...prev,
            status: "stopped",
          }));
        } else {
          const msg = err instanceof Error ? err.message : "Failed to connect to assistant service";
          updateMessage(convId, assistantMessageId, (prev) => ({
            ...prev,
            status: "error",
            error: msg,
          }));
        }
      } finally {
        setIsStreaming(false);
        setActiveStatusMessage(null);
        abortControllerRef.current = null;
      }
    },
    [selectedMode, updateMessage]
  );

  const sendMessage = useCallback(
    async (content: string, options?: SendMessageOptions) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) return;

      const userMsgId = generateId();
      const assistantMsgId = generateId();

      const userMessage: ChatMessage = {
        id: userMsgId,
        conversationId: activeConversationId,
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
        status: "completed",
        attachments: options?.attachments,
      };

      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        conversationId: activeConversationId,
        role: "assistant",
        content: "",
        createdAt: Date.now() + 1,
        status: "sending",
      };

      // Auto update conversation title on first message
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversationId && (c.title === "New Chat" || c.title === "Welcome to My AI")) {
            const newTitle = trimmed.length > 28 ? trimmed.substring(0, 28) + "..." : trimmed;
            return { ...c, title: newTitle, updatedAt: Date.now() };
          }
          return c;
        })
      );

      const existingMessages = messagesByConversation[activeConversationId] || [];
      const updatedMessages = [...existingMessages, userMessage, assistantMessage];

      setMessagesByConversation((prev) => ({
        ...prev,
        [activeConversationId]: updatedMessages,
      }));

      const contextPayload = [...existingMessages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      await executeStream(activeConversationId, assistantMsgId, contextPayload, options);
    },
    [activeConversationId, isStreaming, messagesByConversation, executeStream]
  );

  const regenerateResponse = useCallback(
    async (messageId: string) => {
      if (isStreaming) return;

      const currentList = messagesByConversation[activeConversationId] || [];
      const targetIndex = currentList.findIndex((m) => m.id === messageId);
      if (targetIndex === -1) return;

      const targetMsg = currentList[targetIndex];
      // If target is assistant, regenerate this assistant message using previous user messages
      let assistantMsgId = targetMsg.id;
      let userContext: ChatMessage[] = [];

      if (targetMsg.role === "assistant") {
        userContext = currentList.slice(0, targetIndex);
      } else {
        // Target is user message, find assistant message following it
        userContext = currentList.slice(0, targetIndex + 1);
        const nextMsg = currentList[targetIndex + 1];
        if (nextMsg && nextMsg.role === "assistant") {
          assistantMsgId = nextMsg.id;
        } else {
          assistantMsgId = generateId();
        }
      }

      // Reset assistant message
      updateMessage(activeConversationId, assistantMsgId, (prev) => ({
        ...prev,
        content: "",
        reasoning: undefined,
        status: "sending",
        error: undefined,
      }));

      const payload = userContext.map((m) => ({ role: m.role, content: m.content }));
      await executeStream(activeConversationId, assistantMsgId, payload);
    },
    [activeConversationId, isStreaming, messagesByConversation, executeStream, updateMessage]
  );

  const retryMessage = useCallback(
    async (messageId: string) => {
      await regenerateResponse(messageId);
    },
    [regenerateResponse]
  );

  const createNewConversation = useCallback(() => {
    if (isStreaming) {
      stopGeneration();
    }
    const newId = `conv-${generateId()}`;
    const newConv: ChatConversation = {
      id: newId,
      title: "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setConversations((prev) => [newConv, ...prev]);
    setMessagesByConversation((prev) => ({ ...prev, [newId]: [] }));
    setActiveConversationId(newId);
    return newId;
  }, [isStreaming, stopGeneration]);

  const selectConversation = useCallback(
    (id: string) => {
      if (id === activeConversationId) return;
      if (isStreaming) {
        stopGeneration();
      }
      setActiveConversationId(id);
    },
    [activeConversationId, isStreaming, stopGeneration]
  );

  const deleteConversation = useCallback(
    (id: string) => {
      if (isStreaming && id === activeConversationId) {
        stopGeneration();
      }

      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== id);
        if (remaining.length === 0) {
          const freshId = `conv-${generateId()}`;
          const freshConv: ChatConversation = {
            id: freshId,
            title: "New Chat",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setActiveConversationId(freshId);
          setMessagesByConversation((mPrev) => ({ ...mPrev, [freshId]: [] }));
          return [freshConv];
        } else if (id === activeConversationId) {
          setActiveConversationId(remaining[0].id);
        }
        return remaining;
      });

      setMessagesByConversation((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    },
    [activeConversationId, isStreaming, stopGeneration]
  );

  const clearConversation = useCallback(() => {
    if (isStreaming) {
      stopGeneration();
    }
    setMessagesByConversation((prev) => ({
      ...prev,
      [activeConversationId]: [],
    }));
  }, [activeConversationId, isStreaming, stopGeneration]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        messages: activeMessages,
        isStreaming,
        activeStatusMessage,
        selectedMode,
        setSelectedMode,
        sendMessage,
        stopGeneration,
        regenerateResponse,
        retryMessage,
        createNewConversation,
        selectConversation,
        deleteConversation,
        clearConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
