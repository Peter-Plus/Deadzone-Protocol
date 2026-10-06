import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
const paths = {
  arms: 'models/fps_arms/FSA_FPS_Arms_001_Base.glb', rifle: 'models/weapons/AR/AR_001_Vanguard/FSA_WPN_AR_001_Vanguard.glb',
  idle: 'animations/fps/firearm/shared/FSA_ANIM_FPS_Firearm_Idle.anim.glb',
  walk: 'animations/fps/firearm/shared/FSA_ANIM_FPS_Firearm_Walk.anim.glb',
  fire: 'animations/fps/firearm/shared/FSA_ANIM_FPS_Firearm_Fire.anim.glb',
  reload: 'animations/fps/firearm/shared/FSA_ANIM_FPS_Firearm_Reload.anim.glb',
};
async function read(path) { const b = await readFile(new URL(`../Assets/${path}`, import.meta.url)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); }
test('embedded GLBs have no external buffers or images', async () => {
  for (const path of Object.values(paths)) {
    const b = Buffer.from(await read(path)); const json = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString());
    for (const resource of [...(json.buffers ?? []), ...(json.images ?? [])]) assert.ok(!resource.uri || resource.uri.startsWith('data:'), path);
  }
});
test('real arms and animation bind, camera faces +Z, reload duration matches configured commit', async () => {
  const loader = new GLTFLoader();
  const arms = await loader.parseAsync(await read(paths.arms), '');
  for (const name of ['Camera_FPS', 'Weapon_R', 'UpperArm_L', 'Forearm_L', 'UpperArm_R', 'Forearm_R']) assert.ok(arms.scene.getObjectByName(name));
  const camera = new THREE.PerspectiveCamera(); arms.scene.getObjectByName('Camera_FPS').add(camera); arms.scene.updateMatrixWorld(true);
  assert.ok(camera.getWorldDirection(new THREE.Vector3()).z > 0.999);
  for (const key of ['idle', 'walk', 'fire', 'reload']) {
    const asset = await loader.parseAsync(await read(paths[key]), ''); const clip = asset.animations[0];
    for (const track of clip.tracks) assert.ok(arms.scene.getObjectByName(track.name.split('.')[0]), `${key}: ${track.name}`);
    if (key === 'reload') assert.ok(Math.abs(clip.duration - 1.45) < 1e-6);
  }
});
