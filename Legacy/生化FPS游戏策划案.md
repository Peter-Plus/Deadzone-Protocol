# 生化模式单机 FPS 游戏策划案

## 1. 项目概述

### 1.1 项目定位

本项目是一款以 **Three.js** 为核心渲染框架的单机 FPS 游戏。

首个完整玩法模式为 **生化模式**。项目目标不仅是完成可玩的第一版，更强调：

- 高扩展性
- 高模块化
- 高数据驱动
- Gameplay 与表现层解耦
- 支持大量随机内容
- 支持程序化资产生成
- 支持后续扩展新敌人、新武器、新 NPC、新天气、新事件以及新玩法模式

Three.js 主要负责 3D 表现，不承担核心 Gameplay 逻辑。

---

## 2. 核心玩法循环

玩家出生在一张正方形世界地图中的随机合法位置。

游戏开始时，根据当前关卡配置和 Seed 一次性生成：

- 敌人
- 武器
- 军备
- 道具
- NPC
- 建筑
- 其他世界资源

随后生化安全圈开始按照固定节奏推进。

玩家需要在不断缩小的安全区域中：

1. 搜集物资
2. 获取更高品质武器与军备
3. 击杀敌人
4. 管理生命值、清醒值、体力值
5. 利用 NPC、空投、世界事件强化自身
6. 在安全圈持续缩小时向最终区域推进
7. 尽可能提前清理敌人，降低 Final 阶段压力
8. Final 阶段击败最终 Boss

Boss 死亡后游戏胜利。

玩家生命值或清醒值达到失败条件时游戏失败。

---

# 3. 世界地图

## 3.1 基础地图

地图整体为正方形区域。

地图包含：

- 地形
- 建筑
- NPC
- 道具
- 武器
- 军备
- 敌人
- 空投
- 安全圈
- 世界事件

第一阶段以单张连续地图为目标。

---

## 3.2 Seed

每局游戏拥有一个唯一的：

```text
WorldSeed
```

所有可随机生成内容应尽可能由 Seed 决定，包括：

- 建筑位置
- 玩家出生点
- NPC
- 武器
- 道具
- 军备
- 敌人
- 安全圈相关随机位置
- 空投位置
- 世界事件随机结果

主要目的：

- 可复现
- 易调试
- 支持固定 Seed
- 支持测试特定地图
- 保证随机系统稳定

---

# 4. Spawn Grid

Spawn Grid 只用于 **世界初始化阶段的资源分布控制**。

不同资源可以使用不同大小的 Spawn Grid。

例如：

```text
EnemySpawnGrid
WeaponSpawnGrid
ItemSpawnGrid
NPCSpawnGrid
```

地图被划分为：

```text
X × X
```

个 Bucket。

每个 Bucket 中生成一定数量资源。

数量由：

```text
BaseCount + RandomVariance
```

决定。

其中：

```text
RandomVariance >= 0
```

用于避免完全规则化分布。

不同资源可以配置：

- GridSize
- BaseCount
- RandomVariance
- MinSpacing
- SpawnRules

---

## 4.1 Spawn Rule

任何资源生成都不能只依赖纯随机坐标。

统一通过 SpawnRule 判断合法性。

典型规则：

- 不允许超出地图边界
- 不允许生成在建筑占地区域
- 不允许与其他特定实体距离过近
- 不允许生成在非法地形
- 可以限制与玩家出生点的最小距离
- 可以限制与其他资源的最小距离
- 可以配置特定区域权重

---

# 5. Runtime Spatial Grid

运行时采用独立于 Spawn Grid 的二维空间哈希桶：

```text
SpatialGrid
```

用途包括：

- 查找玩家附近敌人
- 查找附近 NPC
- 查找附近掉落物
- 激活敌人
- 降低全量实体遍历
- 碰撞粗筛
- AI 感知候选集
- 空间交互查询

SpatialGrid 不负责生成规则。

---

## 5.1 基本结构

世界坐标根据 CellSize 映射到：

