import {readFileSync,readdirSync,mkdirSync,writeFileSync,renameSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {PROJECT} from '../core/library.js';
import {compile,dispose} from '../compiler/compile.js';
import {compileContract,libraryFor,terrainGeometry} from './contract.js';
import {buildPreview} from './build-preview.js';
import {validateAssembly} from './assembly.js';
import {previewAssembly} from './preview-assembly.js';
export async function buildEnvironment(dir=path.join(PROJECT,'assets/environment-samples/definitions'),outputDir){
 dir=path.resolve(dir);const generated=outputDir?path.resolve(outputDir):path.join(path.dirname(dir),'generated'),outputs=[],ids=new Set(),assets=[];
 const files=readdirSync(dir).filter(f=>f.endsWith('.environment.json')).sort().map(f=>path.join(dir,f));
 const assemblyDefs=readdirSync(dir).filter(f=>f.endsWith('.assembly.json')).map(name=>JSON.parse(readFileSync(path.join(dir,name),'utf8').replace(/^\uFEFF/,'')));
 for(const def of assemblyDefs)for(const item of [...(def.instances??[]),...(def.doors??[])]){
  if(!/^[A-Za-z][A-Za-z0-9_-]*$/.test(item.asset))throw new Error('Invalid assembly asset ID');
  const folder=(def.doors??[]).includes(item)?'doors':'barriers',file=path.resolve(dir,'..',folder,item.asset+'.environment.json');
  if(!files.includes(file))files.push(file);
 }
 for(let i=0;i<files.length;i++){const def=JSON.parse(readFileSync(files[i],'utf8').replace(/^\uFEFF/,''));for(const door of def.doors??[]){if(!/^[A-Za-z][A-Za-z0-9_-]*$/.test(door.asset))throw new Error('Invalid door asset ID');const file=path.join(dir,'../doors',door.asset+'.environment.json');if(!files.includes(file))files.push(file);}}
 for(const file of files){
  const raw=readFileSync(file,'utf8'),d=JSON.parse(raw.replace(/^\uFEFF/,''));let c;
  try{c=compileContract(d);}catch(e){throw new Error(`${file}: ${e.message}`);}
  if(ids.has(d.id))throw new Error(`duplicate environment id ${d.id}`);ids.add(d.id);
  const lib=libraryFor(d);let model;
  if(d.type==='terrain'){
   const root=new T.Group();root.name='Asset';root.userData={assetId:d.id,environmentSchema:'environment.v1',assetType:'terrain',units:'meter'};
   root.add(new T.Mesh(terrainGeometry(c.terrain),new T.MeshStandardMaterial({color:c.terrain.surface?'#ffffff':'#b59a72',vertexColors:!!c.terrain.surface,roughness:1})));
   try{model=Buffer.from(await new GLTFExporter().parseAsync(root,{binary:true}));}finally{dispose(root);}
  }else model=await compile(d.model,lib,file);
  c.sourceHash=createHash('sha256').update(raw).digest('hex');c.modelHash=createHash('sha256').update(model).digest('hex');
  const animation=d.animation?await compile(d.animation,lib,file):null;
  if(animation)c.animationHash=createHash('sha256').update(animation).digest('hex');
  outputs.push([c.modelAsset,model],[`contracts/${d.id}.environment.json`,JSON.stringify(c,null,2)+'\n']);
  if(animation)outputs.push([c.animationAsset,animation]);
  assets.push({contract:c,model:model.toString('base64'),animation:animation?.toString('base64')??null});
 }
 if(!assets.length)throw new Error('No *.environment.json definitions found.');
 for(const a of assets)if(a.contract.doors?.length)validateAssembly(a.contract,id=>assets.find(x=>x.contract.id===id)?.contract);
 // Validate and compile the whole input before replacing any output.
 const references=[];for(const name of readdirSync(dir).filter(f=>f.endsWith('.assembly.json')).sort()){const raw=readFileSync(path.join(dir,name),'utf8'),def=JSON.parse(raw.replace(/^\uFEFF/,''));references.push(await previewAssembly(def,assets));outputs.push(['references/'+name,raw]);}
 const preview=await buildPreview([...assets,...references]);outputs.push(['EnvironmentPreview.html',preview],['environment-manifest.json',JSON.stringify({schema:'environment-library.v1',assets:assets.map(a=>({id:a.contract.id,type:a.contract.type,sourceHash:a.contract.sourceHash,modelHash:a.contract.modelHash,animationHash:a.contract.animationHash,contract:`contracts/${a.contract.id}.environment.json`}))},null,2)]);
 for(const [relative,bytes] of outputs){const target=path.join(generated,relative);mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target+'.tmp',bytes);renameSync(target+'.tmp',target);}
 return {generated,assets:assets.map(a=>({id:a.contract.id,type:a.contract.type,routeChecks:a.contract.checks.length})),files:outputs.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.join(PROJECT,'tools/environment/build.js'))try{console.log(JSON.stringify(await buildEnvironment(process.argv[2],process.argv[3]),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
