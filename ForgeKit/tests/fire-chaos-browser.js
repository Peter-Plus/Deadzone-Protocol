import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const evidence = path.join(root, '.qa/fire-chaos-check'); fs.mkdirSync(evidence, { recursive: true });
const profile = path.join(evidence, '.browser-profile-' + Date.now());
const stderr = fs.openSync(path.join(evidence, 'browser-stderr.txt'), 'w');
const child = spawn(process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
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
  await send('Runtime.enable');await send('Network.enable');await send('Page.enable');
  await send('Page.navigate',{url:pathToFileURL(path.join(root,'.qa/fire-chaos-effects.html')).href});
  await until(()=>evaluate('Boolean(window.__ready)'));
  for(const [mode,time] of [['fireball',.6],['seed',.6],['rift',1.25]]){
    for(const bg of ['dark','light']){
      await evaluate(`fireChaosPreview.configure('${mode}',${time});document.getElementById('bg').value='${bg}';document.getElementById('bg').onchange()`);
      await shot(mode+'-'+bg);assert.ok((await evaluate('fireChaosPreview.state()')).fx.visibleLayers>0);
      assert.equal((await evaluate('fireChaosPreview.state()')).modelVisible,mode==='rift');
    }
  }
  await evaluate("fireChaosPreview.configure('rift',.5)");await shot('rift-warning');
  for(const [angle,radius] of [[1,1],[45,6],[120,12],[360,8]]){
    await evaluate(`fireChaosPreview.configure('rift',1.3,${angle},${radius})`);await shot('rift-'+angle);
  }
  await evaluate('fireChaosPreview.seek(2.6)');assert.equal((await evaluate('fireChaosPreview.state()')).fx.visibleLayers,0);
  await evaluate('fireChaosPreview.seek(1.2)');assert.ok((await evaluate('fireChaosPreview.state()')).fx.visibleLayers>0);
  await evaluate("document.getElementById('end').click();fireChaosPreview.seek(.5)");assert.equal((await evaluate('fireChaosPreview.state()')).fx.visibleLayers,0);
  await evaluate("fireChaosPreview.configure('seed',120)");assert.ok((await evaluate('fireChaosPreview.state()')).fx.visibleLayers>0);
  await evaluate('fireChaosPreview.count(100)');await shot('seed-100');
  await evaluate("document.getElementById('play').click()");
  const performance=await evaluate(`new Promise(resolve=>{let previous=performance.now(),frames=[];function tick(now){frames.push(now-previous);previous=now;if(frames.length<31)requestAnimationFrame(tick);else resolve({frames:30,meanMs:frames.slice(1).reduce((a,b)=>a+b,0)/30,state:fireChaosPreview.state()});}requestAnimationFrame(tick);})`);
  await evaluate('fireChaosPreview.seek(.5);fireChaosPreview.count(1)');const memory=(await evaluate('fireChaosPreview.state()')).memory;
  await evaluate('(async()=>{await fireChaosPreview.count(30);await fireChaosPreview.count(1)})()');assert.deepEqual((await evaluate('fireChaosPreview.state()')).memory,memory);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  checks.push('Fireball and seed without models; rift warning/eruption with Chaos; angles, radius, interruption, reverse seek; 100 seeds and cleanup');
  fs.writeFileSync(path.join(evidence,'browser.json'),JSON.stringify({passed:true,checks,performance},null,2));
  console.log(JSON.stringify({passed:true,checks,performance}));await send('Browser.close');}catch(e){fs.writeFileSync(path.join(evidence,'failure.json'),JSON.stringify({message:e.message,errors,external},null,2));throw e;}
finally{ws?.close();child.kill();fs.closeSync(stderr);}
