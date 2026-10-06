// Browser-safe, shared by validator and preview. No DOM or physics engine dependency.
import {Vector3,Quaternion,Matrix4} from 'three';
const v=a=>new Vector3(...a);
// Approved ordinary-building envelope; physics probe height is not an art allowance.
export const BUILDING_TRAVERSAL={stepUp:.10,stepDown:.20,physicsStep:.22,minLanding:.25,snap:.24};
export function matrix(c){return new Matrix4().compose(v(c.position),new Quaternion(...c.quaternion),v([1,1,1]));}
export function gateColliders(contract,progress=0){
 const p=Math.max(0,Math.min(1,progress));
 return contract.colliders.map(c=>c.node===contract.gate?.leaf?{...c,position:c.position.map((n,i)=>n+contract.gate.travel[i]*p)}:c);
}
export function surfaceAt(contract,x,z){
 if(contract.terrain)return terrainSupport(contract.terrain,x,z);
 let best=null;
 for(const node of contract.walkables){
  const c=contract.colliders.find(c=>c.node===node),m=matrix(c),n=v([0,1,0]).applyQuaternion(new Quaternion(...c.quaternion));
  const top=v([0,c.size[1]/2,0]).applyMatrix4(m);
  if(n.y<=.01)continue;
  const y=top.y-(n.x*(x-top.x)+n.z*(z-top.z))/n.y;
  const local=v([x,y,z]).applyMatrix4(m.clone().invert());
  if(Math.abs(local.x)<=c.size[0]/2+1e-6&&Math.abs(local.z)<=c.size[2]/2+1e-6&&(!best||y>best.height))best={height:y,normal:n.toArray(),node};
 }
 // A flat placement platform is a documented test fixture, not generated game terrain.
 return best??{height:0,normal:[0,1,0],node:'placement-platform'};
}
export function terrainSupport(t,x,z){
 const fx=(x+t.size[0]/2)/t.cell,fz=(z+t.size[1]/2)/t.cell;
 if(fx<0||fz<0||fx>t.columns-1||fz>t.rows-1)return null;
 const ix=Math.min(t.columns-2,Math.floor(fx)),iz=Math.min(t.rows-2,Math.floor(fz)),u=fx-ix,w=fz-iz,k=iz*t.columns+ix;
 const a=t.heights[k],b=t.heights[k+1],c=t.heights[k+t.columns],d=t.heights[k+t.columns+1];
 const dx=u>=w?b-a:d-c,dz=u>=w?d-b:c-a;
 return {height:u>=w?a+(b-a)*u+(d-b)*w:a+(d-c)*u+(c-a)*w,normal:v([-dx/t.cell,1,-dz/t.cell]).normalize().toArray(),node:'terrain'};
}
export function legalPoint(contract,point,profile,progress=0){
 const [x,,z]=point,r=profile.radius+profile.margin,s=surfaceAt(contract,x,z);
 if(!s||s.normal[1]<Math.cos(profile.maxSlopeDegrees*Math.PI/180)-1e-6)return false;
 if(x-r<contract.placement.min[0]||x+r>contract.placement.max[0]||z-r<contract.placement.min[1]||z+r>contract.placement.max[1])return false;
 // Require support across the footprint, not just under the centre (ramp edges).
 for(const [dx,dz] of [[r,0],[-r,0],[0,r],[0,-r]]){
  const q=surfaceAt(contract,x+dx,z+dz);
  const limit=contract.type==='building'&&q?.node!==s.node?Math.max(BUILDING_TRAVERSAL.stepUp,BUILDING_TRAVERSAL.stepDown):r*Math.tan(profile.maxSlopeDegrees*Math.PI/180)+.015;
  if(!q||Math.abs(q.height-s.height)>limit+1e-6)return false;
 }
 for(const c of gateColliders(contract,progress)){
  if(contract.walkables.includes(c.node))continue;
  const inv=matrix(c).invert();
  // Static blockers and sliding gates are yaw-only by contract. Exact circle vs OBB in XZ.
  const q=v([x,s.height,z]).applyMatrix4(inv),low=-c.size[1]/2,high=c.size[1]/2;
  if(q.y>=high-.01||q.y+profile.height<=low+.01)continue;
  const dx=Math.max(0,Math.abs(q.x)-c.size[0]/2),dz=Math.max(0,Math.abs(q.z)-c.size[2]/2);
  if(dx*dx+dz*dz<r*r)return false;
 }
 return true;
}
export function routeCheck(contract,points,profile,progress=0){
 for(let i=1;i<points.length;i++){
  const a=v(points[i-1]),b=v(points[i]),length=a.distanceTo(b),steps=Math.max(1,Math.ceil(length/.08));let previous;
  for(let j=0;j<=steps;j++){
   const p=a.clone().lerp(b,j/steps).toArray(),s=surfaceAt(contract,p[0],p[2]);
   if(!legalPoint(contract,p,profile,progress))return {ok:false,point:p,reason:'clearance/support'};
   if(previous){const delta=s.height-previous.height,limit=contract.type==='building'&&s.node!==previous.node?(delta>=0?BUILDING_TRAVERSAL.stepUp:BUILDING_TRAVERSAL.stepDown):length/steps*Math.tan(profile.maxSlopeDegrees*Math.PI/180)+.005;
    if(Math.abs(delta)>limit+1e-6)return {ok:false,point:p,reason:'step/slope'};}
   previous=s;
  }
 }
 return {ok:true};
}
export function transformContract(c,position=[0,0,0],yaw=0){
 const q=new Quaternion().setFromAxisAngle(v([0,1,0]),yaw),point=p=>v(p).applyQuaternion(q).add(v(position)).toArray();
 const polygon=(zone,y=0)=>[zone.min,[zone.max[0],zone.min[1]],zone.max,[zone.min[0],zone.max[1]]].map(([x,z])=>point([x,y,z]));
 return {colliders:c.colliders.map(b=>({...b,position:point(b.position),quaternion:q.clone().multiply(new Quaternion(...b.quaternion)).toArray()})),entrances:c.entrances.map(e=>({...e,inner:point(e.inner),outer:point(e.outer)})),routes:c.routes.map(r=>({...r,points:r.points.map(point)})),reservation:polygon(c.placement),lootZones:c.lootZones.map(z=>({id:z.id,surface:z.surface,polygon:polygon(z,surfaceAt(c,...z.min).height)})),exclusions:c.exclusions.map(z=>({id:z.id,polygon:polygon(z)})),connectors:c.connectors.map(k=>({...k,position:point(k.position),outward:v(k.outward).applyQuaternion(q).toArray()})),gate:c.gate?{...c.gate,travel:v(c.gate.travel).applyQuaternion(q).toArray()}:null};
}
export function connectorsMatch(a,b,tolerance=.01){return v(a.position).distanceTo(v(b.position))<=tolerance&&v(a.outward).dot(v(b.outward))<-.999&&Math.abs(a.height-b.height)<tolerance&&Math.abs(a.thickness-b.thickness)<tolerance;}
