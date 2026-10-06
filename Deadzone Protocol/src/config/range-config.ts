export interface WeaponConfig {
  readonly magazineSize: number; readonly reserveAmmo: number; readonly shotsPerSecond: number;
  readonly damage: number; readonly range: number; readonly reloadCommit: number;
  readonly reloadDuration: number; readonly fireDuration: number;
}
export interface RangeConfig {
  readonly schemaVersion: 1; readonly fixedHz: number; readonly maxCatchUpSteps: number;
  readonly player: Readonly<{ height: number; radius: number; eyeHeight: number; speed: number; jumpSpeed: number; gravity: number; sensitivity: number }>;
  readonly weapon: WeaponConfig;
  readonly targets: readonly Readonly<{ x: number; z: number; health: number }>[];
}
function object(value: unknown, path: string, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: 必须为对象`);
  for (const key of Object.keys(value)) if (!keys.includes(key)) throw new Error(`${path}.${key}: 未知字段`);
  return value as Record<string, unknown>;
}
function num(value: unknown, path: string, min: number, max: number, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new Error(`${path}: 必须为 ${min}–${max} 的${integer ? '整数' : '数值'}`);
  return value;
}
export function parseRangeConfig(value: unknown): RangeConfig {
  const root = object(value, 'range', ['schemaVersion', 'fixedHz', 'maxCatchUpSteps', 'player', 'weapon', 'targets']);
  if (root.schemaVersion !== 1) throw new Error('range.schemaVersion: 仅支持 1');
  const p = object(root.player, 'player', ['height', 'radius', 'eyeHeight', 'speed', 'jumpSpeed', 'gravity', 'sensitivity']);
  const height = num(p.height, 'player.height', 1, 3);
  const radius = num(p.radius, 'player.radius', 0.1, height / 2 - 0.01);
  const w = object(root.weapon, 'weapon', ['magazineSize', 'reserveAmmo', 'shotsPerSecond', 'damage', 'range', 'reloadCommit', 'reloadDuration', 'fireDuration']);
  const reloadDuration = num(w.reloadDuration, 'weapon.reloadDuration', 0.1, 10);
  if (!Array.isArray(root.targets) || root.targets.length < 1 || root.targets.length > 20) throw new Error('targets: 必须为 1–20 个靶子');
  return Object.freeze({ schemaVersion: 1,
    fixedHz: num(root.fixedHz, 'fixedHz', 30, 120, true), maxCatchUpSteps: num(root.maxCatchUpSteps, 'maxCatchUpSteps', 1, 16, true),
    player: Object.freeze({ height, radius, eyeHeight: num(p.eyeHeight, 'player.eyeHeight', radius, height),
      speed: num(p.speed, 'player.speed', 1, 12), jumpSpeed: num(p.jumpSpeed, 'player.jumpSpeed', 1, 12),
      gravity: num(p.gravity, 'player.gravity', 1, 40), sensitivity: num(p.sensitivity, 'player.sensitivity', 0.0001, 0.02) }),
    weapon: Object.freeze({ magazineSize: num(w.magazineSize, 'weapon.magazineSize', 1, 100, true),
      reserveAmmo: num(w.reserveAmmo, 'weapon.reserveAmmo', 0, 999, true), shotsPerSecond: num(w.shotsPerSecond, 'weapon.shotsPerSecond', 0.5, 20),
      damage: num(w.damage, 'weapon.damage', 1, 1000), range: num(w.range, 'weapon.range', 1, 200),
      reloadCommit: num(w.reloadCommit, 'weapon.reloadCommit', 0.001, reloadDuration), reloadDuration,
      fireDuration: num(w.fireDuration, 'weapon.fireDuration', 0.01, 2) }),
    targets: Object.freeze(root.targets.map((value, i) => {
      const t = object(value, `targets[${i}]`, ['x', 'z', 'health']);
      return Object.freeze({ x: num(t.x, `targets[${i}].x`, -11, 11), z: num(t.z, `targets[${i}].z`, 12, 32), health: num(t.health, `targets[${i}].health`, 1, 1000) });
    })),
  });
}
