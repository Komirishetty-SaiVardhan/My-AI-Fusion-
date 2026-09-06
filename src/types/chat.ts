export type MessageRole = "user" | "assistant" | "system";

export type MessageStatus =
  | "sending"
  | "streaming"
  | "completed"
  | "error"
  | "stopped";

export interface ChatAttachment {
  id: string;
  type: "image" | "video" | "audio" | "file";
  name: string;
  url: string; // Ephemeral data: or blob: url
  mimeType?: string;
  sizeBytes?: number;
  extractedText?: string;
}

import { AutoExecutionDetails } from "@/lib/auto/types";

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  status: MessageStatus;
  error?: string;
  model?: string;
  reasoning?: string;
  attachments?: ChatAttachment[];
  autoDetails?: AutoExecutionDetails;
}

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model?: string;
  pinned?: boolean;
}

export interface AIResponse {
  id: string;
  content: string;
  reasoning?: string;
  finishReason: "stop" | "length" | "abort" | "error";
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export type AIStreamEventType =
  | "text-delta"
  | "reasoning-delta"
  | "status"
  | "error"
  | "done";

export interface AIStreamEvent {
  type: AIStreamEventType;
  delta?: string;
  message?: string;
  error?: string;
  finishReason?: "stop" | "length" | "abort" | "error";
}

export interface ChatRequestPayload {
  conversationId: string;
  messages: Array<{
    role: MessageRole;
    content: string;
    attachments?: ChatAttachment[];
  }>;
  model?: string;
  mode?: "auto" | "fast" | "reasoning" | "research";
  temperature?: number;
  attachments?: ChatAttachment[];
  simulateError?: boolean;
}
