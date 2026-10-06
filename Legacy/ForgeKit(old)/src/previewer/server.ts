import type { Plugin } from 'vite';
import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import chokidar from 'chokidar';
import { AssetCompiler, PROJECT_ROOT } from '../compiler/AssetCompiler.js';
import { safeFile, walk } from '../shared/utils/files.js';
import { watchAssets } from '../cli/watch.js';
export function assetPlugin(output: string): Plugin {
  return { name: 'forgekit-assets', configureServer(server) {
    const watcher = chokidar.watch(output, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 30 } });
    watcher.on('all', (event, file) => {
      if (file.endsWith('.glb') || file.endsWith('.forge-status.json')) server.ws.send({ type: 'custom', event: 'forge:changed', data: { path: path.relative(output, file).split(path.sep).join('/'), event } });
    });
    server.httpServer?.on('close', () => void watcher.close());
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (!url.pathname.startsWith('/api/') && !url.pathname.startsWith('/compiled/')) return next();
      if (req.method !== 'GET') { res.statusCode = 405; res.end('GET only'); return; }
      res.setHeader('Cache-Control', 'no-store');
      try {
        if (url.pathname === '/api/status') {
          res.setHeader('Content-Type', 'application/json'); res.end(await readFile(path.join(output, '.forge-status.json'), 'utf8').catch(() => JSON.stringify({ ok: true, message: 'Ready' }))); return;
        }
        const match = /^\/api\/assets\/(models|animations)$/.exec(url.pathname);
        if (match) {
          const files = (await walk(path.join(output, match[1]))).filter(f => f.endsWith('.glb'));
          const entries = files.map(file => { const relative = path.relative(output, file).split(path.sep).join('/'); return { name: path.basename(file), relative, path: '/compiled/' + relative.split('/').map(encodeURIComponent).join('/') }; });
          res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(entries)); return;
        }
        if (url.pathname.startsWith('/compiled/')) {
          const relative = decodeURIComponent(url.pathname.slice('/compiled/'.length));
          if (!/^(models|animations)\/.+\.glb$/.test(relative) || relative.includes('\\') || relative.split('/').includes('..')) throw new Error('Forbidden path');
          const file = await safeFile(output, relative); res.setHeader('Content-Type', 'model/gltf-binary'); res.end(await readFile(file)); return;
        }
        res.statusCode = 404; res.end('Unknown endpoint');
      } catch { res.statusCode = 404; res.end('Asset unavailable or outside allowed root'); }
    });
  } };
}
export async function startPreview(compiler: AssetCompiler, port: number, watch: boolean) {
  const closeWatch = watch ? await watchAssets(compiler) : undefined;
  const server = await createServer({ configFile: false, root: path.join(PROJECT_ROOT, 'src/previewer'), plugins: [assetPlugin(compiler.output)], server: { host: '127.0.0.1', port, strictPort: true, fs: { strict: true, allow: [PROJECT_ROOT] } } });
  server.httpServer?.on('close', () => void closeWatch?.());
  await server.listen(); server.printUrls();
  const close = async () => { await server.close(); process.exit(0); };
  process.once('SIGINT', close); process.once('SIGTERM', close);
  return server;
}
