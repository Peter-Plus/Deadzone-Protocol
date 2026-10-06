import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseConfig } from '../.test-build/config/config.js';
import { SandboxSession } from '../.test-build/sandbox/session.js';

const raw = JSON.parse(await readFile(new URL('../src/config/foundation.json', import.meta.url), 'utf8'));
test('configuration errors identify fields, including typos and unsupported schema', () => {
  for (const [change, path] of [
    [{ schemaVersion: 2 }, 'schemaVersion'], [{ worldSeed: ' ' }, 'worldSeed'],
    [{ typo: 1 }, 'typo'], [{ scene: { ...raw.scene, markerCount: -1 } }, 'scene.markerCount'],
    [{ simulation: { ...raw.simulation, telemetryHz: 1000 } }, 'simulation.telemetryHz'],
    [{ simulation: { ...raw.simulation, fixedHz: NaN } }, 'simulation.fixedHz'],
  ]) assert.throws(() => parseConfig({ ...raw, ...change }), error => error.message.includes(path));
  const config = parseConfig(raw); assert.ok(Object.isFrozen(config.scene));
});
test('same seed reconstructs identical scene; replacement resets time and IDs', () => {
  const config = parseConfig(raw); const first = new SandboxSession(config);
  first.advance(0.1);
  const second = new SandboxSession(config);
  assert.deepEqual(first.scene, second.scene); assert.equal(second.snapshot().ticks, 0);
  assert.notDeepEqual(second.scene, new SandboxSession(parseConfig({ ...raw, worldSeed: 'other' })).scene);
});
test('pause and disposal stop all simulation; disposal is idempotent', () => {
  const session = new SandboxSession(parseConfig(raw)); const states = [];
  session.events.on('stateChanged', state => states.push(state));
  session.advance(0.1); const before = session.snapshot();
  session.setPaused(true); session.advance(100);
  assert.equal(session.snapshot().ticks, before.ticks);
  assert.equal(session.snapshot().droppedSeconds, 0);
  session.setPaused(false); session.advance(0.1);
  assert.ok(session.snapshot().ticks > before.ticks);
  session.dispose(); const final = session.snapshot();
  session.advance(100); session.setPaused(false); session.dispose();
  assert.deepEqual(session.snapshot(), final);
  assert.deepEqual(states, ['paused', 'running', 'disposed']);
});
test('snapshots cannot mutate the session or generated scene', () => {
  const session = new SandboxSession(parseConfig(raw));
  assert.throws(() => { session.snapshot().probe.x = 99; }, TypeError);
  assert.throws(() => { session.scene.markers[0].x = 99; }, TypeError);
});
test('complete sandbox result agrees at different render frame rates', () => {
  const results = [30, 60, 144].map(hz => {
    const session = new SandboxSession(parseConfig(raw));
    for (let i = 0; i < hz * 5; i++) session.advance(1 / hz);
    return session.snapshot();
  });
  assert.deepEqual(results[0], results[1]); assert.deepEqual(results[1], results[2]);
  assert.equal(results[0].telemetryTicks, 10);
});
