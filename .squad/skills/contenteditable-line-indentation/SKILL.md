---
skill_name: ContentEditable Line Indentation
domain: Editor Interaction Patterns
wcag_target: 2.2 AA
last_updated: 2026-04-21
maturity: Implemented
---

# ContentEditable Line Indentation

A reusable pattern for Tab / Shift+Tab indentation in a shared `contentEditable` editor that still works when the selection covers partial lines and mixed inline typography spans.

## Problem

Naive indentation approaches break fast:

- `document.execCommand("indent")` is inconsistent across browsers
- rewriting `textContent` destroys inline styling spans
- partial-line selections often indent only the exact substring instead of the whole line

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
5. Rebuild the plain-text model and restore the selection by text indices so the user keeps the same logical selection after the DOM mutation.

## Why This Works

- Preserves inline spans created by mixed typography formatting
- Treats partial-line selections as whole-line operations
- Keeps Tab / Shift+Tab behavior in the shared editor without requiring a richer document schema

## Monoscape Reference

- `packages/ui/src/TextEditor.tsx`

## Validation

- `npm run validate`
- `npm run build:desktop`
