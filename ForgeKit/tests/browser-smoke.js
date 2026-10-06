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
 await send('DOM.setFileInputFiles',{nodeId,files:[path.join(PROJECT,'assets/legacy/generated')]});
 await until(()=>evaluate("document.getElementById('details').textContent.includes('example.humanoid.tall')"));
 assert.equal(await evaluate("document.getElementById('model').options.length"),5);assert.equal(await evaluate("document.getElementById('animation').options.length"),5);
 await evaluate("document.getElementById('animation').value='3';document.getElementById('animation').dispatchEvent(new Event('change'))");
 await until(()=>evaluate("document.getElementById('status').textContent==='正在播放动画。'"));
 await delay(300);
 writeFileSync(path.join(qa,'humanoid-walk.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await evaluate("document.getElementById('animation').value='';document.getElementById('animation').dispatchEvent(new Event('change'))");
 assert.equal(await evaluate("document.getElementById('status').textContent"),'Reference / Default Pose');
 // Switch to a static model with the walk selected: compatibility must reject it.
 await evaluate("document.getElementById('animation').value='3';document.getElementById('model').value='3';document.getElementById('model').dispatchEvent(new Event('change'))");
 await until(()=>evaluate("document.getElementById('status').textContent.includes('Rig mismatch')"));
 // Race several selections and assert that the latest model wins.
 await evaluate("for(const v of ['0','4','2']){document.getElementById('model').value=v;document.getElementById('model').dispatchEvent(new Event('change'));}");
 await until(()=>evaluate("document.getElementById('details').textContent.includes('example.humanoid ·') && document.getElementById('status').textContent==='正在播放动画。'"));
 await evaluate("for(const id of ['axes','bounds','skeleton']){document.getElementById(id).checked=true;document.getElementById(id).dispatchEvent(new Event('change'));}");
 await delay(200);writeFileSync(path.join(qa,'helpers.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 assert.equal(await evaluate("window.__qaScene.children.find(n=>n.isSkeletonHelper).geometry.attributes.position.count"),12);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',x:600,y:400,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:600,y:400,button:'left',clickCount:1});
 await delay(150);const pointerLock=await evaluate('Boolean(document.pointerLockElement)');
 const before=await evaluate('window.__qaCamera.position.toArray()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'w',code:'KeyW'});await delay(150);await send('Input.dispatchKeyEvent',{type:'keyUp',key:'w',code:'KeyW'});const after=await evaluate('window.__qaCamera.position.toArray()');assert.notDeepEqual(before,after);
 const rotation=await evaluate('window.__qaCamera.rotation.toArray()');await send('Input.dispatchMouseEvent',{type:'mousePressed',x:600,y:400,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:620,y:410,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:620,y:410,button:'left',clickCount:1});await delay(80);assert.notDeepEqual(rotation,await evaluate('window.__qaCamera.rotation.toArray()'));
 await evaluate('document.exitPointerLock()');
 assert.deepEqual(exceptions,[]);
 const report={url:'file://.../previewer/index.html',models:5,animations:4,pointerLock,checks:['local classic scripts load','real directory input lists assets','humanoid walk plays','None restores default','static model rejects rig mismatch','async latest model wins','axes bounds skeleton render (six bone edges)','W moves camera','mouse drag changes camera rotation'],exceptions};writeFileSync(path.join(qa,'browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 await send('Browser.close');
}finally{ws?.close();child.kill();}
