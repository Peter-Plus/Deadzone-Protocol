import * as THREE from 'three';
import type { SceneDefinition, SessionSnapshot } from '../sandbox/session.js';

/** Presentation owns every GPU object. Gameplay only provides plain data. */
export class SceneView {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(48, 1, 0.1, 1000);
  private content = new THREE.Group();
  private probe: THREE.Mesh;
  private observer: ResizeObserver;
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  constructor(private readonly host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x111e26);
    this.renderer.domElement.setAttribute('aria-label', '基础验证三维场景');
    this.host.append(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight(0xb8e8ff, 0x293029, 2.8));
    const sun = new THREE.DirectionalLight(0xffdcad, 3);
    sun.position.set(10, 30, 10); this.scene.add(sun);
    this.scene.add(this.content);
    this.probe = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), new THREE.MeshBasicMaterial({ color: 0xc8fa73 }));
    this.scene.add(this.probe);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
  }

  setScene(definition: SceneDefinition): void {
    this.clearContent();
    const size = definition.size;
    const box = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x667e89, roughness: 0.85 });
    const groundGeometry = new THREE.PlaneGeometry(size, size);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x1c303a, roughness: 1 });
    this.geometries.push(box, groundGeometry); this.materials.push(material, groundMaterial);
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; this.content.add(ground);
    const grid = new THREE.GridHelper(size, 24, 0x5b756f, 0x2d454f);
    grid.position.y = 0.01; this.content.add(grid);
    this.geometries.push(grid.geometry);
    this.materials.push(...(Array.isArray(grid.material) ? grid.material : [grid.material]));
    for (const marker of definition.markers) {
      const mesh = new THREE.Mesh(box, material);
      mesh.scale.set(1.3, marker.height, 1.3);
      mesh.position.set(marker.x, marker.height / 2, marker.z);
      this.content.add(mesh);
    }
    this.camera.position.set(size * 0.75, size * 0.85, size * 0.9);
    this.camera.lookAt(0, 0, 0);
  }

  render(snapshot: SessionSnapshot): void {
    this.probe.position.set(snapshot.probe.x, snapshot.probe.y, snapshot.probe.z);
    this.renderer.render(this.scene, this.camera);
  }
  private resize(): void {
    const width = Math.max(1, this.host.clientWidth), height = Math.max(1, this.host.clientHeight);
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  private clearContent(): void {
    this.content.clear();
    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials) material.dispose();
    this.geometries = []; this.materials = [];
  }
  dispose(): void {
    this.observer.disconnect(); this.clearContent();
    this.probe.geometry.dispose();
    (this.probe.material as THREE.Material).dispose();
    this.renderer.dispose(); this.renderer.domElement.remove();
  }
}
