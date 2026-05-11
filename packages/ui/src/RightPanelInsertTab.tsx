import { createSignal } from "solid-js";
import {
  TABLE_ROWS,
  TABLE_COLS,
  SECTION_TITLE,
  SHAPES,
  fieldInput,
  outlineActionButton,
  Divider,
  SectionWrap
} from "./rightPanelHelpers";

export function RightPanelInsertTab() {
  const [hoverCell, setHoverCell] = createSignal<{ r: number; c: number } | null>(null);
  const [imageUrl, setImageUrl] = createSignal("");

  const hoverR = () => hoverCell()?.r ?? 0;
  const hoverC = () => hoverCell()?.c ?? 0;

  return (
    <>
      {/* Table picker */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Table</p>
        <div
          style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; margin-bottom: 6px;"
          onMouseLeave={() => setHoverCell(null)}
        >
          {Array.from({ length: TABLE_ROWS }, (_, r) =>
            Array.from({ length: TABLE_COLS }, (_, c) => {
              const highlighted = () => r < hoverR() && c < hoverC();
              return (
                <div
                  style={`height: 20px; border: 1px solid ${highlighted() ? "#005fcc" : "#c3cad8"}; background: ${highlighted() ? "#dce8ff" : "#f7f9fc"}; border-radius: 2px; cursor: pointer; box-sizing: border-box;`}
                  onMouseEnter={() => setHoverCell({ r: r + 1, c: c + 1 })}
                  onClick={() => {
                    const cell = hoverCell();
                    if (cell) console.log(`Insert table ${cell.r}×${cell.c}`);
                  }}
                />
              );
            })
          )}
        </div>
        <p style="font-size: 0.7rem; color: #52607a; margin: 0 0 8px;">
          {hoverCell()
            ? `${hoverCell()!.r} × ${hoverCell()!.c} table`
            : "Hover to preview size"}
        </p>
        <button type="button" style={outlineActionButton()}>
          Custom table size…
        </button>
      </SectionWrap>

      <Divider />

      {/* Image */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Image</p>
        <button type="button" style={`${outlineActionButton()} margin-bottom: 6px;`}>
          📁  From file…
        </button>
        <div style="display: flex; gap: 6px; align-items: center;">
          <input
            type="url"
            placeholder="Paste image URL…"
            value={imageUrl()}
            style={fieldInput()}
            onInput={(e) => setImageUrl(e.currentTarget.value)}
          />
          <button
            type="button"
            style="padding: 5px 10px; border: 1px solid #c3cad8; border-radius: 5px; background: #f7f9fc; color: #172033; font-size: 0.75rem; cursor: pointer; outline: none; white-space: nowrap; font-family: inherit;"
            onClick={() => { if (imageUrl()) console.log(`Insert image: ${imageUrl()}`); }}
          >
            Insert
          </button>
        </div>
      </SectionWrap>

      <Divider />

      {/* Shapes */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Shape</p>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
          {SHAPES.map((s) => (
            <button
              type="button"
              title={s.label}
              style="padding: 7px 0; border: 1px solid #c3cad8; border-radius: 5px; background: #f7f9fc; color: #172033; font-size: 1rem; cursor: pointer; outline: none; text-align: center;"
              onClick={() => console.log(`Insert shape: ${s.label}`)}
            >
              {s.icon}
            </button>
          ))}
        </div>
      </SectionWrap>
    </>
  );
}
