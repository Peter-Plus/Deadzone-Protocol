import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {readLibrary} from '../tools/core/library.js';
import {BONES} from '../tools/core/rig.js';
import '../previewer/runtime.js';
const base=new URL('../assets/FSA(项目使用)/',import.meta.url),lib=readLibrary(fileURLToPath(new URL('definitions/',base)));
// Original three-character regression suite; newer bosses have their own proportions and motions.
const models=lib.entries.filter(e=>['FSA_ENEMY_A001_ZombieA','FSA_ENEMY_A002_ZombieB','FSA_NPC_001_Rod'].includes(e.data.id)),anims=lib.entries.filter(e=>['Idle','Walk','Run','Attack','Hit','Death','Interact'].some(n=>e.data.id==='FSA_ANIM_Character_'+n));
async function load(entry){const rel=entry.file.split('definitions')[1].replaceAll('\\','/').replace(/\.model\.json$/,'.glb').replace(/\.anim\.json$/,'.anim.glb');const b=readFileSync(new URL('generated'+rel,base));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
test('three characters share exactly seven bones and the axe stays rigidly attached',async()=>{
 assert.equal(models.length,3);assert.equal(anims.length,7);
 for(const e of models){const m=await load(e),bones=[];m.scene.traverse(n=>{if(n.userData.bone)bones.push(n.name);});assert.deepEqual(bones.sort(),[...BONES].sort());
  if(e.data.id.includes('ZombieB')){assert.equal(m.scene.getObjectByName('AxeShaft').parent.name,'HandR');assert.equal(m.scene.getObjectByName('HandR').parent.name,'Arm_R');}
  if(e.data.id.includes('ZombieA')){assert(m.scene.getObjectByName('Face').position.z>.08);assert(m.scene.getObjectByName('Torso').rotation.x>.15);}
 }
});
test('all 21 character and clip combinations play, loops close, death holds the final pose',async()=>{
 const R=globalThis.ForgeRuntime;
 for(const e of models){const m=await load(e);
  for(const a of anims){const g=await load(a),clip=g.animations[0];assert(R.compatible(R.metadata(m.scene),R.metadata(g.scene)));
   if(a.data.loop)for(const t of clip.tracks){const n=t.getValueSize();for(let k=0;k<n;k++)assert(Math.abs(t.values[k]-t.values[t.values.length-n+k])<1e-6);}
   const mix=new T.AnimationMixer(m.scene),act=mix.clipAction(R.prepareClip(clip,m.scene,R.metadata(g.scene),T));act.setLoop(T.LoopOnce,1);act.clampWhenFinished=true;act.play();
   for(let i=0;i<=32;i++){mix.setTime(clip.duration*i/32);m.scene.updateMatrixWorld(true);m.scene.traverse(n=>assert(n.matrixWorld.elements.every(Number.isFinite)));}
   if(a.data.id.endsWith('Death')){const box=new T.Box3().setFromObject(m.scene);assert(new T.Box3().setFromObject(m.scene.getObjectByName('Head')).max.y<.6);assert(box.min.y>-.08,`${e.data.id}: death below ground ${box.min.y}`);const q=m.scene.getObjectByName('Root').quaternion.clone();mix.update(1);assert(q.equals(m.scene.getObjectByName('Root').quaternion));}
   mix.stopAllAction();mix.uncacheRoot(m.scene);
  }
 }
});


