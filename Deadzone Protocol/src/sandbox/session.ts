import type { FoundationConfig } from '../config/config.js';
import { EntityIds } from '../core/entity.js';
import type { EntityId } from '../core/entity.js';
import { EventBus } from '../core/events.js';
import { SeededRandom } from '../core/random.js';
import { FixedClock, TickScheduler, requireDelta } from '../core/time.js';

export interface Marker { readonly id: EntityId; readonly x: number; readonly z: number; readonly height: number }
export interface SceneDefinition { readonly size: number; readonly markers: readonly Marker[] }
export interface SessionSnapshot {
  readonly seed: string; readonly state: 'running' | 'paused' | 'disposed';
  readonly ticks: number; readonly elapsedSeconds: number; readonly droppedSeconds: number;
  readonly telemetryTicks: number;
  readonly probe: Readonly<{ x: number; y: number; z: number }>;
}
type SessionEvents = { stateChanged: SessionSnapshot['state'] };

/** Foundation diagnostics only. Replace with real gameplay composition later. */
export class SandboxSession {
  readonly events = new EventBus<SessionEvents>();
  readonly scene: SceneDefinition;
  private clock: FixedClock;
  private scheduler = new TickScheduler();
  private state: SessionSnapshot['state'] = 'running';
  private telemetryTicks = 0;

  constructor(private readonly config: FoundationConfig) {
    this.clock = new FixedClock(1 / config.simulation.fixedHz, config.simulation.maxCatchUpSteps);
    const random = new SeededRandom(config.worldSeed).fork('sandbox-markers');
    const ids = new EntityIds();
    this.scene = Object.freeze({ size: config.scene.size, markers: Object.freeze(
      Array.from({ length: config.scene.markerCount }, () => Object.freeze({
        id: ids.create(), x: (random.next() - 0.5) * config.scene.size * 0.85,
        z: (random.next() - 0.5) * config.scene.size * 0.85, height: 1 + random.next() * 3,
      })),
    ) });
    this.scheduler.register(config.simulation.telemetryHz, () => { this.telemetryTicks++; });
  }

  advance(dt: number): void {
    requireDelta(dt);
    if (this.state === 'running') this.clock.advance(dt, (step) => this.scheduler.update(step));
  }
  setPaused(paused: boolean): void {
    if (this.state === 'disposed') return;
    const next = paused ? 'paused' : 'running';
    if (next !== this.state) { this.state = next; this.events.emit('stateChanged', next); }
  }
  snapshot(): SessionSnapshot {
    const angle = this.clock.elapsedSeconds * this.config.scene.probeSpeed;
    const radius = this.scene.size * 0.3;
    return Object.freeze({ seed: this.config.worldSeed, state: this.state,
      ticks: this.clock.ticks, elapsedSeconds: this.clock.elapsedSeconds,
      droppedSeconds: this.clock.droppedSeconds, telemetryTicks: this.telemetryTicks,
      probe: Object.freeze({ x: Math.cos(angle) * radius, y: 1, z: Math.sin(angle) * radius }),
    });
  }
  dispose(): void {
    if (this.state === 'disposed') return;
    this.state = 'disposed'; this.scheduler.clear();
    try { this.events.emit('stateChanged', 'disposed'); } finally { this.events.clear(); }
  }
}
