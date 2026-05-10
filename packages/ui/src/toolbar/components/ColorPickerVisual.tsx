import type { ColorPickerMode, NormalizedColor } from "@monoscape/document-core";
import { ColorWheel } from "./ColorWheel";
import { ColorPyramid } from "./ColorPyramid";

interface ColorPickerVisualProps {
  mode: Exclude<ColorPickerMode, "input">;
  color: NormalizedColor;
  onChange: (color: NormalizedColor) => void;
}

export function ColorPickerVisual(props: ColorPickerVisualProps) {
  return props.mode === "wheel" ? (
    <ColorWheel color={props.color} onChange={props.onChange} />
  ) : (
    <ColorPyramid color={props.color} onChange={props.onChange} />
  );
}
