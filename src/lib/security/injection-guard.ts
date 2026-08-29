export interface InjectionScanResult {
  isSafe: boolean;
  threatType?: "prompt_injection" | "system_exfiltration" | "sql_injection" | "jailbreak";
  riskScore: number; // 0.0 (safe) to 1.0 (malicious)
  reason?: string;
  sanitizedText?: string;
}

const INJECTION_PATTERNS = [
  {
    type: "prompt_injection" as const,
    pattern: /\b(ignore|disregard|forget|override)\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules|directives)\b/i,
    reason: "Attempt to override system instructions.",
  },
  {
    type: "system_exfiltration" as const,
    pattern: /\b(repeat|reveal|print|show|output|leak)\s+(your\s+)?(system\s+prompt|initial\s+instructions|internal\s+instructions|system\s+message)\b/i,
    reason: "Attempt to exfiltrate system instructions.",
  },
  {
    type: "jailbreak" as const,
    pattern: /\b(you\s+are\s+now\s+(DAN|unfiltered|jailbroken|evil|unrestricted)|bypass\s+all\s+safety\s+filters|developer\s+mode\s+enabled)\b/i,
    reason: "Attempted persona jailbreak or safety filter bypass.",
  },
  {
    type: "sql_injection" as const,
    pattern: /\b(UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|DELETE\s+FROM|SELECT\s+.*\s+FROM\s+users|--\s*$|;\s*DROP\b)/i,
    reason: "SQL injection payload detected.",
  },
];

export class PromptInjectionGuard {
  /**
   * Scans user input for adversarial prompt injections, jailbreaks, and system exfiltration attempts.
   */
  scan(text: string): InjectionScanResult {
    if (!text || text.trim().length === 0) {
      return { isSafe: true, riskScore: 0 };
    }

    for (const item of INJECTION_PATTERNS) {
      if (item.pattern.test(text)) {
        return {
          isSafe: false,
          threatType: item.type,
          riskScore: 0.95,
          reason: item.reason,
          sanitizedText: "[Adversarial prompt injection neutralized by security guard]",
        };
      }
    }

    return {
      isSafe: true,
      riskScore: 0.05,
      sanitizedText: text,
    };
  }
}

export const promptInjectionGuard = new PromptInjectionGuard();
