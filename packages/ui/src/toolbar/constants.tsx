// Toolbar button metadata, keytip ordering, and labels

import type { TextAlignment } from "@monoscape/document-core";
import type { JSX } from "solid-js/jsx-runtime";
import { cutIcon } from "./icons";

export const undoRedoActions = [
  {
    id: "undo",
    command: "undo",
    label: "Undo",
    shortcut: "Ctrl+Z",
    ariaShortcut: "Control+Z",
    content: <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M20,10H7.8149l3.5874-3.5859L10,5,4,11,10,17l1.4023-1.4146L7.8179,12H20a6,6,0,0,1,0,12H12v2h8a8,8,0,0,0,0-16Z"></path></svg>
  },
  {
    id: "redo",
    command: "redo",
    label: "Redo",
    shortcut: "Ctrl+Y",
    ariaShortcut: "Control+Y",
    content: <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M12,10H24.1851L20.5977,6.4141,22,5,28,11,22,17l-1.4023-1.4146L24.1821,12H12a6,6,0,0,0,0,12h8v2H12a8,8,0,0,1,0-16Z"></path></svg>
  }
] as const;

export const cutCopyPasteActions = [
  {
    id: "cut",
    command: "cut",
    label: "Cut",
    shortcut: "Ctrl+X",
    ariaShortcut: "Control+X",
    content: <img src={cutIcon} /> //<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M26.5,19.63,20.24,16l6.26-3.63a5,5,0,0,0-1.21-9.2A5.19,5.19,0,0,0,24,3a5,5,0,0,0-4.33,7.53,5,5,0,0,0,2.39,2.1l-3.82,2.21L4,6.6,3,8.34,16.24,16,3,23.68l1,1.74,14.24-8.26,3.82,2.21a5,5,0,0,0-2.39,2.1A5,5,0,0,0,24,29a5.19,5.19,0,0,0,1.29-.17,5,5,0,0,0,1.21-9.2ZM21.4,9.53a3,3,0,0,1,1.1-4.12,3,3,0,0,1,4.1,1.11,3,3,0,0,1-1.1,4.11h0A3,3,0,0,1,21.4,9.53Zm5.2,16a3,3,0,0,1-4.1,1.11,3,3,0,0,1-1.1-4.12,3,3,0,0,1,4.1-1.1h0A3,3,0,0,1,26.6,25.48Z"></path></svg>
  },
  {
    id: "copy",
    command: "copy",
    label: "Copy",
    shortcut: "Ctrl+C",
    ariaShortcut: "Control+C",
    content: <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M7,7h3v3h12v-3h3v11h2V7c-.0032-1.1033-.8967-1.9968-2-2h-3v-1c-.0032-1.1033-.8967-1.9968-2-2h-8c-1.1033.0032-1.9968.8967-2,2v1h-3c-1.1033.0032-1.9968.8967-2,2v21c.0032,1.1032.8967,1.9968,2,2h9v-2H7V7ZM12,4h8v4h-8v-4ZM30,24h-8.172l2.586-2.586-1.414-1.414-5,5,5,5,1.414-1.414-2.586-2.586h8.172v-2ZM12,13h-2v2h2v-2ZM22,13h-8v2h8v-2ZM12,18h-2v2h2v-2ZM10,25h2v-2h-2v2ZM14,20h4v-2h-4v2Z"></path></svg>
  },
  {
    id: "paste",
    command: "paste",
    label: "Paste",
    shortcut: "Ctrl+V",
    ariaShortcut: "Control+V",
    content: <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M26,20H17.83l2.58-2.59L19,16l-5,5,5,5,1.41-1.41L17.83,22H26v8h2V22A2,2,0,0,0,26,20Z"></path><path d="M23.71,9.29l-7-7A1,1,0,0,0,16,2H6A2,2,0,0,0,4,4V28a2,2,0,0,0,2,2h8V28H6V4h8v6a2,2,0,0,0,2,2h6v2h2V10A1,1,0,0,0,23.71,9.29ZM16,4.41,21.59,10H16Z"></path></svg>
  }
] as const;

