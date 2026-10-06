import fs from 'node:fs';
for(const p of ['src/asset-check.mjs','src/browser-check.mjs','src/check.mjs','src/extra-check.mjs','src/generate.mjs','src/inspect-browser.mjs','src/integrate.mjs','src/setup.mjs'])fs.unlinkSync(p);
let b=fs.readFileSync('src/build.mjs','utf8').replace("src/check.mjs","src/check-placement.mjs");fs.writeFileSync('src/build.mjs',b);
fs.writeFileSync('src/verify.mjs',`import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../',import.meta.url));for(const cmd of ['src/verify-placement.mjs','src/build.mjs']){const r=spawnSync(process.execPath,[cmd],{cwd,stdio:'inherit',windowsHide:true});if(r.status!==0)process.exit(r.status??1);}
`);
fs.writeFileSync('package.json',JSON.stringify({name:'deadzone-item-placement-lab',private:true,type:'module',scripts:{build:'node src/build.mjs',check:'node src/verify.mjs',browser:'node src/browser-placement.mjs && node src/browser-views.mjs',finalize:'node src/finalize.mjs'}},null,2));
