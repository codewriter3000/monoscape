// Keyboard navigation and shortcut tests

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  dispatchDocumentKey,
  dispatchEditorKey,
  flushMicrotasks,
  renderEditor,
  renderEditorWithBoundaries,
  selectRange,
  sequentialFocusTargets
} from "./test-helpers";

describe("Keyboard flow", () => {
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

  it("keeps browser undo redo copy paste shortcuts alone and lets Escape move focus back to the toolbar", async () => {
    const { editor, fontButton, dispose } = renderEditor(host);

    editor.innerHTML = '<span style="font-family:Inter;">Alpha</span><br><span>Beta</span>';
    const firstText = editor.querySelector("span")?.firstChild;
    const secondText = editor.querySelectorAll("span")[1]?.firstChild;
    if (!firstText || !secondText) {
      throw new Error("Expected text nodes for keyboard boundary test.");
    }

    selectRange(firstText, 0, secondText, secondText.textContent?.length ?? 0);
    await flushMicrotasks();

    expect(dispatchEditorKey(editor, "z", { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(dispatchEditorKey(editor, "y", { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(dispatchEditorKey(editor, "c", { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(dispatchEditorKey(editor, "v", { ctrlKey: true }).defaultPrevented).toBe(false);

    const tabEvent = dispatchEditorKey(editor, "Tab");
    await flushMicrotasks();
    expect(tabEvent.defaultPrevented).toBe(true);
    expect((editor.innerHTML.match(/\t/g) ?? [])).toHaveLength(2);
    expect(editor.querySelector("span")?.style.fontFamily).toContain("Inter");

    const shiftTabEvent = dispatchEditorKey(editor, "Tab", { shiftKey: true });
    await flushMicrotasks();
    expect(shiftTabEvent.defaultPrevented).toBe(true);
    expect(editor.innerHTML).toBe('<span style="font-family:Inter;">Alpha</span><br><span>Beta</span>');

    const indentEvent = dispatchEditorKey(editor, "]", { ctrlKey: true, code: "BracketRight" });
    await flushMicrotasks();
    expect(indentEvent.defaultPrevented).toBe(true);
    expect(editor.innerHTML).toContain("\t");

    const outdentEvent = dispatchEditorKey(editor, "[", { ctrlKey: true, code: "BracketLeft" });
    await flushMicrotasks();
    expect(outdentEvent.defaultPrevented).toBe(true);
    expect(editor.innerHTML).not.toContain("\t");

    editor.focus();
    const escapeEvent = dispatchEditorKey(editor, "Escape");
    await flushMicrotasks();
    expect(escapeEvent.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(fontButton());

    dispose();
  });

  it("applies Ctrl+B, Ctrl+I, and Ctrl+U inside the editor without leaking to the browser", async () => {
    const { editor, dispose } = renderEditor(host);

    editor.innerHTML = "<span>Alpha</span>";
    const textNode = editor.querySelector("span")?.firstChild;
    if (!textNode) {
      throw new Error("Expected a text node for inline shortcut test.");
    }

    selectRange(textNode, 0, textNode, textNode.textContent?.length ?? 0);
    await flushMicrotasks();

    const boldEvent = dispatchEditorKey(editor, "b", { ctrlKey: true });
    const italicEvent = dispatchEditorKey(editor, "i", { ctrlKey: true });
    const underlineEvent = dispatchEditorKey(editor, "u", { ctrlKey: true });
    await flushMicrotasks();

    expect(boldEvent.defaultPrevented).toBe(true);
    expect(italicEvent.defaultPrevented).toBe(true);
    expect(underlineEvent.defaultPrevented).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith("bold");
    expect(document.execCommand).toHaveBeenCalledWith("italic");
    expect(document.execCommand).toHaveBeenCalledWith("underline");

    dispose();
  });

  it("syncs the caret page after Ctrl+Enter inserts a hard page break", async () => {
    const onCursorPageChange = vi.fn();
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView
    });

    const { editor, dispose } = renderEditor(host, { onCursorPageChange });

    editor.innerHTML = "<p>Alpha</p>";
    Object.defineProperty(editor, "getBoundingClientRect", {
      configurable: true,
      value: vi.fn(() => new DOMRect(0, 100, 0, 2112))
    });

    const initialBlock = editor.querySelector("p");
    const textNode = initialBlock?.firstChild;
    if (!(initialBlock instanceof HTMLParagraphElement) || !textNode) {
      throw new Error("Expected an initial paragraph for the page break test.");
    }

    Object.defineProperty(initialBlock, "getBoundingClientRect", {
      configurable: true,
      value: vi.fn(() => new DOMRect(0, 180, 0, 880))
    });

    (document.execCommand as ReturnType<typeof vi.fn>).mockImplementation((command: string) => {
      const sel = document.getSelection();
      if (!sel?.rangeCount) {
        return true;
      }

      if (command !== "insertParagraph") {
        return true;
      }

      const currentBlock = editor.querySelector("p:last-of-type");
      if (!(currentBlock instanceof HTMLParagraphElement)) {
        return true;
      }

      const newBlock = document.createElement("p");
      newBlock.appendChild(document.createElement("br"));
      Object.defineProperty(newBlock, "getBoundingClientRect", {
        configurable: true,
        value: vi.fn(() => new DOMRect(0, 1220, 0, 24))
      });

      currentBlock.after(newBlock);

      const newRange = document.createRange();
      newRange.setStart(newBlock, 0);
      newRange.collapse(true);
      Object.defineProperty(newRange, "getClientRects", {
        configurable: true,
        value: vi.fn(() => [new DOMRect(0, 180, 0, 0)])
      });
      Object.defineProperty(newRange, "getBoundingClientRect", {
        configurable: true,
        value: vi.fn(() => new DOMRect(0, 180, 0, 0))
      });
      sel.removeAllRanges();
      sel.addRange(newRange);
      document.dispatchEvent(new Event("selectionchange"));
      return true;
    });

    selectRange(textNode, textNode.textContent?.length ?? 0, textNode, textNode.textContent?.length ?? 0);
    await flushMicrotasks();

    const pageBreakEvent = dispatchEditorKey(editor, "Enter", { ctrlKey: true });
    await flushMicrotasks();
    await flushMicrotasks();

    expect(pageBreakEvent.defaultPrevented).toBe(true);
    expect(onCursorPageChange).toHaveBeenLastCalledWith(2);
    expect(scrollIntoView).toHaveBeenCalled();

    dispose();
  });

  it("keeps the ruler rail pinned while moving the current-page marker", async () => {
    const { editor, dispose } = renderEditor(host);

    editor.innerHTML = "<p>Alpha</p><p>Beta</p>";
    Object.defineProperty(editor, "getBoundingClientRect", {
      configurable: true,
      value: vi.fn(() => new DOMRect(0, 100, 0, 2112))
    });

    const blocks = editor.querySelectorAll("p");
    const secondText = blocks[1]?.firstChild;
    if (!(blocks[0] instanceof HTMLParagraphElement) || !(blocks[1] instanceof HTMLParagraphElement) || !secondText) {
      throw new Error("Expected paragraphs for the ruler rail test.");
    }

    Object.defineProperty(blocks[0], "getBoundingClientRect", {
      configurable: true,
      value: vi.fn(() => new DOMRect(0, 180, 0, 24))
    });
    Object.defineProperty(blocks[1], "getBoundingClientRect", {
      configurable: true,
      value: vi.fn(() => new DOMRect(0, 1220, 0, 24))
    });

    selectRange(secondText, 0, secondText, 0);
    await flushMicrotasks();

    const wrap = host.querySelector(".monoscape-ruler-v-wrap");
    const current = host.querySelector(".monoscape-ruler-v-current");
    if (!(wrap instanceof HTMLDivElement) || !(current instanceof HTMLDivElement)) {
      throw new Error("Expected vertical ruler elements.");
    }

    expect(wrap.style.top).toBe("24px");
    expect(current.style.transform).toBe("translateY(1056px)");

    dispose();
  });

  it("collapses trailing empty hard-break pages after input-driven deletions", async () => {
    vi.useFakeTimers();

    const onPageCountChange = vi.fn();
    const { editor, dispose } = renderEditor(host, { onPageCountChange });

    editor.innerHTML = [
      "<p>Alpha</p>",
      '<div class="monoscape-page-break-spacer" style="height: 920px;"><br></div>',
      "<p><br></p>",
      '<div class="monoscape-page-break-spacer" style="height: 920px;"><br></div>',
      "<p><br></p>"
    ].join("");

    Object.defineProperty(editor, "scrollHeight", {
      configurable: true,
      get: () => (editor.querySelector(".monoscape-page-break-spacer") ? 3 * 1056 : 1056)
    });
    Object.defineProperty(editor, "getBoundingClientRect", {
      configurable: true,
      value: vi.fn(() => new DOMRect(0, 100, 0, 3168))
    });

    const firstBlock = editor.querySelector("p");
    const firstText = firstBlock?.firstChild;
    if (!(firstBlock instanceof HTMLParagraphElement) || !firstText) {
      throw new Error("Expected a first paragraph for the trailing-page cleanup test.");
    }

    Object.defineProperty(firstBlock, "getBoundingClientRect", {
      configurable: true,
      value: vi.fn(() => new DOMRect(0, 180, 0, 24))
    });

    selectRange(firstText, firstText.textContent?.length ?? 0, firstText, firstText.textContent?.length ?? 0);
    await flushMicrotasks();

    editor.dispatchEvent(new Event("input", { bubbles: true }));
    await flushMicrotasks();
    vi.advanceTimersByTime(80);
    await flushMicrotasks();

    expect(editor.querySelector(".monoscape-page-break-spacer")).toBeNull();
    expect(editor.querySelectorAll("p")).toHaveLength(1);
    expect(onPageCountChange).toHaveBeenLastCalledWith(1);

    vi.useRealTimers();
    dispose();
  });

  it("keeps ordinary trailing blank paragraphs when no hard page break exists", async () => {
    const { editor, dispose } = renderEditor(host);

    editor.innerHTML = "<p>Alpha</p><p><br></p>";
    Object.defineProperty(editor, "getBoundingClientRect", {
      configurable: true,
      value: vi.fn(() => new DOMRect(0, 100, 0, 1056))
    });

    const firstBlock = editor.querySelector("p");
    const firstText = firstBlock?.firstChild;
    if (!(firstBlock instanceof HTMLParagraphElement) || !firstText) {
      throw new Error("Expected a first paragraph for the blank-paragraph preservation test.");
    }

    Object.defineProperty(firstBlock, "getBoundingClientRect", {
      configurable: true,
      value: vi.fn(() => new DOMRect(0, 180, 0, 24))
    });

    selectRange(firstText, 0, firstText, 0);
    await flushMicrotasks();

    editor.dispatchEvent(new Event("input", { bubbles: true }));
    await flushMicrotasks();

    expect(editor.querySelectorAll("p")).toHaveLength(2);
    expect(editor.querySelector(".monoscape-page-break-spacer")).toBeNull();

    dispose();
  });

  it("collapses a trailing hard-break page with a single Backspace", async () => {
    vi.useFakeTimers();

    const onPageCountChange = vi.fn();
    const onCursorPageChange = vi.fn();
    const { editor, dispose } = renderEditor(host, { onPageCountChange, onCursorPageChange });

    editor.innerHTML = [
      "<p>Alpha</p>",
      '<div class="monoscape-page-break-spacer" style="height: 920px;"><br></div>',
      "<p><br></p>"
    ].join("");

    Object.defineProperty(editor, "scrollHeight", {
      configurable: true,
      get: () => (editor.querySelector(".monoscape-page-break-spacer") ? 2 * 1056 : 1056)
    });
    Object.defineProperty(editor, "getBoundingClientRect", {
      configurable: true,
      value: vi.fn(() => new DOMRect(0, 100, 0, 2112))
    });

    const blocks = editor.querySelectorAll("p");
    const firstText = blocks[0]?.firstChild;
    if (!(blocks[0] instanceof HTMLParagraphElement) || !(blocks[1] instanceof HTMLParagraphElement) || !firstText) {
      throw new Error("Expected paragraphs for the single-Backspace page-collapse test.");
    }

    Object.defineProperty(blocks[0], "getBoundingClientRect", {
      configurable: true,
      value: vi.fn(() => new DOMRect(0, 180, 0, 24))
    });
    Object.defineProperty(blocks[1], "getBoundingClientRect", {
      configurable: true,
      value: vi.fn(() => new DOMRect(0, 1220, 0, 24))
    });

    const trailingRange = document.createRange();
    trailingRange.setStart(blocks[1], 0);
    trailingRange.collapse(true);
    document.getSelection()?.removeAllRanges();
    document.getSelection()?.addRange(trailingRange);
    document.dispatchEvent(new Event("selectionchange"));
    await flushMicrotasks();

    const backspaceEvent = dispatchEditorKey(editor, "Backspace");
    await flushMicrotasks();
    vi.advanceTimersByTime(80);
    await flushMicrotasks();

    expect(backspaceEvent.defaultPrevented).toBe(true);
    expect(editor.querySelector(".monoscape-page-break-spacer")).toBeNull();
    expect(editor.querySelectorAll("p")).toHaveLength(1);
    expect(onPageCountChange).toHaveBeenLastCalledWith(1);
    expect(onCursorPageChange).toHaveBeenLastCalledWith(1);
    expect(blocks[0].contains(document.getSelection()?.anchorNode ?? null)).toBe(true);

    vi.useRealTimers();
    dispose();
  });

  it("treats partial multi-line selections as whole-line indent and outdent operations", async () => {
    const { editor, dispose } = renderEditor(host);

    editor.innerHTML = "<span>Alpha</span><br><span>Beta</span><br><span>Gamma</span>";
    const spans = editor.querySelectorAll("span");
    const firstText = spans[0]?.firstChild;
    const secondText = spans[1]?.firstChild;
    if (!firstText || !secondText) {
      throw new Error("Expected text nodes for partial-line indentation test.");
    }

    selectRange(firstText, 2, secondText, 2);
    await flushMicrotasks();

    const indentEvent = dispatchEditorKey(editor, "Tab");
    await flushMicrotasks();
    expect(indentEvent.defaultPrevented).toBe(true);
    expect(editor.innerHTML).toBe("<span>\tAlpha</span><br><span>\tBeta</span><br><span>Gamma</span>");

    const outdentEvent = dispatchEditorKey(editor, "Tab", { shiftKey: true });
    await flushMicrotasks();
    expect(outdentEvent.defaultPrevented).toBe(true);
    expect(editor.innerHTML).toBe("<span>Alpha</span><br><span>Beta</span><br><span>Gamma</span>");

    dispose();
  });

  it("reveals Alt keytips and lets Alt shortcuts reach toolbar controls without putting them in the Tab order", async () => {
    const { editor, fontSizeInput, styleButtons, dispose } = renderEditor(host);
    const buttons = styleButtons();
    const boldButton = buttons.find((button) => button.dataset.toolbarButtonId === "bold");
    const lastButton = buttons.find((button) => button.dataset.toolbarButtonId === "ordered-list");

    if (!boldButton || !lastButton) {
      throw new Error("Expected toolbar buttons for keyboard navigation test.");
    }

    editor.focus();
    expect(dispatchDocumentKey("Alt").defaultPrevented).toBe(true);
    expect(host.querySelectorAll("[data-toolbar-keytip]").length).toBeGreaterThanOrEqual(15);

    const altBoldEvent = dispatchDocumentKey("b", { altKey: true });
    await flushMicrotasks();
    expect(altBoldEvent.defaultPrevented).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith("bold");
    expect(document.activeElement).toBe(editor);

    dispatchDocumentKey("Alt");
    const altSizeEvent = dispatchDocumentKey("s", { altKey: true });
    await flushMicrotasks();
    expect(altSizeEvent.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(fontSizeInput());
    expect(fontSizeInput().tabIndex).toBe(-1);

    boldButton.focus();
    boldButton.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "End" })
    );
    expect(document.activeElement).toBe(lastButton);

    lastButton.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" })
    );
    await flushMicrotasks();

    expect(document.activeElement).toBe(editor);

    dispose();
  });

  it("keeps plain Tab on document flow while Escape and Alt provide non-trapping toolbar access", async () => {
    const { before, after, editor, fontButton, fontSizeInput, styleButtons, dispose } = renderEditorWithBoundaries(host);
    const toolbarButtons = styleButtons();
    const boldButton = toolbarButtons.find((button) => button.dataset.toolbarButtonId === "bold");

    if (!boldButton) {
      throw new Error("Expected bold button for keyboard boundary proof.");
    }

    expect(fontButton().tabIndex).toBe(-1);
    expect(fontSizeInput().tabIndex).toBe(-1);
    expect(toolbarButtons.every((button) => button.tabIndex === -1)).toBe(true);

    const focusOrder = sequentialFocusTargets(host);
    expect(focusOrder).toContain(editor);
    expect(focusOrder.indexOf(before)).toBeLessThan(focusOrder.indexOf(editor));
    expect(focusOrder.indexOf(editor)).toBeLessThan(focusOrder.indexOf(after));
    expect(focusOrder).not.toContain(fontButton());
    expect(toolbarButtons.every((button) => !focusOrder.includes(button))).toBe(true);

    focusOrder[focusOrder.indexOf(before) + 1]?.focus();
    expect(document.activeElement).toBe(editor);

    editor.innerHTML = "<span>Alpha</span><br><span>Beta</span>";
    const spans = editor.querySelectorAll("span");
    const firstText = spans[0]?.firstChild;
    const secondText = spans[1]?.firstChild;
    if (!firstText || !secondText) {
      throw new Error("Expected text nodes for end-to-end keyboard proof.");
    }

    selectRange(firstText, 0, secondText, secondText.textContent?.length ?? 0);
    await flushMicrotasks();

    const indentEvent = dispatchEditorKey(editor, "Tab");
    await flushMicrotasks();
    expect(indentEvent.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(editor);
    expect(editor.innerHTML).toContain("\t");
    expect(document.activeElement).not.toBe(fontButton());

    const outdentEvent = dispatchEditorKey(editor, "Tab", { shiftKey: true });
    await flushMicrotasks();
    expect(outdentEvent.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(editor);
    expect(editor.innerHTML).toBe("<span>Alpha</span><br><span>Beta</span>");

    dispatchEditorKey(editor, "Escape");
    await flushMicrotasks();
    expect(document.activeElement).toBe(fontButton());

    fontButton().dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Tab", shiftKey: true })
    );
    await flushMicrotasks();
    expect(document.activeElement).toBe(before);

    editor.focus();
    dispatchDocumentKey("Alt");
    const altSizeEvent = dispatchDocumentKey("s", { altKey: true });
    await flushMicrotasks();
    expect(altSizeEvent.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(fontSizeInput());

    fontSizeInput().dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Tab" })
    );
    await flushMicrotasks();
    expect(document.activeElement).toBe(after);

    editor.focus();
    dispatchDocumentKey("Alt");
    const altBoldEvent = dispatchDocumentKey("b", { altKey: true });
    await flushMicrotasks();
    expect(altBoldEvent.defaultPrevented).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith("bold");
    expect(document.activeElement).toBe(editor);

    dispose();
  });
});
