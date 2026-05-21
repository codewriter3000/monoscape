// Right-panel section for configuring the selected list (bullets or numbered)

import { createSignal, Show } from "solid-js";
import {
  SECTION_TITLE,
  FIELD_LABEL,
  compactNumInput,
  SectionWrap,
} from "./rightPanelHelpers";
import { SegmentedControl } from "../common/SegmentedControl";
import { IconPickerModal } from "./IconPickerModal";
import type { ListState, ListType, BulletStyle, NumberStyle } from "../editor/hooks/useListFormatting";

export interface RightPanelListSectionProps {
  listState?: ListState;
  onToggleUnordered?: () => void;
  onToggleOrdered?: () => void;
  onSetBulletStyle?: (style: BulletStyle) => void;
  onSetNumberStyle?: (style: NumberStyle) => void;
  onSetStartNumber?: (n: number) => void;
  onSetCustomIconBullet?: (svg: string) => void;
  onRemoveCustomIconBullet?: () => void;
}

const BULLET_PRESETS: Array<{ id: BulletStyle; label: string; preview: string }> = [
  { id: "disc",   label: "Disc",   preview: "●" },
  { id: "circle", label: "Circle", preview: "○" },
  { id: "square", label: "Square", preview: "■" },
  { id: "custom-icon", label: "Icon…", preview: "✦" },
];

const NUMBER_PRESETS: Array<{ id: NumberStyle; label: string; preview: string }> = [
  { id: "decimal",     label: "1, 2, 3",    preview: "1." },
  { id: "lower-alpha", label: "a, b, c",    preview: "a." },
  { id: "upper-alpha", label: "A, B, C",    preview: "A." },
  { id: "lower-roman", label: "i, ii, iii", preview: "i." },
  { id: "upper-roman", label: "I, II, III", preview: "I." },
];

function presetChip(active: boolean): string {
  return (
    `display: flex; flex-direction: column; align-items: center; justify-content: center;` +
    ` width: 48px; height: 48px; border: 1.5px solid ${active ? "#005fcc" : "#c3cad8"};` +
    ` border-radius: 7px; background: ${active ? "#dce8ff" : "#f7f9fc"};` +
    ` color: ${active ? "#005fcc" : "#172033"}; cursor: pointer; outline: none;` +
    ` font-family: inherit; gap: 3px;`
  );
}

function previewLabel(): string {
  return "font-size: 1rem; line-height: 1;";
}

function presetCaption(): string {
  return "font-size: 0.58rem; color: inherit; line-height: 1; text-align: center;";
}

