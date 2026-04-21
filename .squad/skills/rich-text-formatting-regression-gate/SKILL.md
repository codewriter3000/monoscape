---
skill_name: Rich Text Formatting Regression Gate
domain: Editor QA
last_updated: 2026-04-21
maturity: Emerging
---

# Rich Text Formatting Regression Gate

Use this when a `contentEditable` editor gains new formatting controls and confidence is high but proof is weak.

## Pattern

Evaluate the work in five buckets:

1. **Surface completeness** — Are all requested controls actually present?
2. **Selection safety** — Do toolbar interactions preserve the intended range/caret?
3. **Mixed-format integrity** — Do combined styles survive without markup corruption?
4. **Keyboard boundaries** — Do Tab, Shift+Tab, arrows, Enter, and Escape behave differently in the toolbar vs editor?
5. **Fallback cleanup** — When a style source disappears (font removed, unavailable family, etc.), is existing DOM rewritten to a stable fallback?

## Why it works

Rich-text regressions hide in combinations, not happy paths. A control can exist, validate cleanly, and still fail when mixed selections, DOM mutations, or keyboard focus changes are involved.

## Reusable Gate

Reject if any of these are missing:

- Requested control not implemented
- Mixed selection state lies in the toolbar
- Collapsed-caret changes do not persist into typed content
- Existing content keeps stale style references after source deletion
- Tab behavior is not explicitly split between toolbar navigation and editor indentation
- Only utility tests pass while editor behavior remains unproven

## Minimal Repro Set

1. Apply style to expanded selection
2. Apply same style at collapsed caret and type
3. Combine 3+ styles on the same content
4. Undo/redo the combined change
5. Copy/paste the combined change
6. Trigger any deletion/fallback path and inspect old + new content
7. Verify keyboard-only flow in both toolbar and editor contexts

## Stronger Repo-Level Proof

When the stack cannot do full browser E2E yet, add the closest editor-surface tests you can:

- mount the shared editor in jsdom
- create live `Range` selections across heterogeneous spans/blocks
- assert toolbar value controls fall back to `Mixed` instead of a concrete lie
- commit one formatting change from the toolbar and verify only the targeted property becomes uniform
- assert editor `keydown` handling does **not** swallow browser-native undo/redo/copy/paste shortcuts
- assert raw `Tab` still escapes the editor while dedicated indent shortcuts keep working

## Monoscape Reference

- `packages/ui/src/FormattingToolbar.tsx`
- `packages/ui/src/TextEditor.tsx`
- `packages/document-core/src/index.ts`
- `.squad/decisions/inbox/switch-formatting-expansion-gate.md`
