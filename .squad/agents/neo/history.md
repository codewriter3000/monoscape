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
