import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
const root = new URL('./', import.meta.url);
const result = await build({ entryPoints: [fileURLToPath(new URL('./preview.mjs', root))],
  bundle: true, format: 'iife', target: 'chrome110', write: false, minify: true,
  loader: { '.vfx': 'text', '.glb': 'binary' } });
const html = fs.readFileSync(new URL('./page.html', root), 'utf8').replace('/*APP*/', () => result.outputFiles[0].text.replaceAll('</script', '<\\/script'));
fs.writeFileSync(new URL('./Preview.html', root), html);
console.log(`Built self-contained Preview.html (${html.length} chars)`);
