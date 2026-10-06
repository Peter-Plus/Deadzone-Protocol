# 死区协议（Deadzone Protocol）Design

## 1. 项目定位

《死区协议》是一款基于 **Three.js** 表现层的单机 FPS 生化生存游戏。

当前版本目标是先完成一套完整、可扩展的单局玩法闭环，并保持：

- 高模块化
- 高数据驱动
- Gameplay 与表现层解耦
- 重要随机结果可复现
- 支持后续扩展敌人、武器、NPC、天气、事件和玩法模式
- 支持程序化资产生成

Three.js 主要负责 3D 表现，不承担核心 Gameplay 规则。

---

## 2. 核心玩法循环

每局开始后：

1. 根据关卡配置和 `WorldSeed` 初始化地图与世界资源。
2. 玩家出生在随机合法位置。
3. 世界生成敌人、武器、军备、道具、NPC、建筑及其他资源。
4. 生化安全圈按阶段持续推进。
5. 玩家在缩圈过程中搜集物资、强化装备、清理敌人并管理自身状态，可主动挑战三名区域首领以取得奖励并阻止其被终极 Boss 吞噬。
6. 玩家逐步向最终区域移动。
7. 玩家与最终区域的交互物交互后，GameFlow 进入 `Final`，召唤终极 Boss；未清理敌人逐步向战场迁移。
8. 击败终极 Boss 后立即胜利。

失败条件至少包括：

- HP 达到失败条件。
- SP 清零。

核心压力来自：

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

局内目标设计预计一局约 15～50 分钟，时长随路线和地图变化。玩家以一级背包、匕首和固定金币开局，在出生商店作首次采购；击杀敌人所得异变结晶可在商人处换金币。成长由物资、护具、两主武器组合、背包升级、首领奖励与附魔形成，不采用等级经验系统。具体规则见 `Item/Item.md` 与 `Item/ItemContent.md`。

地图以荒漠中的小聚落和独立设施组成，六类地区提供不同风险与物资倾向；玩家通过探索迷雾、地区邻近线索和圈势规划路线。特别保护区未开门时区内敌人不参与最终迁移，任意一门开启后永久纳入。首版不额外增加随机世界事件，空投只由信号枪召唤；普通敌人/地面物资/宝箱不周期刷新，商店不补货。背景中的营救行动不新增程序流程或胜利条件。

---

## 3. Design 文档结构

当前 Design 按相对独立的模块划分：

```text
Design/
├── README.md
├── Core/
│   └── Core.md
├── World/
│   ├── World.md
│   ├── WorldContent.md
│   └── WorldInteractions.md
├── Character/
│   ├── Character.md
│   └── EnemyContent.md
├── Combat/
│   ├── Combat.md
│   └── Elements.md
├── Item/
│   ├── Item.md
│   └── ItemContent.md
├── UI/
│   └── UI.md
└── Asset/
    └── Asset.md
```

模块内容后续可以根据实际规模拆分或合并。

### 模块职责

- `Core`：GameLoop、Tick、事件、GameFlow、数据驱动、Modifier、基础运行规则。
- `World`：地图、随机生成、空间索引、安全圈、天气、昼夜、建筑、世界事件。
- `World/WorldContent.md`：六类地区、空间邻近、探索信息、资源倾向与路线节奏。
- `World/WorldInteractions.md`：场景宝箱、信号枪空投、铁门、附魔台、首领交互物和混沌尖刺。
- `Character`：玩家、敌人、Boss、NPC、属性与 AI。
- `Character/EnemyContent.md`：敌人阵容、技能、首领与终极 Boss 的目标设计。
- `Combat`：枪械、射击、武器状态、共用元素与持续状态规则。
- `Item`：Inventory、Equipment、背包容量、ItemInstance、局内物品目录与成长。
- `UI`：HUD、背包、装备、商店等 UI 及 Gameplay/UI 解耦。
- `Asset`：程序化资产、运行时资产引用及 Gameplay/Asset 边界。

### 相关外部规格

当前模型与动画资产的具体接入契约以：

```text
模型资产使用说明.md
```

为准。

该文档负责记录：

- 当前资产目录与文件路径
- 运行时模型 / 动画格式
- 节点与挂接点名称
- FPS 双臂与完整角色的动画绑定
- 动画片段与具体事件时间
- 模型导入和播放约定

Design 不重复维护这些易变化的具体资产数据，只保留会影响 Gameplay 或程序架构的稳定约束。

---

## 4. 全局设计原则

### 4.1 Gameplay 与表现分离

Gameplay 对象不应直接继承或依附于 Three.js 表现对象。

推荐关系：

```text
Gameplay Entity
↓
Render / Visual Component
↓
THREE.Object3D
```

---

### 4.2 数据驱动

核心数值优先来自配置。

```text
配置负责数据
代码负责规则
```

配置范围至少包括：

- Player
- Enemy
- Boss
- Weapon
- Item
- NPC
- Weather
- Zone
- GameFlow
- Spawn
- Building
- WorldEvent
- Inventory

---

### 4.3 组合优先于深继承

角色和 Gameplay 能力优先通过组件组合。

继承主要表达“是什么”，组件主要表达“会什么”。

---

### 4.4 所有时间逻辑基于 DeltaTime

刷新率不能改变 Gameplay 结果。

低频系统按照实际需要注册不同 Tick 频率，不应统一每帧更新。

---

### 4.5 不滥用 EventBus

```text
明确一对一依赖
→ Direct Call

多个独立系统关心同一事件
→ EventBus

读取其他系统当前状态
→ System Query
```

---

### 4.6 重要随机必须可复现

世界初始化和重要随机行为应尽可能来自统一的 Seeded Random。

固定 `WorldSeed` 应能够复现关键世界生成结果，便于调试和测试。

---

### 4.7 Gameplay 与程序化资产解耦

Gameplay 只依赖稳定的资产标识或运行时加载结果，不关心资产具体如何生成。

---

## 5. 当前第一阶段开发目标

第一阶段优先保证最小完整闭环。

当前建议顺序：

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
21. 信号枪空投 / 世界交互物（额外 WorldEvent 留待后续）
22. Boss / Final
23. UI 完整化
24. 程序化资产工具链
```

程序化资产工具链不应阻塞 Gameplay 原型。前期可以使用简单占位几何体。

---

## 6. 当前尚未确定的内容

以下方向已提出，但当前 Design 不规定具体实现：

- 50+ 同屏敌人目标所需的物理、动画和 AI 性能预算（引擎已确定为 Rapier，目标尚未实测）
- Navigation 具体算法
- 程序化角色模型生成规则
- 程序化枪械模型生成规则
- 程序化建筑生成规则
- 程序化地图生成
- 程序化动画生成逻辑
- Animation DSL
- Asset Compiler 的内部数据与编译方案
- 武器配件系统
- 敌人技能的具体实现、冷却和最终数值平衡
- 终极 Boss“混沌”的正式表现资产
- 数值平衡
- UI 编辑器化方案

当前运行时模型 / 动画的格式、节点层级与绑定约定已由 `模型资产使用说明.md` 定义，不再作为未确定项。

这些内容应在对应模块开发前或开发过程中进一步确定。
