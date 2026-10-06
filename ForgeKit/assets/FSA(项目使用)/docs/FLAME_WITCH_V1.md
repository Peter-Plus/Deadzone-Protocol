# C3 炎巫模型（当前 rig：humanoid.v2）

本文件沿用初版交付文档文件名；现行模型已升级十三节点，旧七节点挂接约定失效。

2026-10-05：炎巫在初版交付后升级为 humanoid.v2 十三节点。现有外观与插槽默认世界位置保持不变，前臂/手掌重新分配到肘腕骨骼，Staff_Grip_R 改挂 Hand_R；双膝节点存在但无腿脚几何。ForgeKit 校验器、编译器、预览器和单向 v1 动画适配已实现，包含默认姿态缓存、Body 平移重定基准和混合复位。十段旧共用动画与实际 GLB 检查通过，其余 62 个 GLB 内容未变。仅工具链及资产升级，游戏敌人动画运行时与 C3 专用动作尚未接入，Play.html 不变。

### C3 炎巫：十三节点、无腿长袍与长法杖

C3 已升级为 humanoid.v2 十三节点，height=2.16 米（A1 × 1.2）。保留原有外观、材质和默认参考姿态，99 个几何部件、20,436 三角形、三个插槽；已另行交付六段专用动画。原点为地面中心，袍摆最低约 y=0.07 米。双侧 Leg / LowerLeg 均没有腿脚几何，整件长袍挂 Body，不随膝部运动，无布料模拟。

- 固定骨架在原七节点基础上新增 Arm → Forearm → Hand、Leg → LowerLeg，左右各一套；原 Arm 现在为上臂，Leg 为大腿。无手指、踝部骨骼或 IK。
- 炎巫的 Forearm_L/R 相对 Arm_L/R 为 [±0.28,0.07,0.09]，Hand_L/R 相对 Forearm_L/R 为 [±0.29,0.09,0.07]。模型 jointPositions 使关节落在原有肘腕连接处；原七节点的平移基准不变。
- 右手法杖已内置，Staff_Grip_R 的父节点改为 Hand_R，局部 position=[-0.065,0.02,0.02]、rotation=[0,0,-90]。转腕时手掌、手指和法杖一起转，前臂不随手腕转动；肘部转动带动整段前臂与手。不要重复挂载装备。
- Staff_Tip / Fireball_Muzzle 仍挂 Staff_Grip_R，局部位置分别为 [0,1.345,0] / [0,1.205,0.13]；名称与默认世界位置保持不变。Fireball_Muzzle 的局部 +Z 是杖芯正面方向；前指动画使用 Staff_Tip 起点与 Gameplay 确定的方向，详见动画说明。杖长约 2.32 米；技能轨迹和目标由 Gameplay 决定。
- 原几何名 Hand_L/R 与 Forearm_L/R 已让给骨骼；对应 Mesh 改为 HandMesh_L/R 与 ForearmMesh_L/R。若旧代码查找这些几何名，须更新；优先按插槽名称读取发射点，不依赖具体几何。
- GLB 默认仍为零旋转参考 T-Pose。静态垂臂持杖展示设置 Arm_L=[0,0,-90]、Arm_R=[0,0,90]，其他骨骼为零；法杖底端约 y=0.086 米、顶端约 y=2.40 米。审阅页的“屈肘竖杖”和肘腕滑条仅为能力演示，不是已交付动作。
- 旧 v1 共用动画需显式适配，不能直接通过三字段相等校验。ForgeRuntime.compatibility(modelMeta, animationMeta) / prepareClip 已支持 v1 动画 → v2 模型，保留 Body 的 0.9936 米基准并补齐新增关节默认轨道；反向播放拒绝。加载时 captureRestPose，停止时 restoreRestPose，混合中使用预处理片段复位缺失通道。十段旧共用动画已验证；这不等于专用施法表现已完成。
- 杖芯和眼睛 emissive 仅为材质，无光源、粒子、护盾或火球逻辑。现已交付六段专用动作，见 [炎巫动画说明](FLAME_WITCH_ANIMATIONS_V1.md)；专用 Idle、移动与首领行为仍待制作、接入。

详细骨架、动画与兼容契约见 [humanoid.v2](../../../rules/HUMANOID_V2.md)。

正式定义与 GLB 的 ID、路径均保持不变。审阅：`../../../.qa/flame-witch-preview.html`；迁移报告：`../../../.qa/flame-witch-v2-migration-report.json`。
