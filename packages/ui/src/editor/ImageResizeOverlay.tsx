// Resize + rotate handle overlay rendered position:fixed over a selected image.
// 8 edge/corner handles resize the image; a "rotation antenna" above the top-center
// handle lets the user rotate it by dragging.

import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";

const HANDLE_SIZE = 10; // px, square
const HALF_HANDLE = HANDLE_SIZE / 2;
const ANTENNA_HEIGHT = 36;   // px — line from top-center handle up to rotation circle
const ROTATION_RADIUS = 7;   // px — radius of the rotation circle
const GRID_SIZE = 10;         // px — snap / grid interval
const GRID_FADE_DIST = 200;   // px beyond the image bounding box before the grid fades out

interface HandleDef {
  id: string;
  cursor: string;
  /** 0 = left edge, 0.5 = center, 1 = right edge */
  xPct: number;
  /** 0 = top edge, 0.5 = middle, 1 = bottom edge */
  yPct: number;
  /** –1 resize from left, 0 = no x change, 1 = resize from right */
  dx: -1 | 0 | 1;
  /** –1 resize from top,  0 = no y change, 1 = resize from bottom */
  dy: -1 | 0 | 1;
}

const HANDLE_DEFS: HandleDef[] = [
  { id: "nw", cursor: "nwse-resize", xPct: 0,   yPct: 0,   dx: -1, dy: -1 },
  { id: "n",  cursor: "ns-resize",   xPct: 0.5, yPct: 0,   dx:  0, dy: -1 },
  { id: "ne", cursor: "nesw-resize", xPct: 1,   yPct: 0,   dx:  1, dy: -1 },
  { id: "e",  cursor: "ew-resize",   xPct: 1,   yPct: 0.5, dx:  1, dy:  0 },
  { id: "se", cursor: "nwse-resize", xPct: 1,   yPct: 1,   dx:  1, dy:  1 },
  { id: "s",  cursor: "ns-resize",   xPct: 0.5, yPct: 1,   dx:  0, dy:  1 },
  { id: "sw", cursor: "nesw-resize", xPct: 0,   yPct: 1,   dx: -1, dy:  1 },
  { id: "w",  cursor: "ew-resize",   xPct: 0,   yPct: 0.5, dx: -1, dy:  0 },
];

function extractRotationDeg(img: HTMLImageElement): number {
  const m = img.style.transform.match(/rotate\(([-\d.]+)deg\)/);
  return m ? parseFloat(m[1]) : 0;
}

function applyRotationDeg(img: HTMLImageElement, deg: number) {
  const without = img.style.transform.replace(/\s*rotate\([^)]+\)/g, "").trim();
  img.style.transform = without
    ? `${without} rotate(${deg.toFixed(1)}deg)`
    : `rotate(${deg.toFixed(1)}deg)`;
}

function readImageSize(img: HTMLImageElement): { w: number; h: number } {
  return {
    w: img.style.width  ? parseFloat(img.style.width)  : img.offsetWidth,
    h: img.style.height ? parseFloat(img.style.height) : img.offsetHeight,
  };
}

function readImageMargins(img: HTMLImageElement): { ml: number; mt: number } {
  return {
    ml: parseFloat(img.style.marginLeft || "0") || 0,
    mt: parseFloat(img.style.marginTop  || "0") || 0,
  };
}

/**
 * Build a CanvasGradient for a single grid line. The line is fully opaque
 * (at `alpha`) within the image's projected span [nearA, nearB] and fades to
 * transparent over `fadeDist` px on each side.
 *
 * Edge cases: if the image extends beyond the viewport boundary on a given side,
 * the gradient starts/ends opaque at that viewport edge instead of fading in.
 */
function buildLineGradient(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, x1: number, y1: number,
  nearA: number, nearB: number, total: number,
  fadeDist: number, alpha: number,
): CanvasGradient {
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  const c0 = `rgba(0,95,204,0)`;
  const cA = `rgba(0,95,204,${alpha.toFixed(3)})`;
  const p  = (v: number) => Math.max(0, Math.min(1, v / total));

  // When the image overflows the viewport edge, start/end opaque there.
  const startColor = nearA <= 0     ? cA : c0;
  const endColor   = nearB >= total ? cA : c0;

  // Six key stops (some positions may collapse to 0 or 1 at viewport edges).
  const raw: [number, string][] = [
    [0,                   startColor],
    [p(nearA - fadeDist), startColor],  // transparent plateau ends
    [p(nearA),            cA],           // opaque at image edge
    [p(nearB),            cA],           // opaque at image edge
    [p(nearB + fadeDist), endColor],     // transparent plateau begins
    [1,                   endColor],
  ];

  // Merge duplicate positions (later entry wins), then emit sorted.
  const map = new Map<number, string>();
  for (const [pos, color] of raw) map.set(pos, color);
  for (const [pos, color] of [...map.entries()].sort(([a], [b]) => a - b)) {
    grad.addColorStop(pos, color);
  }
  return grad;
}

