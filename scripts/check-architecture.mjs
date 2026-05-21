#!/usr/bin/env node
/**
 * Monoscape microkernel architecture fitness function.
 *
 * Enforces three invariants:
 *
 *   RULE-1  dependency-direction
 *           Package dependency layers must only point inward:
 *           apps → packages/extensions → kernel.
 *           No cross-extension imports.
 *
 *   RULE-2  theme-isolation
 *           Hardcoded CSS color values (hex literals) must not appear outside
 *           extensions/builtin/theme/.  All other files must use var(--mn-*).
 *           :root { --mn-* } definitions must live exclusively in
 *           extensions/builtin/theme/src/tokens.css.
 *           vars.css must not define tokens in packages/ui/.
 *
 *   RULE-3  builtin-completeness
 *           Every extensions/builtin/* directory must contain package.json,
 *           tsconfig.json, and src/index.ts, and must export defineExtension().
 *
 * Exit code 0 = all rules pass.  Exit code 1 = violations found.
 *
 * Files/lines containing "// @arch-override: hex-colors" are exempted from
 * the hex-color check in RULE-2 (use only for legitimate standalone exports
 * such as PDF templates where CSS vars cannot be resolved at runtime).
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");

// ── Helpers ──────────────────────────────────────────────────────────────────

const SEP_RE = /[\\/]/g;
function normSep(p) {
  return p.replace(SEP_RE, "/");
}

const GLOBAL_EXCLUDES = [
  "node_modules",
  "dist",
  "target",
  ".git",
  "android",
];

function isExcluded(rel) {
  return GLOBAL_EXCLUDES.some((ex) => normSep(rel).split("/").includes(ex));
}

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full);
    if (isExcluded(rel)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function readLines(filePath) {
  return readFileSync(filePath, "utf-8").split("\n");
}

function readJSON(filePath) {
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

// ── Violation collector ───────────────────────────────────────────────────────

const violations = [];

function fail(rule, filePath, line, message) {
  violations.push({ rule, file: normSep(relative(ROOT, filePath)), line, message });
}

// ── RULE 1: Dependency direction ─────────────────────────────────────────────

function checkDependencyDirection() {
  const RULE = "RULE-1:dependency-direction";

  // packages/kernel must have zero @monoscape/* dependencies
  const kernelPkgPath = join(ROOT, "packages/kernel/package.json");
  const kernelPkg = readJSON(kernelPkgPath);
  for (const dep of Object.keys({ ...kernelPkg.dependencies, ...kernelPkg.devDependencies })) {
    if (dep.startsWith("@monoscape/")) {
      fail(RULE, kernelPkgPath, 0, `packages/kernel must not depend on ${dep} — kernel is the innermost layer`);
    }
  }

  // packages/extension-sdk must only depend on @monoscape/kernel
  const sdkPkgPath = join(ROOT, "packages/extension-sdk/package.json");
  const sdkPkg = readJSON(sdkPkgPath);
  for (const dep of Object.keys({ ...sdkPkg.dependencies, ...sdkPkg.devDependencies })) {
    if (dep.startsWith("@monoscape/") && dep !== "@monoscape/kernel") {
      fail(RULE, sdkPkgPath, 0, `packages/extension-sdk must not depend on ${dep}`);
    }
  }

  // packages/ui must not import from extensions/builtin/*
  const uiSrcDir = join(ROOT, "packages/ui/src");
  const uiFiles = walk(uiSrcDir).filter((f) => [".ts", ".tsx", ".css"].includes(extname(f)));
  for (const file of uiFiles) {
    const lines = readLines(file);
    lines.forEach((line, i) => {
      if (/(?:from|import)\s+["']@monoscape\/extension-/.test(line)) {
        fail(RULE, file, i + 1, `packages/ui must not import from extensions: ${line.trim()}`);
      }
    });
  }

  // extensions/builtin/* must not import from sibling extensions
  const builtinDir = join(ROOT, "extensions/builtin");
  for (const extName of readdirSync(builtinDir)) {
    const extSrcDir = join(builtinDir, extName, "src");
    if (!existsSync(extSrcDir)) continue;
    const extFiles = walk(extSrcDir).filter((f) => [".ts", ".tsx"].includes(extname(f)));
    for (const file of extFiles) {
      const lines = readLines(file);
      lines.forEach((line, i) => {
        const m = line.match(/from\s+["'](@monoscape\/extension-[^"']+)["']/);
        if (m && m[1] !== "@monoscape/extension-sdk") {
          fail(RULE, file, i + 1, `extension "${extName}" must not import from sibling extension ${m[1]}`);
        }
      });
    }
  }
}

// ── RULE 2: Theme isolation ───────────────────────────────────────────────────

// Matches a bare hex CSS color: #rgb, #rgba, #rrggbb, #rrggbbaa
const HEX_COLOR_RE = /#[0-9a-fA-F]{3,8}(?![0-9a-fA-F\w-])/;

function isThemeFile(absPath) {
  return normSep(relative(ROOT, absPath)).startsWith("extensions/builtin/theme/");
}

function checkThemeIsolation() {
  const RULE = "RULE-2:theme-isolation";

  // Collect all source files (excluding backups, snapshot files, and unit test files)
  const allFiles = [
    ...walk(join(ROOT, "packages")),
    ...walk(join(ROOT, "apps")),
    ...walk(join(ROOT, "extensions")),
  ].filter((f) => {
    const ext = extname(f);
    const name = basename(f);
    return (
      [".ts", ".tsx", ".css"].includes(ext) &&
      !name.endsWith(".backup") &&
      !name.endsWith(".test") &&
      // Exclude *.test.ts / *.spec.ts — hex values in test fixtures are test data, not styles
      !name.match(/\.(test|spec)\.(ts|tsx)$/)
    );
  });

  for (const file of allFiles) {
    if (isThemeFile(file)) continue;

    const lines = readLines(file);

    // Check for @arch-override at the file level
    const hasFileOverride = lines.some((l) => l.includes("@arch-override: hex-colors"));
    if (hasFileOverride) continue;

    lines.forEach((line, i) => {
      // Skip pure comment lines
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;

      if (HEX_COLOR_RE.test(line)) {
        const m = line.match(HEX_COLOR_RE);
        fail(
          RULE, file, i + 1,
          `Hardcoded color ${m[0]} — replace with a var(--mn-*) token from extensions/builtin/theme/src/tokens.css`
        );
      }
    });
  }

  // :root { --mn-* } definitions must only appear in the theme extension
  const cssFiles = allFiles.filter((f) => extname(f) === ".css");
  for (const file of cssFiles) {
    if (isThemeFile(file)) continue;
    const content = readFileSync(file, "utf-8");
    if (/:root\s*\{/.test(content) && /--mn-/.test(content)) {
      fail(
        RULE, file, 0,
        "CSS design token definitions (:root { --mn-* }) must only appear in extensions/builtin/theme/src/tokens.css"
      );
    }
  }

  // vars.css in packages/ui must no longer define tokens
  const uiVarsCss = join(ROOT, "packages/ui/src/vars.css");
  if (existsSync(uiVarsCss)) {
    const content = readFileSync(uiVarsCss, "utf-8");
    if (/:root\s*\{/.test(content) && /--mn-/.test(content)) {
      fail(
        RULE, uiVarsCss, 0,
        "packages/ui/src/vars.css still defines tokens — they must live in extensions/builtin/theme/src/tokens.css"
      );
    }
  }
}

// ── RULE 3: Builtin extension completeness ────────────────────────────────────

function checkBuiltinCompleteness() {
  const RULE = "RULE-3:builtin-completeness";
  const builtinDir = join(ROOT, "extensions/builtin");

  for (const extName of readdirSync(builtinDir)) {
    const extDir = join(builtinDir, extName);
    if (!statSync(extDir).isDirectory()) continue;

    const required = [
      "package.json",
      "tsconfig.json",
      join("src", "index.ts"),
    ];

    for (const req of required) {
      if (!existsSync(join(extDir, req))) {
        fail(RULE, extDir, 0, `extensions/builtin/${extName} is missing required file: ${req}`);
      }
    }

    const indexFile = join(extDir, "src", "index.ts");
    if (existsSync(indexFile)) {
      const content = readFileSync(indexFile, "utf-8");
      if (!content.includes("defineExtension(")) {
        fail(
          RULE, indexFile, 0,
          `extensions/builtin/${extName}/src/index.ts must export a defineExtension() call`
        );
      }
    }
  }
}

// ── Run all rules ─────────────────────────────────────────────────────────────

console.log("Monoscape microkernel architecture fitness function\n");

checkDependencyDirection();
checkThemeIsolation();
checkBuiltinCompleteness();

// ── Report ────────────────────────────────────────────────────────────────────

if (violations.length === 0) {
  console.log("✓  All architecture rules passed.\n");
  process.exit(0);
}

console.log(`✗  Found ${violations.length} violation(s):\n`);

const byRule = {};
for (const v of violations) {
  (byRule[v.rule] ??= []).push(v);
}

for (const [rule, vs] of Object.entries(byRule)) {
  const passing = vs.length === 0;
  console.log(`  [${rule}] — ${passing ? "PASS" : `${vs.length} violation(s)`}`);
  for (const v of vs) {
    const loc = v.line > 0 ? `:${v.line}` : "";
    console.log(`    ${v.file}${loc}`);
    console.log(`      → ${v.message}`);
  }
  console.log();
}

process.exit(1);
