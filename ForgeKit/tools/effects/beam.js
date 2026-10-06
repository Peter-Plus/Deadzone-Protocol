import * as T from 'three';

export function validateBeam(length,width){
  if(!Number.isFinite(length)||length<0||length>10000||!Number.isFinite(width)||width<=0||width>10000)
    throw Error('Beam requires length 0..10000 and width > 0..10000');
}
// Continuous local +Z flow. Width and sprite size stay independent of length.
export function createBeam(parent,layer,texture,sampleValue){
 const quad=new T.PlaneGeometry(1,1),g=new T.InstancedBufferGeometry();
 g.index=quad.index.clone();g.setAttribute('position',quad.attributes.position.clone());g.setAttribute('uv',quad.attributes.uv.clone());quad.dispose();
 let seed=layer.seed;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const p=new Float32Array(layer.count*4);for(let i=0;i<layer.count;i++)p.set([(i+rand())/layer.count,rand()*Math.PI*2,Math.sqrt(rand()),T.MathUtils.lerp(...layer.size,rand())],i*4);
 g.setAttribute('particle',new T.InstancedBufferAttribute(p,4));g.instanceCount=layer.count;
 const m=new T.ShaderMaterial({transparent:true,depthTest:layer.render.depthTest,depthWrite:layer.render.depthWrite,
  blending:layer.render.blend==='additive'?T.AdditiveBlending:T.NormalBlending,
  uniforms:{map:{value:texture},tint:{value:new T.Color(layer.render.color)},opacity:{value:0},clock:{value:0},beamLength:{value:layer.length},width:{value:layer.width},speed:{value:layer.speed},spread:{value:layer.spread}},
  vertexShader:`attribute vec4 particle;uniform float clock,beamLength,width,speed,spread;varying vec2 vUv;varying float alpha;
   void main(){float u=fract(particle.x+clock*speed/max(beamLength,.001));float a=particle.y+u*7.0-clock*1.4;
    float radius=width*.5*spread*particle.z*(.3+.7*u);vec3 c=vec3(cos(a)*radius,sin(a)*radius,u*beamLength);
    vec4 v=modelViewMatrix*vec4(c,1.0);float s=particle.w*width*(.5+.7*u);
    float ws=(length(modelMatrix[0].xyz)+length(modelMatrix[1].xyz)+length(modelMatrix[2].xyz))/3.0;
    vec2 q=position.xy;float r=particle.y+clock*.3;q=mat2(cos(r),sin(r),-sin(r),cos(r))*q;
    v.xy+=q*s*ws;gl_Position=projectionMatrix*v;vUv=uv;
    alpha=smoothstep(0.0,.035,u)*(1.0-smoothstep(.78,1.0,u));}`,
  fragmentShader:`uniform sampler2D map;uniform vec3 tint;uniform float opacity;varying vec2 vUv;varying float alpha;
   void main(){float a=texture2D(map,vUv).a*opacity*alpha;if(a<.002)discard;gl_FragColor=vec4(tint,a);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   }`});
 const mesh=new T.Mesh(g,m);mesh.name=layer.id;mesh.frustumCulled=false;parent.add(mesh);
 return {configure(length,width){validateBeam(length,width);m.uniforms.beamLength.value=length;m.uniforms.width.value=width;},
  sample(state,time,n){const p=layer.profiles[state],s=p?Math.max(0,sampleValue(p.strength,time,n)):0;mesh.visible=s>0&&m.uniforms.beamLength.value>0;m.uniforms.opacity.value=layer.render.opacity*Math.min(s,1);m.uniforms.clock.value=time;},
  dispose(){g.dispose();m.dispose();mesh.removeFromParent();}};
}