/**
 * Draw a 10 px grid on a full-viewport canvas. Lines fade in two ways:
 *   1. Perpendicular fade — lines further from the image's bounding box are dimmer.
 *   2. Along-line gradient — each line fades out beyond the image's own extent
 *      in its direction, so no line bleeds all the way to the viewport edge.
 */
function drawResizeGrid(canvas: HTMLCanvasElement, imgRect: DOMRect): void {
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);

  // Vertical lines:
  //   base alpha  ← horizontal distance from image (perpendicular fade)
  //   gradient ↕  ← vertical distance from image's top/bottom (along-line fade)
  for (let x = 0; x <= W; x += GRID_SIZE) {
    const distH =
      x < imgRect.left  ? imgRect.left  - x :
      x > imgRect.right ? x - imgRect.right : 0;
    const alpha = Math.max(0, 1 - distH / GRID_FADE_DIST) * 0.5;
    if (alpha < 0.005) continue;
    ctx.strokeStyle = buildLineGradient(
      ctx,
      x + 0.5, 0, x + 0.5, H,
      imgRect.top, imgRect.bottom, H,
      GRID_FADE_DIST, alpha,
    );
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
    ctx.stroke();
  }

  // Horizontal lines:
  //   base alpha  ← vertical distance from image (perpendicular fade)
  //   gradient ↔  ← horizontal distance from image's left/right (along-line fade)
  for (let y = 0; y <= H; y += GRID_SIZE) {
    const distV =
      y < imgRect.top    ? imgRect.top    - y :
      y > imgRect.bottom ? y - imgRect.bottom : 0;
    const alpha = Math.max(0, 1 - distV / GRID_FADE_DIST) * 0.5;
    if (alpha < 0.005) continue;
    ctx.strokeStyle = buildLineGradient(
      ctx,
      0, y + 0.5, W, y + 0.5,
      imgRect.left, imgRect.right, W,
      GRID_FADE_DIST, alpha,
    );
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }
}

export interface ImageResizeOverlayProps {
  image: HTMLImageElement;
  /** Called once after a drag finishes so the parent can persist the change. */
  onMutated: () => void;
}

