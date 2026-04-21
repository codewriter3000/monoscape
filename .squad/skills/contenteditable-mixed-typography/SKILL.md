---
skill_name: ContentEditable Mixed Typography
domain: Editor Interaction Patterns
wcag_target: 2.2 AA
last_updated: 2026-04-21
maturity: Implemented
---

# ContentEditable Mixed Typography

A reusable pattern for making font-family and font-size controls behave like Google Docs or Microsoft Word inside a shared `contentEditable` editor.

## Problem

Container-level typography state makes the whole document change at once and breaks the expectation that:

- selected text changes locally
- collapsed caret changes become the insertion style for future typing
- the toolbar reflects the caret's real font family and size, even in mixed-font documents

## Pattern

1. Keep the editable root on a stable document default (`DEFAULT_TYPOGRAPHY`).
2. Track the current editor selection explicitly with a saved `Range`.
3. For expanded selections, wrap only intersecting text segments in styled spans.
4. For collapsed selections, insert a temporary typing span with the chosen typography so the next typed text inherits it.
5. Resolve computed `font-family` stacks back to the known font catalog before syncing toolbar state.
6. Validate saved ranges before restoring them after DOM mutations.

## Monoscape Reference

- `packages/ui/src/TextEditor.tsx`
- `packages/ui/src/FormattingToolbar.tsx`
- `packages/document-core/src/index.ts`

## Key Moves

### 1. Expanded Selection Styling

- Walk text nodes inside the editor with `TreeWalker`
- Keep only nodes intersecting the current range
- Split text nodes at selection boundaries with `splitText()`
- Wrap selected segments in a span carrying the new inline typography
- Merge adjacent spans when they end up with the same signature

### 2. Collapsed Caret Styling

- Restore the saved range
- Insert a temporary span with a zero-width non-editable anchor element
- Apply inline `font-family` and `font-size`
- Place the caret at the end of that span so the browser inserts new text into it
- Remove the anchor once real text appears, then convert the typing span into a normal typography span
- Return focus to the editor after toolbar-driven font commits so the pending caret style is not discarded while a control keeps focus

### 3. Toolbar Sync

- On `selectionchange`, read computed styles from the caret or selection start
- Convert browser font stacks back into catalog names with `resolveKnownFontFamily()`
- Push that normalized typography back into the toolbar controls

### 4. Range Safety

- DOM mutations from `splitText()` can detach stored ranges
- Before restoring a saved range, confirm both endpoints still belong to the current editor
- If not, fall back to a collapsed range at the editor end

## When to Use

Use this when:

- the editor is shared across shells
- users expect mixed typography in a single document
- toolbar controls must behave like desktop word processors

Avoid this when:

- the editor stores document state in a richer schema already handling inline marks and typography spans

## Accessibility Notes

- Keep the toolbar keyboard-safe while the editor selection is preserved
- Prevent mouse-down on toolbar buttons that should not collapse the editor selection
- Make picker Escape paths return focus predictably

## Validation

- `npm run validate`
- `npm run build:desktop`