```text
Cell(x, y)
```

例如：

```text
Hash(x, y)
```

每个 Cell 维护其中的实体 ID 集合。

实体发生跨 Cell 移动时更新所在 Bucket。

查询玩家周围实体时，只扫描覆盖目标半径的 Cell。

---

# 6. 角色体系

采用：

> 继承负责“是什么”，组件负责“会什么”。

基础继承关系：

```text
CharacterBase
├── PlayerCharacter
├── EnemyCharacter
│   ├── Zombie
│   ├── EliteZombie
│   └── Boss
└── NPCCharacter
```

Gameplay 能力尽量拆为独立组件。

---

## 6.1 基础角色组件

可能包括：

```text
TransformComponent
AttributeComponent
AnimationComponent
CollisionComponent
HitComponent
InteractionComponent
```

玩家额外包括：

```text
InventoryComponent
EquipmentComponent
WeaponHolderComponent
InputComponent
```

敌人额外包括：

```text
EnemySimComponent
AIComponent
CombatComponent
DropComponent
```

NPC 包括：

```text
NPCInteractionComponent
```

必要时组件本身可以继承。

但总体原则：

```text
组合优先于深继承
```

---

# 7. 玩家属性

玩家核心属性：

```text
HP
SP
Stamina
```

分别代表：

- HP：生命值
- SP：清醒值
- Stamina：体力值

---

## 7.1 HP

HP 受到：

- 敌人攻击
- 环境伤害
- 特殊事件

等影响。

HP 可以通过：

- 药物
- 治疗类道具
- 特殊效果

快速恢复。

HP 同时影响：

- SP 恢复速度
- Stamina 恢复速度

HP 越低，两者恢复速度越慢。

---

## 7.2 SP

SP 表示角色在生化环境中的清醒状态。

主要规则：

```text
圈外
→ 持续扣除 SP

受到部分敌人攻击
→ 同时扣除 HP 和 SP

圈内
→ SP 自然恢复
```

SP 本身不允许通过普通药物直接瞬间恢复。

药物主要影响：

```text
SPRecoveryRate
```

例如：

- 提高恢复速度
- 短时间提高恢复效率
- 提高恶劣天气中的恢复能力

SP 恢复速度受到：

```text
BaseRecovery
× HealthModifier
× WeatherModifier
× DrugModifier
× OtherModifier
```

综合影响。

SP 清零时游戏失败。

---

## 7.3 Stamina

Stamina 与 SP 独立。

消耗来源包括：

- 跑动
- 跳跃
- 近战攻击
- 部分高强度动作

恢复速度受到 HP 影响。

HP 越低：

```text
StaminaRecoveryRate 越低
```

SP 不影响体力。

---

## 7.4 三属性关系

统一定义为：

```text
HP
├── 影响 SP 恢复速度
└── 影响 Stamina 恢复速度

SP
└── 独立失败条件

Stamina
└── 控制动作资源
```

除此之外三者不建立额外耦合。

---

# 8. Attribute / Modifier 体系

属性系统采用类似 GAS Modifier 的设计思想。

避免在系统内部直接硬编码：

```text
if raining
if hp < 30
if drug active
```

而是由多个 Modifier Provider 提供倍率。

例如：

```text
SPRecoveryRate =
BaseSPRecovery
× HPModifier
× WeatherModifier
× DrugModifier
```

体力恢复同理。

这样未来增加：

- Buff
- Debuff
- 装备
- 天赋
- 特殊区域
- Boss 光环

时不需要修改基础恢复逻辑。

---

# 9. 生化安全圈

安全圈采用状态机。

状态：

```text
Init
↓
Shrinking
↓
Stable
↓
Shrinking
↓
Stable
↓
...
↓
Final
```

---

## 9.1 Init

负责：

- 初始化安全圈
- 设置初始中心
- 设置初始半径
- 准备阶段数据

---

## 9.2 Shrinking

安全圈在指定持续时间内：

```text
CurrentRadius
→ TargetRadius
```

