export function requireDelta(dt: number): void {
  if (!Number.isFinite(dt) || dt < 0) throw new Error('DeltaTime 必须为有限非负秒数');
}

/** Pure fixed-step clock; the host decides when to call advance. */
export class FixedClock {
  private accumulator = 0;
  private tickCount = 0;
  droppedSeconds = 0;

  constructor(readonly stepSeconds: number, readonly maxSteps: number) {
    if (!Number.isFinite(stepSeconds) || stepSeconds <= 0) throw new Error('stepSeconds 必须大于 0');
    if (!Number.isSafeInteger(maxSteps) || maxSteps < 1) throw new Error('maxSteps 必须为正整数');
  }

  get ticks(): number { return this.tickCount; }
  get elapsedSeconds(): number { return this.tickCount * this.stepSeconds; }

  advance(dt: number, update: (dt: number) => void): number {
    requireDelta(dt);
    const accepted = Math.min(dt, this.stepSeconds * this.maxSteps);
    this.droppedSeconds += dt - accepted;
    this.accumulator += accepted;
    let steps = 0;
    while (this.accumulator + this.stepSeconds * 1e-9 >= this.stepSeconds && steps < this.maxSteps) {
      this.accumulator = Math.max(0, this.accumulator - this.stepSeconds);
      this.tickCount++;
      update(this.stepSeconds);
      steps++;
    }
    return this.accumulator / this.stepSeconds;
  }

  reset(): void { this.accumulator = 0; this.tickCount = 0; this.droppedSeconds = 0; }
}

type Tick = { period: number; pending: number; update: (dt: number) => void };
export class TickScheduler {
  private entries = new Set<Tick>();

  register(hz: number, update: (dt: number) => void): () => void {
    if (!Number.isFinite(hz) || hz <= 0) throw new Error('Tick Hz 必须大于 0');
    const entry = { period: 1 / hz, pending: 0, update };
    this.entries.add(entry);
    return () => { this.entries.delete(entry); };
  }

  /** At most once per host tick; delivers accumulated simulation time, never wall time. */
  update(dt: number): void {
    requireDelta(dt);
    for (const entry of [...this.entries]) {
      if (!this.entries.has(entry)) continue;
      entry.pending += dt;
      if (entry.pending + entry.period * 1e-9 >= entry.period) {
        const elapsed = entry.pending;
        entry.pending = 0;
        entry.update(elapsed);
      }
    }
  }

  clear(): void { this.entries.clear(); }
}
