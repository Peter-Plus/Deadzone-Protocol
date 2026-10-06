import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {generate,templates} from './world.mjs';import {Navigation,PROFILES,initialSpawns} from './navigation.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2),get=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const seed=get('--seed','104729');if(!/^[A-Za-z0-9_-]{1,40}$/.test(seed))throw Error('Invalid seed');
const scene=generate(seed,{size:Number(get('--size',160)),count:Number(get('--count',15)),cell:1}),navs=Object.fromEntries(Object.entries(PROFILES).map(([k,p])=>[k,new Navigation(scene,p)])),spawns=initialSpawns(scene,navs,Number(get('--enemies',30)));
for(const [name,value] of [[`${seed}.json`,scene],[`${seed}.spawns.json`,spawns]])fs.writeFileSync(path.join(root,'scenes',name),JSON.stringify(value,null,2)+'\n');
console.log(`Generated scenes/${seed}.json and scenes/${seed}.spawns.json; enter the same seed in Play.html. Terrain is rebuilt from this exact heightfield, no baked-terrain rearrangement.`);
