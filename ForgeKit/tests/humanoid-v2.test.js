import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {readLibrary} from '../tools/core/library.js';
import {createRig,BONES,V2_BONES,V2_HIERARCHY,RIG_META,V2_META} from '../tools/core/rig.js';
import {buildModel,buildAnimation,compile} from '../tools/compiler/compile.js';
import {validate,validateLibrary} from '../tools/validator/validation.js';
import '../previewer/runtime.js';
const R=globalThis.ForgeRuntime,lib=readLibrary();
const model=(rig='humanoid.v2')=>({schema:'model.v1',id:'test.person',type:'humanoid',rig,parameters:{height:2.16}});
const animation=(rig='humanoid.v2',tracks={Hand_R:[{time:0,rotation:[0,0,0]},{time:1,rotation:[0,60,0]}]})=>({schema:'animation.v1',id:'test.motion',rig,mode:'timeline',duration:1,loop:false,tracks});
async function load(d){const b=await compile(d,lib);return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
test('formal library validates; v2 has exactly thirteen fixed nodes and preserves seven old anchors',()=>{
 assert.deepEqual(validateLibrary(lib),[]);
 const old=createRig({height:2.16}),rig=createRig({height:2.16},'humanoid.v2');
 assert.equal(Object.keys(rig.nodes).length,13);
 for(const n of BONES){assert.deepEqual(rig.nodes[n].position.toArray(),old.nodes[n].position.toArray());assert.equal(rig.nodes[n].quaternion.w,1);}
 for(const [n,parent] of Object.entries(V2_HIERARCHY))if(parent)assert.equal(rig.nodes[n].parent.name,parent);
 const {root}=buildModel(model(),lib);assert.ok(Math.abs(new T.Box3().setFromObject(root,true).min.y)<1e-6);
 assert.ok(root.getObjectByName('Visual_LowerLeg_R'));assert.ok(root.getObjectByName('Visual_Hand_R'));
});
test('v2 schema permits only fixed new joints and model-only joint placement',()=>{
 assert.deepEqual(validate(animation()),[]);
 assert.ok(validate(animation('humanoid.v1')).length);
 for(const tracks of [{Hand_R:[{time:0,position:[0,.1,0]}]},{LowerLeg_L:[{time:0,position:[0,0,0]}]},{Finger_R:[{time:0,rotation:[0,0,0]}]}])assert.ok(validate(animation('humanoid.v2',tracks)).length);
 const d=model();d.parts=[{id:'Hand_R',shape:{type:'sphere',radius:.1}}];assert.ok(validate(d).some(e=>e.code==='DUPLICATE_NODE'));
 d.parts[0].id='skin';d.parts[0].parent='Hand_R';d.jointPositions={Hand_R:[-.2,.02,.01]};assert.deepEqual(validate(d),[]);
 for(const mutate of [a=>a.rig='humanoid.v1',a=>a.jointPositions.Body=[0,1,0],a=>a.parts=[],a=>a.jointPositions.Hand_R=[NaN,0,0]]){const bad=structuredClone(d);mutate(bad);assert.ok(validate(bad).length);}
 const pose={schema:'pose.v1',id:'test.pose',rig:'humanoid.v2',bones:{Forearm_L:{rotation:[0,0,30]},LowerLeg_R:{rotation:[40,0,0]}}};assert.deepEqual(validate(pose),[]);
 const a=animation('humanoid.v2',{Forearm_L:[{time:0,pose:pose.id}]});assert.deepEqual(validate(a,'test',{...lib,poses:new Map([[pose.id,pose]])}),[]);
 a.rig='humanoid.v1';assert.ok(validate(a,'test',{...lib,poses:new Map([[pose.id,pose]])}).length);
});
test('compatibility is directional and fails closed on wrong/missing signatures and FPS',()=>{
 assert.equal(R.compatible(V2_META,RIG_META),false);
 assert.equal(R.compatibility(V2_META,RIG_META),'humanoid-v1-to-v2');assert.equal(R.compatibility(RIG_META,V2_META),null);
 assert.equal(R.compatibility(V2_META,V2_META),'exact');
 for(const field of Object.keys(V2_META)){assert.equal(R.compatibility({...V2_META,[field]:'wrong'},RIG_META),null);assert.equal(R.compatibility(V2_META,{...RIG_META,[field]:undefined}),null);}
 assert.equal(R.compatibility(V2_META,{...RIG_META,rigId:'fps-arms'}),null);
 assert.equal(R.compatibility({},{}),null);
 assert.throws(()=>R.prepareClip(new T.AnimationClip('bad',1,[]),buildModel(model('humanoid.v1'),lib).root,V2_META,T),/Rig mismatch/);
});
test('v2 model/animation round-trip preserves hierarchy, wrist/knee tracks and canonical metadata',async()=>{
 const m=await load(model()),a=await load(animation('humanoid.v2',{Hand_R:[{time:0,rotation:[0,0,0]},{time:1,rotation:[0,60,0]}],LowerLeg_L:[{time:0,rotation:[0,0,0]},{time:1,rotation:[50,0,0]}]}));
 assert.equal(R.metadata(m.scene).rigSignature,V2_META.rigSignature);assert.equal(Object.keys(R.metadata(a.scene).canonicalTranslations).length,13);
 const c=R.prepareClip(a.animations[0],m.scene,R.metadata(a.scene),T),mix=new T.AnimationMixer(m.scene);mix.clipAction(c).setLoop(T.LoopOnce,1).play();mix.setTime(.5);
 assert.ok(m.scene.getObjectByName('Hand_R').quaternion.angleTo(new T.Quaternion())>.4);assert.ok(m.scene.getObjectByName('LowerLeg_L').quaternion.angleTo(new T.Quaternion())>.3);
 assert.ok(m.scene.getObjectByName('Arm_R').quaternion.angleTo(new T.Quaternion())<1e-6);
});
test('v1 to v2 rebases Body and fills rest channels; crossfade clears wrist/elbow/knee and stop restores rest',()=>{
 const m=buildModel(model(),lib).root;R.captureRestPose(m);
 const old=buildAnimation(animation('humanoid.v1',{Body:[{time:0,position:[0,.1,0]}],Arm_R:[{time:0,rotation:[0,0,90]}]}),lib);
 const original=old.animations[0].tracks[0].values.slice(),clip=R.prepareClip(old.animations[0],m,old.root.userData,T);
 assert.deepEqual(old.animations[0].tracks[0].values,original);
 const newer=buildAnimation(animation('humanoid.v2',{Hand_R:[{time:0,rotation:[0,75,0]}],Forearm_R:[{time:0,rotation:[0,0,65]}],LowerLeg_L:[{time:0,rotation:[55,0,0]}]}),lib);
 const mix=new T.AnimationMixer(m),one=mix.clipAction(R.prepareClip(newer.animations[0],m,newer.root.userData,T)).play();mix.update(.1);
 const two=mix.clipAction(clip).play();one.crossFadeTo(two,.25,false);mix.update(.3);
 for(const n of ['Hand_R','Forearm_R','LowerLeg_L'])assert.ok(m.getObjectByName(n).quaternion.angleTo(new T.Quaternion())<1e-6,n);
 assert.ok(Math.abs(m.getObjectByName('Body').position.y-1.0936)<1e-6);
 // Preparing another clip while posed still uses the captured rest, never current bob.
 const again=R.prepareClip(old.animations[0],m,old.root.userData,T);assert.deepEqual(again.tracks[0].values,clip.tracks[0].values);
 mix.stopAllAction();R.restoreRestPose(m);assert.ok(Math.abs(m.getObjectByName('Body').position.y-.9936)<1e-6);
});
test('v2 generators remain basic seven-node motion with six neutral new joints',async()=>{
 for(const name of ['idle','walk','run']){const d={schema:'animation.v1',id:'test.'+name,rig:'humanoid.v2',mode:'generator',generator:'humanoid.'+name,duration:1,loop:true};const a=await load(d),m=buildModel(model(),lib).root,c=R.prepareClip(a.animations[0],m,R.metadata(a.scene),T);assert.equal(c.tracks.filter(t=>t.name.endsWith('.quaternion')).length,13);assert.equal(R.metadata(a.scene).rigVersion,'2');}
});
test('flame witch wrist rotates staff and hand together independently of forearm; elbow carries wrist; no leg geometry',()=>{
 const d=lib.entries.find(e=>e.data.id==='FSA_ENEMY_C003_FlameWitch').data,m=buildModel(d,lib).root;
 assert.equal(d.rig,'humanoid.v2');const grip=m.getObjectByName('Staff_Grip_R'),palm=m.getObjectByName('HandMesh_R'),wrist=m.getObjectByName('Hand_R'),forearm=m.getObjectByName('ForearmMesh_R');
 assert.equal(grip.parent,wrist);assert.equal(palm.parent,wrist);assert.equal(forearm.parent.name,'Forearm_R');
 let legMeshes=0;for(const n of ['Leg_L','Leg_R'])m.getObjectByName(n).traverse(o=>{if(o.isMesh)legMeshes++;});assert.equal(legMeshes,0);
 const fm=forearm.matrixWorld.clone(),tip=m.getObjectByName('Staff_Tip'),initial=tip.getWorldPosition(new T.Vector3()),relative=grip.position.clone();
 wrist.rotation.y=Math.PI/3;m.updateMatrixWorld(true);assert.ok(tip.getWorldPosition(new T.Vector3()).distanceTo(initial)>.5);assert.ok(forearm.matrixWorld.equals(fm));assert.ok(grip.position.equals(relative));
 const before=wrist.getWorldPosition(new T.Vector3());m.getObjectByName('Forearm_R').rotation.z=.8;m.updateMatrixWorld(true);assert.ok(wrist.getWorldPosition(new T.Vector3()).distanceTo(before)>.1);
});
