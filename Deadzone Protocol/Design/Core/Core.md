# Core

## 1. 职责

Core 提供整个游戏共用的运行基础和跨模块规则。

当前主要包括：

```text
GameLoop
TickScheduler
EventBus
SeededRandom
EntityId
GameFlowSystem
Modifier System
Data Driven Config
```

Core 不应成为承载所有 Gameplay 的全局“上帝模块”。

---

## 2. GameLoop 与时间规则

所有时间相关 Gameplay 必须使用 `DeltaTime`。

进行中的单局仅 ESC 暂停菜单暂停玩法时间；背包、大地图、商店、军械师服务、附魔、物品详情和其他交互界面均不暂停。暂停期间安全圈、天气昼夜、AI、状态与冷却计时一起停止，恢复时不补算暂停时长。该规则描述玩家主动打开界面的行为，不取消已有失焦等运行安全保护；胜利/失败仍由 GameFlow 管理。

禁止：

- 依赖帧数计时。
- 因刷新率变化导致移动、恢复、伤害或流程结果变化。

不同系统可运行在不同频率。

建议更新层级：

```text
Render
→ Frame Rate

Player Movement
→ Frame / Fixed Tick

Active AI
→ 10~20 Hz

EnemySim
→ 2~5 Hz

Dormant Recovery
→ 约 1 Hz

Weather Logic
→ 低频

GameFlow
→ 事件 + 低频
```

具体频率可以在实现阶段调整，设计要求仅为：

- 不需要高频的系统不要每帧 Tick。
- 移动和计时仍必须依据真实 `DeltaTime`。

---

## 3. TickScheduler

建议存在统一的 `TickScheduler`，允许系统根据需求注册不同更新频率。

它用于避免：

```text
所有系统
→ 每帧 Tick
```

Scheduler 负责调度，不应承担具体业务规则。

---

## 4. EventBus 与依赖关系

EventBus 只用于真正的跨系统广播。

典型事件：

```text
GamePhaseChanged
PlayerDead
BossDead
WeatherChanged
```

调用原则：

```text
明确一对一依赖
→ Direct Call

多系统广播通知
→ EventBus

状态查询
→ System Query
```

不要为了“解耦”而将所有调用改成 EventBus。

---

## 5. GameFlowSystem

`GameFlowSystem` 只负责玩法节奏推进。

它与以下系统基本处于同级：

```text
WeatherSystem
DayNightSystem
WorldEventSystem
EnemySystem
ZoneSystem
BossSystem
```

GameFlow 不直接实现这些系统的内部逻辑。

### 5.1 主要职责

- 推进游戏阶段。
- 管理安全圈相关阶段节点。
- 按当前关卡推进必要阶段节点；不再将固定节点空投或额外随机事件列为首版必需。
- 在玩家与最终区域交互物交互后触发 GameFlow `Final`，并请求终极 Boss 刷新。
- 玩家与首领领地交互物交互时启动对应首领遭遇，但不进入 GameFlow `Final`。
- 请求 EnemySystem 进入 Final 迁移逻辑。
- 监听玩家死亡（HP 或 SP 清零）。
- 监听 Boss 死亡。
- 判断游戏胜负。

GameFlow `Final` 表示终极 Boss 战已经开始；终极 Boss 死亡立即进入 Victory。ZoneSystem 自行推进 `Init → Shrinking / Stable → Converged`，该末态不触发 GameFlow `Final`。首领战期间 ZoneSystem 的阶段推进时钟按 0.5 倍运行，结束后恢复，圈外 SP 规则不变。

“解救幸存贵族”只作叙事背景，不进入程序流程或胜利条件。Final 敌人迁移须先按 World 的特别保护区开门状态筛选资格；GameFlow 不因此复制或补刷敌人。WorldEventSystem 在首版只属扩展方向，不要求先实现空壳系统。

玩家可随时通过首领或最终区域交互物开启对应遭遇，召唤不以安全圈阶段为前提。这里是单向影响：首领结界等已定义的世界事件可以影响 ZoneSystem 的推进速度，安全圈进度不反向限制召唤。区域首领战的半速规则保留，不因此要求新增通用 WorldEventSystem。安全圈最终收束在终极 Boss 结界范围。

