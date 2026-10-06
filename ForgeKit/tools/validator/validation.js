import Ajv from 'ajv';
import { validateEffect } from '../effects/validate.js';
import { readFileSync } from 'node:fs';
import { humanoidBones, proportions } from '../core/rig.js';
import { FPS_BONES } from '../core/fps-rig.js';
const ajv=new Ajv({allErrors:true,strict:false,strictNumbers:true});
const checks=Object.fromEntries(['model','animation','pose','material'].map(k=>[`${k}.v1`,ajv.compile(JSON.parse(readFileSync(new URL(`../../schemas/${k}.schema.json`,import.meta.url),'utf8')))]));
export function validate(data,file='<memory>',library={materials:new Map(),poses:new Map()}) {
 if(data?.schema==='effect.v1')return validateEffect(data,file,library);
 const errors=[];
 const error=(code,path,description,hint)=>errors.push({code,file,path,description,hint});
 const scan=(v,p='$')=>{if(typeof v==='number'&&!Number.isFinite(v)) error('NON_FINITE',p,'NaN / Infinity is forbidden','使用有限数值。');else if(v&&typeof v==='object') for(const [k,x] of Object.entries(v)) scan(x,`${p}.${k}`);};scan(data);
 const check=checks[data?.schema];
 if(!check) {error('UNKNOWN_SCHEMA','schema','Unknown schema','使用 model.v1 / animation.v1 / pose.v1 / material.v1。');return errors;}
 if(!check(data)) {for(const e of check.errors) error('SCHEMA_INVALID',e.instancePath||'$',`${e.message} ${JSON.stringify(e.params)}`,'按 schemas/ 中对应 JSON Schema 修正字段；禁止未知字段。');return errors;}
 const nodeModel=data.rig==='nodes.v1'?library.entries?.find(e=>e.data.id===data.targetModel)?.data:null;
 if(data.rig==='nodes.v1'&&nodeModel?.type!=='static')error('NODE_TARGET','targetModel','Target must be an existing static model','Use a static model id in this library.');
 const isNodes=data.rig==='nodes.v1';
 const isFps=data.rig==='fps-arms.v1', allowedBones=isNodes?[...(nodeModel?.parts??[]),...(nodeModel?.sockets??[])].map(n=>n.id):isFps?FPS_BONES:humanoidBones(data.rig);
 if(data.stance&&data.stance.leftOffset[1]!==0)error('FPS_STANCE_OFFSET','stance.leftOffset','Only lateral/forward stance placement is supported','leftOffset 的 Y 必须为 0。');
 const bone=(n,p)=>{if(!allowedBones.includes(n))error('ANIM_UNKNOWN_BONE',p,`Bone "${n}" is not allowed in ${data.rig}.`,`Allowed bones: ${allowedBones.join(', ')}`);};
 const motion=(n,t,p)=>{if(isNodes){if(t.pose||t.position?.some(v=>Math.abs(v)>10000))error('NODE_TRANSFORM',p,'Invalid node transform','No pose references; use absolute local TRS.');return;}if(t.scale)error('SCALE_FORBIDDEN',p,'Scale only supported by nodes.v1','Remove scale');if(isFps){if(t.position)error('IN_PLACE_REQUIRED',p,'FPS joints do not allow translation','只使用 rotation:[角度,0,0]。');if(t.rotation&&(t.rotation[1]!==0||t.rotation[2]!==0))error('FPS_HINGE_AXIS',p,'FPS joint only rotates around its rest-local X axis','每侧肩、肘各一个旋转自由度；rotation:[角度,0,0]。');return;}if(t.position && (n!=='Body'||t.position.some(v=>Math.abs(v)>0.2)))error('IN_PLACE_REQUIRED',p,'Only Body may have a local position offset, limited to ±0.2 m.','删除 Root/Head/四肢位移；Body position 使用小幅增量。');};
 if(data.schema==='model.v1') {
  const parts=data.parts??[], sockets=data.sockets??[], all=[...parts,...sockets],names=new Set(data.type==='humanoid'?allowedBones:data.type==='fps_arms'?['Root',...FPS_BONES]:[]),reserved=new Set(['Asset',...(data.type==='humanoid'&&!parts.length?['Visual_Face',...allowedBones.map(n=>`Visual_${n}`)]:[])]),map=new Map(all.map(p=>[p.id,p]));
  for(const p of all){if(names.has(p.id)||reserved.has(p.id)) error('DUPLICATE_NODE',`nodes.${p.id}`,'Duplicate or reserved node name','修改 id，避免与其他 Part、Socket 或骨骼重名。');names.add(p.id);}
  for(const p of all){if(p.parent&&!names.has(p.parent))error('UNKNOWN_PARENT',`nodes.${p.id}.parent`,`Unknown parent ${p.parent}`,'指定存在的 Part / Socket / Canonical Bone。');const visited=new Set([p.id]);let n=p.parent;while(map.has(n)){if(visited.has(n)){error('CYCLIC_PARENT',`nodes.${p.id}.parent`,'Cyclic hierarchy','删除父子循环。');break;}visited.add(n);n=map.get(n).parent;}}
  const mat=(m,p,seen=new Set())=>{if(typeof m!=='string')return; if(seen.has(m)){error('MATERIAL_CYCLE',p,'Cyclic material reference','内联材质或移除循环。');return;}seen.add(m);const resolved=Object.hasOwn(data.materials??{},m)?data.materials[m]:library.materials.get(m);if(!resolved)error('UNKNOWN_MATERIAL',p,`Unknown material ${m}`,'定义本地材质或全局 *.material.json。');else mat(resolved,p,seen);};
  for(const [k,m] of Object.entries(data.materials??{}))mat(m,`materials.${k}`);
  for(const p of parts){mat(p.material,`parts.${p.id}.material`);if(p.shape.type==='cylinder'&&p.shape.radiusTop+p.shape.radiusBottom===0)error('INVALID_DIMENSIONS',`parts.${p.id}.shape`,'Cylinder has zero radius','至少一个半径必须大于零。');}
  if(data.type==='humanoid'&&proportions(data.parameters).body<=0)error('INVALID_PROPORTIONS','parameters','Head + leg height must be less than height','增大 height 或减小 legLength / headScale。');
 }
 if(data.schema==='pose.v1')for(const [n,t] of Object.entries(data.bones)){bone(n,`bones.${n}`);motion(n,t,`bones.${n}`);if(!t.rotation&&!t.position)error('EMPTY_POSE',`bones.${n}`,'Empty bone transform','提供 rotation 或 Body position。');}
 if(data.schema==='animation.v1'&&data.mode==='timeline') {
  for(const [n,keys] of Object.entries(data.tracks)){bone(n,`tracks.${n}`);let last=-1;for(const [i,k] of keys.entries()){
   const p=`tracks.${n}.${i}`;
   if(k.time>data.duration||k.time<=last)error('ANIM_TIME',`${p}.time`,'Key times must increase strictly and be within duration','使用 0..duration 范围内严格递增的时间。');last=k.time;
   let t=k;
   if(k.pose){const pose=library.poses.get(k.pose);if(!pose||pose.rig!==data.rig||!pose.bones?.[n])error('UNKNOWN_POSE',`${p}.pose`,'Pose missing or does not define this bone','提供同一骨骼的合法 pose id。');else t={...pose.bones[n],...k};}
   motion(n,t,p);
  }}
 }
 return errors;
}
export function validateLibrary(library) {return [...library.errors,...library.entries.flatMap(({file,data})=>validate(data,file,library))];}
export function formatErrors(errors) {return errors.map(e=>`ERROR [${e.code}]\nFile: ${e.file}\nPath: ${e.path}\n${e.description}\nFix Hint: ${e.hint}`).join('\n\n');}
