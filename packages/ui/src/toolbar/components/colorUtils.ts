import { normalizeColor } from "@monoscape/document-core";
import type { NormalizedColor, RGBAColor } from "@monoscape/document-core";

const rgbPattern =
  /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d*\.?\d+))?\s*\)$/i;

const clampChannel = (value: number, max: number) => Math.min(max, Math.max(0, value));

const parseCssColor = (value: string): RGBAColor | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === "transparent") {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  const match = trimmed.match(rgbPattern);
  if (!match) return null;

  const r = clampChannel(Number(match[1]), 255);
  const g = clampChannel(Number(match[2]), 255);
  const b = clampChannel(Number(match[3]), 255);
  const a = match[4] === undefined ? 1 : clampChannel(Number(match[4]), 1);
  return { r, g, b, a };
};

export const normalizeToolbarColor = (
  value: NormalizedColor | null | undefined
): NormalizedColor | null => {
  if (!value) return null;

  if (value.rgba && value.hsl && value.hsv && value.hex) {
    return value;
  }

  if (value.rgba) {
    return normalizeColor(value.rgba);
  }

  if (value.hex) {
    const parsed = parseCssColor(value.hex);
    return parsed ? normalizeColor(parsed) : normalizeColor(value.hex);
  }

  return null;
};
