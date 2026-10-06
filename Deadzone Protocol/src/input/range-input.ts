import type { RangeInputFrame } from '../range/session.js';

type Mode = 'locked' | 'window';
/** DOM input boundary. Edge actions are consumed once per simulation tick. */
export class RangeInput {
  private abort = new AbortController();
  private keys = new Set<string>();
  private fireMouse = false;
  private firePressed = false;
  private dragging = false;
  private jump = false;
  private reload = false;
  private dx = 0; private dy = 0;
  private active = false;
  private mode: Mode = 'window';
  constructor(private readonly canvas: HTMLCanvasElement, private readonly onPause: () => void, private readonly onMessage: (message: string) => void) {
    const signal = this.abort.signal;
    window.addEventListener('keydown', e => {
      if (!this.active) return;
      if (e.code === 'Escape') { this.onPause(); return; }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyR', 'KeyF', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault(); this.keys.add(e.code);
        if (!e.repeat && e.code === 'Space') this.jump = true;
        if (!e.repeat && e.code === 'KeyR') this.reload = true;
        if (!e.repeat && e.code === 'KeyF') this.firePressed = true;
      }
    }, { signal });
    window.addEventListener('keyup', e => { this.keys.delete(e.code); }, { signal });
    canvas.addEventListener('mousedown', e => {
      if (!this.active) return;
      canvas.focus(); e.preventDefault();
      if (e.button === 0) { this.fireMouse = true; this.firePressed = true; }
      if (e.button === 2) this.dragging = true;
    }, { signal });
    window.addEventListener('mouseup', e => {
      if (e.button === 0) this.fireMouse = false;
      if (e.button === 2) this.dragging = false;
    }, { signal });
    window.addEventListener('mousemove', e => {
      if (this.active && (document.pointerLockElement === canvas || this.mode === 'window' && this.dragging)) {
        this.dx += e.movementX; this.dy += e.movementY;
      }
    }, { signal });
    canvas.addEventListener('contextmenu', e => e.preventDefault(), { signal });
    window.addEventListener('blur', () => { if (this.active) this.onPause(); }, { signal });
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.active) this.onPause(); }, { signal });
    document.addEventListener('pointerlockchange', () => {
      if (this.active && this.mode === 'locked' && document.pointerLockElement !== canvas) this.onPause();
    }, { signal });
    document.addEventListener('pointerlockerror', () => {
      if (this.active && this.mode === 'locked') { this.onPause(); this.onMessage('浏览器未允许鼠标锁定，请点击“窗口模式进入”。'); }
    }, { signal });
  }
  start(mode: Mode): void {
    this.clear(); this.active = true; this.mode = mode; this.canvas.focus();
    if (mode === 'locked') {
      try {
        const result = this.canvas.requestPointerLock();
        if (result) void result.catch(() => { if (this.active) { this.onPause(); this.onMessage('鼠标锁定失败，请改用窗口模式。'); } });
      } catch { this.onPause(); this.onMessage('此浏览器无法锁定鼠标，请改用窗口模式。'); }
    }
  }
  stop(): void {
    this.active = false; this.clear();
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }
  private clear(): void { this.keys.clear(); this.fireMouse = false; this.firePressed = false; this.dragging = false; this.jump = false; this.reload = false; this.dx = 0; this.dy = 0; }
  takeLook(dt: number): { dx: number; dy: number } {
    const dx = this.dx + (Number(this.keys.has('ArrowRight')) - Number(this.keys.has('ArrowLeft'))) * 650 * dt;
    const dy = this.dy + (Number(this.keys.has('ArrowDown')) - Number(this.keys.has('ArrowUp'))) * 650 * dt;
    this.dx = 0; this.dy = 0; return { dx, dy };
  }
  sample(): RangeInputFrame {
    const frame = { forward: Number(this.keys.has('KeyW')) - Number(this.keys.has('KeyS')),
      right: Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA')), jump: this.jump,
      reload: this.reload, fire: this.firePressed || this.fireMouse || this.keys.has('KeyF') };
    this.jump = false; this.reload = false; this.firePressed = false; return frame;
  }
  dispose(): void { this.stop(); this.abort.abort(); }
}
