export interface DocumentAnnotation {
  id: string;
  quote: string;
  comment: string;
  type: "risk" | "important" | "insight";
}

export interface DocumentSection {
  id: string;
  pageNumber: number;
  title: string;
  summary: string;
  content: string;
  keyTakeaways: string[];
  annotations?: DocumentAnnotation[];
}

export interface ExtractedDataTable {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
}

export interface InspectedDocumentData {
  id: string;
  title: string;
  docType: "pdf" | "contract" | "research-paper" | "financial-report" | "technical-spec";
  pageCount: number;
  authorOrOrg?: string;
  executiveSummary: string;
  sections: DocumentSection[];
  extractedTables?: ExtractedDataTable[];
}
