// Shared test helpers for editor tests

import { render } from "solid-js/web";
import { TextEditor, type TextEditorProps } from "../TextEditor";

class ResizeObserverMock implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

if (!("ResizeObserver" in globalThis)) {
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    value: ResizeObserverMock
  });
}

export function flushMicrotasks() {
  return Promise.resolve().then(() => Promise.resolve());
}

export function dispatchSelectionChange() {
  document.dispatchEvent(new Event("selectionchange"));
}

export function selectRange(startNode: Node, startOffset: number, endNode: Node, endOffset: number) {
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);

  const selection = document.getSelection();
  if (!selection) {
    throw new Error("Selection API is unavailable.");
  }

  selection.removeAllRanges();
  selection.addRange(range);
  dispatchSelectionChange();
  return range;
}

export function dispatchEditorKey(
  editor: HTMLDivElement,
  key: string,
  options: KeyboardEventInit = {}
) {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key,
    ...options
  });

  editor.dispatchEvent(event);
  return event;
}

export function dispatchDocumentKey(key: string, options: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key,
    ...options
  });

  document.dispatchEvent(event);
  return event;
}

export function isSequentiallyFocusable(element: HTMLElement) {
  if (element.isContentEditable || element.hasAttribute("contenteditable")) {
    return true;
  }

  const tabIndex = element.tabIndex;
  if (tabIndex < 0 || element.hasAttribute("disabled")) {
    return false;
  }

  if (element.getAttribute("aria-hidden") === "true") {
    return false;
  }

  if (element instanceof HTMLInputElement && element.type === "hidden") {
    return false;
  }

  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLAnchorElement
  ) {
    return true;
  }

  return tabIndex >= 0;
}

export function sequentialFocusTargets(scope: ParentNode = document) {
  return Array.from(
    scope.querySelectorAll<HTMLElement>(
      'button, input, select, textarea, a[href], [contenteditable], [tabindex]'
    )
  ).filter(isSequentiallyFocusable);
}

export interface RenderedEditor {
  editor: HTMLDivElement;
  fontButton: () => HTMLButtonElement;
  fontSizeInput: () => HTMLInputElement;
  lineSpacingInput: () => HTMLInputElement;
  colorButton: () => HTMLButtonElement;
  styleButton: () => HTMLButtonElement;
  alignButtons: () => HTMLButtonElement[];
  styleButtons: () => HTMLButtonElement[];
}

export function renderEditor(host: HTMLDivElement, props: TextEditorProps = {}): RenderedEditor & { dispose: () => void } {
  const dispose = render(() => <TextEditor {...props} />, host);
  const editor = host.querySelector(".monoscape-editor");
  if (!(editor instanceof HTMLDivElement)) {
    throw new Error("Editor did not render.");
  }

  return {
    dispose,
    editor,
    fontButton: () => host.querySelector('button[aria-controls="monoscape-font-panel"]') as HTMLButtonElement,
    fontSizeInput: () => host.querySelector('input[aria-label="Font size"]') as HTMLInputElement,
    lineSpacingInput: () => host.querySelector('input[aria-label="Line spacing"]') as HTMLInputElement,
    colorButton: () => host.querySelector('button[aria-controls="monoscape-color-panel"]') as HTMLButtonElement,
    styleButton: () => host.querySelector('button[aria-controls="monoscape-style-panel"]') as HTMLButtonElement,
    alignButtons: () =>
      Array.from(host.querySelectorAll<HTMLButtonElement>('button[aria-label^="Align "]')),
    styleButtons: () =>
      Array.from(
        host.querySelectorAll<HTMLButtonElement>('button[data-toolbar-button-id]')
      )
  };
}

export interface RenderedEditorWithBoundaries extends RenderedEditor {
  before: HTMLButtonElement;
  after: HTMLButtonElement;
}

export function renderEditorWithBoundaries(host: HTMLDivElement, props: TextEditorProps = {}): RenderedEditorWithBoundaries & { dispose: () => void } {
  const dispose = render(
    () => (
      <>
        <button type="button" data-focus-boundary="before">
          Before
        </button>
        <TextEditor {...props} />
        <button type="button" data-focus-boundary="after">
          After
        </button>
      </>
    ),
    host
  );

  const editor = host.querySelector(".monoscape-editor");
  if (!(editor instanceof HTMLDivElement)) {
    throw new Error("Editor did not render.");
  }

  const before = host.querySelector('[data-focus-boundary="before"]');
  const after = host.querySelector('[data-focus-boundary="after"]');
  if (!(before instanceof HTMLButtonElement) || !(after instanceof HTMLButtonElement)) {
    throw new Error("Focus boundaries did not render.");
  }

  return {
    dispose,
    before,
    after,
    editor,
    fontButton: () => host.querySelector('button[aria-controls="monoscape-font-panel"]') as HTMLButtonElement,
    fontSizeInput: () => host.querySelector('input[aria-label="Font size"]') as HTMLInputElement,
    lineSpacingInput: () => host.querySelector('input[aria-label="Line spacing"]') as HTMLInputElement,
    colorButton: () => host.querySelector('button[aria-controls="monoscape-color-panel"]') as HTMLButtonElement,
    styleButton: () => host.querySelector('button[aria-controls="monoscape-style-panel"]') as HTMLButtonElement,
    alignButtons: () =>
      Array.from(host.querySelectorAll<HTMLButtonElement>('button[aria-label^="Align "]')),
    styleButtons: () =>
      Array.from(
        host.querySelectorAll<HTMLButtonElement>('button[data-toolbar-button-id]')
      )
  };
}
