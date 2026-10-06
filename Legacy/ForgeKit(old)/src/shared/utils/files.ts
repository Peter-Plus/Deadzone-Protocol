import { readdir, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
export async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch((e: NodeJS.ErrnoException) => { if (e.code === 'ENOENT') return []; throw e; });
  const files: string[] = [];
  for (const entry of entries.sort((a, b) => a.name < b.name ? -1 : 1)) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full)); else if (entry.isFile()) files.push(full);
  }
  return files;
}
export function inside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate); return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}
export async function safeFile(root: string, relative: string) {
  const base = await realpath(root), candidate = await realpath(path.resolve(root, relative));
  if (!inside(base, candidate)) throw new Error('Asset path outside allowed root'); return candidate;
}
export function parseStrict(text: string): unknown {
  const data: unknown = JSON.parse(text);
  // JSON.parse silently drops duplicate properties, including duplicate bone tracks.
  const tokens = text.match(/"(?:\\.|[^"\\])*"|[{}\[\],:]|[^\s{}\[\],:]+/g) ?? []; let i = 0;
  const value = (location: string): void => {
    const t = tokens[i++];
    if (t === '{') {
      const seen = new Set<string>();
      while (tokens[i] !== '}') {
        const key = JSON.parse(tokens[i++]) as string;
        if (seen.has(key)) throw new Error(`Duplicate property/track at ${location}.${key}`);
        seen.add(key); i++; value(`${location}.${key}`); if (tokens[i] === ',') i++;
      } i++;
    } else if (t === '[') { let n = 0; while (tokens[i] !== ']') { value(`${location}[${n++}]`); if (tokens[i] === ',') i++; } i++; }
  };
  value('$'); return data;
}
export async function readJson(file: string) { return parseStrict((await readFile(file, 'utf8')).replace(/^\uFEFF/, '')); }
