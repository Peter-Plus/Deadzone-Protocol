export interface Vec3 { readonly x: number; readonly y: number; readonly z: number }
/** +Y up; yaw=0 looks toward world +Z. Positive pitch looks down. */
export function lookDirection(yaw: number, pitch: number): Vec3 {
  return { x: Math.sin(yaw) * Math.cos(pitch), y: -Math.sin(pitch), z: Math.cos(yaw) * Math.cos(pitch) };
}
