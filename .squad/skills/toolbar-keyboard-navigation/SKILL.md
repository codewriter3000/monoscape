---
skill_name: Accessible Toolbar Navigation
domain: UI/Interaction Patterns
wcag_target: 2.2 AA
last_updated: 2026-04-21
maturity: Emerging (1st implementation in FormattingToolbar)
---

# Accessible Toolbar Navigation

A reusable pattern for keyboard and screen reader accessible toolbar buttons in SolidJS, combining arrow-key navigation with Tab flow for college-student editing workflows.

## Problem

Toolbar buttons (Bold, Italic, Underline, etc.) need to be:
1. Navigable by arrow keys (within toolbar) for efficiency
2. Escapable via Tab to reach the next interactive element (e.g., editor canvas)
3. Announcement of state (pressed/unpressed) for screen readers
4. Visual focus indicators that are always visible

Students under deadline pressure benefit from predictable, low-friction keyboard navigation. Power users and accessibility-dependent users should not get trapped in the toolbar.

## Solution

### Key Components

1. **Button Semantics:**
   - Use `aria-pressed="true|false"` to announce toggle state
   - Include `aria-label` for clear button purpose
   - Pair with `title` for tooltip fallback

2. **Manual Focus Management:**
   - Maintain a `buttons` array and `focusedIndex` to track which button is active
   - Set first button `tabIndex={0}`, others `tabIndex={-1}` so only the first enters Tab flow
   - Arrow keys cycle through buttons; Tab moves to next element in document order

3. **Arrow Key Handler:**
   - ArrowRight/ArrowLeft preventDefault and cycle focus
   - **Critical:** After the last button (right arrow), move focus to the next element (e.g., editor)
   - After the first button (left arrow), wrap to the last button (or escape to previous element)
   - Reset toggle state visuals when the document selection moves outside the active editor

4. **Event Listeners:**
   - Listen for `selectionchange` to update button state (bold/italic applied)
   - Clean up listeners on component unmount

### Code Example (FormattingToolbar Pattern)

```typescript
import { createSignal, onCleanup, onMount } from "solid-js";

interface FormattingToolbarProps {
  editorRef: () => HTMLDivElement | undefined;
  onNavigateOut?: (direction: 'next' | 'prev') => void; // Future: allow parent to handle focus escape
}

export function FormattingToolbar(props: FormattingToolbarProps) {
  const [state, setState] = createSignal<FormattingState>({
    bold: false,
    italic: false,
    underline: false,
  });

  let buttons: HTMLButtonElement[] = [];
  let focusedIndex = 0;

  function updateState() {
    setState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    });
  }

  function execFormat(command: string) {
    const editor = props.editorRef();
    if (editor) editor.focus();
    document.execCommand(command);
    updateState();
  }

  function moveFocus(delta: number) {
    const next = (focusedIndex + delta + buttons.length) % buttons.length;
    buttons[focusedIndex].tabIndex = -1;
    buttons[next].tabIndex = 0;
    buttons[next].focus();
    focusedIndex = next;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (focusedIndex === buttons.length - 1) {
        // Exit toolbar to editor
        const editor = props.editorRef();
        if (editor) editor.focus();
      } else {
        moveFocus(1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (focusedIndex === 0) {
        // Optionally: move to previous element or stay
        moveFocus(-1); // For now, wrap to last button
      } else {
        moveFocus(-1);
      }
    }
  }

  onMount(() => {
    document.addEventListener("selectionchange", updateState);
  });

  onCleanup(() => {
    document.removeEventListener("selectionchange", updateState);
  });

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      style="display:flex;gap:4px;padding:4px 6px;border-bottom:1px solid #ddd;background:#fafafa;"
      onKeyDown={handleKeyDown}
    >
      {/* Button template */}
      <button
        ref={(el) => { buttons[0] = el; }}
        aria-label="Bold"
        aria-pressed={state().bold}
        title="Bold"
        tabIndex={0}
        style={buttonStyle + (state().bold ? activeStyle : "")}
        onClick={() => execFormat("bold")}
      >
        <strong>B</strong>
      </button>
      {/* ... repeat for Italic, Underline, etc. */}
    </div>
  );
}
```

## Accessibility Guarantees

- ✅ Arrow keys navigate between buttons (predictable, low friction)
- ✅ Tab exits toolbar to next interactive element (no keyboard traps)
- ✅ Button state announced via `aria-pressed` (screen readers)
- ✅ Focus indicator always visible via CSS `outline` (not outline: none)
- ✅ Mouse and keyboard paths are equivalent (no hidden keyboard-only features)

## Testing Checklist

