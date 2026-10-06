import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createEffect} from '../tools/effects/runtime.js';
import {validateEffect} from '../tools/effects/validate.js';
import '../previewer/runtime.js';
const base='assets/FSA(项目使用)/generated/';
const read=id=>JSON.parse(fs.readFileSync(base+'effects/poison/vfx_poison_'+id+'.vfx','utf8'));
test('straight ground field matches arbitrary endpoints and width, including zero movement',async()=>{
 const scene=new T.Scene(),e=await createEffect(read('field_rectangle'),{scene});
 const start=[-2,1,4],end=[4,1,-4],width=3;
 assert.equal(e.setSegment(start,end,width),10);e.root.updateMatrixWorld(true);
 const a=new T.Vector3(0,0,-.5).applyMatrix4(e.root.matrixWorld),b=new T.Vector3(0,0,.5).applyMatrix4(e.root.matrixWorld);
 assert.ok(a.distanceTo(new T.Vector3(...start))<1e-8);assert.ok(b.distanceTo(new T.Vector3(...end))<1e-8);
 assert.ok(Math.abs(new T.Vector3(-.5,0,0).applyMatrix4(e.root.matrixWorld).distanceTo(new T.Vector3(.5,0,0).applyMatrix4(e.root.matrixWorld))-width)<1e-8);
 assert.equal(e.setSegment(start,start,width),0);assert.equal(e.root.scale.z,0);
 for(const args of [[start,end,0],[start,[1,2,3],2],[start,[NaN,1,4],2]])assert.throws(()=>e.setSegment(...args));
 e.dispose();assert.equal(scene.children.length,0);assert.throws(()=>e.setSegment(start,end,width));
});
test('poison states persist until explicitly ended and restore on backward seek',async()=>{
 for(const id of ['toxic_shield','field_rectangle','field_circle']){
  const doc=read(id),scene=new T.Scene(),e=await createEffect(doc,{scene});e.seek(120);assert.equal(e.stats().state,'active');assert.ok(e.stats().visibleLayers>0);
  if(id==='toxic_shield'){e.setState('hit');e.seek(.3);assert.equal(e.stats().state,'active');}
  e.setState(id==='toxic_shield'?'broken':'fading');e.seek(2);assert.equal(e.stats().visibleLayers,0);e.seek(.1);assert.ok(e.stats().visibleLayers>0);
  e.clear();assert.equal(e.stats().visibleLayers,0);e.show();assert.ok(e.stats().visibleLayers>0);
  const bad=structuredClone(doc.effect);bad.layers[0].rimWidth=0;assert.ok(validateEffect(bad).length);e.dispose();
 }
 const e=await createEffect(read('field_circle'),{scene:new T.Scene()});e.root.scale.set(4,1,4);e.root.updateMatrixWorld(true);
 assert.equal(new T.Vector3(1,0,0).applyMatrix4(e.root.matrixWorld).length(),4);assert.throws(()=>e.setSegment([0,0,0],[0,0,2],3));e.dispose();
});
test('shield encloses actual C2 mesh through all 5 seconds of ToxicShield at 60 Hz',async()=>{
 const loader=new GLTFLoader(),parse=async p=>{const b=fs.readFileSync(base+p);return loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
 const model=(await parse('models/characters/enemies/bosses/FSA_ENEMY_C002_PlagueBeast.glb')).scene;
 const anim=await parse('animations/characters/overrides/bosses/plague_beast/FSA_ANIM_C002_PlagueBeast_ToxicShield.anim.glb'),R=globalThis.ForgeRuntime;
 const clip=R.prepareClip(anim.animations[0],model,R.metadata(anim.scene),T),mixer=new T.AnimationMixer(model),action=mixer.clipAction(clip).setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();
 const layer=read('toxic_shield').effect.layers[0],c=new T.Vector3(...layer.position),r=new T.Vector3(...layer.size),p=new T.Vector3();let max=0;
 for(let i=0;i<=300;i++){mixer.setTime(i/60);model.updateMatrixWorld(true);model.traverse(n=>{if(!n.isMesh)return;const a=n.geometry.attributes.position;for(let j=0;j<a.count;j++){p.fromBufferAttribute(a,j).applyMatrix4(n.matrixWorld).sub(c).divide(r);max=Math.max(max,p.lengthSq());}});}
 assert.ok(max<1,`Shield penetration: ${max}`);
});
