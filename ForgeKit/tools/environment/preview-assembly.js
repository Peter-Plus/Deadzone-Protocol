// Assembly references are authoring/preview data, not a game assembly contract.
import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {transformContract} from './spatial.js';
import {dispose} from '../compiler/compile.js';
import {validateAssembly} from './assembly.js';
export async function previewAssembly(def,assets){
 if(def.schema!=='environment-preview-assembly.v1'||!def.instances?.length)throw new Error('Invalid preview assembly');
 const root=new T.Group(),colliders=[],connectors=[],ids=new Set(),loader=new GLTFLoader();
 let profiles;
 try{
  for(const item of def.instances){
   if(ids.has(item.id)||!item.position?.every(Number.isFinite)||item.position.length!==3||!Number.isFinite(item.yaw))throw new Error('Invalid assembly transform or duplicate id');ids.add(item.id);
   const source=assets.find(a=>a.contract.id===item.asset);if(!source||source.contract.type!=='barrier')throw new Error('Preview assembly requires static barrier '+item.asset);
   profiles=source.contract.profiles;const bytes=Buffer.from(source.model,'base64'),model=(await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
   const wrapper=new T.Group();wrapper.position.fromArray(item.position);wrapper.rotation.y=item.yaw*Math.PI/180;wrapper.add(model);root.add(wrapper);
   const c=transformContract(source.contract,item.position,item.yaw*Math.PI/180);colliders.push(...c.colliders.map(x=>({...x,node:item.id+'_'+x.node})));connectors.push(...c.connectors.map(x=>({...x,id:item.id+'_'+x.id})));
  }
  root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(root);
  const contract={schema:'environment.v1',id:def.id,label:def.label,type:'barrier',profiles,placement:{min:[bounds.min.x-1,bounds.min.z-3],max:[bounds.max.x+1,bounds.max.z+3]},colliders,connectors,walkables:[],entrances:[],routes:[],lootZones:[],exclusions:[],gateSlots:def.gateSlots??[],checks:[],previewOnly:true};
  if(def.doors?.length){
   contract.placement={min:[bounds.min.x-8,bounds.min.z-8],max:[bounds.max.x+8,bounds.max.z+8]};
   if(new Set(def.doors.map(d=>d.id)).size!==def.doors.length)throw new Error('Duplicate assembly door');
   for(const d of def.doors)if(!d.position?.every(Number.isFinite)||d.position.length!==3||!Number.isFinite(d.yaw)||!def.exclusions?.some(e=>e.id===d.pocket))throw new Error('Invalid assembly door or pocket');
   contract.doors=def.doors;contract.exclusions=def.exclusions;contract.routes=def.routes??[];
   // This is preview composition data, never an authored environment.v1 barrier definition.
   validateAssembly(contract,id=>assets.find(a=>a.contract.id===id)?.contract);
  }
  const model=Buffer.from(await new GLTFExporter().parseAsync(root,{binary:true})).toString('base64');return {contract,model,animation:null};
 }finally{dispose(root);}
}
