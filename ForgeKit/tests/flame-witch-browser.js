import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const evidence = path.join(root, '.qa/flame-witch-check'); fs.mkdirSync(evidence, { recursive: true });
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
  await send('Page.navigate',{url:pathToFileURL(path.join(root,'.qa/flame-witch-effects.html')).href});
  await until(()=>evaluate('Boolean(window.__ready)'));
  for(const [mode,state,time] of [['roar','active',.6],['shield','active',.4],['charge','active',.5],['explosion','explode',.28],['arrival','arrival',.15]]){
    for(const bg of ['dark','light']){
      await evaluate("flamePreview.configure('"+mode+"','"+state+"',"+time+");document.getElementById('bg').value='"+bg+"';document.getElementById('bg').onchange()");
      await shot(mode+'-'+bg);assert.ok((await evaluate('flamePreview.state()')).fx.visibleLayers>0);
    }
    if(['roar','shield','charge'].includes(mode)){
      await evaluate('flamePreview.seek(120)');assert.ok((await evaluate('flamePreview.state()')).fx.visibleLayers>0);
      await evaluate("flamePreview.configure('"+mode+"','dissipate',1)");
    }else await evaluate('flamePreview.seek(2)');
    assert.equal((await evaluate('flamePreview.state()')).fx.visibleLayers,0);
    await evaluate('flamePreview.seek(.15)');assert.ok((await evaluate('flamePreview.state()')).fx.visibleLayers>0);
  }
  await evaluate("flamePreview.configure('roar','active',.4);flamePreview.effects.roar.setBeam(0,.8)");
  assert.equal((await evaluate('flamePreview.state()')).fx.visibleLayers,0);
  await evaluate("document.getElementById('length').value=18;document.getElementById('length').oninput()");
  await shot('roar-long');
  assert.equal(await evaluate("(()=>{try{flamePreview.effects.roar.setBeam(NaN,1);return false}catch{return true}})()"),true);
  await evaluate("flamePreview.configure('shield','broken',.1)");await shot('shield-broken');await evaluate('flamePreview.seek(1)');assert.equal((await evaluate('flamePreview.state()')).fx.visibleLayers,0);
  const before=(await evaluate('flamePreview.state()')).memory;
  for(let i=0;i<5;i++)await evaluate("flamePreview.configure('charge','active',.4);flamePreview.configure('arrival','arrival',.2)");
  assert.deepEqual((await evaluate('flamePreview.state()')).memory,before);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  checks.push('Five fire effects, both backgrounds, adjustable beam, persistence, fade, reverse seek, shield break, stable resources and offline loading');
  console.log(JSON.stringify({passed:true,checks}));await send('Browser.close');}catch(e){fs.writeFileSync(path.join(evidence,'failure.json'),JSON.stringify({message:e.message,errors,external},null,2));throw e;}
finally{ws?.close();child.kill();fs.closeSync(stderr);}
