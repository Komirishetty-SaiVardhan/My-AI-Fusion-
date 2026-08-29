import { ITool, ToolCallContext, ToolInputSchema, ToolPermission } from "../types";
import { MockSearchProvider } from "../../research/search-provider";

export interface WebSearchInput {
  query: string;
  maxResults?: number;
}

export interface WebSearchResultItem {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

export interface WebSearchOutput {
  query: string;
  totalResults: number;
  results: WebSearchResultItem[];
}

export class WebSearchTool implements ITool<WebSearchInput, WebSearchOutput> {
  readonly name = "web_search";
  readonly description =
    "Search the web for up-to-date facts, current events, official documentation, or technical references.";
  readonly inputSchema: ToolInputSchema = {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query string (e.g. 'Next.js App Router streaming SSR')",
        required: true,
      },
      maxResults: {
        type: "number",
        description: "Maximum number of search results to return (default: 5)",
      },
    },
    required: ["query"],
  };

  readonly permissions: ToolPermission = {
    level: "search",
    requiresUserApproval: false,
    dangerous: false,
  };

  isEnabled = true;
  private searchProvider = new MockSearchProvider();

  validate(input: unknown): { isValid: boolean; error?: string; parsed?: WebSearchInput } {
    if (!input || typeof input !== "object") {
      return { isValid: false, error: "Input must be an object containing a 'query' string." };
    }

    const obj = input as Record<string, unknown>;
    if (typeof obj.query !== "string" || !obj.query.trim()) {
      return { isValid: false, error: "Field 'query' is required and must be a non-empty string." };
    }

    const maxResults = typeof obj.maxResults === "number" ? Math.min(10, Math.max(1, obj.maxResults)) : 5;

    return {
      isValid: true,
      parsed: {
        query: obj.query.trim(),
        maxResults,
      },
    };
  }

  async execute(input: WebSearchInput, _context: ToolCallContext): Promise<WebSearchOutput> {
    void _context;
    const rawResults = await this.searchProvider.search(input.query, {
      maxResults: input.maxResults || 5,
    });

    const items: WebSearchResultItem[] = rawResults.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      domain: new URL(r.url).hostname.replace(/^www\./, ""),
    }));

    return {
      query: input.query,
      totalResults: items.length,
      results: items,
    };
  }
}

export const webSearchTool = new WebSearchTool();
