import { mkdir, writeFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { readLibrary, PROJECT, DEFINITIONS } from '../core/library.js';
import { validateLibrary, formatErrors } from '../validator/validation.js';
import { compile } from './compile.js';
import { compileEffect } from '../effects/compile.js';
import { build as bundle } from 'esbuild';
try{
 const definitions=path.resolve(process.argv[2]??DEFINITIONS);
 const generated=path.join(path.dirname(definitions),'generated');
 const library=readLibrary(definitions);const errors=validateLibrary(library);
 if(errors.length)throw new Error(formatErrors(errors));
 const outputs=[],seen=new Set();
 for(const entry of library.entries){const d=entry.data;if(!['model.v1','animation.v1','effect.v1'].includes(d.schema))continue;
  const isModel=d.schema==='model.v1', isEffect=d.schema==='effect.v1', name=path.basename(entry.file).replace(/\.(model|anim|effect)\.json$/,isEffect?'.vfx':isModel?'.glb':'.anim.glb');
  const relative=path.relative(definitions,entry.file);
  const category=isEffect?'effects':isModel?'models':'animations';
  if(relative.split(path.sep)[0]!==category)throw new Error(`Asset must be under ${category}/: ${entry.file}`);
  const output=path.join(generated,path.dirname(relative),name);
  if(seen.has(output.toLowerCase()))throw new Error(`ERROR [OUTPUT_COLLISION]\nFile: ${entry.file}\nPath: $\nDuplicate output ${name}\nFix Hint: 使用唯一文件名。`);seen.add(output.toLowerCase());outputs.push({...entry,output});
 }
 // All validation and compilation finish before any final asset is replaced.
 for(const entry of outputs)entry.bytes=entry.data.schema==='effect.v1'?compileEffect(entry.data,library,entry.file):await compile(entry.data,library,entry.file);
 if(outputs.some(e=>e.data.schema==='effect.v1')){
  const player=await bundle({entryPoints:[path.join(PROJECT,'tools/effects/runtime.js')],bundle:true,format:'esm',external:['three'],write:false,target:'es2022'});
  outputs.push({output:path.join(generated,'effects/ForgeVFX.mjs'),bytes:player.outputFiles[0].contents});
 }
 for(const entry of outputs){await mkdir(path.dirname(entry.output),{recursive:true});const temp=entry.output+'.tmp';try{await writeFile(temp,entry.bytes);await rename(temp,entry.output);}finally{await rm(temp,{force:true});}console.log(path.relative(PROJECT,entry.output));}
 console.log(`Built ${outputs.length} assets.`);
}catch(e){console.error(e.message.startsWith('ERROR [')?e.message:`ERROR [BUILD_FAILED]\nFile: definitions\nPath: $\n${e.message}\nFix Hint: 检查源文件和输出目录权限。`);process.exitCode=1;}
