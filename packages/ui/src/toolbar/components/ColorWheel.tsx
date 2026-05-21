// @arch-override: hex-colors
// Reason: ColorWheel renders canvas-based hue/saturation rings. #fff and #000
// are literal gradient-stop color values (pure white/black), not UI style tokens.
import { createMemo } from "solid-js";
import { normalizeColor } from "@monoscape/document-core";
import type { NormalizedColor } from "@monoscape/document-core";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface ColorWheelProps {
  color: NormalizedColor;
  onChange: (color: NormalizedColor) => void;
}

export function ColorWheel(props: ColorWheelProps) {
  const size = 160;
  const ringThickness = 18;
  const innerSize = size - ringThickness * 2;

  const hue = () => props.color.hsl.h;
  const saturation = () => props.color.hsl.s;
  const lightness = () => props.color.hsl.l;

  const hueMarker = createMemo(() => {
    const radius = size / 2 - ringThickness / 2;
    const angle = ((hue() - 90) * Math.PI) / 180;
    return {
      x: size / 2 + Math.cos(angle) * radius,
      y: size / 2 + Math.sin(angle) * radius
    };
  });

  const triangleMarker = createMemo(() => {
    const y = 1 - lightness() / 100;
    const halfWidth = 0.5 * (1 - y);
    const left = 0.5 - halfWidth;
    const right = 0.5 + halfWidth;
    const x = left + (saturation() / 100) * (right - left);
    return { x: x * innerSize, y: y * innerSize };
  });

  const updateHue = (nextHue: number) => {
    const normalized = normalizeColor({
      h: clamp(nextHue, 0, 360),
      s: saturation(),
      l: lightness(),
      a: props.color.hsl.a
    });
    if (normalized) props.onChange(normalized);
  };

  const updateTriangle = (nextS: number, nextL: number) => {
    const normalized = normalizeColor({
      h: hue(),
      s: clamp(nextS, 0, 100),
      l: clamp(nextL, 0, 100),
      a: props.color.hsl.a
    });
    if (normalized) props.onChange(normalized);
  };

  const handleHueKeyDown = (event: KeyboardEvent) => {
    if (event.shiftKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      updateTriangle(saturation() + (event.key === "ArrowRight" ? 4 : -4), lightness());
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      updateHue(hue() + (event.key === "ArrowRight" ? 4 : -4));
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      updateTriangle(saturation(), lightness() + (event.key === "ArrowUp" ? 4 : -4));
    }
  };

  const handleHuePointer = (event: PointerEvent) => {
    const target = event.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    const angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    updateHue(angle < 0 ? angle + 360 : angle);
  };

  const handleTrianglePointer = (event: PointerEvent) => {
    const target = event.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const halfWidth = 0.5 * (1 - y);
    const left = 0.5 - halfWidth;
    const right = 0.5 + halfWidth;
    const clampedX = clamp(x, left, right);
    const s = ((clampedX - left) / (right - left)) * 100;
    const l = (1 - y) * 100;
    updateTriangle(s, l);
  };

  return (
    <div
      data-color-picker="wheel"
      style={`position: relative; width: ${size}px; height: ${size}px; margin: 0 auto;`}
    >
      <div
        tabIndex={0}
        role="slider"
        aria-label="Hue wheel. Arrow left/right adjusts hue. Arrow up/down adjusts lightness. Shift plus arrows adjust saturation."
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={hue()}
        style={`
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: conic-gradient(red, yellow, lime, cyan, blue, magenta, red);
          display: flex;
          align-items: center;
          justify-content: center;
          outline-offset: 2px;
          position: relative;
        `}
        onPointerDown={handleHuePointer}
        onKeyDown={handleHueKeyDown}
      >
        <div
          style={`
            width: ${innerSize}px;
            height: ${innerSize}px;
            border-radius: 50%;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          `}
        >
          <div
            tabIndex={0}
            role="group"
            aria-label="Saturation and lightness triangle"
            style={`
              width: ${innerSize}px;
              height: ${innerSize}px;
              clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
              background:
                linear-gradient(to right, #fff, hsl(${hue()}, 100%, 50%)),
                linear-gradient(to top, #000, transparent);
              position: absolute;
            `}
            onPointerDown={handleTrianglePointer}
            onKeyDown={handleHueKeyDown}
          />
          <div
            style={`
              position: absolute;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              border: 2px solid #fff;
              box-shadow: 0 0 0 1px #000;
              left: ${triangleMarker().x - 5}px;
              top: ${triangleMarker().y - 5}px;
            `}
          />
        </div>
        <div
          style={`
            position: absolute;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid #fff;
            box-shadow: 0 0 0 1px #000;
            left: ${hueMarker().x - 6}px;
            top: ${hueMarker().y - 6}px;
          `}
        />
      </div>
    </div>
  );
}
