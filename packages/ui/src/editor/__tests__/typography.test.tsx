// Typography formatting tests (font family, size, mixed-state)

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  flushMicrotasks,
  renderEditor,
  selectRange
} from "./test-helpers";

describe("Typography formatting", () => {
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

  it("shows safe mixed-state typography controls for heterogeneous selections and resolves them after a keyboard size change", async () => {
    const { editor, fontButton, fontSizeInput, dispose } = renderEditor(host);

    editor.innerHTML = `
      <span style="font-family:Inter;font-size:12pt;">Alpha</span><span style="font-family:Caveat;font-size:18pt;">Beta</span>
    `;

    const firstText = editor.querySelector("span:first-of-type")?.firstChild;
    const secondText = editor.querySelector("span:last-of-type")?.firstChild;
    if (!firstText || !secondText) {
      throw new Error("Expected text nodes for mixed selection test.");
    }

    selectRange(firstText, 0, secondText, secondText.textContent?.length ?? 0);
    await flushMicrotasks();

    expect(fontButton().textContent).toContain("Mixed");
    expect(fontSizeInput().value).toBe("");
    expect(fontSizeInput().placeholder).toBe("Mixed");

    fontSizeInput().focus();
    fontSizeInput().value = "16";
    fontSizeInput().dispatchEvent(new InputEvent("input", { bubbles: true, data: "16" }));
    fontSizeInput().dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" })
    );
    await flushMicrotasks();

    const appliedSizes = Array.from(
      editor.querySelectorAll<HTMLSpanElement>('span[data-monoscape-typography="true"]')
    ).map((span) => span.style.fontSize);

    expect(appliedSizes).toEqual(["16pt", "16pt"]);
    expect(fontButton().textContent).toContain("Mixed");
    expect(fontSizeInput().value).toBe("16");

    dispose();
  });

  it("shows safe mixed-state layout controls for heterogeneous block selections", async () => {
    const { editor, lineSpacingInput, alignButtons, dispose } = renderEditor(host);

    editor.innerHTML =
      '<div style="font-size:16px;text-align:left;line-height:24px;">Alpha</div><div style="font-size:16px;text-align:center;line-height:32px;">Beta</div>';

    const firstText = editor.querySelector("div:first-of-type")?.firstChild;
    const secondText = editor.querySelector("div:last-of-type")?.firstChild;
    if (!firstText || !secondText) {
      throw new Error("Expected text nodes for mixed block selection test.");
    }

    selectRange(firstText, 0, secondText, secondText.textContent?.length ?? 0);
    await flushMicrotasks();

    expect(lineSpacingInput().value).toBe("");
    expect(lineSpacingInput().placeholder).toBe("Mixed");
    expect(alignButtons().every((button) => button.getAttribute("aria-pressed") === "false")).toBe(true);

    dispose();
  });

  it("updates font size and line spacing inputs when the collapsed caret moves", async () => {
    const { editor, fontSizeInput, lineSpacingInput, dispose } = renderEditor(host);

    editor.innerHTML =
      '<div style="line-height:1.5;"><span style="font-size:12pt;">Alpha</span></div>' +
      '<div style="line-height:2;"><span style="font-size:18pt;">Beta</span></div>';

    const firstText = editor.querySelector("div:first-of-type span")?.firstChild;
    const secondText = editor.querySelector("div:last-of-type span")?.firstChild;
    if (!firstText || !secondText) {
      throw new Error("Expected text nodes for collapsed-caret toolbar sync test.");
    }

    selectRange(firstText, 1, firstText, 1);
    await flushMicrotasks();

    expect(fontSizeInput().value).toBe("12");
    expect(lineSpacingInput().value).toBe("1.5");

    selectRange(secondText, 1, secondText, 1);
    await flushMicrotasks();

    expect(fontSizeInput().value).toBe("18");
    expect(lineSpacingInput().value).toBe("2");

    dispose();
  });

  it("keeps collapsed-caret typography active when typing resumes", async () => {
    const { editor, fontButton, fontSizeInput, dispose } = renderEditor(host);

    editor.innerHTML = "<span>Alpha</span>";

    const textNode = editor.querySelector("span")?.firstChild;
    if (!textNode) {
      throw new Error("Expected a text node for collapsed-caret formatting test.");
    }

    const caretOffset = textNode.textContent?.length ?? 0;
    selectRange(textNode, caretOffset, textNode, caretOffset);
    await flushMicrotasks();

    fontButton().click();
    await flushMicrotasks();

    const fontPanel = host.querySelector("#monoscape-font-panel");
    const interOption = Array.from(
      fontPanel?.querySelectorAll<HTMLButtonElement>('button[role="option"]') ?? []
    ).find((button) => button.textContent?.includes("Inter"));

    if (!interOption) {
      throw new Error("Expected Inter option in the font picker.");
    }

    interOption.click();
    await flushMicrotasks();

    fontSizeInput().focus();
    fontSizeInput().value = "16";
    fontSizeInput().dispatchEvent(new InputEvent("input", { bubbles: true, data: "16" }));
    fontSizeInput().dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" })
    );
    await flushMicrotasks();

    const typingSpan = editor.querySelector<HTMLSpanElement>('span[data-monoscape-typing="true"]');
    expect(typingSpan).toBeTruthy();
    expect(typingSpan?.style.fontFamily).toContain("Inter");
    expect(typingSpan?.style.fontSize).toBe("16pt");
    expect(document.getSelection()?.anchorNode).toBeInstanceOf(Text);
    expect((document.getSelection()?.anchorNode as Text | null)?.parentElement).toBe(typingSpan);

    const typedText = document.getSelection()?.anchorNode;
    if (!(typedText instanceof Text)) {
      throw new Error("Expected collapsed-caret formatting to seed a text insertion point.");
    }
    typedText.data = "Z";
    selectRange(typedText, 1, typedText, 1);
    editor.dispatchEvent(
      new InputEvent("input", { bubbles: true, data: "Z", inputType: "insertText" })
    );
    await flushMicrotasks();

    const persistedSpan = Array.from(
      editor.querySelectorAll<HTMLSpanElement>('span[data-monoscape-typography="true"]')
    ).find((span) => span.textContent === "Z");

    expect(persistedSpan).toBeTruthy();
    expect(persistedSpan?.style.fontFamily).toContain("Inter");
    expect(persistedSpan?.style.fontSize).toBe("16pt");

    dispose();
  });

  it("restores the richer font picker while keeping size and spacing as compact inputs", async () => {
    const { fontButton, fontSizeInput, lineSpacingInput, dispose } = renderEditor(host);

    fontButton().click();
    await flushMicrotasks();

    const fontPanel = host.querySelector('[role="dialog"][aria-label="Font picker"]');
    const fontSearch = host.querySelector<HTMLInputElement>('input[aria-label="Search available fonts"]');
    const fontFilter = host.querySelector<HTMLSelectElement>('select[aria-label="Filter fonts by category"]');
    const addFontsButton = host.querySelector<HTMLButtonElement>('button[aria-label="Add fonts"]');

    expect(fontPanel).not.toBeNull();
    expect(fontSearch).not.toBeNull();
    expect(fontFilter).not.toBeNull();
    expect(addFontsButton).not.toBeNull();
    expect(document.activeElement).toBe(fontSearch);
    expect(fontSizeInput().tagName).toBe("INPUT");
    expect(lineSpacingInput().tagName).toBe("INPUT");

    dispose();
  });
});
