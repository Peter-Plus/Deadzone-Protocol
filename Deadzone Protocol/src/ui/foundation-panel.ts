import type { SessionSnapshot } from '../sandbox/session.js';

export interface PanelActions { togglePause(): void; restart(seed: string): void }
export class FoundationPanel {
  readonly viewport: HTMLElement;
  private status: HTMLElement;
  private metrics: HTMLElement;
  private notice: HTMLElement;
  private seed: HTMLInputElement;
  private pause: HTMLButtonElement;
  private abort = new AbortController();

  constructor(private readonly root: HTMLElement, actions: PanelActions) {
    root.innerHTML = `
      <section class="viewport" aria-label="三维预览"></section>
      <header><span class="eyebrow">DEADZONE PROTOCOL / FOUNDATION 0.1</span>
        <h1>死区协议</h1><p>基础运行验证场景</p></header>
      <aside class="panel" aria-label="基础验证控制台">
        <div class="status"><span class="dot"></span><strong data-status>准备中</strong></div>
        <p class="intro">相同种子生成相同布局。绿色探针用于观察固定步长模拟；灰色标记物仅用于验证表现接入。</p>
        <form><label for="world-seed">世界种子</label>
          <input id="world-seed" name="seed" maxlength="128" required autocomplete="off" />
          <div class="actions"><button type="button" data-pause>暂停模拟</button><button type="submit">按种子重启</button></div>
        </form>
        <dl data-metrics></dl><p class="notice" role="status" data-notice></p>
        <div class="boundary"><h2>本次接入范围</h2><p>模拟时钟 · 多频调度 · 种子随机<br>配置校验 · 只读快照 · Three.js</p>
        <p>此页为旧基础诊断场景。</p><a href="#range">返回第一人称训练场</a></div>
      </aside><footer>基础工程 / 非正式游戏关卡 <span>Y ↑ · 米制 · 模拟时间以秒计</span></footer>`;
    const find = <T extends Element>(selector: string): T => {
      const element = root.querySelector<T>(selector);
      if (!element) throw new Error(`UI 元素缺失: ${selector}`);
      return element;
    };
    this.viewport = find('.viewport'); this.status = find('[data-status]');
    this.metrics = find('[data-metrics]'); this.notice = find('[data-notice]');
    this.seed = find('#world-seed'); this.pause = find('[data-pause]');
    this.pause.addEventListener('click', () => actions.togglePause(), { signal: this.abort.signal });
    find<HTMLFormElement>('form').addEventListener('submit', (event) => {
      event.preventDefault(); actions.restart(this.seed.value);
    }, { signal: this.abort.signal });
  }
  setSeed(seed: string): void { this.seed.value = seed; }
  showMessage(message: string): void { this.notice.textContent = message; }
  update(snapshot: SessionSnapshot): void {
    this.status.textContent = snapshot.state === 'running' ? '模拟运行中' : '模拟已暂停';
    this.pause.textContent = snapshot.state === 'running' ? '暂停模拟' : '继续模拟';
    this.metrics.innerHTML = `<div><dt>模拟时间</dt><dd>${snapshot.elapsedSeconds.toFixed(2)} s</dd></div>
      <div><dt>固定步数</dt><dd>${snapshot.ticks}</dd></div>
      <div><dt>低频调度次数</dt><dd>${snapshot.telemetryTicks}</dd></div>
      <div><dt>丢弃的追帧时间</dt><dd>${snapshot.droppedSeconds.toFixed(3)} s</dd></div>`;
  }
  dispose(): void { this.abort.abort(); this.root.replaceChildren(); }
}
