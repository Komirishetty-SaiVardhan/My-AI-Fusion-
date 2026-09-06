import { NextRequest, NextResponse } from "next/server";
import { layoutHandwriting, generatePageSvg } from "@/lib/handwriting/engine";
import {
  HandwritingConfig,
  PaperStyle,
  InkColor,
  HandwritingFont,
} from "@/lib/handwriting/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/handwriting
 * Query parameters:
 *  - text: string (required)
 *  - paper: PaperStyle (optional, default: "lined")
 *  - ink: InkColor (optional, default: "blue")
 *  - font: HandwritingFont (optional, default: "caveat")
 *  - title: string (optional)
 *  - page: number (optional, 1-indexed, default: 1)
 *  - format: "svg" | "json" (optional, default: "svg")
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const text = searchParams.get("text") || "";
    const paper = (searchParams.get("paper") as PaperStyle) || "lined";
    const ink = (searchParams.get("ink") as InkColor) || "blue";
    const font = (searchParams.get("font") as HandwritingFont) || "caveat";
    const title = searchParams.get("title") || undefined;
    const pageNum = parseInt(searchParams.get("page") || "1", 10) || 1;
    const format = searchParams.get("format") || "svg";

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Parameter 'text' is required." },
        { status: 400 }
      );
    }

    const config: HandwritingConfig = {
      text: text.trim(),
      paper,
      ink,
      font,
      title,
    };

    const layoutResult = layoutHandwriting(config);
    const targetPageIndex = Math.max(0, Math.min(pageNum - 1, layoutResult.totalPages - 1));
    const targetPage = layoutResult.pages[targetPageIndex];

    if (format === "json") {
      return NextResponse.json({
        success: true,
        totalPages: layoutResult.totalPages,
        pageNumber: targetPageIndex + 1,
        pages: layoutResult.pages,
        config: layoutResult.config,
      });
    }

    // Default: Return crisp SVG image directly
    const svgString = generatePageSvg(targetPage, layoutResult.config);

    return new NextResponse(svgString, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Content-Disposition": `inline; filename="handwritten-page-${targetPageIndex + 1}.svg"`,
      },
    });
  } catch (error: any) {
    console.error("Handwriting API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to render handwritten note" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/handwriting
 * Request body: { text, paper?, ink?, font?, title?, page?, format?, fontSize?, lineHeight? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text = "",
      paper = "lined",
      ink = "blue",
      font = "caveat",
      title,
      page = 1,
      format = "svg",
      fontSize,
      lineHeight,
    } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Field 'text' must be a non-empty string." },
        { status: 400 }
      );
    }

    const config: HandwritingConfig = {
      text: text.trim(),
      paper,
      ink,
      font,
      title,
      fontSize,
      lineHeight,
    };

    const layoutResult = layoutHandwriting(config);
    const targetPageIndex = Math.max(0, Math.min((page || 1) - 1, layoutResult.totalPages - 1));
    const targetPage = layoutResult.pages[targetPageIndex];

    if (format === "json") {
      return NextResponse.json({
        success: true,
        totalPages: layoutResult.totalPages,
        pageNumber: targetPageIndex + 1,
        pages: layoutResult.pages,
        config: layoutResult.config,
      });
    }

    const svgString = generatePageSvg(targetPage, layoutResult.config);

    return new NextResponse(svgString, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-cache",
        "Content-Disposition": `inline; filename="handwritten-page-${targetPageIndex + 1}.svg"`,
      },
    });
  } catch (error: any) {
    console.error("Handwriting API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to render handwritten note" },
      { status: 500 }
    );
  }
}
