import { AnimationClip, QuaternionKeyframeTrack, VectorKeyframeTrack, type Bone, type KeyframeTrack } from 'three';
import type { AnimationDefinition, Tracks } from '../shared/types/index.js';
import { quaternion } from '../shared/math/transforms.js';
export function compileTimeline(d: AnimationDefinition, tracks: Tracks, bones: Map<string, Bone>) {
  const result: KeyframeTrack[] = [];
  for (const name of Object.keys(tracks).sort()) {
    for (const property of ['rotation', 'position'] as const) {
      const keys = tracks[name].filter(k => k[property]); if (!keys.length) continue;
      // Extend sparse channels to clip boundaries so GLTFLoader retains duration.
      const full = [...keys]; if (keys[0].time > 0) full.unshift({ ...keys[0], time: 0 });
      if (keys.at(-1)!.time < d.duration) full.push({ ...keys.at(-1)!, time: d.duration });
      const times = full.map(k => k.time);
      if (property === 'rotation') {
        let prev: number[] | undefined;
        const values = full.flatMap(k => { const q = quaternion(k.rotation!).toArray(); if (prev && q.reduce((s, v, i) => s + v * prev![i], 0) < 0) for (let i = 0; i < 4; i++) q[i] *= -1; prev = q; return q; });
        result.push(new QuaternionKeyframeTrack(`${name}.quaternion`, times, values));
      } else {
        const rest = bones.get(name)!.position.toArray();
        result.push(new VectorKeyframeTrack(`${name}.position`, times, full.flatMap(k => k.position!.map((v, i) => v + rest[i]))));
      }
    }
  }
  return new AnimationClip(d.id, d.duration, result);
}
