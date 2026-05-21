// Icon insertion and color utilities

import { normalizeColor, formatColorForCss } from "@monoscape/document-core";
import type { NormalizedColor } from "@monoscape/document-core";

// ── Icon span detection ────────────────────────────────────────────────────

/**
 * Returns the icon span that wholly contains the current selection, or null.
 *
 * Handles three scenarios produced by browsers for contenteditable="false" spans:
 *  1. Cursor inside the span's subtree (rare but guarded).
 *  2. Cursor adjacent to the span – browser places caret in the PARENT element at
 *     an offset index pointing to the span (before it) or one past it (after it).
 *  3. Span selected as a node – range from parent[N] to parent[N+1].
 */
export function getIconSpanAtRange(range: Range | null): HTMLSpanElement | null {
  if (!range) return null;
  const { startContainer, startOffset, endContainer, endOffset } = range;

  // ── Case 1: cursor/selection is inside the span's own subtree ────────────
  const startEl =
    startContainer instanceof Element ? startContainer : startContainer.parentElement;
  const iconFromStart = startEl?.closest<HTMLSpanElement>("[data-monoscape-icon]");
  if (iconFromStart) {
    if (range.collapsed) return iconFromStart;
    const endEl =
      endContainer instanceof Element ? endContainer : endContainer.parentElement;
    const endSpan = endEl?.closest<HTMLSpanElement>("[data-monoscape-icon]");
    return iconFromStart === endSpan ? iconFromStart : null;
  }

  // ── Cases 2 & 3: cursor/selection in the PARENT, offset pointing to span ─
  // Check childNodes[offset] (cursor before span) and childNodes[offset-1] (cursor after span).
  const findIconAt = (container: Node, offset: number): HTMLSpanElement | null => {
    if (!(container instanceof Element)) return null;
    for (const idx of [offset, offset - 1]) {
      if (idx >= 0 && idx < container.childNodes.length) {
        const node = container.childNodes[idx];
        if (node instanceof HTMLSpanElement && "monoscapeIcon" in node.dataset) {
          return node;
        }
      }
    }
    return null;
  };

  const spanAtStart = findIconAt(startContainer, startOffset);
  if (!spanAtStart) return null;
  if (range.collapsed) return spanAtStart;

  // Non-collapsed: both endpoints must refer to the same span
  const spanAtEnd = findIconAt(endContainer, endOffset);
  return spanAtEnd === spanAtStart ? spanAtStart : null;
}

// ── Color reading ──────────────────────────────────────────────────────────

/**
 * Read the current display color of an icon span.
 * Carbon icons use fill="currentColor", so the CSS `color` property drives rendering.
 * For custom icons with explicit fills, we read the first explicit fill value.
 */
export function getIconColor(iconSpan: HTMLSpanElement): NormalizedColor | null {
  // Prefer the inline color if set explicitly
  if (iconSpan.style.color) {
    const n = normalizeColor(iconSpan.style.color);
    if (n) return n;
  }

  // Fall back to the SVG's explicit fill attribute on the root svg element
  const svgEl = iconSpan.querySelector<SVGSVGElement>("svg");
  if (svgEl) {
    const fill = svgEl.getAttribute("fill");
    if (fill && fill !== "currentColor" && fill !== "none") {
      const n = normalizeColor(fill);
      if (n) return n;
    }
  }

  // Fall back to computed color (may include default black)
  const computed = getComputedStyle(iconSpan).color;
  return normalizeColor(computed);
}

// ── Color writing ──────────────────────────────────────────────────────────

/**
 * Apply a color to an icon span.
 * Sets CSS `color` so fill="currentColor" SVGs inherit it.
 * Also updates any explicit fill/stroke attributes for multi-fill custom SVGs.
 */
export function applyColorToIconSpan(
  iconSpan: HTMLSpanElement,
  color: NormalizedColor | null
): void {
  if (color === null) {
    iconSpan.style.removeProperty("color");
    return;
  }

  const cssColor = formatColorForCss(color);
  iconSpan.style.color = cssColor;

  // Also rewrite explicit fill attributes so custom SVGs (non-currentColor) update too
  const svgEl = iconSpan.querySelector<SVGSVGElement>("svg");
  if (!svgEl) return;

  const filledEls = svgEl.querySelectorAll<SVGElement>("[fill]:not([fill='none'])");
  for (const el of Array.from(filledEls)) {
    const v = el.getAttribute("fill");
    if (v && v !== "currentColor") {
      el.setAttribute("fill", cssColor);
    }
  }
  const strokedEls = svgEl.querySelectorAll<SVGElement>("[stroke]:not([stroke='none'])");
  for (const el of Array.from(strokedEls)) {
    const v = el.getAttribute("stroke");
    if (v && v !== "currentColor") {
      el.setAttribute("stroke", cssColor);
    }
  }
  // Handle inline fill/stroke styles in <style> or style attributes on paths
  for (const el of Array.from(svgEl.querySelectorAll<SVGElement>("[style]"))) {
    if (el.style.fill && el.style.fill !== "none" && el.style.fill !== "currentColor") {
      el.style.fill = cssColor;
    }
    if (el.style.stroke && el.style.stroke !== "none" && el.style.stroke !== "currentColor") {
      el.style.stroke = cssColor;
    }
  }
}

// ── Single-color detection ─────────────────────────────────────────────────

/**
 * Returns true if the SVG uses at most one unique non-none color
 * (or only currentColor / no explicit colors), making it safe to recolor.
 */
export function isSingleColorSvg(svgString: string): boolean {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    if (doc.querySelector("parseerror, parsererror")) return false;

    const svgEl = doc.querySelector("svg");
    if (!svgEl) return false;

    const colors = new Set<string>();

    const collectColor = (val: string | null) => {
      if (!val) return;
      const norm = val.trim().toLowerCase();
      if (norm === "none" || norm === "currentcolor" || norm === "inherit") return;
      colors.add(norm);
    };

    for (const el of Array.from(svgEl.querySelectorAll("*"))) {
      collectColor((el as SVGElement).getAttribute("fill"));
      collectColor((el as SVGElement).getAttribute("stroke"));
      const s = (el as HTMLElement).style;
      if (s) {
        collectColor(s.fill || null);
        collectColor(s.stroke || null);
      }
    }

    // Root svg fill
    collectColor(svgEl.getAttribute("fill"));

    return colors.size <= 1;
  } catch {
    return false;
  }
}

// ── SVG preparation for insertion ─────────────────────────────────────────

/**
 * Build a DOM-parsed <svg> element ready for insertion.
 * Ensures fill="currentColor" is present if the SVG is single-color.
 * Returns null on parse failure.
 */
export function buildInsertableSvgElement(
  svgString: string
): SVGSVGElement | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    if (doc.querySelector("parseerror, parsererror")) return null;

    const svgEl = doc.querySelector<SVGSVGElement>("svg");
    if (!svgEl) return null;

    // For single-color SVGs, ensure root fill is currentColor so CSS color drives it
    if (isSingleColorSvg(svgString)) {
      svgEl.setAttribute("fill", "currentColor");
    }

    // Ensure proper sizing attributes for inline display
    svgEl.style.cssText = "width:100%;height:100%;display:block;";
    return svgEl;
  } catch {
    return null;
  }
}
