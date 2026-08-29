import {
  Memory,
  MemoryFilter,
  MemorySource,
  MemoryType,
  ScoredMemory,
} from "./types";
import { memoryEvaluator, MemoryEvaluator } from "./evaluator";
import { memoryRanker, MemoryRanker } from "./ranker";
import { isolatedMemoryStore, IsolatedMemoryStore } from "./store";
import { aiLogger } from "../ai/logger";

export class MemoryService {
  private evaluator: MemoryEvaluator;
  private ranker: MemoryRanker;
  private store: IsolatedMemoryStore;
  // User memory toggle: defaults to true unless explicitly disabled
  private disabledUsers: Set<string> = new Set();

  constructor(options?: {
    evaluator?: MemoryEvaluator;
    ranker?: MemoryRanker;
    store?: IsolatedMemoryStore;
  }) {
    this.evaluator = options?.evaluator || memoryEvaluator;
    this.ranker = options?.ranker || memoryRanker;
    this.store = options?.store || isolatedMemoryStore;
  }

  isMemoryEnabled(userId: string): boolean {
    return !this.disabledUsers.has(userId);
  }

  setMemoryEnabled(userId: string, enabled: boolean): void {
    if (enabled) {
      this.disabledUsers.delete(userId);
    } else {
      this.disabledUsers.add(userId);
    }
    aiLogger.info("memory_enabled_status_updated", { userId, enabled });
  }

  /**
   * Saves an explicit user memory (e.g. "Remember that I always use TypeScript").
   */
  async saveExplicitMemory(
    userId: string,
    content: string,
    options?: { projectId?: string; tags?: string[] }
  ): Promise<Memory> {
    if (!this.isMemoryEnabled(userId)) {
      throw new Error(`Memory is disabled for user ${userId}. Please enable memory in settings.`);
    }

    const evalResult = this.evaluator.evaluate(content, { isExplicit: true });
    if (!evalResult.shouldSave) {
      throw new Error(`Memory rejected: ${evalResult.reason}`);
    }

    const memoryId = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const memory: Memory = {
      id: memoryId,
      userId,
      projectId: options?.projectId,
      type: "explicit",
      source: "explicit_user_prompt",
      key: evalResult.key || "explicit_fact",
      content: evalResult.distilledFact || content.trim(),
      metadata: {
        confidence: 1.0,
        importance: evalResult.importance || 5,
        stabilityScore: evalResult.stabilityScore || 1.0,
        tags: options?.tags || ["explicit"],
      },
      createdAt: now,
      updatedAt: now,
    };

    await this.store.save(memory);
    aiLogger.info("explicit_memory_saved", { userId, memoryId, key: memory.key });
    return memory;
  }

  /**
   * Evaluates an incoming statement and saves it only if it represents a stable, useful fact.
   */
  async evaluateAndSave(
    userId: string,
    content: string,
    options?: { projectId?: string; source?: MemorySource; categoryHint?: MemoryType }
  ): Promise<Memory | null> {
    if (!this.isMemoryEnabled(userId)) {
      return null;
    }

    const evalResult = this.evaluator.evaluate(content, options);
    if (!evalResult.shouldSave) {
      return null;
    }

    const memoryId = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const memory: Memory = {
      id: memoryId,
      userId,
      projectId: options?.projectId,
      type: evalResult.type || "user_preference",
      source: evalResult.source || "inferred_preference",
      key: evalResult.key || "learned_fact",
      content: evalResult.distilledFact || content.trim(),
      metadata: {
        confidence: 0.9,
        importance: evalResult.importance,
        stabilityScore: evalResult.stabilityScore,
        tags: [evalResult.type || "preference"],
      },
      createdAt: now,
      updatedAt: now,
    };

    await this.store.save(memory);
    aiLogger.info("inferred_memory_saved", { userId, memoryId, type: memory.type });
    return memory;
  }

  /**
   * Retrieves user memories relevant to the given query, strictly filtered by userId.
   */
  async retrieveMemories(
    userId: string,
    query: string,
    options?: { projectId?: string; topK?: number; minScore?: number }
  ): Promise<ScoredMemory[]> {
    // If user disabled memory, return zero memories immediately
    if (!this.isMemoryEnabled(userId)) {
      return [];
    }

    const allUserMemories = this.store.listByUser(userId, {
      userId,
      projectId: options?.projectId,
    });

    if (allUserMemories.length === 0) {
      return [];
    }

    return this.ranker.rank(allUserMemories, query, {
      topK: options?.topK || 5,
      minScore: options?.minScore || 0.1,
    });
  }

  listMemories(userId: string, filter?: MemoryFilter): Memory[] {
    return this.store.listByUser(userId, filter);
  }

  async deleteMemory(userId: string, memoryId: string): Promise<boolean> {
    const deleted = await this.store.delete(userId, memoryId);
    if (deleted) {
      aiLogger.info("memory_deleted", { userId, memoryId });
    }
    return deleted;
  }

  async clearAllMemories(userId: string): Promise<void> {
    await this.store.clear(userId);
    aiLogger.info("all_user_memories_cleared", { userId });
  }

  /**
   * Formats retrieved memories for injection into system prompt context.
   */
  formatMemoriesForPrompt(memories: ScoredMemory[]): string {
    if (memories.length === 0) return "";

    const lines = ["### 🧠 User Preferences & Stored Context"];
    for (const item of memories) {
      const typeLabel = item.memory.type.replace(/_/g, " ").toUpperCase();
      lines.push(`- [${typeLabel}] ${item.memory.content}`);
    }

    return lines.join("\n");
  }
}

export const memoryService = new MemoryService();
