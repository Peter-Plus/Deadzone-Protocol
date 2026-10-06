import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const evidence = path.join(root, '.qa/effects'); fs.mkdirSync(evidence, { recursive: true });
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
  const altarIndex=JSON.parse(fs.readFileSync(path.join(root,'.qa/effects-preview-data.json'),'utf8')).effects.findIndex(e=>e.package.effect.id==='vfx_altar_feedback');
  await send('Runtime.enable'); await send('Network.enable'); await send('Page.enable');
  await send('Page.navigate',{url:pathToFileURL(path.join(root,'previewer/effects.html')).href});
  await until(()=>evaluate('Boolean(window.__ready)'));
  assert.equal(await evaluate('vfxPreview.state().asset'),'vfx_hit_blood_low');
  await evaluate("vfxPreview.configure({distance:'3',time:.1})");await shot('01-blood-near');
  await evaluate("vfxPreview.configure({count:'50',distance:'20',time:.1})");
  assert.equal(await evaluate('vfxPreview.state().instances.reduce((n,i)=>n+i.activeBursts,0)'),50);await shot('02-blood-50');
  await evaluate("vfxPreview.configure({allowed:'no',time:.1})");assert.equal(await evaluate('vfxPreview.state().instances.reduce((n,i)=>n+i.activeBursts,0)'),0);
  await evaluate("vfxPreview.configure({allowed:'yes',time:.46})");assert.equal(await evaluate('vfxPreview.state().instances.reduce((n,i)=>n+i.activeBursts,0)'),0);
  checks.push('Blood: 50 instances, explicit exclusion, expiry');
  await evaluate("vfxPreview.configure({asset:1,count:'2',state:'sealed',variant:'fire',distance:'8',time:.3})".replace("asset:1","asset:"+altarIndex));await shot('03-altar-fire');
  await evaluate("vfxPreview.configure({state:'sealed',variant:'poison',time:.3,background:'light'})");await shot('04-altar-poison');
  await evaluate("vfxPreview.configure({state:'enchanting',variant:'fire',time:1.2,background:'dark'})");await shot('05-altar-peak');
  assert.equal(await evaluate('vfxPreview.sample()[0].state.state'),'enchanting');
  await evaluate('vfxPreview.seek(2.4)');assert.equal(await evaluate('vfxPreview.sample()[0].state.state'),'exhausted');await shot('06-altar-end');
  await evaluate("vfxPreview.configure({state:'available',time:0})");
  await evaluate("vfxPreview.configure({isolate:true,state:'sealed',variant:'poison',time:.2})");
  const independent=await evaluate('vfxPreview.sample()');assert.equal(independent[0].state.state,'sealed');assert.equal(independent[1].state.state,'available');assert.notEqual(independent[0].color,independent[1].color);
  checks.push('Altar: fire/poison, material tracks, two independent instances, animation peak and end-state seek');
  await evaluate("vfxPreview.configure({isolate:false,state:'unlocking',time:.65})");assert.equal(await evaluate('vfxPreview.sample()[0].state.state'),'unlocked');
  const stable=[];
  for(let i=0;i<4;i++){await evaluate("vfxPreview.configure({asset:0,count:'1',time:.1})");await evaluate("vfxPreview.configure({asset:1,count:'2',time:.1})".replace("asset:1","asset:"+altarIndex));stable.push(await evaluate('vfxPreview.state()'));}
  assert.equal(stable[0].geometries,stable.at(-1).geometries);assert.equal(stable[0].textures,stable.at(-1).textures);
  checks.push('Repeated asset switching releases prior geometry and texture resources');
  // File API import exercises the same user-facing path without remote fetches.
  const packageText=fs.readFileSync(path.join(root,'assets/FSA(项目使用)/generated/effects/hit/vfx_hit_blood_low.vfx'),'utf8');
  await evaluate(`vfxPreview.importFiles([new File([${JSON.stringify(packageText)}],'imported.vfx')])`);
  assert.equal(await evaluate('vfxPreview.state().asset'),'vfx_hit_blood_low');
  assert.equal(await evaluate(`(()=>{try{vfxPreview.parseEffectPackage({schema:'forge-vfx.v99'});return false;}catch{return true;}})()`),true);
  checks.push('Single-file import and unsupported version rejection');
  const directoryFiles=[
    ['effects/world/interactables/vfx_altar_feedback.vfx','vfx_altar_feedback.vfx'],
    ['models/world/interactables/FSA_WORLD_EnchantAltar.glb','FSA_WORLD_EnchantAltar.glb'],
    ['animations/world/interactables/FSA_ANIM_EnchantAltar_Enchant.anim.glb','FSA_ANIM_EnchantAltar_Enchant.anim.glb']
  ].map(([relative,name])=>({name,bytes:fs.readFileSync(path.join(root,'assets/FSA(项目使用)/generated',relative)).toString('base64')}));
  await evaluate(`vfxPreview.importFiles(${JSON.stringify(directoryFiles)}.map(f=>new File([Uint8Array.from(atob(f.bytes),c=>c.charCodeAt(0))],f.name)))`);
  await evaluate("vfxPreview.configure({count:'2',state:'enchanting',variant:'poison',time:1.2})");
  assert.equal(await evaluate('vfxPreview.sample()[0].state.id'),'vfx_altar_feedback');
  assert.equal(await evaluate('vfxPreview.sample()[0].state.state'),'enchanting');
  checks.push('Directory import uses selected VFX/model/animation files and binds correctly');
  await evaluate("document.getElementById('defaults').click()");await until(()=>evaluate("vfxPreview.state().asset==='vfx_hit_blood_low'"));
  await evaluate("vfxPreview.configure({count:'1',distance:'3',time:.1})");
  await evaluate("document.getElementById('play').click()");await delay(650);assert.equal(await evaluate('vfxPreview.state().instances[0].activeBursts'),0);
  await evaluate("document.getElementById('clear').click()");
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  const final=await evaluate('vfxPreview.state()');
  fs.writeFileSync(path.join(evidence,'browser.json'),JSON.stringify({passed:true,checks,errors,external,independent,stable,final},null,2));
  console.log(JSON.stringify({passed:true,checks,errors,external},null,2));await send('Browser.close');
} catch(e) {
  fs.writeFileSync(path.join(evidence,'failure.json'),JSON.stringify({message:e.message,errors,external},null,2));throw e;
} finally { ws?.close();child.kill();fs.closeSync(stderr); }
