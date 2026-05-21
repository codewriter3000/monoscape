// Block formatting: alignment, line spacing, and academic style sets

import { createSignal } from "solid-js";
import type { TextAlignment, AcademicStyleSetId, AcademicBlockStyleId } from "@monoscape/document-core";
import { resolveUniformValue, getBlockStyle, formatColorForCss } from "@monoscape/document-core";
import { collectAffectedBlocks } from "../utils/blockTraversal";
import type { UseEditorSelectionResult } from "./useEditorSelection";

export interface UseBlockFormattingResult {
  selectedLineSpacing: () => number | null;
  selectedAlignment: () => TextAlignment | null;
  applyAlignment: (alignment: TextAlignment) => void;
  applyLineSpacing: (spacing: number) => void;
  applyStyleSet: (styleSetId: AcademicStyleSetId, blockStyleId: AcademicBlockStyleId) => void;
  applyParagraphIndent: (left: number, right: number, firstLine: number, hanging: number) => void;
  applyParagraphSpacing: (before: number, after: number) => void;
  syncFromRange: (range: Range) => void;
}

export function useBlockFormatting(
  editorRef: () => HTMLDivElement | undefined,
  selection: UseEditorSelectionResult
): UseBlockFormattingResult {
  const [selectedLineSpacing, setSelectedLineSpacing] = createSignal<number | null>(null);
  const [selectedAlignment, setSelectedAlignment] = createSignal<TextAlignment | null>(null);

  const formatLineSpacingValue = (value: number) => {
    return Number.isInteger(value)
      ? String(value)
      : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  };

  const readLineSpacingValue = (node: Node | null) => {
    const editor = editorRef();
    if (!editor) {
      return 1.5;
    }

    const element = node instanceof HTMLElement ? node : node?.parentElement ?? editor;
    const styles = getComputedStyle(element);
    if (styles.lineHeight === "normal") {
      return 1.5;
    }

    const normalizedLineHeight = styles.lineHeight.trim();
    if (/^[0-9]*\.?[0-9]+$/.test(normalizedLineHeight)) {
      return Number(formatLineSpacingValue(Number.parseFloat(normalizedLineHeight)));
    }

    const lineHeightPx = Number.parseFloat(styles.lineHeight);
    const fontSizePx = Number.parseFloat(styles.fontSize);
    if (!Number.isFinite(lineHeightPx) || !Number.isFinite(fontSizePx) || fontSizePx <= 0) {
      return 1.5;
    }

    return Number(formatLineSpacingValue(lineHeightPx / fontSizePx));
  };

  const normalizeTextAlignment = (value: string): TextAlignment => {
    const normalized = value.toLowerCase();
    if (normalized === "center") {
      return "center";
    }
    if (normalized === "right" || normalized === "end") {
      return "right";
    }
    if (normalized === "justify") {
      return "justify";
    }
    return "left";
  };

  const readAlignmentFromNode = (node: Node | null) => {
    const editor = editorRef();
    if (!editor) {
      return "left" as const;
    }

    const element = node instanceof HTMLElement ? node : node?.parentElement ?? editor;
    return normalizeTextAlignment(getComputedStyle(element).textAlign);
  };

  const readToolbarLineSpacingFromRange = (range: Range) => {
    const editor = editorRef();
    if (!editor) {
      return null;
    }

    if (range.collapsed) {
      const start = range.startContainer;
      return readLineSpacingValue(start);
    }

    return resolveUniformValue(collectAffectedBlocks(range, editor).map((block) => readLineSpacingValue(block)));
  };

  const readToolbarAlignmentFromRange = (range: Range) => {
    const editor = editorRef();
    if (!editor) {
      return null;
    }

    if (range.collapsed) {
      const start = range.startContainer;
      return readAlignmentFromNode(start);
    }

    return resolveUniformValue(collectAffectedBlocks(range, editor).map((block) => readAlignmentFromNode(block)));
  };

  const syncFromRange = (range: Range) => {
    setSelectedLineSpacing(readToolbarLineSpacingFromRange(range));
    setSelectedAlignment(readToolbarAlignmentFromRange(range));
  };

  const applyAlignment = (alignment: TextAlignment) => {
    const range = selection.restoreRange();
    if (!range) {
      return;
    }

    const editor = editorRef();
    if (!editor) {
      return;
    }

    collectAffectedBlocks(range, editor).forEach((block) => {
      block.style.textAlign = alignment;
    });

    selection.setSelection(range);
    syncFromRange(range);
  };

  const applyLineSpacing = (lineSpacing: number) => {
    const range = selection.restoreRange();
    if (!range) {
      return;
    }

    const editor = editorRef();
    if (!editor) {
      return;
    }

    collectAffectedBlocks(range, editor).forEach((block) => {
      block.style.lineHeight = formatLineSpacingValue(lineSpacing);
    });

    selection.setSelection(range);
    syncFromRange(range);
  };

  const applyStyleSet = (styleSetId: AcademicStyleSetId, blockStyleId: AcademicBlockStyleId) => {
    const range = selection.restoreRange();
    if (!range) {
      return;
    }

    const editor = editorRef();
    if (!editor) {
      return;
    }

    const styleDefinition = getBlockStyle(styleSetId, blockStyleId);
    if (!styleDefinition) {
      return;
    }

    const blocks = collectAffectedBlocks(range, editor);

    blocks.forEach((block) => {
      block.style.fontFamily = styleDefinition.typography.fontFamily;
      block.style.fontSize = `${styleDefinition.typography.fontSize}pt`;
      block.style.textAlign = styleDefinition.alignment;
      block.style.lineHeight = formatLineSpacingValue(styleDefinition.lineSpacing);

      if (styleDefinition.marginBefore !== undefined) {
        block.style.marginTop = `${styleDefinition.marginBefore}pt`;
      }

      if (styleDefinition.marginAfter !== undefined) {
        block.style.marginBottom = `${styleDefinition.marginAfter}pt`;
      }

      if (styleDefinition.indent !== undefined && styleDefinition.indent > 0) {
        block.style.paddingLeft = `${styleDefinition.indent}pt`;
      }
    });

    selection.setSelection(range);
    syncFromRange(range);
  };

  const applyParagraphIndent = (left: number, right: number, firstLine: number, hanging: number) => {
    const range = selection.restoreRange();
    if (!range) return;
    const editor = editorRef();
    if (!editor) return;

    // Combined left edge = left indent + hanging (body text starts there)
    const totalLeft = left + hanging;
    // first-line text-indent is the additional first-line offset relative to combined left
    const textIndent = firstLine - hanging;
    collectAffectedBlocks(range, editor).forEach((block) => {
      block.style.paddingLeft  = totalLeft  !== 0 ? `${totalLeft}in`  : "";
      block.style.paddingRight = right      !== 0 ? `${right}in`      : "";
      block.style.textIndent   = textIndent !== 0 ? `${textIndent}in` : "";
    });
    selection.setSelection(range);
    syncFromRange(range);
  };

  const applyParagraphSpacing = (before: number, after: number) => {
    const range = selection.restoreRange();
    if (!range) return;
    const editor = editorRef();
    if (!editor) return;

    collectAffectedBlocks(range, editor).forEach((block) => {
      block.style.marginTop    = `${before}pt`;
      block.style.marginBottom = `${after}pt`;
    });
    selection.setSelection(range);
    syncFromRange(range);
  };

  return {
    selectedLineSpacing,
    selectedAlignment,
    applyAlignment,
    applyLineSpacing,
    applyStyleSet,
    applyParagraphIndent,
    applyParagraphSpacing,
    syncFromRange
  };
}
