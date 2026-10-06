import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)), game=path.resolve(root,'../..'), prior=path.join(game,'Test/01-WorldAssets');
const h=JSON.parse(fs.readFileSync(path.join(prior,'handoff.json'),'utf8'));
if(h.schemaVersion!=='world-assets.v1'||h.generatorVersion!=='1.0.0')throw Error('Unsupported prerequisite');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const sources=[];
function copy(from,to,expected){const b=fs.readFileSync(from);if(expected&&sha(b)!==expected)throw Error('Prerequisite checksum mismatch '+from);fs.mkdirSync(path.dirname(path.join(root,to)),{recursive:true});fs.writeFileSync(path.join(root,to),b);sources.push({source:path.relative(game,from).replaceAll('\\','/'),path:to,sha256:sha(b)});}
for(const p of ['src/world.mjs',...h.templates,...h.seeds.map(s=>s.scene),...h.assets.filter(p=>p.startsWith('generated/'))])copy(path.join(prior,p),p==='src/world.mjs'?'src/world.mjs':p,h.checksums[p]);
const assets={A1:'models/characters/enemies/common/FSA_ENEMY_A001_ZombieA.glb',B2:'models/characters/enemies/elite/FSA_ENEMY_B002_BurstAxeman.glb',arms:'models/fps_arms/FSA_FPS_Arms_001_Base.glb'};
for(const action of ['Idle','Walk','Run']){assets['enemy'+action]=`animations/characters/shared/FSA_ANIM_Character_${action}.anim.glb`;assets['fps'+action]=`animations/fps/unarmed/FSA_ANIM_FPS_Unarmed_${action}.anim.glb`;}
for(const [name,p] of Object.entries(assets))copy(path.join(game,'Assets',p),`assets/${name}.glb`);
fs.mkdirSync(path.join(root,'evidence'),{recursive:true});fs.mkdirSync(path.join(root,'config'),{recursive:true});
fs.writeFileSync(path.join(root,'config/default.json'),JSON.stringify({version:'navigation.v1',seeds:h.seeds.map(x=>x.seed),size:160,count:15,enemies:30,stressEnemies:50,cell:.5,fixedHz:60},null,2));
fs.writeFileSync(path.join(root,'evidence/sources.json'),JSON.stringify({prerequisiteVersion:h.generatorVersion,sources},null,2));
const protectedFiles={};
function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.git','.npm-cache','.test-build','dist','02-Navigation'].includes(e.name)||e.name.startsWith('.browser-profile'))continue;const p=path.join(dir,e.name);if(e.isDirectory())scan(p);else if(!p.endsWith('02-寻路验证报告.md'))protectedFiles[path.relative(game,p)]=sha(fs.readFileSync(p));}}
scan(game);fs.writeFileSync(path.join(root,'evidence/protected-before.json'),JSON.stringify(protectedFiles,null,2));
console.log('Verified and copied',sources.length,'sources; protected snapshot',Object.keys(protectedFiles).length);
