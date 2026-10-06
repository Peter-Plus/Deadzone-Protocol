import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
const root=process.cwd(),gen=path.join(root,'assets/FSA(项目使用)/generated');
const glb=p=>fs.readFileSync(path.join(gen,p)).toString('base64');
const data={stones:['ShadowStone','NightmareStone'].map(n=>glb('models/world/arena/FSA_WORLD_'+n+'.glb')),
 spikes:Array.from({length:6},(_,i)=>glb('world/environments/arena/models/FSA_ENV_Arena_Spikes_0'+(i+1)+'.glb')),
 contracts:Array.from({length:6},(_,i)=>JSON.parse(fs.readFileSync(path.join(gen,'world/environments/arena/contracts/FSA_ENV_Arena_Spikes_0'+(i+1)+'.environment.json'),'utf8'))),
 boss:glb('models/characters/enemies/bosses/FSA_ENEMY_D001_Chaos.glb'),idle:glb('animations/characters/overrides/bosses/chaos/FSA_ANIM_D001_Chaos_Idle.anim.glb'),
 effects:['shadow_stone_burst','nightmare_stone_burst','spike_rise','boundary'].map(n=>JSON.parse(fs.readFileSync(path.join(gen,'effects/arena/vfx_arena_'+n+'.vfx'),'utf8')))};
fs.mkdirSync('.qa',{recursive:true});fs.writeFileSync('.qa/arena-entry-data.json',JSON.stringify(data));
const js=await build({entryPoints:['previewer/arena-entry/app.js'],bundle:true,format:'iife',write:false,minify:true,target:'chrome110'});
const html=fs.readFileSync('previewer/arena-entry/page.html','utf8').replace('/*APP*/',()=>js.outputFiles[0].text.replaceAll('</script','<\\/script'));
fs.writeFileSync('.qa/arena-entry.html',html);console.log('Built .qa/arena-entry.html');
