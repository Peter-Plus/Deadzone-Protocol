// Real Chromium file:// smoke test; no HTTP asset server and no browser libraries.
import { spawn } from 'node:child_process';
import { existsSync,readFileSync,mkdirSync,writeFileSync,openSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { PROJECT } from '../tools/core/library.js';
const executable=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
if(!executable)throw new Error('Set CHROME_PATH to a Chromium executable.');
const qa=path.join(PROJECT,'.qa');mkdirSync(qa,{recursive:true});
const profile=path.join(qa,`browser-${Date.now()}`);mkdirSync(profile);
const child=spawn(executable,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-background-networking','--enable-unsafe-swiftshader','--window-size=1280,900','about:blank'],{windowsHide:true,stdio:['ignore','ignore',openSync(path.join(qa,'browser-stderr.txt'),'w')]});
let ws;const pending=new Map();let sequence=0;const exceptions=[];
async function until(fn,timeout=15000){const start=Date.now();while(Date.now()-start<timeout){const value=await fn();if(value)return value;await delay(80);}throw new Error('Timed out waiting for browser state');}
try{
 await until(()=>existsSync(path.join(profile,'DevToolsActivePort')));
 const port=readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
 const tabs=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});ws.onclose=e=>console.log('CDP closed',e.code,e.reason);
 ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(new Error(JSON.stringify(m.error)));else p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params);};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`CDP timeout: ${method}; websocket state ${ws.readyState}`));},15000);pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url:pathToFileURL(path.join(PROJECT,'previewer/index.html')).href});
 await until(()=>evaluate("Boolean(document.querySelector('canvas'))"));
 await evaluate("ForgeVendor.THREE.Scene.prototype.onBeforeRender=function(renderer,scene,camera){window.__qaScene=scene;window.__qaCamera=camera;};");
 const dom=await send('DOM.getDocument');const {nodeId}=await send('DOM.querySelector',{nodeId:dom.root.nodeId,selector:'#folder'});
 await send('DOM.setFileInputFiles',{nodeId,files:[path.join(PROJECT,'assets/FSA(项目使用)/generated')]});

 await until(()=>evaluate("document.getElementById('model').options.length===13"));
 await evaluate("const picker=document.getElementById('model');picker.value=Array.from(picker.options).find(o=>o.textContent.includes('FSA_FPS_')).value;picker.dispatchEvent(new Event('change'));");
 await until(()=>evaluate("document.getElementById('details').textContent.includes('FSA_FPS_')"));
 assert.equal(await evaluate("document.getElementById('model').options.length"),13);

 await evaluate("(()=>{const p=ForgeVendor.THREE.AnimationMixer.prototype,fn=p.clipAction;p.clipAction=function(...a){window.__qaMixer=this;return fn.apply(this,a);};document.getElementById('useCameraSocket').checked=true;document.getElementById('useCameraSocket').dispatchEvent(new Event('change'));document.getElementById('hideGround').checked=true;document.getElementById('hideGround').dispatchEvent(new Event('change'));})()");
 const weaponChoices=await evaluate("Array.from(document.getElementById('weapon').options).filter(o=>o.value!=='').map(o=>({value:o.value,name:o.textContent}))");assert.equal(weaponChoices.length,9);
 const mounted=()=>evaluate("(()=>{const m=window.__qaScene.children.find(n=>n.getObjectByName('Asset'));const a=m?.getObjectByName('Weapon_R')?.children.filter(n=>n.userData.previewWeapon)??[];return a.map(n=>ForgeRuntime.metadata(n).assetId);})()");
 async function chooseWeapon(choice){await evaluate("document.getElementById('weapon').value="+JSON.stringify(choice?.value??'')+";document.getElementById('weapon').dispatchEvent(new Event('change'))");await until(async()=>{const ids=await mounted();return choice?ids.length===1&&choice.name.includes(ids[0]):ids.length===0;});}
 for(const w of weaponChoices)await chooseWeapon(w);
 await chooseWeapon(null);assert.deepEqual(await mounted(),[]);
 await evaluate("for(const v of "+JSON.stringify(weaponChoices.slice(0,3).map(w=>w.value))+ "){document.getElementById('weapon').value=v;document.getElementById('weapon').dispatchEvent(new Event('change'));}");await until(async()=>{const ids=await mounted();return ids.length===1&&weaponChoices[2].name.includes(ids[0]);});
 const clips=await evaluate("Array.from(document.getElementById('animation').options).filter(o=>o.textContent.includes('FSA_ANIM_FPS_')).map(o=>({value:o.value,name:o.textContent}))");assert.equal(clips.length,23);
 for(const c of clips){
  const tag=c.name.includes('Firearm')?'AR_001':c.name.includes('Melee')?'Melee_001':c.name.includes('Throwable')?'Throwable_001':null;await chooseWeapon(tag?weaponChoices.find(w=>w.name.includes(tag)):null);
  await evaluate("document.getElementById('animation').value="+JSON.stringify(c.value)+";document.getElementById('animation').dispatchEvent(new Event('change'))");await until(()=>evaluate("document.getElementById('status').textContent==='正在播放动画。'"));
  const t=c.name.includes('Reload')?.72:c.name.includes('Bolt')?.29:c.name.includes('Attack')?.32:c.name.includes('Throw.anim')?.38:c.name.includes('Fire.anim')?.045:.18;
  await evaluate("window.__qaMixer.setTime("+t+");window.__qaMixer.timeScale=0");await delay(80);
  if(/_(Idle|Reload|Bolt|Attack|Throw)\.anim/.test(c.name))writeFileSync(path.join(qa,'right-'+c.name.split('/').at(-1)+'.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 }
 await chooseWeapon(weaponChoices[0]);await evaluate("document.getElementById('animation').value='';document.getElementById('animation').dispatchEvent(new Event('change'));document.getElementById('model').value=Array.from(document.getElementById('model').options).find(o=>o.textContent.includes('FSA_WPN_AR')).value;document.getElementById('model').dispatchEvent(new Event('change'))");await until(()=>evaluate("document.getElementById('details').textContent.includes('FSA_WPN_AR')"));assert.equal(await evaluate("document.getElementById('weapon').disabled"),true);
 await evaluate("document.getElementById('model').value=Array.from(document.getElementById('model').options).find(o=>o.textContent.includes('FSA_FPS_')).value;document.getElementById('model').dispatchEvent(new Event('change'))");await until(async()=>{const ids=await mounted();return ids.length===1&&weaponChoices[0].name.includes(ids[0]);});assert.equal(await evaluate("document.getElementById('weapon').disabled"),false);
 await evaluate("document.getElementById('reload').click()");await until(async()=>{const ids=await mounted();return ids.length===1&&weaponChoices[0].name.includes(ids[0]);});
 assert.deepEqual(exceptions,[]);console.log('PASS: 9 weapons, None, rapid latest-wins switch, 23 clips on right socket, missing socket disables picker, model switch/reload restores one weapon.');
 await send('Browser.close');
}finally{ws?.close();child.kill();}


