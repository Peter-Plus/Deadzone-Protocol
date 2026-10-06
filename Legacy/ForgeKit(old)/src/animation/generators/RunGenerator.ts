import type { AnimationDefinition } from '../../shared/types/index.js';
import { generateWalk } from './WalkGenerator.js';
export const generateRun = (d: AnimationDefinition) => generateWalk(d, true);
