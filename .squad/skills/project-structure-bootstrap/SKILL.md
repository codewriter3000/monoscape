---
name: "project-structure-bootstrap"
description: "Bootstrap a cross-platform SolidJS monorepo without locking the product into one client runtime."
domain: "architecture"
confidence: "high"
source: "earned"
tools:
  - name: "view"
    description: "Read squad decisions and history before shaping repo structure."
    when: "Before creating shared workspace boundaries or team-facing artifacts"
  - name: "powershell"
    description: "Create scaffold files and validate workspace commands."
    when: "When applying a broad but mechanical project bootstrap"
---

## Context
Use this when a repo has little or no application code yet, but the product direction already demands multiple clients, shared domain packages, and an extension model. The goal is to establish durable seams early without overcommitting to runtime-specific tooling.

## Patterns
- Put platform shells in `apps/*` and keep them thin.
- Put product logic and contracts in `packages/*`, especially kernel and extension SDK boundaries.
- Keep built-in extensions in `extensions/builtin/*` so future installable extensions can follow the same package shape.
- Use a lightweight preview client if needed, but do not let that client define the architecture for all platforms.

## Examples
- `apps/desktop`, `apps/mobile`, and `apps/web` each consume shared packages rather than owning core logic.
- `packages/kernel` defines bootstrap and extension contracts.
- `packages/extension-sdk` wraps kernel contracts for extension authors.

## Anti-Patterns
- Building the editor core directly inside one app client.
- Mixing extension manifests into app-shell code.
- Picking desktop or mobile runtime infrastructure before the shared package seams are in place.
