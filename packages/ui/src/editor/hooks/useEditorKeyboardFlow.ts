// Editor keyboard flow: Tab/Shift+Tab indentation, Ctrl+[/], Escape

import { cleanupTypingSpans } from "../utils/typographySpans";
import {
  buildPlainTextModel,
  boundaryIndex,
  createPlainTextRange,
  insertTextAtBoundary,
  selectionLineData
} from "../utils/plainTextModel";
import type { UseEditorSelectionResult } from "./useEditorSelection";

export interface UseEditorKeyboardFlowResult {
  changeLineIndent: (direction: "indent" | "outdent") => void;
  readIndentShortcut: (event: KeyboardEvent) => "indent" | "outdent" | null;
  navigateFocusOutside: (direction: "next" | "prev") => void;
}

export function useEditorKeyboardFlow(
  editorRef: () => HTMLDivElement | undefined,
  rootRef: () => HTMLDivElement | undefined,
  selection: UseEditorSelectionResult,
  syncFromSelection: () => void
): UseEditorKeyboardFlowResult {
  const restoreSelectionByIndices = (startIndex: number, endIndex: number) => {
    const editor = editorRef();
    if (!editor) {
      return;
    }

    const model = buildPlainTextModel(editor);
    if (!model) {
      return;
    }

    const range = createPlainTextRange(editor, model, startIndex, endIndex);
    selection.setSelection(range);
  };

  const changeLineIndent = (direction: "indent" | "outdent") => {
    const range = selection.restoreRange();
    const editor = editorRef();
    if (!range || !editor) {
      return;
    }

    cleanupTypingSpans(editor);
    const model = buildPlainTextModel(editor);
    if (!model) {
      return;
    }

    const { startIndex, endIndex, lineStarts } = selectionLineData(editor, model, range);

    if (direction === "indent") {
      [...lineStarts]
        .reverse()
        .forEach((lineStart) => insertTextAtBoundary(lineStart.boundary, "\t"));

      editor.normalize();
      const shiftStart = lineStarts.filter((lineStart) => lineStart.index <= startIndex).length;
      const shiftEnd = lineStarts.filter((lineStart) => lineStart.index <= endIndex).length;
      restoreSelectionByIndices(startIndex + shiftStart, endIndex + shiftEnd);
      syncFromSelection();
      return;
    }

    const removableLineStarts = lineStarts.filter((lineStart) => model.text[lineStart.index] === "\t");
    [...removableLineStarts]
      .sort((left, right) => right.index - left.index)
      .forEach((lineStart) => {
        const currentModel = buildPlainTextModel(editor);
        if (!currentModel) {
          return;
        }
        const deleteRange = createPlainTextRange(editor, currentModel, lineStart.index, lineStart.index + 1);
        deleteRange.deleteContents();
      });

    editor.normalize();
    const shiftStart = removableLineStarts.filter((lineStart) => lineStart.index <= startIndex).length;
    const shiftEnd = removableLineStarts.filter((lineStart) => lineStart.index <= endIndex).length;
    restoreSelectionByIndices(
      Math.max(0, startIndex - shiftStart),
      Math.max(0, endIndex - shiftEnd)
    );
    syncFromSelection();
  };

  const readIndentShortcut = (event: KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) {
      return null;
    }

    if (event.code === "BracketRight") {
      return "indent" as const;
    }

    if (event.code === "BracketLeft") {
      return "outdent" as const;
    }

    return null;
  };

  const isSequentiallyFocusable = (element: HTMLElement) => {
    if (element.isContentEditable || element.hasAttribute("contenteditable")) {
      return true;
    }

    const tabIndex = element.tabIndex;
    if (tabIndex < 0 || element.hasAttribute("disabled")) {
      return false;
    }

    if (element.getAttribute("aria-hidden") === "true") {
      return false;
    }

    if (element instanceof HTMLInputElement && element.type === "hidden") {
      return false;
    }

    if (
      element instanceof HTMLButtonElement ||
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLAnchorElement
    ) {
      return true;
    }

    return tabIndex >= 0;
  };

  const navigateFocusOutside = (direction: "next" | "prev") => {
    const root = rootRef();
    if (!root) {
      return;
    }

    const focusable = Array.from(root.ownerDocument.querySelectorAll<HTMLElement>("*")).filter(
      (element) => isSequentiallyFocusable(element) && !root.contains(element)
    );

    const target =
      direction === "next"
        ? focusable.find(
            (element) =>
              (root.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
          )
        : [...focusable]
            .reverse()
            .find(
              (element) =>
                (root.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING) !== 0
            );

    target?.focus();
  };

  return {
    changeLineIndent,
    readIndentShortcut,
    navigateFocusOutside
  };
}
