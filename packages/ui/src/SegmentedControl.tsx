// Reusable segmented control — renders a connected group of buttons where one option is active.
// Equivalent to a radio button group but styled as an inline toggle bar.

import { For, type JSX } from "solid-js";

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: JSX.Element;
  title?: string;
}

interface SegmentedControlProps<T extends string | number> {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** "connected" (default): buttons share borders, visually joined.
   *  "chip": each button has its own rounded border with a gap. */
  variant?: "connected" | "chip";
}

function buttonStyle(active: boolean, pos: "first" | "middle" | "last" | "only", variant: "connected" | "chip"): string {
  const activeColors = `border-color: #005fcc; background: #dce8ff; color: #005fcc; font-weight: 600;`;
  const idleColors = `border-color: #c3cad8; background: #f7f9fc; color: #172033; font-weight: 400;`;

  if (variant === "chip") {
    return (
      `flex: 1; padding: 5px 8px; border: 1px solid; border-radius: 5px;` +
      ` font-size: 0.7rem; cursor: pointer; outline: none; font-family: inherit;` +
      ` ${active ? activeColors : idleColors}`
    );
  }

  // connected variant — shared borders between adjacent buttons
  const radius = (() => {
    if (pos === "first") return "border-radius: 5px 0 0 5px;";
    if (pos === "last") return "border-radius: 0 5px 5px 0;";
    if (pos === "only") return "border-radius: 5px;";
    return "border-radius: 0;";
  })();
  const rightBorder = (pos === "last" || pos === "only") ? "" : " border-right-width: 0;";

  return (
    `flex: 1; padding: 5px 4px; border: 1px solid;` +
    ` font-size: 0.7rem; cursor: pointer; outline: none; font-family: inherit;` +
    ` ${active ? activeColors : idleColors}` +
    ` ${radius}${rightBorder}`
  );
}

export function SegmentedControl<T extends string | number>(props: SegmentedControlProps<T>): JSX.Element {
  const variant = () => props.variant ?? "connected";
  const gap = () => variant() === "chip" ? "gap: 4px;" : "";

  return (
    <div style={`display: flex; ${gap()}`}>
      <For each={props.options}>
        {(option, index) => {
          const pos = (): "first" | "middle" | "last" | "only" => {
            if (props.options.length === 1) return "only";
            if (index() === 0) return "first";
            if (index() === props.options.length - 1) return "last";
            return "middle";
          };

          return (
            <button
              type="button"
              title={option.title}
              style={buttonStyle(props.value === option.value, pos(), variant())}
              onClick={() => props.onChange(option.value)}
            >
              {option.label}
            </button>
          );
        }}
      </For>
    </div>
  );
}
