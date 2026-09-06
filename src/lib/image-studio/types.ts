export type ImageStylePresetId =
  | "photoreal"
  | "anime"
  | "cinematic"
  | "cyberpunk"
  | "3d-render"
  | "oil-painting"
  | "minimalist-vector"
  | "dark-fantasy"
  | "pixel-art";

export type ImageAspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:2";

export interface ImageStylePreset {
  id: ImageStylePresetId;
  name: string;
  description: string;
  badge: string;
  promptModifier: string;
  negativePromptModifier?: string;
  icon: string;
}

export interface ImageStudioConfig {
  prompt: string;
  style: ImageStylePresetId;
  aspectRatio: ImageAspectRatio;
  seed?: number;
  enhance: boolean;
  model?: "flux" | "turbo" | "midjourney-style";
}