平滑变化。

必须基于：

```text
DeltaTime
```

保证不同刷新率下行为一致。

---

## 9.3 Stable

安全圈暂时停止缩小。

玩家进行：

- 搜索
- 战斗
- 调整装备
- 移动
- 与 NPC 交互

---

## 9.4 Final

进入最终阶段。

主要行为：

- 停止正常缩圈循环
- Boss 出现
- 未清理敌人开始向最终区域迁移
- 游戏进入最终战斗阶段

---

# 10. Game Flow System

存在独立的：

```text
GameFlowSystem
```

它只负责 **玩法节奏推进**，不是全局最高层，也不是上帝类。

和以下系统处于基本同级关系：

```text
WeatherSystem
DayNightSystem
WorldEventSystem
EnemySystem
ZoneSystem
BossSystem
```

---

## 10.1 GameFlowSystem 职责

包括：

- 推进游戏阶段
- 管理安全圈阶段节点
- 触发固定时间事件
- 触发 Final
- 请求 Boss 刷新
- 请求敌人进入 Final 迁移逻辑
- 监听玩家死亡
- 监听 Boss 死亡
- 判断游戏胜负

实际逻辑由对应系统完成。

---

## 10.2 调用原则

强依赖关系：

```text
直接接口调用
```

多系统广播型事件：

```text
EventBus
```

避免所有逻辑都依赖全局 EventBus。

---

# 11. 昼夜系统

游戏拥有完整昼夜循环。

基础周期：

```text
10 分钟 / 一个完整昼夜周期
```

DayNightSystem 负责：

- 时间推进
- 太阳方向
- 环境光变化
- 光照强度变化
- 色温变化
- 天空表现

昼夜系统与天气系统独立。

---

# 12. 天气系统

基础天气：

```text
Sunny
Cloudy
Rain
```

WeatherSystem 与 GameFlowSystem 同级。

---

## 12.1 天气影响

天气影响：

- 环境光强度
- 光照色温
- 环境表现
- SP 恢复速度
- 特定武器效果
- 特定敌人能力

---

## 12.2 雨天

Rain 状态包括：

- 降低环境光
- 调整色温
- 播放雨水特效
- 降低 SP 恢复速度
- 影响部分火焰类武器
- 可强化或削弱特定敌人

---

## 12.3 晴天

Sunny：

- 环境整体更明亮
- SP 恢复速度提高

---

## 12.4 天气 Modifier

WeatherSystem 不直接修改武器逻辑。

通过：

```text
GameplayTag / EnvironmentTag
Modifier
Context
```

向其他系统暴露状态。

例如：

```text
Environment.Raining
```

燃烧瓶根据该环境状态自行计算生效概率。

---

# 13. Enemy System

需要独立：

```text
EnemySystem
```

统一管理：

- 全部敌人
- 激活敌人
- 空间注册
- 第一层状态更新
- EnemySimState 转换
- Final 阶段迁移请求

---

# 14. 第一层敌人状态机：EnemySimState

状态：

```text
Dormant
Wandering
Active
```

该状态机表示：

> 当前敌人以什么精度参与世界模拟。

不属于具体 AI 行为状态机。

---

## 14.1 Dormant

特点：

- 只有逻辑位置
- 不加载模型
- 不加载完整碰撞
- 不执行 AI
- 不寻路
- 不移动
- 低频 Tick
- 会缓慢恢复生命值

适用于：

```text
距离玩家较远的普通敌人
```

---

## 14.2 Wandering

特点：

- 只有逻辑位置
- 不加载模型
- 不运行完整 AI
- 低频更新位置
- 可以穿墙
- 不进行真实寻路
- 主要用于 Final 阶段远程敌人向最终区域迁移

典型更新：

```text
Position += DirectionToFinalCenter
          × MoveSpeed
          × DeltaTime
```

允许附加少量 Seed 随机扰动。

---

## 14.3 Active

进入 Active 后：

