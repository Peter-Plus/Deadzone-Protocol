import fs from 'node:fs';import path from 'node:path';
import {ROOT,GAME,T,parseGLB,write} from './node-tools.mjs';
const refs={A1:'common/FSA_ENEMY_A001_ZombieA.glb',B2:'elite/FSA_ENEMY_B002_BurstAxeman.glb'};
const result={method:'GLTFLoader + Box3 precise vertex world bounds; 121 samples per clip incl endpoints; Body translation retargeted relative to canonical rest. Sampling is not a continuous swept bound.',samplesPerClip:121,characters:{}};
for(const [name,p] of Object.entries(refs)){
 const source=path.join(GAME,'Assets/models/characters/enemies',p),out=`references/${name}.glb`;write(out,fs.readFileSync(source));const model=(await parseGLB(source)).scene;
 const box=()=>{model.updateMatrixWorld(true);const b=new T.Box3().setFromObject(model,true);return{min:b.min.toArray(),max:b.max.toArray(),size:b.getSize(new T.Vector3()).toArray()};};
 const def=box(),rest=new Map();model.traverse(n=>rest.set(n.name,{position:n.position.clone(),quaternion:n.quaternion.clone()}));const clips={};
 for(const file of fs.readdirSync(path.join(GAME,'Assets/animations/characters/shared')).filter(f=>f.endsWith('.glb'))){
  model.traverse(n=>{n.position.copy(rest.get(n.name).position);n.quaternion.copy(rest.get(n.name).quaternion);});
  const asset=await parseGLB(path.join(GAME,'Assets/animations/characters/shared',file)),clip=asset.animations[0].clone();
  const meta=asset.scene.children[0].userData;
  for(const track of clip.tracks)if(track.name.endsWith('.position')){const node=track.name.split('.')[0],canonical=meta.canonicalTranslations?.[node];if(canonical){const actual=rest.get(node).position;for(let i=0;i<track.values.length;i+=3)for(let j=0;j<3;j++)track.values[i+j]+=actual.getComponent(j)-canonical[j];}}
  const mixer=new T.AnimationMixer(model);const action=mixer.clipAction(clip);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();const total=new T.Box3();
  for(let i=0;i<=120;i++){mixer.setTime(clip.duration*i/120);model.updateMatrixWorld(true);total.union(new T.Box3().setFromObject(model,true));}clips[file]={min:total.min.toArray(),max:total.max.toArray(),size:total.getSize(new T.Vector3()).toArray()};mixer.stopAllAction();mixer.uncacheRoot(model);
 }
 result.characters[name]={source:path.relative(GAME,source).replaceAll('\\','/'),referenceAsset:out,defaultBounds:def,clips};
}
write('evidence/character-clearance.json',result);console.log(JSON.stringify(result,null,2));
