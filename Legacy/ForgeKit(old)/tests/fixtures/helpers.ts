import type { AnimationDefinition, Context, ModelDefinition } from '../../src/shared/types/index.js';
export const context = (): Context => ({ materials: new Map(), poses: new Map() });
export const box = (): ModelDefinition => ({ schema: 'model.v1', id: 'example.box', type: 'static', parts: [{ id: 'box', shape: 'box', size: [1, 2, 3], position: [0, 1, 0] }] });
export const humanoid = (): ModelDefinition => ({ schema: 'model.v1', id: 'humanoid.test', type: 'humanoid', rig: 'humanoid.v1', body: { height: 1.8 } });
export const animation = (): AnimationDefinition => ({ schema: 'animation.v1', id: 'animation.test', rig: 'humanoid.v1', duration: 1, loop: true, mode: 'generator', generator: 'humanoid.walk' });
export function glbJson(buffer: Buffer) { const length = buffer.readUInt32LE(12); return JSON.parse(buffer.subarray(20, 20 + length).toString()); }
