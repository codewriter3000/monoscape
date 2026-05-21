// Editor constants and type definitions

export const EDITOR_KEYBOARD_HELP_ID = "monoscape-editor-help";

/** Page margins expressed in inches. */
export interface DocumentMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const DEFAULT_DOCUMENT_MARGINS: DocumentMargins = {
  top: 1.0,
  bottom: 1.0,
  left: 1.25,
  right: 1.25,
};

export const EDITOR_STYLES = `
  .monoscape-toolbar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #f6f8fb;
    border-radius: 18px 18px 0 0;
  }

  .monoscape-ruler-row {
    display: flex;
    justify-content: center;
    /* left: 24px base + 20px RULER_THICKNESS to offset the vertical ruler column */
    padding: 0 24px 0 44px;
    border-bottom: 1px solid #d9dde6;
    background: #f6f8fb;
  }

  .monoscape-editor-body {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    /* flex-start lets editor-frame grow to its natural content height so the
       scroll container actually overflows and the scrollbar appears */
    align-items: flex-start;
    /* positioning context for the absolute vertical ruler */
    position: relative;
  }

  .monoscape-ruler-v-wrap {
    /* absolute overlay pinned to the document body; its height is set inline
       to the full document height so cursor-page changes don't affect the
       scroll container's overflow range */
    position: absolute;
    left: 0;
    z-index: 1;
    overflow: hidden;
    width: 20px;
    pointer-events: none;
  }

  .monoscape-ruler-v-current {
    position: absolute;
    left: 0;
    top: 0;
    overflow: hidden;
    background: #f6f8fb;
    border-right: 1px solid #d9dde6;
  }

  .monoscape-editor-frame {
    display: flex;
    justify-content: center;
    /* left padding = ruler width (20px) + original gap (24px) to leave
       room for the absolute-positioned vertical ruler */
    padding: 24px 24px 24px 44px;
    flex: 1;
  }

  .monoscape-editor-pages-wrap {
    position: relative;
    width: min(100%, 8.5in);
  }

  .monoscape-page-break-bar {
    position: absolute;
    left: 1px;
    right: 1px;
    /* height and background are set via inline style (margin-aware) */
    pointer-events: none;
    z-index: 2;
  }

  .monoscape-page-break-spacer {
    display: block;
    pointer-events: none;
    user-select: none;
  }

  .monoscape-editor {
    margin: 0 auto;
  }

  .monoscape-editor:empty::before {
    content: attr(data-placeholder);
    color: #7b869b;
  }

  /* Enter (insertParagraph) creates <div>/<p> block children; Shift+Enter
     (insertLineBreak) creates <br> within the current block. Add bottom margin
     to block-level paragraph containers so Enter-created paragraphs have
     visible spacing while <br> line-breaks do not. */
  .monoscape-editor p {
    margin-top: 0;
    margin-bottom: 0;
  }

  .monoscape-editor > div,
  .monoscape-editor > p {
    margin-bottom: 1em;
  }

  .monoscape-editor > div:last-child,
  .monoscape-editor > p:last-child {
    margin-bottom: 0;
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

  /* Visual indicator when an icon span is the "active" selection */
  [data-monoscape-icon-selected] {
    outline: 2px solid #005fcc;
    border-radius: 2px;
  }

  /* Images inserted by the user */
  img[data-monoscape-image] {
    max-width: 100%;
    vertical-align: bottom;
    cursor: default;
    -webkit-user-select: none;
    user-select: none;
  }

  /* Suppress browser default object-selection ring; the overlay provides its own */
  img[data-monoscape-image-selected] {
    outline: none;
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
      border-radius: 0 !important;
    }
  }
`;

export function buildEditorInlineStyle(
  fontStack: string,
  fontSize: number,
  lineSpacing: number,
  margins?: DocumentMargins
) {
  const m = margins ?? DEFAULT_DOCUMENT_MARGINS;
  return (
    `font-family:${fontStack};font-size:${fontSize}pt;line-height:${lineSpacing};text-align:left;` +
    `width:min(100%,8.5in);min-height:11in;` +
    `padding:${m.top}in ${m.right}in ${m.bottom}in ${m.left}in;` +
    "box-sizing:border-box;border:1px solid #d9dde6;border-radius:0;background-color:#fff;color:#172033;" +
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
