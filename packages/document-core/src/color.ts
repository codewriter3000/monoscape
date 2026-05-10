// Font color types, models, and conversion helpers

export type ColorModel = "rgba" | "hsl" | "hsv" | "hex";
export type ColorPickerMode = "wheel" | "pyramid" | "input";

export interface RGBAColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-1
}

export interface HSLColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
  a: number; // 0-1
}

export interface HSVColor {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
  a: number; // 0-1
}

export interface NormalizedColor {
  rgba: RGBAColor;
  hsl: HSLColor;
  hsv: HSVColor;
  hex: string;
}

// Conversion: HEX to RGBA
export function hexToRgba(hex: string): RGBAColor | null {
  const cleaned = hex.replace(/^#/, "");
  
  if (!/^[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(cleaned)) {
    return null;
  }

  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const a = cleaned.length === 8 ? parseInt(cleaned.slice(6, 8), 16) / 255 : 1;

  return { r, g, b, a };
}

// Conversion: RGBA to HEX
export function rgbaToHex(rgba: RGBAColor): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  const hex = `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
  
  if (rgba.a < 1) {
    return `${hex}${toHex(rgba.a * 255)}`;
  }
  
  return hex;
}

// Conversion: RGBA to HSL
export function rgbaToHsl(rgba: RGBAColor): HSLColor {
  const r = rgba.r / 255;
  const g = rgba.g / 255;
  const b = rgba.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6;
    } else {
      h = ((r - g) / delta + 4) / 6;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a: rgba.a
  };
}

// Conversion: HSL to RGBA
export function hslToRgba(hsl: HSLColor): RGBAColor {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hueToRgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: hsl.a
  };
}

// Conversion: RGBA to HSV
export function rgbaToHsv(rgba: RGBAColor): HSVColor {
  const r = rgba.r / 255;
  const g = rgba.g / 255;
  const b = rgba.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  const s = max === 0 ? 0 : delta / max;
  const v = max;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6;
    } else {
      h = ((r - g) / delta + 4) / 6;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
    a: rgba.a
  };
}

// Conversion: HSV to RGBA
export function hsvToRgba(hsv: HSVColor): RGBAColor {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r, g, b;

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
    default: r = g = b = 0;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: hsv.a
  };
}

// Create normalized color from any input
export function normalizeColor(input: string | RGBAColor | HSLColor | HSVColor): NormalizedColor | null {
  let rgba: RGBAColor;

  if (typeof input === "string") {
    const parsed = hexToRgba(input);
    if (!parsed) return null;
    rgba = parsed;
  } else if ("r" in input) {
    rgba = input;
  } else if ("l" in input) {
    rgba = hslToRgba(input);
  } else {
    rgba = hsvToRgba(input);
  }

  return {
    rgba,
    hsl: rgbaToHsl(rgba),
    hsv: rgbaToHsv(rgba),
    hex: rgbaToHex(rgba)
  };
}

// Format color for CSS
export function formatColorForCss(color: NormalizedColor | null): string {
  if (!color) return "inherit";
  
  const { r, g, b, a } = color.rgba;
  
  if (a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  
  return color.hex;
}

// Check contrast ratio (WCAG 2.2 AA: 4.5:1 for text)
export function getContrastRatio(foreground: RGBAColor, background: RGBAColor): number {
  const getLuminance = (rgba: RGBAColor) => {
    const [r, g, b] = [rgba.r, rgba.g, rgba.b].map((val) => {
      const normalized = val / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsContrastThreshold(
  foreground: RGBAColor,
  background: RGBAColor,
  threshold: number = 4.5
): boolean {
  return getContrastRatio(foreground, background) >= threshold;
}
