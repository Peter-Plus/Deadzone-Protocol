import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { PROJECT, DEFINITIONS, readLibrary } from '../core/library.js';
import { effectSchema } from './schema.js';
const library=readLibrary(), generated=path.join(path.dirname(DEFINITIONS),'generated');
const resources={}, effects=[];
function embed(id,kind){if(resources[id])return;const entry=library.entries.find(e=>e.data.id===id);if(!entry)throw Error(`Missing reference ${id}`);const relative=path.relative(DEFINITIONS,entry.file).replace(/\.(model|anim)\.json$/,kind==='model'?'.glb':'.anim.glb');resources[id]=fs.readFileSync(path.join(generated,relative)).toString('base64');}
for(const entry of library.entries.filter(e=>e.data.schema==='effect.v1')){
  const file=path.join(generated,path.relative(DEFINITIONS,entry.file).replace(/\.effect\.json$/,'.vfx'));
  const record={package:JSON.parse(fs.readFileSync(file,'utf8'))};
  if(entry.data.binding){embed(entry.data.binding.model,'model');if(entry.data.binding.animation)embed(entry.data.binding.animation,'animation');}
  else if(entry.data.id==='vfx_hit_blood_low'){record.previewModel='FSA_ENEMY_A001_ZombieA';record.previewAnimation='FSA_ANIM_Character_Idle';embed(record.previewModel,'model');embed(record.previewAnimation,'animation');}
  effects.push(record);
}
// Keep the established default as the catalogue grows with earlier alphabetic categories.
effects.sort((a,b)=>(a.package.effect.id==='vfx_hit_blood_low'?-1:0)-(b.package.effect.id==='vfx_hit_blood_low'?-1:0));
fs.mkdirSync(path.join(PROJECT,'.qa'),{recursive:true});fs.writeFileSync(path.join(PROJECT,'.qa/effects-preview-data.json'),JSON.stringify({effects,resources}));
fs.writeFileSync(path.join(PROJECT,'schemas/effect.schema.json'),JSON.stringify(effectSchema,null,2)+'\n');
const out=await build({entryPoints:[path.join(PROJECT,'previewer/effects/app.js')],bundle:true,format:'iife',minify:true,write:false,target:'chrome110'});
const html=fs.readFileSync(path.join(PROJECT,'previewer/effects/page.html'),'utf8').replace('/*APP*/',()=>out.outputFiles[0].text.replaceAll('</script','<\\/script'));
fs.writeFileSync(path.join(PROJECT,'previewer/effects.html'),html);
console.log('Built previewer/effects.html');
