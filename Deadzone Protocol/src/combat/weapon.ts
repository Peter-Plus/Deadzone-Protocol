import type { WeaponConfig } from '../config/range-config.js';
import { requireDelta } from '../core/time.js';

export interface WeaponSnapshot {
  readonly magazine: number; readonly reserve: number; readonly shots: number;
  readonly state: 'ready' | 'firing' | 'reloading'; readonly actionTime: number; readonly actionId: number;
}
/** One authoritative weapon instance. The range owns it until Item integration. */
export class Weapon {
  private magazine: number;
  private reserve: number;
  private shots = 0;
  private cooldown = 0;
  private actionTime = 0;
  private actionId = 0;
  private state: WeaponSnapshot['state'] = 'ready';
  private committed = false;
  constructor(readonly config: WeaponConfig) {
    this.magazine = config.magazineSize; this.reserve = config.reserveAmmo;
  }
  requestReload(): boolean {
    if (this.state === 'reloading' || this.magazine >= this.config.magazineSize || this.reserve === 0) return false;
    this.state = 'reloading'; this.actionTime = 0; this.committed = false; this.actionId++;
    return true;
  }
  /** Cancellation retains any already committed ammunition; never refunds or duplicates it. */
  cancelAction(): void { this.state = 'ready'; this.actionTime = 0; }
  update(dt: number, trigger: boolean): boolean {
    requireDelta(dt);
    // Preserve only the overshoot of an active cooldown, never bank idle time.
    this.cooldown = this.cooldown > 0 ? this.cooldown - dt : 0;
    if (this.state === 'reloading') {
      this.actionTime += dt;
      if (!this.committed && this.actionTime + 1e-9 >= this.config.reloadCommit) {
        const transferred = Math.min(this.config.magazineSize - this.magazine, this.reserve);
        this.magazine += transferred; this.reserve -= transferred; this.committed = true;
      }
      if (this.actionTime + 1e-9 >= this.config.reloadDuration) { this.state = 'ready'; this.actionTime = 0; }
      return false;
    }
    this.actionTime += dt;
    if (this.state === 'firing' && this.actionTime >= this.config.fireDuration) this.state = 'ready';
    if (trigger && this.cooldown <= 1e-9 && this.magazine > 0) {
      this.magazine--; this.shots++; this.state = 'firing'; this.actionTime = 0; this.actionId++;
      this.cooldown += 1 / this.config.shotsPerSecond;
      return true;
    }
    return false;
  }
  snapshot(): WeaponSnapshot {
    return Object.freeze({ magazine: this.magazine, reserve: this.reserve, shots: this.shots, state: this.state, actionTime: this.actionTime, actionId: this.actionId });
  }
}
