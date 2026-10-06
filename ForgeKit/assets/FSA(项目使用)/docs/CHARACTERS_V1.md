# 敌人、NPC 与共用基础动画 V1

首批三种模型采用简约方块风格、米制、+Y 向上、+Z 朝前，默认参考姿态为 T Pose。骨骼统一为 `humanoid.v1` 的 Root、Body、Head、Arm_L、Arm_R、Leg_L、Leg_R 七节点，与 FPS 双臂骨骼独立。

| 名称 | 资产 ID | 外观 |
| --- | --- | --- |
| 丧尸 A | FSA_ENEMY_A001_ZombieA | 灰绿色皮肤和旧衣，胸背倾斜、头部前伸，轻微驼背 |
| 丧尸 B | FSA_ENEMY_A002_ZombieB | 褐色工装，右手直接握持木柄金属斧 |
| 商人罗德 | FSA_NPC_001_Rod | 棕色外套、帽子、灰白胡须、斜挎包 |

敌人源文件位于 `definitions/models/characters/enemies/common/`，GLB 位于对应的 `generated` 目录；罗德仍位于 `characters/npcs/`。丧尸 A 的驼背由外观部件表达，切换共用动画后仍保留。斧头直接属于丧尸 B 的 HandR → Arm_R 层级，无额外骨骼，无需挂载武器。

## 共用动画

全部使用 `FSA_ANIM_Character_` 前缀，源文件位于 `definitions/animations/characters/shared`，GLB 位于 `generated/animations/characters/shared`。

| 动作 | 秒数 | 循环 | 内容 |
| --- | ---: | --- | --- |
| Idle | 2.4 | 是 | 轻微呼吸和手臂摆动 |
| Walk | 1.15 | 是 | 对侧摆臂迈步 |
| Run | 0.72 | 是 | 前倾、加大步幅和摆臂 |
| Attack | 1.1 | 否 | 右手抬起并向前下方挥击，空手和持斧共用 |
| Hit | 0.65 | 否 | 头部后仰、手臂受击反应并恢复，双腿稳定 |
| Death | 1.6 | 否 | 向后倒地，末帧保持 |
| Interact | 1.8 | 否 | 点头、右手向前示意并收回 |

均为原地动画，不驱动角色世界位移。七节点方案没有肘、膝或手指关节，因此四肢作为整体摆动。游戏接入时循环 Idle/Walk/Run，其他动作单次播放；Death 应保持末帧。Attack 可在约 0.46 秒触发命中检测，Interact 可在约 0.8 秒触发交互反馈；这些是接入建议，GLB 不包含伤害或交易逻辑。

## 原预览器

打开 `ForgeKit/previewer/index.html`，重新选择本资产库的 **generated** 目录，模型选 `characters/enemies` 或 `characters/npcs` 下对应角色，动画选 `characters/shared` 下对应片段。动画 None 显示 T Pose；查看日常站姿请选择 Idle。角色没有 FPS 相机点位，使用自由相机；丧尸 B 自带斧头，无需选择“预览武器”。

## 验证与重建

当前全库 51 份定义通过校验与编译。首批三个模型与七段动画的七节点结构、兼容性、循环首尾、死亡末帧和全部 21 种组合曾完成自动及预览器检查；后续 A3、A4、B1～B3 模型见各自说明。源定义是后续编辑依据。

在 ForgeKit 根目录执行：

```powershell
node tools/validator/validate.js "assets/FSA(项目使用)/definitions"
node tools/compiler/build.js "assets/FSA(项目使用)/definitions"
node --test --test-reporter=dot tests/*.test.js
```

编译器直接输出到本库 generated，保留分类子目录。完成后按 ASSET_RULES_FOR_AI.md 同步游戏项目 Assets 与资产配置表，无需旧 .qa 同步脚本。

## 本轮细节优化

Attack 与 Hit 固定 Body、Root 和双腿姿态，动作集中在手臂和头部，避免七节点父子层级造成整条腿随躯干摆动。其他五段动画保持原定义。三个角色躯干收窄至 0.32 米、肩部保留 0.45 米，腰带和衣袋同步收窄；双臂外观向外错开约 0.035 米，保留肩部连接及手臂间隙。

