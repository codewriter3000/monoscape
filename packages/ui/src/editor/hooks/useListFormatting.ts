// List formatting: detect, toggle, and configure ordered/unordered lists

import { createSignal } from "solid-js";
import type { UseEditorSelectionResult } from "./useEditorSelection";

export type ListType = "none" | "ul" | "ol";

export type BulletStyle =
  | "disc"
  | "circle"
  | "square"
  | "custom-icon";

export type NumberStyle =
  | "decimal"
  | "lower-alpha"
  | "upper-alpha"
  | "lower-roman"
  | "upper-roman";

export interface ListState {
  listType: ListType;
  bulletStyle: BulletStyle;
  numberStyle: NumberStyle;
  startNumber: number;
  customIconDataUrl: string | null;
}

export interface ListAction {
  type: "toggle-ul" | "toggle-ol" | "set-bullet-style" | "set-number-style" | "set-start-number" | "set-custom-icon";
  payload?: BulletStyle | NumberStyle | number | string | null;
}

export interface UseListFormattingResult {
  listState: () => ListState;
  toggleUnorderedList: () => void;
  toggleOrderedList: () => void;
  applyBulletStyle: (style: BulletStyle) => void;
  applyNumberStyle: (style: NumberStyle) => void;
  applyStartNumber: (n: number) => void;
  applyCustomIconBullet: (svg: string) => void;
  removeCustomIconBullet: () => void;
  syncFromRange: (range: Range) => void;
}

const DEFAULT_STATE: ListState = {
  listType: "none",
  bulletStyle: "disc",
  numberStyle: "decimal",
  startNumber: 1,
  customIconDataUrl: null,
};

function svgToDataUrl(svg: string): string {
  const encoded = encodeURIComponent(svg.trim());
  return `url("data:image/svg+xml,${encoded}")`;
}

function findListContainer(node: Node, editor: HTMLElement): { list: HTMLElement; item: HTMLLIElement } | null {
  let current: Node | null = node;
  while (current && current !== editor) {
    if (current instanceof HTMLLIElement) {
      const parent = current.parentElement;
      if (parent && (parent instanceof HTMLUListElement || parent instanceof HTMLOListElement)) {
        return { list: parent, item: current };
      }
    }
    current = current.parentNode;
  }
  return null;
}

function readListState(range: Range, editor: HTMLElement): ListState {
  const found = findListContainer(range.startContainer, editor);
  if (!found) {
    return { ...DEFAULT_STATE };
  }

  const { list } = found;
  const isOL = list instanceof HTMLOListElement;
  const computed = getComputedStyle(list);

  const listType: ListType = isOL ? "ol" : "ul";

  // Determine bullet/number style
  const cssType = (list.style.listStyleType || computed.listStyleType || "").toLowerCase();
  const imageVal = list.style.listStyleImage || computed.listStyleImage || "";
  const hasImage = imageVal !== "none" && imageVal !== "";

  let bulletStyle: BulletStyle = "disc";
  let numberStyle: NumberStyle = "decimal";
  let customIconDataUrl: string | null = null;

  if (isOL) {
    if (cssType.includes("lower-alpha") || cssType.includes("lower-latin")) numberStyle = "lower-alpha";
    else if (cssType.includes("upper-alpha") || cssType.includes("upper-latin")) numberStyle = "upper-alpha";
    else if (cssType.includes("lower-roman")) numberStyle = "lower-roman";
    else if (cssType.includes("upper-roman")) numberStyle = "upper-roman";
    else numberStyle = "decimal";
  } else {
    if (hasImage) {
      bulletStyle = "custom-icon";
      customIconDataUrl = imageVal;
    } else if (cssType === "circle") bulletStyle = "circle";
    else if (cssType === "square") bulletStyle = "square";
    else bulletStyle = "disc";
  }

  const startNumber = (list instanceof HTMLOListElement ? list.start || 1 : 1);

  return { listType, bulletStyle, numberStyle, startNumber, customIconDataUrl };
}

export function useListFormatting(
  editorRef: () => HTMLDivElement | undefined,
  selection: UseEditorSelectionResult
): UseListFormattingResult {
  const [listState, setListState] = createSignal<ListState>({ ...DEFAULT_STATE });

  const syncFromRange = (range: Range) => {
    const editor = editorRef();
    if (!editor) return;
    setListState(readListState(range, editor));
  };

  const getAffectedListRoot = (): HTMLElement | null => {
    const range = selection.restoreRange();
    const editor = editorRef();
    if (!range || !editor) return null;
    const found = findListContainer(range.startContainer, editor);
    return found ? found.list : null;
  };

  const toggleUnorderedList = () => {
    const editor = editorRef();
    if (!editor) return;
    editor.focus();
    const range = selection.restoreRange();
    if (!range) return;
    document.execCommand("insertUnorderedList", false);
    // After toggle, apply default bullet style
    const postRange = document.getSelection()?.getRangeAt(0) ?? range;
    const found = findListContainer(postRange.startContainer, editor);
    if (found && found.list instanceof HTMLUListElement) {
      const current = listState();
      const style = current.bulletStyle !== "custom-icon" ? current.bulletStyle : "disc";
      found.list.style.listStyleType = style;
      found.list.style.listStyleImage = "none";
    }
    syncFromRange(postRange);
  };

  const toggleOrderedList = () => {
    const editor = editorRef();
    if (!editor) return;
    editor.focus();
    const range = selection.restoreRange();
    if (!range) return;
    document.execCommand("insertOrderedList", false);
    const postRange = document.getSelection()?.getRangeAt(0) ?? range;
    const found = findListContainer(postRange.startContainer, editor);
    if (found && found.list instanceof HTMLOListElement) {
      found.list.style.listStyleType = listState().numberStyle;
    }
    syncFromRange(postRange);
  };

  const applyBulletStyle = (style: BulletStyle) => {
    const list = getAffectedListRoot();
    if (!list || !(list instanceof HTMLUListElement)) return;
    if (style !== "custom-icon") {
      list.style.listStyleType = style;
      list.style.listStyleImage = "none";
    }
    const range = selection.savedRange();
    if (range) syncFromRange(range);
  };

  const applyNumberStyle = (style: NumberStyle) => {
    const list = getAffectedListRoot();
    if (!list || !(list instanceof HTMLOListElement)) return;
    list.style.listStyleType = style;
    const range = selection.savedRange();
    if (range) syncFromRange(range);
  };

  const applyStartNumber = (n: number) => {
    const list = getAffectedListRoot();
    if (!list || !(list instanceof HTMLOListElement)) return;
    list.start = n;
    const range = selection.savedRange();
    if (range) syncFromRange(range);
  };

  const applyCustomIconBullet = (svg: string) => {
    const list = getAffectedListRoot();
    if (!list || !(list instanceof HTMLUListElement)) return;
    const dataUrl = svgToDataUrl(svg);
    list.style.listStyleImage = dataUrl;
    list.style.listStyleType = "none";
    const range = selection.savedRange();
    if (range) syncFromRange(range);
  };

  const removeCustomIconBullet = () => {
    const list = getAffectedListRoot();
    if (!list || !(list instanceof HTMLUListElement)) return;
    list.style.listStyleImage = "none";
    list.style.listStyleType = "disc";
    const range = selection.savedRange();
    if (range) syncFromRange(range);
  };

  return {
    listState,
    toggleUnorderedList,
    toggleOrderedList,
    applyBulletStyle,
    applyNumberStyle,
    applyStartNumber,
    applyCustomIconBullet,
    removeCustomIconBullet,
    syncFromRange,
  };
}
