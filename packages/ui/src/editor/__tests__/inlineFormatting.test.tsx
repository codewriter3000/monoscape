// Comprehensive inline formatting tests
// Covers Bold, Italic, Underline, Strikethrough, Superscript, and Subscript
// via keyboard shortcuts (Ctrl and Alt), direct toolbar button clicks,
// aria-pressed state reflection, and complex multi-toggle sequences.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  dispatchDocumentKey,
  dispatchEditorKey,
  dispatchSelectionChange,
  flushMicrotasks,
  renderEditor,
  selectRange
} from "./test-helpers";

// Helper: find a toolbar button by its data-toolbar-button-id
function getFormatButton(host: HTMLElement, id: string): HTMLButtonElement | null {
  return host.querySelector<HTMLButtonElement>(`button[data-toolbar-button-id="${id}"]`);
}

// Helper: true when the button is aria-pressed="true"
function isPressed(button: HTMLButtonElement | null): boolean {
  return button?.getAttribute("aria-pressed") === "true";
}

describe("Inline formatting — keyboard shortcuts", () => {
  let host: HTMLDivElement;
  let execCommandSpy: ReturnType<typeof vi.fn>;
  let queryCommandStateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    execCommandSpy = vi.fn(() => true);
    queryCommandStateSpy = vi.fn(() => false);
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommandSpy });
    Object.defineProperty(document, "queryCommandState", { configurable: true, value: queryCommandStateSpy });
  });

  afterEach(() => {
    document.getSelection()?.removeAllRanges();
    host.remove();
    vi.restoreAllMocks();
  });

  it("Ctrl+B applies bold and prevents browser default", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    const event = dispatchEditorKey(editor, "b", { ctrlKey: true });
    await flushMicrotasks();

    expect(event.defaultPrevented).toBe(true);
    expect(execCommandSpy).toHaveBeenCalledWith("bold");
    dispose();
  });

  it("Ctrl+I applies italic and prevents browser default", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    const event = dispatchEditorKey(editor, "i", { ctrlKey: true });
    await flushMicrotasks();

    expect(event.defaultPrevented).toBe(true);
    expect(execCommandSpy).toHaveBeenCalledWith("italic");
    dispose();
  });

  it("Ctrl+U applies underline and prevents browser default", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    const event = dispatchEditorKey(editor, "u", { ctrlKey: true });
    await flushMicrotasks();

    expect(event.defaultPrevented).toBe(true);
    expect(execCommandSpy).toHaveBeenCalledWith("underline");
    dispose();
  });

  it("Ctrl+Shift+X applies strikethrough and prevents browser default", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    const event = dispatchEditorKey(editor, "x", { ctrlKey: true, shiftKey: true });
    await flushMicrotasks();

    expect(event.defaultPrevented).toBe(true);
    expect(execCommandSpy).toHaveBeenCalledWith("strikeThrough");
    dispose();
  });

  it("Ctrl+. applies superscript and prevents browser default", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    const event = dispatchEditorKey(editor, ".", { ctrlKey: true });
    await flushMicrotasks();

    expect(event.defaultPrevented).toBe(true);
    expect(execCommandSpy).toHaveBeenCalledWith("superscript");
    dispose();
  });

  it("Ctrl+, applies subscript and prevents browser default", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    const event = dispatchEditorKey(editor, ",", { ctrlKey: true });
    await flushMicrotasks();

    expect(event.defaultPrevented).toBe(true);
    expect(execCommandSpy).toHaveBeenCalledWith("subscript");
    dispose();
  });

  it("does NOT trigger bold when Shift is held (Ctrl+Shift+B is not a formatting shortcut)", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    const event = dispatchEditorKey(editor, "b", { ctrlKey: true, shiftKey: true });
    await flushMicrotasks();

    expect(event.defaultPrevented).toBe(false);
    expect(execCommandSpy).not.toHaveBeenCalledWith("bold");
    dispose();
  });

  it("does NOT trigger shortcuts when Alt is also held (avoids keytip collision)", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    const boldAltEvent = dispatchEditorKey(editor, "b", { ctrlKey: true, altKey: true });
    expect(boldAltEvent.defaultPrevented).toBe(false);
    expect(execCommandSpy).not.toHaveBeenCalledWith("bold");

    const strikeAltEvent = dispatchEditorKey(editor, "x", { ctrlKey: true, shiftKey: true, altKey: true });
    expect(strikeAltEvent.defaultPrevented).toBe(false);
    dispose();
  });

  it("applies multiple formatting shortcuts in sequence without interference", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    const textNode = editor.querySelector("span")!.firstChild!;
    selectRange(textNode, 0, textNode, 5);
    await flushMicrotasks();

    dispatchEditorKey(editor, "b", { ctrlKey: true });
    dispatchEditorKey(editor, "i", { ctrlKey: true });
    dispatchEditorKey(editor, "x", { ctrlKey: true, shiftKey: true });
    await flushMicrotasks();

    expect(execCommandSpy).toHaveBeenCalledWith("bold");
    expect(execCommandSpy).toHaveBeenCalledWith("italic");
    expect(execCommandSpy).toHaveBeenCalledWith("strikeThrough");
    dispose();
  });
});

