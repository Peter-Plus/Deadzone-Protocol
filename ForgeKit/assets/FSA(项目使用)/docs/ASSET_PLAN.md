# 首版资产计划

本文件保留首版规划时的历史状态；当前交付数量与路径以 FSA 根目录 `README.md` 和 `generated/模型资产使用说明.md` 为准。

最新修订：所有武器改挂 Weapon_R，Weapon_L 仅作左手支撑参考，新增 Camera_FPS。动画与事件配置现已迁移至右手；下面的旧左手持枪记录暂作历史参考。当前规则以 FPS_ARMS_V1.md 为准。

状态：用户已确认开始武器制作，以下九件武器已生成模型定义及 GLB，并通过校验、编译和原预览器加载检查。名字沿用目录阶段方案，可按后续反馈修改。独立 FPS 双臂模型已制作；23 段 FPS 动画已制作，角色、环境及角色动画尚未制作。

## 九种武器

| 生成顺序 | 类型 | 首件目录名 | 暂定中文名 |
| --- | --- | --- | --- |
| 0 | AR 突击步枪 | AR_001_Vanguard | 先锋 |
| 1 | SMG 冲锋枪 | SMG_001_Swift | 迅影 |
| 2 | LMG 轻机枪 | LMG_001_Bastion | 壁垒 |
| 3 | DMR 精确射手步枪 | DMR_001_Sentinel | 哨卫 |
| 4 | SR 狙击步枪 | SR_001_Longwatch | 远望 |
| 5 | Shotgun 霰弹枪 | Shotgun_001_Breacher | 破门者 |
| 6 | Pistol 手枪 | Pistol_001_Sidekick | 副手 |
| 7 | Melee 近战 | Melee_001_Fang | 獠牙 |
| 8 | Throwable 投掷物 | Throwable_001_Thunder | 雷鸣 |

每类首版只做一件；后续添加 002、003 等独立目录，不覆盖旧资产。本批近战采用战术刀，投掷物采用手雷，整体使用简洁几何硬表面风格。

## 坐标和唯一固定点

- 全库遵循米制、+Y 上、+X 右、+Z 正面。武器原点位于主握点，首版约定朝向沿 +Z，生成后以实际第一人称视角校准。
- 单固定点方案：武器资产原点就是唯一装配锚点，不额外建立第二个握持点。FPS 手臂设置 Weapon_L（Forearm_L，枪类）与 Weapon_R（Forearm_R，近战/投掷），每件装备只使用所属插槽。
- 游戏运行时把枪类原点对齐 Weapon_L、近战/投掷原点对齐 Weapon_R；跨模型挂接不由模型 JSON 自动完成。必要的静态装配偏移由游戏侧记录，不引入第二个固定点。
- 枪类统一左手主握位置及右手握持空间；右手仅视觉配合，枪类不创建第二个武器绑定或 IK；右手插槽仅用于近战/投掷。不同枪身需要围绕同一双手持握模板设计，手枪等体积差异较大时允许外观妥协，后续可加入专用动作。
- 武器保持静态模型。首版换弹、拉栓只模拟手臂动作；V1 动画不能驱动弹匣、枪机等武器 Part 独立运动。

## FPS 手臂

玩家 FPS 资产仅包含独立双臂/双手，与敌人和 NPC 的七节点人形骨架无直接关系。不使用隐藏头、身体、腿的七节点人形来替代独立双臂资产。七节点骨架约束仅用于敌人和 NPC。

FPS 双臂现已使用独立 fps-arms.v1：Root 容器下，左、右各 UpperArm → Forearm 两个关节；每个关节仅一个本地 X 轴旋转自由度。手掌固定随 Forearm，无手指/手腕骨骼。Weapon_L 挂 Forearm_L，Weapon_R 挂 Forearm_R。

模型名为 FSA_FPS_Arms_001_Base，灰绿色袖管、黑色块状手套；肩部及肘部为固定长度的两杆结构。工具链已补充独立骨架、校验和编译支持，原预览器可直接加载。详见 FPS_ARMS_V1.md。

首版 FPS 动画仍按下方四类规划，枪类共用一套，23 段已完成。采用双臂专用 timeline，不能套用七节点人形 walk/run 生成器。

## 动画清单

| 目录 | 动作文件名中的动作项 | 数量 |
| --- | --- | --- |
| fps/unarmed | Idle、Walk、Run | 3 |
| fps/firearm/shared | Idle、Walk、Run、Fire、Reload、Holster、Draw、Bolt | 8 |
| fps/melee/shared | Idle、Walk、Run、Attack、Holster、Draw | 6 |
| fps/throwable/shared | Idle、Walk、Run、Throw、Holster、Draw | 6 |
| characters/shared | Idle、Walk、Run、Attack、Hit、Death、Interact | 7 |

首版共规划 30 段动画，当前已完成 23 段 FPS 动画，7 段角色动画尚未生成。FPS 类别名使用 Unarmed / Firearm / Melee / Throwable。Idle、Walk、Run 循环；其余默认单次，具体交互以后按需要扩展。

- 七类枪先共用一套八段动作，不按枪种复制。换枪由 Holster → 更换装备 → Draw 组合，不另建 Switch 动画。
- 按本项目要求，DMR 与 SR 每次 Fire 后播放 Bolt；其他枪不默认触发。此规则按用户需求执行，不以现实武器机构替代。
- 近战、投掷物各用自己的共享动作，不逐件细分；后续在 overrides 添加专用动作即可，现阶段留空。
- 投掷时脱离插槽、生成投射物，换弹时更新弹药，以及攻击命中、死亡后行为，都由运行时在约定时刻处理。现有动画 schema 无事件字段，不添加自定义事件字段。
- 角色动画按现有规则采用 In Place，不支持 Root Motion、IK 或连续蒙皮。FPS 首版同样按原地动作和无 IK 的简化目标规划，其骨架与导出规范独立确定，不套用七节点限制。

## 敌人与 NPC

模型分别放 enemies、npcs，动画统一放 characters/shared，不拆敌人/NPC 两套。共用相同七节点骨架和首版尺度；体型变化之后验证动作兼容性。

持武器 NPC 在生成时直接将武器外观 Part 挂到对应 Arm 骨骼或其手部 Part，属于 NPC 模型的一部分，无需动态装备系统或额外骨骼。武器部件 id 必须在该 NPC 内唯一。模型可共用动画，但持武器角色的攻击仅保证基础动作可用，不保证精细武器操作。

## 环境

- architecture：墙、地板、门窗、建筑模块等。
- props：箱体、家具、路障等场景道具。
- nature：树木、石块等自然物。
- decals：规则支持的 plane 几何标记等；不暗示已有贴图或引擎贴花支持。

首版环境清单、数量、风格尚未指定，只预留分类目录。建筑原点放底面中心；只使用规则允许的基本几何及材质字段。

## 后续接入

本批每件武器以资产原点作为唯一固定点，不额外导出具名 Socket。枪类原点对齐 Weapon_L，右手视觉配合；近战/投掷原点对齐 Weapon_R，由右手完成主动作。FPS 双臂基础模型已制作，肩间距已恢复至 0.40m，四类动作采用不同手距；当前采用粗粒度握持近似，不保证对每种武器精确接触。

FPS 动画交付与接入时刻见 FPS_ANIMATIONS_V1.md 及 FPS_ANIMATION_EVENTS.json。
