export type Vec3 = [number, number, number];
export interface Transform { position?: Vec3; rotation?: Vec3; scale?: number | Vec3 }
export interface MaterialDefinition {
  schema: 'material.v1'; id: string; color: string; roughness?: number; metalness?: number;
  emissive?: string; opacity?: number; transparent?: boolean;
}
export interface Part extends Transform {
  id: string; parent?: string; shape: 'box'|'sphere'|'cylinder'|'capsule'|'cone'|'plane';
  size?: Vec3; radius?: number; length?: number; axis?: 'x'|'y'|'z'; material?: string;
}
export interface Socket extends Transform { id: string; parent?: string }
export interface Body {
  height?: number; shoulderWidth?: number; hipWidth?: number; armLengthScale?: number;
  legLengthScale?: number; headScale?: number; handScale?: number; footScale?: number;
  bodyThickness?: number;
}
export interface ModelDefinition {
  schema: 'model.v1'; id: string; type: 'static'|'humanoid'; units?: 'meter'; root?: Transform;
  rig?: 'humanoid.v1'; body?: Body; material?: string; parts?: Part[]; sockets?: Socket[];
}
export interface Keyframe { time: number; rotation?: Vec3; position?: Vec3 }
export type Tracks = Record<string, Keyframe[]>;
export interface PoseDefinition { schema: 'pose.v1'; id: string; rig: 'humanoid.v1'; bones: Record<string, Omit<Keyframe, 'time'>> }
export interface AnimationDefinition {
  schema: 'animation.v1'; id: string; rig: 'humanoid.v1'; duration: number; loop: boolean;
  mode: 'timeline'|'generator'; tracks?: Tracks; timeline?: { time: number; pose: string }[];
  generator?: 'humanoid.idle'|'humanoid.breathing'|'humanoid.walk'|'humanoid.run';
  parameters?: { strideAngle?: number; kneeBend?: number; armSwing?: number; bodyBob?: number; hipTwist?: number; lean?: number; breath?: number; samples?: number };
}
export type Definition = ModelDefinition | AnimationDefinition | MaterialDefinition | PoseDefinition;
export interface Source { file: string; data: Definition }
export interface Context { materials: Map<string, MaterialDefinition>; poses: Map<string, PoseDefinition> }
export interface RigMetadata { rigId?: string; rigVersion?: string; rigSignature?: string }
