import * as T from 'three';

export function validateSector(angle,radius){
 if(!Number.isFinite(angle)||angle<1||angle>360||!Number.isFinite(radius)||radius<=0||radius>10000)throw Error('Sector angle must be 1..360 degrees and radius in (0,10000]');
}
// Fixed drawing budget; changing the sector only redistributes visuals, never caps Gameplay targets.
export function createSector(parent,layer,sampleValue){
 let angle=0,radius=0,points=[];
 const geometry=new T.ConeGeometry(1,1,5,1);geometry.translate(0,.5,0);
 const positions=geometry.attributes.position;for(let i=0;i<positions.count;i++)positions.setX(i,positions.getX(i)+positions.getY(i)*.16);geometry.computeVertexNormals();
 const material=new T.MeshStandardMaterial({color:layer.color,emissive:layer.emissive,emissiveIntensity:.48,roughness:.52,metalness:.16,transparent:true});
 const spikes=new T.InstancedMesh(geometry,material,layer.capacity);spikes.name=layer.id+'_spikes';spikes.frustumCulled=false;parent.add(spikes);
 const ribbon=new T.BufferGeometry(),rp=[],uv=[],indices=[];
 for(let i=0;i<=40;i++)for(let j=0;j<2;j++){const t=i/40,a=t*Math.PI*5;rp.push(Math.cos(a),t,Math.sin(a));uv.push(j,t);if(i<40&&j===0){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}
 ribbon.setAttribute('position',new T.Float32BufferAttribute(rp,3));ribbon.setAttribute('uv',new T.Float32BufferAttribute(uv,2));ribbon.setIndex(indices);
 const smokeMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,
  uniforms:{clock:{value:0},opacity:{value:0},tint:{value:new T.Color(layer.smokeColor)}},
  vertexShader:`uniform float clock;varying vec2 vUv;
   void main(){vUv=uv;float a=uv.y*15.70796+clock*1.8;float r=1.15+(uv.x-.5)*.65+.10*sin(uv.y*26.0+clock*2.0);vec3 p=vec3(cos(a)*r,position.y,sin(a)*r);gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(p,1.0);}`,
  fragmentShader:`uniform float clock,opacity;uniform vec3 tint;varying vec2 vUv;
   void main(){float edge=sin(vUv.x*3.14159);float bands=.48+.32*sin(vUv.y*65.0-clock*3.0)+.2*sin(vUv.y*143.0+vUv.x*13.0-clock*2.0);float a=edge*opacity*bands*sin(vUv.y*3.14159);if(a<.005)discard;gl_FragColor=vec4(tint,a);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   }`});
 const smoke=new T.InstancedMesh(ribbon,smokeMat,layer.capacity);smoke.name=layer.id+'_souls';smoke.frustumCulled=false;parent.add(smoke);
 const groundGeo=new T.BufferGeometry(),groundPos=new Float32Array(128*9),groundUv=new Float32Array(128*6);
 groundGeo.setAttribute('position',new T.BufferAttribute(groundPos,3));groundGeo.setAttribute('uv',new T.BufferAttribute(groundUv,2));
 const groundMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{clock:{value:0},opacity:{value:0},angle:{value:0},tint:{value:new T.Color(layer.emissive)}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform float clock,opacity,angle;uniform vec3 tint;varying vec2 vUv;
   void main(){float r=length(vUv),a=abs(atan(vUv.x,vUv.y));float edge=smoothstep(.96,.995,r);float sides=angle<6.28?smoothstep(angle*.5-.025,angle*.5,a):0.0;float rings=pow(.5+.5*sin(r*46.0-clock*3.0),12.0);float alpha=opacity*(.12+.68*max(edge,sides)+rings*.18);gl_FragColor=vec4(tint*1.6,alpha);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   }`});
 const ground=new T.Mesh(groundGeo,groundMat);ground.name=layer.id+'_ground';ground.position.y=.028;ground.frustumCulled=false;parent.add(ground);
 const transform=new T.Object3D();
 function configure(degrees,length){validateSector(degrees,length);if(angle===degrees&&radius===length)return;
  angle=degrees;radius=length;const radians=T.MathUtils.degToRad(angle),half=radians/2;
  groundMat.uniforms.angle.value=radians;
  for(let i=0;i<128;i++){const a=-half+radians*i/128,b=-half+radians*(i+1)/128;
   const ax=Math.sin(a),az=Math.cos(a),bx=Math.sin(b),bz=Math.cos(b);
   groundPos.set([0,0,0,ax*radius,0,az*radius,bx*radius,0,bz*radius],i*9);groundUv.set([0,0,ax,az,bx,bz],i*6);}
  groundGeo.attributes.position.needsUpdate=groundGeo.attributes.uv.needsUpdate=true;
  let seed=layer.seed;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const count=Math.min(layer.capacity,Math.max(1,Math.ceil(.5*radians*radius*radius*layer.density)));points=[];
  for(let i=0;i<count;i++){const radial=Math.sqrt((i+.35+random()*.3)/count)*.93,theta=(-.5+((i*.61803398875+.2+random()*.15)%1))*(angle===360?radians:radians*.92),distance=radius*radial;
   const boundary=angle===360?radius-distance:Math.min(radius-distance,distance*Math.sin(Math.min(Math.PI/2,half-Math.abs(theta))));
   const width=Math.min(.13+random()*.15,Math.max(.0001,boundary/1.75));
   points.push({x:Math.sin(theta)*distance,z:Math.cos(theta)*distance,r:radial,width,height:T.MathUtils.lerp(...layer.height,random()),rotation:random()*Math.PI*2});}
  spikes.count=smoke.count=count;
 }
 configure(layer.angle,layer.radius);
 return {configure,
  sample(state,time,normalized){const p=layer.profiles[state];const val=k=>p?Math.max(0,sampleValue(p[k],time,normalized)):0;
   const strength=Math.min(1,val('strength')),growth=Math.min(1,val('growth'));spikes.visible=strength>0&&growth>0;smoke.visible=spikes.visible&&val('smoke')>0;ground.visible=val('ground')>0;
   material.opacity=strength;smokeMat.uniforms.clock.value=groundMat.uniforms.clock.value=time;smokeMat.uniforms.opacity.value=val('smoke')*.9;groundMat.uniforms.opacity.value=val('ground');
   for(let i=0;i<points.length;i++){const p=points[i],g=T.MathUtils.clamp((growth-p.r*.12)/.88,0,1);transform.position.set(p.x,.005,p.z);transform.rotation.set(0,p.rotation,0);transform.scale.set(p.width,p.height*g,p.width);transform.updateMatrix();spikes.setMatrixAt(i,transform.matrix);smoke.setMatrixAt(i,transform.matrix);}
   spikes.instanceMatrix.needsUpdate=smoke.instanceMatrix.needsUpdate=true;
  },
  layout(){return {angle,radius,points:points.map(p=>({...p}))};},
  dispose(){for(const mesh of [spikes,smoke,ground]){mesh.geometry.dispose();mesh.material.dispose();mesh.removeFromParent();}}
 };
}
