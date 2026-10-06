# Codex 标准创作流程

## 创建模型

1. 阅读 ASSET_OVERVIEW.md、COORDINATE_SYSTEM.md、NAMING_RULES.md、MODEL_RULES.md、MATERIAL_RULES.md。
2. 如果是人形，再阅读 HUMANOID_RIG.md。
3. 参照 schemas/model.schema.json 和 examples，创建 `assets/definitions/models/*.model.json`；所需新材质写到 materials/。
4. 运行 `npm run asset -- validate`。
5. 按 Error Code、File、Path、Fix 修复所有 Error，并审查 Warning。
6. 运行 `npm run asset -- build`。
7. 运行 `npm run asset -- preview`，检查原点、朝向、层级、Socket 与骨架。
8. 不直接修改生成文件，不手写二进制或大量顶点/索引。

## 创建动画

1. 阅读 ANIMATION_RULES.md、HUMANOID_RIG.md。
2. 优先判断 idle/breathing/walk/run Generator 是否适用。
3. 创建 `assets/definitions/animations/*.anim.json`。特殊动作使用 tracks 或 poses/ + timeline。
4. 运行 validate，修复所有 Error，检查循环接缝 Warning。
5. 运行 build，预览选择兼容人形和该动画。
6. 确认双臂/双腿合理、Root无持续位移、不同体型都能复用，None恢复参考姿势。

修改工具链代码后运行 `npm run check`。新增语义必须同步更新 TypeScript 类型、JSON Schema、Validator、规则、示例及针对性测试。扩展 Rig 时不能悄悄破坏 humanoid.v1；改变骨名/层级/局部轴应发布新的 rigVersion 和签名。
