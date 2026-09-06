import { NextRequest, NextResponse } from "next/server";
import { aiGateway } from "@/lib/ai/gateway";

export const runtime = "nodejs";

const PROMPT_ENHANCER_SYSTEM_PROMPT = `You are an expert prompt engineer. Your sole job is to rewrite the user's short or basic prompt into a comprehensive, high-quality, professional AI prompt.

CRITICAL RULES:
1. Preserve the user's core intent exactly.
2. Structure the prompt with:
   - Clear Persona & Context
   - Detailed Task & Objective
   - Key Requirements, Nuances & Edge Cases
   - Output Format & Style (e.g. structured markdown, code examples, executive summary)
3. Return ONLY the enhanced prompt text. Do NOT wrap it in quotes, do NOT add conversational filler (like "Here is your enhanced prompt:").
4. Keep the enhanced prompt clear, concise, actionable, and between 40 to 120 words.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Field 'prompt' is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    const raw = prompt.trim();

    try {
      const response = await aiGateway.generateText({
        messages: [
          { role: "system", content: PROMPT_ENHANCER_SYSTEM_PROMPT },
          { role: "user", content: `Original basic prompt: "${raw}"\n\nRewrite this into an optimal, high-context AI prompt:` },
        ],
        model: "gemini-3.6-flash",
        temperature: 0.4,
      });

      const enhancedText = response.text.trim().replace(/^["']|["']$/g, "");
      return NextResponse.json({
        success: true,
        original: raw,
        enhanced: enhancedText || raw,
      });
    } catch {
      // Fallback heuristic if AI gateway is offline
      const enhancedFallback = `Act as an expert specialist in this domain. Provide a comprehensive, in-depth explanation and solution for: "${raw}". Include clear step-by-step reasoning, real-world examples, best practices, potential pitfalls to avoid, and structured markdown output.`;
      return NextResponse.json({
        success: true,
        original: raw,
        enhanced: enhancedFallback,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to enhance prompt" },
      { status: 500 }
    );
  }
}