- 加载模型
- 加载动画
- 加载碰撞
- 启动寻路
- 启动感知
- 启动完整 AI
- 加入 ActiveEnemy 集合

当敌人靠近玩家一定距离时进入 Active。

离开一定距离后可以退回 Dormant。

进入和退出距离应支持 Hysteresis，避免边界频繁切换。

例如：

```text
ActivateDistance = 60m
DeactivateDistance = 80m
```

---

# 15. Active 激活合法化

Wandering 状态允许穿墙，因此敌人在准备进入 Active 时可能位于：

- 建筑内部
- 墙体内部
- 其他非法位置

因此需要激活合法化流程。

逻辑：

```text
Wandering / Dormant
↓
准备 Active
↓
检查当前位置是否合法
```

如果合法：

```text
直接加载碰撞并进入 Active
```

如果非法：

```text
延迟启用碰撞
↓
保持逻辑移动
↓
移动至最近合法区域
↓
启用碰撞与寻路
↓
正式 Active
```

可以由：

```text
ActivationResolver
```

统一处理。

---

# 16. EnemySim Tick

EnemySimState 更新频率低于游戏帧率。

例如：

```text
EnemySim Tick
2~5 Hz
```

EnemySystem 基于 SpatialGrid 获取玩家附近候选敌人，并判断状态转换。

无需每帧运行。

所有移动和计时仍必须基于 DeltaTime。

---

# 17. 第二层敌人 AI 状态机

仅 Active 敌人执行。

基础状态：

```text
Patrol
Combat
Flee
```

---

## 17.1 Patrol

负责：

- 基础巡逻
- 搜索目标
- 环境观察
- 移动

---

## 17.2 Combat

进入战斗状态后执行第三层状态机。

---

## 17.3 Flee

部分敌人可根据：

- HP
- 类型
- 特殊条件

进入逃跑状态。

---

# 18. 第三层 Combat 状态机

基础模板：

```text
Chase
↓
Attack
↓
Cooldown
↓
Chase
```

不同敌人可以：

- 复用基础模板
- 增加状态
- 替换状态
- 定义独特技能

例如 Boss 可以拥有：

```text
Chase
Attack
Skill
Summon
Cooldown
PhaseTransition
```

Combat 状态机应支持配置化。

---

# 19. Navigation

仅 Active 敌人进入完整寻路系统。

Wandering 不使用真实 Navigation。

Active 状态需要：

- 建筑避障
- 墙体避障
- 玩家追击
- Patrol 路径
- Flee 路径

具体寻路方案待技术阶段确定。

---

# 20. 建筑系统

建筑同样由配置驱动，并支持程序化生成。

基础配置至少包括：

```text
BuildingId
Position
Size
VisualAssetId
CollisionData
```

当前基础占地形状：

```text
边长为 Size 的正方形区域
```

建筑占地区域用于：

- SpawnRule
- 碰撞
- Navigation
- Enemy Activation 合法性判断

敌人、NPC、资源默认不得生成在建筑实体占地区域内，除非具体配置明确允许。

---

# 21. NPC 系统

NPC 继承：

```text
CharacterBase
└── NPCCharacter
```

NPC 本身只拥有一个交互能力。

不要求多 Ability 组合。

---

## 21.1 NPC Interaction Ability

基类：

```text
InteractionAbility
```

子类例如：

```text
MerchantInteraction
WeaponMerchantInteraction
MysteryInteraction
```

---

## 21.2 商人

商人可以随机出售：

- 药品
- 道具
- 弹药
- 消耗品
- 普通军备

---

## 21.3 军火商

只出售军备相关内容：

- 枪械
- 弹药
- 武器相关物资

整体品质倾向高于普通商人。

---

## 21.4 神秘人

作为可扩展随机事件入口。

未来可以实现：

- 任务
- 交易
- 赌博
- 随机增益
- 随机 Debuff
- 特殊事件

---

# 22. World Event System

需要独立：

```text
WorldEventSystem
```

统一管理：

