import { createHash } from 'node:crypto';
import { BONE_PARENTS, CANONICAL_AXIS } from './HumanoidRig.js';
export function rigSignature(parents = BONE_PARENTS, axis = CANONICAL_AXIS): string {
  return createHash('sha256').update(JSON.stringify({ axis, bones: Object.keys(parents).sort().map(name => [name, parents[name]]) })).digest('hex');
}
export function rigMetadata() { return { rigId: 'humanoid', rigVersion: '1', rigSignature: rigSignature() }; }
