// Typography formatting with font family, size, and color

import { createSignal } from "solid-js";
import type {
  FontCatalogEntry,
  TypographyPatch,
  TypographySettings,
  NormalizedColor
} from "@monoscape/document-core";
import {
  DEFAULT_TYPOGRAPHY,
  resolveKnownFontFamily,
  resolveUniformValue,
  formatColorForCss
} from "@monoscape/document-core";
import { collectTextSegments } from "../utils/blockTraversal";
import {
  applyTypographyStyles,
  cleanupTypingSpans,
  isTypographySpan,
  placeCaretInsideTypingSpan,
  wrapTextSegment
} from "../utils/typographySpans";
import type { UseEditorSelectionResult } from "./useEditorSelection";

export interface UseTypographyFormattingResult {
  activeTypography: () => TypographySettings;
  selectedTypography: () => TypographySettings | null;
  selectedColor: () => NormalizedColor | null;
  applyTypographyPatch: (patch: TypographyPatch, color?: NormalizedColor | null) => void;
  syncFromRange: (range: Range) => void;
  syncFromSelection: () => void;
}

function readFontSizeInPoints(value: string): number {
  if (value.endsWith("pt")) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? Math.max(4, Math.round(parsed)) : DEFAULT_TYPOGRAPHY.fontSize;
  }

  if (value.endsWith("px")) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed)
      ? Math.max(4, Math.round((parsed * 72) / 96))
      : DEFAULT_TYPOGRAPHY.fontSize;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(4, Math.round(parsed)) : DEFAULT_TYPOGRAPHY.fontSize;
}

