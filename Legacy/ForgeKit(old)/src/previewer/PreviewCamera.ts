import { Box3, Euler, Object3D, PerspectiveCamera, Vector3 } from 'three';
export class PreviewCamera {
  camera = new PerspectiveCamera(50, 1, .01, 10000);
  keys = new Set<string>(); speed = 2; onFrame = () => {};
  constructor(private canvas: HTMLCanvasElement) {
    this.reset();
    canvas.addEventListener('click', () => { if (document.pointerLockElement !== canvas) { const p = canvas.requestPointerLock(); p?.catch(() => {}); } });
    window.addEventListener('keydown', e => {
      if ((e.target as HTMLElement)?.matches('input, select, textarea')) return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyF', 'KeyR', 'ShiftLeft', 'ShiftRight'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code); if (e.code === 'KeyF') this.onFrame(); if (e.code === 'KeyR') this.reset();
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    document.addEventListener('pointerlockchange', () => this.keys.clear());
    document.addEventListener('mousemove', e => {
      if (document.pointerLockElement !== canvas) return;
      const angles = new Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
      angles.y -= e.movementX * .002; angles.x = Math.max(-Math.PI / 2 + .01, Math.min(Math.PI / 2 - .01, angles.x - e.movementY * .002)); this.camera.quaternion.setFromEuler(angles);
    });
  }
  reset() { this.camera.position.set(3, 2.1, 4); this.camera.lookAt(0, .9, 0); this.speed = 2; }
  frame(object: Object3D) {
    const box = new Box3().setFromObject(object); if (box.isEmpty()) return;
    const center = box.getCenter(new Vector3()), size = box.getSize(new Vector3());
    const radius = Math.max(size.length() / 2, .01), v = this.camera.fov * Math.PI / 360, h = Math.atan(Math.tan(v) * this.camera.aspect);
    const distance = radius / Math.sin(Math.min(v, h)) * 1.18;
    this.camera.position.copy(center).add(new Vector3(.7, .35, 1).normalize().multiplyScalar(distance)); this.camera.lookAt(center);
    this.camera.near = Math.max(.001, radius / 1000); this.camera.far = Math.max(100, distance * 100); this.camera.updateProjectionMatrix(); this.speed = Math.max(.05, radius * 1.6);
  }
  update(dt: number) {
    if (document.pointerLockElement !== this.canvas) return;
    const axis = (pos: string, neg: string) => Number(this.keys.has(pos)) - Number(this.keys.has(neg));
    const move = new Vector3(axis('KeyD', 'KeyA'), 0, axis('KeyS', 'KeyW')).applyQuaternion(this.camera.quaternion);
    move.y += axis('KeyE', 'KeyQ'); if (move.lengthSq() > 0) move.normalize();
    this.camera.position.addScaledVector(move, dt * this.speed * (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 4 : 1));
  }
}
