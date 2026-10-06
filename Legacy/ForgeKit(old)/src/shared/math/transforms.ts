import { Euler, MathUtils, Object3D, Quaternion } from 'three';
import type { Transform, Vec3 } from '../types/index.js';
export function quaternion(v: Vec3): Quaternion { return new Quaternion().setFromEuler(new Euler(...v.map(MathUtils.degToRad) as Vec3, 'XYZ')); }
export function applyTransform(object: Object3D, t: Transform = {}): void {
  if (t.position) object.position.fromArray(t.position);
  if (t.rotation) object.quaternion.copy(quaternion(t.rotation));
  if (typeof t.scale === 'number') object.scale.setScalar(t.scale);
  else if (t.scale) object.scale.fromArray(t.scale);
}
