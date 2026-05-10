// Selection snapshot and restoration

import { createSignal, onCleanup, onMount } from "solid-js";

export interface UseEditorSelectionResult {
  savedRange: () => Range | null;
  syncRange: (range: Range) => void;
  setSelection: (range: Range) => void;
  restoreRange: () => Range | null;
  createRangeAtEnd: () => Range | null;
  selectionBelongsToEditor: (selection?: Selection | null) => boolean;
}

export function useEditorSelection(editorRef: () => HTMLDivElement | undefined): UseEditorSelectionResult {
  let saved: Range | null = null;

  const syncRange = (range: Range) => {
    saved = range.cloneRange();
  };

  const setSelection = (range: Range) => {
    const selection = document.getSelection();
    if (!selection) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(range);
    syncRange(range);
  };

  const createRangeAtEnd = () => {
    const editor = editorRef();
    if (!editor) {
      return null;
    }

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    return range;
  };

  const restoreRange = () => {
    const editor = editorRef();
    if (!editor) {
      return null;
    }

    editor.focus();

    if (saved) {
      const nextRange = saved.cloneRange();
      if (editor.contains(nextRange.startContainer) && editor.contains(nextRange.endContainer)) {
        setSelection(nextRange);
        return nextRange;
      }

      saved = null;
    }

    const range = createRangeAtEnd();
    if (!range) {
      return null;
    }

    setSelection(range);
    return range;
  };

  const selectionBelongsToEditor = (selection = document.getSelection()) => {
    const editor = editorRef();
    if (!editor || !selection?.rangeCount) {
      return false;
    }

    return editor.contains(selection.getRangeAt(0).commonAncestorContainer);
  };

  return {
    savedRange: () => saved,
    syncRange,
    setSelection,
    restoreRange,
    createRangeAtEnd,
    selectionBelongsToEditor
  };
}
