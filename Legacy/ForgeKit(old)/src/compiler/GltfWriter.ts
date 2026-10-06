import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import type { AnimationClip, Object3D } from 'three';
// GLTFExporter needs this browser API even for untextured, binary Node exports.
class NodeFileReader {
  result: ArrayBuffer | string | null = null;
  onloadend: ((event: unknown) => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;
  readAsArrayBuffer(blob: Blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.({ target: this }); }).catch(error => this.onerror?.(error)); }
  readAsDataURL(blob: Blob) { blob.arrayBuffer().then(value => { this.result = `data:${blob.type};base64,${Buffer.from(value).toString('base64')}`; this.onloadend?.({ target: this }); }).catch(error => this.onerror?.(error)); }
}
if (!globalThis.FileReader) Object.defineProperty(globalThis, 'FileReader', { value: NodeFileReader });
export async function writeGlb(root: Object3D, animations: AnimationClip[] = []): Promise<Buffer> {
  const output = await new GLTFExporter().parseAsync(root, { binary: true, animations, trs: true, onlyVisible: false });
  if (!(output instanceof ArrayBuffer)) throw new Error('Expected binary GLB output');
  return Buffer.from(output);
}
