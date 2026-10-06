import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createEffect} from '../../tools/effects/runtime.js';
import data from '../../.qa/arena-entry-data.json';
const $=id=>document.getElementById(id);
async function main(){
const renderer=new T.WebGLRenderer({canvas:$('view'),antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
const scene=new T.Scene();scene.background=new T.Color('#17151e');
const camera=new T.PerspectiveCamera(45,innerWidth/innerHeight,.05,400),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
scene.add(new T.HemisphereLight('#dad9ed','#433344',2.2));const sun=new T.DirectionalLight('#fff0df',3);sun.position.set(-8,14,9);scene.add(sun);const red=new T.PointLight('#b83555',25,25);red.position.set(0,3,0);scene.add(red);
const ground=new T.Mesh(new T.PlaneGeometry(150,150),new T.MeshStandardMaterial({color:'#51454a',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.16;scene.add(ground);
const grid=new T.GridHelper(80,40,'#735363','#5b4852');grid.position.y=-.155;grid.material.transparent=true;grid.material.opacity=.2;scene.add(grid);
const loader=new GLTFLoader();const parse=async str=>{const b=Uint8Array.from(atob(str),c=>c.charCodeAt(0));return loader.parseAsync(b.buffer,'');};
const stones=await Promise.all(data.stones.map(async x=>(await parse(x)).scene));stones.forEach(x=>scene.add(x));
const templates=await Promise.all(data.spikes.map(async x=>(await parse(x)).scene));
const gallery=templates.map(x=>x.clone(true));gallery.forEach(x=>scene.add(x));
const spikes=Array.from({length:6},()=>new T.Group());spikes.forEach(x=>scene.add(x));
const boss=(await parse(data.boss)).scene;scene.add(boss);const idle=(await parse(data.idle)).animations[0],mixer=new T.AnimationMixer(boss);mixer.clipAction(idle).play();
const fx=await Promise.all(data.effects.map(x=>createEffect(x,{scene})));
let mode='combo',time=0,playing=true,radius=12,count=5,layoutSeed=17,light=false,layout=[];
const smooth=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x);};
function layoutBuild(){let s=layoutSeed;const rand=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};layout=[];for(let i=0;i<6;i++){spikes[i].clear();const variant=Math.floor(rand()*6),angle=(i/count)*Math.PI*2+.25+(rand()-.5)*.18,dist=radius*(.48+rand()*.16);spikes[i].add(templates[variant].clone(true));spikes[i].rotation.y=rand()*Math.PI*2;spikes[i].position.set(Math.cos(angle)*dist,-5,Math.sin(angle)*dist);layout.push({variant,x:spikes[i].position.x,z:spikes[i].position.z});}}
function view(inside=false){if(inside){camera.position.set(0,1.8,radius*.8);controls.target.set(0,1.7,0);}else{const r=['stones','shadow','nightmare'].includes(mode)?4.8:mode==='spikes'?10:radius*1.85;camera.position.set(r*.85,r*.68,r);controls.target.set(mode==='stones'?0:0,mode==='spikes'?.8:1,0);}controls.update();}
function effect(i,state,t,scale,position=[0,0,0]){fx[i].root.scale.fromArray(scale);fx[i].root.position.fromArray(position);fx[i].setState(state);fx[i].seek(Math.max(0,t));}
function sample(t){time=t;fx.forEach(x=>x.clear());stones.forEach(x=>x.visible=false);gallery.forEach(x=>x.visible=false);spikes.forEach(x=>x.visible=false);boss.visible=false;
if(mode==='stones'){stones.forEach((x,i)=>{x.visible=true;x.position.set(i?1.45:-1.45,1.7+Math.sin(t*1.2+i)*.09,0);x.rotation.y=t*.16;});}
if(mode==='spikes'){gallery.forEach((x,i)=>{x.visible=true;x.position.set((i%3-1)*3.8,0,(Math.floor(i/3)-.5)*4);});}
if(mode==='combo'){
 stones[1].visible=t<1;stones[1].position.set(0,1.8+Math.sin(t*1.5)*.08,0);stones[1].rotation.y=t*.25;
 if(t>=1)effect(1,'explode',t-1,[1,1,1],[0,1.8,0]);
 if(t>=1.15)effect(3,t>=7?'dissolve':'appear',t>=7?t-7:t-1.15,[radius,5,radius]);
 if(t>=1.55)effect(2,'rise',t-1.55,[radius,5,radius]);
 spikes.forEach((x,i)=>{x.visible=i<count&&t>=1.55;x.position.y=-4.3*(1-smooth((t-1.55-i*.09)/1.35));});
 boss.visible=t>=2.3;boss.position.set(0,-4.1*(1-smooth((t-2.3)/1.3)),0);mixer.setTime(t);
}else if(mode==='shadow'||mode==='nightmare'){
const i=mode==='shadow'?0:1;stones[i].visible=t<1;stones[i].position.set(0,1.8,0);if(t>=1)effect(i,'explode',t-1,[1,1,1],[0,1.8,0]);
}else if(mode==='rise')effect(2,'rise',t,[radius,5,radius]);
else if(mode==='boundary')effect(3,t>=6?'dissolve':'appear',t>=6?t-6:t,[radius,5,radius]);
$('time').value=t;$('timeText').textContent=t.toFixed(2)+' s';
$('status').textContent=mode==='combo'?(t<1?'01 / 噩梦之石 · 等待交互':t<1.55?'02 / 石头爆裂 · 结界生成':t<3.65?'03 / 暗红黑雾 · 尖刺升起 · 混沌显现':t<7?'04 / 场地成形 · 混沌在场':'05 / 结界解除演示（仅预览）'):'独立资产审阅 · '+$('mode').selectedOptions[0].textContent;
}
function configure(m,t=0){mode=m;$('mode').value=m;view();sample(t);}
layoutBuild();view();
$('mode').onchange=()=>configure($('mode').value);
$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'暂停':'播放';};
$('replay').onclick=()=>{sample(0);playing=true;$('play').textContent='暂停';};
$('time').oninput=()=>{playing=false;$('play').textContent='播放';sample(+$('time').value);};
for(const id of ['count','radius'])$(id).oninput=()=>{count=+$('count').value;radius=+$('radius').value;$('countText').textContent=count;$('radiusText').textContent=radius+' m';layoutBuild();sample(time);};
$('random').onclick=()=>{layoutSeed++;layoutBuild();sample(time);};$('outside').onclick=()=>view();$('inside').onclick=()=>view(true);
$('light').onclick=()=>{light=!light;scene.background.set(light?'#d9d2d5':'#17151e');ground.material.color.set(light?'#ada19f':'#51454a');$('light').textContent=light?'深色背景':'浅色背景';};
onresize=()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();};
window.arenaPreview={configure,seek:sample,pause:()=>{playing=false;},state:()=>({mode,time,count,radius,layout,fx:fx.map(x=>x.stats()),spikes:spikes.map(x=>({visible:x.visible,y:x.position.y})),bossVisible:boss.visible,memory:renderer.info.memory}),inside:()=>view(true)};
window.__ready=true;let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;if(playing){time+=dt;if(time>9)time=0;}sample(time);controls.update();renderer.render(scene,camera);requestAnimationFrame(frame);}requestAnimationFrame(frame);
}
main().catch(e=>{$('error').textContent=e.stack;console.error(e);});
