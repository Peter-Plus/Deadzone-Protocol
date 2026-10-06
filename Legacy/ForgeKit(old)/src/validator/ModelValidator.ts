import type { Context, ModelDefinition } from '../shared/types/index.js';
import { BONE_NAMES } from '../rig/HumanoidRig.js';
import { ValidationReporter } from './ValidationReporter.js';
import { DEFAULT_MAX_SIZE_METERS } from '../shared/constants/limits.js';
export function validateModel(d: ModelDefinition, ctx: Context, r: ValidationReporter, maxSize = DEFAULT_MAX_SIZE_METERS) {
  const reserved = new Set(d.type === 'humanoid' ? BONE_NAMES : []), ids = new Set(reserved);
  const parts = d.parts ?? [], sockets = d.sockets ?? [];
  for (const [index, p] of [...parts, ...sockets].entries()) {
    if (ids.has(p.id) || p.id === 'ModelRoot' || d.type === 'humanoid' && p.id.startsWith('body_')) r.error('MODEL_DUPLICATE_ID', `nodes[${index}].id`, `Duplicate/reserved node name "${p.id}".`, 'Use a unique part or socket name, distinct from canonical bones and the reserved body_ prefix.');
    ids.add(p.id);
  }
  const parents = new Map<string, string | undefined>();
  for (const p of parts) if (!parents.has(p.id)) parents.set(p.id, p.parent);
  for (const [i, p] of parts.entries()) {
    if (p.parent && !parents.has(p.parent) && !reserved.has(p.parent)) r.error('MODEL_UNKNOWN_PARENT', `parts[${i}].parent`, `Unknown part or bone "${p.parent}".`);
    const seen = new Set<string>(); let node: string | undefined = p.id;
    while (node && parents.has(node)) { if (seen.has(node)) { r.error('MODEL_CYCLE', `parts[${i}].parent`, `Cycle through "${node}".`, 'Remove a parent link to make the hierarchy a tree.'); break; } seen.add(node); node = parents.get(node); }
    if (p.material && !ctx.materials.has(p.material)) r.error('MODEL_MATERIAL', `parts[${i}].material`, `Unknown material "${p.material}".`, 'Create a matching material.v1 definition.');
    if ([...(p.size ?? []), p.radius ?? 0, p.length ?? 0].some(n => Math.abs(n) > maxSize)) r.warning('MODEL_LARGE_DIMENSION', `parts[${i}]`, `Dimension exceeds ${maxSize} meters.`);
  }
  for (const [i, s] of sockets.entries()) if (s.parent && !parents.has(s.parent) && !reserved.has(s.parent)) r.error('MODEL_SOCKET_PARENT', `sockets[${i}].parent`, `Unknown part or bone "${s.parent}".`);
  if (d.material && !ctx.materials.has(d.material)) r.error('MODEL_MATERIAL', 'material', `Unknown material "${d.material}".`);
  if (d.type === 'humanoid' && d.root?.position?.[1]) r.warning('MODEL_GROUND_PIVOT', 'root.position[1]', 'Humanoid root is not at ground level.');
}
