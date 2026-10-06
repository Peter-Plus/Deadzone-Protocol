import { AmbientLight, AnimationMixer, AxesHelper, Box3, Box3Helper, Color, DirectionalLight, GridHelper, Group, LoopOnce, LoopRepeat, Mesh, MeshStandardMaterial, Object3D, PlaneGeometry, Quaternion, Scene, SkeletonHelper, Vector3, WebGLRenderer, type AnimationClip, type AnimationAction } from 'three';
import { PreviewCamera } from './PreviewCamera.js';
import { disposeObject } from './ModelLoader.js';
export class PreviewScene {
  scene = new Scene(); renderer: WebGLRenderer; controls: PreviewCamera;
  model?: Object3D; mixer?: AnimationMixer; action?: AnimationAction;
  grid = new GridHelper(20, 40, '#344554', '#1e2b37'); axes = new AxesHelper(1);
  skeleton?: SkeletonHelper; bounds?: Box3Helper; sockets = new Group();
  socketPairs: { object: Object3D; helper: AxesHelper }[] = [];
  rest = new Map<Object3D, { position: Vector3; quaternion: Quaternion; scale: Vector3 }>();
  flags: Record<string, boolean> = { grid: true, axes: true, skeleton: false, bounds: false, sockets: false, wireframe: false };
  onStats = (_fps: number, _triangles: number) => {};
  constructor(host: HTMLElement) {
    this.scene.background = new Color('#101922');
    this.renderer = new WebGLRenderer({ antialias: true }); this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    host.append(this.renderer.domElement); this.controls = new PreviewCamera(this.renderer.domElement);
    this.controls.onFrame = () => { if (this.model) this.controls.frame(this.model); };
    this.scene.add(this.grid, this.axes, this.sockets, new AmbientLight('#d7ebff', 1.6));
    const light = new DirectionalLight('#fff1da', 3); light.position.set(4, 8, 6); this.scene.add(light);
    const fill = new DirectionalLight('#89baff', 1.5); fill.position.set(-5, 3, -4); this.scene.add(fill);
    const ground = new Mesh(new PlaneGeometry(200, 200), new MeshStandardMaterial({ color: '#111e29', roughness: 1, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
    ground.rotation.x = -Math.PI / 2; this.scene.add(ground);
    new ResizeObserver(() => { const w = host.clientWidth, h = host.clientHeight; this.renderer.setSize(w, h); this.controls.camera.aspect = w / Math.max(h, 1); this.controls.camera.updateProjectionMatrix(); }).observe(host);
    let previous = performance.now(), elapsed = 0, frames = 0;
    this.renderer.setAnimationLoop(now => {
      const dt = Math.min((now - previous) / 1000, .1); previous = now; this.controls.update(dt); this.mixer?.update(dt);
      if (this.model && this.bounds?.visible) this.bounds.box.setFromObject(this.model);
      this.model?.updateMatrixWorld(true);
      for (const { object, helper } of this.socketPairs) { object.getWorldPosition(helper.position); object.getWorldQuaternion(helper.quaternion); }
      this.renderer.render(this.scene, this.controls.camera); elapsed += dt; frames++;
      if (elapsed > .5) { this.onStats(Math.round(frames / elapsed), this.triangles()); frames = 0; elapsed = 0; }
    });
  }
  triangles() { let n = 0; this.model?.traverse(o => { if (o instanceof Mesh) n += (o.geometry.index?.count ?? o.geometry.getAttribute('position').count) / 3; }); return n; }
  stop() {
    if (this.mixer && this.model) { this.mixer.stopAllAction(); this.mixer.uncacheRoot(this.model); }
    this.action = undefined; this.mixer = undefined;
    for (const [o, t] of this.rest) { o.position.copy(t.position); o.quaternion.copy(t.quaternion); o.scale.copy(t.scale); }
  }
  setModel(model?: Object3D) {
    this.stop();
    if (this.model) disposeObject(this.model);
    this.skeleton?.removeFromParent(); this.skeleton?.dispose(); this.skeleton = undefined;
    this.bounds?.removeFromParent(); this.bounds?.dispose(); this.bounds = undefined;
    for (const { helper } of this.socketPairs) { helper.dispose(); helper.removeFromParent(); } this.socketPairs = [];
    this.rest.clear(); this.model = model; if (!model) return;
    model.traverse(o => { this.rest.set(o, { position: o.position.clone(), quaternion: o.quaternion.clone(), scale: o.scale.clone() }); if (o.userData.socket) { const helper = new AxesHelper(.12); this.sockets.add(helper); this.socketPairs.push({ object: o, helper }); } });
    this.scene.add(model); this.skeleton = new SkeletonHelper(model); this.scene.add(this.skeleton);
    this.bounds = new Box3Helper(new Box3().setFromObject(model), new Color('#efb86d')); this.scene.add(this.bounds);
    this.applyFlags(); this.controls.frame(model);
  }
  play(clip: AnimationClip, loop: boolean) {
    this.stop(); if (!this.model) return;
    this.mixer = new AnimationMixer(this.model); this.action = this.mixer.clipAction(clip);
    this.action.setLoop(loop ? LoopRepeat : LoopOnce, loop ? Infinity : 1); this.action.clampWhenFinished = true; this.action.play();
  }
  applyFlags() {
    this.grid.visible = this.flags.grid; this.axes.visible = this.flags.axes; this.sockets.visible = this.flags.sockets;
    if (this.skeleton) this.skeleton.visible = this.flags.skeleton;
    if (this.bounds) this.bounds.visible = this.flags.bounds;
    this.model?.traverse(o => { if (o instanceof Mesh) for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m instanceof MeshStandardMaterial) m.wireframe = this.flags.wireframe; });
  }
}
