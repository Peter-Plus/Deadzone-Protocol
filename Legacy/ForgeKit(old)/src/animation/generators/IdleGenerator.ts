import type { AnimationDefinition } from '../../shared/types/index.js';
import { generateBreathing } from './BreathingGenerator.js';
export const generateIdle = (d: AnimationDefinition) => generateBreathing(d, true);
