import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as T from 'three';
import { OBB } from 'three/addons/math/OBB.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { readLibrary } from '../tools/core/library.js';
import { FPS_BONES } from '../tools/core/fps-rig.js';
import { validateLibrary } from '../tools/validator/validation.js';
import { dispose } from '../tools/compiler/compile.js';
import '../previewer/runtime.js';
const root=new URL('../assets/FSA(项目使用)/',import.meta.url);
const library=readLibrary(fileURLToPath(new URL('definitions/',root)));
const animations=library.entries.filter(e=>e.data.schema==='animation.v1'&&e.data.rig==='fps-arms.v1').map(e=>e.data);
const manifest=JSON.parse(readFileSync(new URL('docs/FPS_ANIMATION_EVENTS.json',root),'utf8'));
const angles=(d,end=false)=>FPS_BONES.map(b=>d.tracks[b][end?d.tracks[b].length-1:0].rotation[0]);
const load=async p=>{const bytes=readFileSync(new URL('generated/'+p,root));return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');};
test('23 FPS clips cover exact requested actions with valid schema and four hinge tracks',()=>{
 assert.deepEqual(validateLibrary(library),[]);assert.equal(animations.filter(a=>manifest.clips.some(c=>c.id===a.id)).length,23);assert.equal(manifest.clips.length,23);
 const expected={Unarmed:['Idle','Walk','Run'],Firearm:['Idle','Walk','Run','Fire','Reload','Holster','Draw','Bolt'],Melee:['Idle','Walk','Run','Attack','Holster','Draw'],Throwable:['Idle','Walk','Run','Throw','Holster','Draw']};
 for(const [cat,actions] of Object.entries(expected))assert.deepEqual(manifest.clips.filter(c=>c.category===cat).map(c=>c.action).sort(),actions.sort());
 for(const d of animations){assert.deepEqual(Object.keys(d.tracks),FPS_BONES);assert.equal(d.rig,'fps-arms.v1');for(const keys of Object.values(d.tracks)){assert.equal(keys[0].time,0);assert.equal(keys.at(-1).time,d.duration);assert(keys.every(k=>k.rotation[1]===0&&k.rotation[2]===0&&!k.position));}}
});
test('loop seams and ready/stowed transitions match exactly across weapon categories',()=>{
 for(const c of manifest.clips){const d=animations.find(d=>d.id===c.id);assert.equal(d.loop,['Idle','Walk','Run'].includes(c.action));
  const ready=manifest.readyAngles[c.category],stowed=manifest.stowedAngles;
  assert.deepEqual(angles(d),c.action==='Draw'?stowed:ready);assert.deepEqual(angles(d,true),c.action==='Holster'?stowed:ready);
  for(const event of c.events)assert(event.time>=0&&event.time<=c.duration);
 }
});
test('all exported FPS clips animate finite arms/socket positions and preserve shoulder anchors',async()=>{
 const model=await load('models/fps_arms/FSA_FPS_Arms_001_Base.glb'),R=globalThis.ForgeRuntime;
 const shoulder=model.scene.getObjectByName('UpperArm_L').position.clone(),socket=model.scene.getObjectByName('Weapon_L');
 for(const c of manifest.clips){const gltf=await load(c.path);assert(R.compatible(R.metadata(model.scene),R.metadata(gltf.scene)));assert.equal(gltf.animations.length,1);assert.equal(gltf.animations[0].tracks.length,c.category==='Firearm'?5:4);assert(Math.abs(gltf.animations[0].duration-c.duration)<1e-5);
  const mixer=new T.AnimationMixer(model.scene),action=mixer.clipAction(R.prepareClip(gltf.animations[0],model.scene,R.metadata(gltf.scene),T));action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();
  const positions=[];for(let i=0;i<=24;i++){mixer.setTime(c.duration*i/24);model.scene.updateMatrixWorld(true);const p=socket.getWorldPosition(new T.Vector3());assert(p.toArray().every(Number.isFinite));assert(p.length()<1);const delta=model.scene.getObjectByName('UpperArm_L').position.clone().sub(shoulder);if(c.category==='Firearm'){assert(delta.x>=-.111&&delta.x<=.001);assert(Math.abs(delta.y)<1e-6);assert(delta.z>=-.001&&delta.z<=.061);}else assert(delta.length()<1e-7);positions.push(p);}
  assert(positions.some(p=>p.distanceTo(positions[0])>.001),c.id+' is static');mixer.stopAllAction();mixer.uncacheRoot(model.scene);dispose(gltf.scene);
 }
 dispose(model.scene);
});
test('FPS left is screen-left; ready poses leave graded hand clearance and locomotion avoids overlap',async()=>{
 const model=await load('models/fps_arms/FSA_FPS_Arms_001_Base.glb'),gaps={};
 const camera=new T.PerspectiveCamera(60,1,.01,10);camera.position.set(0,0,-1);camera.lookAt(0,0,1);camera.updateMatrixWorld(true);
 for(const c of manifest.clips.filter(c=>c.loop)){
  const gltf=await load(c.path),mixer=new T.AnimationMixer(model.scene);mixer.clipAction(gltf.animations[0]).play();
  for(let i=0;i<32;i++){
   mixer.setTime(c.duration*i/32);model.scene.updateMatrixWorld(true);
   const left=model.scene.getObjectByName('Glove_L'),right=model.scene.getObjectByName('Glove_R');
   const gap=new T.Box3().setFromObject(left).min.x-new T.Box3().setFromObject(right).max.x;
   if(c.category==='Firearm'){left.geometry.computeBoundingBox();right.geometry.computeBoundingBox();const a=new OBB().fromBox3(left.geometry.boundingBox).applyMatrix4(left.matrixWorld),b=new OBB().fromBox3(right.geometry.boundingBox).applyMatrix4(right.matrixWorld);assert(!a.intersectsOBB(b),c.id+' hands intersect');const l=left.getWorldPosition(new T.Vector3()),r=right.getWorldPosition(new T.Vector3());assert(Math.abs(l.x-r.x)<.04);assert(l.z-r.z>.12);}else assert(gap>.015,c.id+' hand overlap / insufficient clearance');
   if(c.category!=='Firearm')assert(left.getWorldPosition(new T.Vector3()).project(camera).x<right.getWorldPosition(new T.Vector3()).project(camera).x);
   if(i===0&&c.action==='Idle')gaps[c.category]=gap;
  }
  mixer.stopAllAction();mixer.uncacheRoot(model.scene);dispose(gltf.scene);
 }
 assert(gaps.Unarmed>gaps.Melee&&gaps.Unarmed>gaps.Throwable);assert(gaps.Melee>gaps.Firearm&&gaps.Throwable>gaps.Firearm);
 dispose(model.scene);
});
test('melee and throwable use right equipment socket and right-hand primary action',async()=>{
 const model=await load('models/fps_arms/FSA_FPS_Arms_001_Base.glb');
 for(const c of manifest.clips)assert.equal(c.equipmentSocket,c.category==='Unarmed'?null:'Weapon_R');
 for(const [category,action,time] of [['Melee','Attack',.20],['Throwable','Throw',.22]]){
  const c=manifest.clips.find(c=>c.category===category&&c.action===action),gltf=await load(c.path),mixer=new T.AnimationMixer(model.scene);mixer.clipAction(gltf.animations[0]).play();mixer.setTime(0);model.scene.updateMatrixWorld(true);
  const right=model.scene.getObjectByName('Weapon_R'),left=model.scene.getObjectByName('Weapon_L'),a=right.getWorldPosition(new T.Vector3()),b=left.getWorldPosition(new T.Vector3());
  mixer.setTime(time);model.scene.updateMatrixWorld(true);assert(right.getWorldPosition(new T.Vector3()).distanceTo(a)>left.getWorldPosition(new T.Vector3()).distanceTo(b));
  mixer.stopAllAction();mixer.uncacheRoot(model.scene);dispose(gltf.scene);
 }
 dispose(model.scene);
});
test('right-hand firearm ready matches model pose, left support is forward/lower, camera stays fixed',async()=>{
 const model=await load('models/fps_arms/FSA_FPS_Arms_001_Base.glb');
 const ready=manifest.readyAngles.Firearm;assert.deepEqual(ready,[-15,40,0,0]);
 const camera=model.scene.getObjectByName('Camera_FPS');model.scene.updateMatrixWorld(true);const cameraStart=camera.matrixWorld.clone();
 for(const name of ['Idle','Fire','Reload','Bolt']){
  const c=manifest.clips.find(c=>c.category==='Firearm'&&c.action===name),gltf=await load(c.path),mixer=new T.AnimationMixer(model.scene);mixer.clipAction(gltf.animations[0]).play();mixer.setTime(0);model.scene.updateMatrixWorld(true);
  const left=model.scene.getObjectByName('Glove_L').getWorldPosition(new T.Vector3()),right=model.scene.getObjectByName('Glove_R').getWorldPosition(new T.Vector3());assert(left.z>right.z+.04);assert(left.y<right.y-.02);assert(right.x<0);
  mixer.setTime(c.duration*.45);model.scene.updateMatrixWorld(true);assert.deepEqual(camera.matrixWorld.elements,cameraStart.elements);
  mixer.stopAllAction();mixer.uncacheRoot(model.scene);dispose(gltf.scene);
 }
 dispose(model.scene);
});
test('all firearm actions keep gloves separate including draw/holster and assist transitions',async()=>{
 const model=await load('models/fps_arms/FSA_FPS_Arms_001_Base.glb');
 for(const c of manifest.clips.filter(c=>c.category==='Firearm')){
  const gltf=await load(c.path),mixer=new T.AnimationMixer(model.scene);const action=mixer.clipAction(gltf.animations[0]);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();
  for(let i=0;i<=100;i++){mixer.setTime(c.duration*i/100);model.scene.updateMatrixWorld(true);const box=name=>{const n=model.scene.getObjectByName(name);n.geometry.computeBoundingBox();return new OBB().fromBox3(n.geometry.boundingBox).applyMatrix4(n.matrixWorld);};assert(!box('Glove_L').intersectsOBB(box('Glove_R')),`${c.id} at ${i}%`);}
  mixer.stopAllAction();mixer.uncacheRoot(model.scene);dispose(gltf.scene);
 }
 dispose(model.scene);
});
