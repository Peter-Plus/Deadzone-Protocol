import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {compileContract,terrainGeometry} from '../tools/environment/contract.js';
import {routeCheck,surfaceAt,transformContract,connectorsMatch,gateColliders} from '../tools/environment/spatial.js';
import '../previewer/runtime.js';
const root=new URL('../assets/environment-samples/',import.meta.url),R=globalThis.ForgeRuntime;
const source=id=>JSON.parse(readFileSync(new URL(`definitions/ENV_${id}.environment.json`,root),'utf8'));
async function load(relative){const b=readFileSync(new URL('generated/'+relative,root));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
test('all five sample contracts compile and route profiles pass',()=>{for(const name of ['Terrain','Building','Solid','Barrier','Gate']){const c=compileContract(source(name));assert.ok(c.modelAsset);assert.equal(c.type,name.toLowerCase());}});
test('roofless buildings are explicit, partial roofs remain physical, legacy defaults stay strict',()=>{
 const d=source('Building'),roofIds=new Set(d.colliders.filter(c=>c.role==='roof').map(c=>c.node));
 d.model.parts=d.model.parts.filter(p=>!roofIds.has(p.id));d.colliders=d.colliders.filter(c=>c.role!=='roof');
 assert.throws(()=>compileContract(d),/missing roof/);d.roofMode='none';assert.equal(compileContract(d).roofMode,'none');
 d.roofMode='partial';assert.throws(()=>compileContract(d),/missing roof/);
 const partial=source('Building');partial.roofMode='partial';assert.equal(compileContract(partial).roofMode,'partial');
 partial.roofMode='none';assert.throws(()=>compileContract(partial),/forbids roof/);
 const solid=source('Solid');solid.roofMode='none';assert.throws(()=>compileContract(solid),/building-only/);
});
test('bad building declarations are rejected before export',()=>{
 for(const change of [d=>d.extra=1,d=>d.colliders[0].node='NoNode',d=>d.walkables.push('RoofLeft'),d=>d.entrances[0].width=.5,d=>d.model.parts.find(p=>p.id==='Partition').position[0]=0,d=>d.lootZones[0].max[0]=0,d=>d.routes[0].points[0]=[6.9,0,0],d=>d.model.root={scale:[1,2,1]},d=>d.profiles.player.height=.1,d=>d.lootZones[0].surface='missing']){
  const d=source('Building');change(d);assert.throws(()=>compileContract(d));
 }
});
test('gate animation and collisions cannot diverge or open outside reserved space',()=>{
 for(const change of [d=>d.animation.tracks.Leaf[1].position[0]=20,d=>d.gate.duration=10,d=>d.gate.onlyOpen=false,d=>d.gate.switchNode='Leaf',d=>d.gate.travel=[0,5,0],d=>d.placement.max[0]=8]){const d=source('Gate');change(d);assert.throws(()=>compileContract(d));}
});
test('terrain is deterministic and GLB triangles match heightfield support (no bilinear mismatch)',async()=>{
 const d=source('Terrain'),a=compileContract(d),b=compileContract(d);assert.deepEqual(a.terrain.heights,b.terrain.heights);
 d.terrain.seed++;assert.notDeepEqual(a.terrain.heights,compileContract(d).terrain.heights);
 const m=await load('models/ENV_Terrain.glb');let mesh;m.scene.traverse(n=>{if(n.isMesh)mesh=n;});const g=terrainGeometry(a.terrain);assert.equal(mesh.geometry.attributes.position.count,g.attributes.position.count);
 assert.deepEqual(Array.from(mesh.geometry.index.array),Array.from(g.index.array));
 const ray=new T.Raycaster();for(let z=-22.7;z<23;z+=3.17)for(let x=-22.4;x<23;x+=2.71){ray.set(new T.Vector3(x,20,z),new T.Vector3(0,-1,0));m.scene.updateMatrixWorld(true);const hit=ray.intersectObject(m.scene,true)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-surfaceAt(a,x,z).height)<1e-5);}
 d.terrain.amplitude=20;assert.throws(()=>compileContract(d));g.dispose();
});
test('building has a 10cm floor without external ramps; larger entrance steps fail',()=>{
 const c=compileContract(source('Building'));assert.equal(surfaceAt(c,0,0).height,.1);assert.equal(surfaceAt(c,0,6.5).height,0);assert.equal(c.colliders.some(n=>n.role==='ramp'),false);
 for(const p of Object.values(c.profiles)){assert.equal(routeCheck(c,c.routes[0].points,p).ok,true);assert.equal(routeCheck(c,[[0,.1,0],[6,.1,0]],p).ok,false);}
 const d=source('Building'),floor=d.model.parts.find(p=>p.id==='Floor');floor.shape.size[1]=.2;floor.position[1]=.1;assert.throws(()=>compileContract(d),/blocked entrance/);
});
test('all spatial annotations share placement transform, without mutating source',()=>{
 const c=compileContract(source('Building')),copy=structuredClone(c),world=transformContract(c,[20,3,-10],Math.PI/2);
 assert.deepEqual(c,copy);assert.ok(Math.abs(world.entrances[0].outer[0]-29.5)<1e-6);assert.equal(world.lootZones.length,2);assert.equal(world.exclusions.length,3);assert.equal(world.reservation.length,4);
 const b=compileContract(source('Barrier')),connector=b.connectors[0];assert.ok(connectorsMatch(connector,{...connector,outward:[1,0,0]}));assert.equal(connectorsMatch(connector,{...connector,position:[-3.1,0,0],outward:[1,0,0]}),false);
});
test('actual gate GLB animation matches moving collider throughout, holds end, isolates instances',async()=>{
 const c=compileContract(source('Gate')),a=await load(c.animationAsset),m=await load(c.modelAsset),other=await load(c.modelAsset);
 assert.equal(R.compatibility(R.metadata(m.scene),R.metadata(a.scene)),'exact');const mixer=new T.AnimationMixer(m.scene),action=mixer.clipAction(a.animations[0]);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;
 let firstPass=null;
 for(let i=0;i<=100;i++){
  const u=i/100;action.reset().play();mixer.setTime(c.gate.duration*u);m.scene.updateMatrixWorld(true);const leaf=m.scene.getObjectByName(c.gate.leaf).getWorldPosition(new T.Vector3()),col=gateColliders(c,u).find(x=>x.node===c.gate.leaf);assert.ok(leaf.distanceTo(new T.Vector3(...col.position))<1e-5);
  if(firstPass===null&&routeCheck(c,c.routes[0].points,c.profiles.B2,u).ok)firstPass=u;
 }
 assert.ok(firstPass>.5&&firstPass<1);mixer.update(10);assert.equal(m.scene.getObjectByName('Leaf').position.x,6.5);assert.equal(other.scene.getObjectByName('Leaf').position.x,0);
 assert.equal(routeCheck(c,c.routes[0].points,c.profiles.player,0).ok,false);assert.equal(routeCheck(c,c.routes[0].points,c.profiles.B2,1).ok,true);
});
