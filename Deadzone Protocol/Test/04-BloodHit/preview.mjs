import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import enemyBytes from '../../Assets/models/characters/enemies/common/FSA_ENEMY_A001_ZombieA.glb';
import idleBytes from '../../Assets/animations/characters/shared/FSA_ANIM_Character_Idle.anim.glb';
import { createEffect } from '../../Assets/effects/ForgeVFX.mjs';
import effectText from '../../Assets/effects/hit/vfx_hit_blood_low.vfx';

async function main() {
  const $ = id => document.getElementById(id);
  const renderer = new THREE.WebGLRenderer({ canvas: $('view'), antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(48, 1, 0.05, 120);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x59616c, 2));
  const sun = new THREE.DirectionalLight(0xffead6, 2.3); sun.position.set(4, 8, 6); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), new THREE.MeshStandardMaterial({ color: 0x343f49, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; scene.add(ground);
  const grid = new THREE.GridHelper(100, 100, 0x53616b, 0x3e4c57); grid.position.y = 0.001; scene.add(grid);
  const model = (await new GLTFLoader().parseAsync(enemyBytes.buffer.slice(enemyBytes.byteOffset, enemyBytes.byteOffset + enemyBytes.byteLength), '')).scene;
  const idle = await new GLTFLoader().parseAsync(idleBytes.buffer.slice(idleBytes.byteOffset, idleBytes.byteOffset + idleBytes.byteLength), '');
  const mixer = new THREE.AnimationMixer(model); mixer.clipAction(idle.animations[0]).play(); mixer.setTime(0.3);
  const box = new THREE.Box3().setFromObject(model), center = box.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -box.min.y, -center.z);
  const group = new THREE.Group(); group.add(model);
  const enemies = [], points = [];
  for (let i = 0; i < 50; i++) { const item = group.clone(true); enemies.push(item); scene.add(item); }
  const hitHeight = (box.max.y - box.min.y) * 0.72, front = (box.max.z - box.min.z) / 2 + 0.02;
  const player = await createEffect(effectText, {scene});
  // Compatibility for the existing QA harness only; all rendering lives in ForgeVFX.
  const effect = {
    emit(event, seconds) { if(player.stats().disposed)return false;player.seek(seconds); return player.emit({position:event.point,normal:event.normal,seed:event.seed,allowed:event.bloodAllowed}); },
    update: seconds => {if(!player.stats().disposed)player.seek(seconds);}, clear: () => {if(!player.stats().disposed)player.setState('impact');}, dispose: () => player.dispose(),
    stats() { const s=player.stats();return {activeHits:s.activeBursts,capacityHits:s.capacity,allocatedParticles:640,visible:s.activeBursts>0,disposed:s.disposed}; }
  };
  let age = 0, playing = false, last = performance.now(), loopWait = 0;
  const samples = [];
  function arrange() {
    const count = +$('count').value, columns = count === 1 ? 1 : 10;
    for (let i = 0; i < 50; i++) {
      enemies[i].visible = i < count;
      enemies[i].position.set((i % columns - (columns - 1) / 2) * 1.05, 0, -Math.floor(i / columns) * 1.6);
      points[i] = [enemies[i].position.x, hitHeight, enemies[i].position.z + front];
    }
    camera.position.set(0, 1.55, +$('distance').value + front);
    camera.lookAt(0, 1.35, -0.5);
    // Reserve right-hand space for controls without obscuring the closest subject.
    camera.setViewOffset(innerWidth, innerHeight, 140, 0, innerWidth, innerHeight);
  }
  function trigger() {
    effect.clear(); age = 0; loopWait = 0;
    for (let i = 0; i < +$('count').value; i++) effect.emit({ bloodAllowed: $('target').value === 'enemy', point: points[i], normal: [0, 0, 1], seed: 1927 + i * 73 }, 0);
  }
  function play() { trigger(); playing = true; }
  function seek(time) { trigger(); playing = false; age = time; effect.update(age); $('scrub').value = age; draw(); }
  function draw() {
    renderer.render(scene, camera);
    $('time').textContent = `${age.toFixed(2)} s`;
    const stats = effect.stats();
    $('state').textContent = `活动效果 ${stats.activeHits} / 64 · 每次 10 粒子\n总绘制调用 ${renderer.info.render.calls} · ${Math.round(renderer.info.render.triangles)} 三角形`;
  }
  function background() {
    const light = $('background').value === 'light';
    scene.background = new THREE.Color(light ? 0xd6d6cf : 0x202b35);
    ground.material.color.set(light ? 0xbab9af : 0x343f49);
  }
  function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); arrange(); draw(); }
  $('play').onclick = play;
  $('clear').onclick = () => { playing = false; $('repeat').checked = false; effect.clear(); draw(); };
  $('scrub').oninput = () => { $('repeat').checked = false; seek(+$('scrub').value); };
  for (const id of ['distance', 'count', 'target']) $(id).onchange = () => { arrange(); seek(0.10); };
  $('background').onchange = () => { background(); draw(); };
  addEventListener('resize', resize);
  addEventListener('keydown', e => { if (e.code === 'Space' && !['INPUT', 'SELECT', 'BUTTON'].includes(document.activeElement.tagName)) { e.preventDefault(); play(); } });
  window.bloodPreview = {
    configure(options) { for (const [key, value] of Object.entries(options)) $(key).value = value; arrange(); background(); seek(0.10); },
    seek, play, effect, scene, renderer,
    state: () => ({ ...effect.stats(), age, enemies: +$('count').value, distance: +$('distance').value,
      drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }),
    async benchmark(count, enabled) {
      $('count').value = count; $('target').value = enabled ? 'enemy' : 'shield'; $('distance').value = '20'; arrange();
      playing = false; $('repeat').checked = false; samples.length = 0;
      let previous;
      for (let i = 0; i < 150; i++) {
        const timestamp = await new Promise(requestAnimationFrame);
        if (i >= 30) samples.push(timestamp - previous);
        previous = timestamp;
        trigger(); effect.update(0.1); draw();
      }
      const sorted = [...samples].sort((a,b) => a-b);
      return { count, enabled, frames: sorted.length, medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.floor(sorted.length * .95)], ...this.state() };
    }
  };
  background(); resize(); seek(.1);
  function frame(time) {
    const dt = (time - last) / 1000; last = time;
    if (playing) { age += dt; effect.update(age); if (age >= .5) playing = false; }
    else if ($('repeat').checked) { loopWait += dt; if (loopWait > .65) play(); }
    draw(); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame); window.__ready = true;
}
main().catch(error => { document.getElementById('state').textContent = error.message; console.error(error); });
