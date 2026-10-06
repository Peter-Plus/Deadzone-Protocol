import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createEffect, parseEffectPackage } from '../../tools/effects/runtime.js';
import '../runtime.js';
import builtins from '../../.qa/effects-preview-data.json';

const $ = id => document.getElementById(id), R = globalThis.ForgeRuntime;
const renderer = new T.WebGLRenderer({ canvas: $('canvas'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
const scene = new T.Scene(), camera = new T.PerspectiveCamera(45,1,.03,200);
const controls = new OrbitControls(camera,renderer.domElement); controls.target.set(0,1,0); controls.enableDamping = true;
scene.add(new T.HemisphereLight(0xe4f2ff,0x675d50,2.2)); const sun = new T.DirectionalLight(0xffedcd,3); sun.position.set(4,6,5);scene.add(sun);
const floor = new T.Mesh(new T.PlaneGeometry(150,150),new T.MeshStandardMaterial({color:'#39474f',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;scene.add(floor);
const grid = new T.GridHelper(100,100,0x61717c,0x43515d);scene.add(grid);
let catalog = builtins.effects, resources = builtins.resources, instances = [], definition, selected, run = false, clock = 0, generation = 0, disposedCount = 0;
const loader = new GLTFLoader();
const labels = { impact:'命中',available:'可用',sealed:'封印',unlocking:'解锁消退',unlocked:'解锁可用',enchanting:'附魔过程',exhausted:'耗尽',fire:'火',poison:'毒' };
const option = (value,label) => { const node = document.createElement('option');node.value=value;node.textContent=label;return node; };
function error(e) { $('error').style.display = e ? 'block' : 'none'; $('error').textContent = e?.message ?? ''; }
function guarded(fn) { return async () => { try { error(null); await fn(); } catch(e) { error(e); } }; }
function dispose(items) {
  const geometries=new Set(),materials=new Set(),textures=new Set();
  for(const item of items){item.fx.dispose();item.mixer?.stopAllAction();item.mixer?.uncacheRoot(item.model);item.model?.traverse(n=>{if(n.geometry)geometries.add(n.geometry);for(const m of (Array.isArray(n.material)?n.material:n.material?[n.material]:[])){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});item.model?.removeFromParent();disposedCount++;}
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
}
async function resource(id) {
  const r=resources[id]; if(!r)throw Error(`缺少参考资源 ${id}。请选择包含它的 generated 目录。`);
  const bytes = r instanceof File ? await r.arrayBuffer() : Uint8Array.from(atob(r),c=>c.charCodeAt(0)).buffer;
  return loader.parseAsync(bytes,'');
}
function resetView() { const n=+$('count').value,d=+$('distance').value;controls.target.set(0,1,n>2?-2:0);camera.position.set(definition?.binding?d*.35:0,definition?.binding?d*.35+1:1.6,d);controls.update(); }
function background() { const light=$('background').value==='light';scene.background=new T.Color(light?'#d3d5d0':'#202c36');floor.material.color.set(light?'#b8b8af':'#39474f'); }
function syncModel(item) {
  if(!item.model)return;
  item.model.visible=$('reference').checked || Boolean(definition.binding);
  if(!item.mixer)return;
  const s=item.fx.stats(),mode=definition.binding?.animationStates?.[s.state] ?? 'rest';
  item.mixer.stopAllAction();R.restoreRestPose(item.model);
  if(mode!=='rest'){item.action.reset().play();item.mixer.setTime(mode==='end'?item.duration:Math.min(s.time,item.duration));item.action.paused=true;}
}
function selectedItems() {return $('isolate').checked?instances.slice(0,1):instances;}
function trigger() {
  const state=$('state').value,variant=$('variant').value;clock=0;
  for(const item of selectedItems()) {
    item.fx.setState(state,variant);item.fx.show();
    if(!definition.binding&&definition.layers.some(l=>l.kind==='burst'))item.fx.emit({position:item.point,normal:[0,0,1],seed:1927+item.index*73,allowed:$('allowed').value==='yes'});
    syncModel(item);
  }
}
function seek(seconds) {run=false;trigger();clock=seconds;for(const item of selectedItems()){item.fx.seek(seconds);syncModel(item);}draw();}
function draw() {
  renderer.render(scene,camera);$('clock').textContent=clock.toFixed(2)+' s';
  if(definition){const duration=definition.states[$('state').value].duration;$('timeline').max=duration;$('timeline').value=Math.min(clock,duration);}
  $('play').textContent=run?'暂停':'播放';
  $('stats').textContent=`实例 ${instances.length} · 活动突发 ${instances.reduce((n,i)=>n+i.fx.stats().activeBursts,0)}\n绘制 ${renderer.info.render.calls} · 三角形 ${renderer.info.render.triangles}\n几何 ${renderer.info.memory.geometries} · 贴图 ${renderer.info.memory.textures}`;
}
async function load(index=0) {
  const ticket=++generation;run=false;const pending=[];
  try {
    const record=catalog[index];if(!record)throw Error('目录中没有 .vfx 文件');
    const doc=typeof record.package==='string'?JSON.parse(record.package):record.package,d=parseEffectPackage(doc);
    const n=+$('count').value;
    const referenceId=d.binding?.model ?? record.previewModel;
    const first=referenceId?await resource(referenceId):null;
    const animation=d.binding?.animation?await resource(d.binding.animation):null;
    const idle=!d.binding&&record.previewAnimation?await resource(record.previewAnimation):null;
    for(let i=0;i<n;i++) {
      const model=first?first.scene.clone(true):null;
      let mixer,action;
      if(model&&animation){const clip=R.prepareClip(animation.animations[0],model,R.metadata(animation.scene),T);mixer=new T.AnimationMixer(model);action=mixer.clipAction(clip).setLoop(T.LoopOnce,1);action.clampWhenFinished=true;}
      if(model&&idle){const mix=new T.AnimationMixer(model);mix.clipAction(idle.animations[0]).play();mix.setTime(.3);}
      const columns=n<=2?n:10,spacing=d.binding?2.2:1.1;
      const x=(i%columns-(columns-1)/2)*spacing,z=-Math.floor(i/columns)*spacing*1.5;
      if(model)model.position.set(x,0,z);
      const fx=await createEffect(doc,{scene,model});
      if(!d.binding&&!d.layers.some(l=>l.kind==='burst'))fx.root.position.set(x,d.layers.every(l=>l.kind==='cloud')?1.25:0,z+.2);
      if(model)scene.add(model);
      pending.push({fx,model,mixer,action,duration:animation?.animations[0].duration,index:i,point:[x,1.25,z+.2]});
    }
    if(ticket!==generation){dispose(pending);return;}
    dispose(instances);instances=pending;definition=d;selected=index;
    $('asset').value=index;$('state').replaceChildren(...Object.keys(d.states).map(s=>option(s,labels[s]??s)));$('state').value=d.initialState;
    $('variant').replaceChildren(...Object.keys(d.variants).map(v=>option(v,labels[v]??v)));$('variant').disabled=!Object.keys(d.variants).length;
    $('allowed').disabled=Boolean(d.binding);$('reference').disabled=Boolean(d.binding);
    $('title').textContent=d.name;$('binding').textContent=d.binding?`绑定 ${d.binding.model} / ${d.binding.attachment}`:'世界空间 · 独立突发粒子';
    error(null);resetView();seek(d.binding?0:.1);
  }catch(e){dispose(pending);if(ticket===generation)error(e);throw e;}
}
function populate(){ $('asset').replaceChildren(...catalog.map((r,i)=>option(i,parseEffectPackage(r.package).name))); }
async function importFiles(files) {
  const incoming=[], refs={...builtins.resources};
  for(const file of files){if(file.name.endsWith('.vfx')){const text=await file.text();parseEffectPackage(text);incoming.push({package:text});}else if(file.name.endsWith('.glb'))refs[file.name.replace(/\.anim\.glb$|\.glb$/,'')]=file;}
  if(!incoming.length)throw Error('未找到 .vfx 文件，请选择 generated 或特效文件。');
  catalog=incoming;resources=refs;populate();await load(0);
}
$('asset').onchange=guarded(()=>load(+$('asset').value));$('count').onchange=guarded(()=>load(selected));
$('state').onchange=guarded(()=>seek(0));$('variant').onchange=guarded(()=>seek(Math.min(clock,definition.states[$('state').value].duration)));
$('allowed').onchange=guarded(()=>seek(.1));$('background').onchange=background;$('distance').onchange=resetView;$('reset').onclick=resetView;
$('reference').onchange=()=>instances.forEach(syncModel);
$('timeline').oninput=guarded(()=>seek(+$('timeline').value));
$('play').onclick=()=>{if(run)run=false;else {const duration=definition.states[$('state').value].duration;if(clock>=duration || instances.every(i=>!i.fx.root.visible))trigger();run=true;}};
$('clear').onclick=()=>{run=false;$('repeat').checked=false;instances.forEach(i=>i.fx.clear());draw();};
$('open').onclick=()=>$('fileInput').click();$('folder').onclick=()=>$('folderInput').click();
$('fileInput').onchange=guarded(()=>importFiles([...$('fileInput').files]));$('folderInput').onchange=guarded(()=>importFiles([...$('folderInput').files]));
$('defaults').onclick=guarded(async()=>{catalog=builtins.effects;resources=builtins.resources;populate();await load(0);});
function resize(){const {width,height}=$('viewport').getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe($('viewport'));background();resize();
let last=performance.now(),repeatWait=0;
function frame(now){const dt=(now-last)/1000;last=now;controls.update();if(run&&definition){clock+=dt;selectedItems().forEach(i=>{i.fx.update(dt);syncModel(i);});const state=definition.states[$('state').value];if(!state.loop&&clock>=state.duration){run=false;repeatWait=0;}}else if($('repeat').checked&&definition){repeatWait+=dt;if(repeatWait>.6){trigger();run=true;repeatWait=0;}}draw();requestAnimationFrame(frame);}
window.vfxPreview={
  async choose(index){await load(index);},
  async configure(options){if(options.count!==undefined)$('count').value=options.count;if(options.count!==undefined||options.asset!==undefined)await load(options.asset??selected);for(const [k,v]of Object.entries(options))if(!['asset','count','time'].includes(k)) {if($(k).type==='checkbox')$(k).checked=v;else $(k).value=v;}background();resetView();seek(options.time??.1);},
  seek,importFiles,parseEffectPackage,createEffect,scene,renderer,
  state:()=>({asset:definition?.id,instances:instances.map(i=>i.fx.stats()),errors:$('error').textContent,drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,disposedCount}),
  sample:()=>instances.map(i=>({state:i.fx.stats(),position:i.model?.getObjectByName('Crystal')?.position.toArray(),color:i.model?.getObjectByName('CrystalUpper')?.material.emissive.getHexString(),layers:i.fx.root.children.filter(c=>c.isInstancedMesh).map(c=>({id:c.name,visible:c.visible,opacity:c.material.opacity,matrix:Array.from(c.instanceMatrix.array.slice(0,16))}))}))
};
populate();load(0).then(()=>{window.__ready=true;requestAnimationFrame(frame);}).catch(error);
