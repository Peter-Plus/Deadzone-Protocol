import type { AnimationDefinition, Tracks, Vec3 } from '../../shared/types/index.js';
export function generateWalk(d: AnimationDefinition, running = false): Tracks {
  const p = d.parameters ?? {}, tracks: Tracks = {}, n = p.samples ?? 48;
  const add = (bone: string, time: number, rotation: Vec3, position?: Vec3) => (tracks[bone] ??= []).push({ time, rotation, ...(position ? { position } : {}) });
  for (let i = 0; i <= n; i++) {
    const time = i * d.duration / n, phase = i === n ? 0 : i / n * Math.PI * 2;
    const wave = Math.sin(phase), bob = (1 - Math.cos(phase * 2)) * .5 * (p.bodyBob ?? (running ? .05 : .025));
    add('Hips', time, [p.lean ?? (running ? 12 : 0), wave * (p.hipTwist ?? 4), 0], [0, bob, 0]);
    add('Chest', time, [0, -wave * (p.hipTwist ?? 4), 0]);
    for (const [side, sign] of [['L', 1], ['R', -1]] as const) {
      const step = wave * sign;
      add('UpperLeg_' + side, time, [step * (p.strideAngle ?? (running ? 48 : 32)), 0, 0]);
      add('LowerLeg_' + side, time, [Math.max(0, -step) * (p.kneeBend ?? (running ? 70 : 24)), 0, 0]);
      add('Foot_' + side, time, [-step * 8, 0, 0]);
      add('UpperArm_' + side, time, [-step * (p.armSwing ?? (running ? 38 : 20)), 0, -sign * 82]);
      add('LowerArm_' + side, time, [0, sign * (running ? -55 : -12), 0]);
    }
  }
  return tracks;
}
