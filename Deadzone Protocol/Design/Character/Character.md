# Character

## 1. 角色体系

角色采用：

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

Gameplay 能力优先拆为独立组件。

可能的基础组件：

```text
TransformComponent
AttributeComponent
AnimationComponent
CollisionComponent
HitComponent
InteractionComponent
```

Player 可额外拥有：

```text
InventoryComponent
EquipmentComponent
WeaponHolderComponent
InputComponent
```

Enemy 可额外拥有：

```text
EnemySimComponent
AIComponent
CombatComponent
DropComponent
```

NPC 当前主要拥有：

```text
NPCInteractionComponent
```

组件自身必要时可以继承，但总体保持组合优先于深继承。

---

## 1.1 Character Animation / Movement Boundary

当前角色与 FPS 双臂动画均为 **In-Place Animation**。

因此：

- 角色世界位置和朝向由 Gameplay Character / Movement / AI 驱动。
- Collision 和 Navigation 由 Gameplay / Physics 系统负责。
- 动画中的局部位移和旋转只用于表现，不作为角色世界移动来源。
- 不使用动画 Root Motion 驱动常规移动、追击或 Navigation。
- Death 动画中的 Root / Body 表现也不能反向驱动 Gameplay 世界位置。

当前 FPS 双臂与完整角色使用两套独立动画体系，不能交叉绑定动画。

角色激活并加载表现后，应尽快进入合法动画状态，而不是长期停留在模型参考姿态：

```text
Spawn / Activate
→ Idle

Movement
→ Idle / Walk / Run

Action
→ 播放对应 Action
→ 返回当前活动状态

Death
→ 停止普通行为切换
→ 保持死亡表现
```

具体模型节点、动画片段、播放时长和绑定规则以 `模型资产使用说明.md` 为准。

---

# 2. Player Attribute

玩家核心属性：

```text
HP
SP
Stamina
```

---

## 2.1 HP

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

## 2.2 SP

SP 表示角色在生化环境中的清醒状态。

主要规则：

```text
圈外
→ 额外持续扣除 SP，基础恢复仍结算

通常的敌人攻击
→ 同时扣除 HP 和 SP

圈内和圈外
→ SP 自然恢复仍结算，净变化由恢复与损失共同决定
```

普通药物不能直接瞬间恢复 SP。

药物主要改变：

```text
SPRecoveryRate
```

例如：

- 提高恢复速度。
- 短时间提高恢复效率。
- 提高恶劣天气中的恢复能力。

SP 恢复速度受多个 Modifier 综合影响：

```text
BaseRecovery
× HealthModifier
× WeatherModifier
× DrugModifier
× OtherModifier
```

SP 清零时游戏失败。

普通直接受击造成的 SP 损失通常小于 HP 压力，目的是限制玩家靠药物持续硬扛。每次攻击的 SP 损失为独立配置的固定数值，不由 HP 伤害按比例推导。毒伤持续扣除 HP、SP 和 Stamina，灼烧只持续扣除 HP；圈外与中毒不会直接关闭 SP 基础恢复。药品足够强时，圈外 SP 允许净增长。共用状态结算见 `../Combat/Elements.md`，具体攻击见 `EnemyContent.md`。

---

## 2.3 Stamina

Stamina 与 SP 独立。

主要消耗来源：

- 跑动
- 跳跃
- 近战攻击
- 部分高强度动作

恢复速度受到 HP 影响。

HP 越低：

```text
StaminaRecoveryRate 越低
```

SP 不影响 Stamina。

### 2.3.1 翻滚

玩家可消耗 Stamina 进行短距离快速翻滚，并受到独立冷却限制。翻滚必须触地且耐力充足才能启动，方向始终是镜头朝向的玩家前方，不允许侧翻或后翻。翻滚没有无敌帧，不取消已命中的范围、毒伤或灼烧。被明确限制翻滚的控制效果（例如终极 Boss 的地狱之手吸引）期间不能启动翻滚。

翻滚动作顺序：

1. **空手：直接播放 Roll。**
2. **非空手：完整播放当前装备对应的收枪／收刀／收投掷物动画作为前摇，再播放 Roll。** 收起动画结束后才开始 Roll，不跳过、压缩或与 Roll 并行播放。两种情况均使用同一段 0.80 秒空手 Roll，非空手的收起前摇单独计时，不包含在这 0.80 秒内。

翻滚完成后保持空手，**不自动恢复原装备**；玩家需要再次按对应装备槽快捷键切出武器。

收起前摇与 Roll 均不可被普通动作输入或受击打断；翻滚仍遵守实体碰撞。耐力扣除、冷却启动的具体调用位置由程序在成功启动流程中自行确定，不要求另设前摇返还规则。翻滚输入键、位移曲线、耐力消耗量和冷却时长属于实现与平衡数据；已交付 0.80 秒 FPS 双臂翻滚动画（仅空手 Roll，非空手需先播放收起前摇），尚未接入游戏行为，不能把目标规则当成已完成表现。

---

