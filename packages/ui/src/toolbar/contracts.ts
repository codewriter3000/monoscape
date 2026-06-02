// Toolbar-editor contracts for selection snapshots and command handlers

import type { FormattingState, TextAlignment, NormalizedColor } from "@monoscape/document-core";

export interface ToolbarSelectionSnapshot {
  formatting: FormattingState;
  fontFamily: string | null;
  fontSize: number | null;
  lineSpacing: number | null;
  alignment: TextAlignment | null;
  color: NormalizedColor | null;
  isEmpty: boolean;
}

export interface ToolbarCommandHandlers {
  onFormatToggle: (mark: keyof FormattingState) => void;
  onFontFamilyChange: (family: string) => void;
  onFontSizeChange: (size: number) => void;
  onLineSpacingChange: (spacing: number) => void;
  onAlignmentChange: (alignment: TextAlignment) => void;
  onColorChange: (color: NormalizedColor | null) => void;
  onIndent: () => void;
  onOutdent: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onStyleSetApply: (styleSetId: string, blockStyleId: string) => void;
}
