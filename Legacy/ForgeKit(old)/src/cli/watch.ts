import chokidar from 'chokidar';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { AssetCompiler, PROJECT_ROOT } from '../compiler/AssetCompiler.js';
import { atomicWrite } from '../shared/utils/atomicWrite.js';
export function report(result: Awaited<ReturnType<AssetCompiler['validate']>>) {
  for (const r of result.reporters) if (r.issues.length) console.log(r.format());
  console.log(`${result.ok ? 'PASS' : 'FAIL'} · ${result.sources.length} definitions`);
}
export async function buildWithStatus(compiler: AssetCompiler) {
  let status: { ok: boolean; issues: unknown[]; message: string };
  try {
    const result = await compiler.build(); report(result);
    status = { ok: result.ok, issues: result.reporters.flatMap(r => r.issues), message: result.ok ? `Ready · ${result.sources.length} definitions` : 'Validation failed; last valid assets retained.' };
  } catch (error) { status = { ok: false, issues: [], message: String(error) }; console.error(error); }
  const file = path.join(compiler.output, '.forge-status.json'), text = JSON.stringify(status);
  if (await readFile(file, 'utf8').catch(() => '') !== text) await atomicWrite(file, text);
}
export async function watchAssets(compiler: AssetCompiler) {
  let timer: ReturnType<typeof setTimeout> | undefined, running = false, dirty = false, closed = false;
  const run = async () => {
    dirty = true; if (running || closed) return; running = true;
    try { while (dirty && !closed) { dirty = false; await buildWithStatus(compiler); } } finally { running = false; }
  };
  const watcher = chokidar.watch([compiler.definitions, path.join(PROJECT_ROOT, 'rules'), path.join(PROJECT_ROOT, 'schemas')], { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 } });
  watcher.on('all', () => { clearTimeout(timer); timer = setTimeout(() => void run().catch(console.error), 120); });
  watcher.on('error', console.error);
  await run();
  return async () => { closed = true; clearTimeout(timer); await watcher.close(); };
}
