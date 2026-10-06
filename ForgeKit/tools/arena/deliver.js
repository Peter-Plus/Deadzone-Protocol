import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const gen=path.resolve('assets/FSA(项目使用)/generated'),assets=path.resolve('../Deadzone Protocol/Assets');
const files=['models/world/arena/FSA_WORLD_ShadowStone.glb','models/world/arena/FSA_WORLD_NightmareStone.glb','effects/ForgeVFX.mjs',
 ...['shadow_stone_burst','nightmare_stone_burst','spike_rise','boundary'].map(n=>'effects/arena/vfx_arena_'+n+'.vfx'),
 'world/environments/arena/environment-manifest.json'];
for(let i=1;i<=6;i++)for(const [dir,ext] of [['models','.glb'],['contracts','.environment.json']])files.push('world/environments/arena/'+dir+'/FSA_ENV_Arena_Spikes_0'+i+ext);
for(const relative of files){const from=path.join(gen,relative),to=path.join(assets,relative);fs.mkdirSync(path.dirname(to),{recursive:true});const bytes=fs.readFileSync(from);fs.writeFileSync(to,bytes);assert.ok(bytes.equals(fs.readFileSync(to)),relative);}
console.log('Delivered and byte-verified '+files.length+' files.');
