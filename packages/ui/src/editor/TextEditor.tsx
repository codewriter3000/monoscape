// Main editor component orchestrating selection, typography, blocks, fonts, and keyboard flow

import { createMemo, onCleanup, onMount } from "solid-js";
import { DEFAULT_LINE_SPACING, DEFAULT_TYPOGRAPHY, getFontFamilyStack, resolveUniformValue } from "@monoscape/document-core";
import type { FontCatalogEntry } from "@monoscape/document-core";
import { FormattingToolbar } from "../FormattingToolbar";
import type { ToolbarSelectionSnapshot, ToolbarCommandHandlers } from "../toolbar/contracts";
import { useEditorSelection } from "./hooks/useEditorSelection";
import { useTypographyFormatting } from "./hooks/useTypographyFormatting";
import { useBlockFormatting } from "./hooks/useBlockFormatting";
import { useFontLibrary } from "./hooks/useFontLibrary";
import { useEditorKeyboardFlow } from "./hooks/useEditorKeyboardFlow";
import { cleanupTypingSpans } from "./utils/typographySpans";
import { collectTextSegments } from "./utils/blockTraversal";
import { EDITOR_KEYBOARD_HELP_ID, EDITOR_STYLES, buildEditorInlineStyle } from "./constants";

const readFontSizeInPoints = (value: string) => { const parsed = Number.parseFloat(value); return !Number.isFinite(parsed) ? DEFAULT_TYPOGRAPHY.fontSize : value.endsWith("px") ? Math.round((parsed * 72) / 96) : Math.round(parsed); };

export interface TextEditorProps {
  fontCapabilities?: {
    searchGoogleFonts?: (query: string) => Promise<FontCatalogEntry[]>;
    uploadFonts?: boolean;
  };
}

export function TextEditor(props: TextEditorProps) {
  let rootRef: HTMLDivElement | undefined;
  let editorRef: HTMLDivElement | undefined;
  let focusPrimaryToolbarControl: (() => void) | null = null;

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
  onMount(() => {
    const handleSelectionChange = () => {
      const sel = document.getSelection();
      if (selection.selectionBelongsToEditor(sel) && sel?.rangeCount) {
        const range = sel.getRangeAt(0);
        selection.syncRange(range);
        typography.syncFromRange(range);
        blocks.syncFromRange(range);
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    onCleanup(() => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    });
  });
  const toolbarSnapshot = createMemo((): ToolbarSelectionSnapshot => {
    const typo = typography.selectedTypography();
    const colorValue = typography.selectedColor();
    const lineSpacing = blocks.selectedLineSpacing();
    const alignment = blocks.selectedAlignment();
    const range = selection.savedRange();
    let fontFamily = typo?.fontFamily ?? null;
    let fontSize = typo?.fontSize ?? null;
    if (range && editorRef) {
      const segments = collectTextSegments(range, editorRef).filter(({ node }) => node.data.trim().length);
      if (segments.length) {
        const families = segments.map(({ node }) => getComputedStyle(node.parentElement ?? editorRef).fontFamily);
        const sizes = segments.map(({ node }) => getComputedStyle(node.parentElement ?? editorRef).fontSize);
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
      formatting: {
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        superscript: false,
        subscript: false
      },
      fontFamily,
      fontSize,
      lineSpacing,
      alignment,
      color: colorValue,
      isEmpty: !editorRef?.textContent?.trim()
    };
  });

  const toolbarHandlers: ToolbarCommandHandlers = {
    onFormatToggle: (mark) => {
      if (!editorRef) return;
      const range = selection.restoreRange();
      if (range) {
        document.execCommand(mark);
      }
    },
    onFontFamilyChange: (family) => typography.applyTypographyPatch({ fontFamily: family }),
    onFontSizeChange: (size) => typography.applyTypographyPatch({ fontSize: size }),
    onLineSpacingChange: (spacing) => blocks.applyLineSpacing(spacing),
    onAlignmentChange: (alignment) => blocks.applyAlignment(alignment),
    onColorChange: (color) => {
      const currentTypo = typography.activeTypography();
      typography.applyTypographyPatch(currentTypo, color);
    },
    onIndent: () => keyboard.changeLineIndent("indent"),
    onOutdent: () => keyboard.changeLineIndent("outdent"),
    onStyleSetApply: (styleSetId, blockStyleId) => 
      blocks.applyStyleSet(styleSetId as any, blockStyleId as any)
  };

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
      <p
        id={EDITOR_KEYBOARD_HELP_ID}
        style="margin:0;padding:10px 24px 0;color:#52607a;font-size:0.85rem;background:#f6f8fb;"
      >
        Press Alt to reveal toolbar keytips. Alt plus the shown letter opens or runs that
        control. Tab indents selected lines, Shift+Tab outdents them, Ctrl+] / Ctrl+[ still
        work, and Escape moves focus from the editor back to the toolbar.
      </p>
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
            typography.syncFromSelection();
            if (selection.savedRange()) {
              blocks.syncFromRange(selection.savedRange()!);
            }
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
              queueMicrotask(() => {
                if (editorRef) {
                  cleanupTypingSpans(editorRef);
                }
                typography.syncFromSelection();
                if (selection.savedRange()) {
                  blocks.syncFromRange(selection.savedRange()!);
                }
              });
            }
          }}
        />
      </div>
    </div>
  );
}
