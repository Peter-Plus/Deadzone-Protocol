// Reference fixtures only. Explicitly run to reset the five shipped sample definitions.
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {PROJECT} from '../core/library.js';
const dir=path.join(PROJECT,'assets/environment-samples/definitions');mkdirSync(dir,{recursive:true});
const profiles={player:{radius:.3,height:1.8,margin:.06,maxSlopeDegrees:15},A1:{radius:.78,height:1.95,margin:.06,maxSlopeDegrees:15},B2:{radius:1.34,height:3.2,margin:.06,maxSlopeDegrees:15}};
const base=(id,label,type,min,max)=>({schema:'environment.v1',id,label,type,profiles,placement:{min,max},colliders:[],walkables:[],entrances:[],routes:[],lootZones:[],exclusions:[],connectors:[]});
function model(d){d.model={schema:'model.v1',id:d.id,type:'static',parts:[],sockets:[]};return d;}
function box(d,id,size,position,color,role,rotation){d.model.parts.push({id,shape:{type:'box',size},position,material:{color,roughness:.85},...(rotation?{rotation}:{})});if(role)d.colliders.push({node:id,role});if(['floor','ramp'].includes(role))d.walkables.push(id);}
const save=d=>writeFileSync(path.join(dir,d.id+'.environment.json'),JSON.stringify(d,null,2)+'\n');
const ground=base('ENV_Terrain','荒漠缓坡与建造平台','terrain',[-24,-24],[24,24]);
ground.terrain={size:[48,48],cell:1,seed:731,amplitude:1.1,wavelength:12,maxSlopeDegrees:15,platforms:[{center:[0,0],size:[20,24],height:0,blend:8}]};ground.routes=[{id:'Across',points:[[-20,0,0],[0,0,0],[20,0,0]],profiles:Object.keys(profiles)}];save(ground);
const house=model(base('ENV_Building','单层双出口小屋','building',[-7,-12],[7,12]));
box(house,'Floor',[10,.1,10],[0,.05,0],'#777367','floor');
box(house,'WallWest',[.3,4.2,10],[-5,2.5,0],'#b09b7e','wall');box(house,'WallEast',[.3,4.2,10],[5,2.5,0],'#b09b7e','wall');
for(const [side,z] of [['Front',5],['Back',-5]]){
 for(const s of [-1,1])box(house,`Wall${side}${s<0?'L':'R'}`,[3.2,4.2,.3],[s*3.4,2.5,z],'#b09b7e','wall');
 box(house,`Lintel${side}`,[3.6,.6,.3],[0,4.3,z],'#786b58','wall');
 const sign=Math.sign(z);
 house.entrances.push({id:side,inner:[0,.1,sign*4],outer:[0,0,sign*9.5],width:3.6,height:3.6,profiles:Object.keys(profiles)});
 house.exclusions.push({id:`Door${side}`,min:[-1.8,sign>0?4:-10],max:[1.8,sign>0?10:-4]});
}
// A partition creates distinct interior bays while leaving an explicit wide central path.
box(house,'Partition',[3.1,3,.22],[-3.35,1.9,0],'#96876f','wall');
box(house,'RoofLeft',[5.6,.22,10.8],[-2.7,5.08,0],'#514e49','roof',[0,0,10]);
box(house,'RoofRight',[5.6,.22,10.8],[2.7,5.08,0],'#514e49','roof',[0,0,-10]);
box(house,'Ridge',[.2,.18,10.9],[0,5.6,0],'#3d4242','roof');
for(const x of [-4.8,4.8])box(house,`Trim${x<0?'L':'R'}`,[.12,.16,9.8],[x,1.3,0],'#6d776e');
for(const part of house.model.parts)if(part.id!=='Floor')part.position[1]-=.3;
house.routes=[{id:'ThroughHouse',points:[[0,0,10],[0,0,8],[0,.1,5],[0,.1,0],[0,.1,-5],[0,0,-8],[0,0,-10]],profiles:Object.keys(profiles)}];
house.exclusions.push({id:'MainPassage',min:[-1.5,-4],max:[1.5,4]});
house.lootZones=[{id:'WestBay',min:[-4.3,-4],max:[-2.4,-1],surface:'Floor'},{id:'EastBay',min:[2.4,-3.8],max:[4.3,3.8],surface:'Floor'}];save(house);
const truck=model(base('ENV_Solid','报废运输卡车','solid',[-3,-5],[3,5]));
box(truck,'Chassis',[2.5,.65,6.6],[0,.7,0],'#393e39','solid');box(truck,'Cabin',[2.45,1.85,2.1],[0,1.75,2.05],'#716e53','solid');box(truck,'Hood',[2.4,.8,1.1],[0,1.2,3.1],'#68644f','solid');
box(truck,'Cargo',[2.5,1.9,3.6],[0,1.85,-1.4],'#776348','solid');
box(truck,'Windshield',[1.95,.65,.03],[0,2.05,3.115],'#253e45');
for(const z of [-2.3,2.25])for(const x of [-1.24,1.24]){const id=`Wheel${z>0?'F':'B'}${x>0?'R':'L'}`;truck.model.parts.push({id,shape:{type:'cylinder',radiusTop:.58,radiusBottom:.58,height:.3},position:[x,.58,z],rotation:[0,0,90],material:{color:'#282b2c'}});box(truck,id+'Collision',[.32,1.16,1.16],[x,.58,z],'#282b2c','solid');}
save(truck);
const fence=model(base('ENV_Barrier','铁墙转角连接段','barrier',[-4,-4],[4,4]));
box(fence,'PanelX',[6,4,.25],[0,2,0],'#69746c','barrier');box(fence,'PanelZ',[.25,4,3],[3,2,1.5],'#69746c','barrier');
for(const [i,x,z] of [[0,-3,0],[1,0,0],[2,3,0],[3,3,3]])box(fence,'Post'+i,[.35,4.3,.35],[x,2.15,z],'#3d4744','barrier');
for(const [id,y] of [['Low',.8],['High',2.8]])box(fence,'Rail'+id,[6,.16,.35],[0,y,0],'#a39774');
fence.connectors=[{id:'West',position:[-3,0,0],outward:[-1,0,0],height:4,thickness:.25},{id:'North',position:[3,0,3],outward:[0,0,1],height:4,thickness:.25}];save(fence);
const gate=model(base('ENV_Gate','滑动铁门与门禁开关','gate',[-5,-6],[11,6]));
box(gate,'Leaf',[6.2,4,.22],[0,2,0],'#788078','moving');
box(gate,'PostLeft',[.4,4.5,.5],[-3.25,2.25,0],'#434d4b','barrier');box(gate,'PostRight',[.4,4.5,.5],[3.25,2.25,0],'#434d4b','barrier');
box(gate,'Header',[6.9,.3,.5],[0,4.5,0],'#434d4b','barrier');
box(gate,'PocketWall',[6.8,4,.25],[6.9,2,-.45],'#626f69','barrier');
box(gate,'ControlBox',[.5,.65,.3],[3.7,1.35,.6],'#4a5352','solid');box(gate,'ControlLight',[.22,.2,.03],[3.7,1.42,.765],'#5eac87');
gate.model.sockets.push({id:'SwitchPoint',parent:'ControlBox',position:[0,0,.18]});
gate.gate={leaf:'Leaf',switchNode:'SwitchPoint',duration:3,travel:[6.5,0,0],passage:{width:6.1,height:4.35},onlyOpen:true};
gate.animation={schema:'animation.v1',id:'ENV_Gate_Open',rig:'nodes.v1',targetModel:gate.id,duration:3,loop:false,mode:'timeline',tracks:{Leaf:[{time:0,position:[0,2,0]},{time:3,position:[6.5,2,0]}]}};
gate.routes=[{id:'ThroughGate',points:[[0,0,4],[0,0,-4]],profiles:Object.keys(profiles)}];
gate.connectors=[{id:'West',position:[-3.25,0,0],outward:[-1,0,0],height:4,thickness:.25},{id:'East',position:[10.3,0,-.45],outward:[1,0,0],height:4,thickness:.25}];save(gate);
console.log('Wrote five reference environment definitions (not production art).');
