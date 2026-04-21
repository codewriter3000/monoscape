---
name: "runtime-shell-selection"
description: "Choose platform containers for a thin-shell web-first product without collapsing shared boundaries."
domain: "architecture"
confidence: "high"
source: "earned"
tools:
  - name: "view"
    description: "Read app shells, package manifests, and squad decisions before choosing runtimes."
    when: "When a repo already has shared packages and thin platform entrypoints"
  - name: "apply_patch"
    description: "Record the runtime split in team history and decisions."
    when: "After reaching a durable cross-platform recommendation"
---

## Context
Use this when a product has a shared web UI or editor surface, thin app shells, and a need to choose execution environments for web, mobile, and desktop without overcommitting the core architecture to one native stack.

## Patterns
- Keep the browser build as the canonical shared frontend artifact.
- Use Capacitor when mobile shells are thin and the team needs Android/iOS execution fast.
- Avoid using Capacitor as the desktop standard; prefer a desktop-native shell like Tauri when file system, windows, and host integration matter.
- Keep native APIs behind shell-owned adapters so shared packages never import container-specific code.

## Anti-Patterns
- Letting a mobile container define the architecture for desktop.
- Duplicating editor logic separately for browser, mobile, and desktop shells.
- Mixing Capacitor or Tauri calls directly into shared UI components.

## Examples
- `apps/web` owns the shared browser-hosted UI.
- `apps/mobile` wraps the shared UI with Capacitor for Android-first execution.
- `apps/desktop` wraps the shared UI with Tauri while keeping native code at the shell edge.
