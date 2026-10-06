import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import '../../previewer/runtime.js';
import '../../assets/FSA(项目使用)/definitions/effects/world/interactables/InteractableFeedback.js';
import data from '../../.qa/interactables-data.json';
import config from '../../assets/FSA(项目使用)/definitions/effects/world/interactables/AltarFeedback.json';
const $=id=>document.getElementById(id),R=globalThis.ForgeRuntime,F=globalThis.ForgeInteractables;
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));$('view').append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#202c36');scene.add(new T.HemisphereLight(0xddefff,0x675d50,2.2));const sun=new T.DirectionalLight(0xffedcd,3);sun.position.set(4,6,5);scene.add(sun);
const camera=new T.PerspectiveCamera(36,1,.01,100),group=new T.Group();scene.add(group);
const floor=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshStandardMaterial({color:'#39474f',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.002;scene.add(floor);scene.add(new T.GridHelper(20,20,0x677785,0x43515d));
const loader=new GLTFLoader(),controllers=[];const parse=s=>loader.parseAsync(Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer,'');
for(const d of data){const a=await parse(d.animation),m=await parse(d.model),second=await parse(d.model);controllers.push([F.create(m.scene,a.animations[0],R.metadata(a.scene),config,T,R),F.create(second.scene,a.animations[0],R.metadata(a.scene),config,T,R)]);}
const ruler=new T.Group();for(let i=0;i<19;i++){const mark=new T.Mesh(new T.BoxGeometry(i%5===0?.22:.12,.008,.015),new T.MeshBasicMaterial({color:'#bdc9cc'}));mark.position.y=i*.1;ruler.add(mark);}const post=new T.Mesh(new T.BoxGeometry(.018,1.8,.018),new T.MeshBasicMaterial({color:'#bdc9cc'}));post.position.y=.9;ruler.add(post);
let index=3,run=false,last=performance.now();
function render(){const w=innerWidth-40,h=Math.max(400,innerHeight-220);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera);}
function view(v){group.rotation.y=0;const multi=index===3,dist=multi?11:6,target=new T.Vector3(0,.8,0);if(v==='front')camera.position.set(0,.85,dist);else if(v==='side')camera.position.set(dist,.85,0);else if(v==='back')camera.position.set(0,.85,-dist);else camera.position.set(multi?4:3,multi?4:2.8,dist);camera.lookAt(target);render();}
function choose(i){run=false;index=i;$('model').value=i;$('state').disabled=i===3;$('unlock').disabled=i!==1;$('time').value=0;$('clock').textContent='';group.clear();const selected=i===3?controllers.map(c=>c[0]):controllers[i];selected.forEach((c,j)=>{c.setState(c.model.getObjectByName('Crystal')?'available':'closed');c.model.position.set(i===3?(j-1)*2.5:(j-.5)*2.5,0,0);group.add(c.model);});ruler.position.set(i===3?-4:-2.4,0,0);group.add(ruler);$('state').innerHTML=(i===1?['available','sealed_fire','sealed_poison','unlocked','exhausted']:['closed','opened','empty']).map(s=>'<option>'+s+'</option>').join('');$('status').textContent=i===3?'左：空投箱 / 中：附魔台 / 右：大型神秘宝箱':'左侧播放与切换状态，右侧保持默认状态用于实例隔离比较';view('persp');}
function selected(){return index===3?controllers.map(c=>c[0]):[controllers[index][0]];}
function play(){selected().forEach(c=>c.play($('element').value));run=true;}
function seek(u){run=false;selected().forEach(c=>{c.play($('element').value);c.seek(u*data[controllers.findIndex(x=>x.includes(c))].duration);});$('time').value=u;$('clock').textContent=Math.round(u*100)+'%';render();}
$('model').onchange=()=>choose(+$('model').value);$('play').onclick=play;$('state').onchange=()=>{run=false;selected().forEach(c=>c.setState($('state').value));render();};$('unlock').onclick=()=>{if(index!==1||!['sealed_fire','sealed_poison'].includes(controllers[1][0].state))return;controllers[1][0].unlockSeal();run=true;};$('time').oninput=()=>seek(+$('time').value);for(const v of ['front','side','back','persp'])$(v).onclick=()=>view(v);
let drag=false,px=0;renderer.domElement.onpointerdown=e=>{drag=true;px=e.clientX;renderer.domElement.setPointerCapture(e.pointerId);};renderer.domElement.onpointerup=()=>drag=false;renderer.domElement.onpointermove=e=>{if(drag){group.rotation.y+=(e.clientX-px)*.008;px=e.clientX;render();}};
function tick(now){const dt=Math.min((now-last)/1000,.05);last=now;if(run)selected().forEach(c=>c.update(dt));render();requestAnimationFrame(tick);}choose(3);requestAnimationFrame(tick);addEventListener('resize',render);
window.interactablesQA={choose,view,seek,play,state(s){run=false;selected().forEach(c=>c.setState(s));render();},element(e){$('element').value=e;},count:controllers.length};
