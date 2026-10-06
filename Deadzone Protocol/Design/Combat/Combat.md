# Combat

## 1. 范围

当前 Combat Design 重点定义首版 FPS 必要的 Weapon System。

第一阶段优先完成稳定的基础射击闭环，复杂武器扩展后续加入。

---

## 2. Weapon Types

首版基础枪械类型：

```text
AR
SMG
LMG
DMR
SR
Shotgun
Pistol
```

近战和投掷物作为独立武器逻辑处理，不要求强行复用全部枪械流程。

完整首版保留上述七类枪械，现有模型及各枪的目标定位见 `../Item/ItemContent.md`。玩家手枪占副武器槽，其余枪械占主武器槽。允许按可体验闭环分阶段接入，不将所有模型已存在误写为武器行为已完成。

---

## 3. 基础武器数据

Weapon 至少支持：

```text
WeaponType
Damage
FireRate
FireMode
AmmoType
MagazineSize
Reload
Spread
Recoil
ADS
Range
Projectile / Hitscan
WeaponState
```

核心数值应由配置驱动。

Weapon Gameplay 不应依赖具体 Three.js 模型结构。

表现资产通过稳定 AssetId 或 VisualId 关联。

每把枪只使用一种 AmmoType；同一种弹药可以由多把枪共用。弹匣内的数量属于武器实例，备用弹药属于 Inventory。背包展示的伤害是单发伤害，霰弹枪按一次开火的整组弹丸展示，详细弹丸命中仍独立结算。

FireMode 区分全自动、半自动、手动：全自动可按住连续开火；半自动每次输入只射击一发，不要求拉栓；手动每次输入只射击一发，且下一发必须等待拉栓就绪。枪型的具体模式由配置决定，当前已明确 DMR、SR 具有 Fire → Bolt → Ready 门控；不把所有单击单发武器都视为手动拉栓枪。

---

## 4. WeaponState

首版基础状态至少需要表达：

```text
Idle
Firing
Reloading
Switching
```

另外，当前 DMR / SR 存在明确的开火后拉栓门控：

```text
Fire
→ Bolt
→ Ready
```

下一次开火必须等待拉栓就绪。

Design 不强制 `Bolt` 必须实现为顶层 `WeaponState`。它可以是：

- 独立状态
- Firing / Recovery 内部子阶段
- Weapon Action / Gate

只要最终 Gameplay 语义正确，并且能够可靠阻止尚未完成拉栓时的下一次射击。

复杂状态和高级武器行为后续扩展。

实现可以对内部状态进一步细分，但不应无必要增加外部玩法复杂度。

---

## 5. 射击方式

系统需要允许 Weapon 根据配置使用：

```text
Hitscan
或
Projectile
```

当前 Design 不规定具体弹道、穿透、命中判定算法。

物理层至少需要能够支持：

- 子弹检测。
- 世界碰撞。
- Enemy 命中。
- 障碍物阻挡。

具体物理实现见 `Core/Core.md`。

霰弹枪的每颗实际命中弹丸都应提供独立命中结算，使护盾和按受击次数触发的敌人能力逐颗计次；不能将一次开火合并为一次目标受击。持续攻击按配置的伤害脉冲提供命中结算。敌人侧的计次规则见 `../Character/EnemyContent.md`。

---

## 6. ADS / Spread / Recoil

枪械数据结构需要支持：

- ADS
- Spread
- Recoil

当前版本只要求这些能力能够被基础枪械系统表达和实现。

不在本阶段规定高级后坐力模型、弹道散布模型或复杂瞄准镜系统。

---

## 7. Reload 与 Ammo

基础枪械需要表达：

- AmmoType
- MagazineSize
- Reload
- 当前弹匣状态

Reload 的 Gameplay 结果不应简单绑定到“动画开始”或“动画完整结束”。

系统需要支持动作内部的 **Gameplay Commit Point**，在对应动作时间点一次性提交结果。

例如当前资产中存在：

```text
Reload
→ Ammo Commit

Bolt
→ Ready Commit
```

具体事件时间不写死在 Combat Design 中，应来自动作 / 资产配置；当前资产时间约定见 `模型资产使用说明.md`。

Weapon 与 Inventory / Equipment 的关系见 `Item/Item.md`。

当前 Design 不规定复杂弹种管理；各枪适配弹药类型、备用弹药占用和容量规则见 `../Item/Item.md`。

---

## 8. Weapon Action Timeline / Gameplay Event

Combat 需要支持与动作动画关联的 Gameplay Event。

当前至少覆盖：

```text
Fire
Reload Commit
Bolt Ready
Melee Hit Window Begin / End
Throwable Release
Holster Complete
Draw / Equip Ready
```

基本要求：

- Gameplay Event 以动作本地时间或等价的动作进度为依据。
- 播放速度变化后，事件仍跟随动作时间线，而不是使用固定现实时间 Delay。
- 一次动作播放中的单次 Event 只能提交一次。
- Tick 跨过事件时间点时仍必须触发，不能依赖浮点时间恰好相等。
- 动作被中断时，已经提交的 Gameplay 结果和尚未提交的结果必须能够被明确区分。
- 具体事件时间属于资产 / 配置数据，不应散落硬编码在 Weapon 逻辑中。

具体事件时间与当前动画动作清单见 `模型资产使用说明.md`。

---

