import { Bone, Group, MathUtils } from 'three';
import { signature } from './rig.js';

// Two rigid segments and two single-axis hinges per arm. Root is a container.
export const FPS_HIERARCHY = {Root:null,UpperArm_L:'Root',Forearm_L:'UpperArm_L',UpperArm_R:'Root',Forearm_R:'UpperArm_R'};
export const FPS_BONES = ['UpperArm_L','Forearm_L','UpperArm_R','Forearm_R'];
export const FPS_DIMENSIONS = {upper:0.28,forearm:0.25};
export const FPS_META = {
 rigId:'fps-arms',rigVersion:'1',
 rigSignature:signature(FPS_HIERARCHY,'+Y up;+X camera-left;+Z forward;left=+X;upper=.28;forearm=.25;shoulders=L(.15,-.16,0),R(-.225,-.16,0);rest=Y(-/+16)*X(40),X(-80);hinge=rest*X(angle)'),
 jointRotationEncoding:'rest-local-x',degreesOfFreedomPerArm:2
};
export function createFpsRig(){
 const root=new Group();root.name='Root';
 const nodes={Root:root};
 for(const side of ['L','R']){
  const upper=new Bone(),forearm=new Bone();
  upper.name=`UpperArm_${side}`;forearm.name=`Forearm_${side}`;
  for(const bone of [upper,forearm])bone.userData={bone:true,jointAxis:'X'};
  upper.position.set(side==='L'?.15:-.225,-.16,0);
  upper.rotation.order='YXZ';upper.rotation.y=MathUtils.degToRad(side==='L'?-16:16);upper.rotation.x=MathUtils.degToRad(40);
  forearm.position.z=FPS_DIMENSIONS.upper;forearm.rotation.x=MathUtils.degToRad(-80);
  root.add(upper);upper.add(forearm);nodes[upper.name]=upper;nodes[forearm.name]=forearm;
 }
 return {root,nodes,dimensions:FPS_DIMENSIONS};
}
