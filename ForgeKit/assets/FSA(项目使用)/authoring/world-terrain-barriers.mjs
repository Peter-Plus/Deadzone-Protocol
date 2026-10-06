// Reproducible authoring only. Compile with tools/environment/build.js.
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../definitions/environments');
const profiles={player:{radius:.3,height:1.8,margin:.06,maxSlopeDegrees:15},A1:{radius:.78,height:1.95,margin:.06,maxSlopeDegrees:15}};
const save=(folder,d,suffix='environment')=>{mkdirSync(path.join(root,folder),{recursive:true});writeFileSync(path.join(root,folder,`${d.id}.${suffix}.json`),JSON.stringify(d,null,2)+'\n');};
const base=(id,label,type)=>({schema:'environment.v1',id,label,type,profiles,placement:{min:[-4,-4],max:[4,4]},colliders:[],walkables:[],entrances:[],routes:[],lootZones:[],exclusions:[],connectors:[]});
for(const [key,label,amplitude,height] of [['flat','平地',.18,0],['slope','缓坡',1.5,0],['basin','浅洼',2.2,-1.4],['hill','低丘',3.2,2]]){
 const d=base('FSA_ENV_Desert_'+key,'荒漠 / '+label+' · 大基地平台','terrain');d.placement={min:[-56,-56],max:[56,56]};
 d.terrain={size:[112,112],cell:1,seed:731,amplitude,wavelength:16,maxSlopeDegrees:15,landform:key,edgeBlend:12,surface:'desert-mottled',platforms:[{center:[0,1],size:[48,44],height,blend:16}]};
 d.routes=[{id:'CrossX',points:[[-52,0,1],[52,0,1]],profiles:Object.keys(profiles)},{id:'CrossZ',points:[[0,0,-52],[0,0,52]],profiles:Object.keys(profiles)}];save('terrain',d);
}
function barrier(style,kind){
 const fence=style==='Quarantine',height=fence?2.8:4,thickness=.25;
 const d=base(`FSA_ENV_${style}_${kind}`,`${fence?'隔离区通透铁栏':'保护区装甲铁墙'} / ${{Straight:'6m 直段',Corner:'3m 转角',End:'1m 收边'}[kind]}`,'barrier');
 d.model={schema:'model.v1',id:d.id,type:'static',materials:{steel:{color:fence?'#4f5b59':'#485954',metalness:.65,roughness:.76},dark:{color:'#293a3c',metalness:.7,roughness:.7},rust:{color:'#885a3c',roughness:.96},sand:{color:'#a18c67',roughness:1},stripe:{color:'#c7a24e',roughness:.84},invisible:{color:'#ffffff',transparent:true,opacity:0}},parts:[]};
 function box(id,size,position,mat='steel',collision=false,rotation){id=id.replaceAll('.', '_');d.model.parts.push({id,shape:{type:'box',size},position,material:mat,...(rotation?{rotation}: {})});if(collision)d.colliders.push({node:id,role:'barrier'});}
 function segment(prefix,start,end){
  const dx=end[0]-start[0],dz=end[1]-start[1],len=Math.hypot(dx,dz),yaw=-Math.atan2(dz,dx)*180/Math.PI;
  const p=(x,y,z=0)=>[start[0]+dx*x/len+dz*z/len,y,start[1]+dz*x/len-dx*z/len];
  const b=(name,size,x,y,z=0,mat='steel',collision=false)=>box(prefix+name,size,p(x,y,z),mat,collision,[0,yaw,0]);
  b('ContinuousBlocker',[len,height,.25],len/2,height/2,0,fence?'invisible':'steel',true);
  b('Foot',[len,.22,.38],len/2,.11,0,'sand',true);
  for(const y of fence?[.5,2.45]:[.5,2.1,3.78])b('Rail'+y,[len,.12,.34],len/2,y,0,'dark',true);
  if(fence){for(let x=.24;x<len-.12;x+=.3)b('Bar'+Math.round(x*100),[.055,2.53,.065],x,1.5,0,'steel');}
  else {for(let x=.5;x<len;x+=1){b('Plate'+x,[.88,3.25,.035],x,2.08,.145,x%2>.9?'steel':'dark');b('PlateBack'+x,[.88,3.25,.035],x,2.08,-.145,'steel');for(const y of [.65,3.55]){b('BoltFront'+x+'_'+y,[.065,.065,.04],x,y,.18,'sand');b('BoltBack'+x+'_'+y,[.065,.065,.04],x,y,-.18,'sand');}}
   for(let x=.2;x<len;x+=.4)b('Warning'+Math.round(x*100),[.2,.13,.02],x,.5,.185,'stripe');}
  for(const x of [0,len]){b('Post'+x,[.22,height,.42],x,height/2,0,'dark',true);b('Cap'+x,[.3,.09,.46],x,height-.045,0,'steel',true);b('Collar'+x,[.3,.16,.46],x,.24,0,'rust',true);}
 }
 if(kind==='Corner'){segment('X_',[-3,0],[0,0]);segment('Z_',[0,0],[0,3]);d.connectors=[{id:'West',position:[-3,0,0],outward:[-1,0,0]},{id:'North',position:[0,0,3],outward:[0,0,1]}];d.placement={min:[-3.2,-.3],max:[.3,3.2]};}
 else {const len=kind==='End'?1:6;segment('X_',[-len/2,0],[len/2,0]);d.connectors=[{id:'West',position:[-len/2,0,0],outward:[-1,0,0]},{id:'East',position:[len/2,0,0],outward:[1,0,0]}];d.placement={min:[-len/2-.2,-.3],max:[len/2+.2,.3]};if(kind==='End'){box('TerminalSpine',[.18,height,.5],[len/2,height/2,0],'rust',true);d.placement.max[1]=.3;}}
 d.connectors=d.connectors.map(c=>({...c,height,thickness}));save('barriers',d);return d;
}
for(const style of ['Quarantine','Protected'])for(const kind of ['Straight','Corner','End'])barrier(style,kind);
// Preview-only layout: instance transforms, never a fixed perimeter production GLB.
const instances=[];const add=(kind,x,z,yaw=0)=>instances.push({id:'P'+instances.length,asset:'FSA_ENV_Protected_'+kind,position:[x,0,z],yaw});
// 36 x 24 m centerline perimeter. Two 6m gate slots centered on north/south.
for(const z of [-12,12])for(const x of [-12,-6,6,12])add('Straight',x,z);
for(const x of [-18,18])for(const z of [-6,0,6])add('Straight',x,z,90);
add('Corner',18,-12,0);add('Corner',18,12,270);add('Corner',-18,12,180);add('Corner',-18,-12,90);
save('barriers',{schema:'environment-preview-assembly.v1',id:'FSA_REF_Protected_TwoGateSlots',label:'装配示意 / 36×24m 保护区 · 两个门位（未装门扇）',instances,gateSlots:[{id:'South',center:[0,0,-12],width:6,height:4,thickness:.25,outside:[0,0,-1]},{id:'North',center:[0,0,12],width:6,height:4,thickness:.25,outside:[0,0,1]}]},'assembly');
save('barriers',{schema:'environment-preview-assembly.v1',id:'FSA_REF_Quarantine_Gaps',label:'装配示意 / 断续铁栏 · 4m 通行缺口',instances:[{id:'Q0',asset:'FSA_ENV_Quarantine_Straight',position:[-5,0,0],yaw:0},{id:'Q1',asset:'FSA_ENV_Quarantine_Straight',position:[5,0,0],yaw:0},{id:'Q2',asset:'FSA_ENV_Quarantine_End',position:[-8.5,0,0],yaw:180},{id:'Q3',asset:'FSA_ENV_Quarantine_End',position:[8.5,0,0],yaw:0}],gateSlots:[]},'assembly');
