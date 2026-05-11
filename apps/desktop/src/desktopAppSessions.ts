import { createWorkspaceSeed, defaultWorkflowTemplates, type WorkspaceMode } from "@monoscape/document-core";
import type { DesktopDocumentDraft, DesktopDocumentFile, DesktopWorkspaceMode } from "./documentFileIO";
import { escapeHtml } from "./desktopAppHelpers";

export type DesktopAppView = "welcome" | "editor";
export type StatusTone = "neutral" | "success" | "danger";

export interface DesktopStatusMessage {
  tone: StatusTone;
  text: string;
}

export interface DesktopDocumentSession {
  id: string;
  title: string;
  workspaceMode: DesktopWorkspaceMode;
  createdAt: number;
  updatedAt: number;
  editorHtml: string;
  savedHtml: string;
  path?: string;
  lastModified?: number;
  fileSize?: number;
  available: boolean;
}

export const DEFAULT_BLANK_TITLE = "Untitled document";
export const DEFAULT_WORKSPACE_MODE: WorkspaceMode = "notes";
export const FALLBACK_RECENT_STATUS: DesktopStatusMessage = {
  tone: "neutral",
  text: "Choose a blank document, a preset, or an existing file to start drafting."
};

export function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `desktop-session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatPresetTitle(label: string) {
  return `Untitled ${label}`.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function createDocumentSession(
  title: string,
  workspaceMode: DesktopWorkspaceMode,
  editorHtml: string
): DesktopDocumentSession {
  const timestamp = Date.now();
  return {
    id: createSessionId(),
    title,
    workspaceMode,
    createdAt: timestamp,
    updatedAt: timestamp,
    editorHtml,
    savedHtml: editorHtml,
    available: true
  };
}

export function createBlankDocumentSession() {
  return createDocumentSession(DEFAULT_BLANK_TITLE, DEFAULT_WORKSPACE_MODE, "");
}

export function createTemplateDocumentSession(templateId: string) {
  const template = defaultWorkflowTemplates.find((entry) => entry.id === templateId);
  if (!template) {
    return createBlankDocumentSession();
  }

  const title = formatPresetTitle(template.label);
  const seed = createWorkspaceSeed(title, template.mode);
  const checklistHtml = seed.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const editorHtml = `
    <h1>${escapeHtml(title)}</h1>
    <p><br></p>
    <h2>Focus checklist</h2>
    <ul>${checklistHtml}</ul>
    <p><br></p>
  `.trim();

  return createDocumentSession(title, seed.mode, editorHtml);
}

export function createSessionFromFile(documentFile: DesktopDocumentFile): DesktopDocumentSession {
  return {
    id: createSessionId(),
    title: documentFile.title,
    workspaceMode: documentFile.workspaceMode,
    createdAt: documentFile.createdAt ?? documentFile.updatedAt,
    updatedAt: documentFile.updatedAt,
    editorHtml: documentFile.editorHtml,
    savedHtml: documentFile.editorHtml,
    path: documentFile.path,
    lastModified: documentFile.lastModified,
    fileSize: documentFile.fileSize,
    available: documentFile.available
  };
}

export function buildDocumentDraft(session: DesktopDocumentSession): DesktopDocumentDraft {
  return {
    title: session.title,
    workspaceMode: session.workspaceMode,
    createdAt: session.createdAt,
    editorHtml: session.editorHtml
  };
}
