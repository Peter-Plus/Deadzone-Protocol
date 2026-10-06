import type { RangeConfig } from '../config/range-config.js';
import { initializePhysics, RapierRangeWorld } from '../physics/rapier-world.js';
import { createRangeLevel } from '../range/level.js';
import type { RangeLevel } from '../range/level.js';
import { RangeSession } from '../range/session.js';
import { loadRangeAssets } from '../presentation/assets/range-assets.js';
import type { RangeAssets } from '../presentation/assets/range-assets.js';
import { RangeView } from '../presentation/range-view.js';
import { RangePanel } from '../ui/range-panel.js';
import { RangeInput } from '../input/range-input.js';

export class RangeApplication {
  private session: RangeSession;
  private level: RangeLevel;
  private panel: RangePanel;
  private view: RangeView;
  private input: RangeInput;
  private previous: number | undefined;
  private request = 0;
  private disposed = false;
  private failed = false;
  private abort = new AbortController();
  static async create(root: HTMLElement, config: RangeConfig): Promise<RangeApplication> {
    root.textContent = '正在准备训练场：读取内嵌模型与物理模块……';
    const [, assets] = await Promise.all([initializePhysics(), loadRangeAssets()]);
    return new RangeApplication(root, config, assets);
  }
  private constructor(root: HTMLElement, private readonly config: RangeConfig, assets: RangeAssets) {
    this.level = createRangeLevel(config);
    this.session = this.newSession();
    this.panel = new RangePanel(root, {
      start: mode => {
        if (this.failed) return;
        this.previous = undefined; this.session.setPaused(false); this.panel.update(this.session.snapshot());
        this.input.start(mode);
      }, pause: () => this.pause(), restart: () => this.restart(),
    });
    try { this.view = new RangeView(this.panel.viewport, this.level, assets); }
    catch (error) { this.session.dispose(); this.panel.dispose(); throw error; }
    this.input = new RangeInput(this.view.canvas, () => this.pause(), message => this.panel.showMessage(message));
    this.view.canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); this.fail('图形上下文已丢失');
    }, { signal: this.abort.signal });
    this.panel.setReady(true); this.panel.showMessage('已就绪。首次进入建议选择锁定鼠标模式。');
    this.panel.update(this.session.snapshot()); this.request = requestAnimationFrame(this.frame);
  }
  private newSession(): RangeSession { return new RangeSession(this.config, this.level, new RapierRangeWorld(this.level, this.config)); }
  private pause(): void {
    this.input.stop(); this.session.setPaused(true); this.previous = undefined;
    this.panel.update(this.session.snapshot());
  }
  private restart(): void {
    this.pause();
    try {
      const next = this.newSession(); this.session.dispose(); this.session = next;
      this.panel.update(next.snapshot()); this.panel.showMessage('靶子和弹药已重置。请选择进入方式。');
    } catch (error) { this.fail(error instanceof Error ? error.message : String(error)); }
  }
  private fail(message: string): void {
    this.failed = true; this.pause(); cancelAnimationFrame(this.request); this.panel.fail(message);
  }
  private frame = (now: number): void => {
    if (this.disposed || this.failed) return;
    try {
      const dt = this.previous === undefined ? 0 : Math.max(0, (now - this.previous) / 1000); this.previous = now;
      const look = this.input.takeLook(Math.min(dt, 0.05)); this.session.look(look.dx, look.dy);
      this.session.advance(dt, () => this.input.sample());
      const snapshot = this.session.snapshot(); this.view.render(snapshot); this.panel.update(snapshot);
      this.request = requestAnimationFrame(this.frame);
    } catch (error) { this.fail(error instanceof Error ? error.message : String(error)); console.error(error); }
  };
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; cancelAnimationFrame(this.request); this.abort.abort();
    this.input.dispose(); this.session.dispose(); this.view.dispose(); this.panel.dispose();
  }
}
