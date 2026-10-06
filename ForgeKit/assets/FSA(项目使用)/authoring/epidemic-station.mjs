import fs from 'node:fs';
import path from 'node:path';
const id='FSA_ENV_Epidemic_01_ScreeningStation';
const profiles={player:{radius:.3,height:1.8,margin:.06,maxSlopeDegrees:15},A1:{radius:.74,height:1.92,margin:.06,maxSlopeDegrees:15}};
const materials={plaster:{color:'#c1c2ad',roughness:1},repair:{color:'#afad95',roughness:1},concrete:{color:'#928d79',roughness:1},floor:{color:'#a2a492',roughness:1},teal:{color:'#548078',roughness:.92},dark:{color:'#354e4e',roughness:.8,metalness:.35},roof:{color:'#6c807b',roughness:.88,metalness:.3},metal:{color:'#889a91',roughness:.65,metalness:.45},white:{color:'#d4d6c1',roughness:.88},fabric:{color:'#89a99c',roughness:1},glass:{color:'#799f9a',opacity:.48,transparent:true,roughness:.28},wood:{color:'#786b50',roughness:1}};
const d={schema:'environment.v1',id,label:'防疫站 · 接待筛查与临时诊疗',type:'building',roofMode:'full',profiles,placement:{min:[-7.3,-7.8],max:[7.3,7.8]},colliders:[],walkables:['Floor'],entrances:[],routes:[],lootZones:[],exclusions:[],connectors:[],model:{schema:'model.v1',id,type:'static',materials,parts:[],sockets:[]}};let n=0;
function box(name,size,position,material='plaster',role,rotation,parent){const p={id:name,shape:{type:'box',size},position,material};if(rotation)p.rotation=rotation;if(parent)p.parent=parent;d.model.parts.push(p);if(role)d.colliders.push({node:name,role});return p;}
function wall(name,axis,c,a,b,{height=3.25,hole,window=false}={}){
 const dim=(w,h,t)=>axis==='x'?[w,h,t]:[t,h,w],pos=(v,y,offset=0)=>axis==='x'?[v,y,c+offset]:[c+offset,y,v];
 const piece=(suffix,lo,hi,bottom,top)=>{if(hi<=lo||top<=bottom)return;box(name+suffix,dim(hi-lo,top-bottom,.24),pos((lo+hi)/2,(bottom+top)/2),'plaster','wall');
  if(bottom===0){box(name+suffix+'Base',dim(hi-lo,.32,.27),pos((lo+hi)/2,.16),'concrete','wall');if(top>1.35)box(name+suffix+'Band',dim(hi-lo,.32,.272),pos((lo+hi)/2,1.15),'teal','wall');}
 };
 if(hole){const [center,width,bottom,top]=hole,l=center-width/2,r=center+width/2;piece('Left',a,l,0,height);piece('Right',r,b,0,height);piece('Sill',l,r,0,bottom);piece('Lintel',l,r,top,height);
  if(window){box(name+'Glass',dim(width,top-bottom,.05),pos(center,(top+bottom)/2),'glass','wall');for(const y of [bottom,top])box(name+'Frame'+Math.round(y*100),dim(width+.1,.10,.30),pos(center,y),'white','wall');for(const v of [l,center,r])box(name+'Mullion'+n++,dim(.075,top-bottom,.30),pos(v,(bottom+top)/2),'white','wall');}
 }else piece('',a,b,0,height);
}
function roof(name,x0,x1,z0,z1,y,deg=0){const width=x1-x0,depth=z1-z0;box(name,[width,.15,depth],[(x0+x1)/2,y,(z0+z1)/2],'roof','roof',[0,0,deg]);for(let x=-width/2+.2;x<width/2;x+=.7)box('RoofSeam'+n++,[.025,.035,depth-.02],[x,.092,0],'metal',undefined,undefined,name);return name;}
box('Floor',[12,.16,10],[0,-.08,0],'floor','floor');
wall('Front','x',5,-6,6,{hole:[-2.5,2.6,0,2.65]});wall('Back','x',-5,-6,6,{hole:[3.3,2.2,0,2.5]});
wall('West','z',-6,-5,5,{hole:[-2.3,1.8,1.45,2.35],window:true});wall('East','z',6,-5,5,{hole:[-1,2.0,1.5,2.35],window:true});
wall('ScreenPartition','x',1,-6,.8,{height:2.65,hole:[-2.5,2.4,0,2.45]});wall('StorePartition','x',1,.8,6,{height:2.65,hole:[3.3,2.2,0,2.45]});
wall('ClinicalDivider','z',.8,-5,1,{height:2.65,hole:[-2.5,2.2,0,2.45]});
const roofName=roof('RoofMain',-6.3,6.3,-5.3,5.3,3.86,4);
// Follow the shallow sloping roof, keeping infill in the removable roof group.
for(const z of [-5,5])for(let x=-6;x<6;x+=.3){const width=Math.min(.3,6-x),top=3.86+(x+width/2)*Math.tan(4*Math.PI/180)-.078;box('RoofInfill'+n++,[width,top-3.25,.24],[x+width/2,(top+3.25)/2,z],'plaster','roof');}
for(const x of [-6,6]){const top=3.86+x*Math.tan(4*Math.PI/180)-.078;box('RoofSideInfill'+n++,[.24,top-3.25,10],[x,(top+3.25)/2,0],'plaster','roof');}
roof('RoofEntryCanopy',-4.45,-.55,4.6,6.3,2.98,-2);
box('RoofServiceCurb',[1.76,.30,1.16],[3.6,4.20,-2.8],'dark','roof');box('RoofServiceBox',[1.65,.48,1.05],[3.6,4.53,-2.8],'metal','roof');for(let i=0;i<5;i++)box('RoofVent'+i,[1.35,.028,.04],[3.6,4.39+i*.065,-2.26],'dark','roof');
box('RoofExhaustBase',[.62,.12,.62],[-3.6,3.69,-3.5],'dark','roof');box('RoofExhaust',[.5,.42,.5],[-3.6,3.91,-3.5],'metal','roof');box('RoofExhaustCap',[.7,.12,.7],[-3.6,4.18,-3.5],'dark','roof');
// Permanent geometric medical sign; no interaction glow or reward marker.
box('ClinicSign',[2.0,.55,.1],[-2.5,3.35,5.19],'teal','wall');box('ClinicSignH',[.52,.12,.026],[-2.5,3.35,5.257],'white');box('ClinicSignV',[.12,.38,.026],[-2.5,3.35,5.258],'white');
for(const z of [-5,5])for(const x of [-5.9,5.9])box('CornerTrim'+n++,[.17,3.25,.28],[x,1.625,z],'white','wall');
box('RepairPatch',[.85,.55,.026],[4.8,.65,5.14],'repair');
// Reception and waiting furniture.
box('ReceptionCounter',[2.8,.94,.8],[3,.47,3.6],'white','solid');box('ReceptionWorktop',[2.94,.09,.91],[3,.985,3.6],'teal','solid');
box('CounterFrontStrip',[2.5,.20,.035],[3,.53,4.025],'teal','solid');
box('ReceptionTerminal',[.42,.34,.14],[3.65,1.2,3.5],'dark','solid');box('TerminalScreen',[.32,.21,.02],[3.65,1.22,3.58],'glass');
box('WaitingBench',[.60,.40,2.0],[-5.15,.2,3.35],'metal','solid');box('WaitingCushion',[.62,.10,2.02],[-5.15,.45,3.35],'fabric','solid');box('WaitingBack',[.10,.52,2.02],[-5.43,.67,3.35],'teal','solid');
// One examination bed and a fixed opaque privacy screen, not a giant research device.
box('ExamBedBase',[1.08,.48,2.02],[-4.7,.24,-2.5],'metal','solid');box('ExamMattress',[1.20,.16,2.20],[-4.7,.56,-2.5],'fabric','solid');box('ExamPillow',[.83,.12,.43],[-4.7,.7,-3.23],'white','solid');
box('PrivacyScreen',[2.0,1.65,.10],[-4.5,1.05,-.5],'fabric','solid');for(const x of [-5.47,-3.53]){box('ScreenLeg'+n++,[.06,1.98,.08],[x,.99,-.5],'metal','solid');box('ScreenFoot'+n++,[.13,.07,.48],[x,.035,-.5],'metal','solid');}
box('HandwashCabinet',[1.45,.83,.64],[-4.8,.415,-4.42],'white','solid');box('SinkRim',[1.5,.10,.68],[-4.8,.88,-4.42],'metal','solid');box('SinkBowl',[.78,.025,.38],[-4.8,.943,-4.42],'dark');box('SinkTap',[.055,.21,.055],[-4.8,1.04,-4.65],'metal','solid');
box('MedicalCabinet',[.76,2.12,2.05],[5.28,1.06,-.9],'white','solid');for(const z of [-1.43,-.39]){box('CabinetInset'+n++,[.035,1.35,.83],[4.883,1.3,z],'teal','solid');box('CabinetHandle'+n++,[.06,.28,.035],[4.85,1.18,z],'metal','solid');}
box('SupplyTrolley',[.65,.80,.72],[1.6,.40,-4.28],'metal','solid');box('SupplyTray',[.70,.08,.78],[1.6,.84,-4.28],'white','solid');
for(const x of [1.43,1.72])box('SealedPack'+n++,[.2,.17,.3],[x,.965,-4.28],'fabric','solid');
// Paint belongs to the model only, not a raised support surface.
for(const z of [2.1,2.8,3.5,4.2])box('IntakeGuide'+n++,[.045,.006,.3],[-.95,.004,z],'teal');
function route(name,points){d.routes.push({id:name,points:points.map(([x,z])=>[x,0,z]),profiles:Object.keys(profiles)});for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];d.exclusions.push({id:name+'_'+i,min:[Math.min(a[0],b[0])-.85,Math.min(a[1],b[1])-.85],max:[Math.max(a[0],b[0])+.85,Math.max(a[1],b[1])+.85]});}}
route('ReceptionScreeningExit',[[-2.5,6.65],[-2.5,2.2],[-2.5,-2.5],[3.3,-2.5],[3.3,-6.65]]);
route('ReceptionMedicalLoop',[[-2.5,2.2],[3.3,2.2],[3.3,-2.5]]);
d.entrances=[{id:'Entry',outer:[-2.5,0,6.65],inner:[-2.5,0,3.5],width:2.6,height:2.65,profiles:Object.keys(profiles)},{id:'RearExit',outer:[3.3,0,-6.65],inner:[3.3,0,-3.5],width:2.2,height:2.5,profiles:Object.keys(profiles)}];
for(const [name,min,max] of [['ReceptionSupplies',[-.8,3.8],[.2,4.4]],['ScreeningSupplies',[-1.2,-4.3],[-.4,-3.7]],['MedicalSupplies',[1.3,-.5],[2.1,.2]]])d.lootZones.push({id:name,min,max,surface:'Floor'});
const dir=path.resolve(import.meta.dirname,'../definitions/environments/epidemic');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,id+'.environment.json'),JSON.stringify(d,null,2)+'\n');console.log(id,d.model.parts.length,'parts');
