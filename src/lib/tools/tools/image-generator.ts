import { ITool, ToolCallContext, ToolInputSchema, ToolPermission } from "../types";

export interface ImageGeneratorInput {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:2";
  style?: "photorealistic" | "cinematic" | "digital-art" | "anime" | "3d-render" | "cyberpunk" | "fantasy";
  enhance?: boolean;
}

export interface ImageGeneratorOutput {
  imageUrl: string;
  prompt: string;
  enhancedPrompt: string;
  aspectRatio: string;
  width: number;
  height: number;
  style?: string;
  markdownImage: string;
  downloadUrl: string;
}

export class ImageGeneratorTool implements ITool<ImageGeneratorInput, ImageGeneratorOutput> {
  readonly name = "image_generator";
  readonly description =
    "Generates high-resolution, photorealistic, or artistic AI images from text prompts with customizable aspect ratios and styles.";

  readonly inputSchema: ToolInputSchema = {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "Detailed descriptive prompt of the image to generate.",
        required: true,
      },
      aspectRatio: {
        type: "string",
        description: "Aspect ratio: '1:1' (Square), '16:9' (Widescreen), '9:16' (Portrait/Mobile), '4:3' (Standard), or '3:2' (Photography). Default is '1:1'.",
        required: false,
      },
      style: {
        type: "string",
        description: "Visual style: 'photorealistic', 'cinematic', 'digital-art', 'anime', '3d-render', 'cyberpunk', or 'fantasy'.",
        required: false,
      },
      enhance: {
        type: "boolean",
        description: "Whether to automatically enrich prompt quality with artistic keywords. Default is true.",
        required: false,
      },
    },
    required: ["prompt"],
  };

  readonly permissions: ToolPermission = {
    level: "computation",
    requiresUserApproval: false,
    dangerous: false,
  };

  isEnabled = true;

  validate(input: unknown): { isValid: boolean; error?: string; parsed?: ImageGeneratorInput } {
    if (!input || typeof input !== "object") {
      return { isValid: false, error: "Input must be a JSON object containing a 'prompt' property." };
    }

    const { prompt, aspectRatio, style, enhance } = input as Record<string, unknown>;

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return { isValid: false, error: "Parameter 'prompt' must be a non-empty string." };
    }

    if (prompt.length > 2000) {
      return { isValid: false, error: "Prompt is too long (maximum 2000 characters allowed)." };
    }

    const validAspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:2"];
    if (aspectRatio && typeof aspectRatio === "string" && !validAspectRatios.includes(aspectRatio)) {
      return {
        isValid: false,
        error: `Invalid aspectRatio '${aspectRatio}'. Supported values: ${validAspectRatios.join(", ")}`,
      };
    }

    return {
      isValid: true,
      parsed: {
        prompt: prompt.trim(),
        aspectRatio: (aspectRatio as ImageGeneratorInput["aspectRatio"]) || "1:1",
        style: style as ImageGeneratorInput["style"],
        enhance: enhance !== false,
      },
    };
  }

  async execute(
    input: ImageGeneratorInput,
    _context: ToolCallContext
  ): Promise<ImageGeneratorOutput> {
    const ratioMap: Record<string, { width: number; height: number }> = {
      "1:1": { width: 1024, height: 1024 },
      "16:9": { width: 1280, height: 720 },
      "9:16": { width: 720, height: 1280 },
      "4:3": { width: 1024, height: 768 },
      "3:2": { width: 1200, height: 800 },
    };

    const ratio = input.aspectRatio || "1:1";
    const dimensions = ratioMap[ratio] || { width: 1024, height: 1024 };

    // Build enhanced prompt
    let enhanced = input.prompt;
    if (input.style) {
      const styleKeywords: Record<string, string> = {
        photorealistic: "photorealistic, 8k resolution, high quality photographic, ultra-detailed, realistic lighting",
        cinematic: "cinematic shot, dramatic lighting, 35mm film aesthetic, photorealistic, masterpiece",
        "digital-art": "digital painting, award-winning illustration, vibrant colors, crisp line art, trending on artstation",
        anime: "anime masterpiece style, Makoto Shinkai aesthetic, vivid colors, highly detailed anime visual",
        "3d-render": "octane 3d render, Unreal Engine 5, ray tracing, ultra-realistic textures, volumetric lighting",
        cyberpunk: "cyberpunk aesthetic, vibrant neon reflections, futuristic tech, rainy city night atmosphere",
        fantasy: "epic fantasy concept art, magical atmosphere, intricate detailing, ethereal glow, cinematic landscape",
      };
      const modifier = styleKeywords[input.style] || input.style;
      enhanced = `${enhanced}, ${modifier}`;
    }

    if (input.enhance !== false && !enhanced.includes("8k") && !enhanced.includes("detailed")) {
      enhanced = `${enhanced}, high resolution, sharp focus, beautiful composition`;
    }

    const encodedPrompt = encodeURIComponent(enhanced);
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dimensions.width}&height=${dimensions.height}&seed=${seed}&nologo=true&enhance=true&model=flux`;
    const downloadUrl = `/api/generate-image?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(
      input.prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_")
    )}.jpg`;

    const markdownImage = `![${input.prompt}](${imageUrl})`;

    return {
      imageUrl,
      prompt: input.prompt,
      enhancedPrompt: enhanced,
      aspectRatio: ratio,
      width: dimensions.width,
      height: dimensions.height,
      style: input.style,
      markdownImage,
      downloadUrl,
    };
  }
}

export const imageGeneratorTool = new ImageGeneratorTool();
