// Deterministic, code-authored soft droplet. No external image or library required.
import fs from 'node:fs';
import { deflateSync } from 'node:zlib';
const size = 128;
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
const raw = Buffer.alloc(size * (size * 4 + 1));
for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
  const u = (x + 0.5) / size * 2 - 1, v = (y + 0.5) / size * 2 - 1;
  const width = 0.45 * (1 - 0.28 * v);
  const radius = Math.sqrt((u / width) ** 2 + (v / 0.84) ** 2);
  const edge = Math.max(0, Math.min(1, (1 - radius) / 0.2));
  const alpha = edge * edge * (3 - 2 * edge);
  const i = y * (size * 4 + 1) + 1 + x * 4;
  raw[i] = raw[i + 1] = raw[i + 2] = 255;
  raw[i + 3] = Math.round(alpha * 255);
}
const header = Buffer.alloc(13);
header.writeUInt32BE(size); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
fs.writeFileSync(new URL('./vfx_hit_blood_drop.png', import.meta.url), png);
console.log(`Generated RGBA ${size}x${size} droplet: ${png.length} bytes`);
