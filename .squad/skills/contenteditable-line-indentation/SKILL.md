---
skill_name: ContentEditable Line Indentation
domain: Editor Interaction Patterns
wcag_target: 2.2 AA
last_updated: 2026-04-21
maturity: Implemented
---

# ContentEditable Line Indentation

A reusable pattern for accessible line indentation in a shared `contentEditable` editor that still works when the selection covers partial lines and mixed inline typography spans.

## Problem

Naive indentation approaches break fast:

- `document.execCommand("indent")` is inconsistent across browsers
- rewriting `textContent` destroys inline styling spans
- partial-line selections often indent only the exact substring instead of the whole line
- hijacking raw `Tab` / `Shift+Tab` traps keyboard users inside the editor

## Pattern

1. Preserve the editor selection in a saved `Range`.
2. Build a lightweight plain-text model over the live DOM:
   - count text-node characters
   - treat `<br>` as newline boundaries
   - record each line start as both a text index and a DOM boundary point
3. Expand the affected region to whole lines by finding the first and last line-start entries touched by the selection.
4. Apply indentation from the bottom upward so earlier DOM positions stay valid:
   - **Indent:** insert a leading `\\t` at each selected line start
   - **Outdent:** remove one leading `\\t` when present
5. If product keeps raw `Tab` / `Shift+Tab` for indentation, pair it with an explicit keyboard exit such as `Escape` moving focus to a known toolbar control; otherwise trigger indentation from toolbar buttons and modifier shortcuts (for example `Ctrl+]` / `Ctrl+[`). In both cases, expose the escape rule in visible help text or `aria-describedby`.
6. Rebuild the plain-text model and restore the selection by text indices so the user keeps the same logical selection after the DOM mutation.

## Why This Works

- Preserves inline spans created by mixed typography formatting
- Treats partial-line selections as whole-line operations
- Keeps indentation available without breaking WCAG keyboard escape expectations
- Makes the escape path deterministic enough to prove in jsdom regression tests

## Monoscape Reference

- `packages/ui/src/TextEditor.tsx`
- `packages/ui/src/FormattingToolbar.tsx`
- `packages/ui/src/TextEditor.test.tsx`

## Validation

- `npm run validate`
- `npm run build:desktop`