export function useTypographyFormatting(
  editorRef: () => HTMLDivElement | undefined,
  fonts: () => FontCatalogEntry[],
  findFont: (family: string) => FontCatalogEntry,
  selection: UseEditorSelectionResult
): UseTypographyFormattingResult {
  const [activeTypography, setActiveTypography] = createSignal(DEFAULT_TYPOGRAPHY);
  const [selectedTypography, setSelectedTypography] = createSignal<TypographySettings | null>(null);
  const [selectedColor, setSelectedColor] = createSignal<NormalizedColor | null>(null);

  const readTypographyFromNode = (node: Node | null): TypographySettings => {
    const editor = editorRef();
    if (!editor) return DEFAULT_TYPOGRAPHY;

    const fallback = getComputedStyle(editor);
    const element = node instanceof HTMLElement ? node : node?.parentElement ?? editor;
    const styles = getComputedStyle(element);

    return {
      fontFamily: resolveKnownFontFamily(styles.fontFamily, fonts().map((font) => font.family)),
      fontSize: readFontSizeInPoints(styles.fontSize || fallback.fontSize)
    };
  };

  const readColorFromNode = (node: Node | null): string | null => {
    const editor = editorRef();
    if (!editor) return null;

    const element = node instanceof HTMLElement ? node : node?.parentElement ?? editor;
    const styles = getComputedStyle(element);
    
    const color = styles.color;
    if (!color || color === "inherit" || color === getComputedStyle(editor).color) {
      return null;
    }
    
    return color;
  };

  const resolveSampleNode = (range: Range) => {
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      return range.startContainer;
    }

    const container = range.startContainer;
    const childNodes = container.childNodes;
    if (!childNodes.length) {
      return container;
    }

    return childNodes[range.startOffset - 1] ?? childNodes[range.startOffset] ?? container;
  };

  const readTypographyFromRange = (range: Range): TypographySettings => {
    return readTypographyFromNode(resolveSampleNode(range));
  };

  const readToolbarTypographyFromRange = (range: Range): TypographySettings | null => {
    const editor = editorRef();
    if (!editor) return null;

    if (range.collapsed) {
      return readTypographyFromRange(range);
    }

    const segments = collectTextSegments(range, editor);
    if (!segments.length) {
      return readTypographyFromRange(range);
    }

    const samples = segments.map(({ node }) => readTypographyFromNode(node));
    const fontFamily = resolveUniformValue(samples.map((sample) => sample.fontFamily));
    const fontSize = resolveUniformValue(samples.map((sample) => sample.fontSize));

    if (fontFamily === null && fontSize === null) return null;

    return {
      fontFamily: fontFamily ?? DEFAULT_TYPOGRAPHY.fontFamily,
      fontSize: fontSize ?? DEFAULT_TYPOGRAPHY.fontSize
    };
  };

  const readColorFromRange = (range: Range): NormalizedColor | null => {
    const editor = editorRef();
    if (!editor) return null;

    if (range.collapsed) {
      const colorValue = readColorFromNode(resolveSampleNode(range));
      return colorValue ? { hex: colorValue } as NormalizedColor : null;
    }

    const segments = collectTextSegments(range, editor);
    if (!segments.length) return null;

    const colors = segments.map(({ node }) => readColorFromNode(node));
    const uniformColor = resolveUniformValue(colors);
    
    return uniformColor ? { hex: uniformColor } as NormalizedColor : null;
  };

  const syncFromRange = (range: Range) => {
    setActiveTypography(readTypographyFromRange(range));
    setSelectedTypography(readToolbarTypographyFromRange(range));
    setSelectedColor(readColorFromRange(range));
  };

  const syncFromSelection = () => {
    if (!selection.selectionBelongsToEditor()) {
      return;
    }

    const editor = editorRef();
    if (!editor) {
      return;
    }

    const sel = document.getSelection();
    if (!sel?.rangeCount) {
      return;
    }

    cleanupTypingSpans(editor);
    const range = sel.getRangeAt(0);
    selection.syncRange(range);
    syncFromRange(range);
  };

  const applyTypographyToExpandedRange = (range: Range, patch: TypographyPatch, color?: NormalizedColor | null) => {
    const editor = editorRef();
    if (!editor) {
      return false;
    }

    const segments = collectTextSegments(range, editor);
    if (!segments.length) {
      return false;
    }

    const colorValue = color === undefined ? undefined : color ? formatColorForCss(color) : null;

    const wrappedSegments = segments
      .map(({ node, start, end }) =>
        wrapTextSegment(node, start, end, patch, {
          readTypography: readTypographyFromNode,
          findFont,
          color: colorValue
        })
      )
      .filter((span): span is HTMLSpanElement => Boolean(span));

    if (!wrappedSegments.length) {
      return false;
    }

    const nextRange = document.createRange();
    nextRange.setStartBefore(wrappedSegments[0]);
    nextRange.setEndAfter(wrappedSegments[wrappedSegments.length - 1]);
    selection.setSelection(nextRange);
    return true;
  };

  const ensureTypingSpan = (range: Range, nextTypography: TypographySettings, color?: NormalizedColor | null) => {
    const activeSpan =
      range.startContainer instanceof Text
        ? range.startContainer.parentElement
        : range.startContainer instanceof HTMLElement
          ? range.startContainer.closest('span[data-monoscape-typing="true"]')
          : null;

    const colorValue = color === undefined ? undefined : color ? formatColorForCss(color) : null;

    if (activeSpan instanceof HTMLSpanElement && activeSpan.dataset.monoscapeTyping === "true") {
      applyTypographyStyles(activeSpan, nextTypography, findFont, colorValue);
      placeCaretInsideTypingSpan(activeSpan);
      return activeSpan;
    }

    const typingSpan = document.createElement("span");
    typingSpan.dataset.monoscapeTyping = "true";
    applyTypographyStyles(typingSpan, nextTypography, findFont, colorValue);
    range.insertNode(typingSpan);
    placeCaretInsideTypingSpan(typingSpan);
    return typingSpan;
  };

  const applyTypographyPatch = (patch: TypographyPatch, color?: NormalizedColor | null) => {
    const range = selection.restoreRange();
    if (!range) {
      return;
    }

    const nextTypography = {
      ...readTypographyFromRange(range),
      ...patch
    };

    if (range.collapsed) {
      ensureTypingSpan(range, nextTypography, color);
      const sel = document.getSelection();
      if (sel?.rangeCount) {
        syncFromRange(sel.getRangeAt(0));
        return;
      }
      setActiveTypography(nextTypography);
      setSelectedTypography(nextTypography);
      if (color !== undefined) {
        setSelectedColor(color);
      }
      return;
    }

    if (applyTypographyToExpandedRange(range, patch, color)) {
      const sel = document.getSelection();
      if (sel?.rangeCount) {
        syncFromRange(sel.getRangeAt(0));
        return;
      }
      setActiveTypography(nextTypography);
      setSelectedTypography(nextTypography);
      if (color !== undefined) {
        setSelectedColor(color);
      }
      return;
    }

    setActiveTypography(nextTypography);
    setSelectedTypography(nextTypography);
    if (color !== undefined) {
      setSelectedColor(color);
    }
  };

  return {
    activeTypography,
    selectedTypography,
    selectedColor,
    applyTypographyPatch,
    syncFromRange,
    syncFromSelection
  };
}

