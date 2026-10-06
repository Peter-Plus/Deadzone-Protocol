# Deadzone Protocol

《死区协议》（Deadzone Protocol）是一款单机 FPS 生化生存游戏。

当前进度：已完成第一人称训练场，包含 Rapier 角色碰撞、移动跳跃、已有双臂与步枪、靶子射击和换弹。尚未完成生存单局、敌人 AI、背包和安全圈。

- 启动与配置：[Production/Guide/GettingStarted.md](Production/Guide/GettingStarted.md)
- 当前实现：[Implementation/README.md](Implementation/README.md)
- 训练场操作：[Production/Guide/FirstPersonRange.md](Production/Guide/FirstPersonRange.md)
- 计划与工作项索引：[Production/Plan/README.md](Production/Plan/README.md)
- 已完成训练场计划：[Production/Plan/Completed/FirstPersonRange.md](Production/Plan/Completed/FirstPersonRange.md)
- 独立模块交接：[Production/Plan/Handoffs/ModuleTasks.md](Production/Plan/Handoffs/ModuleTasks.md)
- 新会话最小交接：[Production/Plan/Handoffs/SessionHandoff.md](Production/Plan/Handoffs/SessionHandoff.md)
- 美术资产清单：[Production/Plan/Art/ArtAssetNeeds.md](Production/Plan/Art/ArtAssetNeeds.md)

直接运行：双击本目录的 [Play.html](Play.html)，无需 npm、本地服务器或联网。需要支持 WebGL 2 与 WebAssembly 的桌面浏览器。点击“开始 / 继续 · 锁定鼠标”，WASD 移动、空格跳跃、左键开火、R 换弹、ESC 暂停；鼠标锁定不可用时选择“窗口模式进入”。

开发时才使用 Node/npm：修改源码后 `npm run build` 重新生成 Play.html；完整检查 `npm run check`。不要手工修改生成的 Play.html。

项目强调：

- 稳定
- 简单
- 数据驱动
- 模块化
- 合理的可扩展性
- Gameplay 与表现解耦

多个 Codex 会话可能分别负责不同模块。开发时应主动阅读相关文档和源码，不要只依赖本 README。

---

# 1. Repository

主要目录：

```text
README.md
Play.html        # 可直接双击运行的自包含入口

src/             # 当前运行时代码
tests/           # 自动测试
tools/           # 构建与开发服务
package.json
package-lock.json

Assets/
├── README.md
├── 模型动画资产配置表.md
├── UI资产配置表.md
├── 模型资产使用说明.md
├── models/
├── animations/
└── ui/
    └── icons/

Design/
Implementation/

Production/
├── Plan/
├── Guide/
└── Reviews/
    └── OpenIssues.md
```

---

# 2. Documents

## Design

描述：

```text
游戏和系统应该是什么
```

主要包括：

- Gameplay 规则
- 系统职责
- 模块边界
- 数据关系
- 重要架构方向

Design 是当前设计基线，不是不可修改的绝对规范。

## Implementation

描述：

```text
当前代码实际上怎么工作
```

主要包括：

- 模块结构
- 核心对象
- 运行流程
- 数据流
- 重要实现决策
- 主要源码位置

具体实现细节以 Source Code 为最终事实来源。

## Production

开发和制作过程中的工作区。

```text
Plan/
→ Codex 的开发规划

Guide/
→ 面向制作人的配置、内容生产和系统使用说明

Reviews/OpenIssues.md
→ 需要制作人参与判断的宏观问题
```

Production 内部结构不固定，可按实际需要自行组织。

---

# 3. Assets

当前已有资产位于：

```text
Assets/
```

模型：

```text
Assets/models/
```

动画：

```text
Assets/animations/
```

模型与动画的：

- 文件结构
- 格式
- 坐标约定
- 节点
- 挂接点
- 动画绑定
- 动画事件
- 使用限制

见：

```text
Assets/模型资产使用说明.md
```

涉及模型、动画、装备挂接、第一人称双臂等功能时，应主动阅读该文档，并检查实际资产。

不要假设当前美术资产已经齐全。

---

# 4. Implementation Principle

实现优先级：

```text
正确
↓
稳定
↓
简单
↓
合理的可扩展性
```

在当前需求范围内完成可靠实现。

不要为了假想的未来需求提前实现大量系统或抽象。

可扩展性主要来自：

- 清晰边界
- 合理数据结构
- 稳定职责
- 数据驱动
- 后续能够自然增加能力

而不是提前实现所有可能的功能。

## 4.1 自主决策

对于 Design 未明确规定的实现细节：

```text
有把握
+
影响局部
+
不改变主要玩法或架构
→ 自行决定
```

例如：

- Class / Function 拆分
- 内部数据结构
- 容器
- 缓存
- 辅助状态
- 普通算法
- 错误处理
- 小型重构

不需要事事询问制作人。

## 4.2 不确定的扩展

如果某项扩展：

- 当前没有明确需求
- 会明显增加复杂度
- 需要建立较大的新系统
- 对方案本身没有足够把握

默认：

```text
不实现
```

可以提出想法，但不要因为“以后可能需要”直接扩大当前任务范围。

---

# 5. New Ideas

Codex 在任何阶段都可以提出新的设计或技术想法：

