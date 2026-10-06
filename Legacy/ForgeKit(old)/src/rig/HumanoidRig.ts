import { Bone, Group } from 'three';
import type { Body, Vec3 } from '../shared/types/index.js';
export const BONE_PARENTS: Record<string, string | null> = {
  Root: null, Hips: 'Root', Spine: 'Hips', Chest: 'Spine', Neck: 'Chest', Head: 'Neck',
  Clavicle_L: 'Chest', UpperArm_L: 'Clavicle_L', LowerArm_L: 'UpperArm_L', Hand_L: 'LowerArm_L',
  Clavicle_R: 'Chest', UpperArm_R: 'Clavicle_R', LowerArm_R: 'UpperArm_R', Hand_R: 'LowerArm_R',
  UpperLeg_L: 'Hips', LowerLeg_L: 'UpperLeg_L', Foot_L: 'LowerLeg_L', Toe_L: 'Foot_L',
  UpperLeg_R: 'Hips', LowerLeg_R: 'UpperLeg_R', Foot_R: 'LowerLeg_R', Toe_R: 'Foot_R'
};
export const BONE_NAMES = Object.keys(BONE_PARENTS);
export const CANONICAL_AXIS = '+X:right;+Y:up;+Z:forward;Euler:XYZ;identity-rest';
export function bodyMetrics(body: Body = {}) {
  const h = body.height ?? 1.8;
  const norm = h / (.04 * (body.footScale ?? 1) + .46 * (body.legLengthScale ?? 1) + .36 + .14 * (body.headScale ?? 1));
  return { h, foot: .04 * (body.footScale ?? 1) * norm, leg: .46 * (body.legLengthScale ?? 1) * norm,
    torso: .36 * norm, head: .14 * (body.headScale ?? 1) * norm, arm: .32 * h * (body.armLengthScale ?? 1),
    shoulder: body.shoulderWidth ?? .267 * h, hip: body.hipWidth ?? .178 * h,
    thickness: body.bodyThickness ?? .12 * h, hand: .075 * h * (body.handScale ?? 1), footLength: .15 * h * (body.footScale ?? 1) };
}
export function createHumanoidRig(body: Body = {}) {
  const m = bodyMetrics(body), bones = new Map<string, Bone>(), root = new Group();
  const positions: Record<string, Vec3> = {
    Root: [0, 0, 0], Hips: [0, m.foot + m.leg, 0], Spine: [0, m.torso * .28, 0],
    Chest: [0, m.torso * .36, 0], Neck: [0, m.torso * .26, 0], Head: [0, m.torso * .1 + m.head / 2, 0]
  };
  for (const [side, sign] of [['L', 1], ['R', -1]] as const) {
    positions['Clavicle_' + side] = [sign * m.shoulder * .2, m.torso * .16, 0];
    positions['UpperArm_' + side] = [sign * m.shoulder * .3, 0, 0];
    positions['LowerArm_' + side] = [sign * m.arm * .52, 0, 0];
    positions['Hand_' + side] = [sign * m.arm * .48, 0, 0];
    positions['UpperLeg_' + side] = [sign * m.hip / 2, 0, 0];
    positions['LowerLeg_' + side] = [0, -m.leg * .52, 0];
    positions['Foot_' + side] = [0, -m.leg * .48, 0];
    positions['Toe_' + side] = [0, -m.foot / 2, m.footLength * .55];
  }
  for (const name of BONE_NAMES) {
    const bone = new Bone(); bone.name = name; bone.position.fromArray(positions[name]);
    bone.userData = { forgeBone: true }; bones.set(name, bone);
    const parent = BONE_PARENTS[name]; (parent ? bones.get(parent)! : root).add(bone);
  }
  return { root, bones, metrics: m };
}
