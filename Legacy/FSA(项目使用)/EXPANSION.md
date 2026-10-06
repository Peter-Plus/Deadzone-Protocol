# 安黛尔、乔与近战 / 投掷资产

- **安黛尔**：灰蓝野外装、赤褐马尾与暖色围巾。
  - 定义：`definitions/models/characters/player/andel.model.json`
  - 输出：`generated/models/characters/player/andel.glb`
- **乔**：黑色战术装、装甲背心、头盔、护目镜与面罩。
  - 定义：`definitions/models/characters/player/joe.model.json`
  - 输出：`generated/models/characters/player/joe.glb`
- **匕首**：深色防滑握柄、双刃短刀造型。
  - 定义：`definitions/models/weapons/melee/melee_dagger.model.json`
  - 输出：`generated/models/weapons/melee/melee_dagger.glb`
- **军用手斧**：短柄战术斧、深色骨架与银灰刃口。
  - 定义：`definitions/models/weapons/melee/melee_military_hatchet.model.json`
  - 输出：`generated/models/weapons/melee/melee_military_hatchet.glb`
- **手雷**：橄榄绿色分块弹体、外观拉环与压柄。
  - 定义：`definitions/models/weapons/throwables/throwable_grenade.model.json`
  - 输出：`generated/models/weapons/throwables/throwable_grenade.glb`

## 动画与挂载

安黛尔、乔采用与劳恩一致的 humanoid.v1 七节点骨架和 1.8 米基础比例，左臂 weapon_mount 插槽一致；直接复用原有 26 段动画，无需复制动画文件，无 IK。

匕首和军用手斧各只有 grip_main，原点为握持点；可挂到角色左臂 weapon_mount，使用现有 arms/melee。

手雷为纯外观静态模型，只有 grip_main。已有 arms/throw 挥动右臂，所以实际投掷时由表现层临时挂到右臂末端，或直接从该位置生成投掷物；不要让左臂持有的手雷跟随右臂投掷。右臂挂点可运行时创建，不改七节点骨架，也不增加武器握持点。投掷物速度、碰撞、爆炸、伤害由游戏实现。

## 校验

新增 5 个模型均通过 ForgeKit 全库校验及 GLB 导出；两个角色分别验证全部 26 段已导出动画兼容及关键帧采样；3 件手持资产均验证唯一握持点与原点、朝向。

预览：`.qa/expansion-preview.html`。
