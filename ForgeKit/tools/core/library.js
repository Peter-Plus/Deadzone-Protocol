import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const PROJECT = fileURLToPath(new URL('../../',import.meta.url));
export const DEFINITIONS = path.join(PROJECT,'assets/FSA(项目使用)/definitions');
export function files(dir) {
 return readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):e.isFile()&&/\.(model|anim|pose|material|effect)\.json$/.test(e.name)?[path.join(dir,e.name)]:[]);
}
export function readLibrary(dir=DEFINITIONS) {
 const entries=[], errors=[];
 for(const file of files(dir)) try { entries.push({file,data:JSON.parse(readFileSync(file,'utf8').replace(/^\uFEFF/,''))}); } catch(e) {errors.push({code:'JSON_PARSE',file,path:'$',description:e.message,hint:'修正 JSON 语法。'});}
 const materials=new Map(),poses=new Map(),ids=new Set();
 for(const {file,data} of entries) {
  if(typeof data?.id==='string'&&ids.has(data.id)) errors.push({code:'DUPLICATE_ASSET',file,path:'id',description:`Duplicate asset id ${data.id}`,hint:'使用全局唯一资产 id。'});
  if(typeof data?.id==='string')ids.add(data.id);
  if(data?.schema==='material.v1') materials.set(data.id,data);
  if(data?.schema==='pose.v1') poses.set(data.id,data);
 }
 return {entries,materials,poses,errors};
}
