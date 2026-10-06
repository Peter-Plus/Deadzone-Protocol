import { createHash } from 'node:crypto';
import { Bone } from 'three';
export const HIERARCHY = {Root:null,Body:'Root',Head:'Body',Arm_L:'Body',Arm_R:'Body',Leg_L:'Body',Leg_R:'Body'};
export const BONES = Object.keys(HIERARCHY);
export const V2_HIERARCHY = {...HIERARCHY,Forearm_L:'Arm_L',Hand_L:'Forearm_L',Forearm_R:'Arm_R',Hand_R:'Forearm_R',LowerLeg_L:'Leg_L',LowerLeg_R:'Leg_R'};
export const V2_BONES = Object.keys(V2_HIERARCHY);
export const V2_JOINTS = V2_BONES.filter(n=>!BONES.includes(n));
export const AXIS = '+Y up;+X right;+Z forward;Euler XYZ;identity T-pose;left=+X';
export function signature(hierarchy=HIERARCHY,axis=AXIS) {
 return createHash('sha256').update(JSON.stringify({bones:Object.entries(hierarchy).sort(([a],[b])=>a.localeCompare(b)),axis})).digest('hex');
}
export const RIG_META = {rigId:'humanoid',rigVersion:'1',rigSignature:signature()};
export const V2_META = {rigId:'humanoid',rigVersion:'2',rigSignature:signature(V2_HIERARCHY)};
export const humanoidBones = rig=>rig==='humanoid.v2'?V2_BONES:BONES;
export const humanoidMeta = rig=>rig==='humanoid.v2'?V2_META:RIG_META;
export function proportions(p={}) {
 const h=p.height??1.8, leg=p.legLength??h*0.46, head=h*0.16*(p.headScale??1), body=h-leg-head;
 return {height:h,leg,head,body,width:p.bodyWidth??h*0.25,depth:p.bodyDepth??h*0.14,arm:p.armLength??h*0.32,armThickness:p.armThickness??h*0.09,legThickness:p.legThickness??h*0.11};
}
export function createRig(p={},rig='humanoid.v1',jointPositions={}) {
 const d=proportions(p), nodes=Object.fromEntries(humanoidBones(rig).map(n=>{const b=new Bone();b.name=n; b.userData={bone:true};return [n,b];}));
 for(const [n,parent] of Object.entries(rig==='humanoid.v2'?V2_HIERARCHY:HIERARCHY)) if(parent) nodes[parent].add(nodes[n]);
 nodes.Body.position.set(0,d.leg,0);
 nodes.Head.position.set(0,d.body,0);
 nodes.Arm_L.position.set(d.width/2,d.body*0.85,0);
 nodes.Arm_R.position.set(-d.width/2,d.body*0.85,0);
 nodes.Leg_L.position.set(d.width*0.25,0,0);
 nodes.Leg_R.position.set(-d.width*0.25,0,0);
 if(rig==='humanoid.v2')for(const [side,s] of [['L',1],['R',-1]]){
  nodes['Forearm_'+side].position.fromArray(jointPositions['Forearm_'+side]??[s*d.arm*.5,0,0]);
  nodes['Hand_'+side].position.fromArray(jointPositions['Hand_'+side]??[s*d.arm*.4,0,0]);
  nodes['LowerLeg_'+side].position.fromArray(jointPositions['LowerLeg_'+side]??[0,-d.leg*.5,0]);
 }
 return {root:nodes.Root,nodes,dimensions:d};
}
