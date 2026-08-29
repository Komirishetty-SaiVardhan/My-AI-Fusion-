import { ITool, ToolCallContext } from "./types";

interface StoredToken {
  token: string;
  toolName: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export class PermissionManager {
  private activeTokens: Map<string, StoredToken> = new Map();
  private readonly TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Generates a signed approval token for a sensitive tool.
   */
  generateApprovalToken(toolName: string, userId: string): string {
    const random = Math.random().toString(36).substring(2, 10);
    const token = `appr_${toolName}_${Date.now()}_${random}`;
    const now = Date.now();

    this.activeTokens.set(token, {
      token,
      toolName,
      userId,
      createdAt: now,
      expiresAt: now + this.TOKEN_TTL_MS,
    });

    return token;
  }

  /**
   * Verifies if a given token is valid for the specified tool and user.
   */
  verifyApprovalToken(token: string, toolName: string, userId?: string): boolean {
    const record = this.activeTokens.get(token);
    if (!record) return false;

    if (Date.now() > record.expiresAt) {
      this.activeTokens.delete(token);
      return false;
    }

    if (record.toolName !== toolName) {
      return false;
    }

    if (userId && record.userId !== userId) {
      return false;
    }

    return true;
  }

  /**
   * Checks if tool invocation requires user confirmation before running.
   */
  checkApprovalRequired(
    tool: ITool,
    context: ToolCallContext
  ): { requiresApproval: boolean; token?: string } {
    if (!tool.permissions.requiresUserApproval) {
      return { requiresApproval: false };
    }

    // Check if approval has already been granted in this session/turn
    if (context.grantedApprovalTokens) {
      for (const token of context.grantedApprovalTokens) {
        if (this.verifyApprovalToken(token, tool.name, context.userId)) {
          return { requiresApproval: false };
        }
      }
    }

    // Generate approval requirement token
    const token = this.generateApprovalToken(tool.name, context.userId);
    return {
      requiresApproval: true,
      token,
    };
  }

  /**
   * Cleans up expired tokens.
   */
  pruneExpiredTokens(): void {
    const now = Date.now();
    for (const [token, record] of this.activeTokens.entries()) {
      if (now > record.expiresAt) {
        this.activeTokens.delete(token);
      }
    }
  }
}

export const permissionManager = new PermissionManager();
