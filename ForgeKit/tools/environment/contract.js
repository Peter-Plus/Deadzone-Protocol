import Ajv from 'ajv';
import * as T from 'three';
import {environmentSchema} from './schema.js';
import {buildModel,dispose} from '../compiler/compile.js';
import {validateLibrary,formatErrors} from '../validator/validation.js';
import {routeCheck,surfaceAt,legalPoint} from './spatial.js';
import {terrainColor} from './terrain-color.js';
const check=new Ajv({allErrors:true}).compile(environmentSchema);
export function libraryFor(d){return {entries:[d.model,d.animation].filter(Boolean).map(data=>({file:d.id,data})),materials:new Map(),poses:new Map(),errors:[]};}
function requireThat(ok,message){if(!ok)throw new Error(message);}
function terrainData(d){
 const t=d.terrain;for(const n of t.size)requireThat(Number.isInteger(n/t.cell)&&n/t.cell>=2&&n/t.cell<=256,'terrain grid must have 2..256 cells per axis');
 const columns=Math.round(t.size[0]/t.cell)+1,rows=Math.round(t.size[1]/t.cell)+1,heights=[];
 const phase=(t.seed%997)/997*Math.PI*2;
 for(let z=0;z<rows;z++)for(let x=0;x<columns;x++){
  const px=x*t.cell-t.size[0]/2,pz=z*t.cell-t.size[1]/2;
  let y=t.amplitude*(Math.sin(px/t.wavelength+phase)+Math.cos(pz/t.wavelength-phase))*.5;
  if(t.landform){
   const r2=(px/(t.size[0]*.38))**2+(pz/(t.size[1]*.38))**2;
   const ripple=.07*(Math.sin(px/t.wavelength+phase)+Math.cos(pz/t.wavelength-phase));
   y=t.amplitude*(t.landform==='flat'?ripple:t.landform==='slope'?px/(t.size[0]/2)+ripple:(t.landform==='hill'?1:-1)*Math.exp(-2*r2)+ripple);
  }
  for(const p of t.platforms){const distance=Math.max(Math.abs(px-p.center[0])-p.size[0]/2,Math.abs(pz-p.center[1])-p.size[1]/2,0);const u=Math.min(1,distance/p.blend),smooth=u*u*(3-2*u);y=p.height+(y-p.height)*smooth;}
  if(t.edgeBlend){const distance=Math.min(t.size[0]/2-Math.abs(px),t.size[1]/2-Math.abs(pz));const u=Math.max(0,Math.min(1,(distance-t.cell)/t.edgeBlend));y*=u*u*(3-2*u);}
  heights.push(y);
 }
 return {...t,columns,rows,heights};
}
export function terrainGeometry(t){
 const points=[],indices=[];
 for(let z=0;z<t.rows;z++)for(let x=0;x<t.columns;x++)points.push(x*t.cell-t.size[0]/2,t.heights[z*t.columns+x],z*t.cell-t.size[1]/2);
 for(let z=0;z<t.rows-1;z++)for(let x=0;x<t.columns-1;x++){const a=z*t.columns+x,b=a+1,c=a+t.columns,d=c+1;indices.push(a,c,d,a,d,b);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setIndex(indices);g.computeVertexNormals();
 if(t.surface==='desert-mottled'){const colors=[];for(let i=0;i<points.length;i+=3)colors.push(...terrainColor(t,points[i],points[i+2],points[i+1]));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));}
 return g;
}
export function compileContract(d){
 requireThat(check(d),JSON.stringify(check.errors));
 requireThat(d.roofMode===undefined||d.type==='building','roofMode is building-only');
 requireThat(d.doors===undefined||d.type==='building','doors is building-only');
 if(d.doors){requireThat(new Set(d.doors.map(x=>x.id)).size===d.doors.length,'duplicate door instance');for(const door of d.doors)requireThat(d.exclusions.some(e=>e.id===door.pocket),'door pocket needs an exclusion');}
 requireThat(d.placement.min.every((n,i)=>n<d.placement.max[i]),'placement min/max reversed');
 for(const p of Object.values(d.profiles))requireThat(p.height>=p.radius*2,'profile height must cover capsule diameter');
 const {model,animation,terrain,...data}=d;
 const result={...data,modelAsset:`models/${d.id}.glb`,colliders:[],animationAsset:animation?`animations/${d.id}_Open.anim.glb`:null};
 if(d.type==='terrain'){
  requireThat(terrain&&!model&&!animation,'terrain requires terrain settings and forbids embedded model/animation');
  requireThat(!d.colliders.length&&!d.walkables.length&&!d.entrances.length&&!d.connectors.length&&!d.lootZones.length&&!d.gate,'terrain uses its generated heightfield only');
  requireThat(d.placement.min.every((n,i)=>n===-terrain.size[i]/2)&&d.placement.max.every((n,i)=>n===terrain.size[i]/2),'terrain reservation must match size');
  if(terrain.edgeBlend){requireThat(terrain.edgeBlend+terrain.cell<Math.min(...terrain.size)/2,'edge blend too wide');for(const p of terrain.platforms)requireThat(p.center.every((n,i)=>Math.abs(n)+p.size[i]/2+p.blend<=terrain.size[i]/2-terrain.edgeBlend-terrain.cell),'platform blend overlaps edge collar');}
  for(const p of terrain.platforms)requireThat(p.center.every((n,i)=>Math.abs(n)+p.size[i]/2+p.blend<=terrain.size[i]/2),'platform and blending apron must fit terrain');
  for(let i=0;i<terrain.platforms.length;i++)for(let j=i+1;j<terrain.platforms.length;j++){const a=terrain.platforms[i],b=terrain.platforms[j];requireThat(a.center.some((n,k)=>Math.abs(n-b.center[k])>=a.size[k]/2+b.size[k]/2+a.blend+b.blend),'platform blend areas overlap (v1)');}
  result.terrain=terrainData(d);const g=terrainGeometry(result.terrain),p=g.attributes.position;
  for(let i=0;i<g.index.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,g.index.getX(i)),b=new T.Vector3().fromBufferAttribute(p,g.index.getX(i+1)),c=new T.Vector3().fromBufferAttribute(p,g.index.getX(i+2));const n=b.sub(a).cross(c.sub(a)).normalize();requireThat(n.y>=Math.cos(terrain.maxSlopeDegrees*Math.PI/180)-1e-5,'terrain triangle exceeds max slope');}g.dispose();
 }else{
  requireThat(model?.type==='static'&&!terrain,'environment requires a static model');
  requireThat(!model.root||JSON.stringify(model.root)==='{}','v1 uses identity model root; transforms belong to placement');
  for(const p of [...(model.parts??[]),...(model.sockets??[])])requireThat(!p.scale||p.scale===1||Array.isArray(p.scale)&&p.scale.every(n=>n===1),'environment v1 uses explicit dimensions, not part scale');
  const library=libraryFor(d),errors=validateLibrary(library);requireThat(!errors.length,formatErrors(errors));
  const {root}=buildModel(model,library);
  try{
   const seen=new Set();for(const c of d.colliders){
    requireThat(!seen.has(c.node),'duplicate collider node');seen.add(c.node);
    const part=model.parts.find(p=>p.id===c.node),node=root.getObjectByName(c.node);
    requireThat(part?.shape.type==='box','collision nodes must be model box parts (v1)');
    const position=new T.Vector3(),quaternion=new T.Quaternion(),scale=new T.Vector3();node.matrixWorld.decompose(position,quaternion,scale);
    const n=new T.Vector3(0,1,0).applyQuaternion(quaternion);
    requireThat(['ramp','roof'].includes(c.role)||n.distanceTo(new T.Vector3(0,1,0))<1e-5,'non-ramp/roof colliders must be yaw-only');
    // Sloped roofs are conservative world AABBs for clearance queries and physics.
    if(c.role==='roof'){const box=new T.Box3().setFromObject(node);box.getCenter(position);box.getSize(scale);quaternion.identity();result.colliders.push({...c,position:position.toArray(),quaternion:quaternion.toArray(),size:scale.toArray()});}
    else result.colliders.push({...c,position:position.toArray(),quaternion:quaternion.toArray(),size:part.shape.size.map((n,i)=>n*scale.toArray()[i])});
   }
   const box=new T.Box3().setFromObject(root);result.bounds={min:box.min.toArray(),max:box.max.toArray()};
   requireThat(box.min.x>=d.placement.min[0]&&box.max.x<=d.placement.max[0]&&box.min.z>=d.placement.min[1]&&box.max.z<=d.placement.max[1],'visual asset exceeds placement reservation');
   for(const n of d.walkables)requireThat(result.colliders.some(c=>c.node===n&&['floor','ramp'].includes(c.role)),'walkable must reference a floor/ramp collider');
   if(d.type==='gate'){
    requireThat(d.gate&&animation?.rig==='nodes.v1'&&!animation.loop,'gate requires nodes.v1 one-shot animation');
    const gate=d.gate,leaf=model.parts.find(p=>p.id===gate.leaf);
    requireThat(result.colliders.some(c=>c.node===gate.leaf&&c.role==='moving')&&leaf&&!leaf.parent,'gate leaf must be a root-level moving box');
    requireThat(root.getObjectByName(gate.switchNode)?.userData.socket,'gate requires switch interaction socket');
    requireThat(gate.travel[1]===0&&gate.travel[2]===0&&gate.travel[0]!==0,'v1 gate slides along local X');
    const keys=animation.tracks[gate.leaf],start=leaf.position??[0,0,0];
    requireThat(animation.duration===gate.duration&&Object.keys(animation.tracks).length===1&&keys?.length===2,'gate uses two linear translation keys');
    requireThat(keys[0].time===0&&keys[1].time===gate.duration,'gate keys span full duration');
    for(let i=0;i<2;i++)requireThat(keys[i].position?.every((n,j)=>Math.abs(n-start[j]-gate.travel[j]*i)<1e-6)&&!keys[i].rotation&&!keys[i].scale,'gate animation and collision motion must match');
    const moving=result.colliders.find(c=>c.node===gate.leaf);
    for(const p of [0,1])requireThat(moving.position[0]+gate.travel[0]*p-moving.size[0]/2>=d.placement.min[0]&&moving.position[0]+gate.travel[0]*p+moving.size[0]/2<=d.placement.max[0],'gate movement exceeds reservation');
   }else requireThat(!animation&&!d.gate&&!d.colliders.some(c=>c.role==='moving'),'only gate type has motion in v1');
  }finally{dispose(root);}
 }
 const unique=(list,name)=>requireThat(new Set(list.map(v=>v.id)).size===list.length,`duplicate ${name} id`);
 for(const [list,name] of [[d.entrances,'entrance'],[d.routes,'route'],[d.lootZones,'loot zone'],[d.exclusions,'exclusion'],[d.connectors,'connector']])unique(list,name);
 for(const zone of [...d.lootZones,...d.exclusions]){
  requireThat(zone.min.every((n,i)=>n<zone.max[i]),'zone min/max reversed');
  requireThat(zone.min.every((n,i)=>n>=d.placement.min[i])&&zone.max.every((n,i)=>n<=d.placement.max[i]),'zone outside reservation');
 }
 if(d.type==='building'){
  requireThat(d.entrances.length>=1&&d.walkables.length&&d.routes.length&&d.lootZones.length&&d.exclusions.length,'building missing entrances/routes/loot/exclusions');
  for(const role of ['wall','floor'])requireThat(d.colliders.some(c=>c.role===role),`building missing ${role}`);
  const hasRoof=d.colliders.some(c=>c.role==='roof');
  requireThat(d.roofMode==='none'?!hasRoof:hasRoof,d.roofMode==='none'?'roofMode none forbids roof colliders':'building missing roof; declare roofMode none for a roofless building');
 }
 if(['barrier','gate'].includes(d.type))requireThat(d.connectors.length>=2,'barrier/gate requires end connectors');
 if(d.type!=='terrain')requireThat(d.colliders.length>0,'environment model requires collision declaration');
 if(['solid','barrier','gate'].includes(d.type))requireThat(!d.walkables.length&&!d.lootZones.length&&!d.entrances.length,'v1 solid/barrier/gate uses ground support and no interior loot/entrances');
 for(const c of d.connectors)requireThat(Math.abs(Math.hypot(...c.outward)-1)<1e-5&&c.outward[1]===0,'connector outward must be horizontal unit vector');
 for(const e of d.entrances){
  requireThat(e.profiles.length>0,'entrance needs supported profiles');
  for(const id of e.profiles){const p=d.profiles[id];requireThat(p,'unknown entrance profile');requireThat(e.width>=2*(p.radius+p.margin)&&e.height>=p.height,'entrance too small for profile');requireThat(routeCheck(result,[e.outer,e.inner],p,d.type==='gate'?1:0).ok,`blocked entrance ${e.id}/${id}`);}
 }
 result.checks=[];
 for(const r of d.routes){
  requireThat(r.profiles.length>0,'route needs profiles');
  for(const id of r.profiles){requireThat(d.profiles[id],'unknown route profile');const test=routeCheck(result,r.points,d.profiles[id],d.type==='gate'?1:0);requireThat(test.ok,`blocked route ${r.id}/${id}: ${JSON.stringify(test)}`);result.checks.push({route:r.id,profile:id,ok:true});}
 }
 for(const z of d.lootZones){
  requireThat(d.walkables.includes(z.surface),'loot zone needs walkable surface');
  for(const x of [z.min[0],(z.min[0]+z.max[0])/2,z.max[0]])for(const zz of [z.min[1],(z.min[1]+z.max[1])/2,z.max[1]]){requireThat(surfaceAt(result,x,zz)?.node===z.surface,'loot zone off its declared floor');requireThat(legalPoint(result,[x,0,zz],{radius:.1,margin:.01,height:.2,maxSlopeDegrees:15}),'loot zone sample intersects blocker');}
  requireThat(!d.exclusions.some(e=>z.min[0]<e.max[0]&&z.max[0]>e.min[0]&&z.min[1]<e.max[1]&&z.max[1]>e.min[1]),'loot overlaps exclusion');
 }
 if(d.type==='gate')for(const r of d.routes)for(const id of r.profiles)requireThat(!routeCheck(result,r.points,d.profiles[id],0).ok,'closed gate must block route');
 return result;
}
