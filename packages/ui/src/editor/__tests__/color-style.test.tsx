import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  dispatchDocumentKey,
  flushMicrotasks,
  renderEditor,
  renderEditorWithBoundaries,
  selectRange
} from "./test-helpers";

describe("Color and style controls", () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    Object.defineProperty(document, "queryCommandState", {
      configurable: true,
      value: vi.fn(() => false)
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => true)
    });
  });

  afterEach(() => {
    document.getSelection()?.removeAllRanges();
    host.remove();
    vi.restoreAllMocks();
  });

  it("renders wheel and pyramid pickers in the color panel", async () => {
    const { colorButton, dispose } = renderEditor(host);
    colorButton().click();
    await flushMicrotasks();

    const wheelButton = host.querySelector<HTMLButtonElement>(
      'button[data-picker-mode="wheel"]'
    );
    const pyramidButton = host.querySelector<HTMLButtonElement>(
      'button[data-picker-mode="pyramid"]'
    );

    pyramidButton?.click();
    await flushMicrotasks();
    const panel = host.querySelector('[data-color-picker-panel="true"]');
    expect(panel?.getAttribute("data-color-picker-mode")).toBe("pyramid");

    wheelButton?.click();
    await flushMicrotasks();
    expect(panel?.getAttribute("data-color-picker-mode")).toBe("wheel");

    dispose();
  });

  it("applies RGBA color and alpha to the selected text", async () => {
    const { editor, colorButton, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Alpha</span>";
    const textNode = editor.querySelector("span")?.firstChild;
    if (!textNode) throw new Error("Expected text node for color test.");

    selectRange(textNode, 0, textNode, textNode.textContent?.length ?? 0);
    await flushMicrotasks();

    colorButton().click();
    await flushMicrotasks();

    const redInput = host.querySelector<HTMLInputElement>('input[aria-label="Red channel (0-255)"]');
    const alphaInput = host.querySelector<HTMLInputElement>('input[aria-label="Alpha channel (0-1)"]');
    if (!redInput || !alphaInput) {
      throw new Error("Expected RGBA inputs.");
    }

    redInput.value = "128";
    redInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    alphaInput.value = "0.5";
    alphaInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await flushMicrotasks();

    const span =
      (editor.querySelector('span[data-monoscape-typography="true"]') as HTMLSpanElement) ??
      (editor.querySelector("span") as HTMLSpanElement);
    expect(getComputedStyle(span).color).toMatch(/rgba?\(128/);
    expect(span.style.color).toContain("rgba");

    dispose();
  });

  it("opens color and style panels with Alt keytips", async () => {
    const { editor, colorButton, styleButton, dispose } = renderEditor(host);
    editor.focus();

    dispatchDocumentKey("Alt");
    const colorEvent = dispatchDocumentKey("k", { altKey: true });
    await flushMicrotasks();
    expect(colorEvent.defaultPrevented).toBe(true);
    expect(host.querySelector("[data-color-picker-panel]")).not.toBeNull();

    colorButton().click();
    dispatchDocumentKey("Alt");
    const styleEvent = dispatchDocumentKey("y", { altKey: true });
    await flushMicrotasks();
    expect(styleEvent.defaultPrevented).toBe(true);
    expect(host.querySelector("[data-style-set-panel]")).not.toBeNull();
    styleButton().click();

    dispose();
  });

  it("applies APA block quote styling from the style presets", async () => {
    const { editor, styleButton, dispose } = renderEditor(host);
    editor.innerHTML = "<div>Quote</div>";
    const textNode = editor.querySelector("div")?.firstChild;
    if (!textNode) throw new Error("Expected block for style test.");

    selectRange(textNode, 0, textNode, textNode.textContent?.length ?? 0);
    await flushMicrotasks();

    styleButton().click();
    await flushMicrotasks();

    const blockquoteButton = Array.from(host.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent?.includes("Block Quote")
    );
    blockquoteButton?.click();
    await flushMicrotasks();

    const block = editor.querySelector("div") as HTMLDivElement;
    expect(block.style.paddingLeft).toBe("18pt");
    expect(block.style.fontFamily).toContain("Liberation Serif");

    dispose();
  });

  it("applies MLA heading styling from the style presets", async () => {
    const { editor, styleButton, dispose } = renderEditor(host);
    editor.innerHTML = "<div>Heading</div>";
    const textNode = editor.querySelector("div")?.firstChild;
    if (!textNode) throw new Error("Expected block for style test.");

    selectRange(textNode, 0, textNode, textNode.textContent?.length ?? 0);
    await flushMicrotasks();

    styleButton().click();
    await flushMicrotasks();

    const mlaButton = Array.from(host.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent?.trim() === "MLA"
    );
    mlaButton?.click();

    const headingButton = Array.from(host.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent?.includes("Heading 1")
    );
    headingButton?.click();
    await flushMicrotasks();

    const block = editor.querySelector("div") as HTMLDivElement;
    expect(block.style.fontFamily).toContain("Liberation Serif");
    expect(block.style.fontSize).toBe("12pt");

    dispose();
  });

  it("closes the color picker when clicking outside the dropdown", async () => {
    const { editor, colorButton, dispose } = renderEditor(host);
    colorButton().click();
    await flushMicrotasks();
    expect(host.querySelector("[data-color-picker-panel]")).not.toBeNull();

    editor.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await flushMicrotasks();
    expect(host.querySelector("[data-color-picker-panel]")).toBeNull();

    dispose();
  });

  it("exits the editor shell when tabbing from the color trigger", async () => {
    const { after, colorButton, dispose } = renderEditorWithBoundaries(host);
    colorButton().focus();
    colorButton().dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Tab" })
    );
    await flushMicrotasks();
    expect(document.activeElement).toBe(after);
    dispose();
  });
});
