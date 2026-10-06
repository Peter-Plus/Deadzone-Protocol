# Animation DSL V1

必填 schema=animation.v1、id、rig=humanoid.v1、duration（秒，0<duration≤3600）、loop（boolean）、mode。

## Timeline

mode=timeline 使用 `tracks` 或 `timeline` 二选一，不能混合，也不能带 generator/parameters。

tracks 为骨名到 keyframe 数组的映射。Key 包含 time 与 rotation/position 至少一个。时间必须非负、严格递增且≤duration，重复时间或 JSON 重复轨道名均拒绝。rotation=[x,y,z] 为有限 Euler 角度；独立轨道缺少首尾关键帧时，编译器在0/duration补齐保持值，确保导出的 clip 长度准确。

position 是相对于骨骼 Reference Pose 的局部偏移，仅允许 Root/Hips，向量长度≤0.25m。其轨道必须覆盖0和duration，首尾偏移严格为零（容差1e-6）。禁止通过 Root/Hips 产生持续世界位移。允许有界轻微 bob、局部旋转和返回起点的偏移。

Pose 文件必填 schema=pose.v1、id、rig 和 bones；bones 映射到 rotation/position。动画的 timeline=[{time,pose}] 引用 Pose ID，时间同样严格递增。各 Pose 未提供的骨骼/通道重置到参考姿势，不沿用上一帧。首尾旋转差距>0.15 radians 的 loop 动画产生接缝 Warning。

## Generator

mode=generator 必填 generator，不得写 tracks/timeline。可用 humanoid.idle、humanoid.breathing、humanoid.walk、humanoid.run。

parameters：strideAngle 0..90°、kneeBend 0..140°、armSwing 0..90°、bodyBob 0..0.2m、hipTwist 0..45°、lean -60..60°、breath 0..15°、samples 整数8..240。全部可省略。

walk/run 使用 strideAngle、kneeBend、armSwing、bodyBob、hipTwist、lean、samples；idle/breathing 使用 bodyBob、lean、breath、samples。默认48个区间+端点；首尾完全一致。walk 默认32/24/20/.025/4/0；run默认48/70/38/.05/4/12。idle/breathing默认breath=2、bodyBob=.006。

常规动作优先调 Generator 参数。导出 `.anim.glb` 包含规范骨架、单个 clip 和 animationId、rigId、rigVersion、rigSignature、duration、loop 元数据，无角色 Mesh。随机动作若将来引入必须显式提供 seed；V1 生成器没有随机行为。
