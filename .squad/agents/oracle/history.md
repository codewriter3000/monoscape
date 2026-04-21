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
- **[2026-04-21] Base Editor Architecture (Oracle Review):** TextEditor uses SolidJS contentEditable with role="textbox"; FormattingToolbar implements arrow-key navigation with manual focus management and aria-pressed state. Semantic HTML structure (main > header/section/footer) is strong. Key accessibility gap: keyboard navigation does not provide clear exit from toolbar to editor (focus trap risk). Document defaults (12pt Liberation Serif, 1.5 line height) follow academic ergonomics. Decision inbox entries created and merged to .squad/decisions.md (Decisions #2, #3, #4).
- **[2026-04-21] Editor UX Patterns:** ContentEditable + execCommand pattern is stable and familiar to students; manual focus management in toolbar requires Tab/Arrow key coordination to avoid keyboard user entrapment. Button state signaling via aria-pressed is correct. Focus indicators use #4a90d9 outline (strong contrast). File paths: packages/ui/src/TextEditor.tsx, packages/ui/src/FormattingToolbar.tsx, packages/ui/src/index.tsx (MonoscapeShell).
- **[2026-04-21] Scribe Session:** Layout review audit findings merged to .squad/decisions.md. Key: toolbar focus trap (Concern 2, blocker), document affordance signal (Concern 1, design decision), default styling (Concern 3, product scope). All accessibility patterns meet WCAG 2.2 AA baseline. Trinity to implement focus escape fix.
