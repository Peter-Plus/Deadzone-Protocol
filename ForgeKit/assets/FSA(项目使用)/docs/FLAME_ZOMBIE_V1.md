# A4 炎·疫鬼模型与施法动作

## 交付文件

- 模型源定义：`definitions/models/characters/enemies/common/FSA_ENEMY_A004_FlameZombie.model.json`
- 模型成品：`generated/models/characters/enemies/common/FSA_ENEMY_A004_FlameZombie.glb`
- 施法源定义：`definitions/animations/characters/shared/FSA_ANIM_Character_Cast.anim.json`
- 施法成品：`generated/animations/characters/shared/FSA_ANIM_Character_Cast.anim.glb`

模型采用 `humanoid.v1`，米制，+Y 向上、+Z 朝前，脚底中心为放置基准。骨架高度 1.62 米，为 A1/A2 基础高度 1.8 米的 0.9 倍。右手内置短法杖，不再额外挂杖；杖端 Socket `Fireball_Muzzle` 是火球生成位置。生成投射物时先读取该 Socket 的世界位置，飞行方向由瞄准目标或角色朝向决定。

## 动画映射

| 用途 | 片段 | 播放 |
| --- | --- | --- |
| 待机、移动、受击、死亡 | `animations/characters/shared/` 的 Idle、Walk、Run、Hit、Death | 前三者循环，后两者单次 |
| 通用蓄力 | `animations/characters/shared/FSA_ANIM_Character_Charge.anim.glb` | 按技能配置循环 |
| 远程施法 | `animations/characters/shared/FSA_ANIM_Character_Cast.anim.glb` | 单次，1.12 秒 |

Cast 与基础 Attack 都由右臂先举起再前挥。Cast 在约 0.56 秒到正前方，保持至 0.84 秒，约 0.92 秒轻抖作为发射提示；不继续挥过正前方。游戏建议在动画本地时间 **0.92 秒**生成火球并消费攻击事件，每次播放只触发一次。所有动作原地播放；施法范围、火球命中和灼烧由 Gameplay 配置，模型的火色材质不产生规则。

2026-10-02：模型与 Idle、Cast 已在 ForgeKit 原预览器中检查；全 FSA 定义库 51 份通过校验、编译。
