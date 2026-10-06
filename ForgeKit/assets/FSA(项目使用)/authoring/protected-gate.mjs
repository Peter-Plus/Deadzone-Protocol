import fs from 'node:fs';
const id='FSA_ENV_Door_ProtectedSlide',base='assets/FSA(项目使用)/definitions/environments';
const d=JSON.parse(fs.readFileSync(`${base}/doors/FSA_ENV_Door_MilitarySlide.environment.json`));d.id=d.model.id=id;d.label='保护区大铁门 · 内侧滑开／外墙门禁';d.model.parts=[];d.colliders=[];d.model.sockets=[];
const box=(id,size,position,material,parent,role)=>{d.model.parts.push({id,shape:{type:'box',size},position,material,...(parent?{parent}:{})});if(role)d.colliders.push({node:id,role});};
box('Leaf',[6.2,4,.24],[0,2,-.6],'steel',null,'moving');
for(const x of [-2.975,2.975])box(x<0?'FrameLeft':'FrameRight',[.35,4.3,.7],[x,2.15,-.05],'dark',null,'barrier');
box('Header',[6.3,.45,.7],[0,4.075,-.05],'dark',null,'barrier');
box('Track',[12.9,.2,.42],[3.25,4.4,-.6],'edge',null,'barrier');
for(const x of [-2.95,3.5,6.5,9.35]){box('Bracket'+d.model.parts.length,[.16,.35,.85],[x,4.18,-.3],'dark',null,'barrier');}
box('EndStop',[.2,4.4,.38],[9.7,2.2,-.6],'dark',null,'barrier');
for(const face of [-1,1]){
 const z=face*.145;
 for(const x of [-2.85,-1.9,-.95,0,.95,1.9,2.85])box('Rib'+d.model.parts.length,[.075,3.72,.04],[x,0,z],'dark','Leaf');
 for(const y of [-1.72,1.72])box('Rail'+d.model.parts.length,[6,.12,.04],[0,y,z],'edge','Leaf');
 box('Stripe'+d.model.parts.length,[6,.16,.025],[0,-1.18,z],'yellow','Leaf');
 for(let x=-2.7;x<=2.8;x+=.45)for(const y of [-1.73,1.73])box('Rivet'+d.model.parts.length,[.055,.055,.025],[x,y,z+face*.03],'edge','Leaf');
 box('Plaque'+d.model.parts.length,[1.05,.58,.045],[0,.55,z],'dark','Leaf');
 for(const x of [-.25,0,.25])box('Mark'+d.model.parts.length,[.13,.3,.015],[x,.55,z+face*.03],'yellow','Leaf');
}
box('SwitchFront',[.46,.7,.21],[3.65,1.35,.235],'dark',null,'solid');box('ButtonFront',[.27,.29,.04],[3.65,1.38,.36],'green');box('SwitchLabel',[.28,.06,.025],[3.65,1.62,.355],'yellow');
d.model.sockets=[{id:'Interact_Front',parent:'SwitchFront',position:[0,0,.19]}];
d.placement={min:[-3.4,-3],max:[10,3]};d.exclusions=[{id:'Pocket',min:[3.15,-1.05],max:[9.85,-.35]},{id:'SwitchLanding',min:[2.65,.45],max:[4.65,2.45]}];d.connectors=[{id:'Left',position:[-3,0,0],outward:[-1,0,0],height:4,thickness:.25},{id:'Right',position:[3,0,0],outward:[1,0,0],height:4,thickness:.25}];
d.gate={leaf:'Leaf',switchNode:'Interact_Front',duration:3,travel:[6.4,0,0],passage:{width:5.6,height:3.85},onlyOpen:true};d.animation={schema:'animation.v1',id:'FSA_ANIM_Door_ProtectedSlide_Open',rig:'nodes.v1',targetModel:id,duration:3,loop:false,mode:'timeline',tracks:{Leaf:[{time:0,position:[0,2,-.6]},{time:3,position:[6.4,2,-.6]}]}};
fs.writeFileSync(`${base}/doors/${id}.environment.json`,JSON.stringify(d,null,2)+'\n');
const a=JSON.parse(fs.readFileSync(`${base}/barriers/FSA_REF_Protected_TwoGateSlots.assembly.json`));a.id='FSA_REF_Protected_TwoGates';a.label='保护区围墙组合 · 南北双门／独立开启';delete a.gateSlots;a.doors=[{id:'South',asset:id,position:[0,0,-12],yaw:180,pocket:'SouthPocket'},{id:'North',asset:id,position:[0,0,12],yaw:0,pocket:'NorthPocket'}];a.exclusions=[{id:'SouthPocket',min:[-9.85,-11.65],max:[-3.15,-10.95]},{id:'NorthPocket',min:[3.15,10.95],max:[9.85,11.65]}];a.routes=[{id:'AcrossBothGates',points:[[0,0,-15],[0,0,15]],profiles:['player','A1']}];fs.writeFileSync(`${base}/doors/${a.id}.assembly.json`,JSON.stringify(a,null,2)+'\n');


