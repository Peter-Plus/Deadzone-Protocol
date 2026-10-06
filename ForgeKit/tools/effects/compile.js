import fs from 'node:fs';
import path from 'node:path';
import { validateEffect } from './validate.js';
export function compileEffect(data, library, file) {
  const errors = validateEffect(data, file, library);
  if (errors.length) throw Error(errors.map(e => `${e.code} ${e.file} ${e.path}: ${e.description}`).join('\n'));
  const effect = structuredClone(data);
  for (const [id, texture] of Object.entries(effect.textures)) {
    if (!texture.source) throw Error(`Source texture ${id} must reference an authoring PNG`);
    const base = fs.realpathSync(path.dirname(file));
    const candidate = path.resolve(base, texture.source);
    if (!candidate.startsWith(base + path.sep)) throw Error('Texture must stay inside effect source directory');
    const resolved = fs.realpathSync(candidate);
    if (!resolved.startsWith(base + path.sep)) throw Error('Texture symlink escapes effect source directory');
    const bytes = fs.readFileSync(resolved);
    if (bytes.length > 8 * 1024 * 1024 || bytes.length < 33 || !bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || bytes.toString('ascii',12,16) !== 'IHDR') throw Error('Expected PNG, maximum 8 MiB');
    if (bytes.readUInt32BE(16) > 4096 || bytes.readUInt32BE(20) > 4096 || bytes.readUInt32BE(16) === 0 || bytes.readUInt32BE(20) === 0) throw Error('PNG dimensions must be 1..4096');
    effect.textures[id] = { data: 'data:image/png;base64,' + bytes.toString('base64') };
  }
  return Buffer.from(JSON.stringify({ schema: 'forge-vfx.v1', effect }, null, 2) + '\n');
}
