import { test } from 'node:test';
import assert from 'node:assert/strict';
import { schemaValidator } from '../../src/shared/schema/SchemaValidator.js';
import { ValidationReporter } from '../../src/validator/ValidationReporter.js';
import { validateModel } from '../../src/validator/ModelValidator.js';
import { validateAnimation, validatePose } from '../../src/validator/AnimationValidator.js';
import { parseStrict } from '../../src/shared/utils/files.js';
import { box, animation, context } from '../fixtures/helpers.js';
const check = schemaValidator();
test('schema accepts valid model/animation and all primitive parameter forms', () => {
  for (const data of [box(), animation()]) assert.equal(check(data, new ValidationReporter('test')), true);
  for (const shape of ['box', 'sphere', 'cylinder', 'capsule', 'cone', 'plane']) { const d = box(); Object.assign(d.parts![0], { shape, radius: .2, length: 1 }); assert.equal(check(d, new ValidationReporter('test')), true); }
});
test('schema rejects unsupported shapes, dimensions, nonfinite numbers, fields and versions', () => {
  for (const change of [{ shape: 'mesh' }, { radius: -1 }, { size: [0, 1, 1] }, { size: [NaN, 1, 1] }, { size: [Infinity, 1, 1] }, { vertices: [1, 2, 3] }, { rotation: [0, 1] }, { scale: -1 }]) {
    const d = box(); Object.assign(d.parts![0], change); assert.equal(check(d, new ValidationReporter('test')), false, JSON.stringify(change));
  }
  assert.equal(check({ ...box(), schema: 'model.v9' }, new ValidationReporter('test')), false);
  assert.equal(check({ ...animation(), rig: 'unknown' }, new ValidationReporter('test')), false);
  assert.equal(check({ ...animation(), duration: 0 }, new ValidationReporter('test')), false);
});
test('hierarchy detects unknown parent, duplicate nodes, cycles, material and socket errors', () => {
  const d = box(); d.parts!.push({ id: 'child', shape: 'sphere', radius: 1, parent: 'box' }); d.parts![0].parent = 'child';
  d.parts!.push({ ...d.parts![0], parent: 'missing', material: 'missing.material' }); d.sockets = [{ id: 'socket', parent: 'missing' }];
  const r = new ValidationReporter('test'); validateModel(d, context(), r);
  for (const code of ['MODEL_CYCLE', 'MODEL_DUPLICATE_ID', 'MODEL_UNKNOWN_PARENT', 'MODEL_MATERIAL', 'MODEL_SOCKET_PARENT']) assert.ok(r.issues.some(i => i.code === code), code);
  assert.ok(r.issues.every(i => i.path && i.hint && i.file));
});
test('large dimension yields warning without blocking compilation', () => {
  const d = box(); d.parts![0].size = [1001, 1, 1]; const r = new ValidationReporter('test'); validateModel(d, context(), r); assert.equal(r.ok, true); assert.equal(r.issues[0].severity, 'WARNING');
});
test('animation rejects unknown bone, duplicate times, range, root motion and pose references', () => {
  const d = { ...animation(), mode: 'timeline' as const, tracks: { LeftUpperArm: [{ time: 0, rotation: [0, 0, 0] as [number, number, number] }], Root: [{ time: 0, position: [0, 0, 0] as [number, number, number] }, { time: 0, position: [0, 0, .2] as [number, number, number] }, { time: 2, position: [0, 0, .2] as [number, number, number] }] } };
  const r = new ValidationReporter('bad.anim.json'); validateAnimation(d, context(), r);
  for (const code of ['ANIM_UNKNOWN_BONE', 'ANIM_TIME_ORDER', 'ANIM_TIME_RANGE', 'ANIM_ROOT_MOTION']) assert.ok(r.issues.some(i => i.code === code));
  const p = new ValidationReporter('pose'); validateAnimation({ ...animation(), mode: 'timeline', timeline: [{ time: 0, pose: 'pose.missing' }] }, context(), p); assert.equal(p.ok, false);
});
test('loop seam warns and duplicate JSON bone tracks cannot be silently discarded', () => {
  const d = { ...animation(), mode: 'timeline' as const, tracks: { Head: [{ time: 0, rotation: [0, 0, 0] as [number, number, number] }, { time: 1, rotation: [0, 90, 0] as [number, number, number] }] } };
  const r = new ValidationReporter('test'); validateAnimation(d, context(), r); assert.equal(r.ok, true); assert.equal(r.issues[0].code, 'ANIM_LOOP_SEAM');
  assert.throws(() => parseStrict('{"tracks":{"Head":[],"Head":[]}}'), /Duplicate/);
  assert.throws(() => parseStrict('{"a":1,"\\u0061":2}'), /Duplicate/);
  assert.deepEqual(parseStrict('{"a":[{"a":1},{"a":2}]}'), { a: [{ a: 1 }, { a: 2 }] });
});
test('invalid pose bone/translation rejected', () => {
  const r = new ValidationReporter('pose'); validatePose({ schema: 'pose.v1', id: 'pose.test', rig: 'humanoid.v1', bones: { unknown: { rotation: [0, 0, 0] }, Head: { position: [0, 1, 0] } } }, r); assert.equal(r.ok, false);
});
