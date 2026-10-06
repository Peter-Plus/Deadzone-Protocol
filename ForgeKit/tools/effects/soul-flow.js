import * as T from 'three';
import {validateSector} from './sector.js';
const blend=r=>r.blend==='additive'?T.AdditiveBlending:T.NormalBlending;
// Spatially bounded flow into the local origin, independent of Gameplay targets.
export function createSuction(parent,l,texture,sample){
 const q=new T.PlaneGeometry(1,1),g=new T.InstancedBufferGeometry();g.index=q.index.clone();g.setAttribute('position',q.attributes.position.clone());g.setAttribute('uv',q.attributes.uv.clone());q.dispose();
 let seed=l.seed;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const data=new Float32Array(l.count*4);for(let i=0;i<l.count;i++)data.set([(i+rand())/l.count,rand(),rand(),T.MathUtils.lerp(...l.size,rand())],i*4);
 g.setAttribute('particle',new T.InstancedBufferAttribute(data,4));g.instanceCount=l.count;
 const m=new T.ShaderMaterial({transparent:true,depthTest:l.render.depthTest,depthWrite:l.render.depthWrite,blending:blend(l.render),
 uniforms:{map:{value:texture},tint:{value:new T.Color(l.render.color)},opacity:{value:0},clock:{value:0},angle:{value:l.angle*Math.PI/180},radius:{value:l.radius},height:{value:l.height},speed:{value:l.speed},ground:{value:-2.5}},
 vertexShader:`attribute vec4 particle;uniform float clock,angle,radius,height,speed,ground;varying vec2 vUv;varying float alpha;
 void main(){float u=1.0-fract(particle.x+clock*speed/max(radius,.001));
 float theta=(particle.y-.5)*angle*.92+sin(u*9.0-clock*1.8+particle.y*6.28)*angle*.035*u;
 float r=u*radius;float low=max(ground+.06,-r);float high=height*.25*u;
 vec3 c=vec3(sin(theta)*r,mix(low,high,particle.z),cos(theta)*r);
 vec4 v=modelViewMatrix*vec4(c,1.0);float ws=(length(modelMatrix[0].xyz)+length(modelMatrix[1].xyz)+length(modelMatrix[2].xyz))/3.0;
 vec2 dir=(modelViewMatrix*vec4(-normalize(c+vec3(.0001)),0.0)).xy;dir=length(dir)>.001?normalize(dir):vec2(0,1);vec2 side=vec2(dir.y,-dir.x);
 float sz=min(particle.w,radius*.08)*(.35+.65*u)*ws;
 v.xy+=(side*position.x+dir*position.y*3.2)*sz;gl_Position=projectionMatrix*v;vUv=uv;
 alpha=smoothstep(0.0,.06,u)*(1.0-smoothstep(.84,1.0,u));}`,
 fragmentShader:`uniform sampler2D map;uniform vec3 tint;uniform float opacity;varying vec2 vUv;varying float alpha;
 void main(){float a=texture2D(map,vUv).a*opacity*alpha;if(a<.002)discard;gl_FragColor=vec4(tint,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const mesh=new T.Mesh(g,m);mesh.name=l.id;mesh.frustumCulled=false;parent.add(mesh);
 return {ground(y){m.uniforms.ground.value=y;},configure(a,r){validateSector(a,r);m.uniforms.angle.value=a*Math.PI/180;m.uniforms.radius.value=r;},sample(state,t,n){const p=l.profiles[state],s=p?Math.max(0,sample(p.strength,t,n)):0;mesh.visible=s>0;m.uniforms.opacity.value=l.render.opacity*Math.min(s,1);m.uniforms.clock.value=t;},dispose(){g.dispose();m.dispose();mesh.removeFromParent();}};
}
// Crescent band aligned with the flight plane; root +Z remains forward for both variants.
export function createArc(parent,l,sample){
 const positions=[],uv=[],index=[];for(let i=0;i<=80;i++){const t=i/80,a=(t-.5)*l.angle*Math.PI/180;
  for(let j=0;j<2;j++){const r=l.radius-(1-j)*l.width*Math.pow(Math.sin(t*Math.PI),.65),x=Math.sin(a)*r,z=Math.cos(a)*r-l.radius;
   positions.push(l.plane==='horizontal'?x:0,l.plane==='horizontal'?0:x,z);uv.push(t,j);}
  if(i<80){const k=i*2;index.push(k,k+1,k+2,k+1,k+3,k+2);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);
 const m=new T.ShaderMaterial({transparent:true,side:T.DoubleSide,depthWrite:l.render.depthWrite,depthTest:l.render.depthTest,blending:blend(l.render),
 uniforms:{clock:{value:0},opacity:{value:0},tint:{value:new T.Color(l.render.color)},speed:{value:l.speed}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`uniform vec3 tint;uniform float clock,opacity,speed;varying vec2 vUv;
 void main(){float edge=pow(sin(vUv.y*3.14159),.5);float end=smoothstep(0.0,.06,vUv.x)*(1.0-smoothstep(.94,1.0,vUv.x));
 float streak=.65+.22*sin(vUv.x*70.0-clock*speed+vUv.y*19.0)+.13*sin(vUv.x*163.0+clock*speed*.7);
 gl_FragColor=vec4(tint,opacity*edge*end*streak);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const mesh=new T.Mesh(g,m);mesh.name=l.id;mesh.frustumCulled=false;parent.add(mesh);
 return {sample(state,t,n){const p=l.profiles[state],s=p?Math.max(0,sample(p.strength,t,n)):0;mesh.visible=s>0;m.uniforms.opacity.value=l.render.opacity*Math.min(s,1);m.uniforms.clock.value=t;},dispose(){g.dispose();m.dispose();mesh.removeFromParent();}};
}
