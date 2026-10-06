import {spawn} from 'node:child_process';import fs from 'node:fs';import path from 'node:path';import {pathToFileURL,fileURLToPath} from 'node:url';import {setTimeout as delay} from 'node:timers/promises';import assert from 'node:assert/strict';import os from 'node:os';
const ROOT=fileURLToPath(new URL('../',import.meta.url)),quick=process.argv.includes('--quick'),profile=path.join(ROOT,'.browser-profile-'+Date.now()),write=(p,data)=>fs.writeFileSync(path.join(ROOT,p),Buffer.isBuffer(data)?data:JSON.stringify(data,null,2));fs.mkdirSync(profile,{recursive:true});
const stderr=fs.openSync(path.join(ROOT,'evidence/browser-stderr.txt'),'w'),child=spawn(process.env.CHROME_PATH??'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-background-networking','--enable-unsafe-swiftshader','--window-size=1600,1040','about:blank'],{windowsHide:true,stdio:['ignore','ignore',stderr]});
let ws,seq=0;const pending=new Map(),exceptions=[],external=[],checks=[],screenshots=[],motion=[],performanceRuns=[];
async function until(fn,timeout=60000){const start=Date.now();while(Date.now()-start<timeout){if(await fn())return;await delay(200);}throw Error('Browser state timeout');}
try{await until(()=>fs.existsSync(path.join(profile,'DevToolsActivePort')));const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0],tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params);else if(m.method==='Network.requestWillBeSent'&&/^https?:/.test(m.params.request.url))external.push(m.params.request.url);};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>reject(Error('CDP timeout '+method)),120000);pending.set(id,{resolve:r=>{clearTimeout(timer);resolve(r);},reject:e=>{clearTimeout(timer);reject(e);}});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const shot=async name=>{await delay(350);const r=await send('Page.captureScreenshot',{format:'png'});write(`evidence/${name}.png`,Buffer.from(r.data,'base64'));screenshots.push(name+'.png');};
 await send('Runtime.enable');await send('Network.enable');await send('Page.enable');await send('Page.navigate',{url:pathToFileURL(path.join(ROOT,'Play.html')).href});await until(()=>evaluate('Boolean(window.__ready)'));await shot('01-random-world');checks.push('file:// embedded GLB / Three / Rapier loaded');console.log('Offline page loaded');
 const visits=[],lifecycle=[];
 for(const seed of ['104729','20261005','8675309']){
  await evaluate(`navLab.rebuild('${seed}');navLab.pause(true)`);
  const original=await evaluate('({initial:itemLab.initial(),stable:itemLab.stable(),physics:navLab.state().physics})');
  await evaluate('itemLab.regenerate()');assert.equal(await evaluate('itemLab.stable()'),original.stable);
  await evaluate("itemLab.regenerate('alternate-items')");assert.equal(await evaluate('itemLab.initial()'),original.initial);assert.notEqual(await evaluate('itemLab.stable()'),original.stable);
  await evaluate("itemLab.regenerate('loot-104729')");assert.equal(await evaluate('itemLab.stable()'),original.stable);
  assert.deepEqual(await evaluate('navLab.state().physics'),original.physics);
  await evaluate("document.getElementById('roof').checked=false;document.getElementById('regions').checked=true;document.getElementById('regions').dispatchEvent(new Event('change'));navLab.overview()");await shot('world-'+seed);
  const distribution=await evaluate('itemLab.distribution()');
  for(const color of ['red','blue','green','purple','white']){
   const item=distribution.items.find(i=>i.color===color);assert.ok(item,color);
   const start=await evaluate(`itemLab.tour('${item.id}')`);
   const trace=[];for(let n=0;n<12;n++){const state=await evaluate('itemLab.tourAdvance(120)');trace.push(state.physics);if(state.physics.actorsState[0].arrived)break;}
   assert.ok(trace.at(-1).actorsState[0].arrived,'player tour '+seed+' '+color);
   await evaluate(`itemLab.tourLook('${item.id}');document.getElementById('roof').checked=true;document.getElementById('regions').checked=false;document.getElementById('regions').dispatchEvent(new Event('change'))`);
   await shot('inside-'+color+'-'+seed);visits.push({seed,color,item,start:start.physics,trace});
  }
  await evaluate("navLab.rebuild('"+seed+"');navLab.pause(true)");
  const motion=await evaluate('navLab.runChecks()');assert.ok(motion.every(m=>m.passed));checks.push(seed+' 15 inherited physical regressions passed with item meshes present');
  await evaluate("navLab.startCase('crowd');navLab.pause(true);navLab.advance(6000)");assert.ok((await evaluate('navLab.state().physics.actorsState')).every(a=>a.arrived));await shot('crowd-items-'+seed);
  const warehouse=distribution.items.find(i=>i.color==='green');await evaluate(`navLab.rebuild('${seed}');navLab.pause(true);itemLab.inspect('${warehouse.id}');document.getElementById('regions').checked=true;document.getElementById('regions').dispatchEvent(new Event('change'))`);await shot('subregions-'+seed);
  const blue=distribution.items.find(i=>i.color==='blue');await evaluate(`itemLab.tour('${blue.id}');itemLab.tourAdvance(50)`);await shot('raised-entry-'+seed);
  console.log('Browser seed complete',seed);write('evidence/browser-tours.json',visits);
 }
 await evaluate("navLab.rebuild('104729');navLab.pause(true)");
 for(let j=0;j<8;j++){await evaluate(`itemLab.regenerate('lifecycle-${j%2}')`);await delay(150);lifecycle.push(await evaluate('itemLab.resources()'));}
 assert.ok(lifecycle.every(r=>r.meshes>=80&&r.meshes<=120&&r.bodies===31));assert.ok(Math.max(...lifecycle.map(r=>r.memory.geometries))-Math.min(...lifecycle.map(r=>r.memory.geometries))<=4);assert.ok(Math.max(...lifecycle.map(r=>r.memory.textures))-Math.min(...lifecycle.map(r=>r.memory.textures))<=20);
 for(let j=0;j<4;j++){await evaluate(`navLab.rebuild('${j%2?'20261005':'104729'}');navLab.pause(true)`);await delay(200);lifecycle.push(await evaluate('itemLab.resources()'));}write('evidence/browser-lifecycle.json',lifecycle);
 const env={platform:os.platform(),release:os.release(),cpu:os.cpus()[0].model,logicalCpus:os.cpus().length,memoryGiB:os.totalmem()/2**30,browser:await send('Browser.getVersion')};
 for(const name of ['02-Navigation','03-ItemPlacement']){
  await send('Page.navigate',{url:pathToFileURL(path.join(ROOT,'..',name,'Play.html')).href});await until(()=>evaluate('Boolean(window.__ready)'));await evaluate("navLab.rebuild('104729',30);navLab.chase(2)");await delay(2000);await evaluate('navLab.clearFrames()');const start=Date.now();await delay(30000);const s=await evaluate('navLab.state()'),frames=s.frameTimes.sort((a,b)=>a-b);performanceRuns.push({name,seconds:(Date.now()-start)/1000,samples:frames.length,meanMs:frames.reduce((a,b)=>a+b,0)/frames.length,p95Ms:frames[Math.floor(frames.length*.95)],maxMs:frames.at(-1),items:s.items??0,placementMs:s.placementMs??0,viewport:await evaluate('({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,canvasWidth:document.querySelector("#stage>canvas").width,canvasHeight:document.querySelector("#stage>canvas").height})'),physics:s.physics,renderer:s.renderer});console.log('Performance complete',name);write('evidence/performance.json',{env,runs:performanceRuns});
 }
 write('evidence/browser-report.json',{passed:exceptions.length===0&&external.length===0,protocol:'file://',browser:await send('Browser.getVersion'),checks,screenshots,exceptions,external});assert.deepEqual(exceptions,[]);assert.deepEqual(external,[]);await send('Browser.close');console.log('Browser placement checks complete');
}catch(e){write('evidence/browser-failure.json',{message:e.stack,exceptions,external});throw e;}finally{ws?.close();child.kill();fs.closeSync(stderr);}
