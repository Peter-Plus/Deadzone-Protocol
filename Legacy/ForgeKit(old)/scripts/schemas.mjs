import fs from 'node:fs';
fs.mkdirSync('schemas', { recursive: true });
const number = { type: 'number' }, positive = { type: 'number', exclusiveMinimum: 0 };
const id = { type: 'string', pattern: '^[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+$' };
const name = { type: 'string', pattern: '^[A-Za-z][A-Za-z0-9_]*$' };
const vec = { type: 'array', items: number, minItems: 3, maxItems: 3 };
const transform = { position: vec, rotation: vec, scale: { anyOf: [positive, { ...vec, items: positive }] } };
const obj = (properties, required = [], extra = {}) => ({ type: 'object', properties, required, additionalProperties: false, ...extra });
const schema = (kind, properties, required, extra = {}) => ({ $schema: 'http://json-schema.org/draft-07/schema#', $id: kind + '.v1', ...obj({ schema: { const: kind + '.v1' }, id, ...properties }, ['schema', 'id', ...required], extra) });
const color = { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' }, unit = { type: 'number', minimum: 0, maximum: 1 };
const material = schema('material', { color, roughness: unit, metalness: unit, emissive: color, opacity: unit, transparent: { type: 'boolean' } }, ['color']);
const requireShape = (shapes, required) => ({ if: { properties: { shape: { enum: shapes } } }, then: { required } });
const part = obj({ id: name, parent: name, shape: { enum: ['box', 'sphere', 'cylinder', 'capsule', 'cone', 'plane'] }, ...transform, size: { ...vec, items: positive }, radius: positive, length: positive, axis: { enum: ['x', 'y', 'z'] }, material: id }, ['id', 'shape'], { allOf: [requireShape(['box', 'plane'], ['size']), requireShape(['sphere', 'cylinder', 'capsule', 'cone'], ['radius']), requireShape(['cylinder', 'capsule', 'cone'], ['length'])] });
const body = obj(Object.fromEntries(['height', 'shoulderWidth', 'hipWidth', 'armLengthScale', 'legLengthScale', 'headScale', 'handScale', 'footScale', 'bodyThickness'].map(k => [k, { type: 'number', exclusiveMinimum: 0, maximum: k.endsWith('Scale') ? 3 : 10 }])));
const model = schema('model', { type: { enum: ['static', 'humanoid'] }, units: { const: 'meter' }, root: obj(transform), rig: { const: 'humanoid.v1' }, body, material: id, parts: { type: 'array', items: part }, sockets: { type: 'array', items: obj({ id: name, parent: name, ...transform }, ['id']) } }, ['type'], { allOf: [
  { if: { properties: { type: { const: 'humanoid' } } }, then: { required: ['rig', 'body'] } },
  { if: { properties: { type: { const: 'static' } } }, then: { required: ['parts'], properties: { parts: { minItems: 1 } }, not: { anyOf: [{ required: ['rig'] }, { required: ['body'] }] } } }
] });
const poseBone = obj({ rotation: vec, position: vec }, [], { minProperties: 1 });
const key = obj({ time: { type: 'number', minimum: 0 }, rotation: vec, position: vec }, ['time'], { anyOf: [{ required: ['rotation'] }, { required: ['position'] }] });
const pose = schema('pose', { rig: { const: 'humanoid.v1' }, bones: { type: 'object', minProperties: 1, additionalProperties: poseBone } }, ['rig', 'bones']);
const range = (minimum, maximum) => ({ type: 'number', minimum, maximum });
const animation = schema('animation', {
  rig: { const: 'humanoid.v1' }, duration: { ...positive, maximum: 3600 }, loop: { type: 'boolean' }, mode: { enum: ['timeline', 'generator'] },
  tracks: { type: 'object', minProperties: 1, additionalProperties: { type: 'array', minItems: 1, items: key } },
  timeline: { type: 'array', minItems: 1, items: obj({ time: { type: 'number', minimum: 0 }, pose: id }, ['time', 'pose']) },
  generator: { enum: ['humanoid.idle', 'humanoid.breathing', 'humanoid.walk', 'humanoid.run'] },
  parameters: obj({ strideAngle: range(0, 90), kneeBend: range(0, 140), armSwing: range(0, 90), bodyBob: range(0, 0.2), hipTwist: range(0, 45), lean: range(-60, 60), breath: range(0, 15), samples: { type: 'integer', minimum: 8, maximum: 240 } })
}, ['rig', 'duration', 'loop', 'mode'], { allOf: [
  { if: { properties: { mode: { const: 'generator' } } }, then: { required: ['generator'], not: { anyOf: [{ required: ['tracks'] }, { required: ['timeline'] }] } } },
  { if: { properties: { mode: { const: 'timeline' } } }, then: { oneOf: [{ required: ['tracks'] }, { required: ['timeline'] }], not: { anyOf: [{ required: ['generator'] }, { required: ['parameters'] }] } } }
] });
for (const [name, data] of Object.entries({ model, animation, pose, material })) fs.writeFileSync('schemas/' + name + '.schema.json', JSON.stringify(data, null, 2) + '\n');