- 空投
- 特殊天气事件
- 敌潮
- 特殊 NPC
- 特殊资源
- 其他随机世界事件

---

## 22.1 空投

空投来源：

### 固定节点空投

GameFlowSystem 在指定游戏节点发出事件。

AirdropSystem 订阅后：

```text
在当前安全圈内选择合法随机位置
↓
生成空投
```

### 空投枪

玩家使用：

```text
FlareGun
```

后请求 AirdropSystem 在合法区域生成空投。

两种情况最终走同一套空投逻辑。

---

# 23. Boss / Final

进入 Final 后：

```text
BossSystem
```

负责生成最终 Boss。

GameFlowSystem 负责发起 Boss 刷新请求，而不是 Boss 自己决定何时出现。

---

## 23.1 敌人召集

Final 开始后：

- 玩家附近敌人继续 Active
- 远距离未清理敌人进入 Wandering
- 敌人逐渐向最终中心迁移
- 靠近玩家后重新进入 Active

玩家前期击杀敌人数量越少：

```text
Final 阶段需要面对的残余敌人越多
```

形成自然的前期资源与战斗压力。

---

## 23.2 胜利条件

Boss 死亡：

```text
GameFlowSystem
→ Victory
```

---

# 24. Inventory

Inventory 和 Equipment 必须分离。

Inventory 负责：

- 存储物品
- 容量
- 堆叠
- ItemInstance
- 背包升级

---

## 24.1 背包

存在：

```text
Level 1 Backpack
Level 2 Backpack
Level 3 Backpack
```

不同背包影响：

```text
MaxCapacity
```

每种 Item 拥有：

```text
CapacityCost
```

玩家持有物品总容量不能超过当前背包上限。

---

## 24.2 武器持有

玩家背包中持有的武器数量：

```text
不做固定数量限制
```

只受：

```text
Inventory Capacity
```

限制。

---

# 25. Equipment

玩家拥有固定装备槽：

```text
PrimaryWeapon
SecondaryWeapon
Melee
Throwable
```

快捷键：

```text
1 → PrimaryWeapon
2 → SecondaryWeapon
3 → Melee
4 → Throwable
```

---

## 25.1 更换装备

快捷键只切换已经装备的武器。

如果玩家要更换某个槽位中的武器：

```text
打开背包
↓
选择库存武器
↓
替换对应装备槽
```

打开背包期间：

```text
游戏不暂停
```

---

## 25.2 Item Instance

Equipment 不复制武器对象。

例如：

```text
Inventory
WeaponInstance #1024

Equipment.PrimaryWeapon
→ ItemInstanceId #1024
```

避免：

- 武器状态重复
- 弹药同步问题
- 耐久同步问题
- 配件同步问题

---

# 26. Weapon System

首版目标是完整覆盖传统 FPS 必要枪械系统。

基础类别：

```text
AR
SMG
LMG
DMR
SR
Shotgun
Pistol
```

近战和投掷物独立处理。

---

## 26.1 基础武器属性

至少支持：

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

---

## 26.2 WeaponState

首版：

```text
Idle
Firing
Reloading
Switching
```

复杂逻辑后续扩展。

---

## 26.3 扩展预留

首版暂不要求完整实现：

- 枪械配件
- 多弹种
- 复杂故障
- 武器耐久
- 复杂品质词条

但数据结构需要避免阻止未来加入：

```text
AttachmentSlots
```

等功能。

---

# 27. 物理系统

游戏需要完整物理支持。

需求包括：

- 玩家碰撞
- 建筑碰撞
- 敌人碰撞
- 子弹检测
- 跳跃
- 地面检测
- 障碍物
- 场景物理

Three.js 仅负责渲染。

具体物理引擎后续技术选型。

---

# 28. Tick 架构

所有时间相关 Gameplay 都必须使用：

```text
DeltaTime
```

禁止逻辑直接依赖刷新率。

---

## 28.1 Tick Scheduler

建议统一设计：

```text
TickScheduler
```

系统按照不同更新频率运行。

