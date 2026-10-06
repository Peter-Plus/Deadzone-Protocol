import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {createEffect} from '../tools/effects/runtime.js';
import {compileContract} from '../tools/environment/contract.js';
const root=new URL('../assets/FSA(项目使用)/',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
test('Boundary is open cylinder at radius one, stands on ground, persists and reverses after ending',async()=>{
 const scene=new T.Scene(),fx=await createEffect(read('generated/effects/arena/vfx_arena_boundary.vfx'),{scene});
 const mesh=fx.root.children[0];mesh.geometry.computeBoundingBox();const box=mesh.geometry.boundingBox;
 assert.ok(Math.abs(box.min.y)<1e-6);assert.ok(Math.abs(box.max.y-1)<1e-6);assert.equal(mesh.geometry.parameters.openEnded,true);
 fx.root.scale.set(12,5,12);fx.seek(60);assert.equal(fx.stats().state,'active');assert.equal(fx.stats().visibleLayers,1);
 fx.setState('dissolve');fx.seek(2);assert.equal(fx.stats().visibleLayers,0);fx.seek(.2);assert.equal(fx.stats().visibleLayers,1);
 fx.dispose();assert.equal(scene.children.length,0);
});
test('Six spike solids have collision references and bounded placement',()=>{
 for(let i=1;i<=6;i++){const d=read('definitions/environments/arena/FSA_ENV_Arena_Spikes_0'+i+'.environment.json'),c=compileContract(d);
 assert.ok(c.colliders.length>=12);assert.ok(d.model.parts.filter(x=>x.id.startsWith('Spike_')).length>=3);
 for(const collider of d.colliders)assert.equal(d.model.parts.find(x=>x.id===collider.node).shape.type,'box');}
});
