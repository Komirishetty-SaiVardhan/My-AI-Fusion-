import { CanvasDiagram, CanvasNode, CanvasEdge, CanvasNodeType, CanvasNodeColor } from "./types";

export const SAMPLE_ARCHITECTURE_DIAGRAM: CanvasDiagram = {
  id: "sample-arch-1",
  title: "Cloud Native Microservices Architecture",
  description: "Scalable event-driven system with API Gateway, Auth, and Kafka stream",
  theme: "dark",
  nodes: [
    {
      id: "client",
      type: "actor",
      label: "Web & Mobile Clients",
      description: "Next.js SPA & iOS/Android Apps",
      x: 100,
      y: 200,
      color: "sky",
      shape: "rounded",
    },
    {
      id: "cdn",
      type: "cloud",
      label: "Edge CDN & WAF",
      description: "Cloudflare Global Edge",
      x: 340,
      y: 200,
      color: "indigo",
      shape: "cloud",
    },
    {
      id: "gateway",
      type: "process",
      label: "API Gateway",
      description: "Reverse proxy, rate limiting, routing",
      x: 580,
      y: 200,
      color: "emerald",
      shape: "rectangle",
    },
    {
      id: "auth-service",
      type: "system",
      label: "Auth Service",
      description: "JWT & OAuth2 Session verification",
      x: 820,
      y: 80,
      color: "amber",
      shape: "rounded",
    },
    {
      id: "ai-service",
      type: "system",
      label: "AI Orchestrator Service",
      description: "Gemini 3.7 Pro, embeddings, agent loop",
      x: 820,
      y: 200,
      color: "purple",
      shape: "rounded",
    },
    {
      id: "data-service",
      type: "system",
      label: "Data & Storage Service",
      description: "CRUD, documents & file metadata",
      x: 820,
      y: 320,
      color: "sky",
      shape: "rounded",
    },
    {
      id: "vector-db",
      type: "database",
      label: "Vector DB (Pinecone / PgVector)",
      description: "Semantic embeddings index",
      x: 1100,
      y: 200,
      color: "rose",
      shape: "cylinder",
    },
    {
      id: "main-db",
      type: "database",
      label: "Primary Database (PostgreSQL)",
      description: "Transactional records with replicas",
      x: 1100,
      y: 320,
      color: "emerald",
      shape: "cylinder",
    },
  ],
  edges: [
    { id: "e1", source: "client", target: "cdn", label: "HTTPS / WSS", animated: true },
    { id: "e2", source: "cdn", target: "gateway", label: "gRPC / HTTP" },
    { id: "e3", source: "gateway", target: "auth-service", label: "Verify Token" },
    { id: "e4", source: "gateway", target: "ai-service", label: "AI Requests", animated: true },
    { id: "e5", source: "gateway", target: "data-service", label: "CRUD Operations" },
    { id: "e6", source: "ai-service", target: "vector-db", label: "Similarity Search" },
    { id: "e7", source: "data-service", target: "main-db", label: "Read / Write" },
  ],
};

/**
 * Parse canvas markdown code blocks (JSON or structured text)
 */
