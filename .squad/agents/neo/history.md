# Project Context

- **Owner:** Alex Micharski
- **Project:** monoscape
- **Stack:** SolidJS UI, microkernel architecture, extension discovery and installation, mobile and desktop first
- **Created:** 2026-04-21T06:58:17.132-04:00

## Learnings

- Monoscape is a word processor meant to compete with Google Docs and Microsoft Word.
- WCAG 2.2 ADA compliance is a core product requirement.
- The product is designed around college-student workflows.
- Extensions are part of the product strategy and should fit the microkernel architecture.
- The project is MIT licensed with no premium feature split.
- Established an npm workspaces scaffold with `apps/*`, `packages/*`, and `extensions/builtin/*` to preserve the microkernel boundary.
- Reserved `packages/kernel`, `packages/document-core`, `packages/ui`, and `packages/extension-sdk` as the first shared layers for bootstrapping, student workflows, shared SolidJS UI, and extension authoring.
- Added thin client shells at `apps/desktop`, `apps/mobile`, and `apps/web`; web is a preview surface while desktop/mobile remain runtime-agnostic until native container choices are validated.
- Created built-in extension packages at `extensions/builtin/citations` and `extensions/builtin/review` so extension discovery and installation can evolve around one package shape.
- Root developer foundation now lives in `package.json`, `tsconfig.base.json`, `README.md`, and `LICENSE`.
- **[2026-04-21] Scribe Session:** Layout review reconciliation complete. Trinity's implementation plan (centered canvas, desktop TextEditor integration) and Oracle's accessibility findings (focus escape blocker, styling defaults) all merged to .squad/decisions.md (Decisions #1–7). Desktop app TextEditor integration decision logged (Decision #7). Team ready for implementation.
- Cross-app drafting layout belongs in `packages/ui/src/index.tsx` via `MonoscapeShell`; app shells should pass content, not re-implement canvas framing.
- Shared editor chrome belongs in `packages/ui/src/TextEditor.tsx` and `packages/ui/src/FormattingToolbar.tsx`, with typography sourced from `packages/document-core/src/index.ts`.
- `apps/web/src/App.tsx` and `apps/desktop/src/App.tsx` now both consume the shared editor surface, keeping platform shells thin and the microkernel boundary intact.
- **[2026-04-21] BASE LAYOUT SESSION COMPLETE:** All agents (Trinity, Oracle, Switch) completed work on base layout feature. Trinity implemented shared TextEditor, FormattingToolbar, MonoscapeShell components. Oracle reviewed and approved accessibility baseline (WCAG 2.2 AA). Switch completed acceptance testing. All acceptance criteria met. Desktop app TextEditor integration complete. Keyboard focus escape blocker resolved. Build clean. Decisions #1–#7 merged to .squad/decisions.md. Trinity's implementation plan confirmed (Decision #5 revised). Feature ready for merge. Orchestration logs: .squad/orchestration-log/2026-04-21T12-14-19-{neo,trinity,oracle,switch}.md. Session log: .squad/log/2026-04-21T12-14-19-base-layout.md.
