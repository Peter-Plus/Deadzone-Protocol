import {Color} from 'three';
const sand=new Color('#b59a72'),pale=new Color('#d0b88d'),earth=new Color('#8b795f'),ochre=new Color('#ae835e');
const smooth=x=>x*x*(3-2*x);
function noise(u,v,cells,seed){
 const x=u*cells,z=v*cells,ix=Math.floor(x),iz=Math.floor(z),fx=smooth(x-ix),fz=smooth(z-iz);
 const hash=(a,b)=>{a=(a%cells+cells)%cells;b=(b%cells+cells)%cells;let h=Math.imul(a+seed,374761393)^Math.imul(b+seed,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;};
 const a=hash(ix,iz),b=hash(ix+1,iz),c=hash(ix,iz+1),d=hash(ix+1,iz+1);
 return (a+(b-a)*fx)*(1-fz)+(c+(d-c)*fx)*fz;
}
// Baked linear vertex colors: standard glTF COLOR_0, no custom shader or texture dependency.
// Periodic layers make opposite edges match, including the small mottling layer.
export function terrainColor(t,x,z,height){
 const u=(x+t.size[0]/2)/t.size[0],v=(z+t.size[1]/2)/t.size[1],seed=t.seed;
 const broad=noise(u,v,5,seed),patch=noise(u,v,13,seed+29),grain=noise(u,v,61,seed+73);
 const color=sand.clone().lerp(broad>.5?pale:earth,Math.abs(broad-.5)*1.5);
 color.lerp(ochre,Math.max(0,patch-.42)*.55);
 const elevation=Math.max(-1,Math.min(1,height/3));
 color.lerp(elevation>0?pale:earth,Math.abs(elevation)*.18);
 color.multiplyScalar(1+(patch-.5)*.14+(grain-.5)*.10);
 return color.toArray();
}
