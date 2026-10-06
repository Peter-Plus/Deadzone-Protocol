import type { AnimationDefinition, Context, Tracks } from '../shared/types/index.js';
export function resolvePoses(d: AnimationDefinition, ctx: Context): Tracks {
  if (d.tracks) return d.tracks;
  const frames = d.timeline ?? [], tracks: Tracks = {};
  const bones = [...new Set(frames.flatMap(f => Object.keys(ctx.poses.get(f.pose)?.bones ?? {})))].sort();
  // Missing bones/channels reset to reference pose; no implicit carry-over.
  for (const bone of bones) {
    const hasPosition = frames.some(f => ctx.poses.get(f.pose)?.bones[bone]?.position);
    tracks[bone] = frames.map(f => ({ time: f.time, rotation: ctx.poses.get(f.pose)?.bones[bone]?.rotation ?? [0, 0, 0], ...(hasPosition ? { position: ctx.poses.get(f.pose)?.bones[bone]?.position ?? [0, 0, 0] } : {}) }));
  }
  return tracks;
}
