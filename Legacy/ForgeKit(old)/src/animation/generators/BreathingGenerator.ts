import type { AnimationDefinition, Tracks } from '../../shared/types/index.js';
export function generateBreathing(d: AnimationDefinition, idle = false): Tracks {
  const tracks: Tracks = { Hips: [], Chest: [], UpperArm_L: [], UpperArm_R: [], Head: [] }, n = d.parameters?.samples ?? 48;
  for (let i = 0; i <= n; i++) {
    const time = i * d.duration / n, wave = Math.sin(i === n ? 0 : i / n * 2 * Math.PI), breath = d.parameters?.breath ?? 2;
    tracks.Hips.push({ time, position: [0, (1 - Math.cos(i === n ? 0 : i / n * 2 * Math.PI)) * .5 * (d.parameters?.bodyBob ?? .006), 0], rotation: [d.parameters?.lean ?? 0, 0, 0] });
    tracks.Chest.push({ time, rotation: [wave * breath, 0, 0] });
    tracks.Head.push({ time, rotation: [-wave * breath * .4, idle ? wave * 1.5 : 0, 0] });
    tracks.UpperArm_L.push({ time, rotation: [0, 0, -82 + wave * .7] });
    tracks.UpperArm_R.push({ time, rotation: [0, 0, 82 - wave * .7] });
  }
  return tracks;
}
