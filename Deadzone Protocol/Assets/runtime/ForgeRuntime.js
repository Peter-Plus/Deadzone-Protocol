(function(global){
 'use strict';
 function metadata(scene){let found=null;scene.traverse(n=>{if(!found&&n.userData?.assetSchema)found=n.userData;});return found??{};}
 function compatible(a,b){return ['rigId','rigVersion','rigSignature'].every(k=>typeof a[k]==='string'&&a[k].length>0&&a[k]===b[k]);}
 // Explicit, directional bridge for the two published humanoid contracts.
 // Tests compare these pinned hashes with the compiler; never accept version alone.
 const humanoidSignatures={'1':'5247d05b2d71a05f6fc1fca04fa24f31e4804536ac789e21d6670c805183fc20','2':'84ad95d3966b24b90b2f2b8ccc8a03faee952217f3e633ebb7598cb36abc3ac4'};
 const v1Bones=['Root','Body','Head','Arm_L','Arm_R','Leg_L','Leg_R'];
 const v2Bones=[...v1Bones,'Forearm_L','Hand_L','Forearm_R','Hand_R','LowerLeg_L','LowerLeg_R'];
 function compatibility(modelMeta,animationMeta){
  if(compatible(modelMeta,animationMeta))return 'exact';
  if(modelMeta.rigId==='humanoid'&&animationMeta.rigId==='humanoid'&&modelMeta.rigVersion==='2'&&animationMeta.rigVersion==='1'&&modelMeta.rigSignature===humanoidSignatures['2']&&animationMeta.rigSignature===humanoidSignatures['1'])return 'humanoid-v1-to-v2';
  return null;
 }
 const restPoses=new WeakMap();
 function captureRestPose(model){
  if(!restPoses.has(model)){const rest=new Map();model.traverse(n=>{if(n.userData?.bone||(metadata(model).rigId==='nodes'&&metadata(model).nodeNames.includes(n.name)))rest.set(n.name,{position:n.position.toArray(),quaternion:n.quaternion.toArray(),scale:n.scale.toArray()});});restPoses.set(model,rest);}
  return restPoses.get(model);
 }
 function restoreRestPose(model){const rest=restPoses.get(model);if(!rest)return;for(const [name,t] of rest){const n=model.getObjectByName(name);n.position.fromArray(t.position);n.quaternion.fromArray(t.quaternion);n.scale.fromArray(t.scale);}model.updateMatrixWorld(true);}
 function prepareClip(clip,model,animationMeta,THREE){
  const modelMeta=metadata(model),mode=compatibility(modelMeta,animationMeta);
  if(!mode)throw new Error('Rig mismatch: unsupported model/animation combination');
  const restPose=captureRestPose(model),v2=modelMeta.rigId==='humanoid'&&modelMeta.rigVersion==='2',result=clip.clone(),channels=new Set();
  for(const track of result.tracks){const binding=THREE.PropertyBinding.parseTrackName(track.name);const node=model.getObjectByName(binding.nodeName);if(!node)throw new Error(`Missing bone: ${binding.nodeName}`);
   if(v2){const allowed=mode==='humanoid-v1-to-v2'?v1Bones:v2Bones;if(!allowed.includes(binding.nodeName)||!node.userData?.bone||binding.objectName||binding.propertyIndex!==undefined||!['quaternion','position'].includes(binding.propertyName)||(binding.propertyName==='position'&&binding.nodeName!=='Body'))throw new Error('Invalid humanoid track: '+track.name);}
   channels.add(binding.nodeName+'.'+binding.propertyName);
   if(modelMeta.rigId==='nodes'&&(!modelMeta.nodeNames.includes(binding.nodeName)||binding.objectName||binding.propertyIndex!==undefined||!['quaternion','position','scale'].includes(binding.propertyName)))throw new Error('Invalid node track: '+track.name);
   if(binding.propertyName==='position'&&modelMeta.rigId!=='nodes'){
    const canonical=animationMeta.canonicalTranslations?.[binding.nodeName];if(!canonical)throw new Error('Missing canonicalTranslations');
    const rest=restPose.get(binding.nodeName)?.position??node.position.toArray();for(let i=0;i<track.values.length;i++)track.values[i]+=rest[i%3]-canonical[i%3];
   }
  }
  // Complete v2 clips so blends back to sparse/v1 clips cannot retain bent joints.
  if(v2){for(const name of v2Bones){const rest=restPose.get(name);if(!rest)throw new Error('Missing bone: '+name);if(!channels.has(name+'.quaternion'))result.tracks.push(new THREE.QuaternionKeyframeTrack(name+'.quaternion',[0,clip.duration],[...rest.quaternion,...rest.quaternion]));}
   if(!channels.has('Body.position')){const p=restPose.get('Body').position;result.tracks.push(new THREE.VectorKeyframeTrack('Body.position',[0,clip.duration],[...p,...p]));}
  }
  return result;
 }
 function classify(relativePath){const parts=relativePath.replaceAll('\\','/').split('/');if(parts.length<3)return null;const logical=parts[1];if(logical==='models'&&/\.glb$/i.test(parts.at(-1))&&!/\.anim\.glb$/i.test(parts.at(-1)))return 'models';if(logical==='animations'&&/\.anim\.glb$/i.test(parts.at(-1)))return 'animations';return null;}
 const api={metadata,compatible,compatibility,captureRestPose,restoreRestPose,prepareClip,classify};global.ForgeRuntime=api;
})(globalThis);
