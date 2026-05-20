import { createSignal, createMemo, Show, For } from "solid-js";
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
import { IconPickerModal } from "./IconPickerModal";
import { getRecentIcons, type RecentIcon } from "./recentIconsStore";

export interface RightPanelInsertTabProps {
  onInsertSvg?: (svg: string, name: string) => void;
  onInsertImageFromFile?: () => void;
  onInsertImageFromUrl?: (url: string) => void;
}

export function RightPanelInsertTab(props: RightPanelInsertTabProps) {
  const [hoverCell, setHoverCell] = createSignal<{ r: number; c: number } | null>(null);
  const [imageUrl, setImageUrl] = createSignal("");
  const [iconPickerOpen, setIconPickerOpen] = createSignal(false);
  // Reactive recent icons — refreshed every time the panel re-renders after an insert
  const [recentIcons, setRecentIcons] = createSignal<RecentIcon[]>(getRecentIcons());

  const hoverR = () => hoverCell()?.r ?? 0;
  const hoverC = () => hoverCell()?.c ?? 0;

  function handleInsertIcon(svg: string, name: string) {
    props.onInsertSvg?.(svg, name);
    // Refresh recent icons list in the sidebar
    setRecentIcons(getRecentIcons());
    setIconPickerOpen(false);
  }

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
        <button type="button" style={`${outlineActionButton()} margin-bottom: 6px;`}
          onClick={() => props.onInsertImageFromFile?.()}
        >
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
            onClick={() => {
              const url = imageUrl().trim();
              if (url) {
                props.onInsertImageFromUrl?.(url);
                setImageUrl("");
              }
            }}
          >
            Insert
          </button>
        </div>
      </SectionWrap>

      <Divider />

      {/* Icon */}
      <SectionWrap>
        <p style={SECTION_TITLE}>Icon</p>

        {/* Recently used icons */}
        <Show when={recentIcons().length > 0}>
          {/* Force SVGs inside these buttons to fill the 20px wrapper */}
          <style>{`.mnsc-recent-icon-btn > span > svg { width: 100%; height: 100%; display: block; }`}</style>
          <p style="font-size: 0.68rem; color: #8896ae; margin: 0 0 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
            Recent
          </p>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 10px;">
            <For each={recentIcons().slice(0, 12)}>
              {(icon) => (
                <button
                  type="button"
                  class="mnsc-recent-icon-btn"
                  title={icon.name}
                  onClick={() => handleInsertIcon(icon.svg, icon.name)}
                  style="padding: 7px 0; border: 1px solid #c3cad8; border-radius: 5px; background: #f7f9fc; color: #172033; cursor: pointer; outline: none; display: flex; align-items: center; justify-content: center;"
                >
                  <span
                    style="display: block; width: 20px; height: 20px; flex-shrink: 0; pointer-events: none;"
                    // eslint-disable-next-line solid/no-innerhtml
                    innerHTML={icon.svg}
                  />
                </button>
              )}
            </For>
          </div>
        </Show>

        <button
          type="button"
          style={outlineActionButton()}
          onClick={() => setIconPickerOpen(true)}
        >
          🔍  Browse icons…
        </button>
        <p style="font-size: 0.68rem; color: #8896ae; margin: 6px 0 0; line-height: 1.4;">
          2,670+ IBM Carbon icons. Upload your own SVGs too.
        </p>
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

      {/* Icon picker modal */}
      <Show when={iconPickerOpen()}>
        <IconPickerModal
          onClose={() => setIconPickerOpen(false)}
          onInsert={handleInsertIcon}
        />
      </Show>
    </>
  );
}
