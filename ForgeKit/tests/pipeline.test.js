import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { readLibrary } from '../tools/core/library.js';
import { validate,validateLibrary } from '../tools/validator/validation.js';
import { compile,buildModel,animationKeys,dispose } from '../tools/compiler/compile.js';
import { signature,HIERARCHY,BONES,RIG_META } from '../tools/core/rig.js';
import '../previewer/runtime.js';
const R=globalThis.ForgeRuntime,library=readLibrary(fileURLToPath(new URL('../assets/legacy/definitions/',import.meta.url))),find=id=>structuredClone(library.entries.find(e=>e.data.id===id).data);
const model=()=>find('example.crate'),anim=()=>find('animation.humanoid.walk');
async function load(d){const bytes=await compile(d,library);return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');}
test('all delivered definitions validate',()=>assert.deepEqual(validateLibrary(library),[]));
for(const [name,mutate,code] of [
 ['unknown property',d=>d.vertices=[], 'SCHEMA_INVALID'],
 ['duplicate part',d=>d.parts.push(structuredClone(d.parts[0])),'DUPLICATE_NODE'],
 ['unknown parent',d=>d.parts[0].parent='missing','UNKNOWN_PARENT'],
 ['parent cycle',d=>d.parts[0].parent='crate','CYCLIC_PARENT'],
 ['invalid primitive',d=>d.parts[0].shape.type='torus','SCHEMA_INVALID'],
 ['zero dimensions',d=>d.parts[0].shape.size[0]=0,'SCHEMA_INVALID'],
 ['negative scale',d=>d.parts[0].scale=-1,'SCHEMA_INVALID'],
 ['invalid material',d=>d.parts[0].material={roughness:2},'SCHEMA_INVALID'],
 ['unknown material',d=>d.parts[0].material='missing','UNKNOWN_MATERIAL'],
 ['prototype property is not a material',d=>d.parts[0].material='constructor','UNKNOWN_MATERIAL'],
 ['reserved asset node',d=>d.parts[0].id='Asset','DUPLICATE_NODE'],
 ['asset wrapper cannot be a parent',d=>d.parts[0].parent='Asset','UNKNOWN_PARENT'],
 ['material reference cycle',d=>{d.materials={a:'b',b:'a'};d.parts[0].material='a';},'MATERIAL_CYCLE'],
 ['invalid socket',d=>d.sockets=[{id:'muzzle',parent:'missing'}],'UNKNOWN_PARENT'],
 ['NaN',d=>d.parts[0].position[0]=NaN,'NON_FINITE'],
 ['Infinity',d=>d.parts[0].position[0]=Infinity,'NON_FINITE'],
 ['reserved binding punctuation',d=>d.parts[0].id='foo.bar','SCHEMA_INVALID'],
])test(`reject ${name}`,()=>{const d=model();mutate(d);const errors=validate(d);assert.ok(errors.some(e=>e.code===code),JSON.stringify(errors));assert.ok(errors.every(e=>e.file&&e.path&&e.description&&e.hint));});
test('forbid extra humanoid bones',()=>{const d=find('example.humanoid');d.bones={LowerArm_L:{}};assert.ok(validate(d).length);});
test('forbid overriding canonical bones with parts',()=>{const d=find('example.humanoid');d.parts=[{id:'Body',shape:{type:'sphere',radius:1}}];assert.ok(validate(d).some(e=>e.code==='DUPLICATE_NODE'));});
test('proportions must leave room for body',()=>{const d=find('example.humanoid');d.parameters.legLength=2;assert.ok(validate(d).length);});
test('signature depends on hierarchy and axis, not proportions',()=>{assert.notEqual(signature({...HIERARCHY,Head:'Root'}),signature());assert.notEqual(signature(HIERARCHY,'other'),signature());const a=buildModel(find('example.humanoid'),library),b=buildModel(find('example.humanoid.tall'),library);assert.equal(a.root.userData.rigSignature,b.root.userData.rigSignature);dispose(a.root);dispose(b.root);});
test('humanoid feet on ground, identity T-pose, exactly seven bones',()=>{for(const id of ['example.humanoid','example.humanoid.tall']){const {root}=buildModel(find(id),library);const bones=[];root.traverse(n=>{if(n.isBone)bones.push(n.name);});assert.deepEqual(bones.sort(),[...BONES].sort());assert.ok(Math.abs(new T.Box3().setFromObject(root).min.y)<1e-6);assert.ok(root.getObjectByName('Arm_L').position.x>0);dispose(root);}});
test('unknown bone, time order, duration and root motion rejected',()=>{const base=find('animation.humanoid.attack');for(const mutate of [d=>d.tracks.LowerArm_L=[{time:0,rotation:[0,0,0]}],d=>d.tracks.Arm_R[1].time=0,d=>d.tracks.Arm_R[1].time=2,d=>d.duration=0,d=>d.tracks.Root=[{time:0,position:[0,0,1]}],d=>d.tracks={},d=>d.rig='humanoid.v3']){const d=structuredClone(base);mutate(d);assert.ok(validate(d,'test',library).length);}});
test('pose and material references resolved, all primitives export',async()=>{for(const id of ['example.weapon','example.primitives','animation.humanoid.attack']){const gltf=await load(find(id));assert.ok(gltf.scene.children.length);dispose(gltf.scene);}});
test('invalid input cannot compile',async()=>{const d=model();d.parts[0].parent='missing';await assert.rejects(compile(d,library),/UNKNOWN_PARENT/);});
test('export is byte deterministic',async()=>assert.deepEqual(await compile(anim(),library),await compile(anim(),library)));
test('GLB metadata, sockets and hierarchy survive export',async()=>{const gltf=await load(find('example.weapon'));const socket=gltf.scene.getObjectByName('muzzle');assert.equal(socket.userData.socket,true);assert.equal(socket.parent.name,'barrel');assert.equal(R.metadata(gltf.scene).assetId,'example.weapon');dispose(gltf.scene);});
test('all generators emit mesh-free GLB with one looping clip',async()=>{for(const name of ['idle','walk','run']){const d=find(`animation.humanoid.${name}`),gltf=await load(d);assert.equal(gltf.animations.length,1);assert.ok(Math.abs(gltf.animations[0].duration-d.duration)<1e-6);let meshes=0;gltf.scene.traverse(n=>{if(n.isMesh)meshes++;});assert.equal(meshes,0);assert.equal(R.metadata(gltf.scene).loop,true);const keys=animationKeys(d,library);for(const frames of Object.values(keys)){assert.deepEqual(frames[0].rotation,frames.at(-1).rotation);if(frames[0].position)assert.deepEqual(frames[0].position,frames.at(-1).position);}assert.ok(!keys.Root);dispose(gltf.scene);}});
test('walking arms and legs swing in opposition',()=>{const tracks=animationKeys(anim(),library);assert.equal(tracks.Arm_L[12].rotation[0],-tracks.Arm_R[12].rotation[0]);assert.equal(tracks.Leg_L[12].rotation[0],-tracks.Leg_R[12].rotation[0]);});
test('mismatch and missing rig metadata fail closed',()=>{assert.ok(R.compatible(RIG_META,RIG_META));for(const field of Object.keys(RIG_META))assert.equal(R.compatible(RIG_META,{...RIG_META,[field]:'wrong'}),false);assert.equal(R.compatible({},{}),false);assert.equal(R.compatible(RIG_META,{}),false);});
test('retained height and reference pose after stopping reused animation',async()=>{const gltf=await load(find('example.humanoid.tall')),animation=await load(anim()),body=gltf.scene.getObjectByName('Body'),rest=body.position.clone(),arm=gltf.scene.getObjectByName('Arm_L'),restRotation=arm.quaternion.clone();const clip=R.prepareClip(animation.animations[0],gltf.scene,R.metadata(animation.scene),T),mixer=new T.AnimationMixer(gltf.scene);mixer.clipAction(clip).play();mixer.update(0.25);assert.ok(body.position.y>=rest.y-1e-6&&body.position.y<=rest.y+0.021);assert.ok(arm.quaternion.angleTo(restRotation)>0.1);mixer.stopAllAction();assert.ok(body.position.distanceTo(rest)<1e-6);assert.ok(arm.quaternion.angleTo(restRotation)<1e-6);dispose(gltf.scene);dispose(animation.scene);});
test('timeline duration preserved when final key precedes duration',async()=>{const d=find('animation.humanoid.attack');d.tracks={Head:[{time:0.2,rotation:[0,30,0]}]};const gltf=await load(d);assert.ok(Math.abs(gltf.animations[0].duration-0.8)<1e-6);dispose(gltf.scene);});
test('directory picker only recognizes logical output folders',()=>{assert.equal(R.classify('generated/models/a.glb'),'models');assert.equal(R.classify('generated/animations/w.anim.glb'),'animations');for(const p of ['generated/other/a.glb','generated/models/x.anim.glb','a.glb','generated/animations/a.glb'])assert.equal(R.classify(p),null);});
test('preview html uses only classic local scripts',()=>{const html=readFileSync(new URL('../previewer/index.html',import.meta.url),'utf8');assert.ok(!html.includes('type="module"'));assert.ok(!html.includes('https://'));assert.ok(html.includes('webkitdirectory'));});
