// Author only the two warehouse definitions. Retained shared buildings are untouched.
import fs from 'node:fs';
import path from 'node:path';
const dir=path.resolve(import.meta.dirname,'../definitions/environments/shared');
const profiles={player:{radius:.3,height:1.8,margin:.06,maxSlopeDegrees:15},A1:{radius:.74,height:1.92,margin:.06,maxSlopeDegrees:15}};
const materials={wall:{color:'#8e9682',roughness:.94,metalness:.16},wallLight:{color:'#a3aa95',roughness:.9,metalness:.18},wallDark:{color:'#7b877c',roughness:.93,metalness:.18},concrete:{color:'#918772',roughness:1},floor:{color:'#827e6e',roughness:1},roof:{color:'#616f6d',roughness:.84,metalness:.42},roofLight:{color:'#7b8580',roughness:.84,metalness:.35},rust:{color:'#8b5b40',roughness:1},steel:{color:'#384b4b',roughness:.76,metalness:.6},wood:{color:'#8e7350',roughness:1},woodLight:{color:'#ac8e60',roughness:1},strap:{color:'#53594b',roughness:.94},paint:{color:'#c7b265',roughness:1},ivory:{color:'#c9c6ac',roughness:.95}};
let d,n;
function box(id,size,position,mat='wall',role,rotation,parent){const p={id,shape:{type:'box',size},position,material:mat};if(rotation)p.rotation=rotation;if(parent)p.parent=parent;d.model.parts.push(p);if(role)d.colliders.push({node:id,role});return p;}
function start(suffix,label,w,depth){n=0;const id='FSA_ENV_Shared_Warehouse_'+suffix;d={schema:'environment.v1',id,label,type:'building',roofMode:'full',profiles,placement:{min:[-w/2-1.3,-depth/2-2.8],max:[w/2+1.3,depth/2+2.8]},colliders:[],walkables:['Floor'],entrances:[],routes:[],lootZones:[],exclusions:[],connectors:[],model:{schema:'model.v1',id,type:'static',materials,parts:[],sockets:[]}};box('Floor',[w,.16,depth],[0,-.08,0],'floor','floor');}
function wall(id,axis,c,a,b,h,hole){
 const part=(suffix,lo,hi,bottom,top)=>{if(hi-lo<.01||top-bottom<.01)return;const pos=(u,y,t=0)=>axis==='x'?[u,y,c+t]:[c+t,y,u],dim=(w,y,t)=>axis==='x'?[w,y,t]:[t,y,w];
  box(id+suffix,dim(hi-lo,top-bottom,.24),pos((lo+hi)/2,(bottom+top)/2),'wall','wall');
  if(bottom===0)box(id+suffix+'_Plinth',dim(hi-lo,.55,.27),pos((lo+hi)/2,.275),'concrete','wall');
  for(let u=lo+.14;u<hi-.08;u+=.45)box('Corrugation_'+n++,dim(.042,top-Math.max(bottom,.58),.28),pos(u,(top+Math.max(bottom,.58))/2),n%5===0?'wallLight':'wallDark','wall');
  if(hi-lo>1.7&&bottom===0)for(const side of [-1,1])box('Repair_'+n++,dim(.82,.62,.028),pos(lo+.64,1.03,side*.143),n%2?'rust':'wallDark');
 };
 if(hole){const [center,width,top]=hole;part('Left',a,center-width/2,0,h);part('Right',center+width/2,b,0,h);part('Lintel',center-width/2,center+width/2,top,h);}
 else part('',a,b,0,h);
}
function roof(id,x0,x1,z0,z1,eave,rise){
 const mid=(x0+x1)/2,half=(x1-x0)/2,angle=Math.atan2(rise,half),length=Math.hypot(half,rise);
 for(const [side,cx,deg] of [['L',(x0+mid)/2,angle*180/Math.PI],['R',(mid+x1)/2,-angle*180/Math.PI]]){
  const name=id+side;box(name,[length,.14,z1-z0],[cx,eave+rise/2,(z0+z1)/2],'roof','roof',[0,0,deg]);
  for(let x=-length/2+.1;x<length/2;x+=.42)box('RoofRib_'+n++,[.048,.05,z1-z0-.02],[x,.09,0],'roofLight',undefined,undefined,name);
  box('RoofPatch_'+n++,[Math.min(1.3,length*.5),.025,1.7],[length*.1,.085,(z1-z0)*.23],'rust',undefined,undefined,name);
 }
 box(id+'Ridge',[.22,.16,z1-z0+.04],[mid,eave+rise+.02,(z0+z1)/2],'roofLight','roof');
 // Box infill follows the gable line in fine steps; roof grouping hides it in cutaway.
 for(const z of [z0+.28,z1-.28])for(let x=x0+.28;x<x1-.28;x+=.22){const width=Math.min(.22,x1-.28-x),top=eave+rise*(1-Math.abs(x+width/2-mid)/half)-.075,bottom=eave-.12;if(top>bottom)box('RoofGable_'+n++,[width,top-bottom,.24],[x+width/2,(top+bottom)/2,z],'wallDark','roof');}
}
function doorway(id,x,z,width,height,front=true){
 const outside=front?z+1.65:z-1.65,inside=front?z-1.5:z+1.5;
 d.entrances.push({id,outer:[x,0,outside],inner:[x,0,inside],width,height,profiles:Object.keys(profiles)});
 for(const sign of [-1,1])box(id+'Jamb'+(sign<0?'L':'R'),[.14,height,.32],[x+sign*(width/2+.08),height/2,z],'steel','wall');
 const top=box(id+'RollHousing',[width+.16,.36,.44],[x,height+.23,z],'steel','wall');
 // Permanently rolled-open shutter; no closed leaf or active door instance.
 const drum={id:id+'RolledShutter',shape:{type:'cylinder',radiusTop:.14,radiusBottom:.14,height:width-.08},position:[x,height+.22,z+(front?.25:-.25)],rotation:[0,0,90],material:'roofLight'};d.model.parts.push(drum);
 for(const sign of [-1,1])for(let k=0;k<4;k++)box('DoorMark_'+n++,[.15,.18,.025],[x+sign*(width/2+.082),.42+k*.35,z+(front?.175:-.175)],k%2?'paint':'steel');
}
function crate(id,x,z,w,depth,h,y=0){
 box(id,[w,h,depth],[x,y+h/2,z],'wood','solid');
 for(const sign of [-1,1]){box(id+'EdgeX'+sign,[.075,h+.015,depth+.025],[x+sign*(w/2-.055),y+h/2,z],'woodLight','solid');box(id+'Band'+sign,[w+.035,.11,.035],[x,y+h*.7,z+sign*(depth/2+.018)],'strap','solid');}
 box(id+'TopBand',[.12,.035,depth+.025],[x,y+h+.02,z],'strap','solid');
}
function stack(id,x,z,w,depth){
 box(id+'Pallet',[w+.12,.16,depth+.12],[x,.08,z],'woodLight','solid');
 crate(id+'Lower',x,z,w,depth,1.1,.16);crate(id+'Upper',x-.05,z-.08,w*.84,depth*.8,.83,1.3);
}
function rack(id,x,z,w,depth,h=2.65){
 for(const xx of [-1,1])for(const zz of [-1,1])box(id+'Leg'+xx+'_'+zz,[.095,h,.095],[x+xx*(w/2-.05),h/2,z+zz*(depth/2-.05)],'steel','solid');
 for(const y of [.22,1.25,2.35]){box(id+'Shelf'+Math.round(y*100),[w,.10,depth],[x,y,z],'rust','solid');for(const xx of [-1,1])box('ShelfLip_'+n++,[.08,.14,depth],[x+xx*(w/2-.03),y+.05,z],'paint','solid');}
 for(let zz=-depth/2+.55;zz<depth/2-.2;zz+=1.25){crate('RackLoad_'+n++,x,z+zz,w-.16,.88,.78,.28);if(n%3!==0)crate('RackLoad_'+n++,x,z+zz,w-.23,.8,.74,1.31);}
}
function route(id,points){d.routes.push({id,points:points.map(([x,z])=>[x,0,z]),profiles:Object.keys(profiles)});for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];d.exclusions.push({id:id+'_'+i,min:[Math.min(a[0],b[0])-.85,Math.min(a[1],b[1])-.85],max:[Math.max(a[0],b[0])+.85,Math.max(a[1],b[1])+.85]});}}
function loot(id,min,max){d.lootZones.push({id,min,max,surface:'Floor'});}
function stripe(x,z,w,depth){box('FloorMark_'+n++,[w,.006,depth],[x,.004,z],'paint');}
function save(){fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,d.id+'.environment.json'),JSON.stringify(d,null,2)+'\n');console.log(d.id,d.model.parts.length,'parts');}

