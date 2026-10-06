import { MeshStandardMaterial } from 'three';
import type { Context } from '../shared/types/index.js';
export class MaterialCompiler {
  private cache = new Map<string, MeshStandardMaterial>();
  constructor(private ctx: Context) {}
  get(id?: string) {
    const key = id ?? '__default';
    if (!this.cache.has(key)) {
      const d = id ? this.ctx.materials.get(id) : undefined;
      if (id && !d) throw new Error(`Unknown material ${id}`);
      const m = new MeshStandardMaterial({ color: d?.color ?? '#7baabf', roughness: d?.roughness ?? .7, metalness: d?.metalness ?? 0, emissive: d?.emissive ?? '#000000', opacity: d?.opacity ?? 1, transparent: d?.transparent ?? false, flatShading: true });
      m.name = key; this.cache.set(key, m);
    }
    return this.cache.get(key)!;
  }
}
