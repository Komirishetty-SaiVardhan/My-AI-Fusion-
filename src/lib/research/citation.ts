import { Citation, Source } from "./types";

export class CitationRenderer {
  /**
   * Generates 1-indexed citation definitions from ranked sources.
   */
  buildCitations(sources: Source[]): Citation[] {
    return sources.map((source, index) => ({
      index: index + 1,
      sourceId: source.id,
      url: source.url,
      title: source.title,
      domain: source.domain,
      snippet: source.snippet,
    }));
  }

  /**
   * Validates and cleans citation references in synthesized text.
   * Strips invented/hallucinated citation numbers that do not map to retrieved sources.
   */
  sanitizeCitations(text: string, validCitations: Citation[]): string {
    const maxIndex = validCitations.length;
    if (maxIndex === 0) {
      // No valid sources: strip any citation brackets
      return text.replace(/\[\d+\]/g, "");
    }

    // Replace invalid [N] with empty string or clamp
    return text.replace(/\[(\d+)\]/g, (match, p1) => {
      const idx = parseInt(p1, 10);
      if (idx >= 1 && idx <= maxIndex) {
        return `[${idx}]`;
      }
      return "";
    });
  }

  /**
   * Formats a clean, readable Markdown reference list of citations.
   */
  renderFootnotes(citations: Citation[]): string {
    if (citations.length === 0) return "";

    const lines = ["### 📚 Sourced References", ""];

    for (const c of citations) {
      const displayDomain = c.domain.replace(/^www\./, "");
      lines.push(`${c.index}. [${c.title}](${c.url}) — *${displayDomain}*`);
    }

    return lines.join("\n");
  }

  /**
   * Formats source summary chips for UI display.
   */
  renderSourceChips(sources: Source[]): string {
    return sources
      .map((s, idx) => `[${idx + 1}] ${s.domain} (${Math.round(s.relevanceScore * 100)}% match)`)
      .join(" • ");
  }
}

export const citationRenderer = new CitationRenderer();