## 9. Equipment Visual Transition

装备切换在 Gameplay 上由 Item / Equipment 系统决定，但 Combat / Presentation 需要支持完整的动作过程：

```text
Old Equipment
→ Holster
→ 卸下旧表现
→ 挂载新装备表现
→ Draw
→ Ready / Locomotion
```

切换为空手时允许进入 Unarmed Locomotion。

Gameplay 的 Active Equipment 真值仍以 `Item/Item.md` 定义为准；这里描述的是 Weapon Action 与表现所需要的切换阶段。

---

## 10. Weapon Spawn / Muzzle Position

当前手持装备存在统一的主握挂接点，但该点是**手部装配位置**，不是所有 Weapon 的统一枪口位置。

因此：

- Hitscan Trace Start
- Projectile Spawn Point
- Muzzle Effect
- 后续抛壳位置

需要由 Weapon 配置提供独立局部偏移，或在未来资产中增加专用挂点。

不得直接把主握挂接点作为所有枪型的枪口位置。

---

## 11. Weather / Environment Interaction

WeatherSystem 不直接修改 Weapon 内部逻辑。

World 可以暴露类似：

```text
Environment.Raining
```

的 GameplayTag / EnvironmentTag / Context。

具体 Weapon 根据自身规则决定如何响应。

火、毒附魔及天气对状态的共用规则见 `Elements.md`。Weapon 自身只消费环境状态与元素规则，不直接依赖 WeatherSystem 内部对象。

具体计算由对应 Weapon 设计决定。

---

## 12. 扩展预留

首版暂不要求完整实现：

- 枪械配件
- 多弹种
- 复杂故障
- 武器耐久
- 复杂品质词条

但当前数据结构不应阻止未来加入：

```text
AttachmentSlots
```

以及其他扩展数据。

这里的要求是保持扩展空间，不要求提前实现未使用的系统。

---

## 13. 与其他模块的边界

### Character

Character 负责：

- 持有 Weapon 相关组件。
- 提供属性与输入上下文。
- Enemy 承担被命中后的角色行为。

Combat 不应接管 Enemy AI 或 Player 属性系统。

### Item

Inventory 保存 Weapon ItemInstance。

Equipment 只引用已存在的 ItemInstance，不复制一套 Weapon 状态。

### World

World 提供：

- 空间环境
- 物理碰撞
- Weather / Environment Context

Combat 根据需要消费这些信息。

### Asset

Weapon Gameplay 只引用表现资产标识，不关心枪械 Mesh 如何生成。

当前模型挂接、FPS 双臂动画类别以及具体动画 Event 时间由 `模型资产使用说明.md` 提供；Combat 只消费这些数据，不复制维护一套资产事实。

---

## 14. 首版攻击与动作规则

首版没有爆头或弱点伤害。所有玩家攻击均小幅消耗 Stamina，与是否命中无关；消耗数值及常规资源检查由程序和配置处理。敌人默认不互相造成伤害，敌人的毒阵也不伤害其他敌人；混沌技能中明确包含敌人目标的规则保留例外。

### 14.1 动作打断

| 动作 | 目标规则 |
| --- | --- |
| 换弹 | 可以被切枪、翻滚、用药等有效动作请求打断；终止后续时间线，不补执行或重复提交。已提交的弹药结果保留，未提交的不生效。 |
| 拉栓 | 可以被打断；打断可视为本次拉栓已完成，不要求切回后重新播放，允许后续正常开火。 |
| 收起、切出装备 | 不可被普通动作输入或受击打断。 |
| 翻滚、暗影双刃影袭 | 不可被普通动作输入或受击打断；不因此获得免伤或穿越碰撞的能力。 |
| 使用消耗品 | 默认可打断；成功完成前被打断时，不产生效果也不消耗物品。完整规则见 Item。 |

死亡、结束单局及对象销毁仍终止正常行为。有效输入校验、无效输入处理、冷却扣算的具体调用位置等常规边界由程序自行决定，无需逐项扩展策划状态表。

### 14.2 近战

匕首与暗影双刃均为一次点击攻击一次，不按住连续攻击。双刃左右两刀需要两次独立输入，分别产生独立命中；左击后有短暂连击窗口，在窗口内再次输入触发右击。窗口时长、攻击范围、命中检测等由配置与实现确定，不把一次输入解释为自动完成左右双击。攻击消耗 Stamina，不以命中为扣除条件。

### 14.3 Thunder 手雷

首版手雷按下直接执行投掷，不提供主动取消、按住蓄投或握持提前计时。手雷离手后启动引信，可与墙面、敌人等发生碰撞，引信计时结束后爆炸，不因撞到敌人而提前爆炸。具体碰撞响应、引信时长和投掷参数由实现与配置确定。

爆炸伤害随距离衰减；对玩家自身也造成伤害，但明显低于对敌人的伤害。采用简单可调的衰减公式即可，不要求精确物理建模；场景阻挡遵循 World 的攻击阻挡规则。所有投掷物均不可附魔。未来其他投掷物可定义自己的使用机制，不强制沿用手雷流程。

---

## 15. 当前未确定内容

以下内容留到后续设计：

- 配件系统
- 多弹种
- 复杂品质和词条
- 武器耐久
- 高级弹道
- 高级后坐力
- 高级命中反馈
- 首版以外的近战扩展
- 首版手雷以外的投掷物机制
