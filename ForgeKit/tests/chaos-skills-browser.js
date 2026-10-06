import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const evidence = path.join(root, '.qa/chaos-skills-check'); fs.mkdirSync(evidence, { recursive: true });
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
  await send('Page.navigate',{url:pathToFileURL(path.join(root,'.qa/chaos-skills.html')).href});
  await until(()=>evaluate('Boolean(window.__ready)'));
  const modes=['magic_bolt','demon_aura','body_charge','hell_hand','hell_eye_blast','hell_eye_charge','pursuit_horizontal','pursuit_vertical','pursuit_final','pursuit_teleport'];
  for(const mode of modes){
    const state=mode==='demon_aura'?'transform':mode==='hell_eye_blast'?'erupt':mode==='pursuit_teleport'?'vanish':'active';
    const time=mode==='hell_eye_blast'?.38:mode==='pursuit_teleport'?.25:mode==='demon_aura'?.9:mode.startsWith('pursuit_')?1.5:mode==='magic_bolt'?1.3:1;
    for(const bg of ['dark','light']){
      await evaluate("chaosPreview.configure('"+mode+"','"+state+"',"+time+");document.getElementById('bg').value='"+bg+"';document.getElementById('bg').onchange()");
      await shot(mode+'-'+bg);assert.ok((await evaluate('chaosPreview.state()')).fx.visibleLayers>0,mode);
    }
    if(!['hell_eye_blast','pursuit_teleport'].includes(mode)){
      await evaluate("chaosPreview.configure('"+mode+"','active',120)");assert.ok((await evaluate('chaosPreview.state()')).fx.visibleLayers>0);
      await evaluate("chaosPreview.configure('"+mode+"','dissipate',2)");
    }else await evaluate('chaosPreview.seek(3)');
    assert.equal((await evaluate('chaosPreview.state()')).fx.visibleLayers,0);
    await evaluate('chaosPreview.seek(.15)');assert.ok((await evaluate('chaosPreview.state()')).fx.visibleLayers>0);
  }
  await evaluate("chaosPreview.configure('hell_hand','active',.8);document.getElementById('angle').value=150;document.getElementById('radius').value=14;document.getElementById('angle').oninput()");
  await shot('hell-hand-wide');
  await evaluate("chaosPreview.configure('hell_eye_blast','erupt',.7)");await shot('hell-eye-rising');
  await evaluate("chaosPreview.configure('pursuit_teleport','arrival',.2)");await shot('teleport-arrival');
  await evaluate("chaosPreview.configure('demon_aura','transform',1.2)");assert.equal((await evaluate('chaosPreview.state()')).scale,1.3);
  for(const [m,t] of [['combo_hell',.5],['combo_hell',3],['combo_hell',12],['combo_hell',13.5],['combo_pursuit',.3],['combo_pursuit',1.4],['combo_pursuit',3],['combo_pursuit',9.9]]){
    await evaluate("chaosPreview.configure('"+m+"','active',"+t+")");await shot(m+'-'+t);assert.ok((await evaluate('chaosPreview.state()')).fx.visibleLayers>0);
  }
  await evaluate("chaosPreview.configure('combo_pursuit','active',.49)");const oldPos=(await evaluate('chaosPreview.state()')).modelPosition;
  await evaluate('chaosPreview.seek(.51)');assert.notDeepEqual((await evaluate('chaosPreview.state()')).modelPosition,oldPos);
  await evaluate("chaosPreview.configure('combo_hell','active',15.2)");assert.equal((await evaluate('chaosPreview.state()')).fx.visibleLayers,0);
  for(const [m,s] of [['toxic_shield','active'],['poison_heal','heal'],['fire_charge','active']]){
    for(const bg of ['dark','light']){
      await evaluate("chaosPreview.configure('"+m+"','"+s+"',.4);document.getElementById('bg').value='"+bg+"';document.getElementById('bg').onchange()");
      await shot(m+'-'+bg);assert.ok((await evaluate('chaosPreview.state()')).fx.visibleLayers>0);
    }
    await evaluate("chaosPreview.configure('"+m+"','"+(m==='toxic_shield'?'broken':m==='poison_heal'?'heal':'dissipate')+"',3)");
    assert.equal((await evaluate('chaosPreview.state()')).fx.visibleLayers,0);
    await evaluate('chaosPreview.seek(.2)');assert.ok((await evaluate('chaosPreview.state()')).fx.visibleLayers>0);
  }
  const before=(await evaluate('chaosPreview.state()')).memory;
  for(let i=0;i<4;i++)await evaluate("chaosPreview.configure('hell_hand','active',1);chaosPreview.configure('hell_eye_blast','erupt',.5)");
  assert.deepEqual((await evaluate('chaosPreview.state()')).memory,before);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  checks.push('Ten chaos effects, both backgrounds, adjustable suction, upward eruption, persistence, fade, reverse seek, scale, stable resources, offline');
  console.log(JSON.stringify({passed:true,checks}));await send('Browser.close');}catch(e){fs.writeFileSync(path.join(evidence,'failure.json'),JSON.stringify({message:e.message,errors,external},null,2));throw e;}
finally{ws?.close();child.kill();fs.closeSync(stderr);}
