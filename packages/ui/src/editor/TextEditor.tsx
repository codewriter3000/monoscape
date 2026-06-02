// Main editor component orchestrating selection, typography, blocks, fonts, and keyboard flow

import { For, createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import { DEFAULT_LINE_SPACING, DEFAULT_TYPOGRAPHY, getFontFamilyStack } from "@monoscape/document-core";
import type { FontCatalogEntry, NormalizedColor } from "@monoscape/document-core";
import { FormattingToolbar } from "../FormattingToolbar";
import { useEditorSelection } from "./hooks/useEditorSelection";
import { useTypographyFormatting } from "./hooks/useTypographyFormatting";
import { useBlockFormatting } from "./hooks/useBlockFormatting";
import { useFontLibrary } from "./hooks/useFontLibrary";
import { useEditorKeyboardFlow } from "./hooks/useEditorKeyboardFlow";
import { useEditorToolbarState, type EditorColorState } from "./hooks/useEditorToolbarState";
import { useListFormatting } from "./hooks/useListFormatting";
import type { ListState, BulletStyle, NumberStyle } from "./hooks/useListFormatting";
import { cleanupTypingSpans } from "./utils/typographySpans";
import { buildToolbarSnapshot } from "./utils/editorToolbarSnapshot";
import { closestBlockAncestor } from "./utils/blockTraversal";
import { EDITOR_KEYBOARD_HELP_ID, EDITOR_STYLES, buildEditorInlineStyle, DEFAULT_DOCUMENT_MARGINS, type DocumentMargins } from "./constants";
import { getIconSpanAtRange, getIconColor, applyColorToIconSpan, buildInsertableSvgElement } from "../common/iconUtils";
import { ImageResizeOverlay } from "./ImageResizeOverlay";
import { HorizontalRuler, VerticalRuler } from "./Ruler";

export interface TextEditorProps {
  documentSessionKey?: string;
  initialDocumentHtml?: string;
  onDocumentChange?: (html: string) => void;
  /** Called whenever the caret moves onto a different page (1-based). */
  onCursorPageChange?: (page: number) => void;
  fontCapabilities?: {
    searchGoogleFonts?: (query: string) => Promise<FontCatalogEntry[]>;
    uploadFonts?: boolean;
  };
  /**
   * Called once on mount with a function that inserts an SVG icon at the
   * current caret position.  Store this reference in the parent component
   * and pass it to the RightPanel's onInsertSvg prop.
   */
  onRegisterInsertIcon?: (fn: (svg: string, name: string) => void) => void;
  /**
   * Called once on mount with list commands and a getter for the current list
   * state. Store the reference and pass it to RightPanel.
   */
  onRegisterListActions?: (actions: {
    listState: () => ListState;
    toggleUnorderedList: () => void;
    toggleOrderedList: () => void;
    applyBulletStyle: (style: BulletStyle) => void;
    applyNumberStyle: (style: NumberStyle) => void;
    applyStartNumber: (n: number) => void;
    applyCustomIconBullet: (svg: string) => void;
    removeCustomIconBullet: () => void;
  }) => void;
  /**
   * Called once on mount with image-insertion helpers. Store the reference and
   * pass `insertFromFile` / `insertFromUrl` to the RightPanel's Insert tab.
   */
  onRegisterInsertImage?: (actions: {
    insertFromFile: () => void;
    insertFromUrl: (url: string) => void;
  }) => void;
  /**
   * Current page margins (in inches). When provided, the document padding and
   * rulers reflect these values. Defaults to DEFAULT_DOCUMENT_MARGINS.
   */
  margins?: DocumentMargins;
  /**
   * Called once on mount with block-level formatting actions (line spacing,
   * indentation, paragraph spacing).  Store the reference and forward to
   * RightPanel so the Layout tab can apply these to the active selection.
   */
  onRegisterFormattingActions?: (actions: {
    lineSpacing: () => number | null;
    applyLineSpacing: (v: number) => void;
    applyParagraphIndent: (left: number, right: number, firstLine: number, hanging: number) => void;
    applyParagraphSpacing: (before: number, after: number) => void;
  }) => void;
  /** Called whenever the document's page count changes. */
  onPageCountChange?: (count: number) => void;
}

export function TextEditor(props: TextEditorProps) {
  const PAGE_HEIGHT_PX = 11 * 96;
  const FRAME_PADDING_PX = 24;

  let rootRef: HTMLDivElement | undefined;
  let editorRef: HTMLDivElement | undefined;
  let focusPrimaryToolbarControl: (() => void) | null = null;
  let appliedDocumentSessionKey: string | undefined;
  let hasAppliedInitialDocument = false;

  const colorState: EditorColorState = { pendingColor: undefined, isApplyingColor: false, prevSelectionCollapsed: true };

  const selection = useEditorSelection(() => editorRef);
  const fontLibrary = useFontLibrary(() => editorRef);
  const typography = useTypographyFormatting(
    () => editorRef,
    fontLibrary.fonts,
    fontLibrary.findFont,
    selection
  );
  const blocks = useBlockFormatting(() => editorRef, selection);
  const lists = useListFormatting(() => editorRef, selection);
  const keyboard = useEditorKeyboardFlow(
    () => editorRef,
    () => rootRef,
    selection,
    () => {
      typography.syncFromSelection();
      blocks.syncFromRange(selection.savedRange()!);
    }
  );

  const placeholder = createMemo(() => `Start writing in ${DEFAULT_TYPOGRAPHY.fontSize}-point ${DEFAULT_TYPOGRAPHY.fontFamily}.`);

  // ── Page-count & cursor-page signals (needed by editorStyle below) ──────
  const [pageCount, setPageCount] = createSignal(1);
  const [cursorPage, setCursorPage] = createSignal(0);

  // min-height grows with page count so the last page is always full-height.
  // The later `min-height` declaration overrides the hardcoded one inside
  // buildEditorInlineStyle (last duplicate in cssText wins).
  const editorStyle = createMemo(() =>
    buildEditorInlineStyle(
      getFontFamilyStack(fontLibrary.defaultFont()),
      DEFAULT_TYPOGRAPHY.fontSize,
      DEFAULT_LINE_SPACING,
      props.margins
    ) + `min-height:${pageCount() * 11}in;`
  );

  const syncToolbarState = (range = selection.savedRange()) => {
    typography.syncFromSelection();
    if (range) {
      blocks.syncFromRange(range);
      lists.syncFromRange(range);
    }
  };

  const emitDocumentChange = () => {
    if (editorRef) {
      props.onDocumentChange?.(editorRef.innerHTML);
    }
  };

  const nodeContainsSelection = (node: Node, sel = document.getSelection()) => {
    if (!sel) {
      return false;
    }

    if (node instanceof Element) {
      return Boolean(
        (sel.anchorNode && node.contains(sel.anchorNode)) ||
        (sel.focusNode && node.contains(sel.focusNode))
      );
    }

    return node === sel.anchorNode || node === sel.focusNode;
  };

  const isBlankTextNode = (node: Text) =>
    node.data.replace(/\u200B/g, "").replace(/\u00A0/g, " ").trim().length === 0;

  const isTrailingSubstantiveElement = (element: HTMLElement) => {
    if (element.classList.contains("monoscape-page-break-spacer")) {
      return false;
    }

    if (element.querySelector("[data-monoscape-image], [data-monoscape-icon], table, hr, canvas, iframe, video, audio, svg")) {
      return true;
    }

    const text = (element.textContent ?? "")
      .replace(/\u200B/g, "")
      .replace(/\u00A0/g, " ")
      .trim();
    return text.length > 0;
  };

  const cleanupTrailingPageArtifacts = () => {
    if (!editorRef) {
      return false;
    }

    const trailingNodes: ChildNode[] = [];
    let sawPageBreakSpacer = false;
    let current = editorRef.lastChild;

    while (current) {
      const previous = current.previousSibling;

      if (nodeContainsSelection(current)) {
        break;
      }

      if (current instanceof Text) {
        const text = current.data.replace(/\u200B/g, "").replace(/\u00A0/g, " ").trim();
        if (text.length > 0) {
          break;
        }
        trailingNodes.push(current);
        current = previous;
        continue;
      }

      if (!(current instanceof HTMLElement) || isTrailingSubstantiveElement(current)) {
        break;
      }

      if (current.classList.contains("monoscape-page-break-spacer")) {
        sawPageBreakSpacer = true;
      }

      trailingNodes.push(current);
      current = previous;
    }

    if (!sawPageBreakSpacer) {
      return false;
    }

    trailingNodes.forEach((node) => node.remove());
    return trailingNodes.length > 0;
  };

  const cleanupEditorArtifacts = () => {
    if (!editorRef) {
      return false;
    }

    cleanupTypingSpans(editorRef);
    return cleanupTrailingPageArtifacts();
  };

  const createCollapsedRangeAtNodeEnd = (node: Node | null) => {
    if (!editorRef) {
      return null;
    }

    const range = document.createRange();
    if (!node) {
      range.selectNodeContents(editorRef);
      range.collapse(true);
      return range;
    }

    if (node instanceof Text) {
      range.setStart(node, node.data.length);
      range.collapse(true);
      return range;
    }

    range.selectNodeContents(node);
    range.collapse(false);
    return range;
  };

  const isRemovableTrailingArtifactNode = (node: ChildNode) => {
    if (node instanceof Text) {
      return isBlankTextNode(node);
    }

    if (node instanceof HTMLElement) {
      return !isTrailingSubstantiveElement(node);
    }

    return false;
  };

  const tryCollapseTrailingPageOnBackspace = () => {
    if (!editorRef) {
      return false;
    }

    const sel = document.getSelection();
    if (!selection.selectionBelongsToEditor(sel) || !sel?.rangeCount) {
      return false;
    }

    const range = sel.getRangeAt(0);
    if (!range.collapsed) {
      return false;
    }

    const block = closestBlockAncestor(range.startContainer, editorRef);
    if (!(block instanceof HTMLElement) || block === editorRef || isTrailingSubstantiveElement(block)) {
      return false;
    }

    const beforeCaret = range.cloneRange();
    beforeCaret.selectNodeContents(block);
    beforeCaret.setEnd(range.startContainer, range.startOffset);
    if (beforeCaret.toString().replace(/\u200B/g, "").replace(/\u00A0/g, " ").trim().length > 0) {
      return false;
    }

    let chainStart: ChildNode = block;
    let sawPageBreakSpacer = false;
    let probe = chainStart.previousSibling;

    while (probe && isRemovableTrailingArtifactNode(probe)) {
      if (probe instanceof HTMLElement && probe.classList.contains("monoscape-page-break-spacer")) {
        sawPageBreakSpacer = true;
      }
      chainStart = probe;
      probe = probe.previousSibling;
    }

    if (!sawPageBreakSpacer) {
      return false;
    }

    for (let current: ChildNode | null = chainStart; current; current = current.nextSibling) {
      if (!isRemovableTrailingArtifactNode(current)) {
        return false;
      }
    }

    const nextRange = createCollapsedRangeAtNodeEnd(probe);
    if (!nextRange) {
      return false;
    }

    selection.setSelection(nextRange);
    clearPendingColor();
    colorState.prevSelectionCollapsed = true;
    finalizeContentMutation();
    return true;
  };

  const syncCursorPageFromSelection = (sel = document.getSelection()) => {
    if (!editorRef || !selection.selectionBelongsToEditor(sel) || !sel?.rangeCount) {
      return;
    }

    const range = sel.getRangeAt(0);
    const editorRect = editorRef.getBoundingClientRect();
    const block = closestBlockAncestor(range.startContainer, editorRef);
    const rects = typeof range.getClientRects === "function" ? range.getClientRects() : undefined;
    const rect = rects?.[0] ?? (typeof range.getBoundingClientRect === "function" ? range.getBoundingClientRect() : undefined);

    let caretTop = Number.NaN;

    if (range.collapsed && block instanceof HTMLElement && block !== editorRef) {
      caretTop = block.getBoundingClientRect().top - editorRect.top;
    }

    if (!Number.isFinite(caretTop) && rect && Number.isFinite(rect.top)) {
      caretTop = rect.top - editorRect.top;
    }

    if (!Number.isFinite(caretTop) && block instanceof HTMLElement && block !== editorRef) {
      caretTop = block.getBoundingClientRect().top - editorRect.top;
    }

    if (!Number.isFinite(caretTop)) {
      const fallbackElement =
        range.startContainer instanceof HTMLElement
          ? range.startContainer
          : range.startContainer.parentElement;
      if (fallbackElement) {
        caretTop = fallbackElement.getBoundingClientRect().top - editorRect.top;
      }
    }

    const nextPage = Math.max(0, Math.floor(Math.max(0, caretTop) / PAGE_HEIGHT_PX));
    setCursorPage(nextPage);
    props.onCursorPageChange?.(nextPage + 1);
  };

  // Filled in onMount once editorRef + ResizeObserver are ready.
  // Called after every content mutation so shrinkage (deletion) is detected.
  let schedulePageCountUpdate: (() => void) | undefined;

  const finalizeContentMutation = () => {
    queueMicrotask(() => {
      cleanupEditorArtifacts();
      syncToolbarState();
      emitDocumentChange();
      syncCursorPageFromSelection();
      schedulePageCountUpdate?.();
    });
  };

  const clearPendingColor = () => {
    colorState.pendingColor = undefined;
  };

  // ── Icon insertion ───────────────────────────────────────────────────────

  const insertIconAtCaret = (svg: string, name: string) => {
    const range = selection.restoreRange();
    if (!range || !editorRef) return;

    // Remove selected content (if any) before inserting
    if (!range.collapsed) {
      range.deleteContents();
    }

    const span = document.createElement("span");
    span.dataset.monoscapeIcon = "true";
    span.dataset.monoscapeIconName = name;
    span.contentEditable = "false";
    span.title = name;
    span.style.cssText =
      "display:inline-block;width:1.2em;height:1.2em;vertical-align:middle;" +
      "color:inherit;cursor:text;line-height:1;";
    const svgEl = buildInsertableSvgElement(svg);
    if (svgEl) {
      span.appendChild(svgEl);
    } else {
      span.innerHTML = svg;
    }

    range.insertNode(span);

    // Place caret immediately after the inserted icon
    const afterRange = document.createRange();
    afterRange.setStartAfter(span);
    afterRange.collapse(true);
    selection.setSelection(afterRange);

    finalizeContentMutation();
  };

  // ── Image insertion ─────────────────────────────────────────────────────

  const insertImageAtCaret = (src: string) => {
    const range = selection.restoreRange();
    if (!range || !editorRef) return;

    if (!range.collapsed) {
      range.deleteContents();
    }

    const img = document.createElement("img");
    img.src = src;
    img.dataset.monoscapeImage = "true";
    img.contentEditable = "false";
    img.style.maxWidth = "100%";

    range.insertNode(img);

    // Place caret immediately after the inserted image
    const afterRange = document.createRange();
    afterRange.setStartAfter(img);
    afterRange.collapse(true);
    selection.setSelection(afterRange);

    finalizeContentMutation();
  };

  const insertImageFromFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.addEventListener("load", (e) => {
        const dataUrl = e.target?.result;
        if (typeof dataUrl === "string") {
          insertImageAtCaret(dataUrl);
        }
      });
      reader.readAsDataURL(file);
    });
    input.click();
  };

  const insertImageFromUrl = (url: string) => {
    const trimmed = url.trim();
    if (trimmed) insertImageAtCaret(trimmed);
  };

  // ── Image selection tracking ─────────────────────────────────────────────

  const [selectedImage, setSelectedImage] = createSignal<HTMLImageElement | null>(null);

  // Deselect image when the user clicks outside the editor and outside the overlay
  onMount(() => {
    const handleDocMouseDown = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const inEditor  = !!editorRef?.contains(target);
      const inOverlay = !!target.closest("[data-monoscape-image-overlay]");
      if (!inEditor && !inOverlay) {
        setSelectedImage(null);
      }
    };
    document.addEventListener("mousedown", handleDocMouseDown);
    onCleanup(() => document.removeEventListener("mousedown", handleDocMouseDown));
  });

  // Mirror selection state to a data attribute so CSS can style the selected image
  createEffect(() => {
    const next = selectedImage();
    if (!editorRef) return;
    const prev = editorRef.querySelector<HTMLImageElement>("[data-monoscape-image-selected]");
    if (prev && prev !== next) prev.removeAttribute("data-monoscape-image-selected");
    if (next) next.setAttribute("data-monoscape-image-selected", "true");
  });

  onMount(() => {
    props.onRegisterInsertIcon?.(insertIconAtCaret);
    props.onRegisterListActions?.({
      listState: lists.listState,
      toggleUnorderedList: lists.toggleUnorderedList,
      toggleOrderedList: lists.toggleOrderedList,
      applyBulletStyle: lists.applyBulletStyle,
      applyNumberStyle: lists.applyNumberStyle,
      applyStartNumber: lists.applyStartNumber,
      applyCustomIconBullet: lists.applyCustomIconBullet,
      removeCustomIconBullet: lists.removeCustomIconBullet,
    });
    props.onRegisterInsertImage?.({
      insertFromFile: insertImageFromFile,
      insertFromUrl: insertImageFromUrl,
    });
    props.onRegisterFormattingActions?.({
      lineSpacing: blocks.selectedLineSpacing,
      applyLineSpacing: (v) => { blocks.applyLineSpacing(v); finalizeContentMutation(); },
      applyParagraphIndent: (l, r, f, h) => { blocks.applyParagraphIndent(l, r, f, h); finalizeContentMutation(); },
      applyParagraphSpacing: (b, a) => { blocks.applyParagraphSpacing(b, a); finalizeContentMutation(); },
    });

    // Track page count via ResizeObserver on the editor element.
    // We also expose schedulePageCountUpdate so deletions (which don't resize
    // the element because min-height holds it in place) are also caught.
    if (editorRef) {
      let ro: ResizeObserver | undefined;
      let pendingTimer: number | undefined;

      const updatePageCount = () => {
        if (!editorRef || !ro) return;
        // Temporarily zero min-height so scrollHeight reflects true content
        // height, not the current page-count floor.  We pause the observer
        // first to avoid a recursive callback from the transient resize.
        ro.unobserve(editorRef);
        const savedMin = editorRef.style.minHeight;
        editorRef.style.minHeight = '0px';
        const contentHeight = editorRef.scrollHeight;
        editorRef.style.minHeight = savedMin;
        ro.observe(editorRef);

        const count = Math.max(1, Math.ceil(contentHeight / (11 * 96)));
        setPageCount(count);
        props.onPageCountChange?.(count);
      };

      // Debounced wrapper used by finalizeContentMutation so rapid
      // keystrokes don't flood synchronous reflows.
      schedulePageCountUpdate = () => {
        clearTimeout(pendingTimer);
        pendingTimer = window.setTimeout(updatePageCount, 60);
      };

      ro = new ResizeObserver(updatePageCount);
      ro.observe(editorRef);
      onCleanup(() => { ro!.disconnect(); clearTimeout(pendingTimer); });
      updatePageCount();
      syncCursorPageFromSelection();
    }
  });

  // ── Icon selection tracking ──────────────────────────────────────────────

  // savedRange() is a plain getter (not a SolidJS signal), so we must track
  // the selected icon span via a dedicated signal updated by selectionchange.
  const [selectedIconSpan, setSelectedIconSpan] = createSignal<HTMLSpanElement | null>(null);

  onMount(() => {
    const handleSelectionChange = () => {
      const sel = document.getSelection();
      if (!selection.selectionBelongsToEditor(sel) || !sel?.rangeCount) {
        setSelectedIconSpan(null);
        return;
      }
      syncCursorPageFromSelection(sel);
      setSelectedIconSpan(getIconSpanAtRange(sel.getRangeAt(0)));
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    onCleanup(() => document.removeEventListener("selectionchange", handleSelectionChange));
  });

  // Add/remove a data attribute on the selected icon span so CSS can outline it.
  createEffect(() => {
    const next = selectedIconSpan();
    if (!editorRef) return;
    const prev = editorRef.querySelector<HTMLSpanElement>("[data-monoscape-icon-selected]");
    if (prev && prev !== next) prev.removeAttribute("data-monoscape-icon-selected");
    if (next) next.setAttribute("data-monoscape-icon-selected", "true");
  });

  const moveCaretBeforeEmptyTypingSpan = () => {
    const sel = document.getSelection();
    if (!sel?.rangeCount || !sel.isCollapsed || !selection.selectionBelongsToEditor(sel)) {
      return false;
    }

    const range = sel.getRangeAt(0);
    const typingSpan =
      range.startContainer instanceof Text
        ? range.startContainer.parentElement
        : range.startContainer instanceof HTMLElement
          ? range.startContainer.closest('span[data-monoscape-typing="true"]')
          : null;

    if (!(typingSpan instanceof HTMLSpanElement) || typingSpan.dataset.monoscapeTyping !== "true") {
      return false;
    }

    const visibleText = (typingSpan.textContent ?? "").replace(/\u200B/g, "");
    if (visibleText.length > 0) {
      return false;
    }

    const nextRange = document.createRange();
    nextRange.setStartBefore(typingSpan);
    nextRange.collapse(true);
    typingSpan.remove();
    selection.setSelection(nextRange);
    clearPendingColor();
    colorState.prevSelectionCollapsed = true;
    syncToolbarState(nextRange);
    return true;
  };

  const toolbarHandlers = useEditorToolbarState({
    selection,
    typography,
    blocks,
    keyboard,
    colorState,
    finalizeContentMutation
  });

  /**
   * When the user types `- `, `1. `, `a. `, or `A. ` on an otherwise-empty
   * paragraph line, convert it to the matching list type.
   * Returns true if the event was handled (caller should preventDefault).
   */
  const tryAutoList = (): boolean => {
    const range = selection.restoreRange();
    if (!range || !range.collapsed || !editorRef) return false;

    // Only trigger on block elements that are not already list items.
    // block === editorRef is valid: it means the first line has no block wrapper yet.
    const block = closestBlockAncestor(range.startContainer, editorRef);
    if (block instanceof HTMLLIElement) return false;

    const blockText = (block.textContent ?? "").replace(/\u200B/g, "");

    let makeUl = false;
    let makeOl = false;
    let olNumberStyle: NumberStyle | null = null;

    if (blockText === "-") {
      makeUl = true;
    } else if (blockText === "1.") {
      makeOl = true;
      olNumberStyle = "decimal";
    } else if (blockText === "a.") {
      makeOl = true;
      olNumberStyle = "lower-alpha";
    } else if (blockText === "A.") {
      makeOl = true;
      olNumberStyle = "upper-alpha";
    } else {
      return false;
    }

    // Select and delete the trigger prefix in the block
    const deleteRange = document.createRange();
    deleteRange.selectNodeContents(block);
    selection.setSelection(deleteRange);
    document.execCommand("delete");

    // Sync saved range to the post-delete browser position (old nodes are detached)
    const afterDelete = document.getSelection();
    if (afterDelete?.rangeCount) {
      selection.syncRange(afterDelete.getRangeAt(0));
    }

    // Apply list — toggle* methods call selection.restoreRange() internally
    if (makeUl) {
      lists.toggleUnorderedList();
    } else {
      lists.toggleOrderedList();
      if (olNumberStyle && olNumberStyle !== "decimal") {
        lists.applyNumberStyle(olNumberStyle);
      }
    }

    syncToolbarState();
    emitDocumentChange();
    return true;
  };

  // Maps key letters to execCommand names (same names used by toolbar execInlineFormat)
  const inlineShortcutCommands: Partial<Record<string, string>> = {
    b: "bold",
    i: "italic",
    u: "underline"
  };

  const inlineShiftShortcutCommands: Partial<Record<string, string>> = {
    x: "strikeThrough"
  };

  createEffect(() => {
    const sessionKey = props.documentSessionKey;
    const initialDocumentHtml = props.initialDocumentHtml ?? "";

    if (!editorRef) {
      return;
    }

    if (hasAppliedInitialDocument && appliedDocumentSessionKey === sessionKey) {
      return;
    }

    hasAppliedInitialDocument = true;
    appliedDocumentSessionKey = sessionKey;
    colorState.pendingColor = undefined;
    colorState.isApplyingColor = false;
    colorState.prevSelectionCollapsed = true;
    editorRef.innerHTML = initialDocumentHtml;
    cleanupTypingSpans(editorRef);

    const nextRange = selection.createRangeAtEnd();
    if (nextRange) {
      if (document.activeElement === editorRef) {
        selection.setSelection(nextRange);
      } else {
        selection.syncRange(nextRange);
      }
    }

    syncToolbarState(nextRange);
  });

  const toolbarSnapshot = createMemo(() => {
    const snap = buildToolbarSnapshot({
      typo: typography.selectedTypography(),
      colorValue: typography.selectedColor(),
      lineSpacing: blocks.selectedLineSpacing(),
      alignment: blocks.selectedAlignment(),
      range: selection.savedRange(),
      editorRef
    });
    // When an icon span is selected, report the icon's color to the toolbar
    const iconSpan = selectedIconSpan();
    if (iconSpan) {
      return { ...snap, color: getIconColor(iconSpan) };
    }
    return snap;
  });

  /** onColorChange wrapper: recolors an icon span when one is selected */
  const handleColorChange = (color: NormalizedColor | null) => {
    const iconSpan = selectedIconSpan();
    if (iconSpan) {
      applyColorToIconSpan(iconSpan, color);
      emitDocumentChange();
      return;
    }
    toolbarHandlers.onColorChange(color);
  };

  const activeMargins = createMemo(() => props.margins ?? DEFAULT_DOCUMENT_MARGINS);

  return (
    <div
      ref={rootRef}
      class="monoscape-editor-shell"
      style={
        "display:flex;flex-direction:column;height:100%;overflow:clip;" +
        "border:1px solid #d9dde6;border-radius:18px;background:#f6f8fb;" +
        "box-shadow:0 18px 40px rgba(15,23,42,0.08);"
      }
    >
      <style>{EDITOR_STYLES}</style>
      <div class="monoscape-toolbar">
        <FormattingToolbar
          editorRef={() => editorRef}
          registerPrimaryFocusTarget={(focusTarget) => {
            focusPrimaryToolbarControl = focusTarget;
          }}
          onNavigateOut={keyboard.navigateFocusOutside}
          fonts={fontLibrary.fonts()}
          selectedFontFamily={toolbarSnapshot().fontFamily}
          selectedFontSize={toolbarSnapshot().fontSize}
          selectedAlignment={toolbarSnapshot().alignment}
          selectedLineSpacing={toolbarSnapshot().lineSpacing}
          selectedColor={toolbarSnapshot().color}
          userFonts={fontLibrary.userFonts()}
          onFontFamilyChange={toolbarHandlers.onFontFamilyChange}
          onFontSizeChange={toolbarHandlers.onFontSizeChange}
          onAlignmentChange={toolbarHandlers.onAlignmentChange}
          onLineSpacingChange={toolbarHandlers.onLineSpacingChange}
          onColorChange={handleColorChange}
          onIndent={toolbarHandlers.onIndent}
          onOutdent={toolbarHandlers.onOutdent}
          onUndo={() => document.execCommand('undo')}
          onRedo={() => document.execCommand('redo')}
          onCut={() => document.execCommand('cut')}
          onCopy={() => document.execCommand('copy')}
          onPaste={() => {
            // For paste, we want to use unformatted pasting by default
            // This is achieved by using execCommand('paste') which will paste as plain text
            document.execCommand('paste');
          }}
          onStyleSetApply={toolbarHandlers.onStyleSetApply}
          onAddCatalogFont={fontLibrary.addCatalogFont}
          onRemoveFont={fontLibrary.removeFont}
          onUploadFonts={fontLibrary.addUploadedFonts}
          onInsertImageFromFile={insertImageFromFile}
          onInsertImageFromUrl={insertImageFromUrl}
        />
        {/* Horizontal ruler — sticky inside the toolbar so it stays visible on scroll */}
        <div class="monoscape-ruler-row">
          <HorizontalRuler
            documentInches={8.5}
            marginStart={activeMargins().left}
            marginEnd={activeMargins().right}
          />
        </div>
      </div>
      <div class="monoscape-editor-body">
        {/* Vertical ruler — the outer rail spans the whole document height so
            scroll range depends only on page count; the inner ruler moves to
            the cursor's page. */}
        <div
          class="monoscape-ruler-v-wrap"
          style={`top:${FRAME_PADDING_PX}px;height:${pageCount() * PAGE_HEIGHT_PX}px`}
        >
          <div
            class="monoscape-ruler-v-current"
            style={`transform:translateY(${cursorPage() * PAGE_HEIGHT_PX}px)`}
          >
            <VerticalRuler
              documentInches={11}
              marginStart={activeMargins().top}
              marginEnd={activeMargins().bottom}
            />
          </div>
        </div>
        <div class="monoscape-editor-frame">
          <div class="monoscape-editor-pages-wrap">
            <For each={Array.from({ length: Math.max(0, pageCount() - 1) }, (_, i) => i + 1)}>
              {(pageNum) => (
                <div
                  class="monoscape-page-break-bar"
                  aria-hidden="true"
                  style={(() => {
                    const m = activeMargins();
                    const bPx = Math.round(m.bottom * 96);
                    const tPx = Math.round(m.top * 96);
                    const h = bPx + 12 + tPx;
                    return `top:calc(${pageNum} * 11in - ${m.bottom}in);height:${h}px;` +
                      `background:linear-gradient(to bottom,#fff ${bPx}px,#e0e4ea ${bPx}px,#e0e4ea ${bPx + 12}px,#fff ${bPx + 12}px)`;
                  })()}
                />
              )}
            </For>
            <div
              ref={editorRef}
              contentEditable={true}
              role="textbox"
            aria-multiline="true"
            aria-label="Document editor"
            aria-describedby={EDITOR_KEYBOARD_HELP_ID}
            data-placeholder={placeholder()}
            spellcheck={true}
            class="monoscape-editor"
            style={editorStyle()}
          onMouseDown={(e) => {
            // Set selectedIconSpan immediately on click for zero-latency highlight.
            // Do NOT call preventDefault or manually manipulate the selection here —
            // doing so fires two selectionchange events (removeAllRanges → addRange)
            // which briefly flashes selectedIconSpan to null before restoring it.
            // The browser naturally places the caret adjacent to the
            // contenteditable="false" span; our selectionchange listener then
            // confirms the icon via getIconSpanAtRange.
            const iconSpan = (e.target as Element).closest<HTMLSpanElement>("[data-monoscape-icon]");
            if (iconSpan) {
              setSelectedIconSpan(iconSpan);
            }

            // Image selection: clicking on an image shows the resize overlay.
            const img = (e.target as Element).closest<HTMLImageElement>("img[data-monoscape-image]");
            if (img) {
              setSelectedImage(img);
            } else {
              setSelectedImage(null);
            }
          }}
          onFocus={() => {
            queueMicrotask(() => {
              if (!selection.selectionBelongsToEditor()) {
                const range = selection.createRangeAtEnd();
                if (range) {
                  selection.setSelection(range);
                }
              }

              typography.syncFromSelection();
              if (selection.savedRange()) {
                blocks.syncFromRange(selection.savedRange()!);
              }
            });
          }}
          onInput={() => {
            cleanupEditorArtifacts();
            clearPendingColor();
            syncToolbarState();
            emitDocumentChange();
            syncCursorPageFromSelection();
            schedulePageCountUpdate?.();
          }}
          onKeyDown={(event) => {
            // Delete or Backspace removes the currently selected image
            if ((event.key === "Delete" || event.key === "Backspace") && selectedImage()) {
              event.preventDefault();
              const img = selectedImage()!;
              setSelectedImage(null);
              img.remove();
              finalizeContentMutation();
              return;
            }

            if ((event.ctrlKey || event.metaKey) && !event.altKey) {
              if (event.shiftKey) {
                const cmd = inlineShiftShortcutCommands[event.key.toLowerCase()];
                if (cmd) {
                  event.preventDefault();
                  document.execCommand(cmd);
                  return;
                }
              } else {
                const cmd = inlineShortcutCommands[event.key.toLowerCase()];
                if (cmd) {
                  event.preventDefault();
                  document.execCommand(cmd);
                  return;
                }
                // Ctrl+. → superscript, Ctrl+, → subscript
                if (event.key === ".") {
                  event.preventDefault();
                  document.execCommand("superscript");
                  return;
                }
                if (event.key === ",") {
                  event.preventDefault();
                  document.execCommand("subscript");
                  return;
                }
                // Ctrl+Enter → hard page break
                if (event.key === "Enter") {
                  event.preventDefault();
                  // Ensure caret is inside a block wrapper
                  const activeSel0 = document.getSelection();
                  if (activeSel0?.rangeCount && editorRef) {
                    const bn = closestBlockAncestor(activeSel0.getRangeAt(0).startContainer, editorRef);
                    if (bn === editorRef) {
                      document.execCommand("formatBlock", false, "<p>");
                    }
                  }
                  // Split the current paragraph
                  document.execCommand("insertParagraph");
                  // Insert a spacer to push the new paragraph to the next page boundary
                  const sel2 = document.getSelection();
                  if (sel2?.rangeCount && editorRef) {
                    const caretRange2 = sel2.getRangeAt(0);
                    const newBlock = closestBlockAncestor(caretRange2.startContainer, editorRef);
                    const prevBlock = newBlock !== editorRef ? newBlock.previousElementSibling : null;
                    if (prevBlock instanceof HTMLElement) {
                      const editorRect = editorRef.getBoundingClientRect();
                      const prevBottomFromTop = prevBlock.getBoundingClientRect().bottom - editorRect.top;
                      const PAGE_H_PX = PAGE_HEIGHT_PX;
                      const topPx = Math.round(activeMargins().top * 96);
                      const nextBoundary = Math.ceil(prevBottomFromTop / PAGE_H_PX) * PAGE_H_PX;
                      const heightToFill = nextBoundary + 12 + topPx - prevBottomFromTop;
                      if (heightToFill > 8) {
                        const spacer = document.createElement("div");
                        spacer.className = "monoscape-page-break-spacer";
                        spacer.style.height = `${heightToFill}px`;
                        spacer.appendChild(document.createElement("br"));
                        newBlock.before(spacer);
                      }
                    }

                    if (newBlock instanceof HTMLElement && newBlock !== editorRef) {
                      queueMicrotask(() => {
                        newBlock.scrollIntoView({ block: "nearest", inline: "nearest" });
                      });
                    }
                  }
                  finalizeContentMutation();
                  return;
                }
              }
            }

            if (event.key === "Backspace") {
              if (tryCollapseTrailingPageOnBackspace()) {
                event.preventDefault();
                return;
              }
              moveCaretBeforeEmptyTypingSpan();
            }

            const indentDirection = keyboard.readIndentShortcut(event);
            if (indentDirection) {
              event.preventDefault();
              keyboard.changeLineIndent(indentDirection);
              return;
            }

            if (event.key === "Tab" && !event.altKey && !event.ctrlKey && !event.metaKey) {
              event.preventDefault();
              keyboard.changeLineIndent(event.shiftKey ? "outdent" : "indent");
              return;
            }

            if (event.key === "Escape") {
              if (focusPrimaryToolbarControl) {
                event.preventDefault();
                focusPrimaryToolbarControl();
              }
              return;
            }

            if (event.key === " " && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
              if (tryAutoList()) {
                event.preventDefault();
                return;
              }
            }

            if (event.key === "Enter") {
              event.preventDefault();
              if (event.shiftKey) {
                // Soft line break: no paragraph spacing, no new list item
                document.execCommand("insertLineBreak");
              } else {
                // Paragraph break. When the caret sits directly in the editor
                // root (raw first line, no block wrapper yet), formatBlock wraps
                // the content in <p> first so that insertParagraph always
                // produces two block-level <p> siblings rather than falling back
                // to a plain <br> (Firefox default) or unstructured text.
                const activeSel = document.getSelection();
                if (editorRef && activeSel?.rangeCount) {
                  const blockNode = closestBlockAncestor(
                    activeSel.getRangeAt(0).startContainer,
                    editorRef
                  );
                  if (blockNode === editorRef) {
                    document.execCommand("formatBlock", false, "<p>");
                  }
                }
                document.execCommand("insertParagraph");
              }
              finalizeContentMutation();
            }
          }}
          />
          </div>
        </div>
      </div>

      {/* Image resize/rotate overlay — position:fixed, not clipped by parent overflow */}
      <Show when={selectedImage()}>
        <ImageResizeOverlay
          image={selectedImage()!}
          onMutated={emitDocumentChange}
        />
      </Show>
    </div>
  );
}
