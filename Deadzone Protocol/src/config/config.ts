export interface FoundationConfig {
  readonly schemaVersion: 1;
  readonly worldSeed: string;
  readonly simulation: Readonly<{ fixedHz: number; maxCatchUpSteps: number; telemetryHz: number }>;
  readonly scene: Readonly<{ size: number; markerCount: number; probeSpeed: number }>;
}

function record(value: unknown, path: string, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: 必须为对象`);
  for (const key of Object.keys(value)) if (!keys.includes(key)) throw new Error(`${path}.${key}: 未知字段`);
  return value as Record<string, unknown>;
}
function number(value: unknown, path: string, min: number, max: number, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new Error(`${path}: 必须为 ${min} 至 ${max} 的${integer ? '整数' : '数值'}`);
  }
  return value;
}

export function parseConfig(value: unknown): FoundationConfig {
  const root = record(value, 'config', ['schemaVersion', 'worldSeed', 'simulation', 'scene']);
  if (root.schemaVersion !== 1) throw new Error('schemaVersion: 仅支持版本 1');
  if (typeof root.worldSeed !== 'string' || !root.worldSeed.trim() || root.worldSeed.length > 128) throw new Error('worldSeed: 必须为 1 至 128 字符的非空字符串');
  const sim = record(root.simulation, 'simulation', ['fixedHz', 'maxCatchUpSteps', 'telemetryHz']);
  const scene = record(root.scene, 'scene', ['size', 'markerCount', 'probeSpeed']);
  const fixedHz = number(sim.fixedHz, 'simulation.fixedHz', 10, 240, true);
  return Object.freeze({
    schemaVersion: 1, worldSeed: root.worldSeed,
    simulation: Object.freeze({ fixedHz,
      maxCatchUpSteps: number(sim.maxCatchUpSteps, 'simulation.maxCatchUpSteps', 1, 32, true),
      telemetryHz: number(sim.telemetryHz, 'simulation.telemetryHz', 0.1, fixedHz),
    }),
    scene: Object.freeze({ size: number(scene.size, 'scene.size', 8, 200),
      markerCount: number(scene.markerCount, 'scene.markerCount', 0, 300, true),
      probeSpeed: number(scene.probeSpeed, 'scene.probeSpeed', 0, 4),
    }),
  });
}
