# V1 验收记录

2026-09-28，Node.js 22.19.0，Three.js 0.180.0，AJV 8.20.0，Windows Chrome 无头浏览器。

- `node tools/validator/validate.js`：11 个定义通过。
- `node tools/compiler/build.js`：5 个模型、4 个动画产物成功输出。
- `node --test tests/*.test.js`：35 项通过、0 失败。
- `node tests/browser-smoke.js`：真实 file:// 页面和目录选择器通过，没有资产 HTTP 服务。

自动测试覆盖：非法几何/尺寸/材质/Socket/非有限数值、未知父节点、父子环、材质引用环、未知字段、固定七骨骼、比例变化不改签名、层级/轴变化改变签名、脚底归零、Pose 引用、动画时间范围与顺序、Root 位移拒绝、确定性 GLB、导出后加载、Socket Metadata、全部生成器、循环端点、动画文件无 Mesh、Rig 三字段比较、不同身高动画复用、停止恢复姿态。

浏览器覆盖：5 个模型和 4 个动画列表、Walk 播放、None 停止、静态模型拒绝 Rig mismatch、快速切换时最后请求生效、坐标轴/包围盒/六条骨架连线、W 移动、鼠标拖动转向。截图已人工检查。

本环境无头模式不支持 Pointer Lock；拖动模式已验证。普通桌面点击锁定路径已实现，Esc 由浏览器释放。
报告：`.qa/browser-report.json`；截图：`.qa/humanoid-walk.png`、`.qa/helpers.png`。浏览器验收工具可重建这些本地文件。

离线 Three.js / GLTFLoader 以预打包经典脚本交付，无 CDN 或模块加载限制；制作包时使用 esbuild，使用预览器时不需要构建。
最后依据实现和验收结果补全 `rules/ASSET_RULES_FOR_AI.md` 与 `rules/RUNTIME_ASSET_USAGE.md`。
