import {mkdirSync,writeFileSync} from 'node:fs';
import {initialize,PROFILES,POLICY,platform,house,box,findPath,Simulation} from './traversal.mjs';
await initialize();POLICY.stepUp=.1;POLICY.stepDown=.2;
const results=[],failures=[];
function trial(name,scene,start,goal,kind,{hz=60,yaw=0,expected=true,ai=true}={}){
 const p=PROFILES[kind],plan=ai?findPath(scene,start,goal,p):null,path=ai?plan.points:[start,goal];let r={arrived:false,maxStuck:0,seconds:0};
 if(path){const sim=new Simulation(scene,{hz,yaw});sim.add(p,start,path);r=sim.run(25)[0];sim.dispose();}
 const pass=r.arrived===expected&&(!expected||r.maxStuck<=.25&&r.minFeet>-.08),row={name,kind,hz,yaw,expected,ai,plan:plan?{ms:plan.ms,expanded:plan.expanded,edges:plan.edges,points:plan.points}:null,...r,pass};results.push(row);if(!pass)failures.push(row);
}
for(const kind of Object.keys(PROFILES))for(const h of [.05,.1])for(const hz of [30,60,120])for(const yaw of [0,.37,1.1])for(const angle of [0,Math.PI/6,Math.PI/3]){
 const x=4*Math.tan(angle);trial('rise-'+h,platform(h),[x,0,4],[-x,h,-4],kind,{hz,yaw,ai:false});
}
for(const kind of Object.keys(PROFILES))for(const hz of [30,60,120])for(const yaw of [0,.71]){
 const h=.1;for(const [name,start,goal] of [['around-wall',[-9,0,0],[0,h,0]],['diagonal-entry',[4,0,9],[0,h,0]],['through-house',[0,0,9],[0,0,-9]],['exit',[0,h,0],[0,0,9]]])trial(name,house(h),start,goal,kind,{hz,yaw});
 trial('side-descent',platform(.2),[0,.2,-3],[18,0,-3],kind,{hz,yaw,ai:false});
}
for(const kind of Object.keys(PROFILES)){
 const h=.1;
 trial('narrow-door',house(h,PROFILES[kind].radius*2-.1),[0,0,9],[0,h,0],kind,{expected:false});
 trial('low-headroom',house(h,3.6,PROFILES[kind].height-.15),[0,0,9],[0,h,0],kind,{expected:false});
 trial('too-high-navigation',house(.25),[0,0,9],[0,.25,0],kind,{expected:false});
 const stairs={name:'stairs',bounds:15,boxes:[box('Step1','floor',0,.05,-1.5,14,.1,3),box('Step2','floor',0,.1,-4.5,14,.2,3),box('Step3','floor',0,.15,-7.5,14,.3,3)]};
 trial('three-wide-steps',stairs,[0,0,4],[0,.3,-8],kind);
 trial('ceiling-physics',house(h,3.6,PROFILES[kind].height-.15),[0,0,9],[0,h,0],kind,{expected:false,ai:false});
}
// Seeded approaches exercise A* routes around the same room, not pre-authored walking lines.
let seed=1357;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(const kind of ['A1','B2'])for(let i=0;i<20;i++){
 const start=[(random()<.5?-1:1)*(8+random()*2),0,(random()-.5)*8],goal=[(random()-.5)*3,.1,(random()-.5)*3];trial('seeded-house-'+i,house(.1),start,goal,kind,{yaw:random()*Math.PI*2});
}
// A queue checks actual character-character contacts, using dynamic capsules without teleporting.
const crowds=[];for(const step of [0,.1]){
 const scene=house(step||.001,3.6);scene.bounds=55;const sim=new Simulation(scene,{avoidActors:true}),plans=[];
 for(let i=0;i<10;i++){const kind=i%3===0?'B2':'A1',p=PROFILES[kind],start=[0,0,9+i*3.5],goal=[0,0,-9-(9-i)*3.5],plan=findPath(scene,start,goal,p);plans.push(plan.ms);sim.add(p,start,plan.points);}
 const rows=sim.run(100),all=rows.every(r=>r.arrived);crowds.push({step,count:10,allArrived:all,seconds:sim.time,maxWait:Math.max(...rows.map(r=>r.maxStuck)),planningMs:plans.reduce((a,b)=>a+b,0),rows});sim.dispose();if(!all)failures.push({name:'crowd-'+step,rows});
}
const report={policy:POLICY,passCriteria:'reach target, no continuous stall over 0.25s (solo), feet > -0.08m; queues may wait',total:results.length,passed:results.filter(r=>r.pass).length,failed:failures.length,failures,results,crowds};
const dir=new URL('./evidence/',import.meta.url);mkdirSync(dir,{recursive:true});writeFileSync(new URL('stability-10cm.json',dir),JSON.stringify(report,null,2));console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,worstSoloStall:Math.max(...results.filter(r=>r.expected).map(r=>r.maxStuck)),crowds:crowds.map(({rows,...r})=>r),failures:failures.slice(0,8)},null,2));if(failures.length)process.exitCode=1;
