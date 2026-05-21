import { createMemo, createSignal } from "solid-js";
import {
  SECTION_TITLE,
  FIELD_LABEL,
  BREAK_TYPES,
  fieldInput,
  compactNumInput,
  Divider,
  SectionWrap,
  type PageOrientation,
  type PaperSize,
  type MarginPreset,
  type ColumnCount,
  type LineNumberMode,
  type HyphenationMode
} from "./rightPanelHelpers";
import { SegmentedControl } from "../common/SegmentedControl";
import { DEFAULT_DOCUMENT_MARGINS, type DocumentMargins } from "../editor/constants";

export interface RightPanelLayoutTabProps {
  margins?: DocumentMargins;
  onMarginsChange?: (margins: DocumentMargins) => void;
  /** Current line-spacing value from the editor selection (drives the input). */
  lineSpacing?: number | null;
  onLineSpacingChange?: (v: number) => void;
  onParagraphIndentChange?: (left: number, right: number, firstLine: number, hanging: number) => void;
  onParagraphSpacingChange?: (before: number, after: number) => void;
}

export function RightPanelLayoutTab(props: RightPanelLayoutTabProps) {
  const [orientation, setOrientation] = createSignal<PageOrientation>("portrait");
  const [paperSize, setPaperSize] = createSignal<PaperSize>("letter");
  const [columns, setColumns] = createSignal<ColumnCount>(1);
  const [lineNumbers, setLineNumbers] = createSignal<LineNumberMode>("none");
  const [hyphenation, setHyphenation] = createSignal<HyphenationMode>("none");
  const [indentLeft, setIndentLeft] = createSignal("0");
  const [indentRight, setIndentRight] = createSignal("0");
  const [indentFirst, setIndentFirst] = createSignal("0");
  const [indentHanging, setIndentHanging] = createSignal("0");
  const [spacingBefore, setSpacingBefore] = createSignal("0");
  const [spacingAfter, setSpacingAfter] = createSignal("10");
  // lineSpacingInput is the local UI value; props.lineSpacing drives it when set
  const [lineSpacingInput, setLineSpacingInput] = createSignal("1.15");
  const lineSpacingDisplayed = () =>
    props.lineSpacing != null ? String(props.lineSpacing) : lineSpacingInput();
  const [lineSpacingRule, setLineSpacingRule] = createSignal<"multiple" | "exact" | "atleast">("multiple");

  // Helpers that apply indentation and re-read values from local signals
  const fireIndent = (l = indentLeft(), r = indentRight(), f = indentFirst(), h = indentHanging()) => {
    const lv = parseFloat(l), rv = parseFloat(r), fv = parseFloat(f), hv = parseFloat(h);
    if ([lv, rv, fv, hv].every(Number.isFinite)) {
      props.onParagraphIndentChange?.(lv, rv, fv, hv);
    }
  };

  const fireSpacing = (b = spacingBefore(), a = spacingAfter()) => {
    const bv = parseFloat(b), av = parseFloat(a);
    if (Number.isFinite(bv) && Number.isFinite(av)) {
      props.onParagraphSpacingChange?.(bv, av);
    }
  };

  // Derive active margins, falling back to defaults when no props are provided
  const currentMargins = () => props.margins ?? DEFAULT_DOCUMENT_MARGINS;
  const marginTop    = () => String(currentMargins().top);
  const marginBottom = () => String(currentMargins().bottom);
  const marginLeft   = () => String(currentMargins().left);
  const marginRight  = () => String(currentMargins().right);

  // Derive the active preset from the current margin values
  const marginPreset = createMemo<MarginPreset>(() => {
    const m = currentMargins();
    if (m.top === 1.0 && m.bottom === 1.0 && m.left === 1.25 && m.right === 1.25) return "normal";
    if (m.top === 0.5 && m.bottom === 0.5 && m.left === 0.5  && m.right === 0.5)  return "narrow";
    if (m.top === 1.0 && m.bottom === 1.0 && m.left === 2.0  && m.right === 2.0)  return "wide";
    return "custom";
  });

  function applyMarginPreset(p: MarginPreset) {
    if (p === "normal")  props.onMarginsChange?.({ top: 1.0, bottom: 1.0, left: 1.25, right: 1.25 });
    else if (p === "narrow") props.onMarginsChange?.({ top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 });
    else if (p === "wide")   props.onMarginsChange?.({ top: 1.0, bottom: 1.0, left: 2.0, right: 2.0 });
    // "custom" is only reached via individual inputs
  }

  function setMargin(side: keyof DocumentMargins, raw: string) {
    const n = parseFloat(raw);
    if (!isNaN(n) && n >= 0) {
      props.onMarginsChange?.({ ...currentMargins(), [side]: n });
    }
  }

  return (
    <>
      {/* Page setup */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Page</p>
        <div style="margin-bottom: 8px;">
          <span style={FIELD_LABEL}>Orientation</span>
          <SegmentedControl
            options={[
              { value: "portrait"  as PageOrientation, label: "▯ Portrait" },
              { value: "landscape" as PageOrientation, label: "▭ Landscape" },
            ]}
            value={orientation()}
            onChange={setOrientation}
          />
        </div>
        <div>
          <span style={FIELD_LABEL}>Paper size</span>
          <select value={paperSize()} style={fieldInput()} onChange={(e) => setPaperSize(e.currentTarget.value as PaperSize)}>
            <option value="letter">Letter — 8.5 × 11 in</option>
            <option value="a4">A4 — 210 × 297 mm</option>
            <option value="legal">Legal — 8.5 × 14 in</option>
            <option value="a3">A3 — 297 × 420 mm</option>
            <option value="a5">A5 — 148 × 210 mm</option>
            <option value="tabloid">Tabloid — 11 × 17 in</option>
          </select>
        </div>
      </SectionWrap>

      <Divider />

      {/* Margins */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Margins (in)</p>
        <div style="display: flex; gap: 4px; margin-bottom: 10px;">
          {(["normal", "narrow", "wide", "custom"] as MarginPreset[]).map((p) => (
            <button
              type="button"
              style={`flex: 1; padding: 4px 0; border: 1px solid ${marginPreset() === p ? "#005fcc" : "#c3cad8"}; border-radius: 5px; background: ${marginPreset() === p ? "#dce8ff" : "#f7f9fc"}; color: ${marginPreset() === p ? "#005fcc" : "#172033"}; font-size: 0.68rem; font-weight: ${marginPreset() === p ? 600 : 400}; cursor: pointer; outline: none; text-transform: capitalize; font-family: inherit;`}
              onClick={() => applyMarginPreset(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          {(
            [
              { label: "Top",    side: "top"    as keyof DocumentMargins, val: marginTop    },
              { label: "Bottom", side: "bottom" as keyof DocumentMargins, val: marginBottom },
              { label: "Left",   side: "left"   as keyof DocumentMargins, val: marginLeft   },
              { label: "Right",  side: "right"  as keyof DocumentMargins, val: marginRight  },
            ] as const
          ).map(({ label, side, val }) => (
            <label style={FIELD_LABEL}>
              {label}
              <input
                type="number" min="0" max="4" step="0.05"
                value={val()}
                style={`${fieldInput()} margin-top: 2px;`}
                onInput={(e) => setMargin(side, e.currentTarget.value)}
              />
            </label>
          ))}
        </div>
      </SectionWrap>

      <Divider />

      {/* Columns */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Columns</p>
        <SegmentedControl
          options={[
            { value: 1 as ColumnCount, label: "⬜ One" },
            { value: 2 as ColumnCount, label: "⬜⬜ Two" },
            { value: 3 as ColumnCount, label: "⬜⬜⬜ Three" },
          ]}
          value={columns()}
          onChange={setColumns}
        />
      </SectionWrap>

      {/* Breaks */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Breaks</p>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          {BREAK_TYPES.map((b) => (
            <button type="button" style="padding: 5px 10px; border: 1px solid #c3cad8; border-radius: 5px; background: #f7f9fc; color: #172033; font-size: 0.75rem; cursor: pointer; outline: none; text-align: left; font-family: inherit; width: 100%;" onClick={() => console.log(`Insert break: ${b.key}`)}>
              {b.label}
            </button>
          ))}
        </div>
      </SectionWrap>

      <Divider />

      {/* Line numbers */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Line Numbers</p>
        <SegmentedControl
          options={[
            { value: "none"       as LineNumberMode, label: "None" },
            { value: "continuous" as LineNumberMode, label: "Continuous" },
            { value: "perPage"    as LineNumberMode, label: "Per page" },
          ]}
          value={lineNumbers()}
          onChange={setLineNumbers}
        />
      </SectionWrap>

      {/* Hyphenation */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Hyphenation</p>
        <SegmentedControl
          options={[
            { value: "none"   as HyphenationMode, label: "None" },
            { value: "auto"   as HyphenationMode, label: "Auto" },
            { value: "manual" as HyphenationMode, label: "Manual" },
          ]}
          value={hyphenation()}
          onChange={setHyphenation}
        />
      </SectionWrap>

      <Divider />

      {/* Indentation */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Indentation (in)</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px;">
          <label style={FIELD_LABEL}>Left<input type="number" min="0" max="4" step="0.05" value={indentLeft()} style={`${fieldInput()} margin-top: 2px;`} onInput={(e) => { setIndentLeft(e.currentTarget.value); fireIndent(e.currentTarget.value); }} /></label>
          <label style={FIELD_LABEL}>Right<input type="number" min="0" max="4" step="0.05" value={indentRight()} style={`${fieldInput()} margin-top: 2px;`} onInput={(e) => { setIndentRight(e.currentTarget.value); fireIndent(undefined, e.currentTarget.value); }} /></label>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          <label style={FIELD_LABEL}>First line<input type="number" min="-2" max="4" step="0.05" value={indentFirst()} style={`${fieldInput()} margin-top: 2px;`} onInput={(e) => { setIndentFirst(e.currentTarget.value); fireIndent(undefined, undefined, e.currentTarget.value); }} /></label>
          <label style={FIELD_LABEL}>Hanging<input type="number" min="0" max="4" step="0.05" value={indentHanging()} style={`${fieldInput()} margin-top: 2px;`} onInput={(e) => { setIndentHanging(e.currentTarget.value); fireIndent(undefined, undefined, undefined, e.currentTarget.value); }} /></label>
        </div>
      </SectionWrap>

      <Divider />

      {/* Paragraph spacing */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Paragraph Spacing</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px;">
          <label style={FIELD_LABEL}>Before (pt)<input type="number" min="0" max="144" step="1" value={spacingBefore()} style={`${fieldInput()} margin-top: 2px;`} onInput={(e) => { setSpacingBefore(e.currentTarget.value); fireSpacing(e.currentTarget.value); }} /></label>
          <label style={FIELD_LABEL}>After (pt)<input type="number" min="0" max="144" step="1" value={spacingAfter()} style={`${fieldInput()} margin-top: 2px;`} onInput={(e) => { setSpacingAfter(e.currentTarget.value); fireSpacing(undefined, e.currentTarget.value); }} /></label>
        </div>
        <div>
          <span style={FIELD_LABEL}>Line spacing rule</span>
          <select value={lineSpacingRule()} style={`${fieldInput()} margin-bottom: 6px;`} onChange={(e) => setLineSpacingRule(e.currentTarget.value as "multiple" | "exact" | "atleast")}>
            <option value="multiple">Multiple</option>
            <option value="exact">Exactly</option>
            <option value="atleast">At least</option>
          </select>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style={FIELD_LABEL}>{lineSpacingRule() === "multiple" ? "Multiplier" : "Value (pt)"}</span>
            <input
              type="number"
              min={lineSpacingRule() === "multiple" ? "0.5" : "1"}
              max={lineSpacingRule() === "multiple" ? "5" : "288"}
              step={lineSpacingRule() === "multiple" ? "0.05" : "1"}
              value={lineSpacingDisplayed()}
              style={compactNumInput()}
              onInput={(e) => {
                setLineSpacingInput(e.currentTarget.value);
                const n = parseFloat(e.currentTarget.value);
                if (Number.isFinite(n) && n > 0) props.onLineSpacingChange?.(n);
              }}
            />
          </div>
        </div>
      </SectionWrap>
    </>
  );
}
