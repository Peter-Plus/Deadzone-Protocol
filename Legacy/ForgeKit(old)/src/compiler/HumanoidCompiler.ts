import { BoxGeometry, Mesh } from 'three';
import { createHumanoidRig } from '../rig/HumanoidRig.js';
import { rigMetadata } from '../rig/RigSignature.js';
import type { ModelDefinition, Vec3 } from '../shared/types/index.js';
import { MaterialCompiler } from './MaterialCompiler.js';
export function compileHumanoid(d: ModelDefinition, materials: MaterialCompiler) {
  const rig = createHumanoidRig(d.body), m = rig.metrics;
  const add = (bone: string, size: Vec3, pos: Vec3, label = bone) => {
    const mesh = new Mesh(new BoxGeometry(...size), materials.get(d.material)); mesh.name = `body_${label}`;
    mesh.position.fromArray(pos); rig.bones.get(bone)!.add(mesh);
  };
  add('Hips', [m.hip + m.h * .075, m.torso * .24, m.thickness], [0, m.torso * .12, 0]);
  add('Spine', [m.shoulder * .72, m.torso * .34, m.thickness * .9], [0, m.torso * .17, 0]);
  add('Chest', [m.shoulder, m.torso * .24, m.thickness], [0, m.torso * .10, 0]);
  add('Neck', [m.head * .35, m.torso * .1, m.head * .35], [0, m.torso * .05, 0]);
  add('Head', [m.head * .8, m.head, m.head * .8], [0, 0, 0]);
  // A small nose makes the +Z facing direction visible without textures.
  add('Head', [m.head * .18, m.head * .14, m.head * .18], [0, -m.head * .05, m.head * .46], 'nose');
  for (const [side, sign] of [['L', 1], ['R', -1]] as const) {
    add('UpperArm_' + side, [m.arm * .52, m.h * .067, m.h * .067], [sign * m.arm * .26, 0, 0]);
    add('LowerArm_' + side, [m.arm * .48, m.h * .056, m.h * .056], [sign * m.arm * .24, 0, 0]);
    add('Hand_' + side, [m.hand, m.hand * .6, m.hand * .45], [sign * m.hand / 2, 0, 0]);
    add('UpperLeg_' + side, [m.hip * .43, m.leg * .52, m.thickness * .85], [0, -m.leg * .26, 0]);
    add('LowerLeg_' + side, [m.hip * .34, m.leg * .48, m.thickness * .65], [0, -m.leg * .24, 0]);
    add('Foot_' + side, [m.hip * .4, m.foot, m.footLength], [0, -m.foot / 2, m.footLength * .22]);
  }
  rig.root.userData = rigMetadata(); return rig;
}
