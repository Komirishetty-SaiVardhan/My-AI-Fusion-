export interface PythonExecutionRequest {
  code: string;
  timeoutMs?: number;
}

export interface PythonExecutionResult {
  stdout: string;
  stderr: string;
  result?: string;
  plots: string[]; // SVG or Base64 PNG image strings
  executionTimeMs: number;
  success: boolean;
  error?: string;
}
