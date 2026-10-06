import {spawn} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdirSync,openSync,closeSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {PROJECT} from '../core/library.js';
const exe=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
if(!exe)throw new Error('Set CHROME_PATH to Chromium.');
const qa=path.join(PROJECT,'.qa/world-terrain-barriers');mkdirSync(qa,{recursive:true});const profile=path.join(qa,'browser-'+Date.now());mkdirSync(profile);
const stderr=openSync(path.join(qa,'browser-stderr.txt'),'w');
const child=spawn(exe,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-background-networking','--enable-unsafe-swiftshader','--window-size=1440,1000','about:blank'],{windowsHide:true,stdio:['ignore','ignore',stderr]});
let ws,sequence=0;const pending=new Map(),exceptions=[],external=[];
async function until(fn){const start=Date.now();while(Date.now()-start<30000){const r=await fn();if(r)return r;await delay(80);}throw new Error('Browser state timeout');}
try{
 await until(()=>existsSync(path.join(profile,'DevToolsActivePort')));const port=readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(new Error(JSON.stringify(m.error)));else p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params);else if(m.method==='Network.requestWillBeSent'&&/^https?:/.test(m.params.request.url))external.push(m.params.request.url);};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout '+method));},15000);pending.set(id,{resolve:r=>{clearTimeout(timer);resolve(r);},reject:e=>{clearTimeout(timer);reject(e);}});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
 const snapshots=[];
 for(const batch of (process.argv[2]?[process.argv[2]]:['barriers','terrain'])){
  await send('Page.navigate',{url:pathToFileURL(path.join(PROJECT,'assets/FSA(项目使用)/generated/world/environments',batch,'EnvironmentPreview.html')).href});await until(()=>evaluate('Boolean(window.environmentQA)'));
  const count=await evaluate('window.ENVIRONMENT_ASSETS.length');
  for(let i=0;i<count;i++){
   await evaluate(`environmentQA.choose(${i});document.getElementById('collision').checked=false;document.getElementById('collision').dispatchEvent(new Event('change'));document.getElementById('zones').checked=false;document.getElementById('zones').dispatchEvent(new Event('change'));`);
   snapshots.push(await evaluate('environmentQA.snapshot()'));await delay(300);
   const name=snapshots.at(-1).id;
   writeFileSync(path.join(qa,name+'.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
   await evaluate("document.getElementById('collision').checked=true;document.getElementById('collision').dispatchEvent(new Event('change'));document.getElementById('zones').checked=true;document.getElementById('zones').dispatchEvent(new Event('change'));environmentQA.view(true)");await delay(250);
   writeFileSync(path.join(qa,name+'-collision.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  }
 }
 assert.deepEqual(exceptions,[]);assert.deepEqual(external,[]);
 writeFileSync(path.join(qa,'browser.json'),JSON.stringify({snapshots,exceptions,external},null,2));console.log(JSON.stringify({assets:snapshots.length,screenshots:snapshots.length*2,exceptions,external}));
 await send('Browser.close');
}finally{ws?.close();child.kill();closeSync(stderr);}
