import fs from 'node:fs';
import path from 'node:path';
import { PROJECT, DEFINITIONS, readLibrary } from '../core/library.js';
const generated=path.join(path.dirname(DEFINITIONS),'generated'),assets=path.resolve(PROJECT,'../Deadzone Protocol/Assets');
const copied=[];
function copy(from,to){fs.mkdirSync(path.dirname(to),{recursive:true});const bytes=fs.readFileSync(from);fs.writeFileSync(to,bytes);if(!bytes.equals(fs.readFileSync(to)))throw Error('Delivery mismatch: '+to);copied.push(path.relative(assets,to));}
for(const {file,data} of readLibrary().entries.filter(e=>e.data.schema==='effect.v1')){
  const relative=path.relative(DEFINITIONS,file).replace(/\.effect\.json$/,'.vfx');
  copy(path.join(generated,relative),path.join(assets,relative));
}
copy(path.join(generated,'effects/ForgeVFX.mjs'),path.join(assets,'effects/ForgeVFX.mjs'));
copy(path.join(PROJECT,'previewer/runtime.js'),path.join(assets,'runtime/ForgeRuntime.js'));
const placement=path.join(DEFINITIONS,'effects/world/interactables/Placement.json');
if(fs.existsSync(placement))copy(placement,path.join(assets,'models/world/interactables/Placement.json'));
console.log('Byte-verified delivery:\n'+copied.join('\n'));
