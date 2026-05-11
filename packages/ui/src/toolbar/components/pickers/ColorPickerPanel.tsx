import { Show } from "solid-js";
import { ColorFormatInputs } from "../ColorFormatInputs";
import { ColorWheel } from "../ColorWheel";
import { ColorPyramid } from "../ColorPyramid";
import { ColorSquare } from "../ColorSquare";
import { modeButtonStyle, pickerModeButtonStyle } from "./colorPickerUtils";
import type { NormalizedColor, ColorModel, ColorPickerMode } from "@monoscape/document-core";

interface ColorPickerPanelProps {
  model: ColorModel;
  pickerMode: ColorPickerMode;
  currentColor: NormalizedColor;
  contrastRatio: number;
  meetsWCAGAA: boolean;
  swatchStyle: (color: NormalizedColor | null) => string;
  onModelChange: (model: ColorModel) => void;
  onPickerModeChange: (mode: ColorPickerMode) => void;
  onChange: (color: NormalizedColor) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  panelRef?: (el: HTMLDivElement) => void;
}

export function ColorPickerPanel(props: ColorPickerPanelProps) {
  return (
    <div
      role="dialog"
      aria-label="Color picker"
      id="monoscape-color-panel"
      ref={props.panelRef}
      data-color-picker-panel="true"
      data-color-picker-mode={props.pickerMode}
      class="toolbar__dropdown-panel" style="width: 320px; max-height: 480px;"
      onKeyDown={props.onKeyDown}
    >
      {/* Mode switcher: RGBA / HSL / HSV / HEX */}
      <div style="display: flex; gap: 4px; margin-bottom: 12px; padding: 8px 8px 0;">
        {(["rgba", "hsl", "hsv", "hex"] as ColorModel[]).map((m) => (
          <button type="button" style={modeButtonStyle(props.model === m)} onClick={() => props.onModelChange(m)}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Picker mode switcher: Wheel / Pyramid / Square */}
      <div style="display: flex; gap: 0; margin-bottom: 12px; padding: 0 8px;">
        <button
          type="button"
          data-picker-mode="wheel"
          style={pickerModeButtonStyle(props.pickerMode === "wheel") + "border-top-right-radius: 0; border-bottom-right-radius: 0;"}
          onClick={() => props.onPickerModeChange("wheel")}
        >
          Wheel
        </button>
        <button
          type="button"
          data-picker-mode="pyramid"
          style={pickerModeButtonStyle(props.pickerMode === "pyramid") + `border-radius: 0;${props.pickerMode !== "pyramid" ? " border-left: none;" : ""}`}
          onClick={() => props.onPickerModeChange("pyramid")}
        >
          Pyramid
        </button>
        <button
          type="button"
          data-picker-mode="input"
          style={pickerModeButtonStyle(props.pickerMode === "input") + `border-top-left-radius: 0; border-bottom-left-radius: 0;${props.pickerMode !== "input" ? " border-left: none;" : ""}`}
          onClick={() => props.onPickerModeChange("input")}
        >
          Square
        </button>
      </div>

      <div style="padding: 8px 8px 0;">
        <Show when={props.pickerMode === "wheel"}>
          <ColorWheel color={props.currentColor} onChange={props.onChange} />
        </Show>
        <Show when={props.pickerMode === "pyramid"}>
          <ColorPyramid color={props.currentColor} onChange={props.onChange} />
        </Show>
        <Show when={props.pickerMode === "input"}>
          <ColorSquare color={props.currentColor} onChange={props.onChange} />
        </Show>
      </div>

      {/* Format inputs — always visible so model tabs always take effect */}
      <ColorFormatInputs color={props.currentColor} model={props.model} onChange={props.onChange} />

      {/* Current color preview with transparency pattern */}
      <div style="padding: 8px; margin-top: 8px; border-top: 1px solid #e5e8ed;">
        <div style={TOOLBAR_STYLES.label}>Preview</div>
        <div
          style={`
            width: 100%;
            height: 48px;
            border-radius: 6px;
            border: 1px solid #c3cad8;
            ${props.swatchStyle(props.currentColor)}
          `}
        />
      </div>

      {/* Contrast warning */}
      <Show when={!props.meetsWCAGAA}>
        <div style="padding: 8px; margin-top: 8px; border-top: 1px solid #e5e8ed;">
          <div style="padding: 8px; background: #fff5e6; border: 1px solid #ffcc80; border-radius: 4px; font-size: 0.75rem; color: #8a5a00;">
            <strong>⚠ Contrast Warning:</strong> This color has a contrast ratio of{" "}
            {props.contrastRatio.toFixed(2)}:1 on white. WCAG AA requires 4.5:1 for text.
          </div>
        </div>
      </Show>
    </div>
  );
}
