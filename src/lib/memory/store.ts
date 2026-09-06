import { Memory, MemoryFilter, UserMemoryItem, MemoryCategory } from "./types";

export class IsolatedMemoryStore {
  // Map of userId -> Map of memoryId -> Memory
  private store: Map<string, Map<string, Memory>> = new Map();

  async save(memory: Memory): Promise<Memory> {
    let userBucket = this.store.get(memory.userId);
    if (!userBucket) {
      userBucket = new Map();
      this.store.set(memory.userId, userBucket);
    }

    userBucket.set(memory.id, { ...memory });
    return { ...memory };
  }

  getById(userId: string, memoryId: string): Memory | undefined {
    const userBucket = this.store.get(userId);
    if (!userBucket) return undefined;
    const mem = userBucket.get(memoryId);
    return mem ? { ...mem } : undefined;
  }

  listByUser(userId: string, filter?: MemoryFilter): Memory[] {
    const userBucket = this.store.get(userId);
    if (!userBucket) return [];

    let list = Array.from(userBucket.values());

    if (filter?.projectId) {
      list = list.filter((m) => m.projectId === filter.projectId);
    }

    if (filter?.types && filter.types.length > 0) {
      const typeSet = new Set(filter.types);
      list = list.filter((m) => typeSet.has(m.type));
    }

    if (filter?.minImportance) {
      list = list.filter((m) => m.metadata.importance >= filter.minImportance!);
    }

    return list.map((m) => ({ ...m }));
  }

  async delete(userId: string, memoryId: string): Promise<boolean> {
    const userBucket = this.store.get(userId);
    if (!userBucket) return false;
    return userBucket.delete(memoryId);
  }

  async clear(userId: string): Promise<void> {
    this.store.delete(userId);
  }

  count(userId: string): number {
    return this.store.get(userId)?.size || 0;
  }
}

export const isolatedMemoryStore = new IsolatedMemoryStore();

// ==========================================
// Client-Side User Memory Hub Store
// ==========================================

const MEMORY_STORAGE_KEY = "my_ai_personal_memories_v1";

export const DEFAULT_INITIAL_MEMORIES: UserMemoryItem[] = [
  {
    id: "mem-creator",
    category: "bio",
    title: "User Identity & Creator",
    content: "Sai Vardhan (Komirishetty Sai Vardhan) is the author and architect of My AI.",
    createdAt: Date.now() - 1000000,
    pinned: true,
  },
  {
    id: "mem-stack",
    category: "tech-stack",
    title: "Preferred Tech Stack",
    content: "TypeScript, Next.js App Router, Tailwind CSS, WebAssembly, Google Gemini Models (3.6 Flash, 3.7 Pro).",
    createdAt: Date.now() - 800000,
    pinned: true,
  },
  {
    id: "mem-style",
    category: "preference",
    title: "Coding & Communication Style",
    content: "Prefers high-signal, clean, modular, production-ready TypeScript with strong typing and zero premature fluff.",
    createdAt: Date.now() - 600000,
    pinned: false,
  },
  {
    id: "mem-handwriting",
    category: "rule",
    title: "Deterministic Output Rule",
    content: "Always use deterministic text rendering for handwritten notes, presentations, and code sandboxes rather than relying on hallucinated image approximations.",
    createdAt: Date.now() - 400000,
    pinned: true,
  },
];

export function getStoredMemories(): UserMemoryItem[] {
  if (typeof window === "undefined") return DEFAULT_INITIAL_MEMORIES;

  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_MEMORIES));
      return DEFAULT_INITIAL_MEMORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_INITIAL_MEMORIES;
  } catch {
    return DEFAULT_INITIAL_MEMORIES;
  }
}

export function saveStoredMemories(memories: UserMemoryItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
  } catch {
    // ignore
  }
}

export function addMemory(item: Omit<UserMemoryItem, "id" | "createdAt">): UserMemoryItem {
  const memories = getStoredMemories();
  const newItem: UserMemoryItem = {
    ...item,
    id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: Date.now(),
  };
  const updated = [newItem, ...memories];
  saveStoredMemories(updated);
  return newItem;
}

export function updateMemory(id: string, updates: Partial<UserMemoryItem>): void {
  const memories = getStoredMemories();
  const updated = memories.map((m) => (m.id === id ? { ...m, ...updates } : m));
  saveStoredMemories(updated);
}

export function deleteMemory(id: string): void {
  const memories = getStoredMemories();
  const updated = memories.filter((m) => m.id !== id);
  saveStoredMemories(updated);
}

export function togglePinMemory(id: string): void {
  const memories = getStoredMemories();
  const updated = memories.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m));
  saveStoredMemories(updated);
}

/**
 * Format memories into context injection block for AI prompt
 */
export function buildMemoryContextPrompt(): string {
  const memories = getStoredMemories();
  if (memories.length === 0) return "";

  const items = memories.map(
    (m) => `- [${m.category.toUpperCase()}] ${m.title}: ${m.content}`
  );

  return `\n\n[USER MEMORY & KNOWLEDGE HUB]:\n${items.join("\n")}`;
}
