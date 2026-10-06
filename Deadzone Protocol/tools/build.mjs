import { build, context } from 'esbuild';
import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
await mkdir('dist', { recursive: true });
await copyFile('index.html', 'dist/index.html');
const options = {
  entryPoints: ['src/main.ts'], bundle: true, outfile: 'dist/app.js',
  format: 'esm', target: 'es2022', sourcemap: true, logLevel: 'info', loader: { '.glb': 'base64' },
};
if (process.argv.includes('--serve')) {
  const ctx = await context(options);
  await ctx.watch();
  const server = await ctx.serve({ servedir: path.join(root, 'dist'), host: '127.0.0.1', port: 5173 });
  console.log(`Deadzone Protocol: http://127.0.0.1:${server.port} (修改源码后手动刷新；修改 index.html 后重启服务)`);
  const shutdown = async () => { await ctx.dispose(); process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} else {
  await build({ ...options, minify: true });
  // A separate IIFE bundle has no module imports or runtime file requests.
  const standalone = await build({ ...options, format: 'iife', minify: true, sourcemap: false, write: false });
  const script = standalone.outputFiles.find(file => file.path.endsWith('.js'))?.text;
  const style = standalone.outputFiles.find(file => file.path.endsWith('.css'))?.text;
  if (!script || !style) throw new Error('Standalone bundle 缺少 JS 或 CSS');
  const html = (await readFile('index.html', 'utf8'))
    .replace('<link rel="stylesheet" href="./app.css" />', () => `<style>${style}</style>`)
    .replace('<script type="module" src="./app.js"></script>', () => `<script>${script.replace(/<\/script/gi, '<\\/script')}</script>`);
  await writeFile('Play.html', html, 'utf8');
  await writeFile('dist/Play.html', html, 'utf8');
  console.log('可直接双击打开: Play.html（无需 npm、服务器或联网）');
}