玩家死亡进入 Failure，混沌死亡进入 Victory。按实际事件执行顺序完成一次性终局判定，终局确定后不被后续事件覆盖；不另设同时死亡的特殊胜负规则。结束后停止玩法推进并冻结本局统计，交给结算界面展示。

结算提供再次挑战和返回主界面。每次挑战重新生成 WorldSeed；不支持保存或继续中途单局。结算指标、行动评级及徽章方向见 UI 的 GameResult，具体公式和实现由程序设计。

实际行为由对应模块完成。

---

## 6. Attribute / Modifier 基础规则

属性系统采用类似 GAS Modifier 的思路。

基础规则不应直接硬编码大量外部条件，例如：

```text
if raining
if hp < 30
if drug active
```

推荐由多个 Modifier Provider 提供最终修正。

示例：

```text
SPRecoveryRate =
BaseSPRecovery
× HPModifier
× WeatherModifier
× DrugModifier
× OtherModifier
```

这一机制应允许未来增加：

- Buff
- Debuff
- 装备
- 天赋
- 特殊区域
- Boss 光环

而不需要重写属性基础恢复规则。

具体玩家属性见 `Character/Character.md`。

### 6.1 冷却缩减

适用同一技能的冷却缩减来源按属性规则相加，再使用可配置上限，首版初值为 **60%**。有效冷却缩减限制在 0～该上限；本次冷却时长为基础冷却时长 × (1 − 有效冷却缩减)。上限配置应低于 100%，不能通过叠加得到负冷却或零冷却。

每次技能开始一次新冷却时读取当时属性，确定本次时长；施加、移除或改变冷却缩减，包括昼夜切换，都只影响之后新开始的冷却，不重算正在进行的倒计时。技能明确定义的刷新/重置冷却行为不属于属性变化，仍按该技能规则执行。

冷却缩减只应用于明确受该属性影响的技能，不自动改变射速、动画、蓄力、持续时间或一次性使用限制。影系角色与武器各自的夜晚作用范围见 [Elements](../Combat/Elements.md)。

---

## 7. 数据驱动

核心数值应尽量配置化，避免散落在代码中。

主要配置域：

```text
Player
Enemy
Boss
Weapon
Item
NPC
Weather
Zone
GameFlow
Spawn
Building
WorldEvent
Inventory
```

关卡级配置至少需要能够描述：

```text
MapSize

EnemyTotalCount
EnemyTypeCounts

WeaponCount
ItemCount
SupplyCount
NPCCount

EnemySpawnGrid
WeaponSpawnGrid
ItemSpawnGrid
NPCSpawnGrid

GameFlowConfig
ZoneConfig
WeatherConfig
```

具体数据格式由实现阶段确定。

---

## 8. SeededRandom

游戏的重要随机逻辑应尽可能来自统一 Seed。

要求：

- 固定 `WorldSeed` 时关键生成结果可复现。
- 世界生成、随机位置和重要世界事件不应各自使用不可控随机源。
- 具体随机算法由实现阶段决定。

---

## 9. Entity 与组件原则

Gameplay 采用少量继承 + 大量组件组合。

通用对象可以使用稳定的 `EntityId` 进行系统间引用和空间索引。

具体组件结构由对应模块决定，但不应将表现对象作为 Gameplay 对象本体。

---

## 10. Physics

游戏需要完整物理支持，至少覆盖：

- 玩家碰撞
- 建筑碰撞
- 敌人碰撞
- 子弹检测
- 跳跃
- 地面检测
- 障碍物
- 场景物理

Three.js 只负责渲染。

2026-09-30 制作人确认采用 Rapier。运行时通过适配层隔离引擎类型，使用可内嵌 WASM 的兼容包以保留双击 HTML 启动。当前训练场已覆盖角色胶囊碰撞、地面、跳跃、障碍物与射线命中；完整敌人/动态物体支持需在对应玩法模块接入时另行验证，不以引擎能力代替已实现功能。