export function RightPanelListSection(props: RightPanelListSectionProps) {
  const [iconPickerOpen, setIconPickerOpen] = createSignal(false);
  const [startNumberDraft, setStartNumberDraft] = createSignal(
    String(props.listState?.startNumber ?? 1)
  );

  const currentType = (): ListType => props.listState?.listType ?? "none";
  const currentBullet = (): BulletStyle => props.listState?.bulletStyle ?? "disc";
  const currentNumber = (): NumberStyle => props.listState?.numberStyle ?? "decimal";

  function handleTypeSegment(type: "ul" | "ol") {
    const current = currentType();
    if (type === "ul") {
      // If already ul, toggle off; if ol or none, turn on ul
      props.onToggleUnordered?.();
    } else {
      props.onToggleOrdered?.();
    }
  }

  function handleBulletPreset(id: BulletStyle) {
    if (id === "custom-icon") {
      setIconPickerOpen(true);
    } else {
      props.onRemoveCustomIconBullet?.();
      props.onSetBulletStyle?.(id);
    }
  }

  function handleIconPicked(svg: string, _name: string) {
    props.onSetCustomIconBullet?.(svg);
    setIconPickerOpen(false);
  }

  function handleStartNumberCommit(val: string) {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1) {
      props.onSetStartNumber?.(n);
    }
  }

  return (
    <>
      <SectionWrap>
        <p style={SECTION_TITLE}>List</p>

        {/* List type switcher */}
        <div style="margin-bottom: 10px;">
          <span style={FIELD_LABEL}>Type</span>
          <SegmentedControl
            options={[
              { value: "none" as ListType, label: "None",      title: "No list" },
              { value: "ul"   as ListType, label: "● Bullets", title: "Bullet list" },
              { value: "ol"   as ListType, label: "1. Numbers",title: "Numbered list" },
            ]}
            value={currentType()}
            onChange={(type) => {
              if (type === currentType()) return;
              if (type === "none") {
                if (currentType() === "ul") props.onToggleUnordered?.();
                else if (currentType() === "ol") props.onToggleOrdered?.();
              } else if (type === "ul") {
                handleTypeSegment("ul");
              } else {
                handleTypeSegment("ol");
              }
            }}
          />
        </div>

        {/* Bullet style presets — shown when type is ul */}
        <Show when={currentType() === "ul"}>
          <div style="margin-bottom: 10px;">
            <span style={FIELD_LABEL}>Bullet style</span>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
              {BULLET_PRESETS.map((p) => (
                <button
                  type="button"
                  style={presetChip(currentBullet() === p.id)}
                  title={p.label}
                  onClick={() => handleBulletPreset(p.id)}
                >
                  <span style={previewLabel()}>{p.preview}</span>
                  <span style={presetCaption()}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom icon display when active */}
          <Show when={currentBullet() === "custom-icon" && props.listState?.customIconDataUrl}>
            <div style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #f7f9fc; border: 1px solid #c3cad8; border-radius: 6px; margin-bottom: 8px;">
              <span style="font-size: 0.7rem; color: #52607a; flex: 1;">Custom icon active</span>
              <button
                type="button"
                style="padding: 2px 8px; border: 1px solid #c3cad8; border-radius: 4px; background: #fff; color: #172033; font-size: 0.68rem; cursor: pointer; outline: none; font-family: inherit;"
                onClick={() => setIconPickerOpen(true)}
              >
                Change
              </button>
              <button
                type="button"
                style="padding: 2px 8px; border: 1px solid #e4313b; border-radius: 4px; background: #fff; color: #e4313b; font-size: 0.68rem; cursor: pointer; outline: none; font-family: inherit;"
                onClick={props.onRemoveCustomIconBullet}
              >
                Remove
              </button>
            </div>
          </Show>
        </Show>

        {/* Number style presets — shown when type is ol */}
        <Show when={currentType() === "ol"}>
          <div style="margin-bottom: 10px;">
            <span style={FIELD_LABEL}>Number format</span>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
              {NUMBER_PRESETS.map((p) => (
                <button
                  type="button"
                  style={presetChip(currentNumber() === p.id)}
                  title={p.label}
                  onClick={() => props.onSetNumberStyle?.(p.id)}
                >
                  <span style={previewLabel()}>{p.preview}</span>
                  <span style={presetCaption()}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Start number */}
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style={FIELD_LABEL}>Start at</span>
              <input
                type="number"
                min="1"
                max="9999"
                step="1"
                value={startNumberDraft()}
                style={compactNumInput()}
                onInput={(e) => setStartNumberDraft(e.currentTarget.value)}
                onChange={(e) => handleStartNumberCommit(e.currentTarget.value)}
              />
            </div>
          </div>
        </Show>

        {/* Empty state hint */}
        <Show when={currentType() === "none"}>
          <p style="font-size: 0.72rem; color: #7b869b; margin: 4px 0 0; line-height: 1.4;">
            Place the cursor in a paragraph and select Bullets or Numbers above to create a list.
          </p>
        </Show>
      </SectionWrap>

      <Show when={iconPickerOpen()}>
        <IconPickerModal
          onClose={() => setIconPickerOpen(false)}
          onInsert={handleIconPicked}
        />
      </Show>
    </>
  );
}
