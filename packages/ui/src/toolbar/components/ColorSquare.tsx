import { createMemo } from "solid-js";
import { normalizeColor } from "@monoscape/document-core";
import type { NormalizedColor } from "@monoscape/document-core";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface ColorSquareProps {
  color: NormalizedColor;
  onChange: (color: NormalizedColor) => void;
}

export function ColorSquare(props: ColorSquareProps) {
  const size = 180;
  const hue = () => props.color.hsv.h;
  const saturation = () => props.color.hsv.s;
  const value = () => props.color.hsv.v;

  const updateHsv = (nextS: number, nextV: number) => {
    const normalized = normalizeColor({
      h: hue(),
      s: clamp(nextS, 0, 100),
      v: clamp(nextV, 0, 100),
      a: props.color.hsv.a
    });
    if (normalized) props.onChange(normalized);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") { event.preventDefault(); updateHsv(saturation() + 4, value()); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); updateHsv(saturation() - 4, value()); }
    else if (event.key === "ArrowUp") { event.preventDefault(); updateHsv(saturation(), value() + 4); }
    else if (event.key === "ArrowDown") { event.preventDefault(); updateHsv(saturation(), value() - 4); }
  };

  const handlePointer = (event: PointerEvent) => {
    const target = event.currentTarget as HTMLDivElement;
    target.setPointerCapture(event.pointerId);
    const rect = target.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    updateHsv(x * 100, (1 - y) * 100);
  };

  const marker = createMemo(() => ({
    x: (saturation() / 100) * size,
    y: (1 - value() / 100) * size
  }));

  return (
    <div
      data-color-picker="square"
      style={`position: relative; width: ${size}px; height: ${size}px; margin: 0 auto; border-radius: 6px; overflow: hidden; border: 1px solid #c3cad8;`}
    >
      <div
        tabIndex={0}
        role="slider"
        aria-label="HSV color square. Arrow right/left adjusts saturation. Arrow up/down adjusts brightness."
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={saturation()}
        style={`
          width: ${size}px;
          height: ${size}px;
          background:
            linear-gradient(to bottom, transparent, #000),
            linear-gradient(to right, #fff, hsl(${hue()}, 100%, 50%));
          outline-offset: 2px;
          cursor: crosshair;
        `}
        onPointerDown={handlePointer}
        onPointerMove={(e) => { if (e.buttons > 0) handlePointer(e); }}
        onKeyDown={handleKeyDown}
      />
      <div
        style={`
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 0 0 1px #000;
          pointer-events: none;
          left: ${marker().x - 5}px;
          top: ${marker().y - 5}px;
        `}
      />
    </div>
  );
}
