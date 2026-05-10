import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { FONT_SIZE_OPTIONS, LINE_SPACING_OPTIONS, emptyFormattingState } from "@monoscape/document-core";
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
    props.selectedFontSize === null ? "" : String(props.selectedFontSize)
  );
  const [fontSizeError, setFontSizeError] = createSignal("");
  const [lineSpacingDraft, setLineSpacingDraft] = createSignal(
    props.selectedLineSpacing === null ? "" : formatLineSpacingValue(props.selectedLineSpacing)
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
    const query = fontSizeDraft().trim();
    const options = [...sizes].sort((left, right) => left - right);
    return query ? options.filter((size) => `${size}`.includes(query)) : options;
  };

  const visibleLineSpacingOptions = () => {
    const spacing = new Set(LINE_SPACING_OPTIONS);
    if (props.selectedLineSpacing !== null) {
      spacing.add(Number(formatLineSpacingValue(props.selectedLineSpacing)));
    }
    const query = lineSpacingDraft().trim();
    const options = [...spacing].sort((left, right) => left - right);
    return query
      ? options.filter((value) => labelLineSpacingOption(value).toLowerCase().includes(query.toLowerCase()))
      : options;
  };

  const handleFontSizeCommit = (value: string, options?: { focusEditor?: boolean }) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setFontSizeDraft(props.selectedFontSize === null ? "" : String(props.selectedFontSize));
      setFontSizeError("");
      return;
    }

    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      setFontSizeError("Font size must be a number.");
      return;
    }

    const normalized = Math.round(parsed);
    if (normalized < 4 || normalized > 72) {
      setFontSizeError("Font size must be between 4 and 72 points.");
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
      setLineSpacingDraft(
        props.selectedLineSpacing === null ? "" : formatLineSpacingValue(props.selectedLineSpacing)
      );
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
    if (!isFontSizeMenuOpen() && props.selectedFontSize !== null) {
      setFontSizeDraft(String(props.selectedFontSize));
    }
  });

  createEffect(() => {
    if (!isLineSpacingMenuOpen() && props.selectedLineSpacing !== null) {
      setLineSpacingDraft(formatLineSpacingValue(props.selectedLineSpacing));
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
