/**
 * Cloud Sync Utility for Multi-Device History Syncing
 * Developed by Komirishetty Sai Vardhan
 */

export interface CloudSyncPayload {
  conversations: unknown[];
  messagesByConversation: Record<string, unknown[]>;
  activeConversationId?: string;
}

let syncTimeout: NodeJS.Timeout | null = null;

export async function syncToCloud(payload: CloudSyncPayload): Promise<boolean> {
  try {
    const res = await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Debounced background cloud sync
 */
export function queueCloudSync(payload: CloudSyncPayload, delayMs: number = 2000): void {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    syncToCloud(payload).catch(() => {});
  }, delayMs);
}

export async function fetchFromCloud(): Promise<CloudSyncPayload | null> {
  try {
    const res = await fetch("/api/history");
    if (!res.ok) return null;
    const data = await res.json();
    if (data && Array.isArray(data.conversations) && data.conversations.length > 0) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}
