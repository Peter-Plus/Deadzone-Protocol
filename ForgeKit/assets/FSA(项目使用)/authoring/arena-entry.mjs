import fs from 'node:fs';
import path from 'node:path';
const base=path.resolve('assets/FSA(项目使用)/definitions');
const write=(relative,data)=>{const p=path.join(base,relative);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(data,null,2)+'\n');};
const mat=(color,emissive='#000000')=>({color,emissive,roughness:.78,metalness:.15});
const rock=(id,size,position,seed,material,rotation=[0,0,0])=>({id,shape:{type:'rock',size,seed},position,rotation,material});
for(const [name,label,colors,seed] of [
 ['ShadowStone','暗影石',['#29153f','#51306e','#80579a','#361c50'],311],
 ['NightmareStone','噩梦之石',['#18141b','#491823','#822231','#27151d'],517]]){
 const id='FSA_WORLD_'+name;
 const parts=[rock('Core',[1.18,1.78,.98],[0,0,0],seed,mat(colors[0])),
 rock('UpperFacet',[.78,1.12,.73],[.14,.48,.05],seed+1,mat(colors[1]),[12,28,-12]),
 rock('LowerFacet',[.72,.96,.65],[-.08,-.61,-.02],seed+2,mat(colors[3]),[8,-18,9]),
 rock('BrightFracture',[.22,1.16,.45],[-.37,.07,.22],seed+3,mat(colors[2],colors[1]),[6,-14,-16]),
 rock('EdgeFracture',[.13,.62,.29],[.42,-.16,.17],seed+4,mat(colors[1],colors[3]),[-10,28,18]),
 rock('SatelliteA',[.21,.44,.24],[.92,-.36,.12],seed+5,mat(colors[1]),[18,24,26]),
 rock('SatelliteB',[.16,.3,.2],[-.78,.54,-.1],seed+6,mat(colors[2]),[-16,8,-28])];
 write('models/world/arena/'+id+'.model.json',{schema:'model.v1',id,type:'static',parts,sockets:[{id:'VFX_Anchor',parent:'Core'}]});
}
// Environment solids: stepped internal boxes approximate each tapered rock.
for(let v=1;v<=6;v++){
 const id='FSA_ENV_Arena_Spikes_0'+v,parts=[],colliders=[];
 const count=3+(v%3);
 for(let k=0;k<count;k++){
  const angle=k*2.399+v*.73,dist=k===0?0:.62+(k%2)*.2;
  const x=Math.cos(angle)*dist,z=Math.sin(angle)*dist,h=k===0?2.55+v*.17:1.05+((v+k)%4)*.42;
  const w=k===0?.86:.46+(k%2)*.16;
  parts.push({id:'Spike_'+k,shape:{type:'cone',radius:w*.72,height:h,radialSegments:5},position:[x,h/2-.12,z],rotation:[0,v*19+k*33,0],material:mat(k%2?'#35212a':'#201b24','#100206')});
  parts.push(rock('Basalt_'+k,[w*1.15,.48,w],[x,.08,z],v*100+k,mat('#352530'),[0,k*32,0]));
  for(let j=0;j<4;j++){
   const y=h*(j+.5)/4-.12,side=w*(1-(j+.5)/4)*.94;
   const node='Collision_'+k+'_'+j;
   parts.push({id:node,shape:{type:'box',size:[side,h/4,side]},position:[x,y,z],material:{color:'#201b24',transparent:true,opacity:0}});
   colliders.push({node,role:'solid'});
  }
 }
 write('environments/arena/'+id+'.environment.json',{schema:'environment.v1',id,label:'混沌场地尖刺 '+v,type:'solid',model:{schema:'model.v1',id,type:'static',parts},placement:{min:[-1.65,-1.65],max:[1.65,1.65]},profiles:{player:{radius:.3,height:1.8,margin:.06,maxSlopeDegrees:15}},colliders,walkables:[],entrances:[],routes:[],lootZones:[],exclusions:[],connectors:[]});
}
const dir=path.join(base,'effects/arena');fs.mkdirSync(dir,{recursive:true});
for(const name of ['energy_mist.png','energy_glow.png'])fs.copyFileSync(path.join(base,'effects/fire',name),path.join(dir,name));
const curve=keys=>({keys,interpolation:'smooth'});
const render=(color,opacity,blend='normal')=>({color,opacity,blend,depthTest:true,depthWrite:false});
const cloud=(id,color,count,radii,size,profiles,extra={})=>({id,kind:'cloud',texture:'mist',count,seed:813+count,position:[0,0,0],radii,size,shell:.45,aspect:1,drift:[.08,.1,.08],speed:1.2,rotationSpeed:.3,profiles,render:render(color,.75),...extra});
const finish={duration:1,loop:true};
for(const [id,name,dark,light] of [['vfx_arena_shadow_stone_burst','暗影石 · 交互爆炸','#251335','#a579df'],['vfx_arena_nightmare_stone_burst','噩梦之石 · 交互爆炸','#140d15','#cb2945']]){
 const profile={strength:curve([[0,0],[.05,1],[.32,.85],[1,0]]),expansion:curve([[0,.08],[.16,.48],[.55,1],[1,1.45]])};
 write('effects/arena/'+id+'.effect.json',{schema:'effect.v1',id,name,initialState:'explode',states:{explode:{duration:1.7,loop:false,next:'finished'},finished:finish},variants:{},textures:{mist:{source:'energy_mist.png'},glow:{source:'energy_glow.png'}},layers:[
 cloud('DarkSmoke',dark,100,[1.6,1.2,1.6],[.45,.9],{explode:profile}),
 cloud('ColoredShards',light,64,[1.8,1.3,1.8],[.12,.28],{explode:profile},{shell:.9,aspect:2.2,render:render(light,.72,'additive')}),
 cloud('CoreFlash',light,8,[.12,.12,.12],[.7,1.1],{explode:{strength:curve([[0,0],[.03,1],[.18,0],[1,0]]),expansion:1}},{texture:'glow',render:render(light,.8,'additive')})]});
}
write('effects/arena/vfx_arena_spike_rise.effect.json',{schema:'effect.v1',id:'vfx_arena_spike_rise',name:'混沌入场 · 暗红黑破地雾',initialState:'rise',states:{rise:{duration:3.2,loop:false,next:'finished'},finished:finish},variants:{},textures:{mist:{source:'energy_mist.png'}},layers:[
 cloud('GroundShroud','#160e16',220,[.82,.08,.82],[.08,.16],{rise:{strength:curve([[0,0],[.15,.8],[.52,.85],[1,0]]),expansion:curve([[0,.35],[.3,1],[1,1]]),rise:curve([[0,0],[1,.32]]),riseSpread:1}},{position:[0,.025,0],aspect:1.2,drift:[.015,.025,.015],render:render('#160e16',.6)}),
 cloud('BloodFissures','#ac1935',140,[.8,.04,.8],[.025,.065],{rise:{strength:curve([[0,0],[.12,1],[.5,.75],[1,0]]),expansion:curve([[0,.2],[.26,1],[1,1]]),rise:curve([[0,0],[1,.23]]),riseSpread:.8}},{position:[0,.04,0],aspect:2.6,drift:[.01,.02,.01],render:render('#ac1935',.55,'additive')})]});
const active={strength:1,expansion:1};
write('effects/arena/vfx_arena_boundary.effect.json',{schema:'effect.v1',id:'vfx_arena_boundary',name:'通用首领结界 · 赤紫能量幕',initialState:'appear',states:{appear:{duration:1.4,loop:false,next:'active'},active:{duration:4,loop:true},dissolve:{duration:1.3,loop:false,next:'finished'},finished:finish},variants:{},textures:{},layers:[{id:'BoundaryCurtain',kind:'surface',shape:'barrier',position:[0,0,0],size:[1,1,1],accent:'#e776a8',detailScale:1.1,speed:.7,rimWidth:.05,profiles:{appear:{strength:curve([[0,0],[.25,.45],[1,1]]),expansion:1},active,dissolve:{strength:curve([[0,1],[1,0]]),expansion:1}},render:render('#602544',.68)}]});
console.log('Authored 2 stones, 6 environment solids and 4 effects.');
