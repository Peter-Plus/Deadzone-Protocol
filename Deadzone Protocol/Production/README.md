# Production

`Production` 是项目开发过程中的生产工作区。

开发计划与工作项从 [Plan/README.md](Plan/README.md) 进入：已完成计划在 `Plan/Completed/`，美术资产工作项在 `Plan/Art/`，当前交接与模块分工在 `Plan/Handoffs/`。

它不负责定义完整 Gameplay 设计，也不负责记录底层代码实现。

主要承担三类职责：

```
Plan
→ Codex 如何完成当前开发工作

Guide
→ 制作人如何使用已经实现的系统

Reviews
→ 当前有哪些宏观问题需要制作人参与决策
```

# 1. 与其他文档的关系

项目主要存在以下文档层级：

```
Design
→ 游戏和系统应该是什么

Implementation
→ 当前代码实际上怎么实现

Production
→ 当前开发、制作和决策如何进行
```

其中 Production 更接近实际开发过程。

# 2. Directory

当前基础结构：

```
Production/
├── README.md
├── Plan/
├── Guide/
└── Reviews/
    └── OpenIssues.md
```

除这些顶层职责外，不提前规定内部目录结构。

Codex 可以根据实际模块和任务自行：

- 新建文档
- 新建目录
- 拆分
- 合并
- 重命名
- 删除已经失效的文档

目标是保持信息容易定位，而不是维持固定形式。

# 3. Plan

```
Production/Plan/
```

用于 Codex 的开发规划。

主要受众是：

```
Codex / 开发者
```

制作人可能简单检查，但不要求以非技术人员视角编写。

## 3.1 Plan 的职责

在实现较完整的模块、功能或重构前，Codex 可以先创建开发 Plan。

Plan 可以包含：

- 当前任务目标
- 现有代码状态
- 涉及模块
- 预计修改范围
- 依赖关系
- 实现阶段划分
- 关键技术方案
- 数据结构调整
- 风险点
- 验证方式
- 需要同步更新的文档

Plan 应服务于实际开发，不需要写大量背景解释。

## 3.2 Plan 的粒度

简单修改通常不需要单独建立 Plan。

以下任务更适合建立 Plan：

- 新系统
- 较完整 Gameplay 模块
- 跨多个模块的功能
- 大规模重构
- 数据结构迁移
- 复杂资产接入
- 有多个实施阶段的任务
- 存在较明显技术风险的任务

Codex 根据任务复杂度自行判断。

## 3.3 Plan 不是长期设计文档

Plan 描述的是：

```
准备怎么做
```

而不是：

```
系统最终是什么
```

开发完成后：

- 最终稳定设计进入 `Design`
- 最终实际实现进入 `Implementation`
- 制作使用方式进入 `Guide`

Plan 不应成为最终系统说明的唯一来源。

## 3.4 Plan 生命周期

Plan 可以保留已完成任务的记录，也可以在内容失去价值后整理或删除。

但不要依赖旧 Plan 理解当前系统。

当前事实始终以：

```
Design
Implementation
Source Code
Guide
```

为准。

# 4. Guide

```
Production/Guide/
```

用于制作人和策划实际使用已经实现的游戏系统。

这是 Production 中主要面向制作人的部分。

## 4.1 Guide 的目标

Guide 应回答：

```
这个系统怎么使用？

我要改什么配置？

怎么新增内容？

哪些参数控制哪些 Gameplay 行为？

哪些配置组合是不允许的？

配置完成后如何验证？
```

目标是：

> 制作人无需理解大量底层代码，也能够正常制作和调整游戏内容。

## 4.2 Guide 应优先包含

根据具体模块需要，可以记录：

- 数据配置入口
- 新增内容流程
- 常用操作
- 参数语义
- 默认值
- 必填项
- 配置约束
- Gameplay 结果
- 常见错误
- 快速验证方式
- 资产接入方式
- 内容生产流程

## 4.3 Guide 不应重点包含

尽量避免：

- 大量 Class 结构
- 函数调用链
- 算法实现
- 内部状态细节
- 与制作无关的技术说明
- 开发历史
- 已废弃方案

如果必须理解这些内容，应进一步阅读：

```
Design
Implementation
Source Code
```

## 4.4 Guide 使用任务导向组织

Guide 应优先按照：

```
我要做什么？
```

组织内容。

例如：

```
如何新增一把 Weapon

如何新增 Enemy

如何调整安全圈

如何配置一局 Spawn

如何修改 SP 恢复

如何配置 Merchant

如何导入模型

如何增加 World Event
```

而不是强制按照程序类和源码目录组织。

## 4.5 Guide 目录由 Codex 自行组织

不提前规定：

```
Combat/
World/
Character/
...
```

Codex 在完成可供制作人操作的功能后，根据实际使用方式决定 Guide 结构。

如果一个说明内容过大并存在独立工作流，可以拆分。

