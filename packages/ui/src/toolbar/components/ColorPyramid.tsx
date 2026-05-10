import { createMemo } from "solid-js";
import { normalizeColor } from "@monoscape/document-core";
import type { NormalizedColor } from "@monoscape/document-core";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface ColorPyramidProps {
  color: NormalizedColor;
  onChange: (color: NormalizedColor) => void;
}

export function ColorPyramid(props: ColorPyramidProps) {
  const size = 180;
  const hue = () => props.color.hsv.h;
  const saturation = () => props.color.hsv.s;
  const value = () => props.color.hsv.v;

  const updateHsv = (nextHue: number, nextS: number, nextV: number) => {
    const normalized = normalizeColor({
      h: clamp(nextHue, 0, 360),
      s: clamp(nextS, 0, 100),
      v: clamp(nextV, 0, 100),
      a: props.color.hsv.a
    });
    if (normalized) props.onChange(normalized);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.shiftKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      updateHsv(hue(), saturation() + (event.key === "ArrowUp" ? 4 : -4), value());
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      updateHsv(hue() + (event.key === "ArrowRight" ? 4 : -4), saturation(), value());
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      updateHsv(hue(), saturation(), value() + (event.key === "ArrowUp" ? 4 : -4));
    }
  };

  const handlePointer = (event: PointerEvent) => {
    const target = event.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    updateHsv(hue(), x * 100, (1 - y) * 100);
  };

  const marker = createMemo(() => ({
    x: (saturation() / 100) * size,
    y: (1 - value() / 100) * size
  }));

  return (
    <div
      data-color-picker="pyramid"
      style={`position: relative; width: ${size}px; height: ${size}px; margin: 0 auto;`}
    >
      <div
        tabIndex={0}
        role="group"
        aria-label="HSV pyramid. Arrow left/right adjusts hue. Arrow up/down adjusts brightness. Shift plus arrows adjusts saturation."
        style={`
          width: ${size}px;
          height: ${size}px;
          clip-path: polygon(50% 0%, 0% 50%, 50% 100%, 100% 50%);
          background:
            linear-gradient(to bottom, #fff, hsl(${hue()}, 100%, 50%), #000),
            linear-gradient(to right, #fff, hsl(${hue()}, 100%, 50%));
          outline-offset: 2px;
          border: 1px solid #c3cad8;
        `}
        onPointerDown={handlePointer}
        onKeyDown={handleKeyDown}
      />
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style="position:absolute; inset:0; pointer-events:none;"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="pyramidTop" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color={`hsl(${hue()}, 100%, 50%)`} />
          </linearGradient>
          <linearGradient id="pyramidBottom" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color={`hsl(${hue()}, 100%, 50%)`} />
            <stop offset="100%" stop-color="#000000" />
          </linearGradient>
        </defs>
        <polygon points={`${size / 2},10 20,${size / 2} ${size - 20},${size / 2}`} fill="url(#pyramidTop)" />
        <polygon
          points={`20,${size / 2} ${size - 20},${size / 2} ${size / 2},${size - 10}`}
          fill="url(#pyramidBottom)"
        />
      </svg>
      <div
        style={`
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 0 0 1px #000;
          left: ${marker().x - 5}px;
          top: ${marker().y - 5}px;
        `}
      />
    </div>
  );
}
