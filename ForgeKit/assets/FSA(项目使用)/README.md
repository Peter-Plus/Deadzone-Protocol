# FSA 项目资产库

当前双臂已改为右手持枪，并新增 Camera_FPS。原预览器新增“使用相机点位”“隐藏地面”。持枪动画已适配右手；原预览器新增“预览武器”，直接挂 Weapon_R。详见 docs/FPS_ARMS_V1.md。

首批九类武器已各完成一件：七类枪、战术刀和手雷。源定义位于 `definitions/models/weapons`，GLB 位于 `generated/models/weapons`。独立 FPS 双臂模型也已完成，位于 `definitions/models/fps_arms` 和 `generated/models/fps_arms`；说明见 `docs/FPS_ARMS_V1.md`。23 段 FPS 双臂动画已完成，见 `docs/FPS_ANIMATIONS_V1.md`；首批三个七节点角色与七段共用基础动画见 `docs/CHARACTERS_V1.md`。新增 A3 影·疫鬼、B1 追猎者、B2 爆裂斧手、A4 炎·疫鬼及 B3 毒箭手见 `docs/SHADOW_ZOMBIE_V1.md`、`docs/PURSUER_V1.md`、`docs/BURST_AXEMAN_V1.md`、`docs/FLAME_ZOMBIE_V1.md`、`docs/POISON_ARCHER_V1.md`。共用循环蓄力见 `docs/CHARACTER_CHARGE_V1.md`；环境资产尚未生成。

预览：双击 ForgeKit 的 `previewer/index.html`，点击“选择资产目录”，选择本目录下的 **`generated`**，从模型下拉列表切换武器，动画保持 None。不要选择 FSA 根目录或 models 子目录。无需启动服务器。已用本地浏览器逐件加载验证。

预览器地面已调整为不高于模型底部，避免主握点位于原点的武器被地面遮挡；资产坐标未移动。成品清单见 `docs/WEAPONS_V1.md`。

规则来源：`../../rules/ASSET_RULES_FOR_AI.md`。本说明是项目组织约定，不扩展 ForgeKit V1 schema。

## 目录

```text
definitions/
  models/
    weapons/{类型}/{类型_编号_名字}/
    fps_arms/
    characters/{enemies,npcs}/
    characters/enemies/{common,elite}/  普通敌人、精英；首领预留 boss/
    environment/{architecture,props,nature,decals}/
  animations/
    fps/unarmed/
    fps/firearm/{shared,overrides}/
    fps/melee/{shared,overrides}/
    fps/throwable/{shared,overrides}/
    characters/{shared,overrides}/
  poses/{fps,characters}/
  materials/
generated/
  models/       与 definitions/models 对应的分类目录
  animations/   与 definitions/animations 对应的分类目录，FPS 23 段已生成
docs/
  ASSET_PLAN.md
```

`definitions` 是后续唯一手工编辑的资产源；`generated` 只放编译产物。空目录暂不放占位资产。环境子类为初步分类，实际清单待场景需求确定。

敌人按 `common/`（小怪）、`elite/`（精英）、`boss/`（首领）分级。A1～A4 编号为 `A001`～`A004`，归入 `common/`；B1～B3 编号为 `B001`～`B003`，归入 `elite/`。旧编号与旧路径不再使用。

## 命名

- 武器模型文件：`FSA_WPN_<类型>_<三位编号>_<英文名字>.model.json`，asset id 与文件主名相同，例如 `FSA_WPN_AR_001_Vanguard`。
- 类型：`AR`、`SMG`、`LMG`、`DMR`、`SR`、`Shotgun`、`Pistol`、`Melee`、`Throwable`。每类编号独立递增，001 是第一件，目录名不代表生成顺序编号。
- 敌人模型采用 `FSA_ENEMY_<策划等级字母><三位编号>_<英文名字>`，例如 `FSA_ENEMY_A001_ZombieA`、`FSA_ENEMY_B001_Pursuer`；其他模型示例有 `FSA_NPC_001_Survivor`、`FSA_ENV_Prop_001_Crate`。
- 动画：`FSA_ANIM_FPS_<类别>_<动作>.anim.json`；角色共用动画：`FSA_ANIM_Character_<动作>.anim.json`。
- 武器专用动画放对应 `overrides/<武器目录名>/`；角色专用动画按类别和角色分层；魅影放 `animations/characters/overrides/bosses/phantom/`；可复用的 Cast/Shoot 放 `animations/characters/shared/`，文件名和 id 包含敌人代号与名字。共享优先、专用覆盖的选择由游戏逻辑实现，不是 ForgeKit 内置功能。
- Pose / 材质使用 `FSA_POSE_` / `FSA_MAT_` 前缀和规定后缀。所有 asset id 以字母开头，只含字母、数字、`_ . -`，长度不超过 96，整个资产库唯一。
- asset id 在库内唯一；编译保留分类子目录，输出路径不得冲突。

## 编译与交付

本目录是正式项目资产库；测试与历史预览资产放在同级 legacy，不参与项目交付。

在 ForgeKit 根目录运行：

```powershell
node tools/validator/validate.js
node tools/compiler/build.js
```

默认处理本库 definitions，直接输出到本库 generated，保留分类子目录，无需经过扁平输出或旧 .qa 同步脚本。完成后必须将变更 GLB 同步到 Deadzone Protocol/Assets，并更新该目录的模型动画资产配置表.md；使用契约变化时更新模型资产使用说明.md。具体流程见 ../../rules/ASSET_RULES_FOR_AI.md。

## humanoid.v2 十三节点（2026-10-05）

炎巫已升级十三节点，外观保持不变，手腕与肘部可分别旋转；其余既有模型和动画继续使用原骨架。旧七节点动画通过 ForgeRuntime 的显式单向适配驱动炎巫，新模型的专用动画应标注 humanoid.v2。详见 [骨架契约](../../rules/HUMANOID_V2.md) 与 [炎巫说明](docs/FLAME_WITCH_V1.md)。

炎巫六段专用动画位于 `animations/characters/overrides/bosses/flame_witch/`，使用 humanoid.v2：普攻、循环蓄力、炎魔咆哮后段、业火转移后摇、受击、死亡。事件与时序见 [炎巫动画说明](docs/FLAME_WITCH_ANIMATIONS_V1.md)。
