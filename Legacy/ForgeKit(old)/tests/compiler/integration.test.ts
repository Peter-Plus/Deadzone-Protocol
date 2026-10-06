import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, unlink, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { AssetCompiler } from '../../src/compiler/AssetCompiler.js';
import { assetPlugin } from '../../src/previewer/server.js';
import { watchAssets } from '../../src/cli/watch.js';
import { safeFile } from '../../src/shared/utils/files.js';
import { box } from '../fixtures/helpers.js';
import { atomicWrite } from '../../src/shared/utils/atomicWrite.js';
async function eventually(predicate: () => Promise<boolean> | boolean, timeout = 8000) {
  const start = Date.now(); while (Date.now() - start < timeout) { if (await predicate()) return; await new Promise(r => setTimeout(r, 50)); } throw new Error('Timed out waiting for watch event');
}
test('concurrent atomic writers never mix contents or leave staging files', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'forgekit-atomic-')), file = path.join(root, 'asset.glb');
  const first = Buffer.alloc(128 * 1024, 1), second = Buffer.alloc(128 * 1024, 2);
  await Promise.all([atomicWrite(file, first), atomicWrite(file, second)]);
  const bytes = await readFile(file); assert.ok(bytes.equals(first) || bytes.equals(second));
  assert.deepEqual(await readdir(root), ['asset.glb']);
});
test('local API restricts reads and watch publishes only changed assets; invalid edits retain GLB', { timeout: 20000 }, async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'forgekit-integration-')), definitions = path.join(root, 'definitions'), output = path.join(root, 'generated'); await mkdir(definitions);
  const source = path.join(definitions, 'simple_box.model.json'); await writeFile(source, JSON.stringify(box()));
  const compiler = new AssetCompiler({ definitions, output });
  await compiler.build();
  const server = await createServer({ configFile: false, root, cacheDir: path.join(root, '.vite-cache'), optimizeDeps: { noDiscovery: true, include: [] }, logLevel: 'silent', plugins: [assetPlugin(output)], server: { host: '127.0.0.1', port: 0, fs: { strict: true, allow: [output] } } });
  const closeWatch = await watchAssets(compiler);
  let socket: WebSocket | undefined;
  try {
    await server.listen(); const address = server.httpServer!.address() as { port: number }; const base = `http://127.0.0.1:${address.port}`;
    const models = await (await fetch(base + '/api/assets/models')).json() as { path: string; name: string }[]; assert.equal(models.length, 1); assert.equal(models[0].name, 'simple_box.glb');
    const original = Buffer.from(await (await fetch(base + models[0].path)).arrayBuffer()); assert.equal(original.readUInt32LE(0), 0x46546c67);
    await writeFile(path.join(root, 'secret.glb'), 'private');
    assert.equal((await fetch(base + '/compiled/models/%2e%2e%2f%2e%2e%2fsecret.glb')).status, 404);
    assert.equal((await fetch(base + '/compiled/manifest.json')).status, 404);
    assert.equal((await fetch(base + '/api/assets/models', { method: 'POST' })).status, 405);
    await assert.rejects(safeFile(output, '../secret.glb'), /outside/);
    const changes: string[] = []; socket = new WebSocket(base.replace('http:', 'ws:'), 'vite-hmr');
    socket.addEventListener('message', event => { const message = JSON.parse(String(event.data)); if (message.type === 'custom' && message.event === 'forge:changed') changes.push(message.data.path); });
    await new Promise<void>((resolve, reject) => { socket!.addEventListener('open', () => resolve()); socket!.addEventListener('error', () => reject(new Error('WebSocket connection failed'))); });
    const edited = box(); edited.parts![0].size![0] = 2; await writeFile(source, JSON.stringify(edited));
    await eventually(async () => changes.filter(p => p === 'models/simple_box.glb').length > 0 && !(await readFile(path.join(output, 'models/simple_box.glb'))).equals(original));
    const updated = await readFile(path.join(output, 'models/simple_box.glb')); assert.equal(updated.equals(original), false);
    const assetEventCount = changes.filter(p => p.endsWith('.glb')).length;
    const invalid = box(); invalid.parts![0].size = [-1, 1, 1]; await writeFile(source, JSON.stringify(invalid));
    await eventually(async () => JSON.parse(await readFile(path.join(output, '.forge-status.json'), 'utf8')).ok === false);
    assert.deepEqual(await readFile(path.join(output, 'models/simple_box.glb')), updated); assert.equal(changes.filter(p => p.endsWith('.glb')).length, assetEventCount);
    await writeFile(source, JSON.stringify(box())); await eventually(async () => (await readFile(path.join(output, 'models/simple_box.glb'))).equals(original));
  } finally { socket?.close(); await server.close(); await closeWatch(); }
});
test('successful full build removes stale manifest-owned files but preserves external files', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'forgekit-manifest-')), definitions = path.join(root, 'definitions'), output = path.join(root, 'generated'); await mkdir(definitions);
  const one = path.join(definitions, 'one.model.json'), two = path.join(definitions, 'two.model.json');
  await writeFile(one, JSON.stringify(box())); await writeFile(two, JSON.stringify({ ...box(), id: 'example.two' }));
  const compiler = new AssetCompiler({ definitions, output }); assert.equal((await compiler.build()).ok, true);
  const external = path.join(output, 'models/external.glb'); await writeFile(external, 'external'); await unlink(two);
  const result = await compiler.build(); assert.ok(result.changed.includes('models/two.glb')); await assert.rejects(readFile(path.join(output, 'models/two.glb'))); assert.equal(await readFile(external, 'utf8'), 'external');
});
