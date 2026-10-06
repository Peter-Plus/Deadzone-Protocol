import { parseConfig } from '../config/config.js';
import type { FoundationConfig } from '../config/config.js';
import { SandboxSession } from '../sandbox/session.js';
import { SceneView } from '../presentation/scene-view.js';
import { FoundationPanel } from '../ui/foundation-panel.js';

/** Only this composition root knows both the simulation and browser adapters. */
export class Application {
  private session: SandboxSession;
  private panel: FoundationPanel;
  private view: SceneView;
  private request = 0;
  private previous: number | undefined;
  private lastPanelTime = -Infinity;
  private abort = new AbortController();
  private disposed = false;

  constructor(root: HTMLElement, private readonly config: FoundationConfig) {
    this.session = new SandboxSession(config);
    this.panel = new FoundationPanel(root, {
      togglePause: () => {
        this.session.setPaused(this.session.snapshot().state === 'running');
        this.previous = undefined; this.refreshPanel();
      },
      restart: (seed) => this.restart(seed),
    });
    try { this.view = new SceneView(this.panel.viewport); }
    catch (error) { this.session.dispose(); this.panel.dispose(); throw error; }
    this.view.setScene(this.session.scene); this.panel.setSeed(config.worldSeed);
    document.addEventListener('visibilitychange', () => {
      this.previous = undefined;
      if (document.hidden) {
        this.session.setPaused(true);
        this.panel.showMessage('页面进入后台，模拟已暂停；返回后请手动继续。');
        this.refreshPanel();
      }
    }, { signal: this.abort.signal });
    this.viewHostContextEvents();
    if (document.hidden) this.session.setPaused(true);
    this.refreshPanel(); this.request = requestAnimationFrame(this.frame);
  }

  private viewHostContextEvents(): void {
    this.panel.viewport.addEventListener('webglcontextlost', (event) => {
      event.preventDefault(); this.session.setPaused(true);
      this.previous = undefined; this.refreshPanel();
      this.panel.showMessage('图形上下文已丢失，请刷新页面重新初始化。');
      cancelAnimationFrame(this.request);
    }, { signal: this.abort.signal, capture: true });
  }
  private restart(seed: string): void {
    try {
      const config = parseConfig({ ...this.config, worldSeed: seed });
      const next = new SandboxSession(config);
      if (document.hidden) next.setPaused(true);
      this.session.dispose(); this.session = next;
      this.view.setScene(next.scene); this.panel.setSeed(config.worldSeed);
      this.previous = undefined; this.refreshPanel();
      this.panel.showMessage('已创建新会话，模拟时间与随机布局已重置。');
    } catch (error) { this.panel.showMessage(error instanceof Error ? error.message : String(error)); }
  }
  private refreshPanel(): void { this.panel.update(this.session.snapshot()); }
  private frame = (now: number): void => {
    if (this.disposed) return;
    try {
      const dt = this.previous === undefined ? 0 : Math.max(0, (now - this.previous) / 1000);
      this.previous = now;
      this.session.advance(dt); this.view.render(this.session.snapshot());
      if (now - this.lastPanelTime >= 100) { this.refreshPanel(); this.lastPanelTime = now; }
      this.request = requestAnimationFrame(this.frame);
    } catch (error) {
      this.session.setPaused(true); this.refreshPanel();
      this.panel.showMessage(`运行已停止：${error instanceof Error ? error.message : String(error)}。请刷新页面。`);
      console.error(error);
    }
  };
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; cancelAnimationFrame(this.request); this.abort.abort();
    this.session.dispose(); this.view.dispose(); this.panel.dispose();
  }
}
