import type { JSX } from "solid-js";

export type RightPanelTab = "insert" | "style" | "list" | "layout";
export type PageOrientation = "portrait" | "landscape";
export type PaperSize = "letter" | "a4" | "legal" | "a3" | "a5" | "tabloid";
export type MarginPreset = "normal" | "narrow" | "wide" | "custom";
export type ColumnCount = 1 | 2 | 3;
export type LineNumberMode = "none" | "continuous" | "perPage";
export type HyphenationMode = "none" | "auto" | "manual";
export type TextCaseMode = "none" | "uppercase" | "lowercase" | "capitalize";
export type UnderlineStyle = "none" | "solid" | "double" | "wavy" | "dotted" | "dashed";
export type BaselineMode = "normal" | "super" | "sub";

export const TABLE_ROWS = 8;
export const TABLE_COLS = 8;

export const SECTION_TITLE =
  "font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #52607a; margin: 0 0 8px; padding: 0;";
export const FIELD_LABEL =
  "font-size: 0.72rem; color: #52607a; display: block; margin-bottom: 3px;";

export const PARA_STYLES: { id: string; label: string }[] = [
  { id: "normal", label: "Normal" },
  { id: "title", label: "Title" },
  { id: "subtitle", label: "Subtitle" },
  { id: "h1", label: "Heading 1" },
  { id: "h2", label: "Heading 2" },
  { id: "h3", label: "Heading 3" },
  { id: "h4", label: "Heading 4" },
  { id: "quote", label: "Block Quote" },
  { id: "code", label: "Code Block" },
  { id: "caption", label: "Caption" },
];

export const HIGHLIGHT_COLORS = [
  "#FFFF00", "#ADFFD1", "#ABE2FF", "#FFB3DE",
  "#FFA500", "#FF6347", "#DDA0DD", "#A9A9A9",
];

export const SHAPES: { icon: string; label: string }[] = [
  { icon: "⬜", label: "Rectangle" },
  { icon: "⬭", label: "Oval" },
  { icon: "△", label: "Triangle" },
  { icon: "◇", label: "Diamond" },
  { icon: "▷", label: "Arrow right" },
  { icon: "⟵", label: "Arrow left" },
  { icon: "⎯", label: "Line" },
  { icon: "⤡", label: "Double arrow" },
  { icon: "⌐", label: "Connector" },
  { icon: "☁", label: "Cloud" },
  { icon: "★", label: "Star" },
  { icon: "⬠", label: "Pentagon" },
];

export const BREAK_TYPES: { label: string; key: string }[] = [
  { label: "Page break", key: "page" },
  { label: "Section (next page)", key: "section-next" },
  { label: "Section (continuous)", key: "section-cont" },
  { label: "Column break", key: "column" },
  { label: "Text wrapping break", key: "text-wrap" },
];

export function fieldInput(): string {
  return (
    "width: 100%; padding: 5px 8px; border: 1px solid #c3cad8; border-radius: 5px;" +
    " font-size: 0.78rem; color: #172033; background: #fff; box-sizing: border-box;" +
    " outline: none; font-family: inherit;"
  );
}

export function compactNumInput(): string {
  return (
    "width: 56px; padding: 4px 6px; border: 1px solid #c3cad8; border-radius: 5px;" +
    " font-size: 0.78rem; color: #172033; background: #fff; outline: none;" +
    " font-family: inherit; text-align: right;"
  );
}

export function segmentButton(active: boolean, bordered: "left" | "right" | "middle" | "none"): string {
  const radius = (() => {
    if (bordered === "left") return "border-radius: 5px 0 0 5px;";
    if (bordered === "right") return "border-radius: 0 5px 5px 0;";
    if (bordered === "middle") return "border-radius: 0;";
    return "border-radius: 5px;";
  })();
  return (
    `flex: 1; padding: 5px 4px; border: 1px solid ${active ? "#005fcc" : "#c3cad8"};` +
    ` background: ${active ? "#dce8ff" : "#f7f9fc"};` +
    ` color: ${active ? "#005fcc" : "#172033"};` +
    ` font-size: 0.7rem; font-weight: ${active ? 600 : 400}; cursor: pointer; outline: none;` +
    ` font-family: inherit; border-right-width: 0;` +
    ` ${radius}`
  );
}

export function segmentButtonLast(active: boolean): string {
  return (
    `flex: 1; padding: 5px 4px; border: 1px solid ${active ? "#005fcc" : "#c3cad8"};` +
    ` background: ${active ? "#dce8ff" : "#f7f9fc"};` +
    ` color: ${active ? "#005fcc" : "#172033"};` +
    ` font-size: 0.7rem; font-weight: ${active ? 600 : 400}; cursor: pointer; outline: none;` +
    ` font-family: inherit; border-radius: 0 5px 5px 0;`
  );
}

export function outlineActionButton(): string {
  return (
    "padding: 5px 10px; border: 1px solid #c3cad8; border-radius: 5px; background: #f7f9fc;" +
    " color: #172033; font-size: 0.75rem; cursor: pointer; outline: none; text-align: left;" +
    " font-family: inherit; width: 100%;"
  );
}

export function styleChip(active: boolean): string {
  return (
    `padding: 5px 10px; border: 1px solid ${active ? "#005fcc" : "#c3cad8"}; border-radius: 5px;` +
    ` background: ${active ? "#dce8ff" : "#f7f9fc"};` +
    ` color: ${active ? "#005fcc" : "#172033"};` +
    ` font-size: 0.75rem; font-weight: ${active ? 600 : 400}; cursor: pointer; outline: none;` +
    ` text-align: left; font-family: inherit; width: 100%;`
  );
}

export function Divider(): JSX.Element {
  return <div style="height: 1px; background: #e9ecf0; margin: 0 0 16px;" />;
}

export function SectionWrap(props: { children: JSX.Element }): JSX.Element {
  return <div style="margin-bottom: 18px;">{props.children}</div>;
}
