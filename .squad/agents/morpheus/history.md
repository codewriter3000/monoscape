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
- **[2026-04-21] Runtime setup:** apps/web is the canonical Vite-built SolidJS surface; apps/mobile is a Capacitor Android shell targeting the Pixel_9a AVD; apps/desktop is a Tauri shell pointing at the shared web build.
