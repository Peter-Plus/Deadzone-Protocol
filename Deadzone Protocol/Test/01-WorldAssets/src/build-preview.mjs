import fs from 'node:fs';import path from 'node:path';
import {ROOT,load,read,write} from './node-tools.mjs';
const h=read('handoff.json'),glbs={};for(const p of [...h.assets,...h.references])glbs[p]=fs.readFileSync(path.join(ROOT,p)).toString('base64');
write('preview-data.json',{scenes:h.seeds.map(s=>read(s.scene)),glbs});
const esbuild=await load('node_modules/esbuild/lib/main.js');const result=await esbuild.build({entryPoints:[path.join(ROOT,'src/preview.mjs')],bundle:true,format:'iife',minify:true,write:false,target:['chrome110'],legalComments:'eof'});
const code=result.outputFiles[0].text.replaceAll('</script','<\\/script');const html=fs.readFileSync(path.join(ROOT,'src/preview.html'),'utf8').replace('/*__APP__*/',()=>code);write('Preview.html',html);console.log(`Offline Preview.html: ${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MiB`);