## 2.4 三属性关系

```text
HP
├── 影响 SP 恢复速度
└── 影响 Stamina 恢复速度

SP
└── 独立失败条件

Stamina
└── 控制动作资源
```

除此之外，当前不建立额外耦合。

通用 Modifier 规则见 `Core/Core.md`。

---

# 3. EnemySystem

需要独立的：

```text
EnemySystem
```

统一管理：

- 全部敌人。
- Active 敌人集合。
- 空间注册。
- 第一层模拟状态更新。
- EnemySimState 转换。
- Final 阶段迁移请求。
- 敌群与 Boss 战区域内活动敌人容量管理；总存活数、可见数、完整活动数分开统计。

---

# 4. EnemySimState

第一层状态机表示：

> 当前敌人以什么精度参与世界模拟。

它不是具体 AI 行为状态机。

状态：

```text
Dormant
Wandering
Active
```

---

## 4.1 Dormant

特点：

- 只保留逻辑位置。
- 不加载完整模型。
- 不加载完整碰撞。
- 不执行完整 AI。
- 不寻路。
- 不移动。
- 低频 Tick。
- 会缓慢恢复生命值。

主要用于距离玩家较远的普通敌人。

---

## 4.2 Wandering

特点：

- 只保留逻辑位置。
- 不加载完整模型。
- 不运行完整 AI。
- 低频更新位置。
- 可对普通远距离障碍采用低精度穿越；不能绕过特别保护区的迁移资格，进入活动战场前也必须恢复合法位置和对应碰撞。
- 不进行真实 Navigation。
- 主要用于 GameFlow `Final` 阶段远距离敌人向最终区域迁移。

典型移动：

```text
Position += DirectionToFinalCenter
          × MoveSpeed
          × DeltaTime
```

允许附加少量 Seed 随机扰动。

---

## 4.3 Active

进入 Active 后：

- 加载模型。
- 建立独立动画状态 / 节点实例。
- 进入对应 Idle / Movement 动画状态。
- 加载碰撞。
- 启动 Navigation。
- 启动感知。
- 启动完整 AI。
- 加入 ActiveEnemy 集合。

当敌人靠近玩家一定距离时进入 Active。

离开一定距离后可以退回 Dormant。

进入和退出距离必须支持 Hysteresis，避免边界频繁切换。

示例：

```text
ActivateDistance = 60m
DeactivateDistance = 80m
```

具体数值由配置决定。

---

# 5. Active 激活合法化

Dormant / Wandering 敌人的逻辑位置可能处于：

- 建筑内部
- 墙体内部
- 其他非法位置

因此在进入 Active 前需要合法化流程。

```text
Dormant / Wandering
↓
准备 Active
↓
检查当前位置
```

合法：

```text
创建 / 启用完整碰撞与表现
↓
进入 Active
```

非法：

```text
延迟启用碰撞
↓
保持逻辑移动
↓
移动至合法区域
↓
启用碰撞与 Navigation
↓
正式 Active
```

该过程可以由统一的：

```text
ActivationResolver
```

处理。

具体合法位置搜索算法当前不确定。

---

# 6. EnemySim Tick

EnemySimState 的更新频率低于游戏帧率。

建议范围：

```text
2~5 Hz
```

EnemySystem 应结合 SpatialGrid 获取玩家附近候选 Enemy，并判断状态转换。

无需每帧遍历全部 Enemy。

所有移动和计时仍然基于 `DeltaTime`。

---

# 7. Active Enemy AI

只有 Active Enemy 运行完整 AI。

第二层基础状态：

```text
Patrol
Combat
Flee
```

---

## 7.1 Patrol

负责：

- 基础巡逻
- 搜索目标
- 环境观察
- 移动

---

## 7.2 Combat

进入 Combat 后执行更细的战斗状态机。

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

不同 Enemy 可以：

- 复用模板。
- 增加状态。
- 替换状态。
- 定义独特技能。

---

## 7.3 Flee

部分 Enemy 可根据：

- HP
- Enemy 类型
- 特殊条件

进入 Flee。

### 7.4 Hit / Death 表现

Active Character 可以在受击时播放 Hit 表现，但 Gameplay 状态仍由角色逻辑负责。

进入死亡状态后：

- 停止普通 Patrol / Combat / Flee 行为切换。
- 播放 Death。
- Death 结束后保持死亡表现，不自动回到 Idle。
- 尸体何时销毁或回收由 Gameplay 决定。

---

# 8. Boss

Boss 属于 EnemyCharacter 的特殊类型。

Boss 可扩展 Combat 状态，例如：

```text
Chase
Attack
Skill
Summon
Cooldown
PhaseTransition
```

Combat 状态机应支持配置或模块化扩展。

玩家与最终区域交互物交互后，由 GameFlowSystem 进入 `Final` 并请求 BossSystem 生成终极 Boss。三名区域首领各由所在领地的交互物主动触发，不改变 GameFlow 为 `Final`。

