type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  event: string;
  provider?: string;
  model?: string;
  durationMs?: number;
  statusCode?: number;
  errorType?: string;
  message?: string;
  [key: string]: unknown;
}

/**
 * Secret redactor: masks API keys, bearer tokens, and sensitive headers.
 */
function redactSecrets(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    return data
      .replace(/Bearer\s+([A-Za-z0-9_\-.~+/=]{6,})/gi, "Bearer [REDACTED]")
      .replace(/sk-[A-Za-z0-9_\-]{8,}/gi, "sk-[REDACTED]")
      .replace(/(?:api[_-]?key|key|secret|token)=([^&\s]+)/gi, "key=[REDACTED]");
  }

  if (Array.isArray(data)) {
    return data.map(redactSecrets);
  }

  if (typeof data === "object") {
    const redactedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      const lower = k.toLowerCase();
      if (
        lower.includes("key") ||
        lower.includes("secret") ||
        lower.includes("token") ||
        lower.includes("authorization") ||
        lower.includes("password")
      ) {
        redactedObj[k] = "[REDACTED]";
      } else {
        redactedObj[k] = redactSecrets(v);
      }
    }
    return redactedObj;
  }

  return data;
}

class AILogger {
  private format(level: LogLevel, payload: LogPayload): string {
    const sanitized = redactSecrets(payload) as LogPayload;
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context: "ai-service",
      ...sanitized,
    });
  }

  info(event: string, meta?: Omit<LogPayload, "event">): void {
    console.log(this.format("info", { event, ...meta }));
  }

  warn(event: string, meta?: Omit<LogPayload, "event">): void {
    console.warn(this.format("warn", { event, ...meta }));
  }

  error(event: string, meta?: Omit<LogPayload, "event">): void {
    console.error(this.format("error", { event, ...meta }));
  }

  debug(event: string, meta?: Omit<LogPayload, "event">): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.format("debug", { event, ...meta }));
    }
  }
}

export const aiLogger = new AILogger();
