export type ProactiveCategory =
  | "code"
  | "test"
  | "summary"
  | "visual"
  | "export"
  | "critique";

export interface ProactiveAction {
  id: string;
  label: string;
  prompt: string;
  category: ProactiveCategory;
}
