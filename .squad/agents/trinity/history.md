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
- **[2026-04-21] Team Update from Neo:** Monorepo scaffold established with apps (desktop, mobile, web), packages (kernel, document-core, ui, extension-sdk), and built-in extensions (citations, review). Root developer foundation complete. Microkernel architecture boundary preserved via npm workspaces.
- **[2026-04-21] Trinity:** Kept the base drafting frame in `packages/ui/src/index.tsx`, the paper canvas in `packages/ui/src/TextEditor.tsx`, and toolbar behavior in `packages/ui/src/FormattingToolbar.tsx` so web and desktop reuse the same centered editing surface.
- **[2026-04-21] Trinity:** The shared editor defaults to `DEFAULT_TYPOGRAPHY` from `packages/document-core/src/index.ts`, which currently means 12-point Liberation Serif for the document canvas.
- **[2026-04-21] Trinity:** Toolbar navigation now follows the shared accessibility pattern: arrow keys move within formatting buttons, ArrowRight exits from the last button into the editor, and button state resets when selection leaves the canvas.
- **[2026-04-21] Trinity Layout Inspection:** TextEditor and FormattingToolbar are functionally complete with proper 12pt Liberation Serif, focus management, and keyboard navigation. MonoscapeShell layout is agnostic. Web app correctly wires TextEditor; desktop app needs TextEditor integration. Canvas centering best achieved via TextEditor wrapper (max-width: 800px, margin: auto). Pattern: self-contained TextEditor with owned toolbar, not split across layout slots — maximizes reusability and aligns with microkernel design. Implementation plan merged into .squad/decisions.md (Decision #5).
- **[2026-04-21] Scribe Session:** Layout review and accessibility audit complete. Trinity to implement: (1) centered canvas with max-width ~800px responsive layout, (2) desktop app TextEditor integration, (3) keyboard focus escape from toolbar to editor (Oracle Concern 2). Design/Product to address visual hierarchy defaults (Concern 3). All findings merged to .squad/decisions.md.
- **[2026-04-21] BASE LAYOUT SESSION COMPLETE:** Trinity implementation approved. Shared TextEditor, FormattingToolbar, MonoscapeShell components integrated in packages/ui. Web and desktop both consume shared surface. Canvas centered (max-width 800px responsive). Keyboard focus escape fixed (ArrowRight from last button to editor). Typography: 12pt Liberation Serif + 1.5 line-height, sourced from packages/document-core. Toolbar: role=toolbar, aria-label, per-button aria-labels, aria-pressed state, roving tabindex. Editor: role=textbox, aria-multiline=true. Focus outline: 2px solid #4a90d9 (WCAG AA contrast verified). All acceptance criteria met. Desktop placeholder replaced with TextEditor. Build clean. Ready for merge. Orchestration logs: .squad/orchestration-log/2026-04-21T12-14-19-trinity.md. Session log: .squad/log/2026-04-21T12-14-19-base-layout.md.
- **[2026-04-21] Trinity Runtime Entrypoints:** Added thin runtime entry surfaces in `apps/web`, `apps/mobile`, and `apps/desktop` so each shell mounts the shared editor directly. Mobile now keeps safe-area handling plus Android startup scripts local to `apps/mobile` and targets `C:\Users\alex.MICHARSKI\.android\avd\Pixel_9a.avd`. Desktop now boots its own Vite frontend through Tauri instead of borrowing the web app entrypoint.
