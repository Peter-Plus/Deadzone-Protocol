import {nodeMeta} from '../core/node-rig.js';
import {rockGeometry} from './rock.js';
import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createRig, humanoidMeta, humanoidBones } from '../core/rig.js';
import { createFpsRig, FPS_META, FPS_BONES } from '../core/fps-rig.js';
import { validate, formatErrors } from '../validator/validation.js';
class NodeFileReader {
 readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.({target:this});}).catch(e=>this.onerror?.(e));}
 readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result=`data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;this.onloadend?.({target:this});}).catch(e=>this.onerror?.(e));}
}
globalThis.FileReader??=NodeFileReader;
const radians=v=>v.map(T.MathUtils.degToRad);
function transform(node,p){node.position.fromArray(p.position??[0,0,0]);node.quaternion.setFromEuler(new T.Euler(...radians(p.rotation??[0,0,0]),'XYZ'));if(typeof p.scale==='number')node.scale.setScalar(p.scale);else node.scale.fromArray(p.scale??[1,1,1]);}
function geometry(s){switch(s.type){
 case 'rock':return rockGeometry(s);
 case 'box':return new T.BoxGeometry(...s.size);
 case 'sphere':return new T.SphereGeometry(s.radius,24,16);
 case 'cylinder':return new T.CylinderGeometry(s.radiusTop,s.radiusBottom,s.height,24);
 case 'capsule':return new T.CapsuleGeometry(s.radius,s.length,8,16);
 case 'cone':{const g=new T.ConeGeometry(s.radius,s.height,s.radialSegments??24);if(s.radialSegments!==undefined){const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();return flat;}return g;}
 case 'plane':return new T.PlaneGeometry(s.width,s.height);
}}
function material(m,d,library){while(typeof m==='string')m=Object.hasOwn(d.materials??{},m)?d.materials[m]:library.materials.get(m);m??={};return new T.MeshStandardMaterial({color:m.color??'#aab3c2',roughness:m.roughness??0.8,metalness:m.metalness??0,emissive:m.emissive??'#000000',opacity:m.opacity??1,transparent:m.transparent??false});}
function base(d){const root=new T.Group();root.name='Asset';root.userData={assetId:d.id,assetSchema:d.schema,assetType:d.type??'animation',units:'meter',up:'+Y',forward:'+Z'};return root;}
export function buildModel(d,library){
 const root=base(d);transform(root,d.root??{});const nodes=new Map();
 if(d.type==='humanoid'){
  const rig=createRig(d.parameters,d.rig,d.jointPositions);root.add(rig.root);Object.assign(root.userData,humanoidMeta(d.rig));for(const n of humanoidBones(d.rig))nodes.set(n,rig.nodes[n]);
  // Keep the v1 appearance unchanged; v2 uses separate rigid limb segments.
  if(!d.parts?.length){const p=rig.dimensions;const defaults=[
   ['Body',[p.width,p.body,p.depth],[0,p.body/2,0]],['Head',[p.head,p.head,p.head],[0,p.head/2,0]],
   ['Arm_L',[p.arm,p.armThickness,p.armThickness],[p.arm/2,0,0]],['Arm_R',[p.arm,p.armThickness,p.armThickness],[-p.arm/2,0,0]],
   ['Leg_L',[p.legThickness,p.leg,p.legThickness],[0,-p.leg/2,0]],['Leg_R',[p.legThickness,p.leg,p.legThickness],[0,-p.leg/2,0]]];
   if(d.rig==='humanoid.v2'){
    defaults.splice(2);
    for(const [side,s] of [['L',1],['R',-1]]){
     defaults.push(['Arm_'+side,[p.arm*.5,p.armThickness,p.armThickness],[s*p.arm*.25,0,0]],['Forearm_'+side,[p.arm*.4,p.armThickness*.8,p.armThickness*.8],[s*p.arm*.2,0,0]],['Hand_'+side,[p.arm*.1,p.armThickness*.8,p.armThickness],[s*p.arm*.05,0,0]],['Leg_'+side,[p.legThickness,p.leg*.5,p.legThickness],[0,-p.leg*.25,0]],['LowerLeg_'+side,[p.legThickness,p.leg*.5,p.legThickness],[0,-p.leg*.25,0]]);
    }
   }
   for(const [bone,size,position] of defaults){const mesh=new T.Mesh(new T.BoxGeometry(...size),material(bone==='Head'?{color:'#e5b68e'}:{color:'#557ea9'},d,library));mesh.name=`Visual_${bone}`;mesh.position.fromArray(position);rig.nodes[bone].add(mesh);}
   const face=new T.Mesh(new T.BoxGeometry(p.head*0.55,p.head*0.12,p.head*0.04),material({color:'#25354b'},d,library));face.name='Visual_Face';face.position.set(0,p.head*0.6,p.head*0.51);rig.nodes.Head.add(face);
  }
 }
 if(d.type==='fps_arms'){const rig=createFpsRig();for(const [n,angle] of Object.entries(d.rigPose??{}))rig.nodes[n].rotateX(T.MathUtils.degToRad(angle));root.add(rig.root);Object.assign(root.userData,FPS_META);for(const [n,node] of Object.entries(rig.nodes))nodes.set(n,node);}
 for(const p of d.parts??[]){const mesh=new T.Mesh(geometry(p.shape),material(p.material,d,library));mesh.name=p.id;transform(mesh,p);nodes.set(p.id,mesh);}
 for(const s of d.sockets??[]){const node=new T.Object3D();node.name=s.id;node.userData={socket:true,socketId:s.id};transform(node,s);nodes.set(s.id,node);}
 for(const p of [...(d.parts??[]),...(d.sockets??[])]) (nodes.get(p.parent)??(d.type==='humanoid'||d.type==='fps_arms'?nodes.get('Root'):root)).add(nodes.get(p.id));
 if(d.type==='static'&&library.entries?.some(e=>e.data.rig==='nodes.v1'&&e.data.targetModel===d.id))Object.assign(root.userData,nodeMeta(d));
 root.userData.sockets=(d.sockets??[]).map(s=>s.id);root.updateMatrixWorld(true);return {root,animations:[]};
}
export function animationKeys(d,library){
 if(d.mode==='timeline')return Object.fromEntries(Object.entries(d.tracks).map(([bone,keys])=>[bone,keys.map(k=>({...library.poses.get(k.pose)?.bones[bone],...k}))]));
 const run=d.generator==='humanoid.run',idle=d.generator==='humanoid.idle';
 const p={armSwing:idle?2:run?45:25,legSwing:idle?0:run?45:30,bodyBob:idle?0.005:run?0.045:0.02,bodyLean:idle?0:run?10:2,samples:48,...d.parameters};
 const tracks=Object.fromEntries(['Body','Arm_L','Arm_R','Leg_L','Leg_R'].map(n=>[n,[]]));
 for(let i=0;i<=p.samples;i++){
  const time=d.duration*i/p.samples,phase=i===p.samples?0:i/p.samples*Math.PI*2,s=Math.sin(phase);
  // Rotate arms down from the shared T-pose, then swing about local X.
  tracks.Arm_L.push({time,rotation:[p.armSwing*s,0,-90]});tracks.Arm_R.push({time,rotation:[-p.armSwing*s,0,90]});
  tracks.Leg_L.push({time,rotation:[-p.legSwing*s,0,0]});tracks.Leg_R.push({time,rotation:[p.legSwing*s,0,0]});
  tracks.Body.push({time,rotation:[p.bodyLean,0,0],position:[0,p.bodyBob*(1-Math.cos(phase*(idle?1:2)))/2,0]});
 }
 return tracks;
}
export function buildAnimation(d,library){
 if(d.rig==='nodes.v1'){
  const model=library.entries.find(e=>e.data.id===d.targetModel).data,root=base(d),nodes=new Map();transform(root,model.root??{});
  Object.assign(root.userData,nodeMeta(model),{loop:d.loop,duration:d.duration,targetModel:d.targetModel,positionEncoding:'absolute-local'});
  for(const p of [...model.parts,...(model.sockets??[])]){const n=new T.Object3D();n.name=p.id;transform(n,p);nodes.set(p.id,n);}
  for(const p of [...model.parts,...(model.sockets??[])])(nodes.get(p.parent)??root).add(nodes.get(p.id));
  const tracks=[];
  for(const [name,keys] of Object.entries(d.tracks))for(const prop of ['rotation','position','scale']){
   const list=keys.filter(k=>k[prop]);if(!list.length)continue;
   if(list[0].time>0)list.unshift({...list[0],time:0});if(list.at(-1).time<d.duration)list.push({...list.at(-1),time:d.duration});
   let previous;const values=[];for(const k of list){if(prop==='rotation'){const q=new T.Quaternion().setFromEuler(new T.Euler(...radians(k[prop]),'XYZ'));if(previous&&previous.dot(q)<0)q.set(-q.x,-q.y,-q.z,-q.w);values.push(...q.toArray());previous=q;}else values.push(...k[prop]);}
   tracks.push(prop==='rotation'?new T.QuaternionKeyframeTrack(name+'.quaternion',list.map(k=>k.time),values):new T.VectorKeyframeTrack(name+'.'+prop,list.map(k=>k.time),values));
  }
  return {root,animations:[new T.AnimationClip(d.id,d.duration,tracks)]};
 }

 const fps=d.rig==='fps-arms.v1',root=base(d),rig=fps?createFpsRig():createRig({},d.rig);root.add(rig.root);Object.assign(root.userData,fps?FPS_META:humanoidMeta(d.rig),{loop:d.loop,duration:d.duration,positionEncoding:'canonical-local',canonicalTranslations:Object.fromEntries((fps?FPS_BONES:humanoidBones(d.rig)).map(n=>[n,rig.nodes[n].position.toArray()]))});
 const tracks=[];
 for(const [bone,keys] of Object.entries(animationKeys(d,library))){
  for(const property of ['rotation','position']){
   const list=keys.filter(k=>k[property]);if(!list.length)continue;
   // Explicit endpoints preserve authored duration in glTF, including held poses.
   if(list[0].time>0)list.unshift({...list[0],time:0});
   if(list.at(-1).time<d.duration)list.push({...list.at(-1),time:d.duration});
   const times=list.map(k=>k.time),values=[];let previous=null;
   for(const k of list){if(property==='rotation'){const q=new T.Quaternion().setFromEuler(new T.Euler(...radians(k.rotation),'XYZ'));if(fps)q.premultiply(rig.nodes[bone].quaternion);if(previous&&previous.dot(q)<0)q.set(-q.x,-q.y,-q.z,-q.w);values.push(...q.toArray());previous=q;}else values.push(...rig.nodes[bone].position.clone().add(new T.Vector3(...k.position)).toArray());}
   tracks.push(property==='rotation'?new T.QuaternionKeyframeTrack(`${bone}.quaternion`,times,values):new T.VectorKeyframeTrack(`${bone}.position`,times,values));
  }
 }
 if(fps&&d.stance){
  const times=[],values=[],offset=new T.Vector3(...d.stance.leftOffset),rest=rig.nodes.UpperArm_L.position;
  for(let i=0;i<=32;i++){const u=i/32,smooth=v=>{v=T.MathUtils.clamp(v,0,1);return v*v*(3-2*v);},weight=d.stance.blend==='in'?smooth((u-.75)/.25):d.stance.blend==='out'?smooth((.25-u)/.25):d.stance.blend==='assist'?1-smooth(Math.min(u,1-u)/.12):1;times.push(d.duration*u);values.push(...rest.clone().addScaledVector(offset,weight).toArray());}
  tracks.push(new T.VectorKeyframeTrack('UpperArm_L.position',times,values));
 }
 return {root,animations:[new T.AnimationClip(d.id,d.duration,tracks)]};
}
export function dispose(root){root.traverse(n=>{n.geometry?.dispose();for(const m of n.material?(Array.isArray(n.material)?n.material:[n.material]):[]){for(const value of Object.values(m))if(value?.isTexture)value.dispose();m.dispose();}});}
export async function compile(d,library={materials:new Map(),poses:new Map()},file='<memory>'){
 const errors=validate(d,file,library);if(errors.length)throw new Error(formatErrors(errors));
 if(!['model.v1','animation.v1'].includes(d.schema))throw new Error('Only models and animations produce GLB files.');
 const {root,animations}=d.schema==='model.v1'?buildModel(d,library):buildAnimation(d,library);
 try {return Buffer.from(await new GLTFExporter().parseAsync(root,{binary:true,trs:true,onlyVisible:false,animations}));}finally{dispose(root);}
}
