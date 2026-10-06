import * as THREE from 'three';
import { parseEffectPackage } from './validate.js';
import { createCloud as makeCloud } from './cloud.js';
import { createSurface, placeSegment } from './surface.js';
import { createSector, validateSector } from './sector.js';
import { createBeam, validateBeam } from './beam.js';
import { createSuction, createArc } from './soul-flow.js';
import { createWarning } from './warning.js';
export { parseEffectPackage };

export function sampleValue(spec, seconds, normalized) {
  if (typeof spec === 'number') return spec;
  if (spec.wave) {
    const phase = (spec.domain === 'seconds' ? seconds : normalized) * spec.frequency * Math.PI * 2 + spec.phase;
    const s = Math.sin(phase); return spec.bias + spec.amplitude * (spec.wave === 'sinSquared' ? s*s : s);
  }
  const t = Math.max(0, Math.min(1, normalized));
  for (let i = 1; i < spec.keys.length; i++) if (t <= spec.keys[i][0]) {
    const [a,x] = spec.keys[i-1], [b,y] = spec.keys[i]; let u = (t-a)/(b-a);
    if (spec.interpolation === 'smooth') u = u*u*(3-2*u);
    return x + (y-x)*u;
  }
  return spec.keys.at(-1)[1];
}

// No asset-specific branches, executable snippets or Gameplay state changes.
export async function createEffect(input, { scene, model = null } = {}) {
  const data = parseEffectPackage(input), textures = new Map(), bursts = [], orbits = [], clouds = [], surfaces = [], sectors = [], beams = [], suctions = [], arcs = [], warnings = [], materials = [];
  if (!scene?.isObject3D) throw Error('A scene/group is required');
  let mount = scene;
  if (data.binding) {
    if (!model) throw Error(`Reference model required: ${data.binding.model}`);
    let modelId; model.traverse(n => { if (n.userData.assetId) modelId ??= n.userData.assetId; });
    if (modelId !== data.binding.model) throw Error(`Expected model ${data.binding.model}, received ${modelId ?? 'unknown'}`);
    mount = model.getObjectByName(data.binding.attachment);
    if (!mount) throw Error(`Missing attachment: ${data.binding.attachment}`);
    for (const layer of data.layers.filter(l => l.kind === 'material')) for (const prefix of layer.prefixes) {
      let found = false; model.traverse(n => { if (n.isMesh && n.name.startsWith(prefix)) found = true; });
      if (!found) throw Error(`Missing material target prefix: ${prefix}`);
    }
  }
  const root = new THREE.Group(); root.name = data.id;
  let disposed = false, state = data.initialState, originState = state, variant = Object.keys(data.variants)[0] ?? '', time = 0, elapsed = 0;
  const materialOwners = new Map();
  function cleanup() {
    for (const b of bursts) b.player.dispose();
    for (const o of orbits) { o.mesh.geometry.dispose(); o.mesh.material.dispose(); }
    for (const c of clouds) c.dispose();
    for (const s of surfaces) s.dispose();
    for (const s of sectors) s.dispose();
    for (const b of beams) b.dispose();
    for (const s of [...suctions,...arcs,...warnings]) s.dispose();
    for (const [node, value] of materialOwners) { node.material = value.original; value.clones.forEach(m => m.dispose()); }
    textures.forEach(t => t.dispose()); root.removeFromParent();
  }
  try {
    for (const [id,t] of Object.entries(data.textures)) textures.set(id, await new THREE.TextureLoader().loadAsync(t.data));
    for (const layer of data.layers) {
      if (layer.kind === 'burst') bursts.push({ layer, player: createBurst(root, layer, textures.get(layer.texture)) });
      else if (layer.kind === 'orbit') {
        const s = layer.shape, geometry = s.type === 'cone' ? new THREE.ConeGeometry(s.radius,s.height,s.segments) : new THREE.SphereGeometry(s.radius,s.widthSegments,s.heightSegments);
        const material = new THREE.MeshBasicMaterial({ color: layer.render.color, opacity: layer.render.opacity, transparent: true,
          depthTest: layer.render.depthTest, depthWrite: layer.render.depthWrite, blending: layer.render.blend === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending });
        const mesh = new THREE.InstancedMesh(geometry, material, layer.count); mesh.name = layer.id; mesh.frustumCulled = false;
        root.add(mesh); orbits.push({ layer, mesh });
      } else if (layer.kind === 'cloud') {
        clouds.push(makeCloud(root,layer,textures.get(layer.texture),sampleValue));
      } else if (layer.kind === 'surface') {
        surfaces.push(createSurface(root,layer,sampleValue));
      } else if (layer.kind === 'sector') {
        sectors.push(createSector(root,layer,sampleValue));
      } else if (layer.kind === 'beam') {
        beams.push(createBeam(root,layer,textures.get(layer.texture),sampleValue));
      } else if (layer.kind === 'suction') {
        suctions.push(createSuction(root,layer,textures.get(layer.texture),sampleValue));
      } else if (layer.kind === 'arc') {
        arcs.push(createArc(root,layer,sampleValue));
      } else if (layer.kind === 'warning') {
        warnings.push(createWarning(root,layer,sampleValue));
      } else {
        const targets = [];
        model.traverse(node => {
          if (!node.isMesh || !layer.prefixes.some(p => node.name.startsWith(p))) return;
          if (!materialOwners.has(node)) {
            const original = node.material, array = Array.isArray(original) ? original : [original];
            if (array.some(m => !m.color || !m.emissive)) throw Error(`Material target ${node.name} must support color and emissive`);
            const clones = array.map(m => m.clone()); materialOwners.set(node, { original, clones, bases: array });
            node.material = Array.isArray(original) ? clones : clones[0];
          }
          targets.push(materialOwners.get(node));
        });
        materials.push({ layer, targets });
      }
    }
    mount.add(root);
  } catch (error) { cleanup(); throw error; }
  const transform = new THREE.Object3D();
  function restoreMaterials() {
    for (const { clones, bases } of materialOwners.values()) for (let i=0;i<clones.length;i++) {
      clones[i].color.copy(bases[i].color); clones[i].emissive.copy(bases[i].emissive); clones[i].emissiveIntensity = bases[i].emissiveIntensity;
    }
  }
  function evaluate() {
    if (!root.visible) { restoreMaterials(); return; }
    const spec = data.states[state], normalized = spec.loop ? (time % spec.duration)/spec.duration : Math.min(time/spec.duration,1);
    for (const b of bursts) { b.player.update(time); const profile = b.layer.profiles[state]; b.player.strength(profile ? Math.max(0,sampleValue(profile.strength,time,normalized)) : 0); }
    for (const c of clouds) c.sample(state,time,normalized);
    for (const s of surfaces) s.sample(state,time,normalized);
    for (const s of sectors) s.sample(state,time,normalized);
    for (const b of beams) b.sample(state,time,normalized);
    for (const s of [...suctions,...arcs,...warnings]) s.sample(state,time,normalized);
    for (const { layer, mesh } of orbits) {
      const p = layer.profiles[state], strength = p ? Math.max(0, sampleValue(p.strength,time,normalized)) : 0;
      mesh.visible = strength > 0 && (!layer.variant || layer.variant === variant);
      if (!mesh.visible) continue;
      const radius = sampleValue(p.radius,time,normalized);
      mesh.material.opacity = Math.max(0, Math.min(1, layer.render.opacity * strength));
      for (let i = 0; i < layer.count; i++) {
        const angle = i * Math.PI * 2 / layer.count + time * layer.angularSpeed;
        transform.position.set(layer.position[0] + Math.sin(angle)*radius,
          layer.position[1] + layer.bob.amplitude*Math.sin(time*layer.bob.frequency+i*layer.bob.phaseStep), layer.position[2] + Math.cos(angle)*radius);
        const pulse = layer.pulse.base + layer.pulse.amplitude * Math.sin(time*layer.pulse.frequency+i*layer.pulse.phaseStep)**2;
        transform.scale.setScalar(Math.max(.00001,strength*pulse)); transform.updateMatrix(); mesh.setMatrixAt(i,transform.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    restoreMaterials();
    for (const { layer, targets } of materials) {
      const p = layer.profiles[state]; if (!p) continue;
      for (const { clones, bases } of targets) for (let i=0;i<clones.length;i++) {
        clones[i].color.copy(bases[i].color).multiplyScalar(p.colorMultiplier);
        clones[i].emissive.set(p.emissive === '$variant' ? data.variants[variant] : p.emissive);
        clones[i].emissiveIntensity = Math.max(0,sampleValue(p.intensity,time,normalized));
      }
    }
  }
  const api = {
    data, root,
    setGroundOffset(y) {
      if(disposed)throw Error('Effect disposed');
      if(!Number.isFinite(y)||Math.abs(y)>10000)throw Error('Ground offset must be finite and within 10000');
      warnings.forEach(s=>s.ground(y));suctions.forEach(s=>s.ground(y));evaluate();
    },
    setBeam(length,width) {
      if(disposed)throw Error('Effect disposed');
      if(!beams.length)throw Error('Effect has no beam layers');
      validateBeam(length,width);beams.forEach(b=>b.configure(length,width));evaluate();
    },
    setSector(angleDegrees,radiusMeters) {
      if(disposed)throw Error('Effect disposed');
      const targets=[...sectors,...suctions,...warnings.filter(w=>w.sector)];
      if(!targets.length)throw Error('Effect has no sector layers');
      validateSector(angleDegrees,radiusMeters);targets.forEach(s=>s.configure(angleDegrees,radiusMeters));evaluate();
    },
    setSegment(start,end,width) {
      if(disposed)throw Error('Effect disposed');
      if(!data.layers.every(l=>l.kind==='surface'&&l.shape==='rectangle'&&l.size[0]===1&&l.size[2]===1&&l.position[0]===0&&l.position[2]===0))throw Error('setSegment requires centered unit rectangle layers');
      return placeSegment(root,start,end,width);
    },
    setState(next, chosen = variant) {
      if (disposed) throw Error('Effect disposed');
      if (!Object.hasOwn(data.states,next)) throw Error(`Unknown visual state ${next}`);
      if (Object.keys(data.variants).length && !Object.hasOwn(data.variants,chosen)) throw Error(`Unknown variant ${chosen}`);
      state = next; originState = next; variant = chosen; time = 0; elapsed = 0; root.visible = true; bursts.forEach(b => b.player.clear()); evaluate();
    },
    emit({ position = [0,0,0], normal = [0,0,1], seed = 1, allowed = false } = {}) {
      if (disposed || allowed !== true) return false;
      if (!Array.isArray(position) || position.length!==3 || !position.every(Number.isFinite)) return false;
      let emitted = false;
      for (const c of clouds) { c.position(position); emitted = true; }
      for (const b of bursts) if (b.layer.profiles[state]) emitted = b.player.emit({ point: position, normal, seed, bloodAllowed: true },time) || emitted;
      return emitted;
    },
    seek(seconds) {
      if (disposed) throw Error('Effect disposed');
      if (!Number.isFinite(seconds) || seconds < 0) throw Error('Time must be finite and nonnegative');
      elapsed = seconds; time = seconds; state = originState;
      let spec = data.states[state];
      while (spec.next && time >= spec.duration) { time -= spec.duration; state = spec.next; spec = data.states[state]; }
      evaluate();
    },
    update(dt) {
      if (disposed || !root.visible) return;
      if (!Number.isFinite(dt) || dt < 0) throw Error('Delta time must be finite and nonnegative');
      // Visual transitions only; no callback can commit a Gameplay result.
      api.seek(elapsed + dt);
    },
    clear() { bursts.forEach(b => b.player.clear()); root.visible = false; restoreMaterials(); },
    show() { if (!disposed) { root.visible = true; evaluate(); } },
    stats() { return { id: data.id, state, variant, time, disposed, activeBursts: bursts.reduce((n,b) => n+b.player.stats().activeHits,0),
      visibleLayers: root.visible ? root.children.filter(m => m.isMesh && m.visible).length : 0,
      capacity: bursts.reduce((n,b) => n+b.layer.capacity,0), materialTargets: materialOwners.size }; },
    dispose() { if (!disposed) { cleanup(); disposed = true; } }
  };
  evaluate(); return api;
}

// Presentation-only consumer. The caller supplies a confirmed Combat/Character result.
function createBurst(scene, layer, texture) {
  const config = { capacityHits: layer.capacity, particlesPerHit: layer.count, durationSeconds: layer.duration,
    speedMetersPerSecond: layer.speed, sizeMeters: layer.size, gravityMetersPerSecondSquared: layer.gravity,
    color: layer.render.color, opacity: layer.render.opacity, depthTest: layer.render.depthTest, depthWrite: layer.render.depthWrite, assetId: layer.id };
  texture.colorSpace = THREE.NoColorSpace;
  const geometry = new THREE.InstancedBufferGeometry();
  const quad = new THREE.PlaneGeometry(1, 1);
  geometry.index = quad.index.clone();
  geometry.setAttribute('position', quad.attributes.position.clone());
  geometry.setAttribute('uv', quad.attributes.uv.clone()); quad.dispose();
  const count = config.capacityHits * config.particlesPerHit;
  const origins = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  const velocities = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  const params = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
  [origins, velocities, params].forEach(a => a.setUsage(THREE.DynamicDrawUsage));
  for (let i = 0; i < count; i++) params.setXYZW(i, -1000, 1, 0, 0);
  geometry.setAttribute('origin', origins); geometry.setAttribute('velocity', velocities);
  geometry.setAttribute('params', params); geometry.instanceCount = count;
  const material = new THREE.ShaderMaterial({
    transparent: true, depthTest: config.depthTest, depthWrite: config.depthWrite,
    blending: layer.render.blend === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { clock: { value: 0 }, gravity: { value: config.gravityMetersPerSecondSquared },
      tint: { value: new THREE.Color(config.color) }, opacity: { value: config.opacity }, shrink: { value: layer.shrink }, fadeStart: { value: layer.fadeStart }, map: { value: texture } },
    vertexShader: `
      attribute vec3 origin; attribute vec3 velocity; attribute vec4 params;
      uniform float clock; uniform float gravity; uniform float shrink; uniform float fadeStart; varying vec2 vUv; varying float vAlpha;
      void main() {
        float age = clock - params.x, life = params.y;
        float t = clamp(age, 0.0, life), fraction = t / life;
        float alive = step(0.0, age) * (1.0 - step(life, age));
        vAlpha = alive * (1.0 - smoothstep(fadeStart, 1.0, fraction)); vUv = uv;
        vec3 center = origin + velocity * t + vec3(0.0, -0.5 * gravity * t * t, 0.0);
        vec4 viewCenter = viewMatrix * vec4(center, 1.0);
        vec2 direction = (viewMatrix * vec4(velocity + vec3(0.0, -gravity * t, 0.0), 0.0)).xy;
        direction = length(direction) > 0.001 ? normalize(direction) : vec2(0.0, 1.0);
        vec2 side = vec2(direction.y, -direction.x);
        float size = params.z * (1.0 - shrink * fraction) * alive;
        viewCenter.xy += side * position.x * size + direction * position.y * size * params.w;
        gl_Position = projectionMatrix * viewCenter;
      }`,
    fragmentShader: `
      uniform sampler2D map; uniform vec3 tint; uniform float opacity;
      varying vec2 vUv; varying float vAlpha;
      void main() {
        float alpha = texture2D(map, vUv).a * vAlpha * opacity;
        if (alpha < 0.015) discard;
        gl_FragColor = vec4(tint, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = config.assetId; mesh.frustumCulled = false; mesh.visible = false; scene.add(mesh);
  let slot = 0, disposed = false, now = 0;
  const expires = new Float64Array(config.capacityHits);
  const starts = new Float64Array(config.capacityHits);
  const normal = new THREE.Vector3(), tangent = new THREE.Vector3(), bitangent = new THREE.Vector3();
  const up = new THREE.Vector3(), velocity = new THREE.Vector3();
  const api = {
    strength(value) { material.uniforms.opacity.value = config.opacity * Math.min(1,value); },
    // normal is the outward WORLD-space surface normal; positions are in metres.
    emit({ bloodAllowed, point, normal: direction, seed = 1 }, seconds) {
      if (disposed || bloodAllowed !== true) return false;
      if (!Number.isFinite(seconds) || !Array.isArray(point) || !point.every(Number.isFinite) || point.length !== 3 ||
          !Array.isArray(direction) || !direction.every(Number.isFinite) || direction.length !== 3 || !Number.isFinite(seed)) return false;
      normal.fromArray(direction); if (normal.lengthSq() < 1e-8) return false; normal.normalize();
      up.set(0, Math.abs(normal.y) < 0.95 ? 1 : 0, Math.abs(normal.y) < 0.95 ? 0 : 1);
      tangent.crossVectors(up, normal).normalize(); bitangent.crossVectors(normal, tangent).normalize();
      let state = seed >>> 0;
      const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
      for (let p = 0; p < config.particlesPerHit; p++) {
        const i = slot * config.particlesPerHit + p;
        const angle = random() * Math.PI * 2, spread = Math.sqrt(random()) * layer.spread;
        velocity.copy(normal).multiplyScalar(THREE.MathUtils.lerp(...layer.normalWeight, random()))
          .addScaledVector(tangent, Math.cos(angle) * spread).addScaledVector(bitangent, Math.sin(angle) * spread).normalize()
          .multiplyScalar(THREE.MathUtils.lerp(...config.speedMetersPerSecond, random()));
        velocity.y += layer.lift;
        origins.setXYZ(i, point[0] + normal.x * layer.normalOffset, point[1] + normal.y * layer.normalOffset, point[2] + normal.z * layer.normalOffset);
        velocities.setXYZ(i, velocity.x, velocity.y, velocity.z);
        params.setXYZW(i, seconds, config.durationSeconds * THREE.MathUtils.lerp(...layer.lifeRange, random()),
          THREE.MathUtils.lerp(...config.sizeMeters, random()), THREE.MathUtils.lerp(...layer.stretch, random()));
      }
      starts[slot] = seconds; expires[slot] = seconds + config.durationSeconds; slot = (slot + 1) % config.capacityHits;
      origins.needsUpdate = velocities.needsUpdate = params.needsUpdate = true;
      api.update(seconds); return true;
    },
    update(seconds) {
      if (disposed) return;
      if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Effect time must be finite and nonnegative.');
      now = seconds; material.uniforms.clock.value = now; mesh.visible = expires.some((t,i) => t > now && starts[i] <= now);
    },
    clear() {
      if (disposed) return;
      expires.fill(0); now = 0; slot = 0; mesh.visible = false;
      for (let i = 0; i < count; i++) params.setXYZW(i, -1000, 1, 0, 0);
      params.needsUpdate = true;
    },
    stats() { return { activeHits: expires.filter((t,i) => t > now && starts[i] <= now).length, capacityHits: config.capacityHits,
      allocatedParticles: count, visible: mesh.visible, disposed }; },
    dispose() { if (disposed) return; api.clear(); disposed = true; scene.remove(mesh); geometry.dispose(); material.dispose(); }
  };
  return api;
}
