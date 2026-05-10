import { Show, createEffect, createSignal, type JSX } from "solid-js";
import { TOOLBAR_STYLES } from "../styles";
import { ColorFormatInputs } from "./ColorFormatInputs";
import { ColorPickerVisual } from "./ColorPickerVisual";
import { normalizeToolbarColor } from "./colorUtils";
import { normalizeColor, getContrastRatio, formatColorForCss, type NormalizedColor, type ColorModel, type ColorPickerMode } from "@monoscape/document-core";
interface ColorPickerDropdownProps {
  value: NormalizedColor | null;
  isOpen: boolean;
  onChange: (color: NormalizedColor | null) => void;
  onOpenChange: (open: boolean) => void;
  onNavigateOut?: (direction: "next" | "prev") => void;
  renderKeytip?: () => JSX.Element;
  containerRef?: (el: HTMLDivElement) => void;
  triggerRef?: (el: HTMLButtonElement | undefined) => void;
}

export function ColorPickerDropdown(props: ColorPickerDropdownProps) {
  const [model, setModel] = createSignal<ColorModel>("rgba");
  const [pickerMode, setPickerMode] = createSignal<ColorPickerMode>("input");
  let triggerRef: HTMLButtonElement | undefined;
  let panelRef: HTMLDivElement | undefined;
  const defaultColor = normalizeColor({ r: 0, g: 0, b: 0, a: 1 })!;
  const currentColor = () => normalizeToolbarColor(props.value) ?? defaultColor;

  const backgroundColor = { r: 255, g: 255, b: 255, a: 1 };
  const contrastRatio = () => getContrastRatio(currentColor().rgba, backgroundColor);
  const meetsWCAGAA = () => contrastRatio() >= 4.5;

  function handleTriggerKeyDown(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      props.onNavigateOut?.(event.shiftKey ? "prev" : "next");
      return;
    }

    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      props.onOpenChange(!props.isOpen);
      return;
    }

    if (event.key === "Escape" && props.isOpen) {
      event.preventDefault();
      props.onOpenChange(false);
    }
  }

  function handlePanelKeyDown(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      props.onOpenChange(false);
      props.onNavigateOut?.(event.shiftKey ? "prev" : "next");
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      props.onOpenChange(false);
      triggerRef?.focus();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      props.onOpenChange(false);
      triggerRef?.focus();
    }
  }

  function handleColorChange(color: NormalizedColor) {
    props.onChange(color);
  }

  function selectMode(newMode: ColorModel) {
    setModel(newMode);
  }

  function selectPickerMode(mode: ColorPickerMode) {
    setPickerMode(mode);
  }

  const triggerStyle = `
    ${TOOLBAR_STYLES.compactTrigger}
    width: 100px;
    justify-content: space-between;
  `;

  const swatchStyle = (color: NormalizedColor | null) => {
    const normalized = normalizeToolbarColor(color);
    return `
    width: 20px;
    height: 20px;
    border-radius: 3px;
    border: 1px solid #c3cad8;
    background: ${normalized ? formatColorForCss(normalized) : "transparent"};
    ${normalized && normalized.rgba.a < 1 ? "background-image: linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%); background-size: 8px 8px; background-position: 0 0, 4px 4px;" : ""}
  `;
  };

  const modeButtonStyle = (active: boolean) => `
    padding: 4px 8px;
    border: 1px solid ${active ? "#005fcc" : "#c3cad8"};
    background: ${active ? "#dce8ff" : "#ffffff"};
    color: ${active ? "#005fcc" : "#172033"};
    font-size: 0.75rem;
    font-weight: ${active ? "600" : "400"};
    cursor: pointer;
    border-radius: 4px;
    outline: none;
  `;

  const pickerModeButtonStyle = (active: boolean) => `
    padding: 6px 12px;
    border: 1px solid ${active ? "#005fcc" : "#c3cad8"};
    background: ${active ? "#dce8ff" : "#ffffff"};
    color: ${active ? "#005fcc" : "#172033"};
    font-size: 0.75rem;
    font-weight: ${active ? "600" : "400"};
    cursor: pointer;
    outline: none;
  `;

  createEffect(() => {
    if (props.isOpen) {
      queueMicrotask(() => panelRef?.querySelector<HTMLElement>("input, [tabindex='0']")?.focus());
    }
  });

  return (
    <div ref={props.containerRef} style="position: relative; display: inline-flex;">
      <button
        ref={(el) => {
          triggerRef = el;
          props.triggerRef?.(el);
        }}
        aria-label="Font color"
        aria-controls="monoscape-color-panel"
        aria-expanded={props.isOpen}
        tabIndex={-1}
        style={triggerStyle}
        onClick={() => props.onOpenChange(!props.isOpen)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span style="font-size: 0.875rem;">Color</span>
        <div style={swatchStyle(normalizeToolbarColor(props.value))} />
        {props.renderKeytip?.()}
      </button>

      <Show when={props.isOpen}>
        <div
          role="dialog"
          aria-label="Color picker"
          id="monoscape-color-panel"
          ref={(el) => {
            panelRef = el;
          }}
          data-color-picker-panel="true"
          data-color-picker-mode={pickerMode()}
          style={TOOLBAR_STYLES.dropdownPanel + "width: 320px; max-height: 480px;"}
          onKeyDown={handlePanelKeyDown}
        >
          {/* Mode switcher: RGBA / HSL / HSV / HEX */}
          <div style="display: flex; gap: 4px; margin-bottom: 12px; padding: 8px 8px 0;">
            <button
              type="button"
              style={modeButtonStyle(model() === "rgba")}
              onClick={() => selectMode("rgba")}
            >
              RGBA
            </button>
            <button
              type="button"
              style={modeButtonStyle(model() === "hsl")}
              onClick={() => selectMode("hsl")}
            >
              HSL
            </button>
            <button
              type="button"
              style={modeButtonStyle(model() === "hsv")}
              onClick={() => selectMode("hsv")}
            >
              HSV
            </button>
            <button
              type="button"
              style={modeButtonStyle(model() === "hex")}
              onClick={() => selectMode("hex")}
            >
              HEX
            </button>
          </div>

          {/* Picker mode switcher: Wheel / Pyramid / Input */}
          <div style="display: flex; gap: 0; margin-bottom: 12px; padding: 0 8px;">
            <button
              type="button"
              data-picker-mode="wheel"
              style={pickerModeButtonStyle(pickerMode() === "wheel") + "border-top-right-radius: 0; border-bottom-right-radius: 0;"}
              onClick={() => selectPickerMode("wheel")}
            >
              Wheel
            </button>
            <button
              type="button"
              data-picker-mode="pyramid"
              style={pickerModeButtonStyle(pickerMode() === "pyramid") + "border-radius: 0; border-left: none;"}
              onClick={() => selectPickerMode("pyramid")}
            >
              Pyramid
            </button>
            <button
              type="button"
              data-picker-mode="input"
              style={pickerModeButtonStyle(pickerMode() === "input") + "border-top-left-radius: 0; border-bottom-left-radius: 0; border-left: none;"}
              onClick={() => selectPickerMode("input")}
            >
              Input
            </button>
          </div>

          <Show when={pickerMode() === "wheel" || pickerMode() === "pyramid"}>
            <div style="padding: 8px 8px 0;">
              <ColorPickerVisual
                mode={pickerMode() as Exclude<ColorPickerMode, "input">}
                color={currentColor()}
                onChange={handleColorChange}
              />
            </div>
          </Show>

          {/* Format inputs */}
          <Show when={pickerMode() === "input"}>
            <ColorFormatInputs
              color={currentColor()}
              model={model()}
              onChange={handleColorChange}
            />
          </Show>

          {/* Current color preview with transparency pattern */}
          <div style="padding: 8px; margin-top: 8px; border-top: 1px solid #e5e8ed;">
            <div style={TOOLBAR_STYLES.label}>Preview</div>
            <div
              style={`
                width: 100%;
                height: 48px;
                border-radius: 6px;
                border: 1px solid #c3cad8;
                ${swatchStyle(currentColor())}
              `}
            />
          </div>

          {/* Contrast warning */}
          <Show when={!meetsWCAGAA()}>
            <div style="padding: 8px; margin-top: 8px; border-top: 1px solid #e5e8ed;">
              <div
                style="padding: 8px; background: #fff5e6; border: 1px solid #ffcc80; border-radius: 4px; font-size: 0.75rem; color: #8a5a00;"
              >
                <strong>⚠ Contrast Warning:</strong> This color has a contrast ratio of{" "}
                {contrastRatio().toFixed(2)}:1 on white. WCAG AA requires 4.5:1 for text.
              </div>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
