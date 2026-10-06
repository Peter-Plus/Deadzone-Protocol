import fs from 'node:fs';
const save = (folder, name, data) => {
  for (const base of ['examples', 'assets/definitions']) { fs.mkdirSync(`${base}/${folder}`, { recursive: true }); fs.writeFileSync(`${base}/${folder}/${name}`, JSON.stringify(data, null, 2) + '\n'); }
};
save('materials', 'metal_dark.material.json', { schema: 'material.v1', id: 'metal.dark', color: '#303d4c', roughness: .58, metalness: .72 });
save('materials', 'wood_warm.material.json', { schema: 'material.v1', id: 'wood.warm', color: '#9b6544', roughness: .9, metalness: 0 });
save('materials', 'body_sage.material.json', { schema: 'material.v1', id: 'body.sage', color: '#8fb9a3', roughness: .75 });
save('models', 'simple_box.model.json', { schema: 'model.v1', id: 'example.box', type: 'static', units: 'meter', parts: [{ id: 'box', shape: 'box', size: [1, 1, 1], position: [0, .5, 0], material: 'wood.warm' }] });
save('models', 'simple_humanoid.model.json', { schema: 'model.v1', id: 'humanoid.example', type: 'humanoid', rig: 'humanoid.v1', units: 'meter', body: { height: 1.8, shoulderWidth: .48, hipWidth: .32, armLengthScale: 1, legLengthScale: 1, headScale: 1 }, material: 'body.sage', sockets: [{ id: 'grip_right', parent: 'Hand_R', position: [-.06, 0, 0], rotation: [0, 0, 90] }] });
save('models', 'tall_humanoid.model.json', { schema: 'model.v1', id: 'humanoid.tall', type: 'humanoid', rig: 'humanoid.v1', body: { height: 2.2, armLengthScale: 1.15, legLengthScale: 1.1, headScale: 1.2 }, material: 'body.sage' });
save('models', 'test_weapon.model.json', { schema: 'model.v1', id: 'weapon.rifle.example', type: 'static', units: 'meter', parts: [
  { id: 'grip', shape: 'box', size: [.075, .16, .09], position: [0, 0, 0], rotation: [-12, 0, 0], material: 'wood.warm' },
  { id: 'receiver', shape: 'box', size: [.12, .14, .38], position: [0, .12, .03], material: 'metal.dark' },
  { id: 'barrel', parent: 'receiver', shape: 'cylinder', radius: .025, length: .45, axis: 'z', position: [0, .015, .4], material: 'metal.dark' },
  { id: 'stock', parent: 'receiver', shape: 'box', size: [.09, .13, .26], position: [0, -.02, -.3], material: 'wood.warm' },
  { id: 'sight', parent: 'receiver', shape: 'box', size: [.03, .035, .07], position: [0, .085, .05], material: 'metal.dark' }
], sockets: [{ id: 'muzzle', parent: 'barrel', position: [0, 0, .225] }, { id: 'primary_grip', parent: 'grip' }] });
save('models', 'primitive_gallery.model.json', { schema: 'model.v1', id: 'example.primitives', type: 'static', parts: [
  { id: 'box', shape: 'box', size: [.5, .5, .5], position: [-1.8, .25, 0] },
  { id: 'sphere', shape: 'sphere', radius: .28, position: [-1.1, .28, 0] },
  { id: 'cylinder', shape: 'cylinder', radius: .22, length: .6, position: [-.4, .3, 0] },
  { id: 'capsule', shape: 'capsule', radius: .18, length: .35, position: [.3, .355, 0] },
  { id: 'cone', shape: 'cone', radius: .28, length: .65, position: [1, .325, 0] },
  { id: 'plane', shape: 'plane', size: [.55, .55, .01], position: [1.7, .275, 0] }
] });
for (const [name, duration, parameters] of [['idle', 3, { breath: 1.8 }], ['breathing', 4, { breath: 3 }], ['walk', 1, { strideAngle: 32, kneeBend: 24, armSwing: 20, bodyBob: .025, hipTwist: 4 }], ['run', .65, { strideAngle: 48, kneeBend: 70, armSwing: 38, bodyBob: .05, lean: 12 }]]) save('animations', `humanoid_${name}.anim.json`, { schema: 'animation.v1', id: `animation.humanoid.${name}`, rig: 'humanoid.v1', duration, loop: true, mode: 'generator', generator: `humanoid.${name}`, parameters });
save('animations', 'humanoid_wave.anim.json', { schema: 'animation.v1', id: 'animation.humanoid.wave', rig: 'humanoid.v1', duration: 2, loop: false, mode: 'timeline', tracks: { UpperArm_L: [{ time: 0, rotation: [0, 0, -82] }, { time: 2, rotation: [0, 0, -82] }], UpperArm_R: [{ time: 0, rotation: [0, 0, 82] }, { time: .4, rotation: [0, 0, -30] }, { time: 1.6, rotation: [0, 0, -30] }, { time: 2, rotation: [0, 0, 82] }], LowerArm_R: [{ time: 0, rotation: [0, 0, 0] }, { time: .6, rotation: [0, 0, -75] }, { time: .9, rotation: [0, 0, -35] }, { time: 1.2, rotation: [0, 0, -75] }, { time: 1.5, rotation: [0, 0, -35] }, { time: 2, rotation: [0, 0, 0] }] } });
for (const [name, bend] of [['stand', 0], ['bow', 25]]) save('poses', `humanoid_${name}.pose.json`, { schema: 'pose.v1', id: `pose.humanoid.${name}`, rig: 'humanoid.v1', bones: { Hips: { rotation: [bend, 0, 0] }, UpperArm_L: { rotation: [0, 0, -82] }, UpperArm_R: { rotation: [0, 0, 82] } } });
save('animations', 'humanoid_bow.anim.json', { schema: 'animation.v1', id: 'animation.humanoid.bow', rig: 'humanoid.v1', duration: 2, loop: false, mode: 'timeline', timeline: [{ time: 0, pose: 'pose.humanoid.stand' }, { time: 1, pose: 'pose.humanoid.bow' }, { time: 2, pose: 'pose.humanoid.stand' }] });
