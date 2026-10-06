import type { RangeConfig } from '../config/range-config.js';
import type { Vec3 } from '../core/vector.js';
import type { RangePhysics } from '../physics/contracts.js';

export interface PlayerCommand { readonly forward: number; readonly right: number; readonly jump: boolean }
export interface PlayerSnapshot {
  readonly feet: Vec3; readonly eye: Vec3; readonly yaw: number; readonly pitch: number;
  readonly grounded: boolean; readonly moving: boolean;
}
/** Character motion owns gravity and facing; physics only resolves requested displacements. */
export class PlayerController {
  private feet: Vec3 = { x: 0, y: 0.02, z: 0 };
  private yaw = 0; private pitch = 0; private grounded = false; private verticalSpeed = 0; private moving = false;
  constructor(private readonly config: RangeConfig['player'], private readonly physics: RangePhysics) {}
  look(dx: number, dy: number): void {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
    this.yaw = (this.yaw - dx * this.config.sensitivity) % (Math.PI * 2);
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch + dy * this.config.sensitivity));
  }
  update(dt: number, input: PlayerCommand): void {
    const norm = Math.max(1, Math.hypot(input.forward, input.right));
    const forward = input.forward / norm, right = input.right / norm;
    if (input.jump && this.grounded) { this.verticalSpeed = this.config.jumpSpeed; this.grounded = false; }
    // A grounded controller already has support/snap detection. Constant downward
    // motion at the contact skin can cause repeated casts and intermittent stalls.
    if (!this.grounded) this.verticalSpeed -= this.config.gravity * dt;
    const movement = this.physics.move({
      x: (Math.sin(this.yaw) * forward - Math.cos(this.yaw) * right) * this.config.speed * dt,
      y: this.verticalSpeed * dt,
      z: (Math.cos(this.yaw) * forward + Math.sin(this.yaw) * right) * this.config.speed * dt,
    }, dt);
    this.moving = Math.hypot(movement.feet.x - this.feet.x, movement.feet.z - this.feet.z) > 0.0001;
    this.feet = movement.feet; this.grounded = movement.grounded;
    if (movement.grounded && this.verticalSpeed < 0 || movement.ceiling && this.verticalSpeed > 0) this.verticalSpeed = 0;
  }
  snapshot(): PlayerSnapshot {
    return Object.freeze({ feet: Object.freeze({ ...this.feet }),
      eye: Object.freeze({ x: this.feet.x, y: this.feet.y + this.config.eyeHeight, z: this.feet.z }),
      yaw: this.yaw, pitch: this.pitch, grounded: this.grounded, moving: this.moving });
  }
}
