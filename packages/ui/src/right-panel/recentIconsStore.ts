// Persistent recently-used icon store (localStorage-backed, max 12 entries)

const STORAGE_KEY = "monoscape-recent-icons";
const MAX_RECENT = 12;

export interface RecentIcon {
  id: string;
  name: string;
  svg: string;
  usedAt: number;
}

function load(): RecentIcon[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as RecentIcon[];
  } catch {
    return [];
  }
}

function save(icons: RecentIcon[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
  } catch {
    /* storage unavailable */
  }
}

export function getRecentIcons(): RecentIcon[] {
  return load().slice(0, MAX_RECENT);
}

export function recordRecentIcon(id: string, name: string, svg: string): void {
  const existing = load().filter((ic) => ic.id !== id);
  const next: RecentIcon[] = [{ id, name, svg, usedAt: Date.now() }, ...existing].slice(
    0,
    MAX_RECENT
  );
  save(next);
}

export function removeRecentIcon(id: string): void {
  const existing = load().filter((ic) => ic.id !== id);
  save(existing);
}

export function clearRecentIcons(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
