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

const descendToLeafNode = (node: Node, preferLast: boolean) => {
  let current = node;

  while (current.childNodes.length) {
    current = preferLast
      ? current.childNodes[current.childNodes.length - 1] ?? current
      : current.childNodes[0] ?? current;
  }

  return current;
};

const resolveCollapsedSampleNode = (range: Range) => {
  if (range.startContainer.nodeType === Node.TEXT_NODE) {
    return range.startContainer;
  }

  const container = range.startContainer;
  const childNodes = container.childNodes;
  if (!childNodes.length) {
    return container;
  }

  if (range.startOffset >= childNodes.length) {
    const previousNode = childNodes[childNodes.length - 1];
    return previousNode ? descendToLeafNode(previousNode, true) : container;
  }

  const currentNode = childNodes[range.startOffset];
  if (currentNode) {
    return descendToLeafNode(currentNode, false);
  }

  const previousNode = childNodes[range.startOffset - 1];
  return previousNode ? descendToLeafNode(previousNode, true) : container;
};

const readExplicitFontSizeValue = (node: Node | null, editorRef: HTMLDivElement) => {
  const element = node instanceof HTMLElement ? node : node?.parentElement ?? editorRef;
  let current: HTMLElement | null = element;

  while (current && current !== editorRef) {
    if (current.style.fontSize) {
      return current.style.fontSize;
    }
    current = current.parentElement;
  }

  return getComputedStyle(element).fontSize || getComputedStyle(editorRef).fontSize;
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
  if (range?.collapsed && editorRef) {
    fontSize = readFontSizeInPoints(readExplicitFontSizeValue(resolveCollapsedSampleNode(range), editorRef));
  }
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
