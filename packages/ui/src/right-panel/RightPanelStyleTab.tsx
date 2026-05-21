import { createSignal } from "solid-js";
import {
  SECTION_TITLE,
  FIELD_LABEL,
  PARA_STYLES,
  HIGHLIGHT_COLORS,
  styleChip,
  compactNumInput,
  Divider,
  SectionWrap,
  type TextCaseMode,
  type UnderlineStyle,
  type BaselineMode
} from "./rightPanelHelpers";
import { SegmentedControl } from "../common/SegmentedControl";

export function RightPanelStyleTab() {
  const [paraStyle, setParaStyle] = createSignal("normal");
  const [textCase, setTextCase] = createSignal<TextCaseMode>("none");
  const [underline, setUnderline] = createSignal<UnderlineStyle>("none");
  const [baseline, setBaseline] = createSignal<BaselineMode>("normal");
  const [letterSpacing, setLetterSpacing] = createSignal("0");
  const [wordSpacing, setWordSpacing] = createSignal("0");

  return (
    <>
      {/* Paragraph styles */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Paragraph Style</p>
        <div style="display: flex; flex-direction: column; gap: 3px;">
          {PARA_STYLES.map((ps) => (
            <button
              type="button"
              style={styleChip(paraStyle() === ps.id)}
              onClick={() => { setParaStyle(ps.id); console.log(`Apply style: ${ps.id}`); }}
            >
              {ps.label}
            </button>
          ))}
        </div>
      </SectionWrap>

      <Divider />

      {/* Text case */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Text Case</p>
        <SegmentedControl
          options={[
            { value: "none" as TextCaseMode,       label: "Aa", title: "As typed" },
            { value: "uppercase" as TextCaseMode,   label: "AA", title: "Uppercase" },
            { value: "lowercase" as TextCaseMode,   label: "aa", title: "Lowercase" },
            { value: "capitalize" as TextCaseMode,  label: "Tt", title: "Capitalize" },
          ]}
          value={textCase()}
          onChange={setTextCase}
        />
      </SectionWrap>

      {/* Underline style */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Underline Style</p>
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
          {(["none", "solid", "double", "wavy", "dotted", "dashed"] as UnderlineStyle[]).map((u) => {
            const labels: Record<UnderlineStyle, string> = { none: "None", solid: "Solid", double: "Double", wavy: "Wavy", dotted: "Dotted", dashed: "Dashed" };
            return (
              <button
                type="button"
                style={`padding: 4px 8px; border: 1px solid ${underline() === u ? "#005fcc" : "#c3cad8"}; border-radius: 4px; background: ${underline() === u ? "#dce8ff" : "#f7f9fc"}; color: ${underline() === u ? "#005fcc" : "#172033"}; font-size: 0.7rem; font-weight: ${underline() === u ? 600 : 400}; cursor: pointer; outline: none; font-family: inherit;`}
                onClick={() => setUnderline(u)}
              >
                {labels[u]}
              </button>
            );
          })}
        </div>
      </SectionWrap>

      {/* Baseline */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Baseline</p>
        <SegmentedControl
          options={[
            { value: "normal" as BaselineMode, label: "Baseline", title: "Normal" },
            { value: "super"  as BaselineMode, label: "Xⁿ",       title: "Superscript" },
            { value: "sub"    as BaselineMode, label: "Xₙ",        title: "Subscript" },
          ]}
          value={baseline()}
          onChange={setBaseline}
        />
      </SectionWrap>

      <Divider />

      {/* Character spacing */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Character Spacing</p>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style={FIELD_LABEL}>Letter spacing (em)</span>
              <input
                type="number" min="-0.2" max="2" step="0.01"
                value={letterSpacing()}
                style={compactNumInput()}
                onInput={(e) => setLetterSpacing(e.currentTarget.value)}
              />
            </div>
            <input
              type="range" min="-0.2" max="2" step="0.01"
              value={letterSpacing()}
              style="width: 100%; accent-color: #005fcc;"
              onInput={(e) => setLetterSpacing(e.currentTarget.value)}
            />
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style={FIELD_LABEL}>Word spacing (em)</span>
              <input
                type="number" min="-0.1" max="2" step="0.01"
                value={wordSpacing()}
                style={compactNumInput()}
                onInput={(e) => setWordSpacing(e.currentTarget.value)}
              />
            </div>
            <input
              type="range" min="-0.1" max="2" step="0.01"
              value={wordSpacing()}
              style="width: 100%; accent-color: #005fcc;"
              onInput={(e) => setWordSpacing(e.currentTarget.value)}
            />
          </div>
        </div>
      </SectionWrap>

      <Divider />

      {/* Highlight */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Highlight Color</p>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              type="button" title={c}
              style={`width: 26px; height: 26px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.15); background: ${c}; cursor: pointer; outline: none; flex-shrink: 0;`}
              onClick={() => console.log(`Highlight: ${c}`)}
            />
          ))}
          <button
            type="button" title="Remove highlight"
            style="width: 26px; height: 26px; border-radius: 4px; border: 1px solid #c3cad8; background: #f7f9fc; cursor: pointer; outline: none; font-size: 0.65rem; color: #52607a;"
            onClick={() => console.log("Remove highlight")}
          >
            ✕
          </button>
        </div>
      </SectionWrap>
    </>
  );
}
