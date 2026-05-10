import { render } from "solid-js/web";
import { DesktopApp, desktopBootstrapPlan } from "./App";

const root = document.getElementById("app");

if (!(root instanceof HTMLElement)) {
  throw new Error("Desktop app root element was not found.");
}

render(DesktopApp, root);

export { DesktopApp, desktopBootstrapPlan };