如果多个说明强相关且经常一起使用，可以合并。

判断标准：

> 是否降低制作人的使用和查找成本。

# 5. Reviews

```
Production/Reviews/
```

用于记录开发过程中发现的宏观问题。

当前核心文件：

```
Production/Reviews/OpenIssues.md
```

# 6. OpenIssues

`OpenIssues.md` 只记录仍然需要制作人参与判断的问题。

适合记录：

- Gameplay 规则冲突
- 玩法设计取舍
- 重要架构方向
- 技术选型
- 数据生产流程问题
- 会明显影响未来扩展的方案
- 多个方案之间存在重要 trade-off
- 当前 Design 可能需要重新考虑的内容

## 6.1 不应记录

通常不要放入：

- 普通 Bug
- 小型重构
- 命名问题
- 普通 null check
- 局部性能优化
- 单个函数怎么实现
- 不影响外部行为的小型技术选择

这些由 Codex 在正常开发过程中自行处理。

## 6.2 Issue 内容

Issue 应简洁表达：

```
当前事实

问题是什么

主要方案

不同方案的影响

Codex 的建议（如果有）
```

不需要写成长篇分析报告。

## 6.3 Issue 解决后

制作人做出决策后：

1. 按决策继续开发。
2. 必要时修改 `Design`。
3. 更新 `Implementation`。
4. 如果影响制作流程，更新 `Guide`。
5. 从 `OpenIssues.md` 移除已经解决的问题。

`OpenIssues.md` 只保留当前仍需处理的问题。

它不是历史决策日志。

# 7. Codex 开发流程

对于需要正式开发的模块，默认流程为：

```
收到任务
↓
阅读相关 Design
↓
阅读现有 Implementation
↓
阅读相关 Guide（如果存在）
↓
检查源码
↓
必要时建立 / 更新 Plan
↓
实现
↓
测试与验证
↓
更新 Implementation
↓
更新 Guide
↓
必要时更新 Design
↓
发现宏观问题
→ 更新 OpenIssues
```

# 8. Plan 与 OpenIssues 的区别

二者不要混用。

```
Plan
→ 已经决定要怎么开发

OpenIssues
→ 还没有决定应该怎么设计
```

例如：

```
实现 Enemy Spatial Activation
→ Plan
```

而：

```
Enemy Dormant 是否应该持续恢复 HP？
→ OpenIssues
```

如果一个问题已经由制作人确定方案，则不应继续停留在 OpenIssues，而应进入实际 Plan / Design / Implementation。

# 9. Codex 的自主决策范围

Codex 可以自行决定：

- 类和函数拆分
- 内部数据结构
- 容器选择
- 辅助状态
- 缓存
- 普通算法实现
- 局部重构
- 常规错误处理
- 不改变外部语义的技术实现

通常不需要记录进 OpenIssues。

# 10. 需要制作人参与的情况

当问题涉及：

- Gameplay 行为改变
- 重要玩法取舍
- 模块职责明显变化
- 架构方向变化
- 制作流程显著复杂化
- 技术选型影响长期开发
- 多种方案各有明显优缺点

Codex 应：

```
停止自行扩大设计决策
↓
记录 OpenIssue
↓
给出必要背景和建议
↓
等待制作人决策
```

如果任务仍有不依赖该决策的部分，可以继续完成。

# 11. Production Review

模块开发完成后，Codex 除了检查代码正确性，还应从生产角度 Review。

至少考虑：

```
制作人是否能够方便使用？

常见内容是否可以通过数据配置？

是否存在不必要的重复配置？

是否要求制作人理解内部程序状态？

是否容易配置出非法数据？

错误配置是否容易发现？

常见制作流程是否足够短？

新增同类内容是否仍需要修改代码？

Guide 是否足够支持正常使用？
```

发现普通问题：

```
直接修正
```

发现宏观问题：

```
OpenIssues
```

# 12. Documentation Update Rules

开发结束后，根据变化类型维护对应文档。

```
玩法 / 系统职责 / 架构事实变化
→ Design

代码结构 / 运行流程变化
→ Implementation

制作或配置方式变化
→ Guide

开发实施方案
→ Plan

尚未解决的宏观问题
→ OpenIssues
```

不要把同一信息复制到所有文档。

每类信息应尽量存在一个明确的主要事实源。

# 13. General Principle

Production 的目标不是增加更多文档。

而是把不同阶段的信息放到正确的位置：

```
Plan
负责开发过程

Guide
负责制作过程

Reviews
负责决策过程
```

最终期望形成：

```
制作人
→ 主要阅读 Guide 和 OpenIssues

Codex
→ 主要阅读 Design、Implementation、Plan 和源码

双方
→ 在重要设计决策上通过 OpenIssues 对齐
```

文档结构本身允许持续调整。

唯一标准是：

> 降低开发、制作和长期维护《死区协议》的上下文成本。
