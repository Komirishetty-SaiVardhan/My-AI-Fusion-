import { RawSearchResult } from "./types";

export class UrlDeduplicator {
  /**
   * Normalizes URLs by stripping tracking queries, anchors, and standardizing hostnames.
   */
  canonicalizeUrl(rawUrl: string): string {
    try {
      const parsed = new URL(rawUrl.trim());

      // Normalize protocol & hostname
      const protocol = "https:";
      const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

      // Strip tracking query parameters
      const trackingParams = new Set([
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "ref",
        "fbclid",
        "gclid",
        "_ga",
        "ncid",
        "sr_share",
      ]);

      const searchParams = new URLSearchParams();
      parsed.searchParams.forEach((val, key) => {
        if (!trackingParams.has(key.toLowerCase())) {
          searchParams.append(key, val);
        }
      });

      // Remove trailing slash from pathname
      let pathname = parsed.pathname;
      if (pathname.length > 1 && pathname.endsWith("/")) {
        pathname = pathname.slice(0, -1);
      }

      const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";
      return `${protocol}//${hostname}${pathname}${queryString}`;
    } catch {
      return rawUrl.trim().toLowerCase().replace(/\/+$/, "");
    }
  }

  /**
   * Deduplicates search results by their canonical URL and merges richer content.
   */
  deduplicate(results: RawSearchResult[]): RawSearchResult[] {
    const seen = new Map<string, RawSearchResult>();

    for (const item of results) {
      const canonical = this.canonicalizeUrl(item.url);
      const existing = seen.get(canonical);

      if (!existing) {
        seen.set(canonical, {
          ...item,
          url: canonical,
        });
      } else {
        // Merge richer title / snippet / content
        if ((item.content || "").length > (existing.content || "").length) {
          existing.content = item.content;
        }
        if (item.snippet.length > existing.snippet.length) {
          existing.snippet = item.snippet;
        }
      }
    }

    return Array.from(seen.values());
  }
}

export const urlDeduplicator = new UrlDeduplicator();