describe("Inline formatting — toolbar button clicks", () => {
  let host: HTMLDivElement;
  let execCommandSpy: ReturnType<typeof vi.fn>;
  let queryCommandStateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    execCommandSpy = vi.fn(() => true);
    queryCommandStateSpy = vi.fn(() => false);
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommandSpy });
    Object.defineProperty(document, "queryCommandState", { configurable: true, value: queryCommandStateSpy });
  });

  afterEach(() => {
    document.getSelection()?.removeAllRanges();
    host.remove();
    vi.restoreAllMocks();
  });

  it("clicking Bold button calls execCommand('bold')", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    getFormatButton(host, "bold")!.click();
    await flushMicrotasks();

    expect(execCommandSpy).toHaveBeenCalledWith("bold");
    dispose();
  });

  it("clicking Italic button calls execCommand('italic')", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    getFormatButton(host, "italic")!.click();
    await flushMicrotasks();

    expect(execCommandSpy).toHaveBeenCalledWith("italic");
    dispose();
  });

  it("clicking Underline button calls execCommand('underline')", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    getFormatButton(host, "underline")!.click();
    await flushMicrotasks();

    expect(execCommandSpy).toHaveBeenCalledWith("underline");
    dispose();
  });

  it("clicking Strikethrough button calls execCommand('strikeThrough')", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    getFormatButton(host, "strikethrough")!.click();
    await flushMicrotasks();

    expect(execCommandSpy).toHaveBeenCalledWith("strikeThrough");
    dispose();
  });

  it("clicking Superscript button calls execCommand('superscript')", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    getFormatButton(host, "superscript")!.click();
    await flushMicrotasks();

    expect(execCommandSpy).toHaveBeenCalledWith("superscript");
    dispose();
  });

  it("clicking Subscript button calls execCommand('subscript')", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    getFormatButton(host, "subscript")!.click();
    await flushMicrotasks();

    expect(execCommandSpy).toHaveBeenCalledWith("subscript");
    dispose();
  });
});

