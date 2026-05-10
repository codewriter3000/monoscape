// Toolbar button metadata, keytip ordering, and labels

import type { TextAlignment } from "@monoscape/document-core";

export const inlineFormattingActions = [
  {
    id: "bold",
    command: "bold",
    label: "Bold",
    shortcut: "Ctrl+B",
    ariaShortcut: "Control+B",
    content: <strong>B</strong>
  },
  {
    id: "italic",
    command: "italic",
    label: "Italic",
    shortcut: "Ctrl+I",
    ariaShortcut: "Control+I",
    content: <em>I</em>
  },
  {
    id: "underline",
    command: "underline",
    label: "Underline",
    shortcut: "Ctrl+U",
    ariaShortcut: "Control+U",
    content: <span style="text-decoration:underline">U</span>
  },
  {
    id: "strikethrough",
    command: "strikeThrough",
    label: "Strikethrough",
    shortcut: "Ctrl+Shift+X",
    ariaShortcut: "Control+Shift+X",
    content: <span style="text-decoration:line-through">S</span>
  },
  {
    id: "superscript",
    command: "superscript",
    label: "Superscript",
    shortcut: "Ctrl+.",
    ariaShortcut: "Control+.",
    content: <span style="font-size:0.8em;vertical-align:super;">x²</span>
  },
  {
    id: "subscript",
    command: "subscript",
    label: "Subscript",
    shortcut: "Ctrl+,",
    ariaShortcut: "Control+,",
    content: <span style="font-size:0.8em;vertical-align:sub;">x₂</span>
  }
] as const;

export const alignmentActions: Array<{ id: TextAlignment; label: string; content: string }> = [
  { id: "left", label: "Align left", content: "≡" },
  { id: "center", label: "Align center", content: "≣" },
  { id: "right", label: "Align right", content: "☰" },
  { id: "justify", label: "Justify", content: "☷" }
];

export const buttonOrder = [
  ...inlineFormattingActions.map((action) => action.id),
  ...alignmentActions.map((action) => action.id),
  "indent",
  "outdent"
] as const;

export type InlineFormattingId = (typeof inlineFormattingActions)[number]["id"];
export type InlineFormattingCommand = (typeof inlineFormattingActions)[number]["command"];
export type ToolbarButtonId = (typeof buttonOrder)[number];

export function formatLineSpacingValue(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function labelLineSpacingOption(value: number) {
  if (value === 0.5) return "0.5 · Tight";
  if (value === 1) return "1 · Single";
  if (value === 1.5) return "1.5 · Relaxed";
  if (value === 2) return "2 · Double";
  if (value === 3) return "3 · Triple";
  return formatLineSpacingValue(value);
}
