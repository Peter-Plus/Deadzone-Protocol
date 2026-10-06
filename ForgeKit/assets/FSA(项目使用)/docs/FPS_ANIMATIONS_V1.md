# FPS 双臂动画 · 右手持物版

23 段动画全部匹配当前 fps-arms.v1。枪类、近战和投掷物统一挂 Weapon_R，空手不挂武器；Weapon_L 只作左手支撑参考。枪类 8 段已从旧左手主动作迁移为右手主握，左手辅助换弹/拉栓；其余 15 段保留现有右手/空手动作。

持枪准备角为 UpperArm_L=-15、Forearm_L=40、UpperArm_R=0、Forearm_R=0，与模型默认 rigPose 一致。模型基础左掌在右掌前约 9cm、下约 3.4cm；持枪动画另加专用摆位，左臂向画面右侧 11cm、向前 6cm，使持枪左掌最终前约 15cm，两手横向基本对齐，枪位于画面右侧。Camera_FPS 不随手臂运动。

## 原预览器使用

1. 刷新 ForgeKit/previewer/index.html，重新选择 FSA(项目使用)/generated。
2. 模型选 fps_arms/FSA_FPS_Arms_001_Base.glb。
3. “预览武器”选择需要的枪、刀或手雷；自动挂 Weapon_R，None 移除挂件。下拉列表识别路径或文件名含 weapon/FSA_WPN_ 的模型，并验证它是 static。
4. 选择相应类别动画，勾选“使用相机点位”和“隐藏地面”检查 FPS 视角。动画 None 恢复默认姿态；武器 None 与动画 None 相互独立。
5. 切换武器不会停止当前动画；重载模型后重新挂入所选武器。没有 Weapon_R 的模型会禁用武器选项。

## 成品清单

| 类别 | 动作 | 时长（秒） | 循环 | 成品 |
| --- | --- | ---: | --- | --- |
| Unarmed | Idle | 2.40 | 是 | [GLB](../generated/animations/fps/unarmed/FSA_ANIM_FPS_Unarmed_Idle.anim.glb) |
| Unarmed | Walk | 0.90 | 是 | [GLB](../generated/animations/fps/unarmed/FSA_ANIM_FPS_Unarmed_Walk.anim.glb) |
| Unarmed | Run | 0.62 | 是 | [GLB](../generated/animations/fps/unarmed/FSA_ANIM_FPS_Unarmed_Run.anim.glb) |
| Firearm | Idle | 2.40 | 是 | [GLB](../generated/animations/fps/firearm/shared/FSA_ANIM_FPS_Firearm_Idle.anim.glb) |
| Firearm | Walk | 0.90 | 是 | [GLB](../generated/animations/fps/firearm/shared/FSA_ANIM_FPS_Firearm_Walk.anim.glb) |
| Firearm | Run | 0.62 | 是 | [GLB](../generated/animations/fps/firearm/shared/FSA_ANIM_FPS_Firearm_Run.anim.glb) |
| Melee | Idle | 2.40 | 是 | [GLB](../generated/animations/fps/melee/shared/FSA_ANIM_FPS_Melee_Idle.anim.glb) |
| Melee | Walk | 0.90 | 是 | [GLB](../generated/animations/fps/melee/shared/FSA_ANIM_FPS_Melee_Walk.anim.glb) |
| Melee | Run | 0.62 | 是 | [GLB](../generated/animations/fps/melee/shared/FSA_ANIM_FPS_Melee_Run.anim.glb) |
| Throwable | Idle | 2.40 | 是 | [GLB](../generated/animations/fps/throwable/shared/FSA_ANIM_FPS_Throwable_Idle.anim.glb) |
| Throwable | Walk | 0.90 | 是 | [GLB](../generated/animations/fps/throwable/shared/FSA_ANIM_FPS_Throwable_Walk.anim.glb) |
| Throwable | Run | 0.62 | 是 | [GLB](../generated/animations/fps/throwable/shared/FSA_ANIM_FPS_Throwable_Run.anim.glb) |
| Firearm | Fire | 0.26 | 否 | [GLB](../generated/animations/fps/firearm/shared/FSA_ANIM_FPS_Firearm_Fire.anim.glb) |
| Firearm | Reload | 1.45 | 否 | [GLB](../generated/animations/fps/firearm/shared/FSA_ANIM_FPS_Firearm_Reload.anim.glb) |
| Firearm | Bolt | 0.62 | 否 | [GLB](../generated/animations/fps/firearm/shared/FSA_ANIM_FPS_Firearm_Bolt.anim.glb) |
| Melee | Attack | 0.72 | 否 | [GLB](../generated/animations/fps/melee/shared/FSA_ANIM_FPS_Melee_Attack.anim.glb) |
| Throwable | Throw | 0.80 | 否 | [GLB](../generated/animations/fps/throwable/shared/FSA_ANIM_FPS_Throwable_Throw.anim.glb) |
| Firearm | Holster | 0.42 | 否 | [GLB](../generated/animations/fps/firearm/shared/FSA_ANIM_FPS_Firearm_Holster.anim.glb) |
| Firearm | Draw | 0.42 | 否 | [GLB](../generated/animations/fps/firearm/shared/FSA_ANIM_FPS_Firearm_Draw.anim.glb) |
| Melee | Holster | 0.34 | 否 | [GLB](../generated/animations/fps/melee/shared/FSA_ANIM_FPS_Melee_Holster.anim.glb) |
| Melee | Draw | 0.34 | 否 | [GLB](../generated/animations/fps/melee/shared/FSA_ANIM_FPS_Melee_Draw.anim.glb) |
| Throwable | Holster | 0.34 | 否 | [GLB](../generated/animations/fps/throwable/shared/FSA_ANIM_FPS_Throwable_Holster.anim.glb) |
| Throwable | Draw | 0.34 | 否 | [GLB](../generated/animations/fps/throwable/shared/FSA_ANIM_FPS_Throwable_Draw.anim.glb) |