例如：

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
→ 1 Hz

Weather Logic
→ 低频

GameFlow
→ 事件 + 低频
```

避免所有系统每帧 Tick。

---

# 29. Event Bus

EventBus 用于：

```text
多个独立系统关心同一事件
```

例如：

```text
GamePhaseChanged
PlayerDead
BossDead
WeatherChanged
```

但禁止所有逻辑都通过 EventBus 间接调用。

基本原则：

```text
明确一对一依赖
→ Direct Call

多系统广播通知
→ EventBus

状态获取
→ System Query
```

---

# 30. UI

UI 不使用 Three.js 作为主要实现。

采用：

```text
HTML
CSS
DOM
```

Three.js 负责 3D 世界。

---

## 30.1 UI 模块

包括：

```text
HUD
Inventory
Equipment
Shop
Map
Settings
Interaction
GameResult
```

---

## 30.2 UI 解耦

UI 不应直接深入读取 Gameplay 对象内部状态。

推荐：

```text
Gameplay
↓
ViewModel / UI Data
↓
UI
```

例如：

```text
AttributeChanged
↓
PlayerHUDViewModel
↓
HealthBar
```

目标是形成类似 UMG 的独立 UI 层。

---

# 31. 程序化资产体系

程序化资产体系与 Gameplay 完全独立。

不参与运行时 Gameplay 逻辑。

目标是允许：

- Codex
- 代码生成工具
- 自动化脚本

使用数字化描述生成资产。

---

## 31.1 支持资产类型

未来需要支持：

```text
Character
Weapon
Building
SceneProp
Animation
Map
```

---

## 31.2 Asset Pipeline

推荐：

```text
Asset Definition
↓
Procedural Generator
↓
Asset Compiler
↓
Generated Asset
```

例如：

```text
tools/
  asset-generator/

public/
  assets/
    generated/
```

运行时主要加载最终生成结果。

---

## 31.3 Gameplay 边界

Gameplay 只持有：

```text
AssetId
```

例如：

```text
WeaponVisualId
CharacterVisualId
BuildingVisualId
```

Gameplay 不关心：

- Mesh 如何生成
- 使用多少 Box
- 使用多少 Cylinder
- Skeleton 如何创建
- Animation 如何生成

程序资产系统完全独立。

具体生成算法后续单独设计。

---

# 32. 数据驱动

游戏数值必须高度配置化。

避免核心数值散落在代码中。

配置范围包括：

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

---

## 32.1 Level Config

关卡配置至少包含：

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

---

# 33. 推荐整体架构

```text
src/
│
├── core/
│   ├── GameLoop
│   ├── TickScheduler
│   ├── EventBus
│   ├── SeededRandom
│   └── EntityId
│
├── world/
│   ├── WorldSystem
│   ├── SpawnSystem
│   ├── SpawnGrid
│   ├── SpatialGrid
│   ├── BuildingSystem
│   ├── DayNightSystem
│   ├── WeatherSystem
│   └── WorldEventSystem
│
├── character/
│   ├── CharacterBase
│   ├── PlayerCharacter
│   ├── EnemyCharacter
│   └── NPCCharacter
│
├── components/
│   ├── AttributeComponent
│   ├── AnimationComponent
│   ├── CollisionComponent
│   ├── HitComponent
│   ├── InteractionComponent
│   ├── InventoryComponent
│   └── EquipmentComponent
│
├── gameplay/
│   ├── AttributeSystem
│   ├── ModifierSystem
│   ├── DamageSystem
│   ├── InventorySystem
│   ├── EquipmentSystem
│   ├── WeaponSystem
│   └── InteractionSystem
│
├── enemy/
│   ├── EnemySystem
│   ├── EnemySimState
│   ├── AISystem
│   ├── CombatStateMachine
│   ├── NavigationSystem
│   └── ActivationResolver
│
├── mode/
│   └── bio/
│       ├── BioGameMode
│       ├── GameFlowSystem
│       ├── BioZoneSystem
│       ├── BossSystem
│       └── HordeSystem
│
├── weapon/
│   ├── Weapon
│   ├── FireMode
│   ├── Reload
│   ├── Recoil
│   └── ADS
│
├── npc/
│   └── interaction/
│       ├── InteractionAbility
│       ├── MerchantInteraction
│       ├── WeaponMerchantInteraction
│       └── MysteryInteraction
│
├── render/
│   └── ThreeRenderer
│
├── physics/
│   └── PhysicsSystem
│
├── ui/
│   ├── HUD
│   ├── Inventory
│   ├── Equipment
│   ├── Shop
│   └── ViewModel
│
├── data/
│   ├── Player
│   ├── Enemy
│   ├── Weapon
│   ├── Item
│   ├── NPC
│   ├── Weather
│   ├── Zone
│   ├── Spawn
│   └── Level
│
└── tools/
    └── asset-generator/
