import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { readLibrary } from '../tools/core/library.js';
import { validateEffect, parseEffectPackage } from '../tools/effects/validate.js';
import { compileEffect } from '../tools/effects/compile.js';
import { createEffect, sampleValue } from '../tools/effects/runtime.js';
import '../previewer/runtime.js';
import '../assets/FSA(项目使用)/definitions/effects/world/interactables/InteractableFeedback.js';
const library=readLibrary(), entries=library.entries.filter(e=>e.data.schema==='effect.v1');
const blood=entries.find(e=>e.data.id==='vfx_hit_blood_low'),altar=entries.find(e=>e.data.id==='vfx_altar_feedback');
const packaged=e=>JSON.parse(compileEffect(e.data,library,e.file));
async function glb(file){const b=fs.readFileSync(`assets/FSA(项目使用)/generated/${file}`);return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
test('VFX source validation rejects misspellings, missing refs, executable fields, bad curves, cycles and oversized pools',()=>{
  for(const e of entries)assert.deepEqual(validateEffect(e.data,e.file,library),[]);
  for(const mutate of [d=>d.code='alert(1)',d=>d.initialState='missing',d=>d.layers[0].texture='missing',d=>d.layers[0].speed=[3,1],d=>d.layers[0].count=256,d=>d.layers[0].capacity=999,d=>d.layers[0].gravity=Infinity,d=>d.layers[0].profiles.impact.strength={keys:[[0,0],[0,1]],interpolation:'linear'},d=>d.states.impact.next='impact']){
    const data=structuredClone(blood.data);mutate(data);assert.ok(validateEffect(data,'bad',library).length);
  }
  for(const mutate of [d=>d.binding.model='missing',d=>d.binding.attachment='missing',d=>d.binding.animation='missing',d=>d.layers[2].prefixes=['missing'],d=>d.binding.animationStates.unknown='time']){
    const data=structuredClone(altar.data);mutate(data);assert.ok(validateEffect(data,'bad',library).length);
  }
});
test('VFX compiles deterministically into one self-contained file and disallows external texture paths',()=>{
  for(const e of entries){const a=compileEffect(e.data,library,e.file),b=compileEffect(e.data,library,e.file);assert.ok(a.equals(b));assert.equal(parseEffectPackage(a.toString()).id,e.data.id);}
  const data=structuredClone(blood.data);data.textures.drop.source='../escape.png';assert.throws(()=>compileEffect(data,library,blood.file),/inside/);
  const p=packaged(blood);assert.ok(p.effect.textures.drop.data.startsWith('data:image/png;base64,iVBOR'));
  p.effect.textures.drop={source:'http://example.org/texture.png'};assert.throws(()=>parseEffectPackage(p),/embed/);
});
test('curves sample analytically and seek is independent of frame partition',()=>{
  assert.equal(sampleValue({keys:[[0,0],[1,1]],interpolation:'smooth'},0,.5),.5);
  assert.equal(sampleValue({wave:'sinSquared',domain:'normalized',frequency:.5,phase:0,amplitude:2,bias:.5},0,.5),2.5);
});
test('altar generic tracks match accepted controller for both elements; restore, seek, independent instances and disposal',async()=>{
  const model=await glb('models/world/interactables/FSA_WORLD_EnchantAltar.glb'),animation=await glb('animations/world/interactables/FSA_ANIM_EnchantAltar_Enchant.anim.glb');
  const scene=new T.Scene(), packageData=packaged(altar);
  const first=model.scene.clone(true),second=model.scene.clone(true),oldModel=model.scene.clone(true);
  const original=first.getObjectByName('CrystalUpper').material;
  const fx=await createEffect(packageData,{scene,model:first}),other=await createEffect(packageData,{scene,model:second});
  const old=globalThis.ForgeInteractables.create(oldModel,animation.animations[0],globalThis.ForgeRuntime.metadata(animation.scene),JSON.parse(fs.readFileSync('assets/FSA(项目使用)/definitions/effects/world/interactables/AltarFeedback.json')),T,globalThis.ForgeRuntime);
  for(const variant of ['fire','poison'])for(const state of ['sealed','unlocking','enchanting','available','exhausted'])for(const t of [0,.12,.3]){
    fx.setState(state,variant);fx.seek(t);
    if(state==='sealed'||state==='unlocking'){old.setState('sealed_'+variant);if(state==='unlocking')old.unlockSeal();old.update(t);}
    else if(state==='enchanting'){old.play(variant);old.seek(t);}
    else old.setState(state,variant);
    const newMat=first.getObjectByName('CrystalUpper').material,oldMat=oldModel.getObjectByName('CrystalUpper').material;
    assert.ok(newMat.color.distanceTo?newMat.color.distanceTo(oldMat.color)<1e-6:newMat.color.equals(oldMat.color));
    assert.ok(newMat.emissive.equals(oldMat.emissive));assert.ok(Math.abs(newMat.emissiveIntensity-oldMat.emissiveIntensity)<1e-6);
    if(['sealed','unlocking','enchanting'].includes(state)){
      const mesh=fx.root.getObjectByName(variant+'_orbit'),oldMesh=oldModel.getObjectByName('AltarFX').children.find(c=>c.userData.kind===variant);
      const matrix=new T.Matrix4();mesh.getMatrixAt(0,matrix);const p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3();matrix.decompose(p,q,s);
      if(mesh.visible){assert.ok(p.distanceTo(oldMesh.position)<1e-6);assert.ok(Math.abs(s.x-oldMesh.scale.x)<1e-6);assert.ok(Math.abs(mesh.material.opacity-oldMesh.material.opacity)<1e-6);}
    }
  }
  fx.setState('enchanting','fire');for(let i=0;i<24;i++)fx.update(.1);assert.equal(fx.stats().state,'exhausted');
  fx.seek(1.2);assert.equal(fx.stats().state,'enchanting');assert.equal(first.getObjectByName('CrystalUpper').material.emissiveIntensity,2.5);
  assert.equal(other.stats().state,'available');assert.notEqual(first.getObjectByName('CrystalUpper').material,second.getObjectByName('CrystalUpper').material);
  fx.setState('unlocking','poison');fx.update(.65);assert.equal(fx.stats().state,'unlocked');
  fx.dispose();fx.dispose();assert.equal(first.getObjectByName('CrystalUpper').material,original);assert.equal(fx.root.parent,null);
  other.dispose();old.dispose();
  await assert.rejects(()=>createEffect(packageData,{scene,model:new T.Group()}),/Expected model/);
});
