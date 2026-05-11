import type { WorkspaceMode } from "@monoscape/document-core";
import { invoke } from "@tauri-apps/api/tauri";

const hasTauri = typeof window !== "undefined" && "__TAURI_IPC__" in window;

const DESKTOP_DOCUMENT_COMMANDS = {
  openDocumentDialog: "open_document_dialog",
  readDocumentFromPath: "read_document_from_path",
  saveDocumentToPath: "save_document_to_path",
  saveDocumentAsDialog: "save_document_as_dialog",
  saveDocumentCopyDialog: "save_document_copy_dialog",
  listRecentDocuments: "list_recent_documents",
  exportPdfBytes: "export_pdf_bytes"
} as const;

export type DesktopWorkspaceMode = WorkspaceMode | string;

export interface DesktopDocumentDraft {
  title: string;
  workspaceMode: DesktopWorkspaceMode;
  createdAt?: number;
  editorHtml: string;
}

export interface DesktopDocumentFile extends DesktopDocumentDraft {
  path: string;
  updatedAt: number;
  lastModified: number;
  fileSize: number;
  available: boolean;
}

export interface RecentDesktopDocument {
  title: string;
  path: string;
  workspaceMode: DesktopWorkspaceMode;
  createdAt: number;
  updatedAt: number;
  lastModified: number;
  fileSize: number;
  available: boolean;
}

export interface DocumentSaveDialogOptions {
  suggestedPath?: string;
  suggestedName?: string;
}

export interface PdfExportOptions {
  outputPath?: string;
  suggestedName?: string;
}

export interface PdfExportResult {
  path: string;
  fileSize: number;
  lastModified: number;
}

function assertDesktopFileIOAvailable() {
  if (!hasTauri) {
    throw new Error("Desktop document file I/O is only available inside the Tauri shell.");
  }
}

async function invokeDesktopCommand<T>(command: string, args?: Record<string, unknown>) {
  assertDesktopFileIOAvailable();
  return invoke<T>(command, args);
}

function toPdfByteArray(pdfBytes: Uint8Array | ArrayBuffer | number[]): number[] {
  if (Array.isArray(pdfBytes)) {
    return pdfBytes;
  }

  if (pdfBytes instanceof Uint8Array) {
    return Array.from(pdfBytes);
  }

  return Array.from(new Uint8Array(pdfBytes));
}

export function isDesktopDocumentFileIOAvailable() {
  return hasTauri;
}

export function openDocumentDialog() {
  return invokeDesktopCommand<DesktopDocumentFile | null>(
    DESKTOP_DOCUMENT_COMMANDS.openDocumentDialog
  );
}

export function readDocumentFromPath(path: string) {
  return invokeDesktopCommand<DesktopDocumentFile>(
    DESKTOP_DOCUMENT_COMMANDS.readDocumentFromPath,
    { path }
  );
}

export function saveDocument(path: string, document: DesktopDocumentDraft) {
  return invokeDesktopCommand<DesktopDocumentFile>(DESKTOP_DOCUMENT_COMMANDS.saveDocumentToPath, {
    path,
    document
  });
}

export function saveDocumentAs(
  document: DesktopDocumentDraft,
  options: DocumentSaveDialogOptions = {}
) {
  return invokeDesktopCommand<DesktopDocumentFile | null>(
    DESKTOP_DOCUMENT_COMMANDS.saveDocumentAsDialog,
    {
      request: {
        document,
        suggestedPath: options.suggestedPath,
        suggestedName: options.suggestedName
      }
    }
  );
}

export function saveDocumentCopy(
  document: DesktopDocumentDraft,
  options: DocumentSaveDialogOptions = {}
) {
  return invokeDesktopCommand<DesktopDocumentFile | null>(
    DESKTOP_DOCUMENT_COMMANDS.saveDocumentCopyDialog,
    {
      request: {
        document,
        suggestedPath: options.suggestedPath,
        suggestedName: options.suggestedName
      }
    }
  );
}

export function listRecentDocuments() {
  return invokeDesktopCommand<RecentDesktopDocument[]>(
    DESKTOP_DOCUMENT_COMMANDS.listRecentDocuments
  );
}

export function exportPdfBytes(
  pdfBytes: Uint8Array | ArrayBuffer | number[],
  options: PdfExportOptions = {}
) {
  return invokeDesktopCommand<PdfExportResult | null>(DESKTOP_DOCUMENT_COMMANDS.exportPdfBytes, {
    request: {
      pdfBytes: toPdfByteArray(pdfBytes),
      outputPath: options.outputPath,
      suggestedName: options.suggestedName
    }
  });
}

export const desktopDocumentFileIO = {
  isAvailable: isDesktopDocumentFileIOAvailable,
  openDocumentDialog,
  readDocumentFromPath,
  saveDocument,
  saveDocumentAs,
  saveDocumentCopy,
  listRecentDocuments,
  exportPdfBytes
} as const;