import { Show, createEffect, createSignal, type JSX } from "solid-js";
import { normalizeToolbarColor } from "./colorUtils";
import { clampNum, formatColorByModel, parseColorByModel } from "./pickers/colorPickerUtils";
import { ColorPickerPanel } from "./pickers/ColorPickerPanel";
import { normalizeColor, hexToRgba, getContrastRatio, formatColorForCss, type NormalizedColor, type ColorModel, type ColorPickerMode } from "@monoscape/document-core";
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
  const [model, setModel] = createSignal<ColorModel>("hex");
  const [pickerMode, setPickerMode] = createSignal<ColorPickerMode>("input");
  const [colorDraft, setColorDraft] = createSignal("");
  const [isHovered, setIsHovered] = createSignal(false);
  const [isFocused, setIsFocused] = createSignal(false);
  let triggerRef: HTMLButtonElement | undefined;
  let hexInputRef: HTMLInputElement | undefined;
  let panelRef: HTMLDivElement | undefined;
  const defaultColor = normalizeColor({ r: 0, g: 0, b: 0, a: 1 })!;

  // Internal working color — syncs from props.value only when panel opens,
  // then tracks user interactions independently so outside-click doesn't reset it.
  const [activeColor, setActiveColor] = createSignal<NormalizedColor | null>(null);
  const currentColor = () => activeColor() ?? normalizeToolbarColor(props.value) ?? defaultColor;

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
    // Enter is intentionally NOT intercepted here — buttons/inputs inside the panel
    // handle their own Enter activation. Intercepting it here would swallow button
    // clicks triggered by keyboard Enter via event bubbling.
  }

  const isActive = () => isFocused() || props.isOpen;
  const borderColor = () => {
    if (isActive()) return "#005fcc";
    if (isHovered()) return "#8a90a0";
    return "#c3cad8";
  };

  // Sync active color from props when the panel opens (so stale internal state is refreshed).
  createEffect(() => {
    if (props.isOpen) {
      setActiveColor(normalizeToolbarColor(props.value));
    }
  });

  // Keep draft in sync with currentColor + model (reactive to both).
  createEffect(() => {
    setColorDraft(formatColorByModel(currentColor(), model()));
  });

  function commitColor(value: string) {
    const parsed = parseColorByModel(value, model());
    if (parsed) {
      setActiveColor(parsed);
      props.onChange(parsed);
    } else {
      // Revert draft to the current committed color
      setColorDraft(formatColorByModel(currentColor(), model()));
    }
  }

  function handleHexKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitColor(colorDraft());
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      props.onOpenChange(false);
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      commitColor(colorDraft());
      props.onNavigateOut?.(event.shiftKey ? "prev" : "next");
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      props.onOpenChange(true);
    }
  }

  function handleColorChange(color: NormalizedColor) {
    setActiveColor(color);
    props.onChange(color);
  }

  function selectMode(newMode: ColorModel) {
    setModel(newMode);
  }

  function selectPickerMode(mode: ColorPickerMode) {
    setPickerMode(mode);
  }

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


  createEffect(() => {
    if (props.isOpen) {
      queueMicrotask(() => panelRef?.querySelector<HTMLElement>("input, [tabindex='0']")?.focus());
    }
  });

  return (
    <div ref={props.containerRef} style="position: relative; display: inline-flex; flex-direction: column; align-items: flex-start;">
      <div
        style="position: relative; display: flex;"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocusIn={() => setIsFocused(true)}
        onFocusOut={() => setIsFocused(false)}
      >
        <div
          style={`display:flex;align-items:stretch;border:1px solid ${borderColor()};border-radius:12px;overflow:hidden;box-shadow:${isActive() ? "0 0 0 2px rgba(0,95,204,0.2)" : "none"};transition:border-color 0.15s,box-shadow 0.15s;`}
        >
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:4px 12px;background:#f7f9fc;min-width:0;width:100px;">
            <span style="font-weight:700;font-size:0.65rem;color:black;letter-spacing:0.2px;line-height:1;margin-bottom:2px;">Color</span>
            <input
              ref={(el) => { hexInputRef = el; }}
              type="text"
              value={colorDraft()}
              placeholder={model() === "hex" ? "#000000" : model() === "rgba" ? "255, 0, 0" : "0, 100, 50"}
              aria-label={`Font color (${model().toUpperCase()})`}
              aria-controls="monoscape-color-panel"
              aria-expanded={props.isOpen}
              tabIndex={-1}
              style="border:none;background:transparent;color:#172033;font:inherit;min-width:0;width:100%;outline:none;padding:0;line-height:1.4;"
              onFocus={() => props.onOpenChange(true)}
              onInput={(e) => setColorDraft(e.currentTarget.value)}
              onBlur={(e) => commitColor(e.currentTarget.value)}
              onKeyDown={handleHexKeyDown}
            />
          </div>
          <button
            ref={(el) => {
              triggerRef = el;
              props.triggerRef?.(el);
            }}
            type="button"
            aria-label="Open color picker"
            tabIndex={-1}
            style={`display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 10px;min-height:42px;align-self:stretch;border:none;border-left:1px solid ${borderColor()};background:#f7f9fc;color:#52607a;font:inherit;cursor:pointer;transition:background 0.15s,border-color 0.15s;`}
            onClick={() => props.onOpenChange(!props.isOpen)}
            onKeyDown={handleTriggerKeyDown}
          >
            <div style={swatchStyle(currentColor())} />
            <span style={`display:inline-block;transition:transform 0.2s ease;transform:rotate(${props.isOpen ? "180" : "0"}deg);line-height:1;font-size:1rem;`}>▾</span>
            {props.renderKeytip?.()}
          </button>
        </div>
      </div>

      <Show when={props.isOpen}>
        <ColorPickerPanel
          model={model()}
          pickerMode={pickerMode()}
          currentColor={currentColor()}
          contrastRatio={contrastRatio()}
          meetsWCAGAA={meetsWCAGAA()}
          swatchStyle={swatchStyle}
          onModelChange={selectMode}
          onPickerModeChange={selectPickerMode}
          onChange={handleColorChange}
          onKeyDown={handlePanelKeyDown}
          panelRef={(el) => { panelRef = el; }}
        />
      </Show>
    </div>
  );
}
