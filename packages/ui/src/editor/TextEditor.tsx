// Main editor component orchestrating selection, typography, blocks, fonts, and keyboard flow

import { createEffect, createMemo } from "solid-js";
import { DEFAULT_LINE_SPACING, DEFAULT_TYPOGRAPHY, getFontFamilyStack } from "@monoscape/document-core";
import type { FontCatalogEntry } from "@monoscape/document-core";
import { FormattingToolbar } from "../FormattingToolbar";
import { useEditorSelection } from "./hooks/useEditorSelection";
import { useTypographyFormatting } from "./hooks/useTypographyFormatting";
import { useBlockFormatting } from "./hooks/useBlockFormatting";
import { useFontLibrary } from "./hooks/useFontLibrary";
import { useEditorKeyboardFlow } from "./hooks/useEditorKeyboardFlow";
import { useEditorToolbarState, type EditorColorState } from "./hooks/useEditorToolbarState";
import { cleanupTypingSpans } from "./utils/typographySpans";
import { buildToolbarSnapshot } from "./utils/editorToolbarSnapshot";
import { EDITOR_KEYBOARD_HELP_ID, EDITOR_STYLES, buildEditorInlineStyle } from "./constants";

export interface TextEditorProps {
  documentSessionKey?: string;
  initialDocumentHtml?: string;
  onDocumentChange?: (html: string) => void;
  fontCapabilities?: {
    searchGoogleFonts?: (query: string) => Promise<FontCatalogEntry[]>;
    uploadFonts?: boolean;
  };
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

  const toolbarHandlers = useEditorToolbarState({
    selection,
    typography,
    blocks,
    keyboard,
    colorState,
    finalizeContentMutation
  });

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

  const toolbarSnapshot = createMemo(() =>
    buildToolbarSnapshot({
      typo: typography.selectedTypography(),
      colorValue: typography.selectedColor(),
      lineSpacing: blocks.selectedLineSpacing(),
      alignment: blocks.selectedAlignment(),
      range: selection.savedRange(),
      editorRef
    })
  );

  return (
    <div
      ref={rootRef}
      class="monoscape-editor-shell"
      style={
        "display:flex;flex-direction:column;min-height:100%;overflow:hidden;" +
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
          onColorChange={toolbarHandlers.onColorChange}
          onIndent={toolbarHandlers.onIndent}
          onOutdent={toolbarHandlers.onOutdent}
          onStyleSetApply={toolbarHandlers.onStyleSetApply}
          onAddCatalogFont={fontLibrary.addCatalogFont}
          onRemoveFont={fontLibrary.removeFont}
          onUploadFonts={fontLibrary.addUploadedFonts}
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
            syncToolbarState();
            emitDocumentChange();
          }}
          onKeyDown={(event) => {
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

            if (event.key === "Enter") {
              event.preventDefault();
              document.execCommand("insertLineBreak");
              finalizeContentMutation();
            }
          }}
        />
      </div>
    </div>
  );
}
