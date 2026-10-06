import test from 'node:test';
import assert from 'node:assert/strict';
import {readLibrary} from '../tools/core/library.js';
import {validateEffect,parseEffectPackage} from '../tools/effects/validate.js';
import {compileEffect} from '../tools/effects/compile.js';
const library=readLibrary(),entries=library.entries.filter(e=>e.data.schema==='effect.v1'&&e.data.binding?.attachment==='VFX_Anchor');
test('five projectile effects compile with static socket bindings and embedded textures',()=>{
 assert.equal(entries.length,5);assert.equal(new Set(entries.map(e=>e.data.binding.model)).size,5);
 for(const e of entries){assert.deepEqual(validateEffect(e.data,e.file,library),[]);assert.equal(e.data.binding.animation,undefined);
  const bytes=compileEffect(e.data,library,e.file),d=parseEffectPackage(bytes.toString());assert.ok(bytes.equals(compileEffect(e.data,library,e.file)));
  assert.equal(d.states.active.next,undefined);assert.equal(d.states.active.loop,true);assert.ok(Object.values(d.textures).every(t=>t.data.startsWith('data:image/png;base64,')));
 }
});
test('static bindings reject absent slots, wrong models and animation tracks without animation',()=>{
 for(const mutate of [d=>d.binding.attachment='MissingSlot',d=>d.binding.model='MissingModel',d=>d.binding.animation='MissingAnimation',d=>d.binding.animationStates={active:'time'}]){
  const bad=structuredClone(entries[0].data);mutate(bad);assert.ok(validateEffect(bad,'invalid',library).length);
 }
});