```text
实现前
实现中
实现完成后
Review 时
维护旧模块时
```

包括：

- Gameplay 改进
- 架构调整
- 更简单的实现
- 技术选型
- 数据生产流程优化
- 长期维护问题

可以直接向制作人提出。

如果暂时不适合立即处理，也可以记录在 `Production/` 中。

例如：

```text
准备实施
→ Production/Plan/

需要制作人决策
→ Production/Reviews/OpenIssues.md

影响制作流程
→ Production/Guide/
```

任务已经完成也不意味着不能继续提出问题或新方案。

---

# 6. Missing Assets

当前美术资产不会始终完整。

开发过程中如果发现需要新的：

- 模型
- 动画
- 贴图
- 图标
- 特效
- 音效
- 其他表现资产

根据实际影响处理。

## 6.1 阻塞开发的资产

如果缺失资产导致功能无法继续可靠实现，例如：

```text
核心角色模型
必须依赖特定节点的模型
必要动画
无法合理替代的 Gameplay 资产
```

应直接向制作人提出需求。

必要时可以：

```text
暂停受影响部分的实现
→ 等待资产
```

不要为了绕过缺失资产建立明显不合理的临时架构。

## 6.2 可以占位的资产

如果缺失资产不会阻塞核心逻辑，例如：

```text
装备图标
普通贴图
临时模型
部分表现资源
```

可以使用：

- Placeholder
- 简单几何体
- 临时材质
- 临时图标
- 其他合适占位方式

继续完成程序功能。

同时应让制作人知道该资产仍需要替换。

## 6.3 Codex 自行制作简单资产

如果资产：

- 很简单
- 数量很少
- Codex 有把握完成
- 不需要复杂美术流程

可以和制作人沟通后直接完成，不要求所有资产都拆成单独工作项。

## 6.4 系统性美术需求

如果需要：

- 大量资产
- 成套资产
- 批量动画
- 系统性模型
- 有统一规范的资源
- 需要独立资产流水线完成的内容

更适合整理成美术需求。

可以在 `Production/` 下自行建立合适的资产需求文档或清单。

如果美术方需要知道程序限制，应明确写出：

- 资产用途
- 必要格式
- 坐标 / 单位
- 节点或 Socket
- 动画要求
- 尺寸约束
- 命名要求
- Gameplay 依赖
- 必须满足的技术限制
- 是否阻塞开发
- 当前 Placeholder

重点是让资产制作者明确：

```text
程序真正需要什么
```

而不只是写一个资产名称。

---

# 7. Development Workflow

较完整的开发任务默认流程：

```text
收到任务
↓
阅读相关 Design
↓
阅读现有 Implementation
↓
阅读相关 Production/Guide（如果存在）
↓
涉及资产时阅读 Assets/模型资产使用说明.md
↓
检查源码与已有资产
↓
必要时建立 Plan
↓
确认是否存在重要设计问题或资产阻塞
↓
实现
↓
测试 / 验证
↓
Review
↓
更新相关文档
↓
记录尚未解决的宏观问题
```

不要默认读取整个项目。

只读取当前任务真正相关的上下文。

---

# 8. Documentation Freedom

Codex 有权随时修改：

```text
Design
Implementation
Production
以及它们的目录结构
```

包括：

- 修改内容
- 新建文档
- 删除失效文档
- 拆分文档
- 合并文档
- 移动文档
- 重命名目录
- 调整整体组织方式

文档结构不是固定 API。

如果当前组织方式已经不适合项目，应主动调整。

唯一要求：

```text
调整后信息更准确
更容易定位
更容易维护
上下文成本更低
```

不要因为“原来就是这样组织的”而保留明显不合理的结构。

---

# 9. Documentation Ownership

信息尽量只维护一个主要事实源：

```text
Gameplay / 系统设计
→ Design

当前实现结构
→ Implementation

开发计划
→ Production/Plan

制作与配置方法
→ Production/Guide

待制作人决策的问题
→ Production/Reviews/OpenIssues.md

具体模型与动画使用约定
→ Assets/模型资产使用说明.md

具体代码细节
→ Source Code
```

避免在多个文档中复制维护相同信息。

---

# 10. Completion Check

完成任务时至少检查：

```text
功能是否正确？

是否稳定？

是否存在不必要的复杂度？

是否满足当前需求？

是否保留合理扩展空间？

是否完成基本测试？

是否缺少必要资产？

是否存在可以合理占位但尚待替换的资产？

Implementation 是否需要更新？

Guide 是否需要更新？

Design 是否仍然准确？

是否发现需要制作人决策的问题？
```

不要因为收尾而无限扩大任务范围。

---

# 11. Core Principle

```text
当前需求范围内
→ 做完整、稳定、简单

有把握的实现细节
→ 自行决定

没有把握的额外扩展
→ 不做

缺少非阻塞资产
→ 合理占位并提出

缺少阻塞资产
→ 向制作人提出，必要时暂停

有更好的想法
→ 任何阶段都可以提出

需要制作人决策
→ 讨论或记录 OpenIssues

文档结构不合理
→ 直接调整
```

目标不是建立最复杂的系统。

目标是：

> 用尽可能简单、稳定的方案完成当前需求，同时保持足够的扩展能力，并让制作人和多个独立 Codex 会话能够长期低成本维护《死区协议》。
