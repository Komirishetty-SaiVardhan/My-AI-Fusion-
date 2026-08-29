import { ITool, ToolCallContext, ToolInputSchema, ToolPermission } from "../types";

const FORBIDDEN_WORDS = [
  "process",
  "require",
  "import",
  "eval",
  "function",
  "window",
  "document",
  "global",
  "console",
  "constructor",
  "prototype",
  "class",
  "return",
  "fetch",
  "xmlhttprequest",
  "settimeout",
  "setinterval",
  "__proto__",
];

export interface CalculatorInput {
  expression: string;
}

export interface CalculatorOutput {
  expression: string;
  result: number;
  formatted: string;
}

export class CalculatorTool implements ITool<CalculatorInput, CalculatorOutput> {
  readonly name = "calculator";
  readonly description =
    "Safely evaluates mathematical and scientific expressions (arithmetic, powers, roots, trigonometry, logarithms).";
  readonly inputSchema: ToolInputSchema = {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description:
          "The mathematical expression to evaluate (e.g. 'sqrt(144) + 25 * 4', '2^8', 'sin(pi / 2)')",
        required: true,
      },
    },
    required: ["expression"],
  };

  readonly permissions: ToolPermission = {
    level: "computation",
    requiresUserApproval: false,
    dangerous: false,
  };

  isEnabled = true;

  validate(input: unknown): { isValid: boolean; error?: string; parsed?: CalculatorInput } {
    if (!input || typeof input !== "object") {
      return { isValid: false, error: "Input must be an object with an 'expression' string." };
    }

    const obj = input as Record<string, unknown>;
    if (typeof obj.expression !== "string" || !obj.expression.trim()) {
      return { isValid: false, error: "Field 'expression' is required and must be a non-empty string." };
    }

    const lower = obj.expression.toLowerCase();
    for (const forbidden of FORBIDDEN_WORDS) {
      if (lower.includes(forbidden)) {
        return {
          isValid: false,
          error: `Security violation: expression contains forbidden keyword '${forbidden}'.`,
        };
      }
    }

    // Only allow alphanumeric characters, math symbols, spaces, parentheses, commas
    if (!/^[0-9a-zA-Z\s\+\-\*\/\^\%\(\)\,\.\_\=]+$/.test(obj.expression)) {
      return {
        isValid: false,
        error: "Expression contains invalid characters. Only math operators, numbers, and allowed functions are permitted.",
      };
    }

    return {
      isValid: true,
      parsed: {
        expression: obj.expression.trim(),
      },
    };
  }

  async execute(input: CalculatorInput, _context: ToolCallContext): Promise<CalculatorOutput> {
    void _context;
    const raw = input.expression;
    const sanitized = this.sanitizeToMath(raw);

    try {
      // Safe math evaluator using Function with restricted scope
      const compute = new Function(
        "Math",
        `"use strict"; return (${sanitized});`
      );
      const val = compute(Math);

      if (typeof val !== "number" || isNaN(val)) {
        throw new Error(`Expression evaluated to non-numeric result: ${String(val)}`);
      }

      return {
        expression: raw,
        result: val,
        formatted: Number.isInteger(val) ? val.toString() : val.toFixed(6).replace(/\.?0+$/, ""),
      };
    } catch (err) {
      throw new Error(`Math calculation error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private sanitizeToMath(expr: string): string {
    let s = expr;

    // Power operator ^ -> **
    s = s.replace(/\^/g, "**");

    // Math constants
    s = s.replace(/\bpi\b/gi, "Math.PI");
    s = s.replace(/\be\b/gi, "Math.E");

    // Supported Math functions
    const mathFuncs = [
      "sqrt",
      "cbrt",
      "abs",
      "sin",
      "cos",
      "tan",
      "asin",
      "acos",
      "atan",
      "round",
      "floor",
      "ceil",
      "log",
      "log10",
      "log2",
      "exp",
      "pow",
      "min",
      "max",
    ];

    for (const fn of mathFuncs) {
      const regex = new RegExp(`\\b${fn}\\s*\\(`, "gi");
      s = s.replace(regex, `Math.${fn}(`);
    }

    return s;
  }
}

export const calculatorTool = new CalculatorTool();
