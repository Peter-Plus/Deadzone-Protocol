import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {readLibrary} from '../tools/core/library.js';
import {validate} from '../tools/validator/validation.js';
import '../previewer/runtime.js';
import '../assets/FSA(项目使用)/definitions/effects/world/interactables/InteractableFeedback.js';
const lib=readLibrary(),R=globalThis.ForgeRuntime,F=globalThis.ForgeInteractables;
const config=JSON.parse(readFileSync('assets/FSA(项目使用)/definitions/effects/world/interactables/AltarFeedback.json'));
const defs=lib.entries.filter(e=>e.data.rig==='nodes.v1').map(e=>e.data);
async function load(kind,id){const b=readFileSync(`assets/FSA(项目使用)/generated/${kind}/world/interactables/${id}${kind==='models'?'.glb':'.anim.glb'}`);return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
test('node contract rejects wrong targets, root motion, pose references, nonpositive scale and unordered time',()=>{
 for(const mutate of [d=>d.targetModel='missing',d=>d.tracks={Asset:[{time:0,rotation:[0,0,0]}]},d=>d.tracks={LidPivot:[{time:0,pose:'x'}]},d=>d.tracks={LidPivot:[{time:0,scale:[1,0,1]}]},d=>d.tracks={LidPivot:[{time:1,rotation:[0,0,0]},{time:.1,rotation:[0,0,0]}]},d=>d.mode='generator']){const d=structuredClone(defs[0]);mutate(d);assert.ok(validate(d,'bad',lib).length);}
});
test('three actual node GLBs bind, keep root fixed, hold final pose and reconstruct persistent states independently',async()=>{
 const report=[];
 for(const d of defs){
  const a=await load('animations',d.id),m=await load('models',d.targetModel),other=await load('models',d.targetModel),meta=R.metadata(a.scene);
  assert.equal(a.animations.length,1);let meshes=0;a.scene.traverse(n=>meshes+=!!n.isMesh);assert.equal(meshes,0);
  assert.equal(R.compatibility(R.metadata(m.scene),meta),'exact');assert.equal(R.compatibility({...R.metadata(m.scene),rigSignature:'wrong'},meta),null);
  const c=F.create(m.scene,a.animations[0],meta,config,T,R),c2=F.create(other.scene,a.animations[0],meta,config,T,R),altar=d.targetModel.endsWith('EnchantAltar');
  const fixed=m.scene.getObjectByName('Asset').matrix.clone(),sweep=new T.Box3(),closed=new T.Box3().setFromObject(m.scene,true),pivot=m.scene.getObjectByName(altar?'Crystal':'LidPivot');
  const start=pivot.position.clone(),hinge=altar?null:pivot.getWorldPosition(new T.Vector3());c.play('poison');
  for(let i=0;i<=240;i++){c.seek(d.duration*i/240);m.scene.updateMatrixWorld(true);sweep.union(new T.Box3().setFromObject(m.scene,true));assert.ok(m.scene.getObjectByName('Asset').matrix.equals(fixed));if(hinge){assert.ok(pivot.getWorldPosition(new T.Vector3()).distanceTo(hinge)<1e-7);assert.ok(new T.Box3().setFromObject(m.scene.getObjectByName('Lid'),true).min.y>closed.max.y-.3,'Lid must open above the body');}}
  assert.ok(altar?pivot.position.distanceTo(start)>.09:pivot.rotation.x< -1.7);
  assert.equal(c2.state,altar?'available':'closed');if(!altar)assert.ok(other.scene.getObjectByName('LidPivot').quaternion.angleTo(new T.Quaternion())<1e-7);
  const final=altar?'exhausted':'opened';c.stopAndRestore(final);const q=pivot.quaternion.clone(),p=pivot.position.clone();c.update(8);assert.ok(pivot.quaternion.angleTo(q)<1e-3);assert.ok(pivot.position.distanceTo(p)<1e-7);
  c2.setState(final);assert.ok(other.scene.getObjectByName(pivot.name).quaternion.angleTo(q)<1e-3);assert.ok(other.scene.getObjectByName(pivot.name).position.distanceTo(p)<1e-7);
  if(altar){c2.setState('available');const glow=other.scene.getObjectByName('CrystalUpper').material.emissive.clone();c.setState('sealed_fire');assert.ok(other.scene.getObjectByName('CrystalUpper').material.emissive.equals(glow));c.unlockSeal();c.update(.3);c.update(.36);assert.equal(c.state,'unlocked');c.play('poison');c.update(2.5);assert.equal(c.state,'exhausted');}
  report.push({model:d.targetModel,animation:d.id,duration:d.duration,closedBounds:{min:closed.min.toArray(),max:closed.max.toArray()},sweep:{min:sweep.min.toArray(),max:sweep.max.toArray()},samples:241});
 }
 writeFileSync('.qa/interactables-validation.json',JSON.stringify(report,null,2));
});