## 衔接与事件

Idle/Walk/Run 首尾一致；单次动作从类别准备姿态出发并返回。Holster 结束与 Draw 开始共用收起姿态；换装顺序为收起 → 替换 Weapon_R 挂件 → 拿出，不在中间重置默认骨架。移动状态切换建议由游戏做短暂交叉淡化。

DMR/SR 采用 Fire → Bolt → Idle/移动，其他枪默认不接 Bolt。七类枪共用一套基础动作，支持以后在 overrides 增加专用动作。

事件配置 FPS_ANIMATION_EVENTS.json 已更新到 version=6：所有非空手 clip 的 equipmentSocket 都是 Weapon_R。事件时刻保持不变：Fire 0s 发射；Reload 1.18s 提交弹药；Bolt 0.40s 上膛、0.62s 结束；Attack 0.28～0.43s 命中窗口；Throw 0.38s 从 Weapon_R 移除手持物并生成投射物。游戏需确保单次触发和中途取消处理。

预览器只显示挂件和手臂动画，不执行弹药、命中、投射物生成或投掷释放隐藏等游戏逻辑，因此 Throw 播放时手雷仍随手移动。静态弹匣和枪机也不独立运动。

## 验证

33 个定义校验、50 项自动测试通过。浏览器验证 9 件武器的右手挂接、清空、快速连续切换的最终选择、模型切换/重载；23 段动画通过真实预览器选项逐段播放。

## 持枪左手靠拢

仅枪类八段动画设置 stance.leftOffset=[-0.11,0,0.06]。待机/行走/跑步/开火使用 constant；拿枪 in（最后 25% 平滑靠拢）、收枪 out（最初 25% 平滑让开）；换弹/拉栓 assist（两端 12% 平滑靠拢/让开，中间操作时让开）。前后错位取代横向留缝，手套体积按三维有向包围盒检查。八段动作每段 101 个采样点无两手重叠；此结果不代表完整手臂/武器网格的逐三角形碰撞验证。

该摆位不增加骨骼或手部关节；源 tracks 仍是四个肩肘单轴角度轨道，编译器另输出 UpperArm_L.position 摆位曲线。空手/近战/投掷不设置 stance，保持原先手距。模型 None 默认姿态仍是未靠拢的基础姿态，选择持枪动画后才应用摆位。

### 消耗品通用使用动画（2026-10-05）

已交付 Consumable Use：2.00 秒、非循环、fps-arms.v1。0～0.68 秒左手托起、右手抬高；0.68～0.80 秒短停；0.80～1.00 秒右手向左手下压模拟打针；1.00～1.38 秒微小回震与按压停留；随后撤开右手、双臂放下，1.90～2.00 秒保持收起姿势。药品模型未包含，后续挂 Weapon_R 并按药品握持位置校准针尖。

- 外部提交事件 consumable_commit=1.00 秒；GLB 不内嵌 Gameplay 事件，不能以 2.00 秒播放结束作为生效时刻。提交前中断不消耗，提交后中断不撤销效果；每次使用只提交一次，取消动作时清除旧回调。
- 首尾四关节 X 增量均为 [55,20,55,20]，对齐共用收起角度。左臂使用合法 stance.constant=[-0.065,0,0]，让左手位于右手下压目标处；肩部为 [0.085,-0.16,0]。进入和退出时须在手臂低位对肩部平移作约 0.08 秒短混合，恢复目标动作的位置轨道/标准肩位，不能只混合旋转或遗留 stance。Root、相机不动。
- 装备在手时先播旧装备 Holster，再卸下其可视模型并挂药品，播放 Use；2.00 秒后移除药品、恢复旧装备并播对应 Draw。2 秒仅指 Use 本体，不包括旧装备收起/恢复。空手进入与退出应短混合到对应空手姿势。中断时取消待执行事件，由状态机从当前姿态收手并恢复合法装备状态；死亡不自动恢复装备。
- 使用 LoopOnce、clampWhenFinished；运行时移动限制、受击中断、槽冷却、装备恢复及物品效果仍待接入。
- 验证：正式库定义校验、实际 GLB 241 个采样点（双手手套无相交、固定相机/Root、有限轨道、首尾一致）、第一人称和侧面播放预览通过，正式产物与游戏副本逐字节一致。

事件清单：CONSUMABLE_ANIMATION_EVENTS.json。