describe("Inline formatting — aria-pressed state reflects queryCommandState", () => {
  let host: HTMLDivElement;
  let queryCommandStateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    queryCommandStateSpy = vi.fn(() => false);
    Object.defineProperty(document, "execCommand", { configurable: true, value: vi.fn(() => true) });
    Object.defineProperty(document, "queryCommandState", { configurable: true, value: queryCommandStateSpy });
  });

  afterEach(() => {
    document.getSelection()?.removeAllRanges();
    host.remove();
    vi.restoreAllMocks();
  });

  it("all buttons start with aria-pressed=false when queryCommandState returns false", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    for (const id of ["bold", "italic", "underline", "strikethrough", "superscript", "subscript"]) {
      expect(isPressed(getFormatButton(host, id))).toBe(false);
    }
    dispose();
  });

  it("bold button becomes aria-pressed=true when queryCommandState('bold') returns true", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    queryCommandStateSpy.mockImplementation((cmd: string) => cmd === "bold");
    dispatchSelectionChange();
    await flushMicrotasks();

    expect(isPressed(getFormatButton(host, "bold"))).toBe(true);
    expect(isPressed(getFormatButton(host, "italic"))).toBe(false);
    dispose();
  });

  it("italic button becomes aria-pressed=true when queryCommandState('italic') returns true", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    queryCommandStateSpy.mockImplementation((cmd: string) => cmd === "italic");
    dispatchSelectionChange();
    await flushMicrotasks();

    expect(isPressed(getFormatButton(host, "italic"))).toBe(true);
    expect(isPressed(getFormatButton(host, "bold"))).toBe(false);
    dispose();
  });

  it("strikethrough button becomes aria-pressed=true when queryCommandState('strikeThrough') returns true", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    queryCommandStateSpy.mockImplementation((cmd: string) => cmd === "strikeThrough");
    dispatchSelectionChange();
    await flushMicrotasks();

    expect(isPressed(getFormatButton(host, "strikethrough"))).toBe(true);
    expect(isPressed(getFormatButton(host, "bold"))).toBe(false);
    dispose();
  });

  it("superscript button becomes aria-pressed=true when queryCommandState('superscript') returns true", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    queryCommandStateSpy.mockImplementation((cmd: string) => cmd === "superscript");
    dispatchSelectionChange();
    await flushMicrotasks();

    expect(isPressed(getFormatButton(host, "superscript"))).toBe(true);
    expect(isPressed(getFormatButton(host, "subscript"))).toBe(false);
    dispose();
  });

  it("subscript button becomes aria-pressed=true when queryCommandState('subscript') returns true", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    queryCommandStateSpy.mockImplementation((cmd: string) => cmd === "subscript");
    dispatchSelectionChange();
    await flushMicrotasks();

    expect(isPressed(getFormatButton(host, "subscript"))).toBe(true);
    expect(isPressed(getFormatButton(host, "superscript"))).toBe(false);
    dispose();
  });

  it("all buttons reset to aria-pressed=false when selection moves outside editor", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    // Simulate all active
    queryCommandStateSpy.mockImplementation(() => true);
    dispatchSelectionChange();
    await flushMicrotasks();
    expect(isPressed(getFormatButton(host, "bold"))).toBe(true);

    // Now remove selection from editor
    document.getSelection()?.removeAllRanges();
    dispatchSelectionChange();
    await flushMicrotasks();

    for (const id of ["bold", "italic", "underline", "strikethrough", "superscript", "subscript"]) {
      expect(isPressed(getFormatButton(host, id))).toBe(false);
    }
    dispose();
  });
});

describe("Inline formatting — Alt keytip shortcuts", () => {
  let host: HTMLDivElement;
  let execCommandSpy: ReturnType<typeof vi.fn>;
  let queryCommandStateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    execCommandSpy = vi.fn(() => true);
    queryCommandStateSpy = vi.fn(() => false);
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommandSpy });
    Object.defineProperty(document, "queryCommandState", { configurable: true, value: queryCommandStateSpy });
  });

  afterEach(() => {
    document.getSelection()?.removeAllRanges();
    host.remove();
    vi.restoreAllMocks();
  });

  it("Alt keytip mode: Alt+T triggers strikethrough (keytip T)", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    editor.focus();
    // Activate keytip mode first
    dispatchDocumentKey("Alt");
    await flushMicrotasks();

    const event = dispatchDocumentKey("t", { altKey: true });
    await flushMicrotasks();

    expect(event.defaultPrevented).toBe(true);
    expect(execCommandSpy).toHaveBeenCalledWith("strikeThrough");
    dispose();
  });

  it("Alt keytip mode: Alt+P triggers superscript (keytip P)", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    editor.focus();
    dispatchDocumentKey("Alt");
    await flushMicrotasks();

    const event = dispatchDocumentKey("p", { altKey: true });
    await flushMicrotasks();

    expect(event.defaultPrevented).toBe(true);
    expect(execCommandSpy).toHaveBeenCalledWith("superscript");
    dispose();
  });

  it("Alt keytip mode: Alt+D triggers subscript (keytip D)", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    selectRange(editor.querySelector("span")!.firstChild!, 0, editor.querySelector("span")!.firstChild!, 5);
    await flushMicrotasks();

    editor.focus();
    dispatchDocumentKey("Alt");
    await flushMicrotasks();

    const event = dispatchDocumentKey("d", { altKey: true });
    await flushMicrotasks();

    expect(event.defaultPrevented).toBe(true);
    expect(execCommandSpy).toHaveBeenCalledWith("subscript");
    dispose();
  });
});

