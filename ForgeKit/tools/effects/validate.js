import Ajv from 'ajv';
import { effectSchema } from './schema.js';
const check = new Ajv({ allErrors: true, strict: false, strictNumbers: true }).compile(effectSchema);
export function validateEffect(data, file = '<memory>', library) {
  const errors = [];
  const fail = (path, description) => errors.push({ code: 'VFX_INVALID', file, path, description, hint: '参见 rules/EFFECTS.md 与 schemas/effect.schema.json。' });
  if (!check(data)) { for (const e of check.errors) fail(e.instancePath || '$', `${e.message} ${JSON.stringify(e.params)}`); return errors; }
  const finite = (value, path) => {
    if (typeof value === 'number' && !Number.isFinite(value)) fail(path, 'Finite numbers required');
    else if (value && typeof value === 'object') for (const [k,v] of Object.entries(value)) finite(v, `${path}.${k}`);
  }; finite(data, '$');
  if (!Object.hasOwn(data.states, data.initialState)) fail('initialState', 'Unknown state');
  for (const [name, state] of Object.entries(data.states)) {
    if (state.next && (!Object.hasOwn(data.states, state.next) || state.next === name || state.loop)) fail(`states.${name}.next`, 'Next must name another state on a non-looping timeline');
    const visited = new Set([name]); let next = state.next;
    while (next && data.states[next]) { if (visited.has(next)) { fail(`states.${name}.next`, 'Transition cycle'); break; } visited.add(next); next = data.states[next].next; }
  }
  const names = new Set(); let particles = 0;
  for (const layer of data.layers) {
    if (names.has(layer.id)) fail(`layers.${layer.id}`, 'Duplicate layer ID'); names.add(layer.id);
    if (layer.variant && !Object.hasOwn(data.variants, layer.variant)) fail(`layers.${layer.id}.variant`, 'Unknown variant');
    for (const [state, profile] of Object.entries(layer.profiles)) {
      if (!Object.hasOwn(data.states, state)) fail(`layers.${layer.id}.profiles.${state}`, 'Unknown state');
      for (const [key, value] of Object.entries(profile)) if (value?.keys) {
        let last = -1;
        for (const [time] of value.keys) { if (time < 0 || time > 1 || time <= last) fail(`layers.${layer.id}.${key}`, 'Curve times must strictly increase in 0..1'); last = time; }
        if (value.keys[0][0] !== 0 || value.keys.at(-1)[0] !== 1) fail(`layers.${layer.id}.${key}`, 'Curve must cover 0..1');
      }
      if (profile.emissive === '$variant' && !Object.keys(data.variants).length) fail(`layers.${layer.id}`, 'Variant color required');
    }
    if (layer.kind === 'burst') {
      if (!Object.hasOwn(data.textures, layer.texture)) fail(`layers.${layer.id}.texture`, 'Missing texture');
      for (const key of ['lifeRange','speed','size','stretch','normalWeight']) if (layer[key][0] > layer[key][1]) fail(`layers.${layer.id}.${key}`, 'Range must be ascending');
      if (layer.lifeRange[0] <= 0 || layer.fadeStart >= 1) fail(`layers.${layer.id}`, 'Lifetime must be positive; fadeStart must be < 1');
      particles += layer.count * layer.capacity;
    } else if (layer.kind === 'orbit') {
      particles += layer.count;
      for (const [state, p] of Object.entries(layer.profiles)) if (p.radius === undefined) fail(`layers.${layer.id}.profiles.${state}`, 'Orbit requires radius');
    } else if (layer.kind === 'cloud' || layer.kind === 'beam' || layer.kind === 'suction') {
      particles += layer.count;
      if (!Object.hasOwn(data.textures,layer.texture)) fail(`layers.${layer.id}.texture`, 'Missing texture');
      if (layer.size[0]>layer.size[1]) fail(`layers.${layer.id}.size`, 'Range must be ascending');
    } else if (layer.kind === 'sector') {
      particles += layer.capacity;
      if(layer.height[0]>layer.height[1])fail(`layers.${layer.id}.height`,'Range must be ascending');
    } else if (!['surface','arc','warning'].includes(layer.kind) && !data.binding) fail(`layers.${layer.id}`, 'Material tracks require model binding');
  }
  if (particles > 8192) fail('layers', 'Combined particle capacity exceeds 8192');
  if(data.binding?.animationStates && !data.binding.animation) fail('binding.animationStates','Animation states require an animation');
  if (data.binding && library) {
    const model = library.entries?.find(e => e.data.id === data.binding.model)?.data;
    const animation = library.entries?.find(e => e.data.id === data.binding.animation)?.data;
    if (!model || model.type !== 'static') fail('binding.model', 'Binding requires a static model in the same library');
    if (data.binding.animation && (!animation || animation.targetModel !== data.binding.model || animation.rig !== 'nodes.v1')) fail('binding.animation', 'Animation must target the bound model');
    const nodes = [...(model?.parts ?? []), ...(model?.sockets ?? [])].map(n => n.id);
    if (data.binding.attachment !== 'Asset' && !nodes.includes(data.binding.attachment)) fail('binding.attachment', 'Unknown attachment node');
    for (const layer of data.layers.filter(l => l.kind === 'material')) for (const prefix of layer.prefixes)
      if (!nodes.some(n => n.startsWith(prefix))) fail(`layers.${layer.id}.prefixes`, `No model node matches ${prefix}`);
  }
  if (data.binding) for (const state of Object.keys(data.binding.animationStates ?? {})) if (!Object.hasOwn(data.states,state)) fail('binding.animationStates', 'Unknown state');
  return errors;
}
export function parseEffectPackage(input) {
  const value = typeof input === 'string' ? JSON.parse(input) : input;
  if (!value || value.schema !== 'forge-vfx.v1' || Object.keys(value).some(k => !['schema','effect'].includes(k))) throw Error('Unsupported VFX package');
  const errors = validateEffect(value.effect);
  if (errors.length) throw Error(errors.map(e => `${e.path}: ${e.description}`).join('\n'));
  if (Object.values(value.effect.textures).some(t => !t.data || t.source)) throw Error('VFX packages must embed PNG textures');
  return value.effect;
}
