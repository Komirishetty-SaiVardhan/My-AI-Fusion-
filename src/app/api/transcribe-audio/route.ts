import { NextRequest, NextResponse } from "next/server";
import { aiGateway } from "@/lib/ai/gateway";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    let audioBase64 = "";
    let mimeType = "audio/webm";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("audio") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      audioBase64 = `data:${file.type || "audio/webm"};base64,${buffer.toString("base64")}`;
      mimeType = file.type || "audio/webm";
    } else {
      const body = await req.json();
      if (!body?.audio) {
        return NextResponse.json({ error: "Field 'audio' is required" }, { status: 400 });
      }
      audioBase64 = body.audio;
      mimeType = body.mimeType || "audio/webm";
    }

    // Call Gemini Multimodal Audio Model for 100% accurate transcription
    const response = await aiGateway.generateText({
      messages: [
        {
          role: "system",
          content:
            "You are a precise, verbatim speech-to-text audio transcription engine. Transcribe every single word spoken in the audio file accurately. Return ONLY the transcribed words. Do NOT add any preamble, conversational commentary, or formatting.",
        },
        {
          role: "user",
          content: "Transcribe this audio clip verbatim:",
          attachments: [
            {
              id: `audio-${Date.now()}`,
              name: "voice-input.webm",
              type: "audio",
              url: audioBase64,
              mimeType: mimeType.split(";")[0],
              sizeBytes: audioBase64.length,
            },
          ],
        },
      ],
      model: "gemini-3.6-flash",
      temperature: 0.1,
    });

    const transcribedText = response.text.trim().replace(/^["']|["']$/g, "");

    return NextResponse.json({
      success: true,
      text: transcribedText,
    });
  } catch (error: any) {
    console.error("Audio transcription error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
