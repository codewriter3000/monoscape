import { For, Show } from "solid-js";
import { normalizeColor } from "@monoscape/document-core";
import type { RGBAColor, HSLColor, HSVColor, ColorModel, NormalizedColor } from "@monoscape/document-core";
interface ColorFormatInputsProps {
  color: NormalizedColor;
  model: ColorModel;
  onChange: (color: NormalizedColor) => void;
}
type ChannelConfig = {
  key: string;
  label: string;
  aria: string;
  min: number;
  max: number;
  step?: number;
  value: () => number;
  onInput: (value: string) => void;
};
export function ColorFormatInputs(props: ColorFormatInputsProps) {
  const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value)),
    clampAlpha = (value: number) => Math.min(1, Math.max(0, value));

  const handleRGBAChange = (channel: keyof RGBAColor, value: string) => {
    const numValue = Number(value);
    if (Number.isNaN(numValue)) return;
    const clamped =
      channel === "a" ? clampAlpha(numValue) : clamp(Math.round(numValue), 255);
    const next = normalizeColor({ ...props.color.rgba, [channel]: clamped });
    if (next) props.onChange(next);
  };

  const handleHSLChange = (channel: keyof HSLColor, value: string) => {
    const numValue = Number(value);
    if (Number.isNaN(numValue)) return;
    const clamped =
      channel === "h"
        ? clamp(Math.round(numValue), 360)
        : channel === "a"
          ? clampAlpha(numValue)
          : clamp(Math.round(numValue), 100);
    const next = normalizeColor({ ...props.color.hsl, [channel]: clamped });
    if (next) props.onChange(next);
  };

  const handleHSVChange = (channel: keyof HSVColor, value: string) => {
    const numValue = Number(value);
    if (Number.isNaN(numValue)) return;
    const clamped =
      channel === "h"
        ? clamp(Math.round(numValue), 360)
        : channel === "a"
          ? clampAlpha(numValue)
          : clamp(Math.round(numValue), 100);
    const next = normalizeColor({ ...props.color.hsv, [channel]: clamped });
    if (next) props.onChange(next);
  };

  const handleHexChange = (value: string) => {
    const cleaned = value.replace(/[^0-9A-Fa-f]/g, "");
    if (cleaned.length !== 6 && cleaned.length !== 8) return;
    const next = normalizeColor(`#${cleaned}`);
    if (next) props.onChange(next);
  };

  const inputStyle = `
    width: 60px;
    padding: 4px 6px;
    border: 1px solid #c3cad8;
    border-radius: 4px;
    font-size: 0.75rem;
    text-align: center;
    outline: none;
  `;
  const labelStyle = `
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 0.65rem;
    font-weight: 600;
    color: #5a606c;
    text-transform: uppercase;
  `;
  const rgbaChannels: ChannelConfig[] = [
    {
      key: "r",
      label: "R",
      aria: "Red channel (0-255)",
      min: 0,
      max: 255,
      value: () => props.color.rgba.r,
      onInput: (value) => handleRGBAChange("r", value)
    },
    {
      key: "g",
      label: "G",
      aria: "Green channel (0-255)",
      min: 0,
      max: 255,
      value: () => props.color.rgba.g,
      onInput: (value) => handleRGBAChange("g", value)
    },
    {
      key: "b",
      label: "B",
      aria: "Blue channel (0-255)",
      min: 0,
      max: 255,
      value: () => props.color.rgba.b,
      onInput: (value) => handleRGBAChange("b", value)
    },
    {
      key: "a",
      label: "A",
      aria: "Alpha channel (0-1)",
      min: 0,
      max: 1,
      step: 0.01,
      value: () => Number(props.color.rgba.a.toFixed(2)),
      onInput: (value) => handleRGBAChange("a", value)
    }
  ];
  const hslChannels: ChannelConfig[] = [
    {
      key: "h",
      label: "H",
      aria: "Hue (0-360)",
      min: 0,
      max: 360,
      value: () => props.color.hsl.h,
      onInput: (value) => handleHSLChange("h", value)
    },
    {
      key: "s",
      label: "S",
      aria: "Saturation (0-100)",
      min: 0,
      max: 100,
      value: () => props.color.hsl.s,
      onInput: (value) => handleHSLChange("s", value)
    },
    {
      key: "l",
      label: "L",
      aria: "Lightness (0-100)",
      min: 0,
      max: 100,
      value: () => props.color.hsl.l,
      onInput: (value) => handleHSLChange("l", value)
    },
    {
      key: "a",
      label: "A",
      aria: "Alpha channel (0-1)",
      min: 0,
      max: 1,
      step: 0.01,
      value: () => Number(props.color.hsl.a.toFixed(2)),
      onInput: (value) => handleHSLChange("a", value)
    }
  ];
  const hsvChannels: ChannelConfig[] = [
    {
      key: "h",
      label: "H",
      aria: "Hue (0-360)",
      min: 0,
      max: 360,
      value: () => props.color.hsv.h,
      onInput: (value) => handleHSVChange("h", value)
    },
    {
      key: "s",
      label: "S",
      aria: "Saturation (0-100)",
      min: 0,
      max: 100,
      value: () => props.color.hsv.s,
      onInput: (value) => handleHSVChange("s", value)
    },
    {
      key: "v",
      label: "V",
      aria: "Value (0-100)",
      min: 0,
      max: 100,
      value: () => props.color.hsv.v,
      onInput: (value) => handleHSVChange("v", value)
    },
    {
      key: "a",
      label: "A",
      aria: "Alpha channel (0-1)",
      min: 0,
      max: 1,
      step: 0.01,
      value: () => Number(props.color.hsv.a.toFixed(2)),
      onInput: (value) => handleHSVChange("a", value)
    }
  ];

  const renderChannels = (channels: ChannelConfig[], model: string) => (
    <For each={channels}>
      {(channel) => (
        <label style={labelStyle} for={`monoscape-color-${model}-${channel.key}`}>
          {channel.label}
          <input
            id={`monoscape-color-${model}-${channel.key}`}
            aria-label={channel.aria}
            type="number"
            min={channel.min}
            max={channel.max}
            step={channel.step}
            value={channel.value()}
            style={inputStyle}
            onInput={(e) => channel.onInput(e.currentTarget.value)}
          />
        </label>
      )}
    </For>
  );
  return (
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 8px;">
      <Show when={props.model === "rgba"}>{renderChannels(rgbaChannels, "rgba")}</Show>
      <Show when={props.model === "hsl"}>{renderChannels(hslChannels, "hsl")}</Show>
      <Show when={props.model === "hsv"}>{renderChannels(hsvChannels, "hsv")}</Show>
      <Show when={props.model === "hex"}>
        <label style={labelStyle + "width: 100%;"} for="monoscape-color-hex">
          Hex
          <input
            id="monoscape-color-hex"
            aria-label="Hex color"
            type="text"
            value={props.color.hex}
            style={inputStyle + "width: 100%;"}
            maxLength="9"
            pattern="^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$"
            onInput={(e) => handleHexChange(e.currentTarget.value)}
          />
        </label>
      </Show>
    </div>
  );
}
