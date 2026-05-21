// Design tokens are injected as a CSS side-effect when App.tsx imports themeExtension.
import { render } from "solid-js/web";
import { DesktopApp, desktopBootstrapPlan } from "./App";

const root = document.getElementById("app");

if (!(root instanceof HTMLElement)) {
  throw new Error("Desktop app root element was not found.");
}

render(DesktopApp, root);

requestAnimationFrame(() => {
  (window as Window & { __hideSplash?: () => void }).__hideSplash?.();
});

export { DesktopApp, desktopBootstrapPlan };
