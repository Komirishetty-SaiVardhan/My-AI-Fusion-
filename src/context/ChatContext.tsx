"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { useUser } from "@clerk/nextjs";
import { ChatMessage, ChatConversation, AIStreamEvent, ChatAttachment } from "@/types/chat";
import { generateId } from "@/lib/utils";
import { queueCloudSync, fetchFromCloud } from "@/lib/cloud-sync";

interface SendMessageOptions {
  mode?: "auto" | "fast" | "reasoning" | "research";
  model?: string;
  temperature?: number;
  customInstructions?: string;
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
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  customInstructions: string;
  setCustomInstructions: (instructions: string) => void;
  pinnedConversations: string[];
  togglePinConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  exportAllConversations: () => unknown;
  importConversations: (data: unknown) => boolean;
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

const DEFAULT_CONVERSATIONS: ChatConversation[] = [
  {
    id: INITIAL_CONVERSATION_ID,
    title: "Welcome to My AI",
    createdAt: Date.now() - 1000 * 60 * 60,
    updatedAt: Date.now() - 1000 * 60 * 60,
  },
];

const STORAGE_PREFIX = "my_ai_history_";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  const [conversations, setConversations] = useState<ChatConversation[]>(DEFAULT_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string>(INITIAL_CONVERSATION_ID);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({
    [INITIAL_CONVERSATION_ID]: [],
  });
  const [pinnedConversations, setPinnedConversations] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.6-flash");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [customInstructions, setCustomInstructions] = useState<string>("");

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [activeStatusMessage, setActiveStatusMessage] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<"auto" | "fast" | "reasoning" | "research">("auto");
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isHydratedRef = useRef<boolean>(false);

  // Compute storage key tied directly to authenticated user ID or email (e.g. Gmail login)
  const userKey = user?.id || (user?.primaryEmailAddress?.emailAddress ? user.primaryEmailAddress.emailAddress.replace(/[^a-zA-Z0-9_-]/g, "_") : "guest");
  const storageKey = `${STORAGE_PREFIX}${userKey}`;

  // 1. HYDRATION: Load user-specific history from permanent local storage & cloud backup
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.conversations) && parsed.conversations.length > 0) {
          setConversations(parsed.conversations);
          setMessagesByConversation(parsed.messagesByConversation || {});
          setActiveConversationId(parsed.activeConversationId || parsed.conversations[0].id);
          if (Array.isArray(parsed.pinnedConversations)) {
            setPinnedConversations(parsed.pinnedConversations);
          }
          if (parsed.selectedModel) {
            const upgradedModel =
              parsed.selectedModel === "gemini-flash-latest" ||
              parsed.selectedModel === "gemini-2.5-flash" ||
              parsed.selectedModel === "gemini-2.0-flash" ||
              parsed.selectedModel === "gemini-1.5-flash"
                ? "gemini-3.6-flash"
                : parsed.selectedModel === "gemini-pro-latest" || parsed.selectedModel === "gemini-1.5-pro"
                ? "gemini-3.7-flash"
                : parsed.selectedModel === "gpt-4o"
                ? "gemini-3.5-flash"
                : parsed.selectedModel === "llama3.2:latest" || parsed.selectedModel === "llama3.2"
                ? "gemini-3.5-flash-lite"
                : parsed.selectedModel;
            setSelectedModel(upgradedModel);
          }
          if (typeof parsed.temperature === "number") setTemperature(parsed.temperature);
          if (parsed.customInstructions) setCustomInstructions(parsed.customInstructions);
          setIsHydrated(true);
          isHydratedRef.current = true;
          return;
        }
      }

      // Check guest chats to migrate
      if (userKey !== "guest") {
        const guestStored = localStorage.getItem(`${STORAGE_PREFIX}guest`);
        if (guestStored) {
          const guestParsed = JSON.parse(guestStored);
          if (Array.isArray(guestParsed.conversations) && guestParsed.conversations.length > 0) {
            setConversations(guestParsed.conversations);
            setMessagesByConversation(guestParsed.messagesByConversation || {});
            setActiveConversationId(guestParsed.activeConversationId || guestParsed.conversations[0].id);
            if (Array.isArray(guestParsed.pinnedConversations)) {
              setPinnedConversations(guestParsed.pinnedConversations);
            }
            setIsHydrated(true);
            isHydratedRef.current = true;
            return;
          }
        }
      }

      // Fresh default state
      setConversations(DEFAULT_CONVERSATIONS);
      setActiveConversationId(INITIAL_CONVERSATION_ID);
      setMessagesByConversation({ [INITIAL_CONVERSATION_ID]: [] });
    } catch (err) {
      console.warn("Could not load stored chat history:", err);
    } finally {
      setIsHydrated(true);
      isHydratedRef.current = true;
    }
  }, [isLoaded, userKey, storageKey]);

  // 2. PERSISTENCE: Save conversations and messages to localStorage & queue cloud sync
  useEffect(() => {
    if (!isHydratedRef.current || typeof window === "undefined") return;

    try {
      const payload = {
        conversations,
        messagesByConversation,
        activeConversationId,
        pinnedConversations,
        selectedModel,
        temperature,
        customInstructions,
        userKey,
        savedAt: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));

      if (userKey !== "guest") {
        queueCloudSync({
          conversations,
          messagesByConversation,
          activeConversationId,
        });
      }
    } catch (err) {
      console.warn("Failed to persist chat history:", err);
    }
  }, [
    conversations,
    messagesByConversation,
    activeConversationId,
    pinnedConversations,
    selectedModel,
    temperature,
    customInstructions,
    storageKey,
    userKey,
  ]);

  const activeMessages = messagesByConversation[activeConversationId] || [];

  const togglePinConversation = useCallback((id: string) => {
    setPinnedConversations((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const renameConversation = useCallback((id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  }, []);

  const exportAllConversations = useCallback(() => {
    return {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      user: userKey,
      conversations,
      messagesByConversation,
      pinnedConversations,
    };
  }, [conversations, messagesByConversation, pinnedConversations, userKey]);

  const importConversations = useCallback((data: unknown): boolean => {
    if (!data || typeof data !== "object") return false;
    const parsed = data as Record<string, unknown>;

    if (Array.isArray(parsed.conversations) && parsed.conversations.length > 0) {
      setConversations(parsed.conversations as ChatConversation[]);
      if (typeof parsed.messagesByConversation === "object") {
        setMessagesByConversation(parsed.messagesByConversation as Record<string, ChatMessage[]>);
      }
      if (Array.isArray(parsed.pinnedConversations)) {
        setPinnedConversations(parsed.pinnedConversations as string[]);
      }
      setActiveConversationId((parsed.conversations[0] as ChatConversation).id);
      return true;
    }
    return false;
  }, []);

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
        // Inject user custom instructions if present
        let payloadMessages = conversationMessages;
        if (customInstructions.trim()) {
          const hasSystem = payloadMessages.some((m) => m.role === "system");
          payloadMessages = hasSystem
            ? payloadMessages.map((m) =>
                m.role === "system" ? { ...m, content: `${customInstructions}\n\n${m.content}` } : m
              )
            : [{ role: "system" as const, content: customInstructions }, ...payloadMessages];
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: convId,
            messages: payloadMessages,
            mode: options?.mode || selectedMode,
            model: options?.model || selectedModel,
            temperature: options?.temperature ?? temperature,
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
                const msg = event.message || "";
                if (!msg || /gemini|openai|ollama|streaming from/i.test(msg)) {
                  setActiveStatusMessage("Thinking...");
                } else {
                  setActiveStatusMessage(msg);
                }
              } else if (event.type === "reasoning-delta" && event.delta) {
                updateMessage(convId, assistantMessageId, (prev) => ({
                  ...prev,
                  reasoning: (prev.reasoning || "") + event.delta,
                  status: "streaming",
                }));
              } else if (event.type === "text-delta" && event.delta) {
                setActiveStatusMessage(null);
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
    [selectedMode, selectedModel, temperature, customInstructions, updateMessage]
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

      // Append user and initial assistant message
      setMessagesByConversation((prev) => {
        const list = prev[activeConversationId] || [];
        return {
          ...prev,
          [activeConversationId]: [...list, userMessage, assistantMessage],
        };
      });

      // Prepare context window payload
      const currentList = messagesByConversation[activeConversationId] || [];
      const historyPayload = currentList
        .filter((m) => m.status === "completed" || m.status === "stopped")
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content }));

      const payload = [
        ...historyPayload,
        { role: "user" as const, content: trimmed },
      ];

      await executeStream(activeConversationId, assistantMsgId, payload, options);
    },
    [activeConversationId, isStreaming, messagesByConversation, executeStream]
  );

  const regenerateResponse = useCallback(
    async (messageId: string) => {
      if (isStreaming) return;

      const currentList = messagesByConversation[activeConversationId] || [];
      const msgIndex = currentList.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) return;

      const targetMsg = currentList[msgIndex];
      let assistantMsgId: string;
      let userContext: ChatMessage[];

      if (targetMsg.role === "assistant") {
        assistantMsgId = targetMsg.id;
        userContext = currentList.slice(0, msgIndex);
      } else {
        const nextMsg = currentList[msgIndex + 1];
        if (nextMsg && nextMsg.role === "assistant") {
          assistantMsgId = nextMsg.id;
          userContext = currentList.slice(0, msgIndex + 1);
        } else {
          assistantMsgId = generateId();
          userContext = currentList.slice(0, msgIndex + 1);
          setMessagesByConversation((prev) => {
            const list = prev[activeConversationId] || [];
            return {
              ...prev,
              [activeConversationId]: [
                ...list,
                {
                  id: assistantMsgId,
                  conversationId: activeConversationId,
                  role: "assistant",
                  content: "",
                  createdAt: Date.now(),
                  status: "sending",
                },
              ],
            };
          });
        }
      }

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

      setPinnedConversations((prev) => prev.filter((p) => p !== id));
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
        selectedModel,
        setSelectedModel,
        temperature,
        setTemperature,
        customInstructions,
        setCustomInstructions,
        pinnedConversations,
        togglePinConversation,
        renameConversation,
        exportAllConversations,
        importConversations,
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
