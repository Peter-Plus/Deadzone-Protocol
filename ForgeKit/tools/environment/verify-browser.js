import {spawn} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdirSync,openSync,closeSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {PROJECT} from '../core/library.js';
const exe=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
if(!exe)throw new Error('Set CHROME_PATH to Chromium.');
const qa=path.join(PROJECT,'.qa/environment');mkdirSync(qa,{recursive:true});const profile=path.join(qa,'browser-'+Date.now());mkdirSync(profile);
const stderr=openSync(path.join(qa,'browser-stderr.txt'),'w');
const child=spawn(exe,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-background-networking','--enable-unsafe-swiftshader','--window-size=1440,1000','about:blank'],{windowsHide:true,stdio:['ignore','ignore',stderr]});
let ws,sequence=0;const pending=new Map(),exceptions=[],external=[];
async function until(fn){const start=Date.now();while(Date.now()-start<30000){const r=await fn();if(r)return r;await delay(80);}throw new Error('Browser state timeout');}
try{
 await until(()=>existsSync(path.join(profile,'DevToolsActivePort')));const port=readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(new Error(JSON.stringify(m.error)));else p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params);else if(m.method==='Network.requestWillBeSent'&&/^https?:/.test(m.params.request.url))external.push(m.params.request.url);};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout '+method));},15000);pending.set(id,{resolve:r=>{clearTimeout(timer);resolve(r);},reject:e=>{clearTimeout(timer);reject(e);}});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await send('Runtime.enable');await send('Page.enable');await send('Network.enable');await send('Page.navigate',{url:pathToFileURL(path.join(PROJECT,'assets/environment-samples/generated/EnvironmentPreview.html')).href});await until(()=>evaluate('Boolean(window.environmentQA)'));
 const screenshot=async name=>{await delay(200);writeFileSync(path.join(qa,name+'.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));};
 const snapshots=[];for(let i=0;i<5;i++){await evaluate(`environmentQA.choose(${i})`);snapshots.push(await evaluate('environmentQA.snapshot()'));await screenshot(snapshots.at(-1).id);}
 await evaluate("environmentQA.choose(1);environmentQA.profile('B2');document.getElementById('roof').checked=false;document.getElementById('roof').dispatchEvent(new Event('change'));environmentQA.view(true)");assert.equal(await evaluate('environmentQA.snapshot().route'),true);await screenshot('Building-interior');
 await evaluate("environmentQA.choose(2);environmentQA.profile('B2');environmentQA.seek(0)");assert.equal(await evaluate('environmentQA.snapshot().route'),false);
 for(const u of [.25,.5,.75,1]){await evaluate(`environmentQA.seek(${u})`);const s=await evaluate('environmentQA.snapshot()');assert.ok(s.leaf.every((n,i)=>Math.abs(n-s.collider[i])<1e-5));}
 assert.equal(await evaluate('environmentQA.snapshot().route'),true);await screenshot('Gate-open');
 await evaluate("document.getElementById('reset').click();document.getElementById('open').click()");await until(()=>evaluate('environmentQA.snapshot().progress===1'));assert.equal(await evaluate('environmentQA.snapshot().route'),true);
 await evaluate('environmentQA.choose(1)');await delay(200);const before=await evaluate('environmentQA.snapshot().meshes');for(let i=0;i<10;i++)await evaluate(`environmentQA.choose(${i%5})`);await evaluate('environmentQA.choose(1)');await delay(200);const after=await evaluate('environmentQA.snapshot().meshes');assert.ok(after<=before+2,`geometries grew ${before} -> ${after}`);
 assert.deepEqual(exceptions,[]);assert.deepEqual(external,[]);const report={url:'file:// EnvironmentPreview.html',assets:snapshots,checks:['five models load offline','B2 through interior','closed gate blocks route','animated leaf matches collision at four fractions','open gate passes','button playback and reset','bounded geometry on switching'],geometry:{before,after},exceptions,external};writeFileSync(path.join(qa,'browser.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.checks.length,screenshots:7,geometry:report.geometry}));await send('Browser.close');
}finally{ws?.close();child.kill();closeSync(stderr);}
