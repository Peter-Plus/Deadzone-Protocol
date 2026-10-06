import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {readLibrary} from '../tools/core/library.js';
import {validateEffect,parseEffectPackage} from '../tools/effects/validate.js';
import {compileEffect} from '../tools/effects/compile.js';
import {sampleValue} from '../tools/effects/runtime.js';
import {createCloud} from '../tools/effects/cloud.js';
const library=readLibrary(),entries=library.entries.filter(e=>e.data.id?.startsWith('vfx_shadow_phantom_'));
test('three shadow assets are standalone data packages with no reference model',()=>{
  assert.equal(entries.length,3);
  for(const e of entries){assert.deepEqual(validateEffect(e.data,e.file,library),[]);assert.equal(e.data.binding,undefined);
    const bytes=compileEffect(e.data,library,e.file),d=parseEffectPackage(bytes.toString());assert.ok(bytes.equals(compileEffect(e.data,library,e.file)));
    assert.ok(Object.values(d.textures).every(t=>t.data.startsWith('data:image/png;base64,')));
  }
  for(const change of [d=>d.layers[0].texture='missing',d=>d.layers[0].radii[0]=0,d=>d.layers[0].size=[2,1],d=>d.layers[0].count=257,d=>d.layers[0].shell=2]){
    const d=structuredClone(entries[0].data);change(d);assert.ok(validateEffect(d,'invalid',library).length);
  }
});
test('clouds deterministically seek, follow local parent transforms, expire and release owned geometry',()=>{
  for(const {data} of entries){
    const parent=new T.Group(),copy=new T.Group(),texture=new T.Texture(),state=data.initialState,duration=data.states[state].duration;
    const layers=data.layers.map(l=>createCloud(parent,l,texture,sampleValue));
    const duplicates=data.layers.map(l=>createCloud(copy,l,texture,sampleValue));
    for(let i=0;i<layers.length;i++)assert.deepEqual(parent.children[i].geometry.attributes.center.array,copy.children[i].geometry.attributes.center.array);
    layers.forEach(l=>l.sample(state,duration*.4,.4));assert.ok(parent.children.every(m=>m.visible));
    const values=parent.children.map(m=>m.material.uniforms.opacity.value);
    layers.forEach(l=>l.sample(state,duration*.8,.8));layers.forEach(l=>l.sample(state,duration*.4,.4));assert.deepEqual(parent.children.map(m=>m.material.uniforms.opacity.value),values);
    parent.position.set(3,2,1);parent.updateMatrixWorld(true);assert.deepEqual(parent.children[0].getWorldPosition(new T.Vector3()).toArray(),[3,2,1]);
    layers.forEach(l=>l.sample('finished',0,0));assert.ok(parent.children.every(m=>!m.visible));
    let disposed=0;parent.children.forEach(m=>m.geometry.addEventListener('dispose',()=>disposed++));layers.forEach(l=>l.dispose());assert.equal(disposed,data.layers.length);assert.equal(parent.children.length,0);
    duplicates.forEach(l=>l.dispose());texture.dispose();
  }
});
