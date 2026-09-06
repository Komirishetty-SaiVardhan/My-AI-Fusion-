import { ImageStylePreset, ImageAspectRatio, ImageStudioConfig } from "./types";

export const IMAGE_STYLE_PRESETS: Record<string, ImageStylePreset> = {
  photoreal: {
    id: "photoreal",
    name: "8K Ultra Photoreal",
    description: "Crisp studio lighting, high dynamic range, Hasselblad detail",
    badge: "Ultra Real",
    promptModifier: "photorealistic 8k, award-winning photography, Hasselblad H6D-100c, 85mm portrait lens, natural studio lighting, intricate texture details",
    icon: "📸",
  },
  anime: {
    id: "anime",
    name: "Makoto Shinkai Anime",
    description: "Lush vibrant colors, ethereal sky, expressive anime aesthetic",
    badge: "Anime Art",
    promptModifier: "Makoto Shinkai anime style, vivid saturated color palette, beautiful cinematic lighting, highly detailed anime visual, CoMix Wave Films aesthetic",
    icon: "🌸",
  },
  cinematic: {
    id: "cinematic",
    name: "35mm Cinematic Film",
    description: "Anamorphic bokeh, subtle film grain, dramatic Hollywood color grade",
    badge: "Film Stills",
    promptModifier: "cinematic film still, 35mm Kodak Portra 400, dramatic rim lighting, moody atmospheric volumetric fog, panavision anamorphic lens",
    icon: "🎬",
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    description: "Vibrant magenta/cyan neon reflections, dark rainy metropolis",
    badge: "Futuristic",
    promptModifier: "cyberpunk neon aesthetic, rainy city street reflections, glowing holographic billboards, futuristic tech, high-contrast night atmosphere",
    icon: "⚡",
  },
  "3d-render": {
    id: "3d-render",
    name: "Unreal Engine 5 (3D)",
    description: "Ray-traced reflections, subsurface scattering, Octane render",
    badge: "3D CGI",
    promptModifier: "octane 3d render, Unreal Engine 5, ray tracing global illumination, subsurface scattering, 3d digital sculpture, smooth polished surfaces",
    icon: "🧊",
  },
  "oil-painting": {
    id: "oil-painting",
    name: "Renaissance Oil Painting",
    description: "Textured impasto brushstrokes, chiaroscuro lighting, classical masterpiece",
    badge: "Fine Art",
    promptModifier: "classical oil on canvas painting, visible textured brushstrokes, chiaroscuro lighting, masterpiece by Rembrandt and John Singer Sargent",
    icon: "🎨",
  },
  "minimalist-vector": {
    id: "minimalist-vector",
    name: "Minimalist Vector Art",
    description: "Clean geometric flat shapes, harmonious pastel color palette",
    badge: "Vector",
    promptModifier: "minimalist flat vector illustration, clean geometric lines, elegant modern graphic design, pastel color scheme, Dribbble trending",
    icon: "📐",
  },
  "dark-fantasy": {
    id: "dark-fantasy",
    name: "Epic Dark Fantasy",
    description: "Mystical atmosphere, ancient ruins, ethereal magical glow",
    badge: "Fantasy",
    promptModifier: "epic dark fantasy concept art, Elden Ring aesthetic, intricate gothic architecture, mystical glowing runes, atmospheric fog, ArtStation HQ",
    icon: "🔮",
  },
};

export const ASPECT_RATIO_DIMENSIONS: Record<ImageAspectRatio, { width: number; height: number; label: string }> = {
  "1:1": { width: 1024, height: 1024, label: "Square (1:1)" },
  "16:9": { width: 1280, height: 720, label: "Landscape (16:9)" },
  "9:16": { width: 720, height: 1280, label: "Story / Reel (9:16)" },
  "4:3": { width: 1024, height: 768, label: "Classic Photo (4:3)" },
  "3:2": { width: 1080, height: 720, label: "DSLR Photo (3:2)" },
};

/**
 * Build Pollinations / AI generation URL from studio config
 */
export function buildStudioImageUrl(config: ImageStudioConfig): string {
  const preset = IMAGE_STYLE_PRESETS[config.style] || IMAGE_STYLE_PRESETS.photoreal;
  const dimensions = ASPECT_RATIO_DIMENSIONS[config.aspectRatio] || ASPECT_RATIO_DIMENSIONS["1:1"];

  const fullPrompt = `${config.prompt}, ${preset.promptModifier}${config.enhance ? ", high resolution, sharp focus, masterpiece" : ""}`;
  const encoded = encodeURIComponent(fullPrompt);
  const seed = config.seed ?? Math.floor(Math.random() * 1000000);

  return `https://image.pollinations.ai/prompt/${encoded}?width=${dimensions.width}&height=${dimensions.height}&seed=${seed}&nologo=true&enhance=true&model=flux`;
}
