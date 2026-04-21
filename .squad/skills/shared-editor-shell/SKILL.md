---
name: "shared-editor-shell"
description: "Keep the application frame and drafting canvas in shared UI so multiple clients can reuse the same editor chrome."
domain: "architecture"
confidence: "high"
source: "earned"
tools:
  - name: "view"
    description: "Read shared shell, editor, and squad decisions before placing layout work."
    when: "Before changing app chrome or editor canvas structure"
  - name: "apply_patch"
    description: "Make coordinated but surgical updates across shared UI and thin app shells."
    when: "When a layout change must land once and be reused by web and desktop"
---

## Context
Use this when a feature needs a page frame, toolbar, or document canvas that should behave the same across multiple Monoscape clients. The goal is to keep apps thin and keep runtime-specific shells from owning editor behavior.

## Patterns
- Put page-level framing in `packages/ui/src/index.tsx` (`MonoscapeShell`).
- Put the paper-like document surface in `packages/ui/src/TextEditor.tsx`.
- Put formatting controls in `packages/ui/src/FormattingToolbar.tsx`.
- Source typography defaults from `packages/document-core/src/index.ts` so the editor and document model do not drift.
- Let `apps/web` and `apps/desktop` compose the shared UI rather than restyling it independently.

## Anti-Patterns
- Building a browser-only toolbar directly in `apps/web`.
- Hardcoding typography in UI when document-core already defines the default.
- Letting each client invent its own document canvas spacing, width, or focus treatment.

## Examples
- `packages/ui/src/index.tsx` centers the main canvas and wraps secondary content in a shared shell card.
- `packages/ui/src/TextEditor.tsx` renders a paper-like canvas with the shared 12pt Liberation Serif baseline.
- `apps/web/src/App.tsx` and `apps/desktop/src/App.tsx` both pass `TextEditor` into `MonoscapeShell` instead of maintaining separate editor layouts.
