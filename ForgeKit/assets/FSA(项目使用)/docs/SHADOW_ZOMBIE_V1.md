# A3 影·疫鬼模型

## 交付文件

- 源定义：`definitions/models/characters/enemies/common/FSA_ENEMY_A003_ShadowZombie.model.json`
- 成品：`generated/models/characters/enemies/common/FSA_ENEMY_A003_ShadowZombie.glb`
- 资产 ID：`FSA_ENEMY_A003_ShadowZombie`；不覆盖 Zombie A/B。

模型为米制，+Y 向上，+Z 朝前，脚底中心为放置基准。外观使用更窄的胸腰、细长四肢、前探的兜帽、肩背尖刺与长爪，跑动时与 A1 疫鬼区分。紫色眼睛及胸口发光仅是视觉标记；速度、伤害、生命、防御及影元素效果均由游戏配置。

## 动画接入

保持 `humanoid.v1` 七节点层级与现有参考比例，直接绑定 `generated/animations/characters/shared/` 中的 Idle、Walk、Run、Attack、Hit、Death 六段同名节点动画。Interact 也兼容，但 A3 战斗行为通常不需要。动画均为原地播放，位移、朝向、命中窗口和攻击范围由游戏处理。爪部几何随 Arm_L/Arm_R 运动，无独立手指节点。

## 分类约定

敌人模型分别放 `characters/enemies/common/`（小怪）、`elite/`（精英）、`boss/`（首领）；仅创建有资产的目录。Zombie A/B 也已迁入 `common/`。

## 验证与重建

2026-10-02：模型在原预览器中依次加载七段首批角色共用动画，均可播放且无浏览器异常；Idle 与 Run 的画面已检查。当前整个 FSA 定义库 51 份通过 ForgeKit 校验及编译。重建命令：

```powershell
node tools/validator/validate.js "assets/FSA(项目使用)/definitions"
node tools/compiler/build.js "assets/FSA(项目使用)/definitions"
```

编译器直接输出到本库 generated，保留分类子目录。完成后按 ASSET_RULES_FOR_AI.md 同步游戏项目 Assets 与资产配置表，无需旧 .qa 同步脚本。
