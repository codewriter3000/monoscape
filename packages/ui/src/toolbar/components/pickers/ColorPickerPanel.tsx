import { Show } from "solid-js";
import { ColorFormatInputs } from "../ColorFormatInputs";
import { ColorWheel } from "../ColorWheel";
import { ColorPyramid } from "../ColorPyramid";
import { ColorSquare } from "../ColorSquare";
import { SegmentedControl } from "../../../common/SegmentedControl";
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
  const previewLabelStyle = "font-size:0.75rem;font-weight:600;color:#52607a;margin-bottom:8px;";

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
      <div style="padding: 8px 8px 0; margin-bottom: 12px;">
        <SegmentedControl
          variant="chip"
          options={[
            { value: "rgba" as ColorModel, label: "RGBA" },
            { value: "hsl"  as ColorModel, label: "HSL" },
            { value: "hsv"  as ColorModel, label: "HSV" },
            { value: "hex"  as ColorModel, label: "HEX" },
          ]}
          value={props.model}
          onChange={props.onModelChange}
        />
      </div>

      {/* Picker mode switcher: Wheel / Pyramid / Square */}
      <div style="padding: 0 8px; margin-bottom: 12px;">
        <SegmentedControl
          options={[
            { value: "wheel"   as ColorPickerMode, label: "Wheel",   title: "Wheel" },
            { value: "pyramid" as ColorPickerMode, label: "Pyramid", title: "Pyramid" },
            { value: "input"   as ColorPickerMode, label: "Square",  title: "Square" },
          ]}
          value={props.pickerMode}
          onChange={props.onPickerModeChange}
        />
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
        <div style={previewLabelStyle}>Preview</div>
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
