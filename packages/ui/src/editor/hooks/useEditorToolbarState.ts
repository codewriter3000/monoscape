import { onCleanup, onMount } from "solid-js";
import type { NormalizedColor, TypographyPatch, TypographySettings, TextAlignment, AcademicStyleSetId, AcademicBlockStyleId } from "@monoscape/document-core";
import type { ToolbarCommandHandlers } from "../../toolbar/contracts";

export interface EditorColorState {
  pendingColor: NormalizedColor | null | undefined;
  isApplyingColor: boolean;
  prevSelectionCollapsed: boolean;
}

interface SelectionAPI {
  selectionBelongsToEditor: (sel?: Selection | null) => boolean;
  savedRange: () => Range | null;
  syncRange: (range: Range) => void;
  restoreRange: () => Range | null;
}

interface TypographyAPI {
  syncFromRange: (range: Range) => void;
  activeTypography: () => TypographySettings;
  applyTypographyPatch: (typo: TypographyPatch, color?: NormalizedColor | null) => void;
}

interface BlocksAPI {
  syncFromRange: (range: Range) => void;
  applyLineSpacing: (spacing: number) => void;
  applyAlignment: (alignment: TextAlignment) => void;
  applyStyleSet: (styleSetId: AcademicStyleSetId, blockStyleId: AcademicBlockStyleId) => void;
}

interface KeyboardAPI {
  changeLineIndent: (direction: "indent" | "outdent") => void;
}

interface EditorToolbarStateParams {
  selection: SelectionAPI;
  typography: TypographyAPI;
  blocks: BlocksAPI;
  keyboard: KeyboardAPI;
  colorState: EditorColorState;
  finalizeContentMutation: () => void;
}

export function useEditorToolbarState(params: EditorToolbarStateParams): ToolbarCommandHandlers {
  const { selection, typography, blocks, keyboard, colorState, finalizeContentMutation } = params;

  onMount(() => {
    const handleSelectionChange = () => {
      const sel = document.getSelection();
      if (selection.selectionBelongsToEditor(sel) && sel?.rangeCount) {
        const range = sel.getRangeAt(0);
        selection.syncRange(range);
        typography.syncFromRange(range);
        blocks.syncFromRange(range);

        const wasCollapsed = colorState.prevSelectionCollapsed;
        colorState.prevSelectionCollapsed = range.collapsed;

        if (colorState.pendingColor !== undefined && range.collapsed && wasCollapsed && !colorState.isApplyingColor) {
          const anchorParent = sel.anchorNode?.parentElement;
          if (anchorParent?.dataset?.monoscapeTyping !== "true") {
            document.removeEventListener("selectionchange", handleSelectionChange);
            colorState.isApplyingColor = true;
            const currentTypo = typography.activeTypography();
            typography.applyTypographyPatch(currentTypo, colorState.pendingColor);
            colorState.isApplyingColor = false;
            document.addEventListener("selectionchange", handleSelectionChange);
            const newSel = document.getSelection();
            if (newSel?.rangeCount) {
              const newRange = newSel.getRangeAt(0);
              selection.syncRange(newRange);
              typography.syncFromRange(newRange);
              if (selection.savedRange()) blocks.syncFromRange(selection.savedRange()!);
            }
          }
        }
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    onCleanup(() => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    });
  });

  return {
    onFormatToggle: (mark) => {
      const range = selection.restoreRange();
      if (range) {
        document.execCommand(mark);
        finalizeContentMutation();
      }
    },
    onFontFamilyChange: (family) => {
      typography.applyTypographyPatch({ fontFamily: family });
      finalizeContentMutation();
    },
    onFontSizeChange: (size) => {
      typography.applyTypographyPatch({ fontSize: size });
      finalizeContentMutation();
    },
    onLineSpacingChange: (spacing) => {
      blocks.applyLineSpacing(spacing);
      finalizeContentMutation();
    },
    onAlignmentChange: (alignment) => {
      blocks.applyAlignment(alignment);
      finalizeContentMutation();
    },
    onColorChange: (color) => {
      colorState.pendingColor = color;
      colorState.isApplyingColor = true;
      const currentTypo = typography.activeTypography();
      typography.applyTypographyPatch(currentTypo, color);
      colorState.isApplyingColor = false;
      finalizeContentMutation();
    },
    onIndent: () => {
      keyboard.changeLineIndent("indent");
      finalizeContentMutation();
    },
    onOutdent: () => {
      keyboard.changeLineIndent("outdent");
      finalizeContentMutation();
    },
    onStyleSetApply: (styleSetId, blockStyleId) => {
      blocks.applyStyleSet(styleSetId as AcademicStyleSetId, blockStyleId as AcademicBlockStyleId);
      finalizeContentMutation();
    }
  };
}
