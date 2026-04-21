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

## Author

**Oracle** (Accessibility & UX)  
**Monoscape Squad**  
**Initial Implementation:** FormattingToolbar.tsx (packages/ui/src/)
