import { NextResponse } from "next/server";
import { ollamaAdapter } from "@/lib/ai/providers/ollama";

export async function GET() {
  const health = await ollamaAdapter.checkHealth();

  const RECOMMENDED_MODELS = [
    {
      id: "llama3.2",
      name: "Llama 3.2 (3B)",
      category: "General & Fast",
      recommendedFor: "General chat, summarization, and fast balanced responses",
      ramRequired: "4GB RAM",
      pullCommand: "ollama pull llama3.2",
    },
    {
      id: "llama3.2:1b",
      name: "Llama 3.2 (1B)",
      category: "Ultra-Lightweight",
      recommendedFor: "Low-spec PCs, CPU inference, ultra-low latency",
      ramRequired: "2GB RAM",
      pullCommand: "ollama pull llama3.2:1b",
    },
    {
      id: "qwen2.5-coder:7b",
      name: "Qwen 2.5 Coder (7B)",
      category: "Coding & Architecture",
      recommendedFor: "TypeScript, Python, full-stack coding, debugging, and SQL",
      ramRequired: "8GB RAM",
      pullCommand: "ollama pull qwen2.5-coder:7b",
    },
    {
      id: "deepseek-r1:7b",
      name: "DeepSeek R1 (7B)",
      category: "Deep Reasoning",
      recommendedFor: "Step-by-step reasoning, mathematical logic, and complex deductions",
      ramRequired: "8GB RAM",
      pullCommand: "ollama pull deepseek-r1:7b",
    },
    {
      id: "llama3.2-vision",
      name: "Llama 3.2 Vision (11B)",
      category: "Multimodal Vision",
      recommendedFor: "Image understanding, screenshots, diagrams, and charts",
      ramRequired: "12GB RAM / GPU",
      pullCommand: "ollama pull llama3.2-vision",
    },
    {
      id: "llava",
      name: "LLaVA (7B)",
      category: "Multimodal Vision",
      recommendedFor: "Vision analysis and OCR on consumer hardware",
      ramRequired: "8GB RAM",
      pullCommand: "ollama pull llava",
    },
    {
      id: "nomic-embed-text",
      name: "Nomic Embed Text",
      category: "Local Embeddings",
      recommendedFor: "High-accuracy vector document retrieval",
      ramRequired: "1GB RAM",
      pullCommand: "ollama pull nomic-embed-text",
    },
  ];

  return NextResponse.json({
    activeModel: ollamaAdapter.getDefaultModel(),
    baseUrl: ollamaAdapter.getBaseUrl(),
    isOllamaRunning: health.isRunning,
    ollamaVersion: health.version,
    installedModels: health.installedModels,
    recommendedModels: RECOMMENDED_MODELS,
    error: health.error,
  });
}