export function parseCanvasDiagram(content: string, defaultTitle = "Interactive AI Canvas"): CanvasDiagram {
  try {
    const trimmed = content.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
        return {
          id: parsed.id || `canvas-${Date.now()}`,
          title: parsed.title || defaultTitle,
          description: parsed.description,
          theme: parsed.theme || "dark",
          nodes: parsed.nodes.map((n: any, idx: number) => ({
            id: String(n.id || `node-${idx}`),
            type: (n.type as CanvasNodeType) || "process",
            label: String(n.label || "Node"),
            description: n.description ? String(n.description) : undefined,
            x: typeof n.x === "number" ? n.x : 100 + (idx % 3) * 260,
            y: typeof n.y === "number" ? n.y : 100 + Math.floor(idx / 3) * 160,
            color: (n.color as CanvasNodeColor) || "sky",
            shape: n.shape || "rounded",
          })),
          edges: Array.isArray(parsed.edges)
            ? parsed.edges.map((e: any, idx: number) => ({
                id: String(e.id || `edge-${idx}`),
                source: String(e.source),
                target: String(e.target),
                label: e.label ? String(e.label) : undefined,
                animated: Boolean(e.animated),
                style: e.style || "solid",
              }))
            : [],
        };
      }
    }

    // Fallback: Parse simple line-based format or mermaid style
    const nodes: CanvasNode[] = [];
    const edges: CanvasEdge[] = [];
    const lines = trimmed.split("\n");
    let nodeIndex = 0;

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith("#") || cleanLine.startsWith("//")) continue;

      // Handle A --> B or A -> B with optional [Label]
      const arrowMatch = cleanLine.match(/^([A-Za-z0-9_-]+)\s*(?:-->|->)\s*([A-Za-z0-9_-]+)(?:\s*\[(.*?)\])?$/);
      if (arrowMatch) {
        const sourceId = arrowMatch[1];
        const targetId = arrowMatch[2];
        const edgeLabel = arrowMatch[3];

        if (!nodes.find((n) => n.id === sourceId)) {
          nodes.push({
            id: sourceId,
            type: "process",
            label: sourceId.replace(/[-_]/g, " "),
            x: 100 + (nodeIndex % 4) * 240,
            y: 100 + Math.floor(nodeIndex / 4) * 160,
            color: "sky",
          });
          nodeIndex++;
        }

        if (!nodes.find((n) => n.id === targetId)) {
          nodes.push({
            id: targetId,
            type: "system",
            label: targetId.replace(/[-_]/g, " "),
            x: 100 + (nodeIndex % 4) * 240,
            y: 100 + Math.floor(nodeIndex / 4) * 160,
            color: "indigo",
          });
          nodeIndex++;
        }

        edges.push({
          id: `e-${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          label: edgeLabel,
        });
      }
    }

    if (nodes.length > 0) {
      return {
        id: `canvas-${Date.now()}`,
        title: defaultTitle,
        nodes,
        edges,
        theme: "dark",
      };
    }
  } catch {
    // Return sample diagram on parse error
  }

  return SAMPLE_ARCHITECTURE_DIAGRAM;
}

/**
 * Generate vector SVG string of the canvas for instant high-res export
 */
export function exportCanvasToSvg(diagram: CanvasDiagram): string {
  const minX = Math.min(...diagram.nodes.map((n) => n.x), 50) - 60;
  const minY = Math.min(...diagram.nodes.map((n) => n.y), 50) - 60;
  const maxX = Math.max(...diagram.nodes.map((n) => n.x + (n.width || 180)), 800) + 60;
  const maxY = Math.max(...diagram.nodes.map((n) => n.y + (n.height || 90)), 600) + 60;
  const width = maxX - minX;
  const height = maxY - minY;

  const nodeMap = new Map<string, CanvasNode>();
  diagram.nodes.forEach((n) => nodeMap.set(n.id, n));

  const edgeElements = diagram.edges
    .map((edge) => {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);
      if (!src || !tgt) return "";

      const x1 = src.x + (src.width || 180) / 2;
      const y1 = src.y + (src.height || 90) / 2;
      const x2 = tgt.x + (tgt.width || 180) / 2;
      const y2 = tgt.y + (tgt.height || 90) / 2;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      return `
        <g>
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#38bdf8" stroke-width="2" stroke-dasharray="${edge.style === "dashed" ? "6,6" : "none"}" />
          <circle cx="${x2}" cy="${y2}" r="4" fill="#38bdf8" />
          ${
            edge.label
              ? `<rect x="${midX - 40}" y="${midY - 12}" width="80" height="20" rx="4" fill="#0f172a" stroke="#334155" />
                 <text x="${midX}" y="${midY + 2}" font-family="system-ui" font-size="10" fill="#94a3b8" text-anchor="middle">${edge.label}</text>`
              : ""
          }
        </g>
      `;
    })
    .join("\n");

  const nodeElements = diagram.nodes
    .map((node) => {
      const w = node.width || 180;
      const h = node.height || 84;
      return `
        <g transform="translate(${node.x}, ${node.y})">
          <rect width="${w}" height="${h}" rx="12" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))" />
          <text x="14" y="28" font-family="system-ui" font-size="13" font-weight="600" fill="#f8fafc">${node.label}</text>
          ${
            node.description
              ? `<text x="14" y="48" font-family="system-ui" font-size="10" fill="#94a3b8">${node.description.slice(0, 32)}</text>`
              : ""
          }
        </g>
      `;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}" style="background-color: #0b0f19;">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="1" fill="#1e293b" />
    </pattern>
  </defs>
  <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="url(#grid)" />
  <text x="${minX + 30}" y="${minY + 40}" font-family="system-ui" font-size="18" font-weight="bold" fill="#ffffff">${diagram.title}</text>
  <g>${edgeElements}</g>
  <g>${nodeElements}</g>
</svg>`;
}
