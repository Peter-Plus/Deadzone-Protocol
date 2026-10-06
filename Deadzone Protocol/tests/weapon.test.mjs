import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseRangeConfig } from '../.test-build/config/range-config.js';
import { Weapon } from '../.test-build/combat/weapon.js';
const raw = JSON.parse(await readFile(new URL('../src/config/range.json', import.meta.url)));
const config = parseRangeConfig(raw).weapon;

test('automatic weapon uses configured cadence without rounding 8 Hz down to 7.5 Hz', () => {
  for (const hz of [30, 60, 120]) {
    const weapon = new Weapon(config);
    for (let i = 0; i < hz * 2; i++) weapon.update(1 / hz, true);
    assert.equal(weapon.snapshot().shots, 16);
    assert.equal(weapon.snapshot().magazine, config.magazineSize - 16);
  }
});
test('empty magazine stops firing without negative ammunition', () => {
  const weapon = new Weapon(config);
  for (let i = 0; i < 600; i++) weapon.update(1 / 60, true);
  assert.equal(weapon.snapshot().magazine, 0); assert.equal(weapon.snapshot().shots, config.magazineSize);
});
test('reload crossing commit point transfers once; firing stays blocked until end', () => {
  const weapon = new Weapon(config); weapon.update(1 / 60, true);
  assert.equal(weapon.requestReload(), true); assert.equal(weapon.requestReload(), false);
  assert.equal(weapon.update(1.17, true), false); assert.equal(weapon.snapshot().magazine, 29);
  weapon.update(0.02, true); assert.equal(weapon.snapshot().magazine, 30); assert.equal(weapon.snapshot().reserve, 179);
  weapon.update(0.1, true); assert.equal(weapon.snapshot().reserve, 179);
  assert.equal(weapon.update(0.2, true), false); assert.equal(weapon.snapshot().state, 'ready');
  assert.equal(weapon.update(1 / 60, true), true);
});
test('cancelling reload preserves committed results but does not submit future ones', () => {
  const weapon = new Weapon(config); weapon.update(1 / 60, true);
  weapon.requestReload(); weapon.update(0.5, false); weapon.cancelAction();
  assert.equal(weapon.snapshot().magazine, 29); assert.equal(weapon.snapshot().reserve, 180);
  weapon.requestReload(); weapon.update(1.2, false); weapon.cancelAction();
  assert.equal(weapon.snapshot().magazine, 30); assert.equal(weapon.snapshot().reserve, 179);
});
test('reload conserves total rounds when reserve is insufficient', () => {
  const weapon = new Weapon({ ...config, magazineSize: 3, reserveAmmo: 1 });
  for (let i = 0; i < 60; i++) weapon.update(1 / 60, true);
  weapon.requestReload(); weapon.update(2, false);
  assert.equal(weapon.snapshot().magazine, 1); assert.equal(weapon.snapshot().reserve, 0);
  assert.equal(weapon.requestReload(), false);
});
test('range configuration validates geometry, reload ordering, and typos', () => {
  assert.throws(() => parseRangeConfig({ ...raw, player: { ...raw.player, radius: 1 } }), /player.radius/);
  assert.throws(() => parseRangeConfig({ ...raw, weapon: { ...raw.weapon, reloadCommit: 10 } }), /weapon.reloadCommit/);
  assert.throws(() => parseRangeConfig({ ...raw, weapon: { ...raw.weapon, magzine: 30 } }), /magzine/);
  assert.throws(() => parseRangeConfig({ ...raw, targets: [] }), /targets/);
});
