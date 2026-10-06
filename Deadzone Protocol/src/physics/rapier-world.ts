import RAPIER from '@dimforge/rapier3d-compat';
import type { RangeConfig } from '../config/range-config.js';
import type { EntityId } from '../core/entity.js';
import type { Vec3 } from '../core/vector.js';
import type { RangeLevel } from '../range/level.js';
import type { MoveResult, RangePhysics, RayHit } from './contracts.js';

let initialization: Promise<void> | undefined;
export function initializePhysics(): Promise<void> { return initialization ??= RAPIER.init(); }

/** Rapier stays behind this adapter. The compat package embeds WASM; no fetch is required. */
export class RapierRangeWorld implements RangePhysics {
  private world = new RAPIER.World({ x: 0, y: 0, z: 0 });
  private controller: RAPIER.KinematicCharacterController;
  private body: RAPIER.RigidBody;
  private player: RAPIER.Collider;
  private handles = new Map<number, EntityId>();
  private targets = new Map<EntityId, RAPIER.Collider>();
  private disposed = false;
  constructor(level: RangeLevel, private readonly config: RangeConfig) {
    this.world.timestep = 1 / config.fixedHz;
    for (const box of level.boxes) {
      const collider = this.world.createCollider(RAPIER.ColliderDesc.cuboid(box.halfSize.x, box.halfSize.y, box.halfSize.z)
        .setTranslation(box.position.x, box.position.y, box.position.z));
      this.handles.set(collider.handle, box.id);
      if (box.kind === 'target') this.targets.set(box.id, collider);
    }
    this.body = this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, config.player.height / 2 + 0.02, 0));
    this.player = this.world.createCollider(RAPIER.ColliderDesc.capsule(config.player.height / 2 - config.player.radius, config.player.radius), this.body);
    this.controller = this.world.createCharacterController(0.01);
    this.controller.setSlideEnabled(true);
    this.controller.setMaxSlopeClimbAngle(Math.PI / 4);
    this.controller.enableSnapToGround(0.15);
    this.world.step();
  }
  move(displacement: Vec3, dt: number): MoveResult {
    this.world.timestep = dt;
    this.controller.computeColliderMovement(this.player, displacement);
    const movement = this.controller.computedMovement();
    const start = this.body.translation();
    this.body.setNextKinematicTranslation({ x: start.x + movement.x, y: start.y + movement.y, z: start.z + movement.z });
    const grounded = this.controller.computedGrounded();
    const ceiling = displacement.y > 0 && movement.y < displacement.y - 0.0001;
    this.world.step();
    const p = this.body.translation();
    return { feet: { x: p.x, y: p.y - this.config.player.height / 2, z: p.z }, grounded, ceiling };
  }
  raycast(origin: Vec3, direction: Vec3, maxDistance: number): RayHit | null {
    const ray = new RAPIER.Ray(origin, direction);
    const hit = this.world.castRay(ray, maxDistance, true, undefined, undefined, this.player);
    if (!hit) return null;
    const id = this.handles.get(hit.collider.handle);
    if (id === undefined) return null;
    return { id, distance: hit.timeOfImpact, point: ray.pointAt(hit.timeOfImpact) };
  }
  removeTarget(id: EntityId): void {
    const collider = this.targets.get(id);
    if (!collider) return;
    this.handles.delete(collider.handle); this.targets.delete(id);
    this.world.removeCollider(collider, true);
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.targets.clear(); this.handles.clear(); this.world.free();
  }
}
