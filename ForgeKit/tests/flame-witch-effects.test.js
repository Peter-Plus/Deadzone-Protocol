import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {createEffect} from '../tools/effects/runtime.js';import {validateEffect} from '../tools/effects/validate.js';import '../previewer/runtime.js';
const base='assets/FSA(项目使用)/generated/',read=n=>JSON.parse(fs.readFileSync(base+'effects/fire/vfx_fire_'+n+'.vfx'));
// Node tests exercise geometry/state contracts; actual texture decode/render is checked in Chrome.
T.TextureLoader.prototype.loadAsync=async()=>new T.Texture();
test('beam resizes without reallocating, zero length hides, invalid input is atomic',async()=>{
 const e=await createEffect(read('flame_roar'),{scene:new T.Scene()}),children=[...e.root.children],geometry=children.map(n=>n.geometry);
 for(const length of [.1,2,18,100]){e.setBeam(length,.7);for(const n of children){assert.equal(n.material.uniforms.beamLength.value,length);assert.equal(n.material.uniforms.width.value,.7);}e.seek(120);assert.equal(e.stats().visibleLayers,3);}
 for(const args of [[NaN,1],[-1,1],[2,0],[10001,1],[1,Infinity]])assert.throws(()=>e.setBeam(...args));
 assert.equal(children[0].material.uniforms.beamLength.value,100);assert.deepEqual(children.map(n=>n.geometry),geometry);
 e.setBeam(0,1);assert.equal(e.stats().visibleLayers,0);e.setBeam(8,1);assert.equal(e.stats().visibleLayers,3);
 e.dispose();assert.throws(()=>e.setBeam(1,1));
 const bad=read('flame_roar').effect;bad.layers[0].texture='missing';assert.ok(validateEffect(bad).length);
});
test('five fire assets stop cleanly and support backward sampling',async()=>{
 for(const [id,ending]of [['flame_roar','dissipate'],['meteor_shield','broken'],['staff_charge','dissipate'],['hellfire_explosion','explode'],['teleport_arrival','arrival']]){
  const scene=new T.Scene(),e=await createEffect(read(id),{scene});e.setState(ending);e.seek(2);assert.equal(e.stats().visibleLayers,0);e.seek(.15);assert.ok(e.stats().visibleLayers>0);e.clear();assert.equal(e.stats().visibleLayers,0);e.dispose();assert.equal(scene.children.length,0);
 }
});
test('fire shield encloses FlameWitch Charge including raised staff at 120 Hz',async()=>{
 const loader=new GLTFLoader(),parse=async p=>{const b=fs.readFileSync(base+p);return loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
 const model=(await parse('models/characters/enemies/bosses/FSA_ENEMY_C003_FlameWitch.glb')).scene;
 const anim=await parse('animations/characters/overrides/bosses/flame_witch/FSA_ANIM_C003_FlameWitch_Charge.anim.glb'),R=globalThis.ForgeRuntime;
 const clip=R.prepareClip(anim.animations[0],model,R.metadata(anim.scene),T),mixer=new T.AnimationMixer(model);mixer.clipAction(clip).play();
 const layer=read('meteor_shield').effect.layers[0],c=new T.Vector3(...layer.position),r=new T.Vector3(...layer.size),p=new T.Vector3();let max=0;
 for(let i=0;i<=120;i++){mixer.setTime(i/120);model.updateMatrixWorld(true);model.traverse(n=>{if(!n.isMesh)return;const a=n.geometry.attributes.position;for(let j=0;j<a.count;j++){p.fromBufferAttribute(a,j).applyMatrix4(n.matrixWorld).sub(c).divide(r);max=Math.max(max,p.lengthSq());}});}
 assert.ok(max<1,`Shield penetration: ${max}`);
});
