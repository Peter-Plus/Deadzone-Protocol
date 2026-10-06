import { EntityIds } from '../core/entity.js';
import type { EntityId } from '../core/entity.js';
import type { Vec3 } from '../core/vector.js';
import type { RangeConfig } from '../config/range-config.js';

export interface BoxDefinition {
  readonly id: EntityId; readonly position: Vec3; readonly halfSize: Vec3;
  readonly kind: 'floor' | 'wall' | 'cover' | 'target';
}
export interface TargetDefinition { readonly id: EntityId; readonly health: number; readonly position: Vec3 }
export interface RangeLevel { readonly boxes: readonly BoxDefinition[]; readonly targets: readonly TargetDefinition[] }
export function createRangeLevel(config: RangeConfig): RangeLevel {
  const ids = new EntityIds(); const boxes: BoxDefinition[] = [];
  const add = (kind: BoxDefinition['kind'], position: Vec3, halfSize: Vec3): EntityId => {
    const id = ids.create(); boxes.push(Object.freeze({ id, kind, position: Object.freeze(position), halfSize: Object.freeze(halfSize) })); return id;
  };
  add('floor', { x: 0, y: -0.3, z: 14 }, { x: 14, y: 0.3, z: 22 });
  for (const x of [-14, 14]) add('wall', { x, y: 2, z: 14 }, { x: 0.3, y: 2, z: 22 });
  for (const z of [-8, 36]) add('wall', { x: 0, y: 2, z }, { x: 14, y: 2, z: 0.3 });
  add('cover', { x: -5, y: 0.65, z: 7 }, { x: 1.6, y: 0.65, z: 0.5 });
  add('cover', { x: 5, y: 1.2, z: 11 }, { x: 1.8, y: 1.2, z: 0.5 });
  const targets = config.targets.map(t => {
    const position = Object.freeze({ x: t.x, y: 1.65, z: t.z });
    return Object.freeze({ id: add('target', position, { x: 0.65, y: 0.85, z: 0.15 }), health: t.health, position });
  });
  return Object.freeze({ boxes: Object.freeze(boxes), targets: Object.freeze(targets) });
}
