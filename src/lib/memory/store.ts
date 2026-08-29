import { Memory, MemoryFilter } from "./types";

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
