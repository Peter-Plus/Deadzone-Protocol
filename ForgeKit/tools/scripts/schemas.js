// This script is only needed when maintaining the DSL; schemas are checked in.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { effectSchema } from '../effects/schema.js';
const out = fileURLToPath(new URL('../../schemas/', import.meta.url));
mkdirSync(out, {recursive:true});
writeFileSync(`${out}/effect.schema.json`, JSON.stringify(effectSchema, null, 2)+'\n');
const num = {type:'number'};
const positive = {type:'number', exclusiveMinimum:0, maximum:10000};
const vec = {type:'array', items:num, minItems:3, maxItems:3};
const scale = {oneOf:[positive, {...vec,items:positive}]};
const id = {type:'string',pattern:'^[A-Za-z][A-Za-z0-9_.-]{0,95}$'};
const ref = {type:'string',pattern:'^[A-Za-z][A-Za-z0-9_.-]{0,95}$'};
const nodeId = {type:'string',pattern:'^[A-Za-z][A-Za-z0-9_-]{0,95}$'};
const obj = (properties, required=[]) => ({type:'object',additionalProperties:false,properties,required});
const transform = {position:vec, rotation:vec, scale};
const color = {type:'string',pattern:'^#[0-9a-fA-F]{6}$'};
const unit = {type:'number',minimum:0,maximum:1};
const material = obj({color,roughness:unit,metalness:unit,emissive:color,opacity:unit,transparent:{type:'boolean'}});
const materialRef = {oneOf:[ref,material]};
const shapes = [
 ['rock',{size:{...vec,items:positive},seed:{type:'integer',minimum:0,maximum:4294967295}},['size','seed']],
 ['box',{size:{...vec,items:positive}},['size']],
 ['sphere',{radius:positive},['radius']],
 ['cylinder',{radiusTop:{type:'number',minimum:0,maximum:10000},radiusBottom:{type:'number',minimum:0,maximum:10000},height:positive},['radiusTop','radiusBottom','height']],
 ['capsule',{radius:positive,length:{type:'number',minimum:0,maximum:10000}},['radius','length']],
 ['cone',{radius:positive,height:positive},['radius','height']],
 ['plane',{width:positive,height:positive},['width','height']]
].map(([type,props,req])=>obj({type:{const:type},...props},['type',...req]));
const model = obj({schema:{const:'model.v1'},id,type:{enum:['static','humanoid','fps_arms']},rig:{enum:['humanoid.v1','humanoid.v2','fps-arms.v1']},root:obj(transform),rigPose:obj(Object.fromEntries(['UpperArm_L','Forearm_L','UpperArm_R','Forearm_R'].map(k=>[k,num]))),
 jointPositions:obj(Object.fromEntries(['Forearm_L','Hand_L','Forearm_R','Hand_R','LowerLeg_L','LowerLeg_R'].map(k=>[k,{...vec,items:{type:'number',minimum:-10000,maximum:10000}}]))),
 parameters:obj(Object.fromEntries(['height','bodyWidth','bodyDepth','headScale','armLength','armThickness','legLength','legThickness'].map(k=>[k,positive]))),
 materials:{type:'object',propertyNames:id,additionalProperties:materialRef},
 parts:{type:'array',maxItems:1000,items:obj({id:nodeId,parent:nodeId,shape:{oneOf:shapes},...transform,material:materialRef},['id','shape'])},
 sockets:{type:'array',maxItems:100,items:obj({id:nodeId,parent:nodeId,...transform},['id','parent'])}
},['schema','id','type']);
model.allOf=[
 {if:{properties:{type:{const:'humanoid'}}},then:{required:['rig'],properties:{rig:{enum:['humanoid.v1','humanoid.v2']},rigPose:false}}},
 {if:{properties:{type:{const:'fps_arms'}}},then:{required:['rig','parts'],properties:{rig:{const:'fps-arms.v1'},parts:{minItems:1},parameters:false}}},
 {if:{properties:{type:{const:'static'}}},then:{required:['parts'],properties:{parts:{minItems:1},rig:false,parameters:false,rigPose:false}}},
 {if:{required:['rig'],properties:{rig:{const:'humanoid.v2'}}},then:{allOf:[{if:{required:['jointPositions']},then:{required:['parts'],properties:{parts:{minItems:1}}}}]},else:{properties:{jointPositions:false}}}
];
const boneTransform = obj({rotation:vec,position:vec});
const pose = obj({schema:{const:'pose.v1'},id,rig:{enum:['humanoid.v1','humanoid.v2','fps-arms.v1']},bones:{type:'object',minProperties:1,additionalProperties:boneTransform}},['schema','id','rig','bones']);
const key = obj({time:{type:'number',minimum:0},rotation:vec,position:vec,pose:ref},['time']);
key.anyOf=[{required:['rotation']},{required:['position']},{required:['pose']}];
const animation = obj({schema:{const:'animation.v1'},id,rig:{enum:['humanoid.v1','humanoid.v2','fps-arms.v1']},duration:{type:'number',exclusiveMinimum:0,maximum:600},loop:{type:'boolean'},mode:{enum:['timeline','generator']},
 stance:obj({leftOffset:{...vec,items:{type:'number',minimum:-.15,maximum:.15}},blend:{enum:['constant','in','out','assist']}},['leftOffset','blend']),
 tracks:{type:'object',minProperties:1,additionalProperties:{type:'array',minItems:1,maxItems:10000,items:key}},
 generator:{enum:['humanoid.idle','humanoid.walk','humanoid.run']},
 parameters:obj({armSwing:{type:'number',minimum:0,maximum:180},legSwing:{type:'number',minimum:0,maximum:90},bodyBob:{type:'number',minimum:0,maximum:0.2},bodyLean:{type:'number',minimum:-45,maximum:45},samples:{type:'integer',minimum:8,maximum:240}})
},['schema','id','rig','duration','loop','mode']);
animation.allOf=[{if:{properties:{mode:{const:'timeline'}}},then:{required:['tracks'],properties:{generator:false,parameters:false}},else:{required:['generator'],properties:{tracks:false}}}];
animation.allOf.push({if:{properties:{rig:{const:'fps-arms.v1'}}},then:{properties:{mode:{const:'timeline'}}},else:{properties:{stance:false}}});
animation.properties.rig.enum.push('nodes.v1');
animation.properties.targetModel=ref;
key.properties.scale={...vec,items:positive};key.anyOf.push({required:['scale']});
animation.allOf.push({if:{properties:{rig:{const:'nodes.v1'}}},then:{required:['targetModel'],properties:{mode:{const:'timeline'}}},else:{properties:{targetModel:false}}});
const materialAsset=obj({schema:{const:'material.v1'},id,...material.properties},['schema','id']);
for(const [name,schema] of Object.entries({model,animation,pose,material:materialAsset})) writeFileSync(`${out}/${name}.schema.json`,JSON.stringify({$schema:'http://json-schema.org/draft-07/schema#',...schema},null,2)+'\n');
