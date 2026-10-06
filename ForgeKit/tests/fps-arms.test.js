import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createFpsRig,FPS_BONES,FPS_META } from '../tools/core/fps-rig.js';
import { RIG_META } from '../tools/core/rig.js';
import { validate,validateLibrary } from '../tools/validator/validation.js';
import { readLibrary } from '../tools/core/library.js';
import { compile,buildModel,buildAnimation,dispose } from '../tools/compiler/compile.js';
import '../previewer/runtime.js';
const library=readLibrary(fileURLToPath(new URL('../assets/FSA(项目使用)/definitions/',import.meta.url)));
const model=()=>JSON.parse(readFileSync(new URL('../assets/FSA(项目使用)/definitions/models/fps_arms/FSA_FPS_Arms_001_Base.model.json',import.meta.url),'utf8'));
const animation=()=>({schema:'animation.v1',id:'test.fps.hinge',rig:'fps-arms.v1',duration:1,loop:false,mode:'timeline',tracks:{Forearm_L:[{time:0,rotation:[0,0,0]},{time:1,rotation:[55,0,0]}]}});
test('FSA library validates including separate FPS rig',()=>assert.deepEqual(validateLibrary(library),[]));
test('FPS has exactly four hinges, fixed hands and left and right sockets',async()=>{
 const d=model();assert.deepEqual(validate(d),[]);const {root}=buildModel(d,library);
 const bones=[];root.traverse(n=>{if(n.isBone)bones.push(n.name);});assert.deepEqual(bones.sort(),[...FPS_BONES].sort());
 assert.equal(root.getObjectByName('Root').isBone,undefined);assert.equal(root.getObjectByName('Glove_L').parent.name,'Forearm_L');assert.equal(root.getObjectByName('Glove_R').parent.name,'Forearm_R');
 assert.deepEqual(root.userData.sockets,['Weapon_L','Weapon_R','Camera_FPS','ShadowBlade_L','ShadowBlade_R']);for(const side of ['L','R'])assert.equal(root.getObjectByName('ShadowBlade_'+side).parent.name,'Forearm_'+side);const socket=root.getObjectByName('Weapon_L');assert.equal(socket.parent.name,'Forearm_L');
 const rightSocket=root.getObjectByName('Weapon_R');assert.equal(rightSocket.parent.name,'Forearm_R');
 assert(rightSocket.getWorldQuaternion(new T.Quaternion()).angleTo(new T.Quaternion())<1e-6);
 const shift=socket.getWorldPosition(new T.Vector3()).sub(root.getObjectByName('Glove_L').getWorldPosition(new T.Vector3()));assert(shift.distanceTo(new T.Vector3(0,0,0))<1e-6);
 assert(socket.getWorldQuaternion(new T.Quaternion()).angleTo(new T.Quaternion())<1e-6);
 const cameraSocket=root.getObjectByName('Camera_FPS');assert.equal(cameraSocket.parent.name,'Root');const leftPos=root.getObjectByName('Glove_L').getWorldPosition(new T.Vector3()),rightPos=root.getObjectByName('Glove_R').getWorldPosition(new T.Vector3());assert(leftPos.z>rightPos.z+.04);assert(leftPos.y<rightPos.y-.02);
 assert.equal(root.getObjectByName('Body'),undefined);assert.equal(root.getObjectByName('Head'),undefined);
 const bytes=await compile(d,library),gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 assert.equal(gltf.animations.length,0);assert.equal(gltf.scene.getObjectByName('Weapon_L').userData.socket,true);assert.equal(globalThis.ForgeRuntime.metadata(gltf.scene).rigSignature,FPS_META.rigSignature);
 assert.equal(gltf.scene.getObjectByName('Weapon_R').userData.socket,true);assert.equal(gltf.scene.getObjectByName('Weapon_R').parent.name,'Forearm_R');
 dispose(root);dispose(gltf.scene);
});
test('FPS schema rejects incorrect rig, humanoid parameters and reserved joint names',()=>{
 for(const change of [d=>d.rig='humanoid.v1',d=>d.parameters={height:1.8},d=>d.parts=[],d=>d.parts[0].id='Forearm_L',d=>d.parts[0].parent='Body']){const d=model();change(d);assert(validate(d).length>0);}
});
test('FPS model rigPose is restricted to four scalar hinge angles; camera is outside arm chains',()=>{
 const d=model();assert.deepEqual(validate(d),[]);
 for(const pose of [{Root:5},{Forearm_L:[0,0,0]},{UpperArm_R:NaN}]){const bad=structuredClone(d);bad.rigPose=pose;assert(validate(bad).length>0);}
 const staticModel={schema:'model.v1',id:'test.static',type:'static',parts:[{id:'box',shape:{type:'box',size:[1,1,1]}}],rigPose:{UpperArm_L:1}};assert(validate(staticModel).length>0);
 const {root}=buildModel(d,library),camera=root.getObjectByName('Camera_FPS');const q=camera.getWorldQuaternion(new T.Quaternion());assert(new T.Vector3(0,0,-1).applyQuaternion(q).distanceTo(new T.Vector3(0,0,1))<1e-6);assert.equal(camera.parent.name,'Root');dispose(root);
});
test('FPS rejects extra axes, translation, root tracks and humanoid generators',()=>{
 for(const change of [d=>d.tracks.Forearm_L[0].rotation=[0,1,0],d=>d.tracks.Forearm_L[0].position=[0,0,0],d=>d.tracks.Root=[{time:0,rotation:[1,0,0]}],d=>{d.mode='generator';d.generator='humanoid.idle';delete d.tracks;}]){const d=animation();change(d);assert(validate(d).length>0);}
});
test('FPS rotation is relative to rest pose; left elbow moves glove/socket but not shoulder or right arm',()=>{
 const {root}=buildModel(model(),library),rig=createFpsRig(),d=animation();assert.deepEqual(validate(d),[]);
 const {root:animationRoot,animations}=buildAnimation(d,library);const track=animations[0].tracks[0];
 assert(new T.Quaternion().fromArray(track.values,0).angleTo(rig.nodes.Forearm_L.quaternion)<1e-6);
 const socket=root.getObjectByName('Weapon_L'),right=root.getObjectByName('Glove_R'),left=root.getObjectByName('Glove_L');
 const pos=n=>{root.updateMatrixWorld(true);return n.getWorldPosition(new T.Vector3());};const before=pos(socket),rightBefore=pos(right),leftBefore=pos(left),shoulderBefore=pos(root.getObjectByName('UpperArm_L'));
 const mixer=new T.AnimationMixer(root);const action=mixer.clipAction(animations[0]);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();mixer.update(1);
 assert(pos(socket).distanceTo(before)>.05);assert(pos(left).distanceTo(leftBefore)>.05);assert(pos(right).distanceTo(rightBefore)<1e-6);assert(pos(root.getObjectByName('UpperArm_L')).distanceTo(shoulderBefore)<1e-6);
 mixer.stopAllAction();assert(pos(socket).distanceTo(before)<1e-6);mixer.uncacheRoot(root);dispose(root);dispose(animationRoot);
});
test('FPS animations cannot share humanoid rig or cross-rig poses',()=>{
 assert.equal(globalThis.ForgeRuntime.compatible(FPS_META,RIG_META),false);
 const d=animation();d.tracks.Forearm_L=[{time:0,pose:'wrong'}];const poses=new Map([['wrong',{rig:'humanoid.v1',bones:{Forearm_L:{rotation:[0,0,0]}}}]]);assert(validate(d,'test',{materials:new Map(),poses}).some(e=>e.code==='UNKNOWN_POSE'));
});
test('FPS timeline GLB loads, plays on exported arms and follows left socket',async()=>{
 const load=async d=>{const bytes=await compile(d,library);return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');};
 const arms=await load(model()),motion=await load(animation()),R=globalThis.ForgeRuntime;
 assert(R.compatible(R.metadata(arms.scene),R.metadata(motion.scene)));assert.equal(motion.animations.length,1);
 const socket=arms.scene.getObjectByName('Weapon_L');arms.scene.updateMatrixWorld(true);const before=socket.getWorldPosition(new T.Vector3());
 const mixer=new T.AnimationMixer(arms.scene);const clip=R.prepareClip(motion.animations[0],arms.scene,R.metadata(motion.scene),T);const action=mixer.clipAction(clip);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();mixer.update(1);arms.scene.updateMatrixWorld(true);
 assert(socket.getWorldPosition(new T.Vector3()).distanceTo(before)>.05);mixer.stopAllAction();mixer.uncacheRoot(arms.scene);dispose(arms.scene);dispose(motion.scene);
});

