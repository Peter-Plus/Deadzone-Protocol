import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import arms from '../../../Assets/models/fps_arms/FSA_FPS_Arms_001_Base.glb';
import rifle from '../../../Assets/models/weapons/AR/AR_001_Vanguard/FSA_WPN_AR_001_Vanguard.glb';
import idle from '../../../Assets/animations/fps/firearm/shared/FSA_ANIM_FPS_Firearm_Idle.anim.glb';
import walk from '../../../Assets/animations/fps/firearm/shared/FSA_ANIM_FPS_Firearm_Walk.anim.glb';
import fire from '../../../Assets/animations/fps/firearm/shared/FSA_ANIM_FPS_Firearm_Fire.anim.glb';
import reload from '../../../Assets/animations/fps/firearm/shared/FSA_ANIM_FPS_Firearm_Reload.anim.glb';

export interface RangeAssets { readonly arms: GLTF; readonly rifle: GLTF; readonly clips: Readonly<Record<'idle' | 'walk' | 'fire' | 'reload', GLTF>> }
export async function loadRangeAssets(): Promise<RangeAssets> {
  const loader = new GLTFLoader();
  const parse = (base64: string): Promise<GLTF> => {
    const text = atob(base64); const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
    return loader.parseAsync(bytes.buffer, '');
  };
  const [armsAsset, rifleAsset, idleAsset, walkAsset, fireAsset, reloadAsset] = await Promise.all([arms, rifle, idle, walk, fire, reload].map(parse));
  if (!armsAsset || !rifleAsset || !idleAsset || !walkAsset || !fireAsset || !reloadAsset) throw new Error('测试场资源不完整');
  for (const name of ['Weapon_R', 'Camera_FPS', 'UpperArm_L', 'Forearm_L', 'UpperArm_R', 'Forearm_R']) {
    if (!armsAsset.scene.getObjectByName(name)) throw new Error(`双臂缺少节点 ${name}`);
  }
  return { arms: armsAsset, rifle: rifleAsset, clips: { idle: idleAsset, walk: walkAsset, fire: fireAsset, reload: reloadAsset } };
}
