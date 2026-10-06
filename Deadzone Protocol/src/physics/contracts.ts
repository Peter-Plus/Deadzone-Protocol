import type { Vec3 } from '../core/vector.js';
import type { EntityId } from '../core/entity.js';
export interface MoveResult { readonly feet: Vec3; readonly grounded: boolean; readonly ceiling: boolean }
export interface RayHit { readonly id: EntityId; readonly point: Vec3; readonly distance: number }
export interface RangePhysics {
  move(displacement: Vec3, dt: number): MoveResult;
  raycast(origin: Vec3, direction: Vec3, maxDistance: number): RayHit | null;
  removeTarget(id: EntityId): void;
  dispose(): void;
}
