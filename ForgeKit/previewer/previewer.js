/* Classic scripts deliberately support direct file:// opening without module CORS. */
(()=>{'use strict';
const $=id=>document.getElementById(id),status=(text,error=false)=>{$('status').textContent=text;$('status').className=error?'error':'';};
try{
const {THREE:T,GLTFLoader}=ForgeVendor,R=ForgeRuntime;
const scene=new T.Scene();scene.background=new T.Color('#182029');
const camera=new T.PerspectiveCamera(55,1,0.01,10000);camera.rotation.order='YXZ';
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;$('viewport').appendChild(renderer.domElement);
scene.add(new T.AmbientLight(0xffffff,1.8));const sun=new T.DirectionalLight(0xffffff,3);sun.position.set(4,8,6);scene.add(sun);
const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0x24303c,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-0.002;const grid=new T.GridHelper(40,40,0x66809b,0x34485b);scene.add(ground,grid);
const loader=new GLTFLoader();loader.manager.setURLModifier(url=>{if(!url.startsWith('data:')&&!url.startsWith('blob:'))throw new Error('仅接受内嵌资源的 GLB');return url;});
let model=null,modelMeta={},mixer=null,action=null,animationName='',modelGeneration=0,animationGeneration=0,helpers=[],radius=2;
let cameraSocket=null,freeView=null;
let models=[],animations=[],weapons=[],attachedWeapon=null,weaponGeneration=0;const keys=new Set();
function dispose(root){root.traverse(n=>{n.geometry?.dispose();for(const m of n.material?(Array.isArray(n.material)?n.material:[n.material]):[]){for(const v of Object.values(m))if(v?.isTexture){v.dispose();v.source?.data?.close?.();}m.dispose();}});}
function stop(){animationGeneration++;if(mixer){mixer.stopAllAction();mixer.uncacheRoot(model);}mixer=null;action=null;animationName='';if(model)R.restoreRestPose(model);details();}
function details(){$('details').textContent=`Model: ${modelMeta.assetId??'—'} · Rig: ${modelMeta.rigId?`${modelMeta.rigId}.v${modelMeta.rigVersion}`:'—'} · Animation: ${animationName||'None'} · Weapon: ${attachedWeapon?weapons[Number($('weapon').value)]?.name??'—':'None'}`;}
function clearHelpers(){for(const h of helpers){scene.remove(h);dispose(h);}helpers=[];}
function refreshHelpers(){clearHelpers();if(!model)return;if($('axes').checked){const h=new T.AxesHelper(radius);helpers.push(h);scene.add(h);}if($('bounds').checked){const h=new T.BoxHelper(model,0xf3c66a);helpers.push(h);scene.add(h);}if($('skeleton').checked&&modelMeta.rigId){model.traverse(n=>{if(n.userData.bone)n.isBone=true;});const h=new T.SkeletonHelper(model);h.material.depthTest=false;h.material.transparent=true;h.material.opacity=0.85;h.renderOrder=10;helpers.push(h);scene.add(h);}}
function updateSocketCamera(){if(!cameraSocket)return;cameraSocket.updateWorldMatrix(true,false);cameraSocket.getWorldPosition(camera.position);cameraSocket.getWorldQuaternion(camera.quaternion);}
function configureCameraSocket(){
 if(!$('useCameraSocket').checked){cameraSocket=null;if(freeView){camera.position.copy(freeView.position);camera.quaternion.copy(freeView.quaternion);camera.fov=freeView.fov;camera.near=freeView.near;camera.far=freeView.far;camera.updateProjectionMatrix();freeView=null;}return;}
 const point=model?.getObjectByName('Camera_FPS');
 if(!point?.userData.socket){$('useCameraSocket').checked=false;configureCameraSocket();status('当前模型没有 Camera_FPS 相机插槽，保持自由视角。');return;}
 if(!freeView)freeView={position:camera.position.clone(),quaternion:camera.quaternion.clone(),fov:camera.fov,near:camera.near,far:camera.far};
 cameraSocket=point;keys.clear();document.exitPointerLock?.();camera.fov=70;camera.near=.005;camera.far=1000;camera.updateProjectionMatrix();updateSocketCamera();
}
$('useCameraSocket').addEventListener('change',configureCameraSocket);
$('hideGround').addEventListener('change',()=>{ground.visible=grid.visible=!$('hideGround').checked;});
function frame(){if(cameraSocket){updateSocketCamera();return;}if(!model){camera.position.set(3,2.2,4);camera.lookAt(0,0.8,0);return;}model.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model),center=box.getCenter(new T.Vector3());radius=Math.max(box.getSize(new T.Vector3()).length()/2,0.1);const dist=radius/Math.sin(T.MathUtils.degToRad(camera.fov/2))/Math.min(camera.aspect,1);camera.position.copy(center).add(new T.Vector3(0.7,0.4,1).normalize().multiplyScalar(dist*1.2));camera.near=Math.max(radius/1000,0.001);camera.far=Math.max(dist*100,1000);camera.updateProjectionMatrix();camera.lookAt(center);}
async function parse(file){return loader.parseAsync(await file.arrayBuffer(),'');}
function clearWeapon(){weaponGeneration++;if(attachedWeapon){attachedWeapon.removeFromParent();dispose(attachedWeapon);attachedWeapon=null;}}
async function loadWeapon(){
 clearWeapon();const token=weaponGeneration,modelToken=modelGeneration;
 const socket=model?.getObjectByName('Weapon_R');$('weapon').disabled=!socket?.userData.socket;details();
 const file=weapons[Number($('weapon').value)];if(!socket?.userData.socket||$('weapon').value===''||!file){refreshHelpers();return;}
 let gltf;try{gltf=await parse(file);if(token!==weaponGeneration||modelToken!==modelGeneration){dispose(gltf.scene);return;}
 const meta=R.metadata(gltf.scene);if(meta.assetSchema!=='model.v1'||meta.assetType!=='static')throw new Error('预览武器必须是静态模型。');
 attachedWeapon=gltf.scene;attachedWeapon.userData.previewWeapon=true;socket.add(attachedWeapon);attachedWeapon.position.set(0,0,0);attachedWeapon.quaternion.identity();attachedWeapon.scale.setScalar(1);refreshHelpers();details();
 }catch(e){if(gltf&&!attachedWeapon)dispose(gltf.scene);if(token===weaponGeneration&&modelToken===modelGeneration)status('武器加载失败：'+e.message,true);}
}
$('weapon').addEventListener('change',loadWeapon);
async function loadModel(){clearWeapon();$('weapon').disabled=true;const token=++modelGeneration;cameraSocket=null;if(freeView){camera.fov=freeView.fov;camera.near=freeView.near;camera.far=freeView.far;camera.updateProjectionMatrix();freeView=null;}stop();clearHelpers();if(model){scene.remove(model);dispose(model);}model=null;modelMeta={};details();const file=models[Number($('model').value)];if(!file){status('请选择模型。');return;}status('正在加载模型…');
 try{const gltf=await parse(file);if(token!==modelGeneration){dispose(gltf.scene);return;}modelMeta=R.metadata(gltf.scene);if(modelMeta.assetSchema!=='model.v1'){dispose(gltf.scene);modelMeta={};throw new Error('文件不包含 ForgeKit Model Metadata');}model=gltf.scene;R.captureRestPose(model);scene.add(model);model.updateMatrixWorld(true);const floorY=Math.min(0,new T.Box3().setFromObject(model).min.y);ground.position.y=floorY-0.002;grid.position.y=floorY;frame();refreshHelpers();details();status('模型已加载。');await loadAnimation();if(token===modelGeneration){await loadWeapon();if(token===modelGeneration)configureCameraSocket();}}catch(e){if(token===modelGeneration)status(e.message,true);}}
async function loadAnimation(){stop();const token=animationGeneration,modelToken=modelGeneration;const file=animations[Number($('animation').value)];if($('animation').value===''||!model||!file){status(model?'Reference / Default Pose':'请选择模型。');return;}status('正在加载动画…');
 let gltf;try{gltf=await parse(file);if(token!==animationGeneration||modelToken!==modelGeneration)return;const meta=R.metadata(gltf.scene);if(meta.assetSchema!=='animation.v1'||!R.compatibility(modelMeta,meta))throw new Error('Rig mismatch：仅支持相同 Rig 或已验证的 humanoid.v1 动画 → humanoid.v2 模型');if(gltf.animations.length!==1)throw new Error('动画文件必须包含一个 AnimationClip');const clip=R.prepareClip(gltf.animations[0],model,meta,T);mixer=new T.AnimationMixer(model);action=mixer.clipAction(clip);action.setLoop(meta.loop?T.LoopRepeat:T.LoopOnce,meta.loop?Infinity:1);action.clampWhenFinished=!meta.loop;action.play();animationName=file.name+(R.compatibility(modelMeta,meta)==='humanoid-v1-to-v2'?' [v1 → v2]':'');details();status('正在播放动画。');}catch(e){if(token===animationGeneration&&modelToken===modelGeneration)status(e.message,true);}finally{if(gltf)dispose(gltf.scene);}}
function options(select,files,none){select.replaceChildren();if(none)select.add(new Option('None',''));files.forEach((f,i)=>select.add(new Option(f.webkitRelativePath.split('/').slice(2).join('/'),String(i))));if(!files.length&&!none)select.add(new Option('未发现模型',''));}
$('folder').addEventListener('change',()=>{models=[];animations=[];for(const f of $('folder').files){const kind=R.classify(f.webkitRelativePath);if(kind==='models')models.push(f);if(kind==='animations')animations.push(f);}for(const list of [models,animations])list.sort((a,b)=>a.webkitRelativePath.localeCompare(b.webkitRelativePath));weapons=models.filter(f=>/FSA_WPN_|weapon/i.test(f.webkitRelativePath));options($('weapon'),weapons,true);options($('model'),models,false);options($('animation'),animations,true);loadModel();});
$('model').addEventListener('change',loadModel);$('animation').addEventListener('change',loadAnimation);$('reload').addEventListener('click',loadModel);for(const id of ['axes','bounds','skeleton'])$(id).addEventListener('change',refreshHelpers);
let dragging=false;
renderer.domElement.addEventListener('mousedown',e=>{if(e.button===0){dragging=true;$('viewport').focus();}});document.addEventListener('mouseup',()=>dragging=false);
renderer.domElement.addEventListener('click',()=>{if(cameraSocket)return;renderer.domElement.requestPointerLock?.()?.catch(()=>status('鼠标锁定不可用；按住左键拖动转向。'));});
document.addEventListener('mousemove',e=>{if(cameraSocket)return;if(document.pointerLockElement!==renderer.domElement&&!dragging)return;camera.rotation.y-=e.movementX*0.002;camera.rotation.x=T.MathUtils.clamp(camera.rotation.x-e.movementY*0.002,-Math.PI/2+0.01,Math.PI/2-0.01);});
document.addEventListener('keydown',e=>{if(cameraSocket)return;if(/INPUT|SELECT|BUTTON/.test(e.target.tagName))return;const k=e.key.toLowerCase();if('wasdqefr'.includes(k)||k==='shift'){e.preventDefault();keys.add(k);}if(k==='f'||k==='r')frame();});document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();dragging=false;});document.addEventListener('pointerlockchange',()=>keys.clear());
const resize=()=>{const v=$('viewport');renderer.setSize(v.clientWidth,v.clientHeight);camera.aspect=v.clientWidth/v.clientHeight;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe($('viewport'));resize();frame();
let last=performance.now();renderer.setAnimationLoop(now=>{const dt=Math.min((now-last)/1000,0.05);last=now;const speed=Math.max(radius,0.5)*dt*(keys.has('shift')?5:1.5),forward=new T.Vector3();camera.getWorldDirection(forward);const right=forward.clone().cross(camera.up).normalize();camera.position.addScaledVector(forward,(Number(keys.has('w'))-Number(keys.has('s')))*speed).addScaledVector(right,(Number(keys.has('d'))-Number(keys.has('a')))*speed);camera.position.y+=(Number(keys.has('e'))-Number(keys.has('q')))*speed;mixer?.update(dt);updateSocketCamera();for(const h of helpers)if(h.isBoxHelper)h.update();renderer.render(scene,camera);});
}catch(e){status(`预览器启动失败：${e.message}`,true);}
})();
