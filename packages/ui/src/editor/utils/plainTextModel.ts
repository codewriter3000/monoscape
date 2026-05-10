// Plain-text model for indentation and selection restoration

import type {
  BoundaryPoint,
  PlainTextModel,
  PlainTextSegment
} from "../constants";

export function getNodeIndex(node: Node) {
  let index = 0;
  let current = node.previousSibling;
  while (current) {
    index += 1;
    current = current.previousSibling;
  }
  return index;
}

export function measurePlainTextLength(node: Node) {
  if (node instanceof Text) {
    return node.data.length;
  }

  if (node instanceof HTMLBRElement) {
    return 1;
  }

  let length = 0;
  node.childNodes.forEach((child) => {
    length += measurePlainTextLength(child);
  });
  return length;
}

export function buildPlainTextModel(editorRef: HTMLDivElement): PlainTextModel | null {
  const lineStarts: Array<{ index: number; boundary: BoundaryPoint }> = [];
  const segments: PlainTextSegment[] = [];
  let text = "";
  let currentIndex = 0;
  let atLineStart = true;

  const recordLineStart = (boundary: BoundaryPoint) => {
    const previous = lineStarts[lineStarts.length - 1];
    if (!previous || previous.index !== currentIndex) {
      lineStarts.push({ index: currentIndex, boundary });
    }
  };

  const walk = (node: Node) => {
    if (node instanceof Text) {
      const start = currentIndex;
      const data = node.data;
      if (!data.length) {
        return;
      }

      segments.push({ kind: "text", node, start, end: start + data.length });
      for (let index = 0; index < data.length; index += 1) {
        if (atLineStart) {
          recordLineStart({ container: node, offset: index });
        }
        const character = data[index];
        text += character;
        currentIndex += 1;
        atLineStart = character === "\n";
      }
      return;
    }

    if (node instanceof HTMLBRElement) {
      const parent = node.parentNode;
      if (parent) {
        const offset = getNodeIndex(node);
        if (atLineStart) {
          recordLineStart({ container: parent, offset });
        }
        segments.push({
          kind: "break",
          node,
          start: currentIndex,
          end: currentIndex + 1,
          before: { container: parent, offset },
          after: { container: parent, offset: offset + 1 }
        });
      }
      text += "\n";
      currentIndex += 1;
      atLineStart = true;
      return;
    }

    node.childNodes.forEach(walk);
  };

  editorRef.childNodes.forEach(walk);

  if (!lineStarts.length) {
    lineStarts.push({ index: 0, boundary: { container: editorRef, offset: 0 } });
  }

  return { text, segments, lineStarts };
}

export function boundaryIndex(editorRef: HTMLDivElement, container: Node, offset: number) {
  const range = document.createRange();
  range.setStart(editorRef, 0);
  range.setEnd(container, offset);
  return measurePlainTextLength(range.cloneContents());
}

export function boundaryFromIndex(
  editorRef: HTMLDivElement,
  model: PlainTextModel,
  index: number
): BoundaryPoint {
  const clampedIndex = Math.max(0, Math.min(index, model.text.length));

  for (const segment of model.segments) {
    if (segment.kind === "text") {
      if (clampedIndex <= segment.end) {
        return {
          container: segment.node,
          offset: Math.max(0, clampedIndex - segment.start)
        };
      }
    } else {
      if (clampedIndex <= segment.start) {
        return segment.before;
      }
      if (clampedIndex <= segment.end) {
        return segment.after;
      }
    }
  }

  const lastSegment = model.segments[model.segments.length - 1];
  if (!lastSegment) {
    return { container: editorRef, offset: editorRef.childNodes.length };
  }

  if (lastSegment.kind === "text") {
    return { container: lastSegment.node, offset: lastSegment.node.data.length };
  }

  return lastSegment.after;
}

export function createPlainTextRange(
  editorRef: HTMLDivElement,
  model: PlainTextModel,
  start: number,
  end: number
) {
  const startBoundary = boundaryFromIndex(editorRef, model, start);
  const endBoundary = boundaryFromIndex(editorRef, model, end);
  const range = document.createRange();
  range.setStart(startBoundary.container, startBoundary.offset);
  range.setEnd(endBoundary.container, endBoundary.offset);
  return range;
}

export function lineStartIndexPosition(lineStarts: PlainTextModel["lineStarts"], target: number) {
  let foundIndex = 0;
  lineStarts.forEach((entry, index) => {
    if (entry.index <= target) {
      foundIndex = index;
    }
  });
  return foundIndex;
}

export function selectionLineData(editorRef: HTMLDivElement, model: PlainTextModel, range: Range) {
  const startIndex = boundaryIndex(editorRef, range.startContainer, range.startOffset);
  const endIndex = boundaryIndex(editorRef, range.endContainer, range.endOffset);

  const lastSelectedIndex = range.collapsed ? startIndex : Math.max(startIndex, endIndex - 1);
  const firstLinePosition = lineStartIndexPosition(model.lineStarts, startIndex);
  const lastLinePosition = lineStartIndexPosition(model.lineStarts, lastSelectedIndex);

  return {
    startIndex,
    endIndex,
    lineStarts: model.lineStarts.slice(firstLinePosition, lastLinePosition + 1)
  };
}

export function insertTextAtBoundary(boundary: BoundaryPoint, text: string) {
  const range = document.createRange();
  range.setStart(boundary.container, boundary.offset);
  range.collapse(true);
  range.insertNode(document.createTextNode(text));
}
