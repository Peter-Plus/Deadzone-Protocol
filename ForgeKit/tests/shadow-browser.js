import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const evidence = path.join(root, '.qa/shadow'); fs.mkdirSync(evidence, { recursive: true });
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
  const catalog=JSON.parse(fs.readFileSync(path.join(root,'.qa/effects-preview-data.json'),'utf8')).effects;
  const ids=['vfx_shadow_phantom_arrival','vfx_shadow_phantom_charge','vfx_shadow_phantom_vanish'];
  const snapshots=[];
  await send('Runtime.enable');await send('Network.enable');await send('Page.enable');
  await send('Page.navigate',{url:pathToFileURL(path.join(root,'previewer/effects.html')).href});
  await until(()=>evaluate('Boolean(window.__ready)'));
  for(const id of ids){
    const index=catalog.findIndex(e=>e.package.effect.id===id);assert.ok(index>=0);assert.equal(catalog[index].previewModel,undefined);assert.equal(catalog[index].package.effect.binding,undefined);
    const duration=catalog[index].package.effect.states[catalog[index].package.effect.initialState].duration;
    for(const background of ['dark','light']){
      await evaluate(`vfxPreview.configure({asset:${index},count:'1',distance:'3',background:'${background}',time:${duration*.4}})`);
      assert.equal(await evaluate('vfxPreview.state().instances[0].visibleLayers>0'),true);
      await shot(id+'-'+background);
    }
    await evaluate(`vfxPreview.seek(${duration})`);assert.equal(await evaluate('vfxPreview.state().instances[0].visibleLayers'),0);
    await evaluate(`vfxPreview.seek(${duration*.4})`);assert.ok(await evaluate('vfxPreview.state().instances[0].visibleLayers')>0);
    await evaluate("document.getElementById('clear').click()");assert.equal(await evaluate('vfxPreview.state().instances[0].visibleLayers'),0);
    snapshots.push({id,duration,appearance:'no model reference',state:await evaluate('vfxPreview.state()')});
    const bytes=fs.readFileSync(path.join(root,'assets/FSA(项目使用)/generated/effects/shadow',id+'.vfx'),'utf8');
    await evaluate(`vfxPreview.importFiles([new File([${JSON.stringify(bytes)}],'${id}.vfx')])`);
    assert.equal(await evaluate('vfxPreview.state().asset'),id);
    // Restore builtins before next numeric selection.
    await evaluate("document.getElementById('defaults').click()");await until(()=>evaluate("vfxPreview.state().asset==='vfx_hit_blood_low'"));
  }
  checks.push('Three self-contained shadow VFX load without model/animation references; dark/light views, backward seek, expiry and clear');
  const index=catalog.findIndex(e=>e.package.effect.id===ids[2]);
  await evaluate(`vfxPreview.configure({asset:${index},count:'30',distance:'20',time:.35})`);assert.equal(await evaluate('vfxPreview.state().instances.length'),30);await shot('vanish-30');
  const memory=[];
  for(let i=0;i<4;i++){await evaluate(`vfxPreview.configure({asset:${index},count:'1',time:.35})`);memory.push(await evaluate('vfxPreview.state()'));}
  assert.equal(memory[0].geometries,memory.at(-1).geometries);assert.equal(memory[0].textures,memory.at(-1).textures);
  checks.push('30 fog instances render and repeated switching has stable resource counts');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  fs.writeFileSync(path.join(evidence,'browser.json'),JSON.stringify({passed:true,checks,snapshots,memory,errors,external},null,2));
  console.log(JSON.stringify({passed:true,checks},null,2));await send('Browser.close');
}catch(e){fs.writeFileSync(path.join(evidence,'failure.json'),JSON.stringify({message:e.message,errors,external},null,2));throw e;}
finally{ws?.close();child.kill();fs.closeSync(stderr);}
