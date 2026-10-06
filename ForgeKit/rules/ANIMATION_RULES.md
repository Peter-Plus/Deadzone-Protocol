# Animation v1

源文件 `*.anim.json`，schema=`animation.v1`，rig=`humanoid.v1`，必须提供 id、duration、loop、mode。
duration 在 (0,600] 秒；mode 为 timeline 或 generator，不能混用两套字段。
timeline 的 tracks 以七个固定 Bone 名为键，每个键帧包含 time 和 rotation / position / pose 中至少一项。
time 在 0..duration 内严格递增。rotation 为绝对局部 Euler XYZ 角度；position 为相对默认局部位置的增量。
仅 Body 允许 position，单轴不得超过 ±0.2 米。Root、Head、四肢禁止位移。所有动画 In Place。
pose 引用 `*.pose.json` 的 id；Pose 必须包含当前 track 的 Bone。键帧显式 rotation/position 覆盖 Pose 的同名字段。
缺失通道保持默认姿态；每个通道首尾未覆盖时补充恒定端点。旋转转换为最短路径 Quaternion 插值，位移线性插值。
generator 支持 humanoid.idle / humanoid.walk / humanoid.run。参数 armSwing(0..180°)、legSwing(0..90°)、bodyBob(0..0.2m)、bodyLean(-45..45°)、samples(8..240)。
Generator 将手臂从 T-Pose 降至身体两侧后反向摆动；所有生成器都不移动 Root，首尾闭合。
最终 `.anim.glb` 只含标准节点、Metadata 和一个 AnimationClip，无 Mesh。跨比例播放需按 Runtime 文档调整 Body 位置曲线的默认基准。
