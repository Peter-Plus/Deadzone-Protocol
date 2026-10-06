import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {compileContract,terrainGeometry} from '../tools/environment/contract.js';
import {surfaceAt,legalPoint,transformContract,connectorsMatch} from '../tools/environment/spatial.js';
const root=new URL('../assets/FSA(项目使用)/',import.meta.url);
const read=p=>JSON.parse(readFileSync(new URL(p,root),'utf8'));
const definition=(batch,id)=>read(`definitions/environments/${batch}/${id}.environment.json`);
const contract=(batch,id)=>read(`generated/world/environments/${batch}/contracts/${id}.environment.json`);
async function model(batch,id){const b=readFileSync(new URL(`generated/world/environments/${batch}/models/${id}.glb`,root));return (await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;}
test('four production terrains: deterministic mesh, normals, ray heights, slope and shared flat border',async()=>{
 for(const kind of ['flat','slope','basin','hill']){
  const id='FSA_ENV_Desert_'+kind,d=definition('terrain',id),c=contract('terrain',id),t=c.terrain;
  assert.ok(compileContract(d).terrain.heights.every((v,i)=>v===t.heights[i]));
  const scene=await model('terrain',id);scene.updateMatrixWorld(true);let mesh;scene.traverse(n=>{if(n.isMesh)mesh=n;});const expected=terrainGeometry(t);
  for(const attr of ['position','normal','color'])assert.ok(mesh.geometry.attributes[attr].array.every((v,i)=>Math.abs(v-expected.attributes[attr].array[i])<1e-6),attr);assert.deepEqual(Array.from(mesh.geometry.index.array),Array.from(expected.index.array));
  const colors=mesh.geometry.attributes.color;
  for(let k=0;k<t.columns;k++)for(let j=0;j<3;j++){assert.equal(colors.array[k*3+j],colors.array[((t.rows-1)*t.columns+k)*3+j]);assert.equal(colors.array[(k*t.columns)*3+j],colors.array[(k*t.columns+t.columns-1)*3+j]);}
  const ray=new T.Raycaster();for(let z=-54.7;z<55;z+=7.37)for(let x=-54.3;x<55;x+=6.71){ray.set(new T.Vector3(x,20,z),new T.Vector3(0,-1,0));assert.ok(Math.abs(ray.intersectObject(scene,true)[0].point.y-surfaceAt(c,x,z).height)<1e-5);}
  for(let k=-56;k<=56;k++){for(const p of [[k,-56],[k,56],[-56,k],[56,k]]){const s=surfaceAt(c,...p);assert.equal(s.height,0);assert.ok(s.normal[0]===0&&s.normal[1]===1&&s.normal[2]===0);}}
  for(let z=-21;z<=23;z++)for(let x=-24;x<=24;x++)assert.equal(surfaceAt(c,x,z).height,t.platforms[0].height);
  const bad=structuredClone(d);bad.terrain.edgeBlend=40;assert.throws(()=>compileContract(bad),/overlaps edge/);
 }
});
test('both actual military reservations and entrance landings fit terrain platform, no raised entrance',()=>{
 const c=contract('terrain','FSA_ENV_Desert_hill'),p=c.terrain.platforms[0];
 for(const id of ['FSA_ENV_Military_01_CommandTraining','FSA_ENV_Military_02_TrainingHangar']){
  const d=definition('military',id),b=compileContract(d);
  for(let k=0;k<2;k++){assert.ok(b.placement.min[k]>=p.center[k]-p.size[k]/2);assert.ok(b.placement.max[k]<=p.center[k]+p.size[k]/2);}
  for(const e of b.entrances){assert.ok(Math.abs(surfaceAt(b,e.inner[0],e.inner[2]).height)<=.1);for(const point of [e.inner,e.outer])assert.equal(surfaceAt(c,point[0],point[2]).height,p.height);}
 }
});
test('transparent fence is continuously blocked for people and declared projectile volume',()=>{
 const c=contract('barriers','FSA_ENV_Quarantine_Straight'),d=definition('barriers',c.id);
 const panel=c.colliders.find(x=>x.node==='X_ContinuousBlocker');assert.deepEqual(panel.size,[6,2.8,.25]);
 assert.equal(d.model.materials.invisible.opacity,0);
 for(let x=-2.9;x<2.9;x+=.071)assert.equal(legalPoint(c,[x,0,0],c.profiles.player),false);
});
test('protected rectangle has matched seams and exactly four connector ends at two gate slots',()=>{
 const d=read('definitions/environments/barriers/FSA_REF_Protected_TwoGateSlots.assembly.json');
 const placed=d.instances.map(i=>transformContract(contract('barriers',i.asset),i.position,i.yaw*Math.PI/180));const connectors=placed.flatMap(c=>c.connectors);
 const ends=connectors.filter((a,i)=>!connectors.some((b,j)=>i!==j&&connectorsMatch(a,b)));assert.equal(ends.length,4);
 for(const g of d.gateSlots)for(const sign of [-1,1])assert.ok(ends.some(e=>Math.hypot(e.position[0]-g.center[0]-sign*g.width/2,e.position[2]-g.center[2])<1e-6));
 const c={...contract('barriers','FSA_ENV_Protected_Straight'),placement:{min:[-22,-16],max:[22,16]},colliders:placed.flatMap(p=>p.colliders)};
 for(const z of [-12,12])for(let x=-17.9;x<=17.9;x+=.1)if(Math.abs(x)>3.4)assert.equal(legalPoint(c,[x,0,z],c.profiles.player),false);
 for(const x of [-18,18])for(let z=-11.9;z<=11.9;z+=.1)assert.equal(legalPoint(c,[x,0,z],c.profiles.player),false);
 for(const g of d.gateSlots)assert.equal(legalPoint(c,g.center,c.profiles.A1),true);
});
