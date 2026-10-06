# 资产总览

Codex 生成描述，Compiler 生成资产，Previewer 检查结果。本工具不依赖任何游戏 Runtime。

只编辑 `assets/definitions/` 中的 `.model.json`、`.anim.json`、`.pose.json`、`.material.json`。`assets/generated/` 是编译结果，不可直接改动。禁止直接写 GLB、批量手写顶点/索引或 Quaternion。

四类格式以 `schema` 标识版本；未知字段会拒绝。引用通过全局唯一 `id` 解析，文件名用于确定输出名；不同子目录也不能有相同输出文件名。所有源 JSON 禁止重复键，禁止 NaN/Infinity。

流程：阅读规则 → 创建定义 → validate → 修复所有 Error → build → preview。Warning 要人工审查。无隐式随机数；锁定依赖后重复输入的 GLB 字节必须一致。
