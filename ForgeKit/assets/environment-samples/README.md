# 环境规范样件

这是五类环境资产的生产参考，不是完整地图或正式美术包。源文件可供后续美术 Codex 复制到正式库后修改；不要覆盖本目录基准。

- [公共规范与类型入口](../../rules/ENVIRONMENT_RULES.md)
- [双击离线预览](generated/EnvironmentPreview.html)
- [验收与已知边界](ACCEPTANCE.md)

`definitions/` 保存五份 environment.v1；`generated/` 是可重建产物。所有模型及空间数据从同一份定义导出，只有滑动门额外交付独立节点动画。

在 ForgeKit 根目录运行 `node tools/environment/build.js` 即可重新校验、编译并生成预览。`node tools/environment/author-samples.js` 会重置五个样件源文件，仅在确实需要恢复内置基准时运行。

后续内容制作任务应写清：引用哪个类型规范、采用哪些角色量规、要制作什么外观与数量、如何运行检查、正式输出放在哪里。不要要求每位执行者重写碰撞工具和预览器。
