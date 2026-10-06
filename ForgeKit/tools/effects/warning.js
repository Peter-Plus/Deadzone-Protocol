import * as T from 'three';
import {validateSector} from './sector.js';
export function createWarning(parent,l,sample){
 const g=new T.PlaneGeometry(2,2);g.rotateX(-Math.PI/2);
 const m=new T.ShaderMaterial({transparent:true,side:T.DoubleSide,depthTest:true,depthWrite:false,
 uniforms:{angle:{value:l.shape==='circle'?Math.PI*2:l.angle*Math.PI/180},opacity:{value:0},tint:{value:new T.Color(l.render.color)},clock:{value:0}},
 vertexShader:`varying vec2 p;void main(){p=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`varying vec2 p;uniform float angle,opacity,clock;uniform vec3 tint;
 void main(){float r=length(p),a=abs(atan(p.x,p.y));if(r>1.0||a>angle*.5)discard;
 float ring=smoothstep(.96,.982,r);float side=angle<6.28?smoothstep(angle*.5-.025,angle*.5,a):0.0;
 float pulse=.8+.2*sin(clock*4.0);float alpha=(.055+.82*max(ring,side))*opacity*pulse;
 gl_FragColor=vec4(tint,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const mesh=new T.Mesh(g,m);mesh.name=l.id;mesh.position.y=l.ground;mesh.scale.set(l.radius,1,l.radius);mesh.frustumCulled=false;parent.add(mesh);
 return {sector:l.shape==='sector',ground(y){mesh.position.y=y;},configure(a,r){validateSector(a,r);m.uniforms.angle.value=l.shape==='circle'?Math.PI*2:a*Math.PI/180;mesh.scale.set(r,1,r);},sample(state,t,n){const p=l.profiles[state],s=p?Math.max(0,sample(p.strength,t,n)):0;mesh.visible=s>0;m.uniforms.opacity.value=l.render.opacity*Math.min(1,s);m.uniforms.clock.value=t;},dispose(){g.dispose();m.dispose();mesh.removeFromParent();}};
}
