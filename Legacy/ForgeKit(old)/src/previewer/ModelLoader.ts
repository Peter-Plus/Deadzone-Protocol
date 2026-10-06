import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Mesh, Object3D } from 'three';
export async function loadModel(url: string) {
  const gltf = await new GLTFLoader().loadAsync(url + '?v=' + Date.now());
  gltf.scene.traverse(o => { if (o.userData.forgeBone) (o as Object3D & { isBone: boolean }).isBone = true; if (o instanceof Mesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { root: gltf.scene, metadata: gltf.scene.children[0]?.userData ?? {} };
}
export function disposeObject(root: Object3D) {
  const geometries = new Set(), materials = new Set();
  root.traverse(o => { if (o instanceof Mesh) { if (!geometries.has(o.geometry)) { geometries.add(o.geometry); o.geometry.dispose(); } for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (!materials.has(m)) { materials.add(m); m.dispose(); } } });
  root.removeFromParent();
}