start('01_Compact','共享仓库 01 · 紧凑储藏仓库',10,12);
wall('Front','x',6,-5,5,3.65,[0,2.6,2.8]);wall('Back','x',-6,-5,5,3.65,[2.8,2.2,2.6]);wall('West','z',-5,-6,6,3.65);wall('East','z',5,-6,6,3.65);
roof('Roof_',-5.28,5.28,-6.28,6.28,3.74,1.0);doorway('Loading',0,6,2.6,2.8);doorway('Rear',2.8,-6,2.2,2.6,false);
rack('WestRack',-3.7,-1,1.1,4.4);rack('EastRack',3.7,-1,1.1,4.4);stack('CentralCargo',0,-1.2,1.6,2.4);
for(const x of [-1.42,1.42])for(let z=2;z<5.6;z+=.9)stripe(x,z,.07,.46);
box('EntrySign',[1.3,.37,.06],[0,3.4,6.17],'steel');box('EntrySignMark',[.13,.22,.024],[0,3.4,6.215],'ivory');
route('WestLoopToRear',[[0,7.65],[0,3],[-1.9,3],[-1.9,-4.2],[2.8,-4.2],[2.8,-7.65]]);
route('EastLoop',[[0,3],[1.9,3],[1.9,-4.2],[-1.9,-4.2]]);
loot('FrontWest',[-4.35,3.95],[-2.9,5.2]);loot('FrontEast',[2.9,3.95],[4.35,5.2]);loot('RearWest',[-4.35,-5.4],[-3.4,-4.4]);save();

