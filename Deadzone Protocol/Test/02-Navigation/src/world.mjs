// Pure deterministic geometry contract, shared by CLI, validation and offline preview.
export const VERSION='1.0.0';
export const SCHEMA='world-assets.v1';
export const DEFAULTS={size:160,count:15,cell:1};
export function rng(seed,stream){let h=2166136261;for(const c of `${seed}:${stream}`)h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
export function transform(p,i){const a=i.rotation[1],c=Math.cos(a),s=Math.sin(a);return[c*p[0]+s*p[2]+i.position[0],p[1]+i.position[1],-s*p[0]+c*p[2]+i.position[2]];}
export function inverse(p,i){const x=p[0]-i.position[0],z=p[2]-i.position[2],a=i.rotation[1];return[Math.cos(a)*x-Math.sin(a)*z,p[1]-i.position[1],Math.sin(a)*x+Math.cos(a)*z];}
export function templates(){return [makeTemplate('through','双出口单间',10,10,.4,0,'#b6a88c'),makeTemplate('bent','转折通路小屋',12,12,.5,1,'#91a19a'),makeTemplate('warehouse','开敞入口仓库',12,10,.2,2,'#aeb2b2')];}
function makeTemplate(id,label,w,d,f,kind,color){
 const parts=[],colliders=[],walkableSurfaces=[],exclusions=[];const clear=3.8,door=kind===2?5:3.6,dh=3.6,t=.3,L=3;
 function box(name,size,position,role,rotation=[0,0,0],col=color){parts.push({id:name,shape:{type:'box',size},position,rotation:rotation.map(v=>v*180/Math.PI),material:{color:col,roughness:.9}});colliders.push({id:name,role,shape:'box',size,position,rotation});}
 box('floor',[w,f,d],[0,f/2,0],'floor',[0,0,0],'#79796d');
 box('wall_left',[t,clear,d],[-w/2+t/2,f+clear/2,0],'wall');box('wall_right',[t,clear,d],[w/2-t/2,f+clear/2,0],'wall');
 const entrances=[];
 for(const sign of [-1,1]){
  const gap=door,z=sign*(d/2-t/2),piece=(w-gap)/2;
  for(const side of [-1,1])box(`wall_${sign<0?'back':'front'}_${side<0?'L':'R'}`,[piece,clear,t],[side*(gap/2+piece/2),f+clear/2,z],'wall');
  box(`lintel_${sign<0?'back':'front'}`,[gap,clear-dh,t],[0,f+dh+(clear-dh)/2,z],'wall',[0,0,0],'#59635e');
  const angle=Math.atan(f/L),th=.12;
  box(`ramp_${sign<0?'back':'front'}`,[door,th,Math.hypot(L,f)],[0,f/2-th/2*Math.cos(angle),sign*(d/2+L/2-th/2*Math.sin(angle))],'ramp',[sign*angle,0,0],'#c5aa73');
  const top=[0,f,sign*d/2],bottom=[0,0,sign*(d/2+L)];
  const polygon=[[-door/2,f,sign*d/2],[door/2,f,sign*d/2],[door/2,0,sign*(d/2+L)],[-door/2,0,sign*(d/2+L)]];
  entrances.push({entranceId:`${id}-${sign}`,width:door,clearHeight:dh,top,bottom,rampLength:L,slopeDegrees:angle*180/Math.PI,landing:{min:[-door/2,sign>0?d/2+L:-d/2-L-2],max:[door/2,sign>0?d/2+L+2:-d/2-L]},surfaceId:`ramp_${sign<0?'back':'front'}`});
  walkableSurfaces.push({surfaceId:`ramp_${sign<0?'back':'front'}`,kind:'ramp',polygon,colliderId:`ramp_${sign<0?'back':'front'}`});
  exclusions.push({id:`entry-${sign}`,reason:'entrance-ramp-turning',min:[-door/2-.3,sign>0?d/2-2:-d/2-L-2],max:[door/2+.3,sign>0?d/2+L+2:-d/2+2]});
 }
 box('roof',[w+.3,.3,d+.3],[0,f+clear+.15,0],'roof',[0,0,0],kind===2?'#4a6468':'#685e50');
 // Offset openings in two partitions force a genuine left/right turn; 4.4 m gaps.
 if(kind===1){box('partition_s',[7.3,clear,t],[-2.05,f+clear/2,-2],'wall');box('partition_n',[7.3,clear,t],[2.05,f+clear/2,2],'wall');}
 const path=kind===1?[[0,f,-d/2],[0,f,-4],[3.5,f,-4],[3.5,f,0],[-3.5,f,0],[-3.5,f,4],[0,f,4],[0,f,d/2]]:[[0,f,-d/2],[0,f,d/2]];
 const routeRadius=1.65;
 exclusions.push({id:'main-route',reason:'main-circulation',polyline:path,radius:routeRadius});
 const region=kind===1?{min:[-5.2,-5.2],max:[-2.7,-3.2]}:{min:[-w/2+.8,-1.8],max:[-door/2-.6,1.8]};
 walkableSurfaces.unshift({surfaceId:'interior-floor',kind:'floor',polygon:[[-w/2,f,-d/2],[w/2,f,-d/2],[w/2,f,d/2],[-w/2,f,d/2]],colliderId:'floor',subtractBlockers:'wall colliders; complete floor polygon includes doorway thresholds'});
 return{schemaVersion:SCHEMA,templateId:id,label,visualAsset:`generated/models/${id}.glb`,size:[w,d],floorElevation:f,clearHeight:clear,doorWidth:door,doorHeight:dh,foundation:{min:[-w/2,0,-d/2],max:[w/2,f,d/2]},reservation:{min:[-w/2-1,-d/2-L-2],max:[w/2+1,d/2+L+2]},colliders,walkableSurfaces,entrances,interiorRegions:[{regionId:`${id}-storage`,tags:['indoor','loot-candidate'],...region,heightSource:'interior-floor',floorY:f}],exclusions,connections:{polyline:path,clearWidth:3.3,from:entrances[0].entranceId,to:entrances[1].entranceId},definition:{schema:'model.v1',id:`world01.${id}`,type:'static',parts}};
}
export function generate(seed,config={},terrainAttempt=0,layoutAttempt=0){
 const cfg={...DEFAULTS,...config};if(!Number.isInteger(cfg.count)||cfg.count<12||cfg.count>18||cfg.size<160||cfg.size>240||cfg.cell!==1||cfg.size%2)throw Error('Configuration requires count 12..18, even size 160..240, cell=1.');
 const layout=rng(seed,`buildings.v1:${layoutAttempt}`),terrainR=rng(seed,`terrain.v1:${terrainAttempt}`),phase=[terrainR()*6.28,terrainR()*6.28,terrainR()*6.28],ts=templates();
 const layoutAngle=Math.floor(rng(seed,'settlement-orientation.v1')()*4)*Math.PI/2;
 const rotateSite=(x,z)=>[Math.cos(layoutAngle)*x+Math.sin(layoutAngle)*z,-Math.sin(layoutAngle)*x+Math.cos(layoutAngle)*z];
 const groups=[{id:'A',name:'密集聚落 A',spacing:25,slots:[[-48,-48],[-23,-48],[-48,-23],[-23,-23],[-48,2],[-23,2]]},{id:'B',name:'疏散聚落 B',spacing:30,slots:[[21,-47],[52,-47],[21,-17],[52,-17],[37,13],[65,13]]},{id:'C',name:'线形聚落 C',spacing:31,slots:[[-53,51],[-22,51],[9,51],[40,51],[65,48],[-64,25]]}];
 const scale=cfg.size/160,buildings=[];const counts=[Math.min(6,Math.ceil(cfg.count/3)+1),Math.floor(cfg.count/3),cfg.count-Math.min(6,Math.ceil(cfg.count/3)+1)-Math.floor(cfg.count/3)];
 // For 18 use exactly six slots per group.
 if(cfg.count===18)counts.splice(0,3,6,6,6);
 function raw(x,z){return 1.7+.85*Math.sin(x/36+phase[0])*Math.cos(z/42+phase[1])+.75*Math.sin((x+z)/52+phase[2]);}
 for(let g=0;g<3;g++)for(let n=0;n<counts[g];n++){
  const slot=groups[g].slots[n],[x,z]=rotateSite(slot[0]*scale+(layout()-.5)*2,slot[1]*scale+(layout()-.5)*2),t=ts[(n+g+Math.floor(layout()*3))%3],a=Math.floor(layout()*4)*Math.PI/2;
  const center=rotateSite(groups[g].slots.slice(0,counts[g]).reduce((v,p)=>v+p[0],0)/counts[g]*scale,groups[g].slots.slice(0,counts[g]).reduce((v,p)=>v+p[1],0)/counts[g]*scale);
  const instanceId=`${groups[g].id}-${n+1}`,i={instanceId,templateId:t.templateId,settlementId:groups[g].id,position:[x,raw(...center),z],rotation:[0,a,0],scale:[1,1,1]};
  const corners=[t.reservation.min,[t.reservation.min[0],t.reservation.max[1]],t.reservation.max,[t.reservation.max[0],t.reservation.min[1]]].map(p=>transform([p[0],0,p[1]],i));
  i.reservationWorld=corners;i.platform={height:i.position[1],min:[Math.min(...corners.map(p=>p[0]))-1.5,Math.min(...corners.map(p=>p[2]))-1.5],max:[Math.max(...corners.map(p=>p[0]))+1.5,Math.max(...corners.map(p=>p[2]))+1.5],blend:14};
  i.entranceConnections=t.entrances.map(e=>({entranceId:e.entranceId,topWorld:transform(e.top,i),bottomWorld:transform(e.bottom,i),terrainSurface:'terrain',interiorSurface:`${instanceId}/interior-floor`}));buildings.push(i);
 }
 const overlap=(a,b)=>a.min[0]<b.max[0]&&a.max[0]>b.min[0]&&a.min[1]<b.max[1]&&a.max[1]>b.min[1];
 const reserved=b=>({min:[Math.min(...b.reservationWorld.map(p=>p[0])),Math.min(...b.reservationWorld.map(p=>p[2]))],max:[Math.max(...b.reservationWorld.map(p=>p[0])),Math.max(...b.reservationWorld.map(p=>p[2]))]});
 let illegal=false;for(let a=0;a<buildings.length;a++)for(let b=a+1;b<buildings.length;b++)if(overlap(reserved(buildings[a]),reserved(buildings[b]))||(buildings[a].settlementId!==buildings[b].settlementId&&overlap(buildings[a].platform,buildings[b].platform)))illegal=true;
 if(illegal){if(layoutAttempt>=63)throw Error('No legal layout after 64 candidates; increase map size or reduce count.');return generate(seed,cfg,terrainAttempt,layoutAttempt+1);}
 const n=cfg.size/cfg.cell+1,heights=[];
 function height(x,z){const base=raw(x,z);let sum=0,value=0;for(const b of buildings){const p=b.platform,d=Math.max(p.min[0]-x,0,x-p.max[0],p.min[1]-z,z-p.max[1]);if(d===0)return p.height;if(d<p.blend){const t=1-d/p.blend,w=t*t*(3-2*t);sum+=w;value+=w*p.height;}}return sum?base*(1-Math.min(1,sum))+value/sum*Math.min(1,sum):base;}
 for(let z=0;z<n;z++)for(let x=0;x<n;x++)heights.push(Math.fround(height(x*cfg.cell-cfg.size/2,z*cfg.cell-cfg.size/2)));
 // Keep comparable shallow relief for every seed, transforming platforms with terrain.
 const hmin=Math.min(...heights),factor=2.2/(Math.max(...heights)-hmin);
 for(let k=0;k<heights.length;k++)heights[k]=Math.fround((heights[k]-hmin)*factor);
 for(const b of buildings){const next=(b.position[1]-hmin)*factor,delta=next-b.position[1];b.position[1]=next;b.platform.height=next;for(const p of b.reservationWorld)p[1]+=delta;for(const e of b.entranceConnections){e.topWorld[1]+=delta;e.bottomWorld[1]+=delta;}}
 let steep=false;for(let z=0;z<n-1;z++)for(let x=0;x<n-1;x++){const k=z*n+x,a=heights[k],b=heights[k+1],c=heights[k+n],d=heights[k+n+1];if(Math.max(Math.hypot(b-a,d-b),Math.hypot(d-c,c-a))/cfg.cell>Math.tan(15*Math.PI/180))steep=true;}
 if(steep){if(terrainAttempt>=31)throw Error('No terrain under 15 degrees after 32 deterministic candidates');return generate(seed,cfg,terrainAttempt+1,layoutAttempt);}
 return{schemaVersion:SCHEMA,generatorVersion:VERSION,seed:String(seed),config:cfg,coordinates:{units:'meters',up:'+Y',forward:'+Z',rotation:'Euler XYZ radians',scale:1},settlements:groups.map((g,k)=>({id:g.id,name:g.name,count:counts[k],nominalSpacing:g.spacing*scale})),buildings,terrain:{schemaVersion:'heightfield.v1',asset:`terrain/${seed}.glb`,origin:[-cfg.size/2,0,-cfg.size/2],cell:cfg.cell,rows:n,columns:n,heights,diagonal:'a-d; triangles a,c,d and a,d,b; row-major x fastest',priority:'terrain below foundation; floor/ramp top overrides terrain; roof excluded from walkable surfaces'},outdoorRegions:[{regionId:'central-corridor',tags:['outdoor','loot-candidate'],min:[-7,-7],max:[7,7],heightSource:'terrain',reject:'building reservations and entrance/main-route exclusions'}]};
}
export function terrainBuffers(t){const positions=[],indices=[];for(let z=0;z<t.rows;z++)for(let x=0;x<t.columns;x++)positions.push(t.origin[0]+x*t.cell,t.heights[z*t.columns+x],t.origin[2]+z*t.cell);for(let z=0;z<t.rows-1;z++)for(let x=0;x<t.columns-1;x++){const a=z*t.columns+x,b=a+1,c=a+t.columns,d=c+1;indices.push(a,c,d,a,d,b);}return{positions,indices};}
export function ground(t,x,z){const fx=(x-t.origin[0])/t.cell,fz=(z-t.origin[2])/t.cell;if(fx<0||fz<0||fx>t.columns-1||fz>t.rows-1)return null;const ix=Math.min(Math.floor(fx),t.columns-2),iz=Math.min(Math.floor(fz),t.rows-2),u=fx-ix,v=fz-iz,k=iz*t.columns+ix,a=t.heights[k],b=t.heights[k+1],c=t.heights[k+t.columns],d=t.heights[k+t.columns+1];const dx=u>=v?b-a:d-c,dz=u>=v?d-b:c-a;const len=Math.hypot(dx/t.cell,1,dz/t.cell);return{height:u>=v?a+u*(b-a)+v*(d-b):a+u*(d-c)+v*(c-a),normal:[-dx/t.cell/len,1/len,-dz/t.cell/len]};}
// Surface selection is not collision resolution: subtract walls and query a capsule in 02.
export function walkSurface(s,ts,x,z){let out=ground(s.terrain,x,z);if(!out)return null;out={...out,surfaceId:'terrain'};for(const i of s.buildings){const t=ts.find(t=>t.templateId===i.templateId),p=inverse([x,0,z],i);if(Math.abs(p[0])<=t.size[0]/2&&Math.abs(p[2])<=t.size[1]/2)return{height:i.position[1]+t.floorElevation,normal:[0,1,0],surfaceId:`${i.instanceId}/interior-floor`};for(const e of t.entrances){const sign=Math.sign(e.top[2]),run=sign*(p[2]-e.top[2]);if(Math.abs(p[0])<=e.width/2&&run>=0&&run<=e.rampLength){const a=e.slopeDegrees*Math.PI/180,n=[0,Math.cos(a),sign*Math.sin(a)],rot={...i,position:[0,0,0]};return{height:i.position[1]+t.floorElevation*(1-run/e.rampLength),normal:transform(n,rot),surfaceId:`${i.instanceId}/${e.surfaceId}`};}}}return out;}



