import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as T from 'three';
import {createEffect,sampleValue} from '../tools/effects/runtime.js';import {validateEffect} from '../tools/effects/validate.js';
T.TextureLoader.prototype.loadAsync=async()=>new T.Texture();
const names=['magic_bolt','demon_aura','body_charge','hell_hand','hell_eye_blast','hell_eye_charge','pursuit_horizontal','pursuit_vertical','pursuit_final','pursuit_teleport'];
const read=n=>JSON.parse(fs.readFileSync('assets/FSA(项目使用)/generated/effects/chaos/vfx_chaos_'+n+'.vfx'));
test('chaos effects are persistent or finite as specified, independently stoppable and reversible',async()=>{
 for(const name of names){const scene=new T.Scene(),e=await createEffect(read(name),{scene});
  if(e.data.states.active){e.setState('active');e.seek(120);assert.equal(e.stats().state,'active');assert.ok(e.stats().visibleLayers>0);e.setState('dissipate');}
  e.seek(3);assert.equal(e.stats().visibleLayers,0,name);e.seek(.2);assert.ok(e.stats().visibleLayers>0,name);e.clear();assert.equal(e.stats().visibleLayers,0);e.show();assert.ok(e.stats().visibleLayers>0);e.dispose();assert.equal(scene.children.length,0);
 }
});
test('suction resizes atomically without resetting time or allocating geometry',async()=>{
 const e=await createEffect(read('hell_hand'),{scene:new T.Scene()}),streams=e.root.children.filter(m=>m.material.uniforms.radius),geos=streams.map(m=>m.geometry);
 e.seek(1.2);for(const [a,r]of [[1,.1],[75,9],[180,16],[360,50]]){e.setSector(a,r);assert.equal(e.stats().time,1.2);for(const m of streams){assert.equal(m.material.uniforms.radius.value,r);assert.equal(m.material.uniforms.angle.value,a*Math.PI/180);}}
 for(const args of [[0,1],[361,1],[90,0],[NaN,1],[90,Infinity]])assert.throws(()=>e.setSector(...args));
 assert.equal(streams[0].material.uniforms.radius.value,50);assert.deepEqual(streams.map(m=>m.geometry),geos);
 e.clear();e.setSector(75,9);assert.equal(e.stats().visibleLayers,0);e.dispose();assert.throws(()=>e.setSector(75,9));
});
test('slash planes are distinct, final geometry is exactly 1.5 times vertical',async()=>{
 const effects=await Promise.all(['pursuit_horizontal','pursuit_vertical','pursuit_final'].map(n=>createEffect(read(n),{scene:new T.Scene()})));
 const [h,v,f]=effects.map(e=>e.root.children[0].geometry.attributes.position);
 for(let i=0;i<h.count;i++){assert.equal(h.getY(i),0);assert.equal(v.getX(i),0);assert.ok(Math.abs(v.getY(i)*1.5-f.getY(i))<1e-6);assert.ok(Math.abs(v.getZ(i)*1.5-f.getZ(i))<1e-6);}
 effects.forEach(e=>e.dispose());
});
test('upward soul eruption changes height with dispersed rise, backwards seek restores it',async()=>{
 const e=await createEffect(read('hell_eye_blast'),{scene:new T.Scene()});e.seek(.1);const low=e.root.children[0].material.uniforms.rise.value;e.seek(.8);assert.ok(e.root.children[0].material.uniforms.rise.value>low);assert.equal(e.root.children[0].material.uniforms.riseSpread.value,.85);e.seek(.1);assert.equal(e.root.children[0].material.uniforms.rise.value,low);e.dispose();
 const def=read('demon_aura').effect,p=def.layers[0].profiles.transform;assert.ok(sampleValue(p.expansion,1,1)>sampleValue(p.expansion,0,0));assert.equal(def.states.transform.next,'active');
 const bad=read('hell_hand').effect;bad.layers[0].texture='absent';assert.ok(validateEffect(bad).length);
});
