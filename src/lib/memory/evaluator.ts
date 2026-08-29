import { MemoryEvaluationResult, MemorySource, MemoryType } from "./types";

const SECRET_PATTERNS = [
  // OpenAI & API keys
  /\bsk-[a-zA-Z0-9\-_]{20,}\b/,
  /\bghp_[a-zA-Z0-9]{20,}\b/,
  /\bAIza[0-9A-Za-z\-_]{35}\b/,
  /\bxox[baprs]-[a-zA-Z0-9\-_]{10,}\b/,
  /\bBearer\s+[a-zA-Z0-9_\-\.]{20,}\b/i,
  // Passwords and private keys
  /\b(password|passwd|api_key|secret_key|auth_token)\s*[:=]\s*['"]?[a-zA-Z0-9!@#$%^&*()_+=\-]{6,}['"]?/i,
  /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/i,
  // Credit card patterns
  /\b(?:\d{4}[ -]?){3}\d{4}\b/,
];

const EPHEMERAL_PATTERNS = [
  /\b(i\s+am\s+(tired|sleepy|hungry|thirsty|busy|eating|leaving|back))\b/i,
  /\b(it\s+is\s+(raining|sunny|cloudy|cold|hot|warm)\s+today)\b/i,
  /\b(today\s+is|the\s+weather\s+is|what\s+time\s+is\s+it)\b/i,
  /\b(hello|hi|hey|good\s+morning|bye|see\s+you|thank\s+you|thanks)\b/i,
  /\b(what\s+is\s+\d+\s*[\+\-\*\/]\s*\d+)\b/i,
];

const EXPLICIT_TRIGGERS = [
  /^(please\s+)?remember\s+(this|that|to\s+always|my|our)\b/i,
  /^(please\s+)?keep\s+in\s+mind\s+that\b/i,
  /^(save\s+to\s+memory|store\s+this\s+memory)\b/i,
  /^(always\s+remember\s+that)\b/i,
];

export class MemoryEvaluator {
  /**
   * Scans text for secrets, API keys, passwords, and tokens.
   */
  containsSecrets(text: string): boolean {
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Evaluates if a text statement is useful, stable, safe, and worthy of long-term memory.
   */
  evaluate(
    input: string,
    options?: { isExplicit?: boolean; source?: MemorySource; categoryHint?: MemoryType }
  ): MemoryEvaluationResult {
    const text = input.trim();

    // 1. Zero-Secrets Check: immediately reject any secret
    if (this.containsSecrets(text)) {
      return {
        shouldSave: false,
        reason: "Security Guard: content contains secret API key, password, or credential.",
        rejectedSecret: true,
        stabilityScore: 0,
        importance: 0,
      };
    }

    if (!text || text.length < 5) {
      return {
        shouldSave: false,
        reason: "Trivial input length.",
        stabilityScore: 0,
        importance: 0,
      };
    }

    // 2. Check for Explicit "Remember this" trigger
    for (const trigger of EXPLICIT_TRIGGERS) {
      if (trigger.test(text) || options?.isExplicit) {
        const cleaned = text
          .replace(/^(please\s+)?remember\s+(this|that|to\s+always|my|our)\s*[:\s]?/i, "")
          .replace(/^(please\s+)?keep\s+in\s+mind\s+that\s+/i, "")
          .replace(/^(save\s+to\s+memory|store\s+this\s+memory)\s*[:\s]?/i, "")
          .trim();
        const distilled = cleaned || text;

        return {
          shouldSave: true,
          reason: "Explicit user request to save memory.",
          type: "explicit",
          source: "explicit_user_prompt",
          key: this.extractKey(distilled),
          distilledFact: distilled,
          stabilityScore: 1.0,
          importance: 5,
        };
      }
    }

    // 3. Ephemeral Noise Filter: reject temporary states
    for (const pattern of EPHEMERAL_PATTERNS) {
      if (pattern.test(text)) {
        return {
          shouldSave: false,
          reason: "Rejected: ephemeral or low-utility conversational state.",
          stabilityScore: 0.1,
          importance: 1,
        };
      }
    }

    const lower = text.toLowerCase();

    // 4. User Preferences Detection
    const isPreference =
      lower.startsWith("i prefer") ||
      lower.startsWith("i always use") ||
      lower.startsWith("my favorite") ||
      lower.startsWith("never use") ||
      lower.includes("my preferred language") ||
      lower.includes("format all responses as");

    if (isPreference) {
      return {
        shouldSave: true,
        reason: "Detected stable user preference or style rule.",
        type: "user_preference",
        source: "inferred_preference",
        key: this.extractKey(text),
        distilledFact: text,
        stabilityScore: 0.9,
        importance: 4,
      };
    }

    // 5. Project Domain & Architecture Rules
    const isProjectRule =
      lower.includes("our tech stack") ||
      lower.includes("the database is") ||
      lower.includes("our architecture uses") ||
      lower.includes("project guidelines require") ||
      lower.includes("we use prisma with postgres");

    if (isProjectRule) {
      return {
        shouldSave: true,
        reason: "Detected stable project architecture guideline.",
        type: "project",
        source: "project_context",
        key: this.extractKey(text),
        distilledFact: text,
        stabilityScore: 0.95,
        importance: 4,
      };
    }

    // 6. Default: do NOT automatically save generic chat statements
    return {
      shouldSave: false,
      reason: "Statement does not meet stability threshold for long-term memory.",
      stabilityScore: 0.3,
      importance: 2,
    };
  }

  private extractKey(text: string): string {
    const clean = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .slice(0, 4)
      .join("_");
    return clean || "memory_fact";
  }
}

export const memoryEvaluator = new MemoryEvaluator();
