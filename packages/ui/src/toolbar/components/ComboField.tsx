// Compact combo field (input + dropdown list) for font size, line spacing, etc.

import { For, Show, createEffect, createSignal } from "solid-js";
import type { JSX } from "solid-js";

interface ComboFieldProps<T> {
  value: string;
  options: T[];
  getOptionValue: (option: T) => string;
  getOptionLabel: (option: T) => string;
  placeholder?: string;
  ariaLabel: string;
  listId: string;
  error?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: string) => void;
  onCommit: (value: string, options?: { focusEditor?: boolean }) => void;
  onNavigateOut?: (direction: "next" | "prev") => void;
  keytip?: string;
  containerRef?: (el: HTMLDivElement) => void;
  inputRef?: (el: HTMLInputElement) => void;
  renderKeytip?: () => JSX.Element;
}

export function ComboField<T>(props: ComboFieldProps<T>) {
  const [optionRefs, setOptionRefs] = createSignal<HTMLButtonElement[]>([]);

  createEffect(() => {
    if (props.isOpen) {
      const refs: HTMLButtonElement[] = [];
      props.options.forEach(() => refs.push(null as any));
      setOptionRefs(refs);
    }
  });

  function handleInputKeyDown(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      props.onCommit(props.value, { focusEditor: false });
      props.onNavigateOut?.(event.shiftKey ? "prev" : "next");
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      props.onCommit(props.value);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      props.onOpenChange(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!props.isOpen) {
        props.onOpenChange(true);
      } else {
        const refs = optionRefs();
        refs[0]?.focus();
      }
      return;
    }

    if (event.key === "ArrowUp" && props.isOpen) {
      event.preventDefault();
      props.onOpenChange(false);
    }
  }

  function handleOptionKeyDown(event: KeyboardEvent, index: number) {
    const refs = optionRefs();

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = Math.min(index + 1, refs.length - 1);
      refs[nextIndex]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (index === 0) {
        const inputEl = document.activeElement as HTMLInputElement;
        props.inputRef?.(inputEl);
      } else {
        refs[index - 1]?.focus();
      }
    } else if (event.key === "Home") {
      event.preventDefault();
      refs[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      refs[refs.length - 1]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      props.onOpenChange(false);
    } else if (event.key === "Tab") {
      event.preventDefault();
      props.onCommit(props.value, { focusEditor: false });
      props.onNavigateOut?.(event.shiftKey ? "prev" : "next");
    }
  }

  function selectOption(optionValue: string) {
    props.onValueChange(optionValue);
    props.onCommit(optionValue);
  }

  const comboInputStyle =
    "flex:1;height:42px;padding:0 12px;border:1px solid #c3cad8;border-right:none;" +
    "border-radius:12px 0 0 12px;background:#f7f9fc;color:#172033;font:inherit;min-width:0;";
  const comboButtonStyle =
    "display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;" +
    "border:1px solid #c3cad8;border-radius:0 12px 12px 0;background:#f7f9fc;color:#52607a;" +
    "font:inherit;cursor:pointer;";
  const comboMenuStyle =
    "position:absolute;left:0;top:calc(100% + 8px);z-index:15;width:100%;display:flex;" +
    "flex-direction:column;gap:6px;max-height:240px;overflow:auto;padding:8px;" +
    "border:1px solid #c3cad8;border-radius:12px;background:#ffffff;" +
    "box-shadow:0 18px 32px rgba(15,23,42,0.14);";
  const comboOptionStyle =
    "display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;" +
    "padding:8px 10px;border:1px solid #e3e8f1;border-radius:10px;background:#ffffff;" +
    "color:#172033;font:inherit;text-align:left;cursor:pointer;";

  let localInputRef: HTMLInputElement | undefined;

  return (
    <div
      ref={props.containerRef}
      style="position: relative; display: inline-flex; flex-direction: column; align-items: flex-start;"
    >
      <div style="position: relative; display: flex;">
        <input
          ref={(el) => {
            localInputRef = el;
            props.inputRef?.(el);
          }}
          type="text"
          value={props.value}
          placeholder={props.placeholder}
          aria-label={props.ariaLabel}
          aria-controls={props.isOpen ? props.listId : undefined}
          aria-expanded={props.isOpen}
          tabIndex={-1}
          style={comboInputStyle}
          onFocus={() => props.onOpenChange(true)}
          onInput={(e) => props.onValueChange(e.currentTarget.value)}
          onKeyDown={handleInputKeyDown}
        />
        <button
          type="button"
          aria-label={`Show ${props.ariaLabel.toLowerCase()} options`}
          style={comboButtonStyle}
          tabIndex={-1}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            props.onOpenChange(!props.isOpen);
            if (!props.isOpen) {
              queueMicrotask(() => localInputRef?.focus());
            }
          }}
        >
          ▾
        </button>
        {props.renderKeytip?.()}
      </div>

      <Show when={props.error}>
        <span style="font-size:0.75rem;color:#a94442;margin-top:2px;">{props.error}</span>
      </Show>

      <Show when={props.isOpen}>
        <div
          id={props.listId}
          role="listbox"
          aria-label={props.ariaLabel}
          style={comboMenuStyle}
        >
          <For each={props.options}>
            {(option, index) => {
              const optionValue = props.getOptionValue(option);
              const isSelected = props.value === optionValue;
              const refs = optionRefs();

              return (
                <button
                  ref={(el) => {
                    const currentRefs = [...refs];
                    currentRefs[index()] = el;
                    setOptionRefs(currentRefs);
                  }}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  style={
                    comboOptionStyle +
                    (isSelected ? "border-color:#6a95dd;background:#edf4ff;" : "")
                  }
                  onMouseEnter={(e) => e.currentTarget.focus()}
                  onClick={() => selectOption(optionValue)}
                  onKeyDown={(e) => handleOptionKeyDown(e, index())}
                >
                  <span>{props.getOptionLabel(option)}</span>
                  <Show when={isSelected}>
                    <span aria-hidden="true">✓</span>
                  </Show>
                </button>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}
