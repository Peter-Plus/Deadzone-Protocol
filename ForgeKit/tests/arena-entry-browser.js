import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const evidence = path.join(root, '.qa/arena-entry-check'); fs.mkdirSync(evidence, { recursive: true });
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
  await send('Page.navigate',{url:pathToFileURL(path.join(root,'.qa/arena-entry.html')).href});
  await until(()=>evaluate('Boolean(window.__ready)'));
  await evaluate('arenaPreview.pause()');
  for(const [mode,time] of [['stones',0],['spikes',0],['shadow',1.3],['nightmare',1.3],['rise',1.1],['boundary',3],['combo',.4],['combo',1.3],['combo',2.4],['combo',4.5]]){
    await evaluate(`arenaPreview.configure('${mode}',${time})`);await shot(mode+'-'+time);
  }
  await evaluate("arenaPreview.configure('combo',4.5);arenaPreview.inside()");await shot('combo-inside');
  await evaluate("document.getElementById('light').click()");await shot('combo-inside-light');
  for(const n of [4,5,6])for(const r of [8,12,20]){
    await evaluate(`document.getElementById('count').value=${n};document.getElementById('radius').value=${r};document.getElementById('count').oninput();arenaPreview.seek(4.5)`);
    const state=await evaluate('arenaPreview.state()');assert.equal(state.spikes.filter(s=>s.visible).length,n);assert.ok(state.spikes.filter(s=>s.visible).every(s=>Math.abs(s.y)<.001));
    assert.ok(state.layout.slice(0,n).every(p=>Math.hypot(p.x,p.z)+2<r));
  }
  await evaluate("arenaPreview.configure('boundary',8)");assert.equal((await evaluate('arenaPreview.state()')).fx[3].visibleLayers,0);
  await evaluate('arenaPreview.seek(2)');assert.equal((await evaluate('arenaPreview.state()')).fx[3].visibleLayers,1);
  await evaluate("arenaPreview.configure('combo',0)");assert.equal((await evaluate('arenaPreview.state()')).bossVisible,false);
  assert.ok((await evaluate('arenaPreview.state()')).spikes.every(s=>!s.visible));
  await evaluate("document.getElementById('count').value=5;document.getElementById('radius').value=12;document.getElementById('count').oninput();arenaPreview.configure('combo',4.5)");
  const before=(await evaluate('arenaPreview.state()')).memory;
  await evaluate("for(let i=0;i<30;i++){document.getElementById('random').click();arenaPreview.seek(0);arenaPreview.seek(4.5)}");
  await delay(250);assert.deepEqual((await evaluate('arenaPreview.state()')).memory,before);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log(JSON.stringify({passed:true,checks:'All models/effects; combo stages; 4/5/6 spikes at 8/12/20m; inside/light; reset/reverse/fade; stable resources; offline'}));await send('Browser.close');
}catch(e){fs.writeFileSync(path.join(evidence,'failure.json'),JSON.stringify({message:e.message,errors,external},null,2));throw e;}
finally{ws?.close();child.kill();fs.closeSync(stderr);}
