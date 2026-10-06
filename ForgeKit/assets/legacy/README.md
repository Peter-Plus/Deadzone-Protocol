# 测试与预览归档

由旧 assets/definitions 与 assets/generated 整体迁入，保留原内容。仅供测试模型、实验和效果预览；其中旧 FSA 产物副本仅作历史参考，不可作为项目交付来源。正式源库是 ../FSA(项目使用)。

在 ForgeKit 根目录运行：

```powershell
node tools/validator/validate.js "assets/legacy/definitions"
node tools/compiler/build.js "assets/legacy/definitions"
```

编译输出到本目录 generated；预览器选择本目录 generated。正式交付流程见 ../../rules/ASSET_RULES_FOR_AI.md。
