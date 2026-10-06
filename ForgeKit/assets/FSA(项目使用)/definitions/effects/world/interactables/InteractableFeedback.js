(function(global){
 'use strict';
 // Presentation only: caller supplies confirmed gameplay state and elapsed visual time.
 function create(model,clip,meta,config,T,R){
  R.captureRestPose(model);
  const ownedMaterials=[];model.traverse(n=>{if(n.material){n.material=Array.isArray(n.material)?n.material.map(m=>m.clone()):n.material.clone();ownedMaterials.push(...(Array.isArray(n.material)?n.material:[n.material]));}});
  const mixer=new T.AnimationMixer(model),prepared=R.prepareClip(clip,model,meta,T);
  const action=mixer.clipAction(prepared).setLoop(T.LoopOnce,1);action.clampWhenFinished=true;
  const altar=meta.targetModel.endsWith('EnchantAltar'),fx=new T.Group();fx.name='AltarFX';
  const asset=model.getObjectByName('Asset')??model;asset.add(fx);
  if(altar)for(let i=0;i<12;i++){
   const fire=new T.Mesh(new T.ConeGeometry(.045,.27,5),new T.MeshBasicMaterial({color:config.fire.color,transparent:true,opacity:.8,depthWrite:false}));fire.userData.kind='fire';fire.userData.index=i;fx.add(fire);
   const poison=new T.Mesh(new T.SphereGeometry(.048,10,8),new T.MeshBasicMaterial({color:config.poison.color,transparent:true,opacity:.7,depthWrite:false}));poison.userData.kind='poison';poison.userData.index=i;fx.add(poison);
  }
  let state=altar?'available':'closed',element='fire',time=0,playing=false,unlock=null;
  const glow=[];model.traverse(n=>{if(n.isMesh&&(n.name.startsWith('Crystal')||n.name.startsWith('Etching'))){n.userData.feedbackColor=n.material.color.clone();glow.push(n);}});
  function effects(t){
   const locked=state==='sealed_fire'||state==='sealed_poison',enchant=state==='enchanting';
   const kind=state==='sealed_poison'?'poison':locked?'fire':element;
   let strength=locked?1:enchant?Math.sin(Math.PI*Math.min(t/clip.duration,1))**2:0;
   if(unlock!==null)strength=Math.max(0,1-t/config.unlockDuration);
   fx.visible=strength>0;
   for(const n of fx.children){n.visible=n.userData.kind===kind;const i=n.userData.index,a=i*Math.PI/6+t*(kind==='fire'?1.4:-.8),r=enchant?.54*(1-.65*Math.sin(Math.PI*Math.min(t/clip.duration,1))):.59;n.position.set(Math.sin(a)*r,1.14+(kind==='fire'?.035*Math.sin(t*8+i):.13*Math.sin(t*2+i)),Math.cos(a)*r);n.scale.setScalar((kind==='fire'?.65+.35*Math.sin(t*9+i)**2:1)*Math.max(.01,strength));n.material.opacity=.8*strength;}
   for(const n of glow){n.material.color.copy(n.userData.feedbackColor);if(state==='exhausted')n.material.color.multiplyScalar(.25);n.material.emissive.set(state==='exhausted'?'#030506':locked||enchant?config[kind].color:'#34525e');n.material.emissiveIntensity=state==='exhausted'?.1:enchant?.5+strength*2:.65;}
  }
  function setState(next,chosen=element){
   const allowed=altar?['available','unlocked','sealed_fire','sealed_poison','exhausted']:['closed','opened','empty'];if(!allowed.includes(next))throw new Error('Invalid facility state: '+next);
   mixer.stopAllAction();R.restoreRestPose(model);state=next;element=chosen;time=0;playing=false;unlock=null;
   if(next==='exhausted'||next==='opened'||next==='empty'){action.reset().play();mixer.update(clip.duration);action.paused=true;}
   effects(0);
  }
  function play(chosen='fire'){if(!['fire','poison'].includes(chosen))throw new Error('Unknown element');setState(altar?'available':'closed',chosen);state=altar?'enchanting':'opening';playing=true;action.reset().play();}
  function seek(t){if(t>=clip.duration){setState(altar?'exhausted':'opened');return;}time=Math.max(0,Math.min(t,clip.duration));action.reset().play();mixer.setTime(time);action.paused=true;effects(time);}
  function update(dt){if(!Number.isFinite(dt)||dt<0)throw new Error('Invalid dt');time+=dt;if(unlock!==null){effects(time);if(time>=config.unlockDuration)setState('unlocked');return;}if(playing){action.paused=false;mixer.update(dt);if(time>=clip.duration){setState(altar?'exhausted':'opened');return;}}effects(time);}
  function unlockSeal(){if(!['sealed_fire','sealed_poison'].includes(state))throw new Error('Only sealed states can fade');unlock=state;time=0;}
  function stopAndRestore(confirmedState){setState(confirmedState);}
  function dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);fx.traverse(n=>{n.geometry?.dispose();n.material?.dispose();});fx.removeFromParent();ownedMaterials.forEach(m=>m.dispose());}
  setState(state);return {model,play,seek,update,setState,unlockSeal,stopAndRestore,dispose,get state(){return state;}};
 }
 global.ForgeInteractables={create};
})(globalThis);
