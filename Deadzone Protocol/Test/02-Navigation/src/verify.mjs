import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const args of [['src/build.mjs','--check'],['build/check.mjs'],['src/asset-check.mjs'],['src/extra-check.mjs'],['src/build.mjs']]){const r=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',windowsHide:true});if(r.status!==0)process.exit(r.status??1);}
console.log('Independent static, actual Rapier motion, asset and offline build checks passed. Browser performance checks run separately: npm run browser.');
