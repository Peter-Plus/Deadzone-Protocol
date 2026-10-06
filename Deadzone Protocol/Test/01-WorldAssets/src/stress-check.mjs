import fs from 'node:fs';import path from 'node:path';
import {generate} from './world.mjs';import {validateScene} from './validate.mjs';import {ROOT,read,write} from './node-tools.mjs';
let countCases=0;const errors=[];
for(const count of [12,15,16,17,18])for(let i=0;i<12;i++){try{validateScene(generate(`stress-${i}`,{count}));countCases++;}catch(e){errors.push({count,seed:`stress-${i}`,error:e.message});}}
const browserScene=fs.existsSync(path.join(ROOT,'evidence/browser-new-seed.json'))?validateScene(read('evidence/browser-new-seed.json')):null;
const result={passed:!errors.length,countCases,configuration:'size=160, cell=1, counts=[12,15,16,17,18], seeds=stress-0..11',browserScene,errors};write('evidence/generator-stress.json',result);console.log(JSON.stringify(result,null,2));if(errors.length)process.exitCode=1;
