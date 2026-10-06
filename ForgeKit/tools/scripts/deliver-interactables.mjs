import {readFileSync,writeFileSync,copyFileSync,mkdirSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const project=path.resolve('../Deadzone Protocol'),assets=path.join(project,'Assets'),source='assets/FSA(项目使用)';
// QA artifacts remain in ForgeKit/.qa; only production assets are copied to the game.
const files=[];
function copy(from,to){mkdirSync(path.dirname(to),{recursive:true});copyFileSync(from,to);const b=readFileSync(from);if(!b.equals(readFileSync(to)))throw new Error('Copy mismatch');files.push({path:path.relative(project,to).replaceAll('\\','/'),bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}
for(const kind of ['models','animations'])for(const name of readdirSync(`${source}/generated/${kind}/world/interactables`))copy(`${source}/generated/${kind}/world/interactables/${name}`,path.join(assets,kind,'world/interactables',name));
copy(`${source}/generated/effects/world/interactables/vfx_altar_feedback.vfx`,path.join(assets,'effects/world/interactables/vfx_altar_feedback.vfx'));
copy(`${source}/generated/effects/ForgeVFX.mjs`,path.join(assets,'effects/ForgeVFX.mjs'));
copy('previewer/runtime.js',path.join(assets,'runtime/ForgeRuntime.js'));
const measured=JSON.parse(readFileSync('.qa/interactables-validation.json'));
const placement=measured.map(r=>({id:r.model,unit:'meter',closedBounds:r.closedBounds,sampledMotionBounds:r.sweep,placementClearance:{min:r.sweep.min.map((v,i)=>i===1?0:Math.floor((v-.03)*100)/100),max:r.sweep.max.map(v=>Math.ceil((v+.03)*100)/100)},simplifiedCollision:r.model.endsWith('EnchantAltar')?{type:'cylinder',radius:.62,height:.99,center:[0,.495,0]}:{type:'box',center:[0,r.model.endsWith('Airdrop')?.58:.47,0],size:r.model.endsWith('Airdrop')?[1.81,1.16,1.61]:[1.96,.94,1.28]},interactionSocket:'Interaction_Front',note:'Collision is reference only; use a separate moving lid collider if required. Motion bounds sample 241 points; placement bounds include 3cm allowance. +Z interaction approach must remain clear.'}));
const pf=`${source}/definitions/effects/world/interactables/Placement.json`;writeFileSync(pf,JSON.stringify(placement,null,2)+'\n');copy(pf,path.join(assets,'models/world/interactables/Placement.json'));
writeFileSync('.qa/interactables-delivery-manifest.json',JSON.stringify(files,null,2)+'\n');console.log(`Delivered and byte-verified ${files.length} files.`);
