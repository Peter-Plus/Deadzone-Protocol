import {mkdirSync,writeFileSync} from 'node:fs';
import {DEFINITIONS} from '../core/library.js';
import path from 'node:path';
const out=(kind,id,data)=>{const dir=path.join(DEFINITIONS,kind,'world/interactables');mkdirSync(dir,{recursive:true});writeFileSync(path.join(dir,id+(kind==='models'?'.model.json':'.anim.json')),JSON.stringify(data,null,2)+'\n');};
const steel={color:'#29343d',metalness:.78,roughness:.63},edge={color:'#657176',metalness:.8,roughness:.48},dark={color:'#10191f',metalness:.45,roughness:.85},gold={color:'#a68652',metalness:.65,roughness:.7},light={color:'#87afbb',emissive:'#34525e',roughness:.4};
function model(id){return {schema:'model.v1',id,type:'static',parts:[],sockets:[]};}
function box(m,id,size,position,material=steel,parent,rotation){m.parts.push({id,shape:{type:'box',size},position,material,...(parent?{parent}:{}),...(rotation?{rotation}:{})});}
function cyl(m,id,rt,rb,h,position,material,parent,rotation){m.parts.push({id,shape:{type:'cylinder',radiusTop:rt,radiusBottom:rb,height:h},position,material,...(parent?{parent}:{}),...(rotation?{rotation}:{})});}
function pivot(m,id,position,parent='Floor'){m.sockets.push({id,parent,position});}
function anim(m,action,duration,tracks){const id='FSA_ANIM_'+m.id.replace('FSA_WORLD_','')+'_'+action;out('animations',id,{schema:'animation.v1',id,rig:'nodes.v1',targetModel:m.id,duration,loop:false,mode:'timeline',tracks});}
for(const air of [false,true]){
 const m=model('FSA_WORLD_'+(air?'Airdrop':'MysteryChest')),w=air?1.65:1.8,h=air?1.16:.94,d=air?1.35:1.02;
 const paint=air?{color:'#d3ab3e',metalness:.45,roughness:.6}:steel;
 box(m,'Floor',[w-.18,.12,d-.17],[0,.12,0],dark);
 // Separate bottom and four walls form a genuinely empty, fully closed cavity.
 box(m,'FrontWall',[w,h-.2,.085],[0,h/2+.04,d/2-.043],paint);
 box(m,'RearWall',[w,h-.2,.085],[0,h/2+.04,-d/2+.043],paint);
 for(const s of [-1,1])box(m,'SideWall_'+(s<0?'L':'R'),[.09,h-.2,d-.17],[s*(w/2-.045),h/2+.04,0],paint);
 for(const x of [-1,1])for(const z of [-1,1]){
  const n=(x<0?'L':'R')+(z<0?'B':'F');
  box(m,'Foot_'+n,[.28,.12,.25],[x*(w/2-.13),.06,z*(d/2-.11)],edge);
  box(m,'Corner_'+n,[.13,h-.06,.13],[x*(w/2-.035),h/2+.03,z*(d/2-.035)],air?dark:edge);
  for(const y of [.24,h-.15])cyl(m,'Bolt_'+n+'_'+Math.round(y*100),.023,.023,.018,[x*(w/2-.11),y,z*(d/2+.008)],gold,undefined,[90,0,0]);
 }
 // Hinge lies behind the back wall and above its rim; negative X opens away from +Z.
 pivot(m,'LidPivot',[0,h-.12,-d/2-.055]);
 box(m,'Lid',[w+.08,.14,d+.14],[0,.07,d/2+.055],paint,'LidPivot');
 box(m,'LidInner',[w-.19,.018,d-.2],[0,-.008,d/2+.055],dark,'LidPivot');
 for(const x of [-1,1]){
  const n=x<0?'L':'R';
  box(m,'LidRail_'+n,[.1,.07,d+.13],[x*(w/2-.12),.175,d/2+.055],edge,'LidPivot');
  cyl(m,'Hinge_'+n,.065,.065,.25,[x*w*.3,h+.005,-d/2-.055],edge,undefined,[0,0,90]);
  pivot(m,'Latch_'+n,[x*w*.3,h-.15,d/2+.07]);
  box(m,'LatchPlate_'+n,[.12,.19,.05],[0,-.085,0],edge,'Latch_'+n);
  box(m,'LatchGrip_'+n,[.15,.035,.065],[0,-.17,.035],gold,'Latch_'+n);
  box(m,'SideHandle_'+n,[.065,.07,.36],[x*(w/2+.045),h*.6,0],edge);
 }
 for(let i=0;i<9;i++){
  if(air){box(m,'Warning_'+i,[.055,.2,.016],[(i-4)*.1,h*.47,d/2+.009],dark,undefined,[0,0,-25]);box(m,'TopStripe_'+i,[.09,.012,.26],[(i-4)*.105,.146,d*.54],dark,'LidPivot',[0,25,0]);}
  else {box(m,'Seam_'+i,[.095,.026,.014],[(i-4)*.15,h-.035,d/2+.012],light);box(m,'Rune_'+i,[.018,.11,.012],[(i-4)*.15,h-.13,d/2+.014],gold,undefined,[0,0,(i%2?30:-30)]);}
 }
 if(air){box(m,'Label',[.48,.24,.02],[0,h*.76,d/2+.02],dark);for(const x of [-.14,0,.14])box(m,'LabelBar_'+Math.round((x+1)*100),[.035,.15,.01],[x,h*.76,d/2+.036],{color:'#e1e4d4'});}
 else {box(m,'Medallion',[.2,.2,.035],[0,h*.55,d/2+.027],gold,undefined,[0,0,45]);box(m,'MedallionCore',[.09,.09,.05],[0,h*.55,d/2+.055],light,undefined,[0,0,45]);}
 pivot(m,'Interaction_Front',[0,h*.6-.12,d/2+.55]);
 out('models',m.id,m);
 const duration=air?1.12:1.4,angle=air?105:102;
 const tracks={LidPivot:(air?[[0,0],[.22,0],[.4,25],[.72,88],[.94,107],[1.12,105]]:[[0,0],[.22,0],[.5,16],[.93,78],[1.19,104],[1.4,102]]).map(([time,x])=>({time,rotation:[-x,0,0]}))};
 for(const n of ['L','R'])tracks['Latch_'+n]=[{time:0,rotation:[0,0,0]},{time:air?.15:.22,rotation:[-105,0,0]},{time:duration,rotation:[-105,0,0]}];
 anim(m,'Open',duration,tracks);
}
const m=model('FSA_WORLD_EnchantAltar'),stone={color:'#33393d',roughness:1},stone2={color:'#46494a',roughness:.97};
box(m,'Floor',[.93,.12,.84],[0,.06,0],stone);
for(let i=0;i<7;i++){
 const a=i*Math.PI*2/7,r=.31;
 box(m,'BrokenStone_'+i,[.27,.72+(i%3)*.035,.28],[Math.cos(a)*r,.46,Math.sin(a)*r],i%2?stone:stone2,undefined,[(i%2)*5,i*51,((i%3)-1)*6]);
}
cyl(m,'Basin',.62,.51,.16,[0,.9,0],stone2);
cyl(m,'Recess',.42,.42,.018,[0,.987,0],dark);
for(let i=0;i<16;i++){
 const a=i*22.5*Math.PI/180;
 box(m,'Etching_'+i,[.092,.006,.018],[Math.sin(a)*.48,.984,Math.cos(a)*.48],i%4===0?dark:light,undefined,[0,i*22.5,0]);
}
for(let i=0;i<4;i++){
 const a=i*Math.PI/2;
 box(m,'MetalStrap_'+i,[.09,.65,.035],[Math.sin(a)*.43,.5,Math.cos(a)*.43],gold,undefined,[0,i*90,0]);
 pivot(m,'Ring_'+i,[0,.94,0]);
 for(let j=0;j<3;j++){const deg=i*90+j*18-18,r=deg*Math.PI/180;box(m,'RingSegment_'+i+'_'+j,[.145,.048,.055],[Math.sin(r)*.5,0,Math.cos(r)*.5],edge,'Ring_'+i,[0,deg,0]);}
}
pivot(m,'Crystal',[0,1.26,0]);
m.parts.push({id:'CrystalUpper',parent:'Crystal',shape:{type:'cone',radius:.135,height:.25},position:[0,.08,0],material:light});
m.parts.push({id:'CrystalLower',parent:'Crystal',shape:{type:'cone',radius:.135,height:.16},position:[0,-.125,0],rotation:[180,0,0],material:light});
pivot(m,'Interaction_Front',[0,.65,.98]);
out('models',m.id,m);
const tracks={Crystal:[{time:0,position:[0,1.26,0],rotation:[0,0,0]},{time:.6,position:[0,1.35,0],rotation:[0,40,0]},{time:1.3,position:[0,1.42,0],rotation:[0,85,0]},{time:1.65,position:[0,1.38,0],rotation:[0,105,0]},{time:2.4,position:[0,1.16,0],rotation:[0,120,0]}]};
for(let i=0;i<4;i++)tracks['Ring_'+i]=[{time:0,position:[0,.94,0],rotation:[0,0,0],scale:[1,1,1]},{time:.65,position:[0,1.07,0],rotation:[0,12,0],scale:[1.14,1,1.14]},{time:1.5,position:[0,1.07,0],rotation:[0,25,0],scale:[1.14,1,1.14]},{time:2.4,position:[0,.90,0],rotation:[0,0,0],scale:[.86,1,.86]}];
anim(m,'Enchant',2.4,tracks);
console.log('Authored 3 models and 3 independent node animations.');
