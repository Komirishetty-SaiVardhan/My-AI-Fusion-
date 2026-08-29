export type AIErrorType =
  | "rate_limit"
  | "authentication"
  | "permission"
  | "not_found"
  | "timeout"
  | "server_error"
  | "invalid_request"
  | "network_error"
  | "unavailable"
  | "unknown";

export interface AIProviderErrorOptions {
  type: AIErrorType;
  message: string;
  statusCode?: number;
  providerName?: string;
  retryAfterMs?: number;
  isRetryable?: boolean;
  rawError?: unknown;
}

export class AIProviderError extends Error {
  readonly type: AIErrorType;
  readonly statusCode: number;
  readonly providerName: string;
  readonly retryAfterMs?: number;
  readonly isRetryable: boolean;
  readonly rawError?: unknown;

  constructor(options: AIProviderErrorOptions) {
    super(options.message);
    this.name = "AIProviderError";
    this.type = options.type;
    this.statusCode = options.statusCode ?? 500;
    this.providerName = options.providerName ?? "unknown";
    this.retryAfterMs = options.retryAfterMs;
    this.isRetryable =
      options.isRetryable ??
      (options.type === "rate_limit" ||
        options.type === "timeout" ||
        options.type === "server_error");
    this.rawError = options.rawError;
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      statusCode: this.statusCode,
      providerName: this.providerName,
      retryAfterMs: this.retryAfterMs,
      isRetryable: this.isRetryable,
    };
  }
}

export class ProviderUnavailableError extends AIProviderError {
  constructor(providerName: string, reason?: string) {
    super({
      type: "unavailable",
      message:
        reason ||
        `AI Provider "${providerName}" is not available or missing required credentials.`,
      statusCode: 503,
      providerName,
      isRetryable: false,
    });
    this.name = "ProviderUnavailableError";
  }
}

export class ProviderTimeoutError extends AIProviderError {
  constructor(providerName: string, timeoutMs: number) {
    super({
      type: "timeout",
      message: `Request to AI Provider "${providerName}" timed out after ${timeoutMs}ms.`,
      statusCode: 504,
      providerName,
      isRetryable: true,
    });
    this.name = "ProviderTimeoutError";
  }
}

export class RateLimitError extends AIProviderError {
  constructor(providerName: string, retryAfterMs?: number, message?: string) {
    super({
      type: "rate_limit",
      message:
        message ||
        `Rate limit exceeded for provider "${providerName}". Please retry shortly.`,
      statusCode: 429,
      providerName,
      retryAfterMs: retryAfterMs || 5000,
      isRetryable: true,
    });
    this.name = "RateLimitError";
  }
}
