import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AnimationMixer, Box3, Vector3 } from 'three';
import { BONE_NAMES, BONE_PARENTS, createHumanoidRig } from '../../src/rig/HumanoidRig.js';
import { rigMetadata, rigSignature } from '../../src/rig/RigSignature.js';
import { rigCompatibility } from '../../src/validator/RigValidator.js';
import { compileModel } from '../../src/compiler/ModelCompiler.js';
import { compileAnimation } from '../../src/compiler/AnimationCompiler.js';
import { bindClip } from '../../src/rig/RigBinding.js';
import { humanoid, context, animation } from '../fixtures/helpers.js';
test('canonical hierarchy contains 22 identity-axis bones and stable signature', () => {
  const rig = createHumanoidRig(); assert.equal(rig.bones.size, 22);
  for (const name of BONE_NAMES) { const b = rig.bones.get(name)!; assert.equal(b.parent?.name ?? '', BONE_PARENTS[name] ?? ''); assert.equal(b.quaternion.w, 1); }
  assert.equal(rigSignature(), rigSignature(Object.fromEntries(Object.entries(BONE_PARENTS).reverse())));
  assert.notEqual(rigSignature(), rigSignature({ ...BONE_PARENTS, Head: 'Root' }));
});
test('proportions preserve ground pivot, specified height and signature', () => {
  for (const body of [{ height: 1.8 }, { height: 2.2, legLengthScale: 1.2, headScale: 1.4, footScale: 1.2 }]) {
    const model = compileModel({ ...humanoid(), body }, context()); const bounds = new Box3().setFromObject(model);
    assert.ok(Math.abs(bounds.min.y) < 1e-6); assert.ok(Math.abs(bounds.max.y - body.height) < 1e-6);
    assert.equal(model.userData.rigSignature, rigSignature()); assert.equal(model.getObjectByName('Root')!.position.length(), 0);
  }
});
test('compatibility reports every mismatch and blocks clip binding', () => {
  const meta = rigMetadata(); assert.deepEqual(rigCompatibility(meta, meta), []); assert.equal(rigCompatibility({}, meta).length, 3);
  const model = compileModel(humanoid(), context()), a = compileAnimation(animation(), context());
  assert.throws(() => bindClip(a.clip, a.root, model, { ...meta, rigSignature: 'wrong' }, meta), /Rig mismatch/);
});
test('bone animation moves limbs, stays in place and preserves target body dimensions', () => {
  const model = compileModel({ ...humanoid(), body: { height: 2.2, legLengthScale: 1.3 } }, context());
  const a = compileAnimation(animation(), context()); const rest = model.getObjectByName('Hips')!.position.clone();
  const clip = bindClip(a.clip, a.root, model, model.userData, a.root.userData); const mixer = new AnimationMixer(model); mixer.clipAction(clip).play();
  mixer.setTime(.25); assert.ok(model.getObjectByName('UpperLeg_L')!.quaternion.angleTo(model.getObjectByName('UpperLeg_R')!.quaternion) > .5);
  assert.ok(model.getObjectByName('Hips')!.position.distanceTo(rest) <= .051);
  mixer.setTime(10); assert.equal(model.getObjectByName('Root')!.position.distanceTo(new Vector3()), 0); assert.ok(model.getObjectByName('Hips')!.position.distanceTo(rest) < 1e-6);
});
