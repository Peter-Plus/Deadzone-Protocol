import type { AnimationDefinition, Context } from '../shared/types/index.js';
import { createHumanoidRig } from '../rig/HumanoidRig.js';
import { rigMetadata } from '../rig/RigSignature.js';
import { resolvePoses } from '../animation/PoseResolver.js';
import { compileTimeline } from '../animation/TimelineCompiler.js';
import { generateIdle } from '../animation/generators/IdleGenerator.js';
import { generateBreathing } from '../animation/generators/BreathingGenerator.js';
import { generateWalk } from '../animation/generators/WalkGenerator.js';
import { generateRun } from '../animation/generators/RunGenerator.js';
export function compileAnimation(d: AnimationDefinition, ctx: Context) {
  const rig = createHumanoidRig(); rig.root.name = 'AnimationRoot';
  const generators = { 'humanoid.idle': generateIdle, 'humanoid.breathing': generateBreathing, 'humanoid.walk': generateWalk, 'humanoid.run': generateRun };
  const tracks = d.mode === 'generator' ? generators[d.generator!](d) : resolvePoses(d, ctx);
  const clip = compileTimeline(d, tracks, rig.bones);
  rig.root.userData = { ...rigMetadata(), animationId: d.id, duration: d.duration, loop: d.loop, translationSpace: 'reference-relative' };
  return { root: rig.root, clip };
}
