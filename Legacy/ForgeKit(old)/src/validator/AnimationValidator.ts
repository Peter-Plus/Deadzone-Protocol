import { BONE_NAMES } from '../rig/HumanoidRig.js';
import type { AnimationDefinition, Context, PoseDefinition, Tracks } from '../shared/types/index.js';
import { quaternion } from '../shared/math/transforms.js';
import { resolvePoses } from '../animation/PoseResolver.js';
import { ValidationReporter } from './ValidationReporter.js';
export function validateBones(bones: string[], r: ValidationReporter, path: string) {
  for (const bone of bones) if (!BONE_NAMES.includes(bone)) r.error('ANIM_UNKNOWN_BONE', `${path}.${bone}`, `Unknown bone "${bone}".`, `Expected canonical name: ${BONE_NAMES.join(', ')}`);
}
export function validatePose(d: PoseDefinition, r: ValidationReporter) {
  validateBones(Object.keys(d.bones), r, 'bones');
  for (const [bone, k] of Object.entries(d.bones)) if (k.position && (bone !== 'Hips' && bone !== 'Root' || Math.hypot(...k.position) > .25)) r.error('ANIM_TRANSLATION', `bones.${bone}.position`, 'Only Root/Hips local offsets up to 0.25m are supported.');
}
export function validateTracks(tracks: Tracks, d: AnimationDefinition, r: ValidationReporter) {
  validateBones(Object.keys(tracks), r, 'tracks');
  for (const [bone, keys] of Object.entries(tracks)) {
    const path = `tracks.${bone}`;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k.time > d.duration) r.error('ANIM_TIME_RANGE', `${path}[${i}].time`, 'Keyframe exceeds duration.');
      if (i && k.time <= keys[i - 1].time) r.error('ANIM_TIME_ORDER', `${path}[${i}].time`, 'Keyframe times must be strictly increasing.', 'Sort keys and remove duplicate times.');
      if (k.position && (bone !== 'Root' && bone !== 'Hips' || Math.hypot(...k.position) > .25)) r.error('ANIM_TRANSLATION', `${path}[${i}].position`, 'Only Root/Hips local offsets up to 0.25m are allowed.');
    }
    const positionKeys = keys.filter(k => k.position), rotationKeys = keys.filter(k => k.rotation);
    if ((bone === 'Root' || bone === 'Hips') && positionKeys.length) {
      const first = positionKeys[0], last = positionKeys.at(-1)!;
      // Offsets start/end at reference: prevents displacement across loop/clip boundaries.
      if (first.time !== 0 || last.time !== d.duration || Math.hypot(...first.position!) > 1e-6 || Math.hypot(...last.position!) > 1e-6) r.error('ANIM_ROOT_MOTION', path, 'Root/Hips translations must start and finish at zero offset at 0/duration.', 'Use bounded in-place bob with zero endpoints.');
    }
    if (d.loop && rotationKeys.length > 1) {
      if (quaternion(rotationKeys[0].rotation!).angleTo(quaternion(rotationKeys.at(-1)!.rotation!)) > .15) r.warning('ANIM_LOOP_SEAM', path, 'First and last rotations differ by more than 8.6 degrees.', 'Match endpoint poses for a seamless loop.');
    }
  }
}
export function validateAnimation(d: AnimationDefinition, ctx: Context, r: ValidationReporter) {
  if (d.mode === 'generator') return;
  for (const [i, f] of (d.timeline ?? []).entries()) {
    if (!ctx.poses.has(f.pose)) r.error('ANIM_POSE_REFERENCE', `timeline[${i}].pose`, `Unknown pose "${f.pose}".`);
    if (f.time > d.duration || (i && f.time <= d.timeline![i - 1].time)) r.error('ANIM_TIME_ORDER', `timeline[${i}].time`, 'Pose times must increase strictly within duration.');
  }
  if (r.ok) validateTracks(resolvePoses(d, ctx), d, r);
}
