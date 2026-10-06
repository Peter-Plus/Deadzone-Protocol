import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, rm } from 'node:fs/promises';
import type { Context, Definition, Source } from '../shared/types/index.js';
import { readJson, walk, inside } from '../shared/utils/files.js';
import { schemaValidator } from '../shared/schema/SchemaValidator.js';
import { validateModel } from '../validator/ModelValidator.js';
import { validateAnimation, validatePose } from '../validator/AnimationValidator.js';
import { ValidationReporter } from '../validator/ValidationReporter.js';
import { compileModel } from './ModelCompiler.js';
import { compileAnimation } from './AnimationCompiler.js';
import { writeGlb } from './GltfWriter.js';
import { DEFAULT_MAX_SIZE_METERS } from '../shared/constants/limits.js';
import { atomicWrite } from '../shared/utils/atomicWrite.js';
export const PROJECT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export interface CompilerOptions { definitions?: string; output?: string; maxSize?: number }
export class AssetCompiler {
  definitions: string; output: string; maxSize: number;
  constructor(options: CompilerOptions = {}) {
    this.definitions = path.resolve(options.definitions ?? path.join(PROJECT_ROOT, 'assets/definitions'));
    this.output = path.resolve(options.output ?? path.join(PROJECT_ROOT, 'assets/generated'));
    this.maxSize = options.maxSize ?? DEFAULT_MAX_SIZE_METERS;
    if (inside(this.definitions, this.output) || inside(this.output, this.definitions)) throw new Error('Definitions and output must be separate directories.');
  }
  async validate(target?: string) {
    const files = (await walk(this.definitions)).filter(f => f.endsWith('.json'));
    if (target && !inside(this.definitions, path.resolve(target))) {
      const extra = (await walk(path.resolve(target)).catch(() => [path.resolve(target)])); files.push(...extra.filter(f => f.endsWith('.json') && !files.includes(f)));
    }
    const sources: Source[] = [], reporters: ValidationReporter[] = [], ctx: Context = { materials: new Map(), poses: new Map() };
    const check = schemaValidator(), ids = new Map<string, string>();
    for (const file of files) {
      const r = new ValidationReporter(file); reporters.push(r);
      let data: unknown;
      try { data = await readJson(file); } catch (e) { r.error('JSON_PARSE', '$', String(e), 'Use valid JSON with unique object keys.'); continue; }
      if (!check(data, r)) continue;
      const d = data as Definition, suffix = d.schema === 'animation.v1' ? 'anim' : d.schema.split('.')[0];
      if (!new RegExp(`^[a-z][a-z0-9_]*\\.${suffix}\\.json$`).test(path.basename(file))) r.error('FILE_NAME', '$', `Expected snake_case.${suffix}.json filename.`);
      if (ids.has(d.id)) r.error('ASSET_DUPLICATE_ID', 'id', `Duplicate id "${d.id}" also in ${ids.get(d.id)}.`);
      ids.set(d.id, file); sources.push({ file, data: d });
      if (d.schema === 'material.v1') ctx.materials.set(d.id, d);
      if (d.schema === 'pose.v1') ctx.poses.set(d.id, d);
    }
    for (const { file, data } of sources) {
      const r = reporters.find(r => r.file === file)!;
      if (data.schema === 'model.v1') validateModel(data, ctx, r, this.maxSize);
      if (data.schema === 'animation.v1') validateAnimation(data, ctx, r);
      if (data.schema === 'pose.v1') validatePose(data, r);
    }
    if (!files.length || target && !sources.some(s => inside(path.resolve(target), s.file))) {
      const r = new ValidationReporter(target ?? this.definitions); r.error('INPUT_NOT_FOUND', '$', 'No matching source definitions found.'); reporters.push(r);
    }
    const outputs = new Set<string>();
    for (const s of sources.filter(s => ['model.v1', 'animation.v1'].includes(s.data.schema))) {
      const name = this.outputName(s);
      if (outputs.has(name.toLowerCase())) reporters.find(r => r.file === s.file)!.error('OUTPUT_COLLISION', '$', `Duplicate output filename ${name}.`, 'Use unique source filenames across subdirectories.');
      outputs.add(name.toLowerCase());
    }
    return { sources, reporters, ctx, ok: reporters.every(r => r.ok) };
  }
  outputName(s: Source) { return s.data.schema === 'model.v1' ? `models/${path.basename(s.file).replace(/\.model\.json$/, '.glb')}` : `animations/${path.basename(s.file).replace(/\.anim\.json$/, '.anim.glb')}`; }
  async build(target?: string) {
    const validation = await this.validate(target);
    if (!validation.ok) return { ...validation, changed: [] as string[] };
    const selected = validation.sources.filter(s => !target || inside(path.resolve(target), s.file));
    // Material/pose changes require dependent assets to be rebuilt.
    const sources = selected.some(s => ['material.v1', 'pose.v1'].includes(s.data.schema)) ? validation.sources : selected;
    const outputs: { relative: string; bytes: Buffer }[] = [];
    for (const s of sources) {
      if (s.data.schema === 'model.v1') outputs.push({ relative: this.outputName(s), bytes: await writeGlb(compileModel(s.data, validation.ctx)) });
      if (s.data.schema === 'animation.v1') { const a = compileAnimation(s.data, validation.ctx); outputs.push({ relative: this.outputName(s), bytes: await writeGlb(a.root, [a.clip]) }); }
    }
    const changed: string[] = [];
    for (const { relative, bytes } of outputs) {
      const file = path.join(this.output, relative); const old = await readFile(file).catch(() => undefined);
      if (old?.equals(bytes)) continue;
      await atomicWrite(file, bytes); changed.push(relative);
    }
    if (!target) {
      const manifestFile = path.join(this.output, 'manifest.json');
      const previous = await readJson(manifestFile).catch(() => []) as unknown;
      const current = outputs.map(o => o.relative).sort();
      if (Array.isArray(previous)) for (const relative of previous) {
        if (typeof relative === 'string' && /^(models|animations)\/[a-z][a-z0-9_]*(\.anim)?\.glb$/.test(relative) && !current.includes(relative)) { await rm(path.join(this.output, relative), { force: true }); changed.push(relative); }
      }
      await atomicWrite(manifestFile, JSON.stringify(current, null, 2) + '\n');
    }
    return { ...validation, changed };
  }
}
