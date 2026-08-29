import { VisionCategory, VisionImage } from "./types";

export class VisualClassifier {
  /**
   * Classifies the visual intent and category based on filename and prompt cues.
   */
  classifyCategory(image: VisionImage, prompt?: string): VisionCategory {
    const combined = `${image.filename} ${prompt || ""}`.toLowerCase();

    if (
      combined.includes("chart") ||
      combined.includes("graph") ||
      combined.includes("plot") ||
      combined.includes("histogram") ||
      combined.includes("stock price") ||
      combined.includes("revenue trend")
    ) {
      return "chart";
    }

    if (
      combined.includes("diagram") ||
      combined.includes("architecture") ||
      combined.includes("flowchart") ||
      combined.includes("schema") ||
      combined.includes("uml") ||
      combined.includes("topology") ||
      combined.includes("wireframe")
    ) {
      return "diagram";
    }

    if (
      combined.includes("screenshot") ||
      combined.includes("screen shot") ||
      combined.includes("capture") ||
      combined.includes("app window") ||
      combined.includes("browser") ||
      combined.includes("ide") ||
      combined.includes("error dialog")
    ) {
      return "screenshot";
    }

    if (
      combined.includes("handwriting") ||
      combined.includes("handwritten") ||
      combined.includes("whiteboard") ||
      combined.includes("cursive") ||
      combined.includes("sketch") ||
      combined.includes("scribble")
    ) {
      return "handwriting";
    }

    if (
      combined.includes("receipt") ||
      combined.includes("invoice") ||
      combined.includes("scanned") ||
      combined.includes("scan") ||
      combined.includes("ocr") ||
      combined.includes("contract") ||
      combined.includes("printed page")
    ) {
      return "scanned_document";
    }

    if (
      combined.includes("photo") ||
      combined.includes("picture") ||
      combined.includes("landscape") ||
      combined.includes("person") ||
      combined.includes("portrait") ||
      combined.includes("nature") ||
      combined.includes("animal") ||
      combined.includes("camera")
    ) {
      return "photograph";
    }

    return "general";
  }
}

export const visualClassifier = new VisualClassifier();
