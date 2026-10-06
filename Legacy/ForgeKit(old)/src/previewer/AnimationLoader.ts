import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export async function loadAnimation(url: string) {
  const gltf = await new GLTFLoader().loadAsync(url + '?v=' + Date.now());
  if (gltf.animations.length !== 1) throw new Error('Animation asset must contain exactly one clip.');
  return { root: gltf.scene, clip: gltf.animations[0], metadata: gltf.scene.children[0]?.userData ?? {} };
}
