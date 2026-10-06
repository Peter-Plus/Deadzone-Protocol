import type { RangeSnapshot } from '../range/session.js';
export interface RangeActions { start(mode: 'locked' | 'window'): void; pause(): void; restart(): void }
export class RangePanel {
  readonly viewport: HTMLElement;
  private overlay: HTMLElement;
  private ammo: HTMLElement;
  private progress: HTMLElement;
  private status: HTMLElement;
  private crosshair: HTMLElement;
  private message: HTMLElement;
  private summary: HTMLElement;
  private abort = new AbortController();
  private fatal = false;
  constructor(private readonly root: HTMLElement, actions: RangeActions) {
    root.className = 'range-app';
    root.innerHTML = `<div class="range-viewport"></div>
      <header class="range-brand"><span>DEADZONE PROTOCOL</span><h1>训练区 01</h1><p>基础射击与移动测试</p></header>
      <div class="range-top"><span data-progress></span><button data-pause aria-label="暂停训练">暂停 / ESC</button></div>
      <div class="crosshair" aria-hidden="true" data-crosshair><i></i><b>×</b></div>
      <div class="range-bottom"><div class="range-hints">W A S D 移动 · SPACE 跳跃<br>左键 / F 射击 · R 换弹 · ESC 暂停</div><div class="ammo"><small>VANGUARD / 5.56</small><strong data-ammo></strong><span data-status></span></div></div>
      <section class="range-overlay" aria-label="训练菜单"><div class="range-card">
        <span class="range-eyebrow">DEADZONE PROTOCOL / FIELD TEST</span><h2>进入第一人称训练场</h2>
        <p>用步枪击倒前方的 5 个橙色靶子。试着移动、跳跃，绕过掩体后射击。</p>
        <p class="range-summary" data-summary></p>
        <div class="range-buttons"><button data-start>开始 / 继续 · 锁定鼠标</button><button data-window>窗口模式进入</button><button data-restart>重新开始训练</button></div>
        <p class="range-note">锁定模式：移动鼠标转向，ESC 退出。<br>窗口模式：右键拖动或方向键转向，左键 / F 射击。</p>
        <p class="range-message" role="status" data-message>正在准备模型和物理……</p>
        <a href="#foundation">打开基础工程诊断场景</a>
      </div></section>`;
    const find = <T extends Element>(selector: string): T => {
      const element = root.querySelector<T>(selector); if (!element) throw new Error(`UI missing: ${selector}`); return element;
    };
    this.viewport = find('.range-viewport'); this.overlay = find('.range-overlay'); this.ammo = find('[data-ammo]');
    this.progress = find('[data-progress]'); this.status = find('[data-status]'); this.crosshair = find('[data-crosshair]');
    this.message = find('[data-message]'); this.summary = find('[data-summary]');
    const signal = this.abort.signal;
    find<HTMLButtonElement>('[data-start]').addEventListener('click', () => actions.start('locked'), { signal });
    find<HTMLButtonElement>('[data-window]').addEventListener('click', () => actions.start('window'), { signal });
    find<HTMLButtonElement>('[data-restart]').addEventListener('click', () => actions.restart(), { signal });
    find<HTMLButtonElement>('[data-pause]').addEventListener('click', () => actions.pause(), { signal });
    this.setReady(false);
  }
  setReady(ready: boolean): void { for (const button of this.root.querySelectorAll('button')) button.disabled = !ready; }
  showMessage(message: string): void { this.message.textContent = message; }
  fail(message: string): void { this.fatal = true; this.overlay.hidden = false; this.setReady(false); this.showMessage(`${message}。请刷新页面重试。`); }
  update(s: RangeSnapshot): void {
    this.overlay.hidden = !this.fatal && s.state === 'running';
    this.ammo.textContent = `${String(s.weapon.magazine).padStart(2, '0')} / ${s.weapon.reserve}`;
    this.status.textContent = s.weapon.state === 'reloading' ? '换弹中…' : s.weapon.magazine === 0 ? '弹匣已空 · 按 R 换弹' : '全自动 · R 换弹';
    this.progress.textContent = `靶子 ${s.destroyed} / ${s.targets.length}　命中 ${s.hits}　${s.elapsed.toFixed(1)} s`;
    this.crosshair.classList.toggle('hit', s.hitAge < 0.12);
    this.summary.textContent = s.destroyed === s.targets.length ? `训练完成！发射 ${s.weapon.shots} 发，命中 ${s.hits} 次。可重新开始练习。` : `已击倒 ${s.destroyed} / ${s.targets.length} · 共发射 ${s.weapon.shots} 发`;
    if (s.destroyed === s.targets.length) this.progress.textContent = `训练完成 · ${s.destroyed} / ${s.targets.length}　ESC 重开`;
  }
  dispose(): void { this.abort.abort(); this.root.className = ''; this.root.replaceChildren(); }
}
