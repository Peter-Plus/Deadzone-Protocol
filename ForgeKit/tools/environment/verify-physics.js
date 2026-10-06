// Optional project integration check: uses the already installed Deadzone Rapier, no new dependency.
import {createRequire} from 'node:module';
const RAPIER=createRequire(new URL('../../../Deadzone Protocol/package.json',import.meta.url))('@dimforge/rapier3d-compat');
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {compileContract,terrainGeometry} from './contract.js';
import {transformContract,gateColliders,BUILDING_TRAVERSAL} from './spatial.js';
import {PROJECT} from '../core/library.js';
const def=id=>JSON.parse(readFileSync(path.join(PROJECT,`assets/environment-samples/definitions/ENV_${id}.environment.json`),'utf8'));
await RAPIER.init();
const terrain=compileContract(def('Terrain')),building=compileContract(def('Building')),gate=compileContract(def('Gate')),results=[];
function simulate(contract,profile,{yaw=0,position=[0,0,0],mode='open',terrainFloor=false}={}){
 const world=new RAPIER.World({x:0,y:-9.81,z:0});world.timestep=1/60;
 if(terrainFloor){const g=terrainGeometry(terrain.terrain);world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(g.attributes.position.array),new Uint32Array(g.index.array)));g.dispose();}
 else world.createCollider(RAPIER.ColliderDesc.cuboid(60,.1,60).setTranslation(0,-.1,0));
 const placed=transformContract(contract,position,yaw),isGate=contract.type==='gate';let moving;
 for(const c of placed.colliders){const q=c.quaternion;const col=world.createCollider(RAPIER.ColliderDesc.cuboid(...c.size.map(n=>n/2)).setTranslation(...c.position).setRotation({x:q[0],y:q[1],z:q[2],w:q[3]}));if(c.role==='moving')moving=col;}
 const route=placed.routes[0].points,p=route[0],body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(p[0],p[1]+profile.height/2+.04,p[2]));
 const actor=world.createCollider(RAPIER.ColliderDesc.capsule(profile.height/2-profile.radius,profile.radius),body),ctrl=world.createCharacterController(.008);
 ctrl.setMaxSlopeClimbAngle(profile.maxSlopeDegrees*Math.PI/180);ctrl.setMinSlopeSlideAngle((profile.maxSlopeDegrees+1)*Math.PI/180);ctrl.enableSnapToGround(BUILDING_TRAVERSAL.snap);ctrl.enableAutostep(BUILDING_TRAVERSAL.physicsStep,BUILDING_TRAVERSAL.minLanding,false);ctrl.setSlideEnabled(true);world.step();
 let k=1,arrived=false,minFeet=Infinity,maxFeet=-Infinity,progress=0,atClosedBoundary=null,vy=0,grounded=false;
 for(let i=0;i<1500;i++){
  progress=!isGate?0:mode==='closed'?0:mode==='dynamic'?Math.min(1,Math.max(0,(i-150)/180)):1;
  if(moving){const c=gateColliders(contract,progress).find(c=>c.role==='moving');moving.setTranslation({x:c.position[0],y:c.position[1],z:c.position[2]});world.step();}
  const a=body.translation(),goal=route[k],dx=goal[0]-a.x,dz=goal[2]-a.z,distance=Math.hypot(dx,dz);
  if(i===150)atClosedBoundary={x:a.x,y:a.y,z:a.z};
  if(distance<.08){if(k===route.length-1){arrived=true;break;}k++;continue;}
  vy=grounded?-.2:vy-9.81/60;
  const speed=Math.min(distance,2.4/60);ctrl.computeColliderMovement(actor,{x:dx/distance*speed,y:vy/60,z:dz/distance*speed});const m=ctrl.computedMovement();grounded=ctrl.computedGrounded();
  body.setNextKinematicTranslation({x:a.x+m.x,y:a.y+m.y,z:a.z+m.z});world.step();const feet=body.translation().y-profile.height/2;minFeet=Math.min(minFeet,feet);maxFeet=Math.max(maxFeet,feet);
 }
 const result={arrived,minFeet,maxFeet,final:body.translation(),progress,atClosedBoundary};world.free();return result;
}
for(const [id,profile] of Object.entries(building.profiles))for(const yaw of [0,Math.PI/2,Math.PI*.37]){
 const r=simulate(building,profile,{yaw,terrainFloor:true});assert.ok(r.arrived,`building ${id} yaw ${yaw}: ${JSON.stringify(r)}`);assert.ok(r.minFeet>-.08&&r.maxFeet>.08&&r.maxFeet<.18);results.push({case:'building-on-terrain',profile:id,yaw,...r});
}
for(const [id,profile] of Object.entries(gate.profiles))for(const mode of ['closed','open','dynamic']){
 const r=simulate(gate,profile,{mode});assert.equal(r.arrived,mode!=='closed',`gate ${id}/${mode}`);if(mode==='dynamic')assert.ok(r.atClosedBoundary.z>0,'closed leaf was bypassed');results.push({case:'gate',profile:id,mode,...r});
}
const out=path.join(PROJECT,'.qa/environment');mkdirSync(out,{recursive:true});writeFileSync(path.join(out,'physics.json'),JSON.stringify({engine:'Rapier 0.21.0 (existing Deadzone dependency)',scope:'single capsule / authored route; no enemy AI, crowd or final protected-zone navigation',results},null,2));
console.log(JSON.stringify({passed:results.length,report:path.join(out,'physics.json')}));
