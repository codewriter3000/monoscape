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