start('02_Partitioned','共享仓库 02 · 分隔转运仓库',18,16);
wall('Front','x',8,-9,9,3.8,[-4,3.2,3.15]);wall('Back','x',-8,-9,9,4.6,[4,2.6,2.9]);
for(const [id,x] of [['West',-9],['East',9]]){wall(id+'Front','z',x,-.8,8,3.8);wall(id+'Rear','z',x,-8,-.8,4.6);}
wall('Partition','x',-.8,-9,9,3.65,[3,2.6,2.8]);
roof('RoofFront_',-9.28,9.28,-1.03,8.28,3.9,.95);roof('RoofRear_',-9.28,9.28,-8.28,-.82,4.7,1.05);
// Opaque clerestory fascia connects the stepped roof levels; all removed with roofs.
box('RoofStepFascia',[18,.9,.22],[0,4.32,-.92],'wallDark','roof');
for(let x=-8;x<=8;x+=2)box('RoofStepVent_'+n++,[1.1,.24,.06],[x,4.55,-.785],'steel','roof');
doorway('Loading',-4,8,3.2,3.15);doorway('Rear',4,-8,2.6,2.9,false);
for(const x of [-6.5,-1.5,6.5])rack('FrontRack'+String(x).replace('.','_'),x,3,1.3,3.4,2.7);
rack('RearWestRack',-6.8,-4.2,1.3,3.8,3.0);rack('RearEastRack',6.8,-4.2,1.3,3.8,3.0);stack('RearCargo',-.8,-4.4,2.4,2.4);
for(const z of [1.7,3,4.3,5.6,6.9])stripe(-2.27,z,.075,.6);
box('EntrySign',[1.5,.36,.06],[-4,3.58,8.17],'steel');for(const x of [-4.18,-3.82])box('EntrySignMark'+n++,[.13,.21,.025],[x,3.58,8.215],'ivory');
route('ThroughWarehouse',[[-4,9.65],[-4,5.7],[-4,.3],[3,.3],[3,-2.1],[3,-6.7],[4,-6.7],[4,-9.65]]);
route('FrontEastLoop',[[-4,5.7],[4.5,5.7],[4.5,.3],[3,.3]]);
route('RearWestLoop',[[3,-2.1],[-3.4,-2.1],[-3.4,-6.7],[3,-6.7]]);
loot('FrontWest',[-8.2,5.8],[-7.25,6.9]);loot('FrontEast',[7.4,5.8],[8.2,6.9]);loot('RearWest',[-5.1,-5.2],[-4.4,-4.4]);loot('RearEast',[5,-5.2],[5.7,-4.4]);save();
