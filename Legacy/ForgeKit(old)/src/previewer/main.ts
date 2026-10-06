import './ui/style.css';
import { AssetBrowser } from './AssetBrowser.js';
import { PreviewScene } from './PreviewScene.js';
import { loadModel, disposeObject } from './ModelLoader.js';
import { loadAnimation } from './AnimationLoader.js';
import { bindClip } from '../rig/RigBinding.js';
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const browser = new AssetBrowser(el('models'), el('animations'));
let scene: PreviewScene;
const message = (text = '') => { el('message').textContent = text; el('message').hidden = !text; };
try { scene = new PreviewScene(el('viewport')); } catch (error) { message(`WebGL 初始化失败：${String(error)}`); throw error; }
let modelToken = 0, animationToken = 0, modelMetadata: Record<string, unknown> = {}, animationMetadata: Record<string, unknown> = {};
const info = () => {
  el('metadata').textContent = `${modelMetadata.assetId ?? '—'}  |  ${modelMetadata.rigId ? `${modelMetadata.rigId}.v${modelMetadata.rigVersion}` : 'Static · No rig'}\nAnimation: ${animationMetadata.animationId ?? 'None'}${animationMetadata.duration ? ` · ${animationMetadata.duration}s` : ''}${modelMetadata.rigSignature ? `\nSignature: ${modelMetadata.rigSignature}` : ''}`;
};
async function selectAnimation(path: string) {
  const ticket = ++animationToken; scene.stop(); animationMetadata = {}; message(); info();
  if (!path) return;
  if (!scene.model) { message('请先选择模型。'); return; }
  try {
    const asset = await loadAnimation(path); if (ticket !== animationToken) { disposeObject(asset.root); return; }
    try {
      const clip = bindClip(asset.clip, asset.root, scene.model!, modelMetadata, asset.metadata);
      scene.play(clip, asset.metadata.loop === true || el<HTMLInputElement>('loop').checked); animationMetadata = asset.metadata; info(); el('activity').textContent = '动画已加载';
    } finally { disposeObject(asset.root); }
  } catch (error) { if (ticket === animationToken) message(error instanceof Error ? error.message : String(error)); }
}
async function selectModel(path: string) {
  const ticket = ++modelToken; ++animationToken; scene.stop(); animationMetadata = {}; message();
  if (!path) { scene.setModel(); modelMetadata = {}; info(); el('current-model').textContent = '选择一个模型'; return; }
  el('activity').textContent = '加载模型…';
  try {
    const asset = await loadModel(path); if (ticket !== modelToken) { disposeObject(asset.root); return; }
    scene.setModel(asset.root); modelMetadata = asset.metadata; info(); el('current-model').textContent = browser.models.find(m => m.path === path)?.name ?? path;
    el('activity').textContent = '模型已加载 · 点击画面控制相机'; await selectAnimation(browser.selectedAnimation);
  } catch (error) { if (ticket === modelToken) { scene.setModel(); modelMetadata = {}; info(); message(String(error)); } }
}
browser.onModel = path => void selectModel(path); browser.onAnimation = path => void selectAnimation(path);
el('frame').onclick = () => scene.controls.onFrame(); el('reset').onclick = () => scene.controls.reset();
el('loop').onchange = () => void selectAnimation(browser.selectedAnimation); el('replay').onclick = () => void selectAnimation(browser.selectedAnimation);
const labels: Record<string, string> = { grid: 'Grid', axes: 'Axes', skeleton: 'Skeleton', bounds: 'Bounds', sockets: 'Sockets', wireframe: 'Wireframe' };
for (const [key, label] of Object.entries(labels)) {
  const host = document.createElement('label'), input = document.createElement('input'); input.type = 'checkbox'; input.checked = scene.flags[key]; input.setAttribute('aria-label', label);
  input.onchange = () => { scene.flags[key] = input.checked; scene.applyFlags(); }; host.append(input, document.createTextNode(label)); el('toggles').append(host);
}
scene.onStats = (fps, triangles) => { el('fps').textContent = String(fps); el('triangles').textContent = Math.round(triangles).toLocaleString(); };
async function status() {
  const response = await fetch('/api/status'); if (!response.ok) throw new Error('Status API unavailable');
  const data = await response.json(); el('validation').classList.toggle('bad', !data.ok);
  el('validation').textContent = data.message + (data.issues?.length ? '\n' + data.issues.map((i: { code: string; path: string; message: string }) => `[${i.code}] ${i.path}: ${i.message}`).join('\n') : '');
}
async function refresh() { await browser.refresh(); await status(); }
el('refresh').onclick = () => void refresh().catch(e => message(String(e)));
if (import.meta.hot) import.meta.hot.on('forge:changed', async ({ path }: { path: string }) => {
  try {
    if (path === '.forge-status.json') { await status(); return; }
    await browser.refresh();
    const changedPath = '/compiled/' + path.split('/').map(encodeURIComponent).join('/');
    if (browser.selectedModel === changedPath) {
      if (!browser.models.some(m => m.path === changedPath)) browser.selectedModel = '';
      await selectModel(browser.selectedModel);
    } else if (browser.selectedAnimation === changedPath) {
      if (!browser.animations.some(a => a.path === changedPath)) browser.selectedAnimation = '';
      await selectAnimation(browser.selectedAnimation);
    }
    browser.render(); el('activity').textContent = `热更新 · ${path}`;
  } catch (error) { message(String(error)); }
});
refresh().then(async () => { if (browser.models.length) { browser.selectedModel = browser.models.find(m => m.name === 'simple_humanoid.glb')?.path ?? browser.models[0].path; browser.render(); await selectModel(browser.selectedModel); } }).catch(error => message(String(error)));