- [ ] Keyboard user: ArrowRight/Left cycles through all buttons
- [ ] Keyboard user: ArrowRight from last button moves focus to editor
- [ ] Keyboard user: Tab from toolbar moves to next element (not back to first button)
- [ ] Selection outside the editor resets toolbar pressed states
- [ ] Screen reader: Button announced as "Bold, toggle button, pressed" or "unpressed"
- [ ] Mouse: Click button, focus returns to toolbar (user can continue with arrows)
- [ ] Zoom 200%: Focus outline remains visible and clickable
- [ ] Dark mode / high contrast: Focus outline has sufficient contrast

## Known Limitations

- Custom arrow key behavior may conflict with language-specific keyboard layouts (investigate if needed)
- `document.queryCommandState()` and `execCommand()` are deprecated but widely supported; consider ContentEditable alternatives if platform support narrows
- Focus management requires JavaScript; no fallback for users with JS disabled (acceptable for rich editor UX)

## Related Patterns

- **Tab Groups (ARIA Authoring Practices):** https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- **Toolbar Pattern (ARIA):** https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
- **Keyboard Navigation (WCAG 2.2 2.1.1):** Keyboard accessible; must support all functionality

## Notes for Implementers (Trinity & Future)

1. **Font & Typography:** Pair this toolbar with readable defaults (e.g., 12pt serif, 1.5 line height)
2. **Visual Hierarchy:** Use subtle color changes (not just border) for active button state; contrast must meet WCAG AA (3:1 for UI components)
3. **Mobile Consideration:** This pattern works for keyboard; touch users may need a different interaction model (future investigation)
4. **Extension Hooks:** When new buttons are added (e.g., Heading, List), reuse this same pattern; don't create parallel keyboard handlers

## Monoscape Revision — Alt keytips for dense editors

When the editor itself must own raw **Tab** / **Shift+Tab** for document indentation, remove the toolbar's top-level controls from the plain Tab order and expose them through **Alt keytips** instead.

### Updated Monoscape pattern

1. Keep visible primary toolbar controls at `tabIndex={-1}` so plain Tab does not walk the toolbar.
2. On **Alt** keydown, reveal compact blue keytip badges on the primary controls.
3. On **Alt + key**, either:
   - focus/open a compound control (for example font family, font size, line spacing), or
   - immediately fire a button action (for example Bold, Align Left, Indent).
4. Preserve arrow-key roving between toolbar buttons once one of them has focus.
5. Keep visible help text near the editor so writers learn the split:
   - **Alt** reaches the toolbar
   - **Tab / Shift+Tab** edits indentation inside the document

### Monoscape reference

- `packages/ui/src/FormattingToolbar.tsx`
- `packages/ui/src/TextEditor.tsx`
- `packages/document-core/src/index.ts`

## Reviewer Override: Alt Keytip Model

If product explicitly changes the keyboard contract so plain Tab must **skip** the toolbar entirely, treat this as a different pattern, not a small tweak to roving tabindex.

### Gate

- Plain Tab / Shift+Tab must never land on toolbar buttons
- Holding Alt must reveal visible keytips on toolbar targets
- Alt+key must focus or activate the mapped target
- Keytips must dismiss on Alt release, Escape, blur, or successful activation
- Tests must prove the new model directly; old “Tab escapes toolbar/editor” tests are no longer sufficient

### Reject If

- Toolbar still depends on roving tabindex as the primary keyboard entry path
- Alt behavior is only described in `title`, `aria-keyshortcuts`, or helper text
- Reviewer only sees mouse evidence, not keyboard evidence
- Editor indentation shortcuts and toolbar access rules contradict each other

### Monoscape follow-up: avoid the composite trap

If **Escape** or **Alt+keytip** can programmatically focus a top-level toolbar control that is otherwise removed from the sequential Tab order, plain **Tab / Shift+Tab** on that focused control must navigate **outside the whole editor shell**, not back into the editor canvas.

- Keep the toolbar controls at `tabIndex={-1}` for normal document flow.
- Add a parent-owned `onNavigateOut(direction)` seam so the toolbar can delegate the actual next/previous focus target outside the composite.
- Intercept Tab/Shift+Tab only on the top-level keytip/Escape targets (for example font trigger, font size input, line spacing input, formatting buttons).
- When a control normally refocuses the editor after commit, allow a `focusEditor: false` path for blur / Tab exits so the user does not get bounced back into the document.

### Proof upgrade

Use a mounted test with explicit focus boundaries before and after the editor shell, then prove this sequence:

1. sequential focus order skips toolbar controls
2. plain Tab / Shift+Tab inside the editor indents / outdents and keeps focus in the editor
3. Escape moves focus to the primary toolbar control
4. Tab / Shift+Tab from that toolbar control leaves the shell to the external next / previous target
5. Alt keytips still focus or activate toolbar targets after the escape rule lands

This is the minimum proof that the split model is powerful without becoming a keyboard trap.

## Author

**Oracle** (Accessibility & UX)  
**Monoscape Squad**  
**Initial Implementation:** FormattingToolbar.tsx (packages/ui/src/)
