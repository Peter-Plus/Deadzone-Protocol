import test from 'node:test';
import assert from 'node:assert/strict';
import { FixedClock, TickScheduler } from '../.test-build/core/time.js';
import { SeededRandom } from '../.test-build/core/random.js';
import { EventBus } from '../.test-build/core/events.js';
import { EntityIds } from '../.test-build/core/entity.js';

test('30/60/144 Hz frame partition produces 600 simulation ticks in ten seconds', () => {
  for (const hz of [30, 60, 144]) {
    const clock = new FixedClock(1 / 60, 8);
    let simulated = 0;
    for (let i = 0; i < hz * 10; i++) clock.advance(1 / hz, dt => { simulated += dt; });
    assert.equal(clock.ticks, 600);
    assert.ok(Math.abs(simulated - 10) < 1e-9);
    assert.equal(clock.droppedSeconds, 0);
  }
});
test('long frames have a bounded catch-up budget and expose discarded time', () => {
  const clock = new FixedClock(1 / 60, 8);
  const alpha = clock.advance(4, () => {});
  assert.equal(clock.ticks, 8); assert.ok(alpha >= 0 && alpha < 1);
  assert.ok(Math.abs(clock.droppedSeconds - (4 - 8 / 60)) < 1e-9);
  clock.advance(0, () => {}); assert.equal(clock.ticks, 8);
  clock.reset(); assert.equal(clock.elapsedSeconds, 0); assert.equal(clock.droppedSeconds, 0);
});
test('clock and scheduler reject invalid time and construction options', () => {
  for (const value of [-1, NaN, Infinity]) {
    assert.throws(() => new FixedClock(value, 8));
    assert.throws(() => new FixedClock(1 / 60, 8).advance(value, () => {}));
    assert.throws(() => new TickScheduler().update(value));
  }
  assert.throws(() => new FixedClock(1 / 60, 0));
  assert.throws(() => new TickScheduler().register(0, () => {}));
});
test('low frequency ticks receive accumulated simulation time and can unsubscribe', () => {
  const scheduler = new TickScheduler();
  const received = [];
  const remove = scheduler.register(2, dt => received.push(dt));
  for (let i = 0; i < 120; i++) scheduler.update(1 / 60);
  assert.equal(received.length, 4);
  assert.ok(received.every(dt => Math.abs(dt - 0.5) < 1e-9));
  remove(); scheduler.update(1); assert.equal(received.length, 4);
});
test('scheduler removal during iteration prevents stale callbacks', () => {
  const scheduler = new TickScheduler(); let calls = 0;
  scheduler.register(1, () => scheduler.clear());
  scheduler.register(1, () => calls++);
  scheduler.update(1); assert.equal(calls, 0);
});
test('seed streams reproduce and remain isolated from other consumers', () => {
  const sample = random => Array.from({ length: 50 }, () => random.next());
  const root = new SeededRandom('world');
  const expected = sample(root.fork('spawn'));
  sample(root); sample(root.fork('loot'));
  assert.deepEqual(sample(root.fork('spawn')), expected);
  assert.notDeepEqual(sample(new SeededRandom('different').fork('spawn')), expected);
  assert.ok(expected.every(n => n >= 0 && n < 1));
});
test('events broadcast in registration order, remove immediately, and defer new listeners', () => {
  const events = new EventBus(); const calls = [];
  let offSecond;
  events.on('phase', value => {
    calls.push(`first:${value}`); offSecond();
    events.on('phase', () => calls.push('late'));
  });
  offSecond = events.on('phase', () => calls.push('second'));
  events.emit('phase', 1); assert.deepEqual(calls, ['first:1']);
  events.emit('phase', 2); assert.deepEqual(calls, ['first:1', 'first:2', 'late']);
  events.clear(); events.emit('phase', 3); assert.equal(calls.length, 3);
});
test('clearing events during a broadcast cancels remaining delivery', () => {
  const events = new EventBus(); let count = 0;
  events.on('event', () => events.clear()); events.on('event', () => count++);
  events.emit('event', undefined); assert.equal(count, 0);
});
test('IDs are unique and owned by a session allocator', () => {
  const ids = new EntityIds();
  assert.deepEqual([ids.create(), ids.create(), ids.create()], [1, 2, 3]);
  assert.equal(new EntityIds().create(), 1);
});
