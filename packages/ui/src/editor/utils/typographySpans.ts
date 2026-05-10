// Typography span creation, merging, and wrapping

import type { FontCatalogEntry, TypographyPatch, TypographySettings } from "@monoscape/document-core";
import { getFontFamilyStack } from "@monoscape/document-core";

const TYPING_PLACEHOLDER = "\u200B";

export function isTypographySpan(node: Node | null): node is HTMLSpanElement {
  return (
    node instanceof HTMLSpanElement &&
    (node.dataset.monoscapeTypography === "true" || node.dataset.monoscapeTyping === "true")
  );
}

export function typographySignature(span: HTMLSpanElement) {
  return `${span.style.fontFamily}|${span.style.fontSize}|${span.style.color}`;
}

export function applyTypographyStyles(
  span: HTMLSpanElement,
  typography: TypographySettings,
  findFont: (family: string) => FontCatalogEntry,
  color?: string | null
) {
  span.dataset.monoscapeTypography = "true";
  span.style.fontFamily = getFontFamilyStack(findFont(typography.fontFamily));
  span.style.fontSize = `${typography.fontSize}pt`;
  
  if (color !== undefined) {
    if (color === null) {
      span.style.removeProperty("color");
    } else {
      span.style.color = color;
    }
  }
}

export function mergeAdjacentTypographySpans(span: HTMLSpanElement) {
  let nextSpan = span;

  const mergeIntoPrevious = () => {
    const previous = nextSpan.previousSibling;
    if (
      previous instanceof HTMLSpanElement &&
      isTypographySpan(previous) &&
      typographySignature(previous) === typographySignature(nextSpan)
    ) {
      while (nextSpan.firstChild) {
        previous.append(nextSpan.firstChild);
      }
      nextSpan.remove();
      nextSpan = previous;
      return true;
    }

    return false;
  };

  const mergeIntoNext = () => {
    const following = nextSpan.nextSibling;
    if (
      following instanceof HTMLSpanElement &&
      isTypographySpan(following) &&
      typographySignature(following) === typographySignature(nextSpan)
    ) {
      while (following.firstChild) {
        nextSpan.append(following.firstChild);
      }
      following.remove();
      return true;
    }

    return false;
  };

  while (mergeIntoPrevious()) {
    continue;
  }

  while (mergeIntoNext()) {
    continue;
  }

  return nextSpan;
}

export function placeCaretInsideTypingSpan(span: HTMLSpanElement) {
  const placeholder =
    Array.from(span.childNodes).find(
      (node): node is Text => node instanceof Text && node.data.includes(TYPING_PLACEHOLDER)
    ) ?? document.createTextNode(TYPING_PLACEHOLDER);

  if (!placeholder.parentNode) {
    span.prepend(placeholder);
  } else if (!placeholder.data.includes(TYPING_PLACEHOLDER)) {
    placeholder.data = `${TYPING_PLACEHOLDER}${placeholder.data}`;
  }

  const range = document.createRange();
  range.setStart(placeholder, placeholder.data.length);
  range.collapse(true);
  
  const selection = document.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  return range;
}

export interface WrapOptions {
  readTypography: (node: Node) => TypographySettings;
  findFont: (family: string) => FontCatalogEntry;
  color?: string | null;
}

export function wrapTextSegment(
  node: Text,
  start: number,
  end: number,
  patch: TypographyPatch,
  options: WrapOptions
) {
  let targetNode = node;

  if (start > 0) {
    targetNode = targetNode.splitText(start);
  }

  if (end - start < targetNode.data.length) {
    targetNode.splitText(end - start);
  }

  const nextTypography = {
    ...options.readTypography(targetNode),
    ...patch
  };
  const parentElement = targetNode.parentElement;

  if (
    parentElement &&
    isTypographySpan(parentElement) &&
    parentElement.childNodes.length === 1 &&
    parentElement.firstChild === targetNode
  ) {
    applyTypographyStyles(parentElement, nextTypography, options.findFont, options.color);
    return mergeAdjacentTypographySpans(parentElement);
  }

  const span = document.createElement("span");
  applyTypographyStyles(span, nextTypography, options.findFont, options.color);
  targetNode.parentNode?.insertBefore(span, targetNode);
  span.append(targetNode);
  return mergeAdjacentTypographySpans(span);
}

export function cleanupTypingSpans(editorRef: HTMLDivElement) {
  const selection = document.getSelection();
  const spans = Array.from(
    editorRef.querySelectorAll<HTMLSpanElement>('span[data-monoscape-typing="true"]')
  );

  spans.forEach((span) => {
    const isActive = Boolean(selection?.anchorNode && span.contains(selection.anchorNode));
    Array.from(span.childNodes).forEach((node) => {
      if (!(node instanceof Text) || !node.data.includes(TYPING_PLACEHOLDER)) {
        return;
      }

      node.data = node.data.replaceAll(TYPING_PLACEHOLDER, "");
      if (!node.data.length) {
        node.remove();
      }
    });

    const plainText = span.textContent ?? "";
    if (!plainText.length) {
      if (isActive) {
        placeCaretInsideTypingSpan(span);
      } else {
        span.remove();
      }
      return;
    }

    span.removeAttribute("data-monoscape-typing");
    span.dataset.monoscapeTypography = "true";
    mergeAdjacentTypographySpans(span);
  });
}
