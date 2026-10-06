# B1 追猎者模型

## 交付文件

- 源定义：`definitions/models/characters/enemies/elite/FSA_ENEMY_B001_Pursuer.model.json`
- 成品：`generated/models/characters/enemies/elite/FSA_ENEMY_B001_Pursuer.glb`
- 资产 ID：`FSA_ENEMY_B001_Pursuer`；不会覆盖 A1 疫鬼。

模型沿用简约低多边形风格，以更宽的肩甲、前探的头部、长臂利爪、坚实下肢和橙色胸部标记区分普通疫鬼。它属于无元素精英；追击速度、生命、伤害与精英倍率只由游戏配置决定，外观颜色不提供玩法规则。

## 接入约定

米制，+Y 向上，+Z 朝前，脚底中心为放置基准。骨架与现有角色一致：`humanoid.v1` 的 Root、Body、Head、Arm_L、Arm_R、Leg_L、Leg_R。可按同名节点绑定 `generated/animations/characters/shared/` 的 Idle、Walk、Run、Attack、Hit、Death；Interact 也可播放。全部为原地动作，模型没有额外骨骼、Root Motion 或独立爪部动作。追击、转向与攻击判定由游戏处理。

## 验证与重建

2026-10-02：当前整个 FSA 定义库 51 份校验和编译通过；追猎者在原预览器中与七段首批角色共用动画逐一加载，未出现浏览器异常，Idle 和 Run 画面已检查。重建时在 ForgeKit 根目录运行：

```powershell
node tools/validator/validate.js "assets/FSA(项目使用)/definitions"
node tools/compiler/build.js "assets/FSA(项目使用)/definitions"
```

编译器直接输出到本库 generated，保留分类子目录。完成后按 ASSET_RULES_FOR_AI.md 同步游戏项目 Assets 与资产配置表，无需旧 .qa 同步脚本。
