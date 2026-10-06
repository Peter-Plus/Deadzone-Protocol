# 劳恩：角色与共享动画

劳恩是一名穿灰绿色夹克、深色战术背心与工装裤的生存者。使用固定 humanoid.v1 七节点刚性骨架，无肘部、腕部、膝部细分，无 IK。
角色 62 个几何部件；共享动画 26 段；握持参考 Pose 3 个。

## 输出

- 模型：`generated/models/characters/player/laoen.glb`
- 动画：`generated/animations/shared/base`、`arms`、`full`
- 清单：`laoen-catalog.json`（动作分层、时长、循环、表现事件和挂载约定）
- 预览：ForgeKit 根目录下 `.qa/laoen-preview.html`

## 动画清单

| 层 | 动作键 | 名称 | 时长 | 循环 |
|---|---|---|---|---|
| base | idle | 待机 | 2.4s | 是 |
| base | walk | 前进 | 0.96s | 是 |
| base | run | 跑步 | 0.64s | 是 |
| base | walk_backward | 后退 | 1.05s | 是 |
| base | strafe_left | 左移 | 1.05s | 是 |
| base | strafe_right | 右移 | 1.05s | 是 |
| base | jump_start | 起跳 | 0.25s | 否 |
| base | jump_air | 空中 | 0.7s | 是 |
| base | land | 落地 | 0.32s | 否 |
| arms | empty_idle | 空手待机 | 2.4s | 是 |
| arms | empty_walk | 空手走路摆臂 | 0.96s | 是 |
| arms | empty_run | 空手跑步摆臂 | 0.64s | 是 |
| arms | hold | 持枪 | 2.4s | 是 |
| arms | aim | 瞄准 | 2.4s | 是 |
| arms | fire | 开火 | 0.18s | 否 |
| arms | aim_fire | 瞄准开火 | 0.18s | 否 |
| arms | reload | 换弹 | 1.65s | 否 |
| arms | equip | 举枪 | 0.4s | 否 |
| arms | unequip | 收枪 | 0.35s | 否 |
| arms | melee | 近战 | 0.65s | 否 |
| arms | throw | 投掷 | 0.85s | 否 |
| arms | interact | 交互 | 0.8s | 否 |
| arms | use_item | 使用道具 | 1.5s | 否 |
| full | hit | 受击 | 0.36s | 否 |
| full | death | 倒地死亡 | 1.3s | 否 |
| full | victory | 胜利 | 2s | 否 |

## Demo 接入

base 只控制 Body、Head 和双腿；arms 只控制双臂，两个 AnimationAction 可同时播放。full 独占七骨骼，播放时停止另外两层。不同层没有重复轨道；普通混合即可，不需要加法混合。

角色 weapon_mount 属于 Arm_L；将武器的 grip_main 对齐此插槽。当前所有武器主握点位于原点，直接按单位变换挂载即可。右臂无绑定，只播放共享动作。换弹、开火不会生成专属武器骨架或 IK。

同一骨架角色可复用动画；跨比例角色需通过 ForgeRuntime.prepareClip 修正 Body 基准位置。当前劳恩使用 1.8 米默认比例。

跳跃与移动全部 In Place：动画只表现姿势，实际运动由游戏负责。death 在 Root 上使用旋转倒地，不改变 Root 位移。非循环动作的结束保持/恢复由控制器处理。

throw、interact、use_item、victory 建议暂时隐藏枪械。melee 使用通用近战挥击；后续装备近战武器后可复用。瞄准是粗粒度双臂抬枪，不保证第一人称准星与机械瞄具精确重合。

事件写在外部清单，不扩展 ForgeKit animation.v1 schema；仅提供接入时序参考。游戏负责弹药提交、伤害判定、投掷物生成及道具消耗，避免动画预览触发 Gameplay。

## 验证

通过 ForgeKit 全库校验；编译 1 个角色和全部动作；检查七节点签名、分层轨道、GLB 动画无网格、动画采样变换有限以及持枪插槽 +Z 朝向。
