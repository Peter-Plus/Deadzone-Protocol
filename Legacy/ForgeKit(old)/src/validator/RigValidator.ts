import type { RigMetadata } from '../shared/types/index.js';
export function rigCompatibility(model: RigMetadata, animation: RigMetadata): string[] {
  return (['rigId', 'rigVersion', 'rigSignature'] as const).flatMap(key => !model[key] || !animation[key] || model[key] !== animation[key] ? [`${key}: model=${model[key] ?? '(missing)'}, animation=${animation[key] ?? '(missing)'}`] : []);
}
