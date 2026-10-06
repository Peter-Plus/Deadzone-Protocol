import * as T from 'three';

// Reusable local-space soft volume; deterministic sprites and no per-asset code.
export function createCloud(parent,layer,texture,sampleValue) {
  const quad=new T.PlaneGeometry(1,1),geometry=new T.InstancedBufferGeometry();
  geometry.index=quad.index.clone();geometry.setAttribute('position',quad.attributes.position.clone());geometry.setAttribute('uv',quad.attributes.uv.clone());quad.dispose();
  const centers=new Float32Array(layer.count*3),details=new Float32Array(layer.count*4);
  let seed=layer.seed;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<layer.count;i++){
    const y=1-2*(i+.5)/layer.count,angle=i*2.399963229728653+random()*.4;
    const radial=Math.cbrt(layer.shell**3+(1-layer.shell**3)*random()),r=Math.sqrt(1-y*y);
    centers.set([Math.cos(angle)*r*radial*layer.radii[0],y*radial*layer.radii[1],Math.sin(angle)*r*radial*layer.radii[2]],i*3);
    details.set([T.MathUtils.lerp(...layer.size,random()),random()*Math.PI*2,random()*Math.PI*2,.65+random()*.35],i*4);
  }
  geometry.setAttribute('center',new T.InstancedBufferAttribute(centers,3));geometry.setAttribute('detail',new T.InstancedBufferAttribute(details,4));geometry.instanceCount=layer.count;
  const material=new T.ShaderMaterial({transparent:true,depthTest:layer.render.depthTest,depthWrite:layer.render.depthWrite,
    blending:layer.render.blend==='additive'?T.AdditiveBlending:T.NormalBlending,
    uniforms:{map:{value:texture},tint:{value:new T.Color(layer.render.color)},opacity:{value:0},clock:{value:0},expansion:{value:1},aspect:{value:layer.aspect},
      drift:{value:new T.Vector3(...layer.drift)},speed:{value:layer.speed},rotationSpeed:{value:layer.rotationSpeed},rise:{value:0},riseSpread:{value:0}},
    vertexShader:`attribute vec3 center; attribute vec4 detail;
      uniform float clock,expansion,aspect,speed,rotationSpeed,rise,riseSpread; uniform vec3 drift;
      varying vec2 vUv;varying float vOpacity;
      void main(){
        float phase=clock*speed+detail.z;
        vec3 moving=center*expansion+drift*vec3(sin(phase),sin(phase*.7+1.0),cos(phase));
        moving.y+=rise*mix(1.0,(detail.w-.65)/.35,riseSpread);
        vec4 viewCenter=modelViewMatrix*vec4(moving,1.0);
        float rotation=detail.y+clock*rotationSpeed;
        vec2 corner=position.xy*vec2(1.0,aspect)*detail.x;
        corner=mat2(cos(rotation),sin(rotation),-sin(rotation),cos(rotation))*corner;
        float worldScale=(length(modelMatrix[0].xyz)+length(modelMatrix[1].xyz)+length(modelMatrix[2].xyz))/3.0;
        viewCenter.xy+=corner*worldScale;
        gl_Position=projectionMatrix*viewCenter;vUv=uv;vOpacity=detail.w*(.9+.1*sin(phase*.8));
      }`,
    fragmentShader:`uniform sampler2D map;uniform vec3 tint;uniform float opacity;varying vec2 vUv;varying float vOpacity;
      void main(){float a=texture2D(map,vUv).a*opacity*vOpacity;if(a<.002)discard;gl_FragColor=vec4(tint,a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`
  });
  const mesh=new T.Mesh(geometry,material);mesh.name=layer.id;mesh.frustumCulled=false;mesh.position.fromArray(layer.position);parent.add(mesh);
  return {
    position(point){mesh.position.fromArray(layer.position).add(new T.Vector3(...point));},
    sample(state,time,normalized){const p=layer.profiles[state];const strength=p?Math.max(0,sampleValue(p.strength,time,normalized)):0;mesh.visible=strength>0;
      material.uniforms.clock.value=time;material.uniforms.opacity.value=layer.render.opacity*Math.min(strength,1);
      material.uniforms.expansion.value=p?Math.max(0,sampleValue(p.expansion,time,normalized)):1;
      material.uniforms.rise.value=p?.rise===undefined?0:sampleValue(p.rise,time,normalized);
      material.uniforms.riseSpread.value=p?.riseSpread??0;
    },
    dispose(){geometry.dispose();material.dispose();mesh.removeFromParent();}
  };
}
