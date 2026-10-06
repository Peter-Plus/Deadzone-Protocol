import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {createEffect,sampleValue} from '../tools/effects/runtime.js';
import {createSector} from '../tools/effects/sector.js';
import {validateEffect,parseEffectPackage} from '../tools/effects/validate.js';
import {compileEffect} from '../tools/effects/compile.js';
import {readLibrary} from '../tools/core/library.js';
const library=readLibrary(),entry=id=>library.entries.find(e=>e.data.id===id);
const rift=entry('vfx_chaos_rift_spikes');
test('fireball and soul seed are self-contained, model-free and persist until explicit destruction',()=>{
 for(const id of ['vfx_fire_fireball','vfx_chaos_soul_seed']){const e=entry(id),doc=parseEffectPackage(compileEffect(e.data,library,e.file).toString());
  assert.equal(doc.binding,undefined);assert.equal(doc.states.active.loop,true);assert.equal(doc.states.active.next,undefined);
  assert.ok(doc.layers.every(l=>l.kind==='cloud'));assert.ok(Object.values(doc.textures).every(t=>t.data.startsWith('data:image/png;base64,')));
 }
});
test('sector redistribution is deterministic, bounded and reusable over arbitrary angles and lengths',()=>{
 const root=new T.Group(),layer=rift.data.layers[0],sector=createSector(root,layer,sampleValue),geometry=root.children.map(m=>m.geometry);
 for(const angle of [1,10,45,60,120,180,240,359,360])for(const radius of [.1,1,6,16,100]){
  sector.configure(angle,radius);const layout=sector.layout();assert.ok(layout.points.length<=layer.capacity);
  for(const p of layout.points){const d=Math.hypot(p.x,p.z),a=Math.abs(Math.atan2(p.x,p.z));assert.ok(d+p.width*1.6<=radius+1e-8);assert.ok(a<=angle*Math.PI/360+1e-8);
   if(angle<180)assert.ok(Math.asin(Math.min(1,p.width*1.6/d))+a<=angle*Math.PI/360+1e-8);
   assert.ok(p.height>=layer.height[0]&&p.height<=layer.height[1]);}
 }
 sector.configure(60,8);const first=sector.layout();sector.configure(120,10);sector.configure(60,8);assert.deepEqual(sector.layout(),first);
 assert.deepEqual(root.children.map(m=>m.geometry),geometry);
 sector.sample('warning',.5,.625);assert.equal(root.children[0].visible,false);assert.equal(root.children[2].visible,true);
 sector.sample('erupt',.28,.28/1.55);assert.ok(root.children.every(m=>m.visible));
 const matrices=Array.from(root.children[0].instanceMatrix.array);sector.sample('erupt',1.3,1.3/1.55);sector.sample('erupt',.28,.28/1.55);assert.deepEqual(Array.from(root.children[0].instanceMatrix.array),matrices);
 sector.dispose();assert.equal(root.children.length,0);
});
test('rift preview and eruption are explicit states; bad sizes cannot corrupt current geometry',async()=>{
 const bytes=compileEffect(rift.data,library,rift.file).toString(),scene=new T.Scene(),e=await createEffect(bytes,{scene});
 e.seek(10);assert.equal(e.stats().state,'warning');e.setSector(45,6);e.setState('erupt');e.seek(.28);assert.equal(e.stats().visibleLayers,3);
 for(const [angle,radius]of [[0,6],[361,6],[45,0],[NaN,6],[45,Infinity]])assert.throws(()=>e.setSector(angle,radius));
 e.seek(2);assert.equal(e.stats().visibleLayers,0);e.seek(.28);assert.equal(e.stats().visibleLayers,3);e.clear();assert.equal(e.stats().visibleLayers,0);e.dispose();assert.equal(scene.children.length,0);
 for(const mutate of [d=>d.layers[0].angle=361,d=>d.layers[0].height=[3,1],d=>d.layers[0].capacity=257]){const bad=structuredClone(rift.data);mutate(bad);assert.ok(validateEffect(bad).length);}
});
