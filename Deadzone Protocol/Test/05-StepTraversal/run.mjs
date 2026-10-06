import {mkdirSync,writeFileSync} from 'node:fs';
import {initialize,PROFILES,POLICY,platform,house,box,findPath,Simulation,segment} from './traversal.mjs';
await initialize();const results=[],failures=[],traces=[];
function check(name,scene,start,goal,kind,options={},expected=true,ai=false){const p=PROFILES[kind],plan=ai?findPath(scene,start,goal,p):null,path=ai?plan.points:[start,goal];if(!path){const row={name,kind,options,expected,ai,plan,arrived:false,pass:!expected};results.push(row);if(!row.pass)failures.push(row);return;}
 const sim=new Simulation(scene,options),actor=sim.add(p,start,path),r=sim.run(options.seconds??20)[0],pass=r.arrived===expected&&r.minFeet>-.08;const row={name,kind,options,expected,ai,plan:plan?{points:plan.points,ms:plan.ms,expanded:plan.expanded,edges:plan.edges}:null,...r,pass};results.push(row);if(!pass)failures.push(row);if(traces.length<6&&name==='step-0.2'&&options.hz===60&&options.yaw===0)traces.push({row,scene,profile:p,path,trace:actor.trace});sim.dispose();}
for(const kind of Object.keys(PROFILES))for(const h of [.05,.1,.15,.2])for(const hz of [30,60,120])for(const yaw of [0,.71])for(const angle of [0,Math.PI/6,Math.PI/3]){const x=4*Math.tan(angle);check('step-'+h,platform(h),[x,0,4],[-x,h,-4],kind,{hz,yaw});}
for(const kind of Object.keys(PROFILES)){
 for(const hz of [30,60,120]){check('side-descent',platform(.2),[0,.2,-3],[18,0,-3],kind,{hz});check('return-through-house',house(),[0,.2,0],[0,0,9],kind,{hz},true,true);}
 for(const yaw of [0,.71]){check('AI-around-wall',house(),[-9,0,0],[0,.2,0],kind,{yaw},true,true);check('AI-diagonal-entry',house(),[4,0,9],[0,.2,0],kind,{yaw},true,true);check('AI-through-house',house(),[0,0,9],[0,0,-9],kind,{yaw},true,true);}
 check('low-ceiling',house(.2,3.6,PROFILES[kind].height-.15),[0,0,9],[0,.2,0],kind,{},false,true);
 check('narrow-door',house(.2,PROFILES[kind].radius*2-.1),[0,0,9],[0,.2,0],kind,{},false,true);
 check('high-step-0.4',platform(.4),[0,0,4],[0,.4,-4],kind,{},false);
 const stairs={name:'stairs',bounds:15,boxes:[box('Step1','floor',0,.075,-1.5,14,.15,3),box('Step2','floor',0,.15,-4.5,14,.3,3),box('Step3','floor',0,.225,-7.5,14,.45,3)]};check('three-steps',stairs,[0,0,4],[0,.45,-8],kind,{},true,true);
 check('autostep-off-control',platform(.2),[0,0,4],[0,.2,-4],kind,{autostep:false},false);
}
const dir=new URL('./evidence/',import.meta.url);mkdirSync(dir,{recursive:true});writeFileSync(new URL('results.json',dir),JSON.stringify({policy:POLICY,total:results.length,passed:results.filter(r=>r.pass).length,failures,results},null,2));writeFileSync(new URL('traces.json',dir),JSON.stringify(traces));console.log(JSON.stringify({total:results.length,passed:results.filter(r=>r.pass).length,failed:failures.length,failures:failures.slice(0,12)},null,2));if(failures.length)process.exitCode=1;
