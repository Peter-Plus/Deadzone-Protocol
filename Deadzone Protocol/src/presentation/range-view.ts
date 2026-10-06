import * as THREE from 'three';
import type { RangeAssets } from './assets/range-assets.js';
import type { RangeLevel } from '../range/level.js';
import type { RangeSnapshot } from '../range/session.js';
import type { EntityId } from '../core/entity.js';

/** World and first-person view use separate depth buffers, one camera. */
export class RangeView {
  readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private world = new THREE.Scene();
  private hands = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(70, 1, 0.005, 180);
  private rig = new THREE.Group();
  private cameraOffset = new THREE.Vector3();
  private observer: ResizeObserver;
  private geometries = new Set<THREE.BufferGeometry>();
  private materials = new Set<THREE.Material>();
  private targets = new Map<EntityId, THREE.Group>();
  private mixer: THREE.AnimationMixer;
  private actions: Record<'idle' | 'walk' | 'fire' | 'reload', THREE.AnimationAction>;
  private activeAction: THREE.AnimationAction | undefined;
  private muzzle: THREE.Mesh;
  private impact: THREE.Mesh;
  private disposed = false;

  constructor(private readonly host: HTMLElement, level: RangeLevel, assets: RangeAssets) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); this.renderer.autoClear = false;
    this.renderer.setClearColor(0x182630); this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.canvas = this.renderer.domElement; this.canvas.tabIndex = 0;
    this.canvas.setAttribute('aria-label', '第一人称训练场：WASD 移动，方向键观察，F 射击'); host.append(this.canvas);
    this.world.fog = new THREE.Fog(0x182630, 24, 70);
    for (const scene of [this.world, this.hands]) {
      scene.add(new THREE.HemisphereLight(0xc3e5ff, 0x394552, 2.5));
      const sun = new THREE.DirectionalLight(0xffe0b0, 2.4); sun.position.set(-8, 15, -10); scene.add(sun);
    }
    this.buildLevel(level);
    this.hands.add(this.rig); this.rig.add(assets.arms.scene);
    const mount = assets.arms.scene.getObjectByName('Camera_FPS')!;
    const grip = assets.arms.scene.getObjectByName('Weapon_R')!;
    grip.add(assets.rifle.scene); assets.rifle.scene.position.set(0, 0, 0); assets.rifle.scene.quaternion.identity(); assets.rifle.scene.scale.setScalar(1);
    mount.add(this.camera); this.camera.position.set(0, 0, 0); this.camera.quaternion.identity();
    this.rig.updateMatrixWorld(true); this.camera.getWorldPosition(this.cameraOffset);
    this.mixer = new THREE.AnimationMixer(assets.arms.scene);
    const makeAction = (key: keyof RangeAssets['clips']): THREE.AnimationAction => {
      const clip = assets.clips[key].animations[0];
      if (!clip) throw new Error(`缺少 ${key} 动画`);
      for (const track of clip.tracks) {
        const name = track.name.split('.')[0]!;
        if (!assets.arms.scene.getObjectByName(name)) throw new Error(`动画节点未绑定: ${name}`);
      }
      return this.mixer.clipAction(clip);
    };
    this.actions = { idle: makeAction('idle'), walk: makeAction('walk'), fire: makeAction('fire'), reload: makeAction('reload') };
    this.muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd774 }));
    // Visual-only offset inspected against Vanguard's Bore; Weapon_R is NOT the muzzle.
    this.muzzle.position.set(0, 0.137, 0.575); assets.rifle.scene.add(this.muzzle);
    this.impact = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffed98 }));
    this.world.add(this.impact);
    for (const scene of [this.world, this.hands]) scene.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
        this.geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) this.materials.add(material);
      }
    });
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(host); this.resize();
  }
  private buildLevel(level: RangeLevel): void {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = {
      floor: new THREE.MeshStandardMaterial({ color: 0x35454a, roughness: 1 }),
      wall: new THREE.MeshStandardMaterial({ color: 0x50636b, roughness: 0.9 }),
      cover: new THREE.MeshStandardMaterial({ color: 0x8b8664, roughness: 0.8 }),
      target: new THREE.MeshStandardMaterial({ color: 0xc66048, roughness: 0.7 }),
    };
    for (const box of level.boxes) {
      const mesh = new THREE.Mesh(geometry, materials[box.kind]);
      mesh.position.set(box.position.x, box.position.y, box.position.z);
      mesh.scale.set(box.halfSize.x * 2, box.halfSize.y * 2, box.halfSize.z * 2);
      if (box.kind === 'target') {
        const group = new THREE.Group(); group.add(mesh);
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.20, 0.27, 32), new THREE.MeshBasicMaterial({ color: 0xf2e9c5, side: THREE.DoubleSide }));
        ring.position.set(box.position.x, box.position.y, box.position.z - box.halfSize.z - 0.004);
        group.add(ring);
        const bull = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), new THREE.MeshBasicMaterial({ color: 0xf2e9c5, side: THREE.DoubleSide }));
        bull.position.copy(ring.position); group.add(bull);
        const stand = new THREE.Mesh(geometry, materials.wall); stand.position.set(box.position.x, 0.4, box.position.z); stand.scale.set(0.12, 0.8, 0.12); group.add(stand);
        this.targets.set(box.id, group); this.world.add(group);
      } else this.world.add(mesh);
    }
    const grid = new THREE.GridHelper(28, 28, 0x72868a, 0x45565b); grid.position.set(0, 0.008, 14); this.world.add(grid);
    for (const z of [2, 10, 20, 30]) {
      const line = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: z === 2 ? 0xcbe891 : 0x7b9290 }));
      line.position.set(0, 0.012, z); line.scale.set(27.3, 0.01, 0.05); this.world.add(line);
    }
  }
  render(snapshot: RangeSnapshot): void {
    this.rig.rotation.set(snapshot.pitch, snapshot.yaw, 0, 'YXZ');
    const offset = this.cameraOffset.clone().applyQuaternion(this.rig.quaternion);
    this.rig.position.set(snapshot.eye.x - offset.x, snapshot.eye.y - offset.y, snapshot.eye.z - offset.z);
    const key = snapshot.weapon.state === 'reloading' ? 'reload' : snapshot.weapon.state === 'firing' ? 'fire' : snapshot.moving ? 'walk' : 'idle';
    const action = this.actions[key];
    if (action !== this.activeAction) {
      this.mixer.stopAllAction(); action.reset().setLoop(THREE.LoopOnce, 1).play(); action.clampWhenFinished = true; this.activeAction = action;
    }
    const time = key === 'reload' || key === 'fire' ? snapshot.weapon.actionTime : snapshot.elapsed % action.getClip().duration;
    action.time = Math.min(time, action.getClip().duration); action.paused = true; this.mixer.update(0);
    this.muzzle.visible = snapshot.shotAge < 0.045;
    this.impact.visible = snapshot.impact !== null && snapshot.shotAge < 0.15;
    if (snapshot.impact) this.impact.position.set(snapshot.impact.x, snapshot.impact.y, snapshot.impact.z);
    for (const target of snapshot.targets) { const group = this.targets.get(target.id); if (group) group.visible = target.health > 0; }
    this.hands.updateMatrixWorld(true);
    this.renderer.clear(); this.renderer.render(this.world, this.camera); this.renderer.clearDepth(); this.renderer.render(this.hands, this.camera);
  }
  private resize(): void {
    const width = Math.max(1, this.host.clientWidth), height = Math.max(1, this.host.clientHeight);
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); this.renderer.setSize(width, height);
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.observer.disconnect(); this.mixer.stopAllAction(); this.mixer.uncacheRoot(this.mixer.getRoot());
    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials) material.dispose();
    this.renderer.dispose(); this.canvas.remove();
  }
}
