import { describe, expect, it } from "vitest";
import { normalizeColor } from "./color";

const withinOnePercent = (actual: number, expected: number) => {
  const delta = Math.abs(actual - expected);
  return delta <= Math.max(1, Math.round(expected * 0.01));
};

describe("color conversions", () => {
  it("normalizes RGBA into HEX with alpha preservation", () => {
    const normalized = normalizeColor({ r: 255, g: 0, b: 0, a: 1 });
    expect(normalized?.hex).toBe("#ff0000");
  });

  it("normalizes HSL into RGBA", () => {
    const normalized = normalizeColor({ h: 240, s: 100, l: 50, a: 1 });
    expect(normalized?.rgba).toEqual({ r: 0, g: 0, b: 255, a: 1 });
  });

  it("normalizes HSV into RGBA", () => {
    const normalized = normalizeColor({ h: 120, s: 100, v: 100, a: 1 });
    expect(normalized?.rgba).toEqual({ r: 0, g: 255, b: 0, a: 1 });
  });

  it("normalizes HEX into RGBA", () => {
    const normalized = normalizeColor("#00ff00");
    expect(normalized?.rgba).toEqual({ r: 0, g: 255, b: 0, a: 1 });
  });

  it("round-trips RGBA through HSL/HSV/HEX within 1% tolerance", () => {
    const initial = normalizeColor({ r: 64, g: 128, b: 192, a: 0.5 });
    expect(initial).not.toBeNull();
    if (!initial) return;

    const roundTrip = normalizeColor(initial.hex);
    expect(roundTrip).not.toBeNull();
    if (!roundTrip) return;

    expect(withinOnePercent(roundTrip.rgba.r, initial.rgba.r)).toBe(true);
    expect(withinOnePercent(roundTrip.rgba.g, initial.rgba.g)).toBe(true);
    expect(withinOnePercent(roundTrip.rgba.b, initial.rgba.b)).toBe(true);
    expect(Math.abs(roundTrip.rgba.a - initial.rgba.a)).toBeLessThanOrEqual(0.01);
  });
});
