# Accessibility Decision: Formatting Toolbar

**Author:** Oracle (Accessibility & UX Specialist)  
**Date:** 2026-04-21  
**Status:** Approved — Binding for Implementation  
**Audience:** Trinity (implementation), Switch (test plan)  
**Feature:** Text editor with Bold / Italic / Underline formatting toolbar  
**Standard:** WCAG 2.2 Level AA

---

## 1. Overview

The formatting toolbar and its associated `contenteditable` editor must meet WCAG 2.2 AA from the first commit. These requirements are not optional enhancements — they are implementation specifications. Any deviation must be discussed with Oracle before shipping.

---

## 2. Editor Area Requirements

The `contenteditable` element must carry the following attributes:

```html
<div
  contenteditable="true"
  role="textbox"
  aria-multiline="true"
  aria-label="Document editor"
>
```

**Rationale:** Without `role="textbox"` and `aria-multiline="true"`, screen readers cannot reliably identify the element as a multi-line text input. Without `aria-label`, the field is unlabeled and completely opaque to assistive technology.

---

## 3. Toolbar Role and Labeling

The toolbar container must be marked up as:

```html
<div role="toolbar" aria-label="Formatting">
```

**Rationale:** `role="toolbar"` registers the grouping with the accessibility tree so screen readers can announce "Formatting toolbar" when focus enters. `aria-label="Formatting"` provides the human-readable name for the landmark.

---

## 4. Button Toggle States

Each formatting button must expose its on/off state via `aria-pressed`:

```html
<!-- Bold inactive -->
<button aria-pressed="false" aria-label="Bold" title="Bold (Ctrl+B)">B</button>

<!-- Bold active -->
<button aria-pressed="true" aria-label="Bold" title="Bold (Ctrl+B)">B</button>
```

`aria-pressed` must be toggled in JavaScript synchronously with `document.execCommand` or the equivalent formatting action.

**Rationale:** Without `aria-pressed`, a screen reader user hears only "Bold button" with no indication of whether bold is currently applied. With `aria-pressed="true"`, they hear "Bold, on, button" — unambiguous state.

---

## 5. Button Labels and Tooltips

Every button must have:
- `aria-label` — machine-readable name consumed by screen readers
- `title` — visible tooltip for sighted keyboard users; must include the keyboard shortcut

| Button    | `aria-label` | `title`               |
|-----------|--------------|-----------------------|
| Bold      | `Bold`       | `Bold (Ctrl+B)`       |
| Italic    | `Italic`     | `Italic (Ctrl+I)`     |
| Underline | `Underline`  | `Underline (Ctrl+U)`  |

Do **not** rely on button text content (e.g., a `B` glyph) as the accessible name without an explicit `aria-label`. Glyphs are ambiguous.

---

## 6. Keyboard Navigation — Roving Tabindex

The toolbar must implement the **roving tabindex** pattern (ARIA Authoring Practices Guide: Toolbar Pattern).

### Rules

- Only **one** button in the toolbar has `tabindex="0"` at any time; all others have `tabindex="-1"`.
- **Tab / Shift+Tab** moves focus into and out of the toolbar as a single stop. Tab does not cycle between toolbar buttons.
- **Arrow Right / Arrow Left** moves focus between toolbar buttons and updates the roving `tabindex` accordingly.
- **Home** moves focus to the first button; **End** moves focus to the last button.
- **Enter / Space** activates the focused button.

### Reference implementation sketch

```js
toolbar.addEventListener('keydown', (e) => {
  const buttons = [...toolbar.querySelectorAll('button')];
  const idx = buttons.indexOf(document.activeElement);

  if (e.key === 'ArrowRight') {
    e.preventDefault();
    const next = (idx + 1) % buttons.length;
    focusButton(buttons, next);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    const prev = (idx - 1 + buttons.length) % buttons.length;
    focusButton(buttons, prev);
  } else if (e.key === 'Home') {
    e.preventDefault();
    focusButton(buttons, 0);
  } else if (e.key === 'End') {
    e.preventDefault();
    focusButton(buttons, buttons.length - 1);
  }
});

function focusButton(buttons, idx) {
  buttons.forEach((b, i) => b.setAttribute('tabindex', i === idx ? '0' : '-1'));
  buttons[idx].focus();
}
```

---

## 7. Keyboard Shortcuts in the Editor

Ctrl+B, Ctrl+I, and Ctrl+U must function while focus is inside the editor area. These shortcuts must:

1. Apply or remove the corresponding formatting.
2. Update the `aria-pressed` state on the corresponding toolbar button.
3. NOT be swallowed by the toolbar's own keydown listener.

**Rationale:** Students who cannot efficiently reach a toolbar with a pointing device rely on in-editor shortcuts. Keeping toolbar state in sync ensures screen reader users always hear the correct `aria-pressed` value regardless of how the formatting was triggered.

---

## 8. Focus Visibility

Every interactive element (toolbar buttons, editor area) must have a visible focus indicator meeting these minimum specifications:

| Property | Requirement |
|---|---|
| Outline width | ≥ 2px solid |
| Outline color | Must achieve 3:1 contrast against both the button background and the page background |
| Forced Colors / Windows High Contrast | Must use `Highlight` or `ButtonText` system keywords so the outline remains visible |

**Mandatory CSS pattern:**

