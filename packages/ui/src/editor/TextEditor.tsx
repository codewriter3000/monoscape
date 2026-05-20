// Main editor component orchestrating selection, typography, blocks, fonts, and keyboard flow

import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
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
import { EDITOR_KEYBOARD_HELP_ID, EDITOR_STYLES, buildEditorInlineStyle } from "./constants";
import { getIconSpanAtRange, getIconColor, applyColorToIconSpan, buildInsertableSvgElement } from "../iconUtils";
import { ImageResizeOverlay } from "./ImageResizeOverlay";

export interface TextEditorProps {
  documentSessionKey?: string;
  initialDocumentHtml?: string;
  onDocumentChange?: (html: string) => void;
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
}

export function TextEditor(props: TextEditorProps) {
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
  const editorStyle = createMemo(() =>
    buildEditorInlineStyle(
      getFontFamilyStack(fontLibrary.defaultFont()),
      DEFAULT_TYPOGRAPHY.fontSize,
      DEFAULT_LINE_SPACING
    )
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

  const finalizeContentMutation = () => {
    queueMicrotask(() => {
      if (editorRef) {
        cleanupTypingSpans(editorRef);
      }
      syncToolbarState();
      emitDocumentChange();
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

  return (
    <div
      ref={rootRef}
      class="monoscape-editor-shell"
      style={
        "display:flex;flex-direction:column;min-height:100%;overflow:clip;" +
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
          onStyleSetApply={toolbarHandlers.onStyleSetApply}
          onAddCatalogFont={fontLibrary.addCatalogFont}
          onRemoveFont={fontLibrary.removeFont}
          onUploadFonts={fontLibrary.addUploadedFonts}
          onInsertImageFromFile={insertImageFromFile}
          onInsertImageFromUrl={insertImageFromUrl}
        />
      </div>
      <div class="monoscape-editor-frame">
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
            if (editorRef) {
              cleanupTypingSpans(editorRef);
            }
            clearPendingColor();
            syncToolbarState();
            emitDocumentChange();
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
              }
            }

            if (event.key === "Backspace") {
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