export const inlineFormattingActions = [
  {
    id: "bold",
    command: "bold",
    label: "Bold",
    shortcut: "Ctrl+B",
    ariaShortcut: "Control+B",
    content: <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M18.25,25H9V7h8.5a5.25,5.25,0,0,1,4,8.65A5.25,5.25,0,0,1,18.25,25ZM12,22h6.23a2.25,2.25,0,1,0,0-4.5H12Zm0-7.5h5.5a2.25,2.25,0,1,0,0-4.5H12Z"></path></svg>
  },
  {
    id: "italic",
    command: "italic",
    label: "Italic",
    shortcut: "Ctrl+I",
    ariaShortcut: "Control+I",
    content: <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M25 9 25 7 12 7 12 9 17.14 9 12.77 23 7 23 7 25 20 25 20 23 14.86 23 19.23 9 25 9z"></path></svg>
  },
  {
    id: "underline",
    command: "underline",
    label: "Underline",
    shortcut: "Ctrl+U",
    ariaShortcut: "Control+U",
    content: <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M4 26H28V28H4z"></path><path d="M16,23a7,7,0,0,1-7-7V5h2V16a5,5,0,0,0,10,0V5h2V16A7,7,0,0,1,16,23Z"></path></svg>
  },
  {
    id: "strikethrough",
    command: "strikeThrough",
    label: "Strikethrough",
    shortcut: "Ctrl+Shift+X",
    ariaShortcut: "Control+Shift+X",
    content: <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M28,15H17.9563c-.4522-.1237-.9037-.2324-1.3381-.3352-2.8077-.6641-4.396-1.1506-4.396-3.4231a2.8684,2.8684,0,0,1,.7866-2.145,4.7888,4.7888,0,0,1,3.0137-1.09c2.8291-.07,4.1347.8894,5.2011,2.35l1.6153-1.1792a7.4727,7.4727,0,0,0-6.83-3.1706,6.7726,6.7726,0,0,0-4.4,1.6611,4.8274,4.8274,0,0,0-1.3862,3.5735A4.3723,4.3723,0,0,0,11.9573,15H4v2H17.6519c1.9668.57,3.1432,1.3123,3.1733,3.3579a3.119,3.119,0,0,1-.8623,2.3931A5.8241,5.8241,0,0,1,16.2432,24a6.6344,6.6344,0,0,1-5.1451-2.6912L9.5649,22.593A8.5262,8.5262,0,0,0,16.2119,26c.0088-.0012.042,0,.1,0A7.67,7.67,0,0,0,21.36,24.1812a5.0779,5.0779,0,0,0,1.4648-3.8531A4.952,4.952,0,0,0,21.6753,17H28Z"></path></svg>
  },
  {
    id: "superscript",
    command: "superscript",
    label: "Superscript",
    shortcut: "Ctrl+.",
    ariaShortcut: "Control+.",
    content: <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M29 17 23 17 23 11 27 11 27 9 23 9 23 7 29 7 29 13 25 13 25 15 29 15 29 17z"></path><path d="M4 7 4 9 11 9 11 25 13 25 13 9 20 9 20 7 4 7z"></path></svg>
  },
  {
    id: "subscript",
    command: "subscript",
    label: "Subscript",
    shortcut: "Ctrl+,",
    ariaShortcut: "Control+,",
    content: <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M26 25 20 25 20 19 24 19 24 17 20 17 20 15 26 15 26 21 22 21 22 23 26 23 26 25z"></path><path d="M5 7 5 9 12 9 12 25 14 25 14 9 21 9 21 7 5 7z"></path></svg>
  }
] as const;

export const alignmentActions: Array<{ id: TextAlignment; label: string; content: JSX.Element }> = [
  {
    id: "left",
    label: "Align left",
    content: <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M12 6H26V8H12z"></path><path d="M12 12H22V14H12z"></path><path d="M12 18H26V20H12z"></path><path d="M12 24H22V26H12z"></path><path d="M6 4H8V28H6z"></path></svg>
  },
  {
    id: "center",
    label: "Align center",
    content: <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M6 6H26V8H6z"></path><path d="M10 12H22V14H10z"></path><path d="M6 18H26V20H6z"></path><path d="M10 24H22V26H10z"></path></svg>
  },
  {
    id: "right",
    label: "Align right",
    content: <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M6 6H20V8H6z"></path><path d="M10 12H20V14H10z"></path><path d="M6 18H20V20H6z"></path><path d="M10 24H20V26H10z"></path><path d="M24 4H26V28H24z"></path></svg>
  },
  {
    id: "justify",
    label: "Justify",
    content: <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M6 6H26V8H6z"></path><path d="M6 12H26V14H6z"></path><path d="M6 18H26V20H6z"></path><path d="M6 24H26V26H6z"></path></svg>
  }
];

export const buttonOrder = [
  ...undoRedoActions.map((action) => action.id),
  ...cutCopyPasteActions.map((action) => action.id),
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
