import { ClassificationResult, RouterRequest } from "./types";

export class RequestClassifier {
  classify(request: RouterRequest): ClassificationResult {
    // 1. Check for physical attachments
    if (request.attachments && request.attachments.length > 0) {
      const hasImage = request.attachments.some(
        (a) => a.type === "image" || (a.mimeType && a.mimeType.startsWith("image/"))
      );
      if (hasImage) {
        return {
          category: "VISION",
          confidence: 1.0,
          reason: "Request contains image attachment",
          detectedFeatures: ["attachment:image"],
        };
      }

      const hasVideo = request.attachments.some(
        (a) => a.type === "video" || (a.mimeType && a.mimeType.startsWith("video/"))
      );
      if (hasVideo) {
        return {
          category: "VISION",
          confidence: 1.0,
          reason: "Request contains video attachment",
          detectedFeatures: ["attachment:video"],
        };
      }

      const hasFile = request.attachments.some(
        (a) =>
          a.type === "file" ||
          a.type === "audio" ||
          (a.mimeType && !a.mimeType.startsWith("image/") && !a.mimeType.startsWith("video/"))
      );
      if (hasFile) {
        return {
          category: "FILE_ANALYSIS",
          confidence: 1.0,
          reason: "Request contains document/file attachment",
          detectedFeatures: ["attachment:file"],
        };
      }
    }

    // 2. Extract prompt text
    const text = this.extractPromptText(request).trim();
    if (!text) {
      return {
        category: "SIMPLE",
        confidence: 0.95,
        reason: "Empty or trivial input",
        detectedFeatures: ["empty_text"],
      };
    }

    const lower = text.toLowerCase();
    const wordCount = text.split(/\s+/).length;

    // 3. Evaluate Coding Signals
    const codingMatches = this.findMatches(lower, [
      /\b(write|create|implement|build|code|refactor|debug|fix)\s+(a|an|the)?\s*(function|class|method|hook|component|script|algorithm|regex|sql|query|endpoint|api|quicksort|binary search tree)\b/,
      /\b(typescript|javascript|python|rust|golang|c\+\+|java|html|css|sql|postgres|react|nextjs|tailwind)\b/,
      /\b(syntax\s*error|type\s*error|nullpointerexception|stack\s*trace|console\.log|async\s*await|promise|useeffect|re-render)\b/,
      /```[\s\S]*?```/,
      /\b(git\s+commit|dockerfile|docker-compose|npm\s+install|package\.json|tsconfig\.json)\b/,
      /\b(regex\s+to\s+match|regular\s+expression|sql\s+query|sql\s+join|database\s+schema|debounce)\b/,
    ]);

    if (codingMatches.length > 0) {
      const confidence = Math.min(0.98, 0.78 + codingMatches.length * 0.08);
      return {
        category: "CODING",
        confidence,
        reason: `Detected coding indicators (${codingMatches.slice(0, 3).join(", ")})`,
        detectedFeatures: codingMatches,
      };
    }

    // 4. Evaluate Deep Reasoning & Logic Signals
    const reasoningMatches = this.findMatches(lower, [
      /\b(prove\s+that|mathematical\s+proof|solve\s+for\s+x|calculate\s+the\s+derivative|integral\s+of)\b/,
      /\b(trade-off(s)?\s+between|compare\s+and\s+contrast\s+the\s+architecture\s+of)\b/,
      /\b(time\s+complexity|space\s+complexity|big\s+o\s+notation|lsm-tree|b-tree|np-complete)\b/,
      /\b(logic\s+puzzle|riddle|step-by-step\s+logical\s+deduction|formal\s+verification)\b/,
      /\b(game\s+theory|nash\s+equilibrium|prisoners\s+dilemma|bayesian\s+probability)\b/,
      /\b(why\s+is\s+the\s+halting\s+problem|godel's\s+incompleteness|undecidable)\b/,
    ]);

    if (reasoningMatches.length > 0) {
      const confidence = Math.min(0.98, 0.8 + reasoningMatches.length * 0.08);
      return {
        category: "REASONING",
        confidence,
        reason: `Detected complex reasoning and logic patterns (${reasoningMatches.slice(0, 3).join(", ")})`,
        detectedFeatures: reasoningMatches,
      };
    }

    // 5. Evaluate Current Information & Research Signals
    const researchMatches = this.findMatches(lower, [
      /\b(current\s+weather|current\s+stock\s+price|latest\s+news|today's\s+headline)\b/,
      /\b(who\s+won\s+the\s+(2024|2025|2026)\s+(presidential\s+)?(election|super\s*bowl|world\s*cup|oscars|olympics))\b/,
      /\b(market\s+trends\s+in\s+(2024|2025|2026)|latest\s+breakthrough\s+in|recent\s+events\s+in)\b/,
      /\b(what\s+is\s+the\s+current\s+price\s+of|live\s+score\s+of)\b/,
      /\b(search\s+the\s+web\s+for|look\s+up\s+recent)\b/,
    ]);

    if (researchMatches.length > 0) {
      const confidence = Math.min(0.98, 0.82 + researchMatches.length * 0.08);
      return {
        category: "RESEARCH",
        confidence,
        reason: `Detected real-time / current information query (${researchMatches.slice(0, 3).join(", ")})`,
        detectedFeatures: researchMatches,
      };
    }

    // 6. Evaluate Text-Prompted Vision Cues (without file attachment)
    const visionMatches = this.findMatches(lower, [
      /\b(describe\s+this\s+image|what\s+is\s+(shown|in)\s+(this|the)\s+(image|picture|photo|screenshot))\b/,
      /\b(ocr\s+this\s+receipt|read\s+the\s+text\s+in\s+this\s+image|diagram\s+in\s+the\s+image)\b/,
    ]);

    if (visionMatches.length > 0) {
      return {
        category: "VISION",
        confidence: 0.92,
        reason: "User requested visual inspection",
        detectedFeatures: visionMatches,
      };
    }

    // 7. Evaluate Text-Prompted File Analysis Cues (without file attachment)
    const fileMatches = this.findMatches(lower, [
      /\b(summarize\s+this\s+pdf|parse\s+this\s+csv|analyze\s+this\s+spreadsheet)\b/,
      /\b(extract\s+data\s+from\s+this\s+document|read\s+the\s+uploaded\s+doc|summarize\s+this\s+pdf\s+document)\b/,
    ]);

    if (fileMatches.length > 0) {
      return {
        category: "FILE_ANALYSIS",
        confidence: 0.92,
        reason: "User requested document / file processing",
        detectedFeatures: fileMatches,
      };
    }

    // 8. Evaluate Simple / Fast Conversational Cues
    const isGreeting = /\b(hello|hi|hey|good\s+(morning|afternoon|evening)|howdy|sup|greetings|how\s+are\s+you|how\s+are\s+you\s+doing|who\s+are\s+you)\b/.test(lower);
    const isBasicDefinition = /\b(define\s+[a-zA-Z]+|meaning\s+of\s+[a-zA-Z]+|what\s+does\s+[a-zA-Z0-9]+\s+stand\s+for|what\s+is\s+the\s+capital\s+of|synonym\s+for)\b/.test(lower);
    const isArithmetic = /^\s*\d+\s*[\+\-\*\/]\s*\d+\s*([=?]|\s*=\s*\?)?\s*$/.test(lower);

    if (isGreeting && wordCount <= 8) {
      return {
        category: "SIMPLE",
        confidence: 0.96,
        reason: "Conversational greeting",
        detectedFeatures: ["greeting"],
      };
    }

    if (isArithmetic) {
      return {
        category: "SIMPLE",
        confidence: 0.99,
        reason: "Basic arithmetic computation",
        detectedFeatures: ["arithmetic"],
      };
    }

    if (isBasicDefinition && wordCount <= 7) {
      return {
        category: "SIMPLE",
        confidence: 0.94,
        reason: "Concise fact or definition lookup",
        detectedFeatures: ["quick_fact"],
      };
    }

    if (wordCount <= 4 && !lower.includes("why") && !lower.includes("explain") && !lower.includes("essay")) {
      return {
        category: "SIMPLE",
        confidence: 0.78,
        reason: "Short query suitable for fast model tier",
        detectedFeatures: ["short_query"],
      };
    }

    // 9. Default to GENERAL category with variable confidence
    const hasLongForm = lower.includes("write an essay") || lower.includes("in-depth guide") || lower.includes("comprehensive summary") || lower.includes("brainstorm");
    const generalConfidence = hasLongForm ? 0.9 : 0.75;

    return {
      category: "GENERAL",
      confidence: generalConfidence,
      reason: "General inquiry suitable for balanced capability model",
      detectedFeatures: ["general_prompt"],
      suggestedEscalation: generalConfidence < 0.65,
    };
  }

  private extractPromptText(request: RouterRequest): string {
    if (request.prompt) return request.prompt;
    if (typeof request.messages === "string") return request.messages;
    if (Array.isArray(request.messages) && request.messages.length > 0) {
      const last = request.messages[request.messages.length - 1];
      return last.content || "";
    }
    return "";
  }

  private findMatches(text: string, patterns: RegExp[]): string[] {
    const matched: string[] = [];
    for (const pattern of patterns) {
      const m = text.match(pattern);
      if (m) {
        matched.push(m[0]);
      }
    }
    return matched;
  }
}

export const requestClassifier = new RequestClassifier();
