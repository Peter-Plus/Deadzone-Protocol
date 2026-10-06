# 十三节点人形：humanoid.v2

更新：2026-10-05。v2 是新增的骨架版本，v1 七节点与 fps-arms.v1 均保留。JSON 文件仍使用 model.v1 / animation.v1 / pose.v1 schema；选择骨架只改变 rig 字段，不要把 schema 改成 model.v2。

## 固定层级与默认姿态

```text
Root
└─ Body
   ├─ Head
   ├─ Arm_L
   │  └─ Forearm_L
   │     └─ Hand_L
   ├─ Arm_R
   │  └─ Forearm_R
   │     └─ Hand_R
   ├─ Leg_L
   │  └─ LowerLeg_L
   └─ Leg_R
      └─ LowerLeg_R
```

共十三节点；Arm 为上臂，Leg 为大腿。坐标轴、Euler XYZ、米制和原来的七个节点平移公式不变。零旋转为参考 T-Pose，左臂沿 +X，右臂沿 -X，腿沿 -Y。无额外踝、手指、IK、连续蒙皮或 Root Motion。

parameters 沿用 v1：armLength 为从肩到手端的总长度，legLength 为从髋到地面的总长度。新增节点默认局部位置：

| 节点 | 父节点 | 默认局部 position |
| --- | --- | --- |
| Forearm_L / R | Arm_L / R | [±armLength × 0.5, 0, 0] |
| Hand_L / R | Forearm_L / R | [±armLength × 0.4, 0, 0] |
| LowerLeg_L / R | Leg_L / R | [0, −legLength × 0.5, 0] |

省略 parts 时，编译器生成分段外观：上臂占臂长 50%、前臂 40%、手 10%；大腿、小腿各占腿长 50%。Hand 原点在腕部，不在指尖。

有自定义非空 parts 的 v2 模型可选 jointPositions，仅允许上述六个新增节点为键，值为相对于固定父节点的三维局部位置，分量有限且在 ±10000 米以内；缺省键使用默认值。它用于让关节位于已有外观的肘、腕、膝连接处，不增加节点、不修改父子层级、不改变原七个节点位置，也不赋予动画位移能力。v1、FPS、static 和自动外观模型禁止该字段。自定义布置时仍应将关节放在几何连接处，保持参考姿态旋转为零。

仅尺寸和 jointPositions 不改变 rigSignature；方向、层级及旋转语义改变必须另建骨架契约。几何节点不能与十三个骨骼名称冲突，例如手掌 Mesh 应命名 HandMesh_R，而不是 Hand_R。

## 动画与 Pose

rig=humanoid.v2 的 timeline / pose 可以旋转全部十三个骨骼。旋转为绝对局部 Euler XYZ 角度，运行时编译为 Quaternion；不限制为单轴，制作人负责可用姿势。仍只有 Body 支持单轴 ±0.2 米的 position 增量，禁止肘、腕、膝、Root 等节点位移。Pose 引用必须与动画 rig 完全一致。

idle / walk / run generator 也接受 v2，但仍只生成原来的肩、髋、Body 摆动，不自动生成屈肘或屈膝；新增关节保持默认姿态。需要这些细节时使用 timeline。

## 兼容与播放

| 目标模型 | 动画 | 支持情况 |
| --- | --- | --- |
| v1 | v1 | 原样支持，三字段完全一致 |
| v2 | v2 | 原生支持，三字段完全一致 |
| v2 | v1 | 显式单向适配；保留旧轨道并补齐默认关节 |
| v1 | v2 | 拒绝，不能丢弃缺失关节轨道冒充兼容 |
| 任意 humanoid | FPS / static / 错误或缺失签名 | 拒绝 |

预览器的 ForgeRuntime.compatible 仍只检查 rigId / rigVersion / rigSignature 完全一致。新增 compatibility(modelMeta, animationMeta) 返回 exact、humanoid-v1-to-v2 或 null。桥接仅白名单允许编译器发布的 v1、v2 两个完整签名，不能仅比较名称或跳过版本。

加载模型后立即调用 captureRestPose(model.scene)。prepareClip 会复制片段，以缓存的模型默认平移校正 canonical-local 的 Body.position；对 v2 模型补齐缺失的十三节点旋转以及缺失的 Body.position。新增关节在播放旧动画时保持参考姿态；由 v2 动作 crossfade 回旧片段时能平滑回到默认值，不残留屈肘、转腕和屈膝。prepareClip 的补齐发生在内存，不修改原 GLB。

停止或直接切换：先 mixer.stopAllAction()、mixer.uncacheRoot(model.scene)，再 restoreRestPose(model.scene)。交叉混合时不要恢复正在播放的模型；使用在模型加载时缓存的 rest 和预处理完成的两段 clip 进行混合。切换 None 应恢复参考姿态。

旧动画适配保持旧运动，不自动生成新关节细节；武器穿插、地面间隙、事件时刻仍须按角色制作和验证。集成示例见 [运行时使用说明](RUNTIME_ASSET_USAGE.md)。游戏项目尚未接入敌人动画系统，不能将工具链适配视为 Gameplay 已实现。

## 炎巫迁移

炎巫资产 ID、路径、材质、99 个几何部件、20,436 三角形及三个装备插槽名称不变。几何与插槽参考姿态的世界矩阵保持不变；仍约 2.16 米、长袍、驼背，无腿脚几何。

- Forearm_L/R 的 position=[±0.28,0.07,0.09]，相对 Arm_L/R。
- Hand_L/R 的 position=[±0.29,0.09,0.07]，相对 Forearm_L/R；腕点相对上臂为 [±0.57,0.16,0.16]。
- 原 Forearm_L/R、Hand_L/R 几何改名 ForearmMesh_L/R、HandMesh_L/R，分别挂到对应新骨骼。手指几何跟随 Hand，无手指关节。
- Staff_Grip_R 改挂 Hand_R，局部 position=[−0.065,0.02,0.02]、rotation=[0,0,−90]；握点及所有法杖子节点的参考世界位置不变。
- Leg 和 LowerLeg 均无几何；长袍挂 Body，不随膝部旋转，不存在布料模拟。

审阅页 `.qa/flame-witch-preview.html` 提供右肘/右腕滑条及屈肘竖杖静态演示。这些不是正式动画；C3 当前已交付 Attack、Charge、FlameRoar、TeleportRecover 四段专用动画；专用 Idle、移动、Hit、Death 仍待制作。详见 [动画说明](../assets/FSA(项目使用)/docs/FLAME_WITCH_ANIMATIONS_V1.md)。

## 验证

执行正式 validate / build、`node --test tests/*.test.js`。迁移验证记录在 `.qa/flame-witch-v2-migration-report.json`，包含参考姿态与十段旧共用动画的几何/插槽对照，以及其余 62 个 GLB 的逐字节未变检查。原离线预览器已检查十段旧共用动画在炎巫上的播放和 None 恢复。`tests/humanoid-v2.test.js` 覆盖固定层级、Schema、Pose、GLB 往返、手腕与膝轨道、单向兼容拒绝规则、Body 重定基准、crossfade 与复位。
