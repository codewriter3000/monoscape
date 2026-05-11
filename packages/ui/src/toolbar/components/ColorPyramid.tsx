import { createEffect, createMemo } from "solid-js";
import { normalizeColor } from "@monoscape/document-core";
import type { NormalizedColor } from "@monoscape/document-core";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// HSV triangle vertices (size x size canvas):
//   A = (size/2, 0)     → white  (S=0, V=100)
//   B = (0,      size)  → black  (S=0, V=0)
//   C = (size,   size)  → hue    (S=100, V=100)
//
// Barycentric for pixel (x,y):
//   u = 1 - y/size         (weight toward A/white)
//   v = 0.5 + y/(2·size) - x/size  (weight toward B/black)
//   w = -0.5 + y/(2·size) + x/size (weight toward C/hue)
//
// S = w·100,  V = (u+w)·100 = (1-v)·100
//
// Inverse (marker from S,V):
//   px = (V+S)·size/200
//   py = size·(1 + (S−V)/100)

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const h6 = ((h % 360) + 360) % 360 / 60;
  const i = Math.floor(h6);
  const f = h6 - i;
  const vn = v / 100, sn = s / 100;
  const p = vn * (1 - sn);
  const q = vn * (1 - f * sn);
  const t = vn * (1 - (1 - f) * sn);
  const m: [number, number, number][] = [
    [vn, t, p], [q, vn, p], [p, vn, t],
    [p, q, vn], [t, p, vn], [vn, p, q]
  ];
  const [r, g, b] = m[i % 6];
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

interface ColorPyramidProps {
  color: NormalizedColor;
  onChange: (color: NormalizedColor) => void;
}

export function ColorPyramid(props: ColorPyramidProps) {
  const size = 180;
  let canvasRef: HTMLCanvasElement | undefined;

  const hue = () => props.color.hsv.h;
  const saturation = () => props.color.hsv.s;
  const value = () => props.color.hsv.v;

  function drawCanvas(h: number) {
    const ctx = canvasRef?.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    for (let y = 0; y < size; y++) {
      const yn = y / size;
      const halfY = yn / 2;
      for (let x = 0; x < size; x++) {
        const u = 1 - yn;
        const v = 0.5 + halfY - x / size;
        const w = -0.5 + halfY + x / size;
        if (u < -0.005 || v < -0.005 || w < -0.005) continue;
        const s = clamp(w, 0, 1) * 100;
        const val = clamp(u + w, 0, 1) * 100;
        const [r, g, b] = hsvToRgb(h, s, val);
        const idx = (y * size + x) * 4;
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  createEffect(() => { drawCanvas(hue()); });

  const markerPos = createMemo(() => {
    const s = saturation(), v = value();
    return {
      x: (v + s) * size / 200,
      y: size * (1 + (s - v) / 100)
    };
  });

  const updateColor = (px: number, py: number) => {
    const yn = clamp(py / size, 0, 1);
    const xn = clamp(px / size, 0, 1);
    const u = 1 - yn;
    const v = 0.5 + yn / 2 - xn;
    const w = -0.5 + yn / 2 + xn;
    const total = Math.max(u, 0) + Math.max(v, 0) + Math.max(w, 0);
    const w2 = total > 0 ? Math.max(w, 0) / total : 0;
    const u2 = total > 0 ? Math.max(u, 0) / total : 0;
    const s = clamp(w2 * 100, 0, 100);
    const val = clamp((u2 + w2) * 100, 0, 100);
    const normalized = normalizeColor({ h: hue(), s, v: val, a: props.color.hsv.a });
    if (normalized) props.onChange(normalized);
  };

  const handlePointer = (event: PointerEvent) => {
    const el = event.currentTarget as HTMLCanvasElement;
    el.setPointerCapture(event.pointerId);
    const rect = el.getBoundingClientRect();
    updateColor(event.clientX - rect.left, event.clientY - rect.top);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const s = saturation(), v = value(), h = hue(), a = props.color.hsv.a;
    if (event.key === "ArrowRight") { event.preventDefault(); const n = normalizeColor({ h, s: clamp(s + 4, 0, 100), v, a }); if (n) props.onChange(n); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); const n = normalizeColor({ h, s: clamp(s - 4, 0, 100), v, a }); if (n) props.onChange(n); }
    else if (event.key === "ArrowUp") { event.preventDefault(); const n = normalizeColor({ h, s, v: clamp(v + 4, 0, 100), a }); if (n) props.onChange(n); }
    else if (event.key === "ArrowDown") { event.preventDefault(); const n = normalizeColor({ h, s, v: clamp(v - 4, 0, 100), a }); if (n) props.onChange(n); }
  };

  return (
    <div
      data-color-picker="pyramid"
      style={`position: relative; width: ${size}px; height: ${size}px; margin: 0 auto;`}
    >
      <canvas
        ref={(el) => { canvasRef = el; }}
        width={size}
        height={size}
        tabIndex={0}
        role="slider"
        aria-label="HSV triangle. Arrow right/left adjusts saturation. Arrow up/down adjusts brightness."
        style="cursor: crosshair; display: block; outline-offset: 2px;"
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
          left: ${markerPos().x - 5}px;
          top: ${markerPos().y - 5}px;
        `}
      />
    </div>
  );
}
