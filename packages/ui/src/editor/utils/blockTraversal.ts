// Block element traversal for alignment and line spacing

import { BLOCK_ELEMENT_TAGS } from "../constants";

export function isBlockElement(element: HTMLElement, editorRef: HTMLDivElement) {
  return element === editorRef || BLOCK_ELEMENT_TAGS.has(element.tagName);
}

export function closestBlockAncestor(node: Node | null, editorRef: HTMLDivElement) {
  let current = node instanceof HTMLElement ? node : node?.parentElement ?? null;
  while (current && current !== editorRef) {
    if (isBlockElement(current, editorRef)) {
      return current;
    }
    current = current.parentElement;
  }

  return editorRef;
}

export function rangeIntersectsNode(range: Range, node: Node) {
  try {
    return range.intersectsNode(node);
  } catch {
    const nodeRange = document.createRange();
    nodeRange.selectNode(node);
    return (
      range.compareBoundaryPoints(Range.END_TO_START, nodeRange) > 0 &&
      range.compareBoundaryPoints(Range.START_TO_END, nodeRange) < 0
    );
  }
}

export function collectAffectedBlocks(range: Range, editorRef: HTMLDivElement) {
  if (range.collapsed) {
    return [closestBlockAncestor(range.startContainer, editorRef)];
  }

  const blocks = new Set<HTMLElement>();
  const walker = document.createTreeWalker(editorRef, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();

  while (current) {
    const isRelevantNode =
      (current instanceof Text && (current.textContent ?? "").length > 0) ||
      current instanceof HTMLBRElement ||
      current instanceof HTMLElement;

    if (isRelevantNode && rangeIntersectsNode(range, current)) {
      const block = closestBlockAncestor(current, editorRef);
      if (block) {
        blocks.add(block);
      }
    }

    current = walker.nextNode();
  }

  return blocks.size ? [...blocks] : [editorRef];
}

export function collectTextSegments(range: Range, editorRef: HTMLDivElement) {
  const segments: Array<{ node: Text; start: number; end: number }> = [];
  const walker = document.createTreeWalker(editorRef, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();

  while (currentNode) {
    if (
      currentNode instanceof Text &&
      currentNode.data.length &&
      rangeIntersectsNode(range, currentNode)
    ) {
      const start = currentNode === range.startContainer ? range.startOffset : 0;
      const end = currentNode === range.endContainer ? range.endOffset : currentNode.data.length;

      if (start < end) {
        segments.push({ node: currentNode, start, end });
      }
    }

    currentNode = walker.nextNode();
  }

  return segments;
}
