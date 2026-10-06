# 命中溅血回归预览

正式制作与查看入口已统一为 [ForgeKit 特效预览器](../../../ForgeKit/previewer/effects.html)。本目录保留原命中场景作为回归检查，读取同一个 `.vfx` 和共用 ForgeVFX 播放器。

双击 [Preview.html](Preview.html)，无需联网或本地服务器。右侧选择观察距离、同时命中数、模拟目标类型和背景；点击播放或拖动时间轴。自动重复预览可开关，清除会停止重复。

本目录独立验证 `Assets/effects/hit/` 的实际资源；内嵌现有 A1 疫鬼模型和 Idle 姿态。没有新增敌人 AI、伤害结算或训练场溅血。

- [资产规格及接入契约](../../Assets/effects/hit/README.md)
- [浏览器检查结果](evidence/report.json)
- [已完成工作项](../../Production/Plan/Art/05-完成项/19-命中溅血表现.md)

从项目根目录运行 `node Test/04-BloodHit/build.mjs` 更新预览，运行 `node Test/04-BloodHit/verify.mjs` 检查离线加载、30／50 同时命中、门控、生命周期、资源释放和浏览器错误。性能数据含静态敌人渲染与预览 UI，不代表完整游戏帧率。
