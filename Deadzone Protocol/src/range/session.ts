import { FixedClock, requireDelta } from '../core/time.js';
import type { EntityId } from '../core/entity.js';
import { lookDirection } from '../core/vector.js';
import type { Vec3 } from '../core/vector.js';
import type { RangeConfig } from '../config/range-config.js';
import { Weapon } from '../combat/weapon.js';
import type { WeaponSnapshot } from '../combat/weapon.js';
import type { RangePhysics } from '../physics/contracts.js';
import type { RangeLevel } from './level.js';
import { PlayerController } from '../character/player.js';
import type { PlayerCommand, PlayerSnapshot } from '../character/player.js';

export interface RangeInputFrame extends PlayerCommand { readonly reload: boolean; readonly fire: boolean }
export const NO_INPUT: RangeInputFrame = Object.freeze({ forward: 0, right: 0, jump: false, reload: false, fire: false });
export interface RangeSnapshot extends PlayerSnapshot {
  readonly state: 'running' | 'paused' | 'disposed'; readonly elapsed: number; readonly droppedSeconds: number;
  readonly weapon: WeaponSnapshot; readonly targets: readonly Readonly<{ id: EntityId; health: number; maxHealth: number }>[];
  readonly hits: number; readonly destroyed: number; readonly hitAge: number; readonly shotAge: number; readonly impact: Vec3 | null;
}
export class RangeSession {
  private clock: FixedClock;
  private weapon: Weapon;
  private state: RangeSnapshot['state'] = 'paused';
  private player: PlayerController;
  private health = new Map<EntityId, number>();
  private hits = 0; private destroyed = 0; private lastHit = -Infinity; private lastShot = -Infinity; private impact: Vec3 | null = null;
  constructor(readonly config: RangeConfig, readonly level: RangeLevel, private readonly physics: RangePhysics) {
    this.clock = new FixedClock(1 / config.fixedHz, config.maxCatchUpSteps); this.weapon = new Weapon(config.weapon);
    this.player = new PlayerController(config.player, physics);
    for (const target of level.targets) this.health.set(target.id, target.health);
  }
  setPaused(paused: boolean): void { if (this.state !== 'disposed') this.state = paused ? 'paused' : 'running'; }
  look(dx: number, dy: number): void {
    if (this.state === 'running') this.player.look(dx, dy);
  }
  advance(dt: number, input: () => RangeInputFrame): void {
    requireDelta(dt);
    if (this.state === 'running') this.clock.advance(dt, step => this.update(step, input()));
  }
  private update(dt: number, input: RangeInputFrame): void {
    this.player.update(dt, input);
    if (input.reload) this.weapon.requestReload();
    if (this.weapon.update(dt, input.fire)) {
      this.lastShot = this.clock.elapsedSeconds;
      const player = this.player.snapshot();
      const hit = this.physics.raycast(player.eye, lookDirection(player.yaw, player.pitch), this.config.weapon.range);
      this.impact = hit ? Object.freeze({ ...hit.point }) : null;
      if (hit && (this.health.get(hit.id) ?? 0) > 0) {
        const next = Math.max(0, this.health.get(hit.id)! - this.config.weapon.damage);
        this.health.set(hit.id, next); this.hits++; this.lastHit = this.clock.elapsedSeconds;
        if (next === 0) { this.destroyed++; this.physics.removeTarget(hit.id); }
      }
    }
  }
  snapshot(): RangeSnapshot {
    return Object.freeze({ state: this.state, elapsed: this.clock.elapsedSeconds, droppedSeconds: this.clock.droppedSeconds,
      ...this.player.snapshot(), weapon: this.weapon.snapshot(),
      targets: Object.freeze(this.level.targets.map(t => Object.freeze({ id: t.id, health: this.health.get(t.id)!, maxHealth: t.health }))),
      hits: this.hits, destroyed: this.destroyed, hitAge: this.clock.elapsedSeconds - this.lastHit,
      shotAge: this.clock.elapsedSeconds - this.lastShot, impact: this.impact,
    });
  }
  dispose(): void { if (this.state !== 'disposed') { this.state = 'disposed'; this.physics.dispose(); } }
}
