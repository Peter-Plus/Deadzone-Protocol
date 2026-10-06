import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseRangeConfig } from '../.test-build/config/range-config.js';
import { initializePhysics, RapierRangeWorld } from '../.test-build/physics/rapier-world.js';
import { createRangeLevel } from '../.test-build/range/level.js';
import { RangeSession, NO_INPUT } from '../.test-build/range/session.js';
const config = parseRangeConfig(JSON.parse(await readFile(new URL('../src/config/range.json', import.meta.url))));
await initializePhysics();
function session() { const level = createRangeLevel(config); return new RangeSession(config, level, new RapierRangeWorld(level, config)); }
function step(s, n, input = NO_INPUT) { for (let i = 0; i < n; i++) s.advance(1 / 60, () => input); }

test('Rapier grounds the capsule, blocks boundary walls and permits sliding', () => {
  const s = session();
  try {
    s.setPaused(false); step(s, 120);
    assert.equal(s.snapshot().grounded, true); assert.ok(Math.abs(s.snapshot().feet.y) < 0.04);
    step(s, 500, { ...NO_INPUT, right: -1 });
    assert.ok(s.snapshot().feet.x < 13.5 && s.snapshot().feet.x > 13);
    const z = s.snapshot().feet.z; step(s, 30, { ...NO_INPUT, forward: 1, right: -1 });
    assert.ok(s.snapshot().feet.z > z + 1); assert.ok(s.snapshot().feet.x < 13.5);
  } finally { s.dispose(); }
});
test('jump leaves ground, cannot repeat in air, then lands', () => {
  const s = session();
  try {
    s.setPaused(false); step(s, 10); step(s, 1, { ...NO_INPUT, jump: true });
    let peak = 0;
    for (let i = 0; i < 120; i++) { step(s, 1, { ...NO_INPUT, jump: i < 25 }); peak = Math.max(peak, s.snapshot().feet.y); }
    assert.ok(peak > 0.8 && peak < 1.2); assert.ok(s.snapshot().grounded); assert.ok(s.snapshot().feet.y < 0.04);
  } finally { s.dispose(); }
});
test('front target takes three hits, is removed from physics, and does not score twice', () => {
  const s = session();
  try {
    s.setPaused(false); step(s, 120, { ...NO_INPUT, fire: true });
    assert.equal(s.snapshot().hits, 3); assert.equal(s.snapshot().destroyed, 1);
    assert.equal(s.snapshot().weapon.shots, 16); assert.equal(s.snapshot().targets[0].health, 0);
  } finally { s.dispose(); }
});
test('raycast returns the closest obstacle, preventing shots through cover', () => {
  const level = createRangeLevel(config);
  const world = new RapierRangeWorld({ ...level, boxes: [...level.boxes,
    { id: 999, kind: 'cover', position: { x: 0, y: 1.65, z: 5 }, halfSize: { x: 2, y: 2, z: 0.2 } }] }, config);
  try {
    const hit = world.raycast({ x: 0, y: 1.65, z: 0 }, { x: 0, y: 0, z: 1 }, 80);
    assert.equal(hit.id, 999); assert.ok(Math.abs(hit.distance - 4.8) < 0.001);
  } finally { world.dispose(); }
});
test('paused range freezes physics, weapon actions and results; resume continues reload', () => {
  const s = session();
  try {
    s.setPaused(false); step(s, 1, { ...NO_INPUT, fire: true }); step(s, 1, { ...NO_INPUT, reload: true }); step(s, 30);
    s.setPaused(true); const paused = s.snapshot();
    step(s, 180, { ...NO_INPUT, forward: 1, fire: true }); s.look(300, 300);
    assert.deepEqual(s.snapshot(), paused);
    s.setPaused(false); step(s, 60); assert.equal(s.snapshot().weapon.magazine, 30); assert.equal(s.snapshot().weapon.reserve, 179);
  } finally { s.dispose(); }
});
test('render frame partitions preserve physics, movement and firing results', () => {
  const results = [30, 60, 144].map(hz => {
    const s = session();
    try {
      s.setPaused(false);
      for (let i = 0; i < hz * 2; i++) s.advance(1 / hz, () => ({ ...NO_INPUT, forward: 1, fire: true }));
      return s.snapshot();
    } finally { s.dispose(); }
  });
  assert.deepEqual(results[0], results[1]); assert.deepEqual(results[1], results[2]);
});
test('new session restores target bodies and ammo; disposal is idempotent', () => {
  const s = session(); s.setPaused(false); step(s, 120, { ...NO_INPUT, fire: true }); s.dispose(); s.dispose();
  assert.equal(s.snapshot().state, 'disposed');
  const next = session();
  try { assert.equal(next.snapshot().destroyed, 0); assert.equal(next.snapshot().weapon.magazine, 30); assert.equal(next.snapshot().elapsed, 0); }
  finally { next.dispose(); }
});

test('diagonal movement is normalized and look direction clamps without flipping', () => {
  const straight = session(), diagonal = session();
  try {
    straight.setPaused(false); diagonal.setPaused(false);
    step(straight, 60, { ...NO_INPUT, forward: 1 }); step(diagonal, 60, { ...NO_INPUT, forward: 1, right: 1 });
    const a = straight.snapshot().feet, b = diagonal.snapshot().feet;
    assert.ok(Math.abs(Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z)) < 0.001);
    diagonal.look(100, 100000); assert.equal(diagonal.snapshot().pitch, 1.45); assert.ok(diagonal.snapshot().yaw < 0);
  } finally { straight.dispose(); diagonal.dispose(); }
});

test('capsule stops at an overhead obstacle and detects a ceiling', () => {
  const level = createRangeLevel(config);
  const world = new RapierRangeWorld({ ...level, boxes: [...level.boxes,
    { id: 999, kind: 'cover', position: { x: 0, y: 2.4, z: 0 }, halfSize: { x: 2, y: 0.1, z: 2 } }] }, config);
  try {
    const moved = world.move({ x: 0, y: 1, z: 0 }, 1 / 60);
    assert.equal(moved.ceiling, true); assert.ok(moved.feet.y < 0.51 && moved.feet.y > 0.4);
  } finally { world.dispose(); }
});

test('ground support does not stall horizontal movement in eight directions', () => {
  for (let direction = 0; direction < 8; direction++) {
    const s = session();
    try {
      s.setPaused(false); s.look(direction * Math.PI / 4 / config.player.sensitivity, 0);
      step(s, 60, { ...NO_INPUT, forward: 1 });
      const p = s.snapshot().feet;
      assert.ok(Math.abs(Math.hypot(p.x, p.z) - config.player.speed) < 0.01, `direction ${direction}`);
      assert.ok(s.snapshot().grounded);
    } finally { s.dispose(); }
  }
});