```css
:focus-visible {
  outline: 2px solid #005fcc; /* Meets 3:1 on white and light gray backgrounds */
  outline-offset: 2px;
}
```

If `outline: none` appears anywhere in the stylesheet for these elements, a visible replacement (e.g., `box-shadow`, custom border) with equivalent contrast MUST be present in the same rule. Removing focus outlines without a replacement is a WCAG 2.4.11 failure.

**Forced colors:**

```css
@media (forced-colors: active) {
  :focus-visible {
    outline: 2px solid Highlight;
  }
}
```

---

## 9. Color Contrast — Active vs. Inactive Button States

Active (pressed) buttons must be visually distinguishable from inactive buttons using **at least two** of the following cues:

1. **Color** — background or icon color change (must meet 3:1 non-text contrast ratio between active and inactive states per WCAG 1.4.11)
2. **Weight / border** — a visible border or font-weight change on the button icon
3. **Shape / fill** — filled background vs. outline-only

Using color alone to distinguish active state is prohibited. Students with color vision deficiencies must be able to identify active formatting through a non-color cue.

---

## 10. Screen Reader Announcements

When formatting is toggled, the state change is communicated via `aria-pressed` — no additional live region is required for toolbar button toggles. Screen readers will announce the new state as part of normal focus/activation semantics.

However, if formatting state changes in response to the cursor moving into already-formatted text (e.g., the Bold button updates to `aria-pressed="true"` when the cursor enters bold text), a **polite live region** should announce the change:

```html
<div aria-live="polite" aria-atomic="true" class="sr-only" id="format-status"></div>
```

```js
// Update when cursor position changes formatting context
document.getElementById('format-status').textContent =
  isBold ? 'Bold on' : 'Bold off';
```

This ensures screen reader users always know what formatting is active at the current cursor position — matching the experience a sighted user gets from visually scanning the toolbar.

---

## 11. Mobile Touch Targets

All toolbar buttons must have a minimum tap target size of **44×44 CSS pixels** (WCAG 2.5.5 Target Size, AA in WCAG 2.2).

```css
.toolbar-button {
  min-width: 44px;
  min-height: 44px;
  /* Visual size may be smaller if padding supplies the touch area */
  padding: 10px;
}
```

Icons or glyphs within the button may be smaller, but the clickable/tappable area must be at least 44×44.

---

## 12. Anti-Patterns — Do Not Do These

| Anti-pattern | Why it fails | Required alternative |
|---|---|---|
| `outline: none` with no replacement | Removes all focus visibility; fails WCAG 2.4.11 | Provide `:focus-visible` with ≥ 2px outline |
| Color alone for active state | Fails for color-blind users; fails WCAG 1.4.11 | Add border, weight, or fill as a second cue |
| Unlabeled editor area | Screen readers cannot identify the field | Add `role="textbox"`, `aria-multiline="true"`, `aria-label="Document editor"` |
| `tabindex` on every button | Breaks Tab navigation; toolbar becomes 3 Tab stops instead of 1 | Roving tabindex: only one button holds `tabindex="0"` |
| `aria-pressed` as a string `"active"` | Not a valid `aria-pressed` value; ignored by some AT | Use `"true"` or `"false"` (boolean strings) only |
| Tooltips that omit the shortcut | Keyboard users have no way to discover Ctrl+B etc. | Always include `title="Bold (Ctrl+B)"` |
| Forgetting Forced Colors media query | Focus outlines disappear in Windows High Contrast Mode | Add `@media (forced-colors: active)` rule |

---

## 13. Testing Checkpoints for Switch

Switch's test plan must verify the following at a minimum:

- [ ] `role="toolbar"` and `aria-label="Formatting"` present on toolbar container
- [ ] `role="textbox"`, `aria-multiline="true"`, `aria-label="Document editor"` present on editor
- [ ] `aria-pressed` toggles between `"true"` and `"false"` on activation
- [ ] Arrow keys navigate between toolbar buttons; Tab exits the toolbar
- [ ] Ctrl+B / Ctrl+I / Ctrl+U apply formatting from within the editor
- [ ] Toolbar `aria-pressed` state updates when shortcuts are used
- [ ] All buttons meet 44×44px touch target minimum
- [ ] Focus outline is visible on all interactive elements (manual visual check + automated contrast check)
- [ ] Active/inactive button states are distinguishable without relying on color alone
- [ ] NVDA + Chrome: activating Bold announces "Bold on, button" (or equivalent)
- [ ] JAWS + Chrome/Edge: same as above
- [ ] VoiceOver + Safari (macOS): same as above
- [ ] Windows High Contrast Mode: focus indicator remains visible

---

## 14. References

- WCAG 2.2 Success Criterion 1.4.11 — Non-text Contrast
- WCAG 2.2 Success Criterion 2.1.1 — Keyboard
- WCAG 2.2 Success Criterion 2.4.7 — Focus Visible
- WCAG 2.2 Success Criterion 2.4.11 — Focus Appearance
- WCAG 2.2 Success Criterion 2.5.5 — Target Size
- WCAG 2.2 Success Criterion 4.1.2 — Name, Role, Value
- [ARIA Authoring Practices Guide: Toolbar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)
- [ARIA Authoring Practices Guide: Button Pattern (Toggle)](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
