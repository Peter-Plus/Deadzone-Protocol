# B2 爆裂斧手模型

## 交付文件

- 源定义：`definitions/models/characters/enemies/elite/FSA_ENEMY_B002_BurstAxeman.model.json`
- 成品：`generated/models/characters/enemies/elite/FSA_ENEMY_B002_BurstAxeman.glb`
- 资产 ID：`FSA_ENEMY_B002_BurstAxeman`；不会覆盖 A2 的 Zombie B。

以 A2 的 1.8 米参考体型为基础，B2 的骨架高度设为 2.34 米，即约 1.3 倍。上身为裸露的焦岩皮肤，胸、背、臂、腿有橙色熔岩裂纹，局部深色块表现硬化表皮。下身保留破旧裤装和靴。大斧已内置于右手 HandR 外观部件，不需要运行时再挂一把斧头。

## 接入约定

米制，+Y 向上，+Z 朝前，脚底中心为放置基准。模型仍使用 `humanoid.v1` 七节点骨架，与 `generated/animations/characters/shared/` 的 Idle、Walk、Run、Attack、Hit、Death 同名节点兼容；Interact 亦可播放。模型部件为刚性几何，没有额外肘、膝、手指或斧头动画。攻击判定、碰撞体、速度、伤害、精英倍率及火元素相关 Gameplay 均由游戏配置。熔岩与斧刃发光不会自动造成灼烧或爆炸。

## 验证与重建

2026-10-02：当前全 FSA 定义库 51 份通过 ForgeKit 校验、编译。原预览器曾验证首批六个角色与七段共用动画的 42 种组合；B2 的 Idle 与 Attack 画面已检查，右手内置斧随 Attack 运动。重建时在 ForgeKit 根目录运行：

```powershell
node tools/validator/validate.js "assets/FSA(项目使用)/definitions"
node tools/compiler/build.js "assets/FSA(项目使用)/definitions"
```

编译器直接输出到本库 generated，保留分类子目录。完成后按 ASSET_RULES_FOR_AI.md 同步游戏项目 Assets 与资产配置表，无需旧 .qa 同步脚本。
