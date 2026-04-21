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
- **[2026-04-21] Trinity Layout Inspection:** TextEditor and FormattingToolbar are functionally complete with proper 12pt Liberation Serif, focus management, and keyboard navigation. MonoscapeShell layout is agnostic. Web app correctly wires TextEditor; desktop app needs TextEditor integration. Canvas centering best achieved via TextEditor wrapper (max-width: 800px, margin: auto). Pattern: self-contained TextEditor with owned toolbar, not split across layout slots — maximizes reusability and aligns with microkernel design. Implementation plan merged into .squad/decisions.md (Decision #5).
- **[2026-04-21] Scribe Session:** Layout review and accessibility audit complete. Trinity to implement: (1) centered canvas with max-width ~800px responsive layout, (2) desktop app TextEditor integration, (3) keyboard focus escape from toolbar to editor (Oracle Concern 2). Design/Product to address visual hierarchy defaults (Concern 3). All findings merged to .squad/decisions.md.
