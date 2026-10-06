import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const evidence = path.join(root, '.qa/skill-supplement-evidence'); fs.mkdirSync(evidence, { recursive: true });
const profile = path.join(evidence, '.browser-profile-' + Date.now());
const stderr = fs.openSync(path.join(evidence, 'browser-stderr.txt'), 'w');
const child = spawn(process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--enable-unsafe-swiftshader', '--window-size=1600,1000', 'about:blank'], { windowsHide: true, stdio: ['ignore','ignore',stderr] });
let ws, sequence = 0;
const pending = new Map(), errors = [], external = [], checks = [];
async function until(fn) { const start = Date.now(); while (Date.now() - start < 45000) { if (await fn()) return; await delay(100); } throw Error('Browser readiness timeout'); }
try {
  await until(() => fs.existsSync(path.join(profile, 'DevToolsActivePort')));
  const port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0];
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result); }
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params);
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params);
    else if (m.method === 'Network.requestWillBeSent' && /^https?:/.test(m.params.request.url)) external.push(m.params.request.url);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence, timer = setTimeout(() => reject(Error(`Timeout: ${method}`)), 60000);
    pending.set(id, { resolve: result => { clearTimeout(timer); resolve(result); }, reject: error => { clearTimeout(timer); reject(error); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value;
  };
  const shot = async name => { await delay(120); const result = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(evidence, name + '.png'), Buffer.from(result.data, 'base64')); };

 await send('Runtime.enable');await send('Network.enable');await send('Page.enable');await send('Page.navigate',{url:pathToFileURL(path.join(root,'.qa/skill-supplement.html')).href});await until(()=>evaluate('Boolean(window.__ready)'));
 const result=await evaluate(`(()=>{review.stop();const checks=[];const assert=(v,m)=>{if(!v)throw Error(m);};const [a,b]=review.data;for(const k of ['states','textures','layers'])assert(JSON.stringify(a.effect[k])===JSON.stringify(b.effect[k]),'Poison mismatch '+k);checks.push('Poison copies visually identical');for(let i=0;i<5;i++){review.select(i);for(const radius of [.5,3,8]){review.setRadius(radius);review.sample(.25);assert(review.fx[i].stats().visibleLayers>0,'Invisible '+i);assert(review.fx[i].root.scale.x===radius,'Radius');}if(i===2){for(const d of [.5,1,2,5]){review.setDuration(d);review.sample(d*.5);assert(Math.abs(review.fx[i].stats().time-.5)<1e-6,'Progress mapping');review.sample(d+2);assert(review.fx[i].stats().visibleLayers===1,'Must hold until explicit end');}}else{review.sample(3);assert(review.fx[i].stats().visibleLayers===0,'One-shot expiry');}for(let n=0;n<5;n++){review.replay();review.sample(.2);assert(review.fx[i].stats().visibleLayers>0,'Replay');review.clear();review.fx[i].update(2);assert(review.fx[i].stats().visibleLayers===0,'Cancelled restart');}}checks.push('All assets: radius .5/3/8, expiry, cancellation, five replays; warning .5/1/2/5 second timing');return checks;})()`);checks.push(...result);
 for(let i=0;i<5;i++){await evaluate('review.select('+i+');review.setRadius(3);review.sample(.35)');await shot('effect-'+i);}
 await evaluate("document.getElementById('background').value='#a6a099';document.getElementById('background').onchange();review.select(2);review.sample(.8)");await shot('warning-light');
 const released=await evaluate('review.fx.forEach(e=>e.dispose());review.fx.every(e=>e.stats().disposed && !e.root.parent)');assert.ok(released);assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(external.length,0);checks.push('Disposed all instances; file:// with no network or WebGL errors');console.log(JSON.stringify({passed:true,checks}));fs.writeFileSync(path.join(evidence,'checks.json'),JSON.stringify({passed:true,checks,errors},null,2));await send('Browser.close');
}catch(e){console.log(JSON.stringify(errors));throw e;}finally{ws?.close();child.kill();fs.closeSync(stderr);}