普通、精英、三名区域首领和终极 Boss 的目标阵容、技能与遭遇规则见 `EnemyContent.md`。该文档记录设计，不代表当前训练场已实现敌人生态。

---

# 9. Navigation

仅 Active Enemy 使用完整 Navigation。

Wandering 不使用真实 Navigation。

Active 状态至少需要支持：

- 建筑避障
- 墙体避障
- 玩家追击
- Patrol 路径
- Flee 路径

具体寻路方案当前不确定。

---

# 10. NPC

NPC 继承：

```text
CharacterBase
└── NPCCharacter
```

当前 NPC 本身只要求一个主要交互能力，不要求多 Ability 组合。NPC 基类不赋予受伤能力；首版 Merchant 与军械师也不具备受伤、扣血或死亡能力，不通过“有血量但伤害为零”的方式模拟不可受伤。未来需要可受伤 NPC 时另行增加对应能力，不让所有 NPC 默认继承完整战斗能力。

推荐抽象：

```text
InteractionAbility
```

子类例如：

```text
MerchantInteraction
ArmorerInteraction
```

---

## 10.1 共用分布与配置

首版 NPC 不移动、不具备受伤能力；生成时保证周围配置的小范围无敌人，这只约束初始分布，不自动建立持续驱敌或保护玩家的安全区。交互使用 E，打开商店和军械师服务界面不暂停游戏；玩家仍承受敌人、状态与安全圈压力。

每个 NPC 定义配置 ID、名称、模型路径和地区选择；关卡按 ID 配置实例数量，采用 [World](../World/World.md) 的 BaseCount＋带符号 CountDelta。地区枚举包含六类普通地区、`安全区域`、`无`，不包含首领/最终结界区域：

- 具体地区：只在该类地区的合法位置生成，是硬限制，不是可能落到别处的软权重。
- 安全区域：所有特定地区以外、且不在首领/最终区域内的合法位置。这是分布分类名称，不代表没有敌人或免受圈外伤害。
- 无：结界区域以外的任意合法位置，允许落入普通地区内部。

指定地区没有合法位置时报告数量缺额或必需配置错误，不偷换成其他地区。模型和交互职责解耦，换模型不改变 NPC 类型。地区内容见 [WorldContent](../World/WorldContent.md)。

## 10.2 Merchant：统一商人类型

普通商人、军火商和神秘黑市商人通过同一个 Merchant 类型配置，不为不同货品倾向建立不同程序子类。每个定义拥有固定商品列表、随机商品池、随机抽取选项数量、是否提供出售功能（默认 true），以及共用名称、模型和地区数据。

固定商品直接进入本次库存；随机池的每项描述商品项和该选项在池中的数量。**选项数量与该商品项包含的物品数量分开**，例如“弹药×60”可以是一项，它在池中有多份选项。随机商品数量决定抽多少项，不是直接决定弹药颗数。

制作人已确认以下抽取规则：池选项数量表示该商品项的候选份数，在这些候选份中不放回抽取；同一种商品可以因候选份数大于一而多次抽中。例如 A 有三份、B 有一份，抽两项可能为 AA 或 AB，不会为 BB。请求抽取数超过候选总份数是配置错误，不自动改成有放回。完全相同的商品、价格与交易单位可以合并展示数量；不同品质、价格或实例状态保留独立条目。这个规则不影响固定列表，也不把候选份数直接当库存。

固定与随机结果合并成同一个玩家可见商品列表，支持纯固定、纯随机和混合商人。商品与库存初始化时确定，重复打开商店不重抽；一局内不补货。出售权限为 false 时不提供玩家向该商人出售的功能，价值为 -1 的物品即使在可出售商人处也不能出售。价格与库存由经济配置决定。

首版普通商人可随机分布在各类普通地区；未来只需通过地区/商品配置增加研究所药品商等身份，不因此新增 NPC 能力。若增加治疗或其他服务才需要扩展能力设计。军火商倾向枪械、弹药与武器物资，普通商人倾向药品、道具、弹药及通用军备；这些是内容配置，不是代码强制商品白名单。

出生区域仍固定放置一个初始商店 NPC，使用固定商品和原有购买窗口规则：超过购买时间或离开出生区域后，不可再购买。玩家初始固定金币和匕首规则不变。金币、价值和物资循环见 [Item](../Item/Item.md)。

---

## 10.3 军械师

军械师以金币提供附魔装备的拆解服务，不替代附魔台。具体拆解规则见 `../Item/Item.md` 与 `../Combat/Elements.md`。

与商人使用相同的名称、模型、地区选择和数量配置方式，但目前只有拆解能力，不默认附带商品交易。首版内容目标是在军事基地内共投放 1～2 个，另在安全区域投放一个野生军械师；数量仍可配置，不自动解释成每个基地各有 1～2 个。

---

## 10.4 后续能力

研究所专属 NPC、任务、赌博、随机增益等当前不纳入首版。仅仅卖不同物品的神秘黑市商人仍属于 Merchant，不意味着已批准新的世界事件或 Mystery NPC 系统。
