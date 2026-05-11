import { Switch, Match } from "solid-js";
import type { ColorPickerMode, NormalizedColor } from "@monoscape/document-core";
import { ColorWheel } from "./ColorWheel";
import { ColorPyramid } from "./ColorPyramid";
import { ColorSquare } from "./ColorSquare";

interface ColorPickerVisualProps {
  mode: ColorPickerMode;
  color: NormalizedColor;
  onChange: (color: NormalizedColor) => void;
}

export function ColorPickerVisual(props: ColorPickerVisualProps) {
  return (
    <Switch>
      <Match when={props.mode === "wheel"}>
        <ColorWheel color={props.color} onChange={props.onChange} />
      </Match>
      <Match when={props.mode === "pyramid"}>
        <ColorPyramid color={props.color} onChange={props.onChange} />
      </Match>
      <Match when={props.mode === "input"}>
        <ColorSquare color={props.color} onChange={props.onChange} />
      </Match>
    </Switch>
  );
}
