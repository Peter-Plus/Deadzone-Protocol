import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileContract} from '../tools/environment/contract.js';
import {assembleBuilding,validateAssembly} from '../tools/environment/assembly.js';
import {routeCheck} from '../tools/environment/spatial.js';
import {previewAssembly} from '../tools/environment/preview-assembly.js';
const root=new URL('../assets/FSA(项目使用)/definitions/environments/',import.meta.url);
const source=p=>JSON.parse(readFileSync(new URL(p,root),'utf8'));
const gate=compileContract(source('doors/FSA_ENV_Door_MilitarySlide.environment.json'));
for(const name of ['01_CommandTraining','02_TrainingHangar'])test('military assembly '+name+' opens each independent gate and preserves rotated pockets',()=>{
 const raw=source('military/FSA_ENV_Military_'+name+'.environment.json'),c=compileContract(raw),resolve=id=>id===gate.id?gate:undefined;
 const open=validateAssembly(c,resolve),closed=assembleBuilding(c,resolve),partial=assembleBuilding(c,resolve,{[c.doors[0].id]:1});
 for(const p of Object.values(c.profiles)){assert.ok(routeCheck(open,c.routes[0].points,p).ok);assert.equal(routeCheck(closed,c.routes[0].points,p).ok,false);assert.equal(routeCheck(partial,c.routes[0].points,p).ok,false);}
 assert.throws(()=>validateAssembly(c,()=>undefined),/Missing gate/);
 const bad=structuredClone(c);bad.exclusions.find(e=>e.id===c.doors[0].pocket).max=[0,0];assert.throws(()=>validateAssembly(bad,resolve),/pocket/);
 raw.doors.push(raw.doors[0]);assert.throws(()=>compileContract(raw),/duplicate door/);
});
test('protected perimeter preview keeps two animated doors separate from static walls',async()=>{
 const generated=new URL('../assets/FSA(项目使用)/generated/world/environments/doors/',import.meta.url);
 const manifest=JSON.parse(readFileSync(new URL('environment-manifest.json',generated),'utf8'));
 const assets=manifest.assets.map(a=>{const contract=JSON.parse(readFileSync(new URL(a.contract,generated),'utf8'));return {contract,model:readFileSync(new URL(contract.modelAsset,generated)).toString('base64')};});
 const def=source('doors/FSA_REF_Protected_TwoGates.assembly.json'),result=await previewAssembly(def,assets),c=result.contract,resolve=id=>assets.find(a=>a.contract.id===id)?.contract;
 assert.equal(c.previewOnly,true);assert.equal(c.doors.length,2);assert.ok(c.colliders.every(b=>b.role!=='moving'));
 for(const p of Object.values(c.profiles))for(const [progress,expected] of [[{},false],[{South:1},false],[{North:1},false],[{South:1,North:1},true]])assert.equal(routeCheck(assembleBuilding(c,resolve,progress),c.routes[0].points,p).ok,expected);
 const duplicate=structuredClone(def);duplicate.doors.push(duplicate.doors[0]);await assert.rejects(previewAssembly(duplicate,assets),/Duplicate/);
 const missing=structuredClone(def);missing.doors[0].asset='MissingGate';await assert.rejects(previewAssembly(missing,assets),/Missing gate/);
 const pocket=structuredClone(def);pocket.exclusions[0].max=[-20,-20];await assert.rejects(previewAssembly(pocket,assets),/pocket/);
});
