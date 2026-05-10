// Editor constants and type definitions

export const EDITOR_KEYBOARD_HELP_ID = "monoscape-editor-help";

export const EDITOR_STYLES = `
  .monoscape-editor-frame {
    display: flex;
    justify-content: center;
    padding: 24px;
    background: linear-gradient(180deg, #edf2f8 0%, #e7ecf4 100%);
  }

  .monoscape-editor {
    margin: 0 auto;
  }

  .monoscape-editor:empty::before {
    content: attr(data-placeholder);
    color: #7b869b;
  }

  .monoscape-toolbar button:focus-visible,
  .monoscape-toolbar select:focus-visible,
  .monoscape-toolbar input:focus-visible {
    outline: 2px solid #005fcc;
    outline-offset: 2px;
  }

  .monoscape-editor:focus,
  .monoscape-editor:focus-visible {
    box-shadow: 0 0 0 3px #4a90d9, 0 22px 40px rgba(15,23,42,0.12);
  }

  @media (forced-colors: active) {
    .monoscape-toolbar button:focus-visible,
    .monoscape-toolbar select:focus-visible,
    .monoscape-toolbar input:focus-visible,
    .monoscape-editor:focus,
    .monoscape-editor:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: 2px;
    }
  }

  @media (max-width: 720px) {
    .monoscape-editor-frame {
      padding: 12px;
    }

    .monoscape-editor {
      width: 100% !important;
      min-height: 70vh !important;
      padding: 28px 24px !important;
      border-radius: 8px !important;
    }
  }
`;

export function buildEditorInlineStyle(fontStack: string, fontSize: number, lineSpacing: number) {
  return (
    `font-family:${fontStack};font-size:${fontSize}pt;line-height:${lineSpacing};text-align:left;` +
    "width:min(100%,8.5in);min-height:calc(11in - 1.8in);padding:0.9in 0.85in;" +
    "border:1px solid #d9dde6;border-radius:10px;background:#fff;color:#172033;" +
    "box-shadow:0 22px 40px rgba(15,23,42,0.12);" +
    "white-space:pre-wrap;word-break:break-word;outline:none;tab-size:4;"
  );
}

export const BLOCK_ELEMENT_TAGS = new Set([
  "ADDRESS",
  "ARTICLE",
  "ASIDE",
  "BLOCKQUOTE",
  "DIV",
  "FIGCAPTION",
  "FIGURE",
  "FOOTER",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "HEADER",
  "LI",
  "MAIN",
  "NAV",
  "OL",
  "P",
  "PRE",
  "SECTION",
  "TABLE",
  "TD",
  "TH",
  "UL"
]);

export interface BoundaryPoint {
  container: Node;
  offset: number;
}

export interface TextSegment {
  kind: "text";
  node: Text;
  start: number;
  end: number;
}

export interface BreakSegment {
  kind: "break";
  node: HTMLBRElement;
  start: number;
  end: number;
  before: BoundaryPoint;
  after: BoundaryPoint;
}

export type PlainTextSegment = TextSegment | BreakSegment;

export interface PlainTextModel {
  text: string;
  segments: PlainTextSegment[];
  lineStarts: Array<{ index: number; boundary: BoundaryPoint }>;
}
