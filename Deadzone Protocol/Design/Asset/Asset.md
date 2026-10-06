# Asset

## 1. 目标

程序化资产体系与 Gameplay 完全独立。

它不参与运行时 Gameplay 规则。

目标是允许：

- Codex
- 代码生成工具
- 自动化脚本

使用数字化描述生成项目资产。

---

## 2. 支持范围

未来需要支持：

```text
Character
Weapon
Building
SceneProp
Animation
Map
```

首版不要求所有类型一次完成。

---

## 3. Asset Pipeline

推荐基础流程：

```text
Asset Definition
↓
Procedural Generator
↓
Asset Compiler
↓
Generated Asset
```

可能的工程位置：

```text
tools/
└── asset-generator/

public/
└── assets/
    └── generated/
```

实际目录可以在实现阶段调整。

运行时应主要加载生成后的最终结果，而不是承担复杂的资产生成过程。

当前游戏侧接入的模型与动画资产使用 **GLB（glTF 2.0）**。

具体资产名称与实际路径统一见 [模型动画资产配置表](../../Assets/模型动画资产配置表.md)；节点、动画绑定和事件时间见 [模型资产使用说明](../../Assets/模型资产使用说明.md)，不在本 Design 中重复维护。

---

## 4. Runtime Asset Contract

当前模型与动画资产至少遵循以下运行时契约：

- 使用米制。
- 资产坐标约定为 `+Y` 向上、`+Z` 为模型正前方。
- 导入时必须保留节点名称、节点层级和局部 Transform。
- 不应在导入时自动合并动画节点、挂接点或重置参考姿态。
- `.anim.glb` 为独立动画资源，按目标模型中的同名节点绑定。
- 每个活动角色或 FPS 双臂实例拥有独立的可变节点与动画状态，不能共享一套会被运行时修改的节点实例。
- FPS 双臂与完整角色使用两套独立的节点 / 动画体系，不交叉绑定动画。
- 当前动画均按原节点层级播放，不要求映射到引擎标准完整人形骨架。

具体导入流程与当前节点清单见 `模型资产使用说明.md`。

---

## 5. Gameplay Boundary

Gameplay 只持有稳定的资产引用标识，例如：

```text
AssetId
```

具体示例：

```text
WeaponVisualId
CharacterVisualId
BuildingVisualId
```

Gameplay 不关心：

- Mesh 如何生成。
- 使用多少 Box。
- 使用多少 Cylinder。
- Skeleton 如何创建。
- Animation 如何生成。

程序资产系统不能反向侵入 Gameplay 规则。

---

## 6. Render Boundary

Three.js 负责最终 3D 表现。

Gameplay 对象不应直接继承 `THREE.Object3D` 并在其中混入全部 Gameplay。

推荐关系：

```text
Gameplay Entity
↓
Visual / Render Component
↓
Generated Asset
↓
THREE.Object3D
```

具体 Render Component 设计由实现阶段决定。

---

## 7. Building Asset

Building Gameplay 至少需要稳定引用：

```text
BuildingId
VisualAssetId
CollisionData
```

程序化 Building 可以生成表现资产，但 World 中的：

- 占地
- SpawnRule
- Collision
- Navigation
- Enemy Activation 合法性

不能依赖不可控的视觉几何推断。

Gameplay 需要可稳定读取的结构化数据。

---

## 8. Weapon Asset

Weapon Gameplay 与 Weapon Visual 分离。

Weapon System 负责：

- Damage
- FireRate
- Reload
- Recoil
- ADS
- WeaponState

Asset 只负责对应表现资源。

当前 FPS 手持装备通过资产约定的统一主握挂接点连接到第一人称双臂；枪械、近战和投掷物的具体挂接节点名称及局部 Transform 规则见 `模型资产使用说明.md`。

Weapon Gameplay 不应把该手部挂接点当作统一枪口、抛壳或 Projectile Spawn Point。需要这类位置时，应由 Weapon 配置提供独立局部偏移或后续专用挂点。

具体枪械程序化生成规则后续单独设计。

---

## 9. Character Asset

Character Gameplay 与：

- Mesh
- Skeleton / Node Hierarchy
- Animation

保持解耦。

当前运行时 Character / FPS Arms 的节点层级与动画绑定约定已经由 `模型资产使用说明.md` 定义。

其中：

- FPS 双臂和完整角色是两套独立动画体系。
- 当前角色骨架是项目自有的简化节点结构，不要求转换到标准完整人形骨架。
- 角色模型与动画的具体节点名称、比例和参考 Transform 以资产说明为准。
- FPS 双臂资产提供第一人称相机定位参考；玩家视角控制器应驱动整个第一人称视图组，再由组内定位点确定相机相对关系。
- 相机不应直接跟随手臂关节动画，也应避免“相机跟随双臂、双臂再反向跟随相机”的循环依赖。

程序化 Character 的**生成方式**仍可后续单独设计，包括模型生成规则、动画生成逻辑和 Animation DSL；这些生成细节不应泄漏到 Gameplay。

---

## 10. 开发阶段要求

程序化资产工具链不应阻塞 Gameplay 原型开发。

在 Gameplay 核心闭环完成前，可以使用：

- Box
- Cylinder
- 简单几何体
- 临时占位模型

验证系统。

后续再将稳定的 Gameplay AssetId 映射到正式生成资产。

---

## 11. 当前未确定内容

以下内容留到后续独立设计：

- 程序化角色模型生成规则
- 程序化枪械模型生成规则
- 程序化建筑生成规则
- 程序化地图生成
- 程序化动画生成逻辑
- Animation DSL
- Asset Compiler 的内部数据与编译方案

当前游戏侧使用的模型 / 动画最终交付格式与运行时节点约定已经确定，具体规格见 `模型资产使用说明.md`。
