import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../',import.meta.url));for(const cmd of ['src/verify-placement.mjs','src/extra-placement-check.mjs','src/build.mjs']){const r=spawnSync(process.execPath,[cmd],{cwd,stdio:'inherit',windowsHide:true});if(r.status!==0)process.exit(r.status??1);}
