import { NextRequest, NextResponse } from "next/server";
import { aiGateway } from "@/lib/ai/gateway";
import { DEFAULT_DEBATE_PANEL, SAMPLE_DEBATE_SESSION } from "@/lib/debate/engine";
import { DebateSession } from "@/lib/debate/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const topic = body.topic || "Should we adopt a microservices architecture or keep a modular monolith?";

    const prompt = `You are Athena Core, the Master Synthesis & Debate Orchestrator.
Orchestrate a comprehensive multi-agent expert debate on the following topic:
Topic: "${topic}"

Generate a JSON object strictly matching this schema:
{
  "topic": "${topic}",
  "turns": [
    {
      "agentId": "proponent",
      "roundNumber": 1,
      "stageName": "Opening Argument",
      "content": "Detailed compelling argument with facts and technical analysis...",
      "keyPoints": ["point 1", "point 2", "point 3"],
      "confidenceScore": 92
    },
    {
      "agentId": "skeptic",
      "roundNumber": 1,
      "stageName": "Cross-Examination & Rebuttal",
      "content": "Critical risk analysis exposing flaws and hidden costs...",
      "keyPoints": ["counter point 1", "counter point 2", "counter point 3"],
      "confidenceScore": 88
    },
    {
      "agentId": "pragmatist",
      "roundNumber": 2,
      "stageName": "Edge Case Analysis",
      "content": "Balanced pragmatic engineering view finding compromise...",
      "keyPoints": ["pragmatic insight 1", "pragmatic insight 2"],
      "confidenceScore": 95
    }
  ],
  "synthesis": {
    "consensusTitle": "Title of winning compromise strategy",
    "recommendation": "Decisive executive summary and actionable direction...",
    "pros": ["benefit 1", "benefit 2", "benefit 3"],
    "cons": ["drawback 1", "drawback 2"],
    "unresolvedRisks": ["risk 1", "risk 2"],
    "actionItems": ["1. Step one", "2. Step two", "3. Step three"],
    "winnerStance": "hybrid"
  }
}

Output ONLY valid raw JSON with no surrounding markdown backticks or commentary.`;

    let parsed: any;
    try {
      const response = await aiGateway.generateText({
        messages: [
          {
            role: "system",
            content: "You are an AI debate orchestrator. Return only valid raw JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      });
      const cleanJson = response.text.replace(/^```(json)?/im, "").replace(/```$/im, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = SAMPLE_DEBATE_SESSION;
    }

    const session: DebateSession = {
      id: `debate-${Date.now()}`,
      topic,
      status: "completed",
      agents: DEFAULT_DEBATE_PANEL,
      turns: parsed.turns || SAMPLE_DEBATE_SESSION.turns,
      synthesis: parsed.synthesis || SAMPLE_DEBATE_SESSION.synthesis,
    };

    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json(
      {
        ...SAMPLE_DEBATE_SESSION,
        topic: "Decision Debate Analysis",
        error: error?.message || "Internal server error",
      },
      { status: 200 }
    );
  }
}