```

---

# 34. 核心设计原则

## 34.1 Three.js 只负责表现

不要：

```text
Zombie extends THREE.Object3D
```

然后把所有 Gameplay 塞进 Object3D。

应该：

```text
EnemyCharacter
↓
Render / Visual Component
↓
THREE.Object3D
```

---

## 34.2 Gameplay 与 Asset 解耦

```text
Gameplay
≠
程序化建模
```

Gameplay 只引用 AssetId。

---

## 34.3 数据驱动

数值：

```text
配置优先
代码只负责规则
```

---

## 34.4 组合优先

角色采用：

```text
少量继承
+
大量组件组合
```

---

## 34.5 低频系统不得每帧 Tick

所有系统根据实际需求选择更新频率。

---

## 34.6 所有时间逻辑使用 DeltaTime

不允许刷新率改变 Gameplay 结果。

---

## 34.7 不滥用 EventBus

事件只负责真正的跨系统广播。

---

## 34.8 随机必须可复现

所有重要随机逻辑尽量来自统一 SeededRandom。

---

# 35. 第一阶段开发目标

第一阶段优先完成最小完整闭环。

建议顺序：

```text
1. Core GameLoop
2. Three.js Renderer
3. Input
4. Physics
5. Player Character
6. Attribute
7. Weapon 基础射击
8. World / Building
9. SpawnGrid
10. SpatialGrid
11. EnemySystem
12. EnemySimState
13. Active AI
14. Navigation
15. BioZone
16. GameFlow
17. Inventory / Equipment
18. Loot
19. NPC Interaction
20. Weather / DayNight
21. WorldEvent / Airdrop
22. Boss / Final
23. UI 完整化
24. 程序化资产工具链
```

其中程序化资产可以在 Gameplay 原型阶段先使用简单占位几何体，避免阻塞核心玩法开发。

---

# 36. 当前暂不展开内容

以下系统目前只确定方向，后续单独设计：

- 程序化角色模型生成规则
- 程序化枪械模型生成规则
- 程序化建筑生成规则
- 程序化地图生成
- Skeleton 标准
- 程序化动画生成
- Animation DSL
- 物理引擎具体选型
- Navigation 具体算法
- 武器配件系统
- 高级敌人技能体系
- Boss 具体行为
- 数值平衡
- UI 编辑器化方案

---

# 37. 当前版本核心定义

本项目当前可以总结为：

> 一个基于 Three.js 的数据驱动、组件化、可程序化生成资产的单机 FPS 生化生存游戏。

核心玩法压力来自：

```text
安全圈
+
SP
+
敌人
+
物资成长
+
背包容量
+
Final 残余敌人
+
Boss
```

核心技术基础设施为：

```text
GameLoop
TickScheduler
SeededRandom
SpawnGrid
SpatialGrid
Component Architecture
EnemySimState
AI State Machine
GameFlowSystem
Modifier System
WorldEventSystem
Data Driven Config
Procedural Asset Pipeline
```

第一阶段优先保证：

```text
玩法闭环正确
系统边界清晰
数据可配置
未来扩展无需推翻底层设计
```
