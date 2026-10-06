import {transformContract,gateColliders,routeCheck} from './spatial.js';
import {Vector3,Quaternion} from 'three';
export function assembleBuilding(building,resolve,progress={}){
 const colliders=[...building.colliders];
 for(const door of building.doors??[]){
  const c=resolve(door.asset);if(!c||c.type!=='gate')throw new Error(`Missing gate dependency ${door.asset}`);
  const placed=transformContract({...c,colliders:gateColliders(c,progress[door.id]??0)},door.position,door.yaw*Math.PI/180);
  colliders.push(...placed.colliders.map(b=>({...b,node:door.id+'/'+b.node})));
 }
 return {...building,colliders};
}
export function validateAssembly(building,resolve){
 const opened=Object.fromEntries((building.doors??[]).map(d=>[d.id,1])),assembled=assembleBuilding(building,resolve,opened);
 for(const door of building.doors??[]){const gate=resolve(door.asset),pocket=building.exclusions.find(e=>e.id===door.pocket),leaf=assembled.colliders.find(c=>c.node===door.id+'/'+gate.gate.leaf);for(const x of [-1,1])for(const z of [-1,1]){const p=new Vector3(x*leaf.size[0]/2,0,z*leaf.size[2]/2).applyQuaternion(new Quaternion(...leaf.quaternion)).add(new Vector3(...leaf.position));if(p.x<pocket.min[0]||p.x>pocket.max[0]||p.z<pocket.min[1]||p.z>pocket.max[1])throw new Error('Open leaf outside declared pocket');}}
 for(const c of assembled.colliders.slice(building.colliders.length)){
  // Authored instances here are orthogonal; conservative radial bound also supports other yaw values.
  const r=Math.hypot(c.size[0],c.size[2])/2;
  if(c.position[0]-r<building.placement.min[0]||c.position[0]+r>building.placement.max[0]||c.position[2]-r<building.placement.min[1]||c.position[2]+r>building.placement.max[1])throw new Error('Door exceeds building reservation');
 }
 for(const route of building.routes)for(const id of route.profiles){const check=routeCheck(assembled,route.points,building.profiles[id]);if(!check.ok)throw new Error(`Assembled route ${route.id}/${id}: ${JSON.stringify(check)}`);}
 return assembled;
}
