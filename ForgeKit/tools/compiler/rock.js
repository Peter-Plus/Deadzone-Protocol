import * as T from 'three';
import {ConvexGeometry} from 'three/addons/geometries/ConvexGeometry.js';

// Fixed topology budget and seeded points; authoring never accepts raw mesh data.
export function rockGeometry({size,seed}) {
 let state=seed>>>0;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const points=[];
 const phase=random()*Math.PI*2;
 for(let ring=0;ring<4;ring++)for(let i=0;i<9;i++){
  const angle=phase+i*Math.PI*2/9+(random()-.5)*.25;
  const radius=([.67,1,.86,.43][ring])*(.8+random()*.3);
  points.push(new T.Vector3(Math.cos(angle)*radius+(ring-1.5)*.07,[-.5,-.2,.22,.5][ring]+(ring===0?0:(random()-.5)*.18),Math.sin(angle)*radius));
 }
 const bounds=new T.Box3().setFromPoints(points),span=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 for(const p of points)p.sub(center).divide(span).multiply(new T.Vector3(...size));
 const geometry=new ConvexGeometry(points);geometry.computeBoundingBox();return geometry;
}
