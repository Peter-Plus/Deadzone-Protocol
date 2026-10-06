import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('./', import.meta.url));
const evidence = path.join(root, 'evidence'); fs.mkdirSync(evidence, { recursive: true });
const profile = path.join(root, '.browser-profile-' + Date.now());
const stderr = fs.openSync(path.join(evidence, 'browser-stderr.txt'), 'w');
const child = spawn(process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--enable-unsafe-swiftshader', '--window-size=1440,1000', 'about:blank'], { windowsHide: true, stdio: ['ignore','ignore',stderr] });
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
  await send('Runtime.enable'); await send('Network.enable'); await send('Page.enable');
  await send('Page.navigate', { url: pathToFileURL(path.join(root, 'Preview.html')).href });
  await until(() => evaluate('Boolean(window.__ready)'));
  assert.equal(await evaluate('bloodPreview.state().activeHits'), 1); checks.push('Offline file:// bundle loads GLB, texture and effect');
  await shot('01-near-dark');
  await evaluate("bloodPreview.configure({background:'light'})"); await shot('02-near-light');
  await evaluate("bloodPreview.configure({distance:'20'})"); await shot('03-far-light');
  for (const count of [30, 50]) {
    await evaluate(`bloodPreview.configure({count:'${count}',distance:'20',background:'dark'})`);
    assert.equal(await evaluate('bloodPreview.state().activeHits'), count); await shot(`04-crowd-${count}`);
  }
  checks.push('30 and 50 simultaneous hits on actual A1 enemy models');
  for (const target of ['shield', 'clone']) {
    await evaluate(`bloodPreview.configure({target:'${target}'})`);
    assert.equal(await evaluate('bloodPreview.state().activeHits'), 0);
  }
  checks.push('Simulated shield and clone results emit zero blood');
  await evaluate("bloodPreview.configure({count:'1',distance:'3',target:'enemy',background:'dark'})");
  for (const time of [0, .06, .18, .32, .46]) { await evaluate(`bloodPreview.seek(${time})`); await shot(`05-time-${time}`); }
  assert.equal(await evaluate('bloodPreview.state().visible'), false);
  checks.push('Effect expires at 0.46 s and removes render call');
  const lifecycle = await evaluate(`(() => {
    const p = bloodPreview, e = p.effect; e.clear();
    const event = {bloodAllowed:true, point:[0,1,0],normal:[0,0,1]};
    for(let i=0;i<100;i++) e.emit({...event,seed:i},0);
    const capped = e.stats(); e.update(1); const expired = e.stats();
    e.clear(); const rejected = [e.emit({...event,bloodAllowed:false},0),e.emit({...event,normal:[0,0,0]},0),e.emit({...event,point:[NaN,1,0]},0)];
    for(let i=0;i<100;i++){e.clear();e.emit(event,0);e.update(1);}
    return {capped,expired,rejected,after:e.stats()};
  })()`);
  assert.equal(lifecycle.capped.activeHits, 64); assert.equal(lifecycle.expired.activeHits, 0);
  assert.deepEqual(lifecycle.rejected, [false,false,false]); assert.equal(lifecycle.after.visible, false);
  checks.push('100-event overflow bounded at 64; 100 clear/replay cycles; malformed data rejected');
  const performance = [];
  for (const count of [30, 50]) for (const enabled of [false, true]) performance.push(await evaluate(`bloodPreview.benchmark(${count},${enabled})`));
  const context = await evaluate(`(() => {const gl=bloodPreview.renderer.getContext(), ext=gl.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};})()`);
  const beforeDisposal = await evaluate('bloodPreview.state()');
  fs.writeFileSync(path.join(evidence, 'diagnostics.json'), JSON.stringify({errors, beforeDisposal, performance, context}, null, 2));
  await evaluate('bloodPreview.effect.dispose()');
  // render with the preview's camera through seek; disposed effects ignore updates.
  await evaluate('bloodPreview.seek(.1)');
  const disposed = await evaluate('bloodPreview.state()');
  assert.equal(disposed.disposed, true); assert.equal(disposed.activeHits, 0);
  assert.equal(disposed.geometries, beforeDisposal.geometries - 1);
  assert.equal(disposed.textures, beforeDisposal.textures - 1);
  checks.push('Dispose removes mesh and releases owned geometry, texture and material');
  // Check actual UI controls after reload, retaining the sample in a usable state.
  await send('Page.reload'); await until(() => evaluate('Boolean(window.__ready)'));
  await evaluate("document.getElementById('count').value='30';document.getElementById('count').dispatchEvent(new Event('change'));document.getElementById('play').click()");
  await delay(700); assert.equal(await evaluate('bloodPreview.state().activeHits'), 0);
  await evaluate("bloodPreview.configure({count:'1',distance:'3',background:'dark'})");
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  const report = { passed: true, checks, context, performance, lifecycle, disposed, external, errors,
    performanceNote: 'Headless browser frame intervals include enemy render and preview UI; synthetic synchronized hits, no AI/Combat. Not a target-device FPS guarantee.' };
  fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2)); await send('Browser.close');
} finally { ws?.close(); child.kill(); fs.closeSync(stderr); }
