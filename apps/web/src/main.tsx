import { render } from "solid-js/web";
import { App } from "./App";

const root = document.getElementById("app");

if (root instanceof HTMLElement) {
  render(() => <App />, root);
  requestAnimationFrame(() => {
    (window as Window & { __hideSplash?: () => void }).__hideSplash?.();
  });
}
