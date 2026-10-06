// Deterministic soft fog and light masks; no external art dependencies.
import fs from 'node:fs';
import { deflateSync } from 'node:zlib';
const size = 256;
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}

function hash(x,y){let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
const smooth=t=>t*t*(3-2*t),lerp=(a,b,t)=>a+(b-a)*t;
function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),a=smooth(x-ix),b=smooth(y-iy);return lerp(lerp(hash(ix,iy),hash(ix+1,iy),a),lerp(hash(ix,iy+1),hash(ix+1,iy+1),a),b);}
function fbm(x,y){return .55*noise(x,y)+.27*noise(x*2+13,y*2+7)+.13*noise(x*4+2,y*4+21)+.05*noise(x*8,y*8);}
for(const kind of ['mist','glow']){
 const raw=Buffer.alloc(size*(size*4+1));
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=(x+.5)/size*2-1,v=(y+.5)/size*2-1,r=Math.hypot(u,v);
  const distortion=fbm(u*3+19,v*3+37),veins=fbm(u*7+distortion*2+41,v*7+distortion*2+61);
  const envelope=Math.max(0,1-r*r);
  const alpha=kind==='mist'?Math.pow(envelope,1.8)*Math.pow(.1+.9*veins,1.2)*1.7:Math.exp(-r*r*7)*Math.pow(envelope,1.5);
  const i=y*(size*4+1)+1+x*4;raw[i]=raw[i+1]=raw[i+2]=255;raw[i+3]=Math.round(Math.min(1,alpha)*255);
 }
 const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
 const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
 fs.writeFileSync(new URL(`./shadow_${kind}.png`,import.meta.url),png);console.log(kind,png.length);
}
