export interface WorkspaceFile {
  name: string;
  path: string;
  language: string;
  content: string;
  isEntry?: boolean;
}

export interface ProjectWorkspaceData {
  id: string;
  title: string;
  description: string;
  files: WorkspaceFile[];
  activeFilePath?: string;
  previewType?: "html" | "react" | "node" | "none";
}
