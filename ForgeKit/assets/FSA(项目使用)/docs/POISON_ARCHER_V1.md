# B3 毒箭手模型与射击动作

## 交付文件

- 模型源定义：`definitions/models/characters/enemies/elite/FSA_ENEMY_B003_PoisonArcher.model.json`
- 模型成品：`generated/models/characters/enemies/elite/FSA_ENEMY_B003_PoisonArcher.glb`
- 射击源定义：`definitions/animations/characters/shared/FSA_ANIM_Character_Shoot.anim.json`
- 射击成品：`generated/animations/characters/shared/FSA_ANIM_Character_Shoot.anim.glb`

模型采用 `humanoid.v1`，米制，+Y 向上、+Z 朝前，脚底中心为放置基准，骨架高度 1.8 米，与 A1/A2 基础体型相同。弓及预装箭 `Arrow_Nocked` 均内置在右手，不再另挂弓。箭杆沿右臂局部 -X 方向；右臂瞄准时箭头朝模型 +Z 前方。Socket `Arrow_Muzzle` 位于箭头前方，供游戏读取发射起点。

## 动画映射与发射

| 用途 | 片段 | 播放 |
| --- | --- | --- |
| 待机、移动、受击、死亡 | `animations/characters/shared/` 的 Idle、Walk、Run、Hit、Death | 前三者循环，后两者单次 |
| 通用蓄力 | `animations/characters/shared/FSA_ANIM_Character_Charge.anim.glb` | 按技能配置循环 |
| 射击 | `animations/characters/shared/FSA_ANIM_Character_Shoot.anim.glb` | 单次，0.88 秒 |

Shoot 在约 0.31 秒让右臂瞄准前方，左臂伸向弓弦并在约 0.39～0.62 秒作拉弦动作；约 **0.71 秒**双臂轻抖表示发射。这段动作比 A4 的 1.12 秒施法短。游戏在每次播放的 0.71 秒读取 `Arrow_Muzzle` 世界位置，按目标方向生成投射物并隐藏模型内的 `Arrow_Nocked` 节点及其子节点；下一次射击前恢复显示。七节点骨架没有独立手指或可动画弓弦，弓弦本身保持静态。箭矢判定、飞行、毒伤时间和 HP/SP 数值由 Gameplay 配置，绿色材质不自动附毒。

2026-10-02：模型与 Idle、Shoot 已在 ForgeKit 原预览器中检查；全 FSA 定义库 51 份通过校验、编译。
