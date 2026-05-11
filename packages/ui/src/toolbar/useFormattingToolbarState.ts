import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { DEFAULT_LINE_SPACING, DEFAULT_TYPOGRAPHY, FONT_SIZE_OPTIONS, LINE_SPACING_OPTIONS, emptyFormattingState } from "@monoscape/document-core";
import type { FormattingState } from "@monoscape/document-core";
import { formatLineSpacingValue, labelLineSpacingOption } from "./constants";

interface FormattingToolbarStateProps {
  editorRef: () => HTMLDivElement | undefined;
  selectedFontSize: number | null;
  selectedLineSpacing: number | null;
  onFontSizeChange: (fontSize: number) => void;
  onLineSpacingChange: (lineSpacing: number) => void;
}

export function useFormattingToolbarState(props: FormattingToolbarStateProps) {
  const [formattingState, setFormattingState] = createSignal<FormattingState>(emptyFormattingState());
  const [fontSizeDraft, setFontSizeDraft] = createSignal(
    String(props.selectedFontSize ?? DEFAULT_TYPOGRAPHY.fontSize)
  );
  const [fontSizeError, setFontSizeError] = createSignal("");
  const [lineSpacingDraft, setLineSpacingDraft] = createSignal(
    formatLineSpacingValue(props.selectedLineSpacing ?? DEFAULT_LINE_SPACING)
  );
  const [lineSpacingError, setLineSpacingError] = createSignal("");
  const [isFontPickerOpen, setIsFontPickerOpen] = createSignal(false);
  const [isFontSizeMenuOpen, setIsFontSizeMenuOpen] = createSignal(false);
  const [isLineSpacingMenuOpen, setIsLineSpacingMenuOpen] = createSignal(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = createSignal(false);
  const [isStyleSetOpen, setIsStyleSetOpen] = createSignal(false);

  const selectionLivesInEditor = () => {
    const editor = props.editorRef();
    const selection = document.getSelection();
    if (!editor || !selection?.anchorNode) return false;
    return editor.contains(selection.anchorNode);
  };

  const updateState = () => {
    if (!selectionLivesInEditor()) {
      setFormattingState(emptyFormattingState());
      return;
    }

    setFormattingState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikethrough: document.queryCommandState("strikeThrough"),
      superscript: document.queryCommandState("superscript"),
      subscript: document.queryCommandState("subscript")
    });
  };

  const focusEditor = () => {
    const editor = props.editorRef();
    if (editor) {
      editor.focus();
      updateState();
    }
  };

  const execInlineFormat = (command: string) => {
    const editor = props.editorRef();
    if (editor) editor.focus();
    document.execCommand(command);
    updateState();
  };

  const visibleFontSizes = () => {
    const sizes = new Set(FONT_SIZE_OPTIONS);
    if (props.selectedFontSize !== null) sizes.add(props.selectedFontSize);
    return [...sizes].sort((left, right) => left - right);
  };

  const visibleLineSpacingOptions = () => {
    const spacing = new Set(LINE_SPACING_OPTIONS);
    if (props.selectedLineSpacing !== null) {
      spacing.add(Number(formatLineSpacingValue(props.selectedLineSpacing)));
    }
    return [...spacing].sort((left, right) => left - right);
  };

  const handleFontSizeCommit = (value: string, options?: { focusEditor?: boolean }) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setFontSizeDraft(String(props.selectedFontSize ?? DEFAULT_TYPOGRAPHY.fontSize));
      setFontSizeError("");
      return;
    }

    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      setFontSizeError("Font size must be a number.");
      return;
    }

    const normalized = Math.round(parsed);
    if (normalized < 1) {
      setFontSizeError("Font size must be at least 1 point.");
      return;
    }

    setFontSizeError("");
    setFontSizeDraft(String(normalized));
    props.onFontSizeChange(normalized);
    setIsFontSizeMenuOpen(false);
    if (options?.focusEditor ?? true) queueMicrotask(() => focusEditor());
  };

  const handleLineSpacingCommit = (value: string, options?: { focusEditor?: boolean }) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setLineSpacingDraft(formatLineSpacingValue(props.selectedLineSpacing ?? DEFAULT_LINE_SPACING));
      setLineSpacingError("");
      return;
    }

    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      setLineSpacingError("Line spacing must be a number.");
      return;
    }

    if (parsed < 0.5 || parsed > 6) {
      setLineSpacingError("Line spacing must be between 0.5 and 6.");
      return;
    }

    const normalized = Number(formatLineSpacingValue(parsed));
    setLineSpacingError("");
    setLineSpacingDraft(formatLineSpacingValue(normalized));
    props.onLineSpacingChange(normalized);
    setIsLineSpacingMenuOpen(false);
    if (options?.focusEditor ?? true) queueMicrotask(() => focusEditor());
  };

  // Only sync draft from external when the external value is concrete.
  // When null (mixed selection), preserve the last committed or typed value so
  // a freshly-committed input isn't reset before the selection has re-synced.
  createEffect(() => {
    if (!isFontSizeMenuOpen()) {
      setFontSizeDraft(String(props.selectedFontSize ?? DEFAULT_TYPOGRAPHY.fontSize));
    }
  });

  createEffect(() => {
    if (!isLineSpacingMenuOpen()) {
      setLineSpacingDraft(formatLineSpacingValue(props.selectedLineSpacing ?? DEFAULT_LINE_SPACING));
    }
  });

  onMount(() => {
    document.addEventListener("selectionchange", updateState);
  });

  onCleanup(() => {
    document.removeEventListener("selectionchange", updateState);
  });

  return {
    formattingState,
    fontSizeDraft,
    fontSizeError,
    lineSpacingDraft,
    lineSpacingError,
    isFontPickerOpen,
    isFontSizeMenuOpen,
    isLineSpacingMenuOpen,
    isColorPickerOpen,
    isStyleSetOpen,
    setFontSizeDraft,
    setLineSpacingDraft,
    setIsFontPickerOpen,
    setIsFontSizeMenuOpen,
    setIsLineSpacingMenuOpen,
    setIsColorPickerOpen,
    setIsStyleSetOpen,
    visibleFontSizes,
    visibleLineSpacingOptions,
    handleFontSizeCommit,
    handleLineSpacingCommit,
    execInlineFormat,
    focusEditor,
    updateState
  };
}