describe("Inline formatting — complex toggle sequences", () => {
  let host: HTMLDivElement;
  let execCommandSpy: ReturnType<typeof vi.fn>;
  let queryCommandStateSpy: ReturnType<typeof vi.fn>;
  let currentFormattingState: Record<string, boolean>;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    currentFormattingState = { bold: false, italic: false, underline: false, strikeThrough: false, superscript: false, subscript: false };
    execCommandSpy = vi.fn((cmd: string) => {
      // Toggle the state as a real browser would
      const key = cmd === "strikeThrough" ? "strikeThrough" : cmd;
      if (key in currentFormattingState) {
        currentFormattingState[key] = !currentFormattingState[key];
      }
      return true;
    });
    queryCommandStateSpy = vi.fn((cmd: string) => currentFormattingState[cmd] ?? false);
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommandSpy });
    Object.defineProperty(document, "queryCommandState", { configurable: true, value: queryCommandStateSpy });
  });

  afterEach(() => {
    document.getSelection()?.removeAllRanges();
    host.remove();
    vi.restoreAllMocks();
  });

  it("keyboard shortcut toggles aria-pressed on and off correctly for bold", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    const textNode = editor.querySelector("span")!.firstChild!;
    selectRange(textNode, 0, textNode, 5);
    await flushMicrotasks();

    // Initially not bold
    expect(isPressed(getFormatButton(host, "bold"))).toBe(false);

    // Toggle bold on
    dispatchEditorKey(editor, "b", { ctrlKey: true });
    dispatchSelectionChange();
    await flushMicrotasks();
    expect(isPressed(getFormatButton(host, "bold"))).toBe(true);

    // Toggle bold off
    dispatchEditorKey(editor, "b", { ctrlKey: true });
    dispatchSelectionChange();
    await flushMicrotasks();
    expect(isPressed(getFormatButton(host, "bold"))).toBe(false);

    dispose();
  });

  it("toolbar button click toggles aria-pressed on and off for strikethrough", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    const textNode = editor.querySelector("span")!.firstChild!;
    selectRange(textNode, 0, textNode, 5);
    await flushMicrotasks();

    const btn = getFormatButton(host, "strikethrough")!;
    expect(isPressed(btn)).toBe(false);

    btn.click();
    dispatchSelectionChange();
    await flushMicrotasks();
    expect(isPressed(btn)).toBe(true);

    btn.click();
    dispatchSelectionChange();
    await flushMicrotasks();
    expect(isPressed(btn)).toBe(false);

    dispose();
  });

  it("toggling bold via shortcut then turning it off via button click works correctly", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    const textNode = editor.querySelector("span")!.firstChild!;
    selectRange(textNode, 0, textNode, 5);
    await flushMicrotasks();

    // Turn on via keyboard
    dispatchEditorKey(editor, "b", { ctrlKey: true });
    dispatchSelectionChange();
    await flushMicrotasks();
    expect(isPressed(getFormatButton(host, "bold"))).toBe(true);

    // Turn off via toolbar button click
    getFormatButton(host, "bold")!.click();
    dispatchSelectionChange();
    await flushMicrotasks();
    expect(isPressed(getFormatButton(host, "bold"))).toBe(false);

    dispose();
  });

  it("bold and italic can be independently active simultaneously", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    const textNode = editor.querySelector("span")!.firstChild!;
    selectRange(textNode, 0, textNode, 5);
    await flushMicrotasks();

    dispatchEditorKey(editor, "b", { ctrlKey: true });
    dispatchEditorKey(editor, "i", { ctrlKey: true });
    dispatchSelectionChange();
    await flushMicrotasks();

    expect(isPressed(getFormatButton(host, "bold"))).toBe(true);
    expect(isPressed(getFormatButton(host, "italic"))).toBe(true);
    expect(isPressed(getFormatButton(host, "underline"))).toBe(false);

    dispose();
  });

  it("superscript and subscript are mutually exclusive when toggled in sequence", async () => {
    const { editor, dispose } = renderEditor(host);
    editor.innerHTML = "<span>Hello</span>";
    const textNode = editor.querySelector("span")!.firstChild!;
    selectRange(textNode, 0, textNode, 5);
    await flushMicrotasks();

    // Apply superscript
    dispatchEditorKey(editor, ".", { ctrlKey: true });
    dispatchSelectionChange();
    await flushMicrotasks();
    expect(isPressed(getFormatButton(host, "superscript"))).toBe(true);

    // Simulate browser turning off superscript when subscript is applied
    currentFormattingState["superscript"] = false;

    // Apply subscript
    dispatchEditorKey(editor, ",", { ctrlKey: true });
    dispatchSelectionChange();
    await flushMicrotasks();
    expect(isPressed(getFormatButton(host, "subscript"))).toBe(true);
    expect(isPressed(getFormatButton(host, "superscript"))).toBe(false);

    dispose();
  });
});
