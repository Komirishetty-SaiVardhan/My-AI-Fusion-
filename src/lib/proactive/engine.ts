import { ProactiveAction } from "./types";

export function generateProactiveSuggestions(messageContent: string): ProactiveAction[] {
  const suggestions: ProactiveAction[] = [];
  const text = messageContent.toLowerCase();

  // 1. Code-related suggestions
  if (text.includes("```") || text.includes("function") || text.includes("const ") || text.includes("class ")) {
    suggestions.push({
      id: "act-test",
      label: "🧪 Generate Unit Tests",
      prompt: "Write comprehensive unit tests covering happy paths, edge cases, and failure scenarios for this code.",
      category: "test",
    });

    suggestions.push({
      id: "act-optimize",
      label: "⚡ Benchmark & Optimize",
      prompt: "Analyze the time and space complexity of this solution and suggest performance optimizations.",
      category: "code",
    });

    suggestions.push({
      id: "act-workspace",
      label: "💻 Open in Project Workspace",
      prompt: "Convert this implementation into a multi-file interactive Project Workspace with HTML, CSS, and JS files.",
      category: "code",
    });
  }

  // 2. Architecture / Explanation suggestions
  if (text.includes("architecture") || text.includes("system") || text.includes("database") || text.includes("api")) {
    suggestions.push({
      id: "act-canvas",
      label: "🎨 Draw on Infinite Canvas",
      prompt: "Generate an interactive system architecture diagram on the Infinite AI Canvas for this setup.",
      category: "visual",
    });

    suggestions.push({
      id: "act-debate",
      label: "🎭 Multi-Agent Debate Trade-offs",
      prompt: "Run a Multi-Agent Expert Debate analyzing the trade-offs and alternative approaches to this decision.",
      category: "critique",
    });
  }

  // 3. Learning / Concept suggestions
  if (text.includes("learn") || text.includes("concept") || text.includes("explain") || text.includes("theory") || text.includes("difference")) {
    suggestions.push({
      id: "act-flashcards",
      label: "🗂️ Create Flashcard Study Deck",
      prompt: "Generate a 3D SuperMemo SM-2 Flashcard Study Deck and quiz covering the key concepts in this explanation.",
      category: "summary",
    });

    suggestions.push({
      id: "act-mindmap",
      label: "🧠 Visualize as Mind Map",
      prompt: "Structure this topic into an interactive hierarchical Mind Map tree.",
      category: "visual",
    });
  }

  // 4. Default fallback high-signal actions
  if (suggestions.length < 3) {
    suggestions.push({
      id: "act-summary",
      label: "📋 Executive Summary in 3 Bullets",
      prompt: "Give me an executive summary of this in exactly 3 actionable bullet points.",
      category: "summary",
    });

    suggestions.push({
      id: "act-slides",
      label: "📊 Create Presentation Slides",
      prompt: "Generate an interactive presentation slide deck summarizing these key findings.",
      category: "visual",
    });

    suggestions.push({
      id: "act-handwritten",
      label: "✍️ Write as Handwritten Notes",
      prompt: "Convert this into clean, beautiful handwritten study notes on lined paper with royal blue ink.",
      category: "export",
    });
  }

  return suggestions.slice(0, 4);
}
