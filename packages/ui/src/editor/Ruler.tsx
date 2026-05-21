// Horizontal and vertical ruler components for the document editor shell.
// Each ruler renders a letter-paper-width (or height) SVG with:
//   - shaded zones for the margin areas
//   - tick marks at 1/8-inch intervals
//   - inch labels on the horizontal ruler

import { createMemo, For } from "solid-js";

/** CSS pixels per inch (spec-defined, device-independent). */
const PPI = 96;
/** Thickness of each ruler in px. */
export const RULER_THICKNESS = 20;

export interface RulerProps {
  /** Total page dimension in inches (e.g. 8.5 for width, 11 for height). */
  documentInches: number;
  /** Start margin in inches (left for horizontal, top for vertical). */
  marginStart: number;
  /** End margin in inches (right for horizontal, bottom for vertical). */
  marginEnd: number;
}

export function HorizontalRuler(props: RulerProps) {
  const totalPx = () => props.documentInches * PPI;
  const startPx = () => props.marginStart * PPI;
  const endPx = () => (props.documentInches - props.marginEnd) * PPI;

  type Tick = { x: number; h: number; label?: string };
  const ticks = createMemo<Tick[]>(() => {
    const result: Tick[] = [];
    const steps = Math.round(props.documentInches * 8);
    for (let i = 0; i <= steps; i++) {
      const x = (i / 8) * PPI;
      const isInch = i % 8 === 0;
      const isHalf = i % 4 === 0;
      const isQtr = i % 2 === 0;
      const h = isInch ? 10 : isHalf ? 7 : isQtr ? 5 : 3;
      result.push({ x, h, label: isInch ? String(i / 8) : undefined });
    }
    return result;
  });

  return (
    <svg
      width={totalPx()}
      height={RULER_THICKNESS}
      style="display:block;flex-shrink:0;overflow:visible;"
      aria-hidden="true"
    >
      {/* Margin zones */}
      <rect x={0} y={0} width={startPx()} height={RULER_THICKNESS} fill="#dde2ea" />
      <rect
        x={endPx()}
        y={0}
        width={Math.max(0, totalPx() - endPx())}
        height={RULER_THICKNESS}
        fill="#dde2ea"
      />
      {/* Content zone */}
      <rect
        x={startPx()}
        y={0}
        width={Math.max(0, endPx() - startPx())}
        height={RULER_THICKNESS}
        fill="#f0f3f8"
      />
      {/* Tick marks + inch labels */}
      <For each={ticks()}>
        {(tick) => (
          <>
            <line
              x1={tick.x}
              y1={RULER_THICKNESS - tick.h}
              x2={tick.x}
              y2={RULER_THICKNESS}
              stroke="#7b869b"
              stroke-width="0.8"
            />
            {tick.label !== undefined && (
              <text
                x={tick.x + 2}
                y={RULER_THICKNESS - tick.h - 1}
                font-size="8"
                fill="#52607a"
                font-family="system-ui,sans-serif"
              >
                {tick.label}
              </text>
            )}
          </>
        )}
      </For>
      {/* Margin boundary lines */}
      <line
        x1={startPx()}
        y1={0}
        x2={startPx()}
        y2={RULER_THICKNESS}
        stroke="#5b8dd9"
        stroke-width="1.5"
      />
      <line
        x1={endPx()}
        y1={0}
        x2={endPx()}
        y2={RULER_THICKNESS}
        stroke="#5b8dd9"
        stroke-width="1.5"
      />
      {/* Bottom border */}
      <line
        x1={0}
        y1={RULER_THICKNESS - 0.5}
        x2={totalPx()}
        y2={RULER_THICKNESS - 0.5}
        stroke="#c8cdd8"
        stroke-width="1"
      />
    </svg>
  );
}

export function VerticalRuler(props: RulerProps) {
  const totalPx = () => props.documentInches * PPI;
  const startPx = () => props.marginStart * PPI;
  const endPx = () => (props.documentInches - props.marginEnd) * PPI;

  type Tick = { y: number; h: number; label?: string };
  const ticks = createMemo<Tick[]>(() => {
    const result: Tick[] = [];
    const steps = Math.round(props.documentInches * 8);
    for (let i = 0; i <= steps; i++) {
      const y = (i / 8) * PPI;
      const isInch = i % 8 === 0;
      const isHalf = i % 4 === 0;
      const isQtr = i % 2 === 0;
      const h = isInch ? 10 : isHalf ? 7 : isQtr ? 5 : 3;
      // Labels at every inch, shown as rotated text
      result.push({ y, h, label: isInch ? String(i / 8) : undefined });
    }
    return result;
  });

  return (
    <svg
      width={RULER_THICKNESS}
      height={totalPx()}
      style="display:block;flex-shrink:0;overflow:visible;"
      aria-hidden="true"
    >
      {/* Margin zones */}
      <rect x={0} y={0} width={RULER_THICKNESS} height={startPx()} fill="#dde2ea" />
      <rect
        x={0}
        y={endPx()}
        width={RULER_THICKNESS}
        height={Math.max(0, totalPx() - endPx())}
        fill="#dde2ea"
      />
      {/* Content zone */}
      <rect
        x={0}
        y={startPx()}
        width={RULER_THICKNESS}
        height={Math.max(0, endPx() - startPx())}
        fill="#f0f3f8"
      />
      {/* Tick marks + inch labels (rotated) */}
      <For each={ticks()}>
        {(tick) => (
          <>
            <line
              x1={RULER_THICKNESS - tick.h}
              y1={tick.y}
              x2={RULER_THICKNESS}
              y2={tick.y}
              stroke="#7b869b"
              stroke-width="0.8"
            />
            {tick.label !== undefined && (
              <text
                x={tick.h + 1}
                y={tick.y + 1}
                font-size="8"
                fill="#52607a"
                font-family="system-ui,sans-serif"
                transform={`rotate(-90,${tick.h + 1},${tick.y + 1})`}
              >
                {tick.label}
              </text>
            )}
          </>
        )}
      </For>
      {/* Margin boundary lines */}
      <line
        x1={0}
        y1={startPx()}
        x2={RULER_THICKNESS}
        y2={startPx()}
        stroke="#5b8dd9"
        stroke-width="1.5"
      />
      <line
        x1={0}
        y1={endPx()}
        x2={RULER_THICKNESS}
        y2={endPx()}
        stroke="#5b8dd9"
        stroke-width="1.5"
      />
      {/* Right border */}
      <line
        x1={RULER_THICKNESS - 0.5}
        y1={0}
        x2={RULER_THICKNESS - 0.5}
        y2={totalPx()}
        stroke="#c8cdd8"
        stroke-width="1"
      />
    </svg>
  );
}
