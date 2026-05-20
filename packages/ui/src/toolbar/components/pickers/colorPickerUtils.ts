import { normalizeColor, hexToRgba, type NormalizedColor, type ColorModel } from "@monoscape/document-core";

export const clampNum = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function formatColorByModel(color: NormalizedColor, model: ColorModel): string {
  switch (model) {
    case "hex": return color.hex;
    case "rgba": return `${color.rgba.r}, ${color.rgba.g}, ${color.rgba.b}${color.rgba.a < 1 ? `, ${color.rgba.a.toFixed(2)}` : ""}`;
    case "hsl": return `${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%`;
    case "hsv": return `${color.hsv.h}, ${color.hsv.s}%, ${color.hsv.v}%`;
  }
}

export function parseColorByModel(raw: string, model: ColorModel): NormalizedColor | null {
  const v = raw.trim();
  if (model === "hex") {
    const withHash = v.startsWith("#") ? v : `#${v}`;
    const rgba = hexToRgba(withHash);
    return rgba ? normalizeColor(rgba) : null;
  }
  const nums = v.replace(/[rgba()hsl%hsv]+/gi, "").split(/[,\s]+/).map(Number).filter(s => s === 0 || Boolean(s));
  if (nums.length < 3 || nums.some(isNaN)) return null;
  if (model === "rgba") return normalizeColor({ r: clampNum(Math.round(nums[0]), 0, 255), g: clampNum(Math.round(nums[1]), 0, 255), b: clampNum(Math.round(nums[2]), 0, 255), a: nums[3] !== undefined ? clampNum(nums[3], 0, 1) : 1 });
  if (model === "hsl") return normalizeColor({ h: clampNum(Math.round(nums[0]), 0, 360), s: clampNum(Math.round(nums[1]), 0, 100), l: clampNum(Math.round(nums[2]), 0, 100), a: nums[3] !== undefined ? clampNum(nums[3], 0, 1) : 1 });
  if (model === "hsv") return normalizeColor({ h: clampNum(Math.round(nums[0]), 0, 360), s: clampNum(Math.round(nums[1]), 0, 100), v: clampNum(Math.round(nums[2]), 0, 100), a: nums[3] !== undefined ? clampNum(nums[3], 0, 1) : 1 });
  return null;
}

export function modeButtonStyle(active: boolean): string {
  return `
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
}

export function pickerModeButtonStyle(active: boolean): string {
  return `
    padding: 6px 12px;
    border: 1px solid ${active ? "#005fcc" : "#c3cad8"};
    background: ${active ? "#dce8ff" : "#ffffff"};
    color: ${active ? "#005fcc" : "#172033"};
    font-size: 0.75rem;
    font-weight: ${active ? "600" : "400"};
    cursor: pointer;
    outline: none;
  `;
}
