// Shared source/package contract. Unknown fields are rejected in both authoring and preview.
const number = { type: 'number', minimum: -10000, maximum: 10000 };
const positive = { type: 'number', exclusiveMinimum: 0, maximum: 10000 };
const unit = { type: 'number', minimum: 0, maximum: 1 };
const id = { type: 'string', pattern: '^[A-Za-z][A-Za-z0-9_.-]{0,95}$' };
const color = { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' };
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false });
const list = (items, minItems = 1, maxItems = 128) => ({ type: 'array', items, minItems, maxItems });
const tuple = (n, item = number) => ({ type: 'array', items: item, minItems: n, maxItems: n });
const curve = { oneOf: [number, obj({ keys: list(tuple(2), 2), interpolation: { enum: ['linear', 'smooth'] } }),
  obj({ wave: { enum: ['sin', 'sinSquared'] }, domain: { enum: ['seconds', 'normalized'] }, frequency: number, phase: number, amplitude: number, bias: number })] };
const shape = { oneOf: [obj({ type: { const: 'cone' }, radius: positive, height: positive, segments: { type: 'integer', minimum: 3, maximum: 32 } }),
  obj({ type: { const: 'sphere' }, radius: positive, widthSegments: { type: 'integer', minimum: 3, maximum: 32 }, heightSegments: { type: 'integer', minimum: 2, maximum: 32 } })] };
const render = obj({ color, opacity: unit, depthTest: { type: 'boolean' }, depthWrite: { type: 'boolean' }, blend: { enum: ['normal', 'additive'] } });
const profiles = spec => ({ type: 'object', minProperties: 1, maxProperties: 32, propertyNames: id, additionalProperties: spec });
const base = { id, profiles: profiles(obj({ strength: curve, radius: curve }, ['strength'])) };
const burst = obj({ ...base, kind: { const: 'burst' }, texture: id,
  count: { type: 'integer', minimum: 1, maximum: 256 }, capacity: { type: 'integer', minimum: 1, maximum: 128 },
  duration: positive, lifeRange: tuple(2, unit), speed: tuple(2, positive), size: tuple(2, positive), stretch: tuple(2, positive),
  gravity: number, lift: number, normalOffset: number, spread: unit, normalWeight: tuple(2, positive),
  shrink: unit, fadeStart: unit, render }, [...Object.keys(base), 'kind','texture','count','capacity','duration','lifeRange','speed','size','stretch','gravity','lift','normalOffset','spread','normalWeight','shrink','fadeStart','render']);
const orbit = obj({ ...base, kind: { const: 'orbit' }, variant: id, shape,
  count: { type: 'integer', minimum: 1, maximum: 256 }, position: tuple(3), angularSpeed: number,
  bob: obj({ amplitude: number, frequency: number, phaseStep: number }),
  pulse: obj({ base: number, amplitude: number, frequency: number, phaseStep: number }), render },
  [...Object.keys(base),'kind','shape','count','position','angularSpeed','bob','pulse','render']);
const material = obj({ id, kind: { const: 'material' }, prefixes: list(id), profiles: profiles(obj({ colorMultiplier: unit,
  emissive: { anyOf: [color, { const: '$variant' }] }, intensity: curve })) });
const cloud = obj({ id, kind: { const: 'cloud' }, texture: id, count: {type:'integer',minimum:1,maximum:256},
  seed: {type:'integer',minimum:0,maximum:4294967295}, position: tuple(3), radii: tuple(3,positive), shell: unit,
  size: tuple(2,positive), aspect: positive, drift: tuple(3), speed: number, rotationSpeed: number,
  profiles: profiles(obj({strength:curve, expansion:curve, rise:curve, riseSpread:unit},['strength','expansion'])), render });
const surface = obj({ id, kind:{const:'surface'}, shape:{enum:['ellipsoid','disc','rectangle','barrier']},
  position:tuple(3), size:tuple(3,positive), accent:color, detailScale:positive, speed:number, rimWidth:{type:'number',exclusiveMinimum:0,maximum:.5},
  profiles:profiles(obj({strength:curve,expansion:curve})),render });
const sector = obj({id,kind:{const:'sector'},angle:{type:'number',minimum:1,maximum:360},radius:positive,
  seed:{type:'integer',minimum:0,maximum:4294967295},capacity:{type:'integer',minimum:1,maximum:256},density:positive,
  height:tuple(2,positive),color,emissive:color,smokeColor:color,
  profiles:profiles(obj({strength:curve,growth:curve,smoke:curve,ground:curve}))});
const beam = obj({id,kind:{const:'beam'},texture:id,count:{type:'integer',minimum:1,maximum:256},
  length:positive,width:positive,speed:positive,seed:{type:'integer',minimum:0,maximum:4294967295},
  size:tuple(2,positive),spread:positive,profiles:profiles(obj({strength:curve})),render});
const suction = obj({id,kind:{const:'suction'},texture:id,count:{type:'integer',minimum:1,maximum:256},
 angle:{type:'number',minimum:1,maximum:360},radius:positive,height:positive,speed:positive,size:tuple(2,positive),
 seed:{type:'integer',minimum:0,maximum:4294967295},profiles:profiles(obj({strength:curve})),render});
const warning = obj({id,kind:{const:'warning'},shape:{enum:['sector','circle']},angle:{type:'number',minimum:1,maximum:360},radius:positive,ground:number,profiles:profiles(obj({strength:curve})),render});
const arc = obj({id,kind:{const:'arc'},plane:{enum:['horizontal','vertical']},angle:{type:'number',minimum:1,maximum:180},
 radius:positive,width:positive,speed:number,profiles:profiles(obj({strength:curve})),render});
export const effectSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  ...obj({ schema: { const: 'effect.v1' }, id, name: { type: 'string', minLength: 1, maxLength: 120 }, initialState: id,
    states: profiles(obj({ duration: { type: 'number', exclusiveMinimum: 0, maximum: 600 }, loop: { type: 'boolean' }, next: id }, ['duration','loop'])),
    variants: { type: 'object', propertyNames: id, maxProperties: 16, additionalProperties: color },
    textures: { type: 'object', propertyNames: id, maxProperties: 16, additionalProperties: { oneOf: [obj({ source: { type: 'string', minLength: 1, maxLength: 240 } }), obj({ data: { type: 'string', pattern: '^data:image/png;base64,[A-Za-z0-9+/]+={0,2}$', maxLength: 12000000 } })] } },
    binding: obj({ model: id, animation: id, attachment: id, animationStates: { type: 'object', propertyNames: id, additionalProperties: { enum: ['time','end','rest'] } } }, ['model','attachment']), layers: list({ oneOf: [burst, orbit, material, cloud, surface, sector, beam, suction, arc, warning] }, 1, 32)
  }, ['schema','id','name','initialState','states','variants','textures','layers'])
};
