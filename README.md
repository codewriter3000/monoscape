# Monoscape

Monoscape is a SolidJS-based word processor scaffolded as a microkernel workspace with extension discovery and installation in mind. The repository is organized to keep the editor kernel, shared UI, client shells, and extensions decoupled from day one.

## Name and affiliation

Monoscape is an independent open source project. It is not affiliated with, endorsed by, or sponsored by any company, product, or service that uses the same or a similar name.

## Workspace layout

- `apps/desktop` — desktop shell boundary and bootstrap plan
- `apps/mobile` — mobile shell boundary and bootstrap plan
- `apps/web` — lightweight preview shell for shared Solid UI and extension composition
- `packages/kernel` — microkernel contracts for bootstrapping, extension discovery, and install planning
- `packages/document-core` — document/workspace domain seeds tuned for student workflows
- `packages/ui` — shared SolidJS shell primitives
- `packages/extension-sdk` — extension authoring helper around kernel contracts
- `extensions/builtin/*` — built-in extensions that ship with the platform by default

## Principles baked into the structure

- Platform shells stay thin; product logic belongs in shared packages.
- The kernel owns extension discovery contracts and installation planning.
- Built-in extensions live beside their manifests so they can later share the same installation path as marketplace extensions.
- Accessibility and student workflow constraints are represented in the shared domain model, not bolted on per app.

## Commands

```bash
npm install
npm run dev:web
npm run dev:desktop
npm run android:run
npm run typecheck
npm test
```

## Runtime shells

- **Web:** `npm run dev:web` (Vite at http://localhost:5173)
- **Desktop (Tauri):** `npm run dev:desktop` (wraps the shared web UI)
- **Android (Capacitor):**
  - Start the emulator only: `npm run android:emulator`
  - Start with a high-performance profile: `npm run android:emulator:high`
  - Sync the native shell: `npm run android:prepare`
  - Build and launch on `Pixel_9a`: `npm run android:run`

The web shell remains the canonical browser surface, while mobile and desktop keep only runtime-specific boot code in their own app boundaries.

## Desktop font sources

The desktop shell exposes Google Fonts search/download and custom font upload through Tauri commands so API keys and filesystem access stay out of the browser runtime.

- Set `GOOGLE_WEBFONTSDEVAPI` in `.env` (or your environment) before running the desktop shell.
- Google Fonts requests execute in the Rust backend; web/mobile shells do not call the API.
- Downloaded fonts and uploads are stored under the app data directory in a `fonts/` folder (never temp).

## Mobile diagnostics

### Console log streaming with custom levels

The mobile shell exposes a lightweight logger that streams to the console and can be tuned at runtime.

- Set once for a session (browser console or remote devtools):
  - `window.MonoscapeMobileLogging.setLevel("DEBUG")`
- Read the current level:
  - `window.MonoscapeMobileLogging.getLevel()`
- Persisted between reloads in localStorage (`monoscape.mobile.logLevel`)
- Optional build-time override: `VITE_MOBILE_LOG_LEVEL=DEBUG`
- Quick query param override (dev server): `?logLevel=debug`

Log levels available: `DEBUG`, `INFO`, `WARN`, `ERROR`.

### Emulator tuning (Pixel_9a AVD)

Use the launcher script to allocate more memory, cores, or GPU mode:

```bash
npm run android:emulator -- --memory 8192 --cores 8 --gpu host
```

You can also pass extra emulator flags after `--`:

```bash
npm run android:emulator -- --memory 8192 -- --no-snapshot
```

Environment overrides:

- `MONOSCAPE_AVD` (default `Pixel_9a`)
- `MONOSCAPE_EMULATOR_MEMORY_MB`
- `MONOSCAPE_EMULATOR_CORES`
- `MONOSCAPE_EMULATOR_GPU`
- `MONOSCAPE_EMULATOR_PATH`
