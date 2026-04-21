export type WorkspaceMode = "essay" | "notes" | "quick-capture" | "peer-review";

export interface WorkflowTemplate {
  id: string;
  label: string;
  mode: WorkspaceMode;
  extensionIds: string[];
}

export interface DocumentWorkspaceSeed {
  title: string;
  mode: WorkspaceMode;
  checklist: string[];
}

export const defaultWorkflowTemplates: WorkflowTemplate[] = [
  {
    id: "research-essay",
    label: "Research essay",
    mode: "essay",
    extensionIds: ["monoscape.citations", "monoscape.review"]
  },
  {
    id: "lecture-notes",
    label: "Lecture notes",
    mode: "notes",
    extensionIds: ["monoscape.review"]
  },
  {
    id: "quick-capture",
    label: "Quick capture",
    mode: "quick-capture",
    extensionIds: []
  }
];

export function createWorkspaceSeed(
  title: string,
  mode: WorkspaceMode
): DocumentWorkspaceSeed {
  const checklistByMode: Record<WorkspaceMode, string[]> = {
    essay: ["Capture prompt", "Outline argument", "Verify citations"],
    notes: ["Record main ideas", "Highlight follow-up questions", "Tag readings"],
    "quick-capture": ["Capture idea", "Link class context", "Schedule revision"],
    "peer-review": ["Summarize feedback", "Resolve comments", "Prepare submission"]
  };

  return {
    title,
    mode,
    checklist: checklistByMode[mode]
  };
}

// --- Rich text formatting ---

export type FormattingMark = 'bold' | 'italic' | 'underline';

export interface FormattingState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export interface TypographySettings {
  fontFamily: string;
  fontSize: number; // in points
}

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
  fontFamily: 'Liberation Serif',
  fontSize: 12,
};

export function emptyFormattingState(): FormattingState {
  return { bold: false, italic: false, underline: false };
}
