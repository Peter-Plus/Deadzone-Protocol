import { AnimationClip, Object3D, PropertyBinding } from 'three';
import { rigCompatibility } from '../validator/RigValidator.js';
import type { RigMetadata } from '../shared/types/index.js';
export function bindClip(clip: AnimationClip, source: Object3D, target: Object3D, modelMetadata: RigMetadata, animationMetadata: RigMetadata): AnimationClip {
  const mismatch = rigCompatibility(modelMetadata, animationMetadata);
  if (mismatch.length) throw new Error(`Animation incompatible with current model.\nRig mismatch\n${mismatch.join('\n')}`);
  const result = clip.clone();
  for (const track of result.tracks) {
    const { nodeName, propertyName } = PropertyBinding.parseTrackName(track.name);
    const from = source.getObjectByName(nodeName), to = target.getObjectByName(nodeName);
    if (!from || !to) throw new Error(`Rig mismatch: missing bone ${nodeName}`);
    if (propertyName === 'position') for (let i = 0; i < track.values.length; i += 3) {
      track.values[i] += to.position.x - from.position.x;
      track.values[i + 1] += to.position.y - from.position.y;
      track.values[i + 2] += to.position.z - from.position.z;
    }
  }
  return result;
}
