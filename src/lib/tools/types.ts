export type ToolPermissionLevel =
  | "read_only"
  | "computation"
  | "search"
  | "sensitive_action";

export interface ToolPermission {
  level: ToolPermissionLevel;
  requiresUserApproval?: boolean;
  dangerous?: boolean;
  reason?: string;
}

export interface ToolInputProperty {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: string[];
  required?: boolean;
  default?: unknown;
}

export interface ToolInputSchema {
  type: "object";
  properties: Record<string, ToolInputProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ToolCallContext {
  userId: string;
  conversationId: string;
  executionCount: number;
  maxExecutionsPerTurn: number;
  timeoutMs: number;
  grantedApprovalTokens?: Set<string>;
}

export interface ToolExecutionResult<T = unknown> {
  success: boolean;
  toolName: string;
  data?: T;
  error?: string;
  durationMs: number;
  requiresApproval?: boolean;
  approvalToken?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ITool<TInput = any, TOutput = any> {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: ToolInputSchema;
  readonly permissions: ToolPermission;
  isEnabled: boolean;

  validate(input: unknown): { isValid: boolean; error?: string; parsed?: TInput };
  execute(input: TInput, context: ToolCallContext): Promise<TOutput>;
}

export interface OpenAIToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: ToolInputSchema;
  };
}
