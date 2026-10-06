# 开发入口

- 先读 README.md、Implementation/README.md 和当前任务对应的 Design，不必加载全部文档。
- 主要交付入口是可双击运行的 Play.html；npm 仅用于开发/构建。新资产、WASM、Worker 或模块加载方式必须保留此要求，不要求用户关闭浏览器安全策略。
- 修改 src 或构建脚本后运行 npm run check，重新生成 Play.html；不得直接编辑生成 HTML。
- Core/config/Gameplay 不依赖 DOM 或 Three.js。app 组装依赖；presentation 与 ui 只消费状态和显式操作。
- 新模块遵循 Production/Plan/Handoffs/ModuleTasks.md 的目录所有权与依赖顺序；不要将尚未实现的规划写成实现事实。
- 同步维护 Implementation 和相关 Production/Guide；宏观待决策问题写入 Production/Reviews/OpenIssues.md。
- 已有 Assets 的模型和动画契约见 Assets/模型资产使用说明.md，接入前检查实际资产。
