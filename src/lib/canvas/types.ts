export type CanvasNodeType =
  | "process"
  | "decision"
  | "database"
  | "cloud"
  | "actor"
  | "sticky"
  | "text"
  | "system";

export type CanvasNodeColor =
  | "sky"
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "purple"
  | "slate";

export interface CanvasNode {
  id: string;
  type: CanvasNodeType;
  label: string;
  description?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: CanvasNodeColor;
  icon?: string;
  shape?: "rectangle" | "rounded" | "diamond" | "cylinder" | "cloud" | "circle";
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: "solid" | "dashed" | "dotted";
  color?: string;
}

export interface CanvasDiagram {
  id: string;
  title: string;
  description?: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  theme?: "dark" | "light" | "blueprint";
}
