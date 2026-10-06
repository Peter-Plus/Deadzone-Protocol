import * as T from 'three';

// Shared bounded surfaces. Procedural detail is evaluated in world space so resizing
// a straight field does not stretch or slide its texture.
export function createSurface(parent,layer,sampleValue){
 const shield=layer.shape==='ellipsoid',disc=layer.shape==='disc',barrier=layer.shape==='barrier';
 const geometry=shield?new T.SphereGeometry(1,64,40):barrier?new T.CylinderGeometry(1,1,1,128,16,true):new T.PlaneGeometry(disc?2:1,disc?2:1);
 if(barrier)geometry.translate(0,.5,0);
 else if(!shield)geometry.rotateX(-Math.PI/2);
 const material=new T.ShaderMaterial({transparent:true,depthTest:layer.render.depthTest,depthWrite:layer.render.depthWrite,
  side:shield?T.FrontSide:T.DoubleSide,blending:layer.render.blend==='additive'?T.AdditiveBlending:T.NormalBlending,
  uniforms:{clock:{value:0},opacity:{value:0},tint:{value:new T.Color(layer.render.color)},accent:{value:new T.Color(layer.accent)},detailScale:{value:layer.detailScale},speed:{value:layer.speed},rimWidth:{value:layer.rimWidth}},
  vertexShader:`varying vec3 vWorld;varying vec3 vNormal;varying vec3 vView;varying vec2 vUv;
   void main(){vec4 w=modelMatrix*vec4(position,1.0);vec4 v=modelViewMatrix*vec4(position,1.0);vWorld=w.xyz;vNormal=normalize(normalMatrix*normal);vView=-v.xyz;vUv=uv;gl_Position=projectionMatrix*v;}`,
  fragmentShader:`uniform float clock,opacity,detailScale,speed,rimWidth;uniform vec3 tint,accent;varying vec3 vWorld,vNormal,vView;varying vec2 vUv;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
   float fbm(vec2 p){return noise(p)*.57+noise(p*2.03)*.28+noise(p*4.07)*.15;}
   void main(){float t=clock*speed;vec3 c;float a;
   ${shield?`float fresnel=pow(1.0-abs(dot(normalize(vNormal),normalize(vView))),2.0);
    vec2 p=vec2(vUv.x*24.0,vUv.y*12.0);p.x+=mod(floor(p.y),2.0)*.5;
    vec2 cell=fract(p)-.5;float wall=smoothstep(.37,.46,max(abs(cell.x)*.86+abs(cell.y)*.5,abs(cell.y)));
    float n=fbm(vWorld.xz*detailScale+vec2(vWorld.y*.6,t*.18));
    float bands=pow(.5+.5*sin(vWorld.y*9.0-t*3.0+n*4.0),12.0);
    c=mix(tint,accent,clamp(fresnel*.85+wall*.3+bands*.25,0.0,1.0));
    a=opacity*(.08+fresnel*.8+wall*.12+bands*.10)*(.7+n*.3);`
    :barrier?`float h=vUv.y;
    float n=fbm(vWorld.xz*detailScale+vec2(vWorld.y*.65-t*.18,t*.09));
    float filaments=pow(clamp(n*1.45,0.0,1.0),5.0);
    float base=exp(-h*42.0);
    float fade=pow(1.0-smoothstep(.06,1.0,h),1.7);
    float ripple=pow(.5+.5*sin(vWorld.y*5.0-t*2.0+n*5.0),10.0);
    c=mix(tint,accent,clamp(base*.85+filaments*.6+ripple*.12,0.0,1.0));
    a=opacity*(base*.9+fade*(.12+filaments*.42+ripple*.05));`
    :`vec2 q=(vUv-.5)*2.0;float d=${disc?'length(q)':'max(abs(q.x),abs(q.y))'};
    if(d>=1.0)discard;float edge=1.0-smoothstep(1.0-rimWidth*.25,1.0,d);
    vec2 p=vWorld.xz*detailScale;float n=fbm(p+vec2(t*.09,-t*.06));float swirl=fbm(p*1.6+vec2(n*2.0,t*.12));
    float rim=smoothstep(1.0-rimWidth*1.5,1.0-rimWidth*.5,d);
    vec2 cell=floor(p*1.1),f=fract(p*1.1)-.5;float seed=hash(cell);float cycle=fract(t*.33+seed);
    float bubble=(1.0-smoothstep(.018,.048,abs(length(f)-(.04+cycle*.19))))*sin(cycle*3.14159)*step(.63,seed);
    c=mix(tint,accent,clamp(swirl*.64+rim*.7+bubble*.7,0.0,1.0));
    a=opacity*edge*(.62+n*.25+rim*.13);c+=accent*bubble*.25;`}
    gl_FragColor=vec4(c,a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 const mesh=new T.Mesh(geometry,material);mesh.name=layer.id;mesh.position.fromArray(layer.position);mesh.scale.fromArray(layer.size);mesh.frustumCulled=false;parent.add(mesh);
 return {sample(state,time,normalized){const p=layer.profiles[state],s=p?Math.max(0,sampleValue(p.strength,time,normalized)):0;
   mesh.visible=s>0;material.uniforms.opacity.value=layer.render.opacity*Math.min(s,1);material.uniforms.clock.value=time;
   mesh.scale.fromArray(layer.size).multiplyScalar(p?Math.max(.00001,sampleValue(p.expansion,time,normalized)):1);},
  dispose(){geometry.dispose();material.dispose();mesh.removeFromParent();}};
}

export function placeSegment(root,start,end,width){
 const valid=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
 if(!valid(start)||!valid(end)||!Number.isFinite(width)||width<=0)throw Error('Segment needs finite start/end and positive width');
 if(Math.abs(start[1]-end[1])>.001)throw Error('Ground segment endpoints must share a height');
 const dx=end[0]-start[0],dz=end[2]-start[2],length=Math.hypot(dx,dz);
 root.position.set((start[0]+end[0])/2,start[1],(start[2]+end[2])/2);root.rotation.set(0,Math.atan2(dx,dz),0);root.scale.set(width,1,length);
 return length;
}
