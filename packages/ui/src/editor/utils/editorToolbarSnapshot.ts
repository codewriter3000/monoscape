import { resolveUniformValue, DEFAULT_TYPOGRAPHY } from "@monoscape/document-core";
import type { NormalizedColor, TextAlignment } from "@monoscape/document-core";
import { collectTextSegments } from "./blockTraversal";
import type { ToolbarSelectionSnapshot } from "../../toolbar/contracts";

const readFontSizeInPoints = (value: string) => {
  const parsed = Number.parseFloat(value);
  return !Number.isFinite(parsed)
    ? DEFAULT_TYPOGRAPHY.fontSize
    : value.endsWith("px")
    ? Math.round((parsed * 72) / 96)
    : Math.round(parsed);
};

export interface ToolbarSnapshotParams {
  typo: { fontFamily?: string | null; fontSize?: number | null } | null | undefined;
  colorValue: NormalizedColor | null;
  lineSpacing: number | null;
  alignment: TextAlignment | null;
  range: Range | null;
  editorRef: HTMLDivElement | undefined;
}

export function buildToolbarSnapshot(params: ToolbarSnapshotParams): ToolbarSelectionSnapshot {
  const { typo, colorValue, lineSpacing, alignment, range, editorRef } = params;
  let fontFamily = typo?.fontFamily ?? null;
  let fontSize = typo?.fontSize ?? null;
  if (range && editorRef) {
    const segments = collectTextSegments(range, editorRef).filter(({ node }) => node.data.trim().length);
    if (segments.length) {
      const families = segments.map(({ node }) => getComputedStyle(node.parentElement ?? editorRef!).fontFamily);
      const sizes = segments.map(({ node }) => getComputedStyle(node.parentElement ?? editorRef!).fontSize);
      const uniformFamily = resolveUniformValue(families);
      const sizeValues = sizes.map(readFontSizeInPoints);
      const uniformSize = resolveUniformValue(sizeValues, (left, right) => Math.abs(left - right) < 0.1);
      if (!uniformFamily) fontFamily = null;
      else if (!fontFamily) fontFamily = uniformFamily;
      if (!uniformSize) fontSize = null;
      else if (!fontSize) fontSize = uniformSize;
    }
  }
  return {
    formatting: { bold: false, italic: false, underline: false, strikethrough: false, superscript: false, subscript: false },
    fontFamily,
    fontSize,
    lineSpacing,
    alignment,
    color: colorValue,
    isEmpty: !editorRef?.textContent?.trim()
  };
}
