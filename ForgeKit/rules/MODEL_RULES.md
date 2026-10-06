# Model v1

准确字段见 `schemas/model.schema.json`；完整创作速查见 `ASSET_RULES_FOR_AI.md`。
源模型为 `*.model.json`，根字段 schema=`model.v1`、id、type=`static|humanoid`。
静态模型 parts 必须非空。人形要求 rig=`humanoid.v1`；省略或清空 parts 自动生成参数化默认外观。
每个 Part 用一个 shape 对象描述几何，禁止手写 vertices / indices / Quaternion。
Part 和 Socket 的 id 必须唯一且避开固定骨骼、Asset、自动外观节点名称；只能用字母开头的字母/数字/下划线/连字符。
parent 可以引用另一个 Part / Socket 或固定骨骼，禁止未知父节点和循环。省略 Part parent 时挂到资产根或人形 Root。
材质支持内联对象、本地 materials 字典 ID 或全局 material.v1 ID。本地引用优先，禁止引用循环。
Socket 不创建几何，只导出命名节点和 socket Metadata。

2026-10-05：cone 可选 radialSegments（整数 3～64）；省略保持原 24 段外观。显式指定时使用平面法线，供棱角水晶使用；不改变其他资产。
