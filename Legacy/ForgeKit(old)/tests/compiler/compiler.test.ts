import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Box3, Mesh } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { compileModel, primitive } from '../../src/compiler/ModelCompiler.js';
import { compileAnimation } from '../../src/compiler/AnimationCompiler.js';
import { writeGlb } from '../../src/compiler/GltfWriter.js';
import { AssetCompiler } from '../../src/compiler/AssetCompiler.js';
import { box, humanoid, animation, context, glbJson } from '../fixtures/helpers.js';
test('primitive dimensions, geometry axis and socket hierarchy are correct', () => {
  const geometry = primitive({ id: 'barrel', shape: 'cylinder', radius: .1, length: 2, axis: 'z' }); geometry.computeBoundingBox();
  assert.ok(Math.abs(geometry.boundingBox!.max.z - 1) < 1e-6);
  const d = box(); d.parts!.push({ id: 'child', parent: 'box', shape: 'sphere', radius: .2, position: [0, 1, 0] }); d.sockets = [{ id: 'socket', parent: 'child' }];
  const model = compileModel(d, context()); assert.equal(model.getObjectByName('child')!.parent!.name, 'box'); assert.equal(model.getObjectByName('socket')!.parent!.name, 'child'); assert.equal(model.getObjectByName('socket')!.userData.socket, true);
  assert.equal(new Box3().setFromObject(model).min.y, 0);
});
test('GLB exports deterministically and round-trips scene metadata', async () => {
  const a = await writeGlb(compileModel(humanoid(), context())), b = await writeGlb(compileModel(humanoid(), context()));
  assert.deepEqual(a, b); assert.equal(a.readUInt32LE(0), 0x46546c67); assert.equal(a.readUInt32LE(4), 2); assert.equal(a.readUInt32LE(8), a.length);
  const json = glbJson(a); assert.equal(json.nodes.find((n: { name: string }) => n.name === 'ModelRoot').extras.assetId, 'humanoid.test');
  const gltf = await new GLTFLoader().parseAsync(a.buffer.slice(a.byteOffset, a.byteOffset + a.byteLength) as ArrayBuffer, '');
  assert.ok(gltf.scene.getObjectByName('Head')); let meshes = 0; gltf.scene.traverse(o => { if (o instanceof Mesh) meshes++; }); assert.ok(meshes > 10);
});
test('all generators export one playable clip without mesh and deterministic endpoint poses', async () => {
  for (const generator of ['humanoid.idle', 'humanoid.breathing', 'humanoid.walk', 'humanoid.run'] as const) {
    const d = { ...animation(), generator }, a = compileAnimation(d, context()); const glb = await writeGlb(a.root, [a.clip]);
    const json = glbJson(glb); assert.equal(json.meshes, undefined); assert.equal(json.animations.length, 1);
    assert.equal(json.nodes[0].extras.loop, true); assert.equal(json.nodes[0].extras.rigId, 'humanoid');
    for (const track of a.clip.tracks) { const size = track.getValueSize(); assert.deepEqual(Array.from(track.values.slice(0, size)), Array.from(track.values.slice(-size))); }
    const other = compileAnimation(d, context()); assert.deepEqual(glb, await writeGlb(other.root, [other.clip]));
    const parsed = await new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength) as ArrayBuffer, ''); assert.equal(parsed.animations[0].duration, 1);
  }
});
test('pose references compile with omitted channels reset and requested duration retained', async () => {
  const ctx = context(); ctx.poses.set('pose.first', { schema: 'pose.v1', id: 'pose.first', rig: 'humanoid.v1', bones: { Head: { rotation: [0, 30, 0] } } });
  ctx.poses.set('pose.last', { schema: 'pose.v1', id: 'pose.last', rig: 'humanoid.v1', bones: { Chest: { rotation: [0, 0, 0] } } });
  const a = compileAnimation({ schema: 'animation.v1', id: 'animation.pose', rig: 'humanoid.v1', duration: 2, loop: false, mode: 'timeline', timeline: [{ time: .2, pose: 'pose.first' }, { time: 1, pose: 'pose.last' }] }, ctx);
  const track = a.clip.tracks.find(t => t.name === 'Head.quaternion')!; assert.deepEqual(Array.from(track.values.slice(-4)), [0, 0, 0, 1]); assert.equal(track.times.at(-1), 2);
  assert.ok((await writeGlb(a.root, [a.clip])).length > 100);
});
test('validation gate preserves last good output; rebuilds change only affected bytes', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'forgekit-test-')), definitions = path.join(root, 'definitions'), output = path.join(root, 'output');
  await mkdir(definitions); const source = path.join(definitions, 'simple_box.model.json'); await writeFile(source, JSON.stringify(box()));
  const compiler = new AssetCompiler({ definitions, output }); const first = await compiler.build(); assert.equal(first.ok, true); assert.equal(first.changed.length, 1);
  const file = path.join(output, 'models/simple_box.glb'), bytes = await readFile(file);
  assert.equal((await compiler.build()).changed.length, 0);
  await writeFile(source, JSON.stringify({ ...box(), parts: [{ id: 'bad', shape: 'sphere', radius: -1 }] })); assert.equal((await compiler.build()).ok, false); assert.deepEqual(await readFile(file), bytes);
  const modified = box(); modified.parts![0].size![0] = 2; await writeFile(source, JSON.stringify(modified)); assert.equal((await compiler.build(source)).changed.length, 1); assert.notDeepEqual(await readFile(file), bytes);
});
