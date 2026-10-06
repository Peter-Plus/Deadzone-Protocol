import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
export const ROOT=fileURLToPath(new URL('../',import.meta.url));
export const GAME=path.resolve(ROOT,'../..');
export const FORGE=path.resolve(GAME,'../ForgeKit');
export const load=p=>import(pathToFileURL(path.join(FORGE,p)).href);
export const T=await load('node_modules/three/build/three.module.js');
export const {GLTFExporter}=await load('node_modules/three/examples/jsm/exporters/GLTFExporter.js');
export const {GLTFLoader}=await load('node_modules/three/examples/jsm/loaders/GLTFLoader.js');
globalThis.ProgressEvent??=class ProgressEvent{constructor(type,data={}){this.type=type;Object.assign(this,data);}};
globalThis.FileReader??=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.({target:this});});}readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result=`data:${blob.type};base64,${Buffer.from(b).toString('base64')}`;this.onloadend?.({target:this});});}};
export function write(p,data){const dest=path.join(ROOT,p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,typeof data==='string'||Buffer.isBuffer(data)?data:JSON.stringify(data,null,2)+'\n');}
export function read(p){return JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8').replace(/^\uFEFF/,''));}
export async function parseGLB(p){const b=fs.readFileSync(p);return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
