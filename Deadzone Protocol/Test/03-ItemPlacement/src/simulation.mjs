import RAPIER from '@dimforge/rapier3d-compat';
import {terrainBuffers,templates,transform} from './world.mjs';
import {PROFILES,dist} from './navigation.mjs';
export const initialize=()=>RAPIER.init();
export class Simulation {
 constructor(scene,navs){this.scene=scene;this.navs=navs;this.world=new RAPIER.World({x:0,y:-9.81,z:0});this.world.timestep=1/60;this.actors=[];this.time=0;this.logs=[];this.actorHandles=new Set();this.collisionStops=0;this.maxOverlap=0;
 const t=terrainBuffers(scene.terrain);this.world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(t.positions),new Uint32Array(t.indices)));
 for(const b of scene.buildings){const template=templates().find(t=>t.templateId===b.templateId);for(const c of template.colliders){const p=transform(c.position,b),x=c.rotation[0],y=b.rotation[1];const q={x:Math.cos(y/2)*Math.sin(x/2),y:Math.sin(y/2)*Math.cos(x/2),z:-Math.sin(y/2)*Math.sin(x/2),w:Math.cos(y/2)*Math.cos(x/2)};this.world.createCollider(RAPIER.ColliderDesc.cuboid(...c.size.map(v=>v/2)).setTranslation(...p).setRotation(q));}}
 for(const [x,z,sx,sz] of [[-scene.config.size/2,0,.1,scene.config.size],[scene.config.size/2,0,.1,scene.config.size],[0,-scene.config.size/2,scene.config.size,.1],[0,scene.config.size/2,scene.config.size,.1]])this.world.createCollider(RAPIER.ColliderDesc.cuboid(sx/2,5,sz/2).setTranslation(x,3,z));this.world.step();
 }
 add(kind,p,id){const profile=PROFILES[kind],body=this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(p[0],p[1]+profile.height/2+.035,p[2]));const collider=this.world.createCollider(RAPIER.ColliderDesc.capsule(profile.height/2-profile.radius,profile.radius),body),controller=this.world.createCharacterController(.008);controller.setMaxSlopeClimbAngle(15*Math.PI/180);controller.setMinSlopeSlideAngle(16*Math.PI/180);controller.enableSnapToGround(.10);controller.disableAutostep();controller.setSlideEnabled(true);
 const a={id,kind,...profile,body,collider,controller,p:p.slice(),velocityY:0,grounded:false,route:null,index:1,goal:null,mode:'idle',stuck:0,maxStuck:0,distance:0,speedNow:0,reason:'',nextPlan:0,replans:0,arrived:false};this.actors.push(a);this.actorHandles.add(collider.handle);this.world.step();return a;}
 route(a,goal){const p=this.navs[a.kind].path(a.p,goal);a.route=p;a.index=1;a.goal=goal.slice();a.replans++;a.arrived=false;a.mode=p?'moving':'unreachable';a.reason=p?'':'目标无净空、支撑或连通路径';return !!p;}
 safeDynamic(a,end,reserved){for(const b of this.actors){if(a===b)continue;const p=reserved.get(b)??b.p,dx=end[0]-a.p[0],dz=end[2]-a.p[2],len=dx*dx+dz*dz,t=len?Math.max(0,Math.min(1,((p[0]-a.p[0])*dx+(p[2]-a.p[2])*dz)/len)):0;const d=Math.hypot(a.p[0]+dx*t-p[0],a.p[2]+dz*t-p[2]);if(d<a.radius+b.radius+.035)return false;}return true;}
 tick(dt=1/60,input=null){this.time+=dt;this.world.timestep=dt;const reserved=new Map();
  for(const a of this.actors){let dx=0,dz=0,wants=false;const nav=this.navs[a.kind];
   if(a.kind==='player'&&input){dx=input[0]*dt;dz=input[1]*dt;wants=Math.hypot(dx,dz)>.00001;}
   else if(a.route&&!a.arrived){if(a.stuck>.7&&this.time>a.nextPlan){a.nextPlan=this.time+2;const alternate=nav.path(a.p,a.goal,this.actors.filter(b=>b!==a&&dist(a.p,b.p)<12));if(alternate){a.route=alternate;a.index=1;a.replans++;}} while(a.index<a.route.length-1&&dist(a.p,a.route[a.index])<.16)a.index++;const target=a.route[a.index];let d=dist(a.p,target);if(d<.11&&a.index===a.route.length-1&&nav.segment(a.p,target)){a.arrived=true;a.mode='arrived';}else{wants=true;const step=Math.min(a.speed*dt,d),ux=(target[0]-a.p[0])/d,uz=(target[2]-a.p[2])/d;dx=ux*step;dz=uz*step;}}
   if(wants){let found=false;for(const angle of [0,.45,-.45,.9,-.9,1.3,-1.3]){const x=dx*Math.cos(angle)-dz*Math.sin(angle),z=dx*Math.sin(angle)+dz*Math.cos(angle),p=[a.p[0]+x,a.p[1],a.p[2]+z];if(nav.segment(a.p,p)&&this.safeDynamic(a,p,reserved)){dx=x;dz=z;found=true;break;}}if(!found){dx=dz=0;a.reason='拥堵等待';}}
   if(!a.grounded)a.velocityY-=9.81*dt;
   a.controller.computeColliderMovement(a.collider,{x:dx,y:a.velocityY*dt,z:dz},undefined,undefined,c=>!this.actorHandles.has(c.handle));const m=a.controller.computedMovement(),start=a.body.translation();let end=[a.p[0]+m.x,a.p[1]+m.y,a.p[2]+m.z];if(!this.safeDynamic(a,end,reserved)){m.x=m.z=0;end=[a.p[0],end[1],a.p[2]];}
   a.body.setNextKinematicTranslation({x:start.x+m.x,y:start.y+m.y,z:start.z+m.z});reserved.set(a,end);a.grounded=a.controller.computedGrounded();if(a.grounded&&a.velocityY<0)a.velocityY=0;const moved=Math.hypot(m.x,m.z);a.speedNow=moved/dt;a.distance+=moved;
   if(wants&&moved<dt*.08){a.stuck+=dt;a.maxStuck=Math.max(a.maxStuck,a.stuck);if(!a.reason)a.reason='静态碰撞';if(a.stuck>=2&&a.stuck-dt<2)this.logs.push({time:this.time,id:a.id,reason:a.reason,position:a.p.slice()});}else{a.stuck=0;a.reason='';}if(wants&&Math.hypot(dx,dz)>.001&&moved<.0001)this.collisionStops++;
  }
  this.world.step();for(const a of this.actors){const p=a.body.translation();a.p=[p.x,p.y-a.height/2,p.z];}
  for(let i=0;i<this.actors.length;i++)for(let j=i+1;j<this.actors.length;j++)this.maxOverlap=Math.max(this.maxOverlap,this.actors[i].radius+this.actors[j].radius-dist(this.actors[i].p,this.actors[j].p));
 }
 stats(){return{time:this.time,actors:this.actors.length,colliders:this.world.colliders.len(),bodies:this.world.bodies.len(),maxOverlap:this.maxOverlap,collisionStops:this.collisionStops,stuck:this.actors.filter(a=>a.stuck>2).length,maxStuck:Math.max(0,...this.actors.map(a=>a.maxStuck)),actorsState:this.actors.map(a=>({id:a.id,kind:a.kind,p:a.p,mode:a.mode,arrived:a.arrived,distance:a.distance,stuck:a.stuck,maxStuck:a.maxStuck,reason:a.reason,supportError:a.p[1]-(this.navs[a.kind].surface(a.p)?.height??0)})),logs:this.logs};}
 dispose(){this.world.free();this.actors.length=0;this.actorHandles.clear();}
}
