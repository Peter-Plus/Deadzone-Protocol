import { BoxGeometry, SphereGeometry, CylinderGeometry, CapsuleGeometry, ConeGeometry, PlaneGeometry, Group, Mesh, Object3D, type BufferGeometry } from 'three';
import type { Context, ModelDefinition, Part } from '../shared/types/index.js';
import { applyTransform } from '../shared/math/transforms.js';
import { compileHumanoid } from './HumanoidCompiler.js';
import { MaterialCompiler } from './MaterialCompiler.js';
export function primitive(p: Part): BufferGeometry {
  let geometry: BufferGeometry;
  switch (p.shape) {
    case 'box': geometry = new BoxGeometry(...p.size!); break;
    case 'sphere': geometry = new SphereGeometry(p.radius, 16, 12); break;
    case 'cylinder': geometry = new CylinderGeometry(p.radius, p.radius, p.length, 16); break;
    case 'capsule': geometry = new CapsuleGeometry(p.radius, p.length, 4, 12); break;
    case 'cone': geometry = new ConeGeometry(p.radius, p.length, 16); break;
    case 'plane': geometry = new PlaneGeometry(p.size![0], p.size![1]); break;
    default: throw new Error('Unsupported primitive');
  }
  // Align geometry only: part/socket local transforms must remain unmodified.
  if (['cylinder', 'capsule', 'cone'].includes(p.shape)) {
    if (p.axis === 'x') geometry.rotateZ(-Math.PI / 2);
    if (p.axis === 'z') geometry.rotateX(Math.PI / 2);
  }
  return geometry;
}
export function compileModel(d: ModelDefinition, ctx: Context): Group {
  const materials = new MaterialCompiler(ctx);
  const humanoid = d.type === 'humanoid' ? compileHumanoid(d, materials) : undefined;
  const root = humanoid?.root ?? new Group(), nodes = new Map<string, Object3D>(humanoid?.bones);
  root.name = 'ModelRoot'; root.userData = { ...root.userData, assetId: d.id, assetType: d.type, schema: d.schema, units: 'meter' };
  applyTransform(root, d.root);
  for (const p of d.parts ?? []) {
    const mesh = new Mesh(primitive(p), materials.get(p.material ?? d.material)); mesh.name = p.id; applyTransform(mesh, p); nodes.set(p.id, mesh);
  }
  for (const p of d.parts ?? []) (p.parent ? nodes.get(p.parent)! : root).add(nodes.get(p.id)!);
  for (const s of d.sockets ?? []) {
    const node = new Object3D(); node.name = s.id; node.userData = { socket: true, socketId: s.id }; applyTransform(node, s);
    (s.parent ? nodes.get(s.parent)! : root).add(node);
  }
  root.updateMatrixWorld(true); return root;
}
