import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Checks if a hostname or IP is a private/internal network target (SSRF prevention).
 */
function isPrivateUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();

    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      host === "169.254.169.254" // AWS/GCP metadata
    ) {
      return true;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

/**
 * Strips HTML tags, scripts, styles, and extracts readable clean text content.
 */
function extractCleanText(html: string): { title: string; text: string } {
  // Extract Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "Webpage Document";

  // Remove scripts, styles, iframes, SVG, header, footer, nav
  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // Convert paragraphs, headings, list items to line breaks
  clean = clean
    .replace(/<(h[1-6]|p|div|section|article|li)[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  clean = clean
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&ldquo;/gi, '"')
    .replace(/&rdquo;/gi, '"');

  // Collapse consecutive whitespace and empty lines
  const lines = clean
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const text = lines.join("\n\n").slice(0, 30000); // Limit to 30,000 chars

  return { title, text };
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json(
        { error: "Field 'url' is required." },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();

    if (isPrivateUrl(trimmedUrl)) {
      return NextResponse.json(
        { error: "Access to private or local network addresses is restricted for security." },
        { status: 403 }
      );
    }

    // Fetch webpage with timeout & standard user agent
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(trimmedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MyAI/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Webpage returned status code ${response.status} (${response.statusText}).` },
        { status: 400 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain") && !contentType.includes("application/xml")) {
      return NextResponse.json(
        { error: "Target URL does not return HTML or plain text content." },
        { status: 400 }
      );
    }

    const html = await response.text();
    const { title, text } = extractCleanText(html);

    return NextResponse.json({
      success: true,
      url: trimmedUrl,
      title: title || trimmedUrl,
      content: text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      extractedLength: text.length,
    });
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Webpage request timed out after 8 seconds." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to fetch and parse webpage content." },
      { status: 500 }
    );
  }
}
