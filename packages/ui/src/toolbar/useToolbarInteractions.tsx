import { Show } from "solid-js";
import { FORMATTING_TOOLBAR_KEYTIPS } from "@monoscape/document-core";
import { buttonOrder } from "./constants";
import type { ToolbarButtonId } from "./constants";
import { useToolbarKeytips } from "./useToolbarKeytips";

interface ToolbarInteractionOptions {
  onNavigateOut?: (direction: "next" | "prev") => void;
  focusEditor: () => void;
  setIsFontPickerOpen: (open: boolean) => void;
  setIsColorPickerOpen: (open: boolean) => void;
  setIsStyleSetOpen: (open: boolean) => void;
  getFontSizeInput: () => HTMLInputElement | undefined;
  getLineSpacingInput: () => HTMLInputElement | undefined;
}

export function useToolbarInteractions(options: ToolbarInteractionOptions) {
  const buttonRefs: Partial<Record<ToolbarButtonId, HTMLButtonElement>> = {};
  let focusedButtonId: ToolbarButtonId = buttonOrder[0];

  const keytipFor = (target: keyof typeof FORMATTING_TOOLBAR_KEYTIPS) =>
    FORMATTING_TOOLBAR_KEYTIPS[target];

  const focusTopLevelControl = (control: "fontSize" | "lineSpacing" | "color" | "styles") => {
    if (control === "fontSize") {
      options.getFontSizeInput()?.focus();
      return true;
    }
    if (control === "lineSpacing") {
      options.getLineSpacingInput()?.focus();
      return true;
    }
    if (control === "color") {
      options.setIsColorPickerOpen(true);
      return true;
    }
    options.setIsStyleSetOpen(true);
    return true;
  };

  const triggerToolbarButton = (buttonId: ToolbarButtonId) => {
    const button = buttonRefs[buttonId];
    if (!button) return false;
    button.click();
    return true;
  };

  const activateKeytip = (key: string) => {
    switch (key) {
      case keytipFor("fontFamily"):
        options.setIsFontPickerOpen(true);
        return true;
      case keytipFor("fontSize"):
        return focusTopLevelControl("fontSize");
      case keytipFor("lineSpacing"):
        return focusTopLevelControl("lineSpacing");
      case keytipFor("color"):
        return focusTopLevelControl("color");
      case keytipFor("styles"):
        return focusTopLevelControl("styles");
      case keytipFor("bold"):
      case keytipFor("italic"):
      case keytipFor("underline"):
      case keytipFor("strikethrough"):
      case keytipFor("superscript"):
      case keytipFor("subscript"):
      case keytipFor("left"):
      case keytipFor("center"):
      case keytipFor("right"):
      case keytipFor("justify"):
      case keytipFor("indent"):
      case keytipFor("outdent"): {
        const entry = Object.entries(FORMATTING_TOOLBAR_KEYTIPS).find(([, value]) => value === key);
        return entry ? triggerToolbarButton(entry[0] as ToolbarButtonId) : false;
      }
      default:
        return false;
    }
  };

  const { isKeytipMode, setIsKeytipMode } = useToolbarKeytips(activateKeytip);

  const renderKeytip = (target: string) => {
    const keytip = (FORMATTING_TOOLBAR_KEYTIPS as Record<string, string>)[target];
    if (!keytip) return null;
    return (
      <Show when={isKeytipMode()}>
        <span data-toolbar-keytip="true" aria-hidden="true" class="toolbar__keytip">
          {keytip}
        </span>
      </Show>
    );
  };

  const handleButtonRowKeyDown = (event: KeyboardEvent) => {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const buttonId = event.target.dataset.toolbarButtonId as ToolbarButtonId | undefined;
    if (!buttonId || !buttonOrder.includes(buttonId)) return;

    if (event.key === "Tab") {
      event.preventDefault();
      options.onNavigateOut?.(event.shiftKey ? "prev" : "next");
    } else if (event.key === "End") {
      event.preventDefault();
      focusedButtonId = buttonOrder[buttonOrder.length - 1];
      buttonRefs[focusedButtonId]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      focusedButtonId = buttonOrder[0];
      buttonRefs[focusedButtonId]?.focus();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      const currentIndex = buttonOrder.indexOf(focusedButtonId);
      if (currentIndex === buttonOrder.length - 1) {
        options.focusEditor();
      } else {
        focusedButtonId = buttonOrder[currentIndex + 1];
        buttonRefs[focusedButtonId]?.focus();
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      const currentIndex = buttonOrder.indexOf(focusedButtonId);
      const nextIndex = (currentIndex - 1 + buttonOrder.length) % buttonOrder.length;
      focusedButtonId = buttonOrder[nextIndex];
      buttonRefs[focusedButtonId]?.focus();
    }
  };

  return {
    buttonRefs,
    handleButtonRowKeyDown,
    renderKeytip,
    isKeytipMode,
    setIsKeytipMode
  };
}
