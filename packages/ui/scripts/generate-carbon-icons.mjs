/**
 * Generates packages/ui/src/carbonIconsData.ts from the @carbon/icons package.
 * Run with: node packages/ui/scripts/generate-carbon-icons.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const carbonRoot = join(__dirname, '../../../node_modules/@carbon/icons');
const metaPath = join(carbonRoot, 'metadata.json');

const meta = JSON.parse(readFileSync(metaPath, 'utf8'));

// Build icon-name → top-level category map
const iconToCategory = new Map();
if (Array.isArray(meta.categories)) {
  for (const cat of meta.categories) {
    const catName = String(cat.name ?? 'Other');
    const subs = Array.isArray(cat.subcategories) ? cat.subcategories : [];
    for (const sub of subs) {
      const members = Array.isArray(sub.members) ? sub.members : [];
      for (const member of members) {
        iconToCategory.set(String(member).toLowerCase(), catName);
      }
    }
  }
}

/**
 * Pick the best (smallest) optimized SVG from a Carbon icon's assets array.
 * Prefer size=32 first, then take the first available.
 */
function pickSvg(assets) {
  if (!Array.isArray(assets) || assets.length === 0) return null;
  const size32 = assets.find(a => a.size === 32);
  const asset = size32 ?? assets[0];
  return asset?.optimized?.data ?? asset?.source ?? null;
}

/**
 * Strip XML header / comments and ensure the SVG has fill="currentColor" so
 * it inherits the container's CSS color for theming.
 */
function normalizeSvg(raw) {
  // Remove XML declaration if present
  let svg = raw.replace(/<\?xml[^?]*\?>/g, '').trim();
  // Remove <title> and <defs><style>…</style></defs> from source SVGs (not optimized)
  svg = svg.replace(/<title>[^<]*<\/title>/gi, '');
  // Ensure fill="currentColor" on the root <svg> element so CSS color controls it
  if (!svg.includes('fill=')) {
    svg = svg.replace(/^<svg /, '<svg fill="currentColor" ');
  }
  return svg;
}

const icons = [];

for (const icon of meta.icons) {
  const id = String(icon.name ?? '');
  if (!id) continue;

  const svg = pickSvg(icon.assets);
  if (!svg) continue;

  const name = String(icon.friendlyName ?? id);
  const category = iconToCategory.get(id.toLowerCase()) ?? 'Other';

  icons.push({ id, name, category, svg: normalizeSvg(svg) });
}

// Stable sort: category then name
icons.sort((a, b) => {
  const catCmp = a.category.localeCompare(b.category);
  return catCmp !== 0 ? catCmp : a.name.localeCompare(b.name);
});

// Compact JSON — one object per line for readable diffs
const entries = icons.map(i => JSON.stringify(i)).join(',\n  ');

const tsContent = `// Auto-generated from @carbon/icons – do not edit manually.
// Regenerate: node packages/ui/scripts/generate-carbon-icons.mjs
// Icons: ${icons.length}

export interface CarbonIconData {
  /** Original Carbon icon name, e.g. "add" or "3D-Cursor" */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Top-level IBM Carbon category */
  category: string;
  /** Optimized inline SVG markup (fill="currentColor") */
  svg: string;
}

export const CARBON_ICONS: CarbonIconData[] = [
  ${entries}
];
`;

const outPath = join(__dirname, '../src/carbonIconsData.ts');
writeFileSync(outPath, tsContent, 'utf8');
console.log(`✓ Generated ${icons.length} Carbon icons → ${outPath}`);