export function ImageResizeOverlay(props: ImageResizeOverlayProps) {
  const [rect, setRect] = createSignal<DOMRect>(props.image.getBoundingClientRect());
  const refreshRect = () => setRect(props.image.getBoundingClientRect());

  const [showGrid, setShowGrid] = createSignal(false);
  let canvasRef: HTMLCanvasElement | undefined;

  // Redraw the grid canvas whenever it is visible and the image rect changes.
  createEffect(() => {
    if (!showGrid() || !canvasRef) return;
    drawResizeGrid(canvasRef, rect());
  });

  onMount(() => {
    // Keep overlay in sync with scroll, window resize and image layout changes.
    window.addEventListener("scroll", refreshRect, { capture: true, passive: true });
    window.addEventListener("resize", refreshRect, { passive: true });

    const ro = new ResizeObserver(refreshRect);
    ro.observe(props.image);

    // Show/hide the grid when Ctrl is pressed or released during a resize drag.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control" && drag?.kind === "resize") setShowGrid(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control") setShowGrid(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    onCleanup(() => {
      window.removeEventListener("scroll", refreshRect, true);
      window.removeEventListener("resize", refreshRect);
      ro.disconnect();
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    });
  });

  // ── Drag state ──────────────────────────────────────────────────────────

  type DragState =
    | {
        kind: "resize";
        startX: number;
        startY: number;
        startW: number;
        startH: number;
        startMl: number;
        startMt: number;
        dx: -1 | 0 | 1;
        dy: -1 | 0 | 1;
      }
    | {
        kind: "rotate";
        startAngle: number;       // degrees
        centerX: number;          // viewport px
        centerY: number;          // viewport px
        initialMouseAngle: number; // radians
      };

  let drag: DragState | null = null;

  const finishDrag = () => {
    drag = null;
    setShowGrid(false);
    props.onMutated();
    refreshRect();
  };

  const onResizePointerDown = (e: PointerEvent, dx: -1 | 0 | 1, dy: -1 | 0 | 1) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const { w, h } = readImageSize(props.image);
    const { ml, mt } = readImageMargins(props.image);
    drag = { kind: "resize", startX: e.clientX, startY: e.clientY, startW: w, startH: h, startMl: ml, startMt: mt, dx, dy };
    if (e.ctrlKey) setShowGrid(true);
  };

  const onRotatePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const r = props.image.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    drag = {
      kind: "rotate",
      startAngle: extractRotationDeg(props.image),
      centerX: cx,
      centerY: cy,
      initialMouseAngle: Math.atan2(e.clientY - cy, e.clientX - cx),
    };
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!drag) return;

    if (drag.kind === "resize") {
      // Keep grid visibility in sync with the Ctrl key state.
      setShowGrid(e.ctrlKey);

      const dX = e.clientX - drag.startX;
      const dY = e.clientY - drag.startY;
      let newW  = drag.startW;
      let newH  = drag.startH;
      let newMl = drag.startMl;
      let newMt = drag.startMt;

      // ── Base resize ────────────────────────────────────────────────────────
      if (drag.dx === 1) {
        newW = Math.max(20, drag.startW + dX);
      } else if (drag.dx === -1) {
        newW  = Math.max(20, drag.startW - dX);
        newMl = drag.startMl + (drag.startW - newW);
      }

      if (drag.dy === 1) {
        newH = Math.max(20, drag.startH + dY);
      } else if (drag.dy === -1) {
        newH  = Math.max(20, drag.startH - dY);
        newMt = drag.startMt + (drag.startH - newH);
      }

      // ── Proportional constraint (Shift) ────────────────────────────────────
      if (e.shiftKey) {
        const aspect = drag.startW / drag.startH;
        if (drag.dx !== 0 && drag.dy !== 0) {
          // Corner handle: the axis that moved more drives the uniform scale.
          const scale = Math.abs(dX) >= Math.abs(dY)
            ? newW / drag.startW
            : newH / drag.startH;
          newW = Math.max(20, drag.startW * scale);
          newH = Math.max(20, drag.startH * scale);
        } else if (drag.dx !== 0) {
          // Horizontal edge only: constrain height proportionally.
          newH = Math.max(20, newW / aspect);
        } else {
          // Vertical edge only: constrain width proportionally.
          newW = Math.max(20, newH * aspect);
        }
        // Recompute margins with the constrained dimensions.
        if (drag.dx === -1) newMl = drag.startMl + (drag.startW - newW);
        if (drag.dy === -1) newMt = drag.startMt + (drag.startH - newH);
      }

      // ── 10 px grid snapping (Ctrl) ─────────────────────────────────────────
      if (e.ctrlKey) {
        newW = Math.max(GRID_SIZE, Math.round(newW / GRID_SIZE) * GRID_SIZE);
        newH = Math.max(GRID_SIZE, Math.round(newH / GRID_SIZE) * GRID_SIZE);
        // Recompute margins with the snapped dimensions.
        if (drag.dx === -1) newMl = drag.startMl + (drag.startW - newW);
        if (drag.dy === -1) newMt = drag.startMt + (drag.startH - newH);
      }

      props.image.style.width  = `${newW}px`;
      props.image.style.height = `${newH}px`;
      if (drag.dx === -1) props.image.style.marginLeft = newMl !== 0 ? `${newMl}px` : "";
      if (drag.dy === -1) props.image.style.marginTop  = newMt !== 0 ? `${newMt}px` : "";
    } else {
      // ── Rotation ─────────────────────────────────────────────────────────────
      const currentAngle = Math.atan2(e.clientY - drag.centerY, e.clientX - drag.centerX);
      const deltaDeg = (currentAngle - drag.initialMouseAngle) * (180 / Math.PI);
      applyRotationDeg(props.image, drag.startAngle + deltaDeg);
    }

    refreshRect();
  };

  // ── Derived style (reactive) ─────────────────────────────────────────────

  const overlayStyle = () => {
    const r = rect();
    return (
      `position:fixed;` +
      `left:${r.left}px;top:${r.top}px;` +
      `width:${r.width}px;height:${r.height}px;` +
      `pointer-events:none;z-index:9999;box-sizing:border-box;overflow:visible;`
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Show when={showGrid()}>
        <canvas
          ref={(el) => { canvasRef = el; }}
          style="position:fixed;top:0;left:0;pointer-events:none;z-index:9998;"
        />
      </Show>

      <div data-monoscape-image-overlay="true" style={overlayStyle()}>

        {/* Blue selection border */}
        <div style="position:absolute;inset:0;border:2px solid #005fcc;box-sizing:border-box;pointer-events:none;" />

      {/* Antenna line — runs from the top edge of the overlay upward */}
        <div style={`position:absolute;left:calc(50% - 1px);top:${-ANTENNA_HEIGHT}px;width:2px;height:${ANTENNA_HEIGHT}px;background:#005fcc;pointer-events:none;`} />

        {/* Rotation circle handle — sits at the top of the antenna line */}
        <div
          data-monoscape-image-overlay="true"
          style={`position:absolute;left:calc(50% - ${ROTATION_RADIUS}px);top:${-ANTENNA_HEIGHT - ROTATION_RADIUS * 2}px;width:${ROTATION_RADIUS * 2}px;height:${ROTATION_RADIUS * 2}px;background:#fff;border:2px solid #005fcc;border-radius:50%;cursor:grab;pointer-events:all;box-sizing:border-box;`}
          onPointerDown={onRotatePointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        />

        {/* 8 resize handles */}
        <For each={HANDLE_DEFS}>
          {(h) => (
            <div
              data-monoscape-image-overlay="true"
              style={`position:absolute;left:calc(${h.xPct * 100}% - ${HALF_HANDLE}px);top:calc(${h.yPct * 100}% - ${HALF_HANDLE}px);width:${HANDLE_SIZE}px;height:${HANDLE_SIZE}px;background:#fff;border:2px solid #005fcc;border-radius:2px;cursor:${h.cursor};pointer-events:all;box-sizing:border-box;`}
              onPointerDown={(e) => onResizePointerDown(e, h.dx, h.dy)}
              onPointerMove={onPointerMove}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
            />
          )}
        </For>
      </div>
    </>
  );
}
