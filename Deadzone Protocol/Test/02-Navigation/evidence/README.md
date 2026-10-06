# 验证证据

当前结果：

- [static-checks.json](static-checks.json)：20 seed、1000 初始敌人、900 条体型/双门连通检查、可复现和不可达负例。
- [physics-checks.json](physics-checks.json)：Node 内真实 Rapier 的三个 seed、45 个运动案例，含每例起终点、脚底误差、停滞、重叠和实际距离。
- [browser-physics.json](browser-physics.json)：真正 file:// Chrome 中同样 45 个实际 WASM 运动案例。
- [browser-report.json](browser-report.json)：离线资源加载、键盘移动、重置和持续运行，无异常/外部网络请求。
- [browser-interaction.json](browser-interaction.json)：最终页面的任意 seed、移动重规划、窗口转头、暂停和调试图层。
- [realtime-104729.json](realtime-104729.json)、[realtime-20261005.json](realtime-20261005.json)、[realtime-8675309.json](realtime-8675309.json)：每五秒采样的十敌人真实浏览器通行。
- [performance.json](performance.json)：30/50 敌人完整约两分钟采样，平均/P95/最大帧时间，最终 arrived / holding 区分。
- [live-inspection.json](live-inspection.json)：最终压力运行中直接读取的实际视口/画布大小与状态。
- [reset-lifecycle.json](reset-lifecycle.json)：六次重置的物理体、动画和渲染内存计数。
- [asset-checks.json](asset-checks.json)：真实顶点动作采样、体型、独立骨骼平移重定、FPS 绑定。
- [extra-checks.json](extra-checks.json)：45 个随机室内出生的真实离室、初始碰撞重叠、2.4 m 窄门负例、直接顶墙和独立 loot 随机流。
- [sources.json](sources.json)、[isolation.json](isolation.json)：源数据来源/校验与受保护快照差异。

截图：

- [随机世界](01-random-world.png)
- [B2 原尺寸缓坡](02-b2-ramp.png)
- [第一人称双臂](03-first-person.png)
- [窗口操作与新 seed](04-window-input.png)
- [碰撞、入口、导航和体积](05-debug-layers.png)
- [104729 群体进门](crowd-104729.png)、[20261005 群体进门](crowd-20261005.png)、[8675309 群体进门](crowd-8675309.png)
- [30 敌人采样](performance-30.png)、[50 敌人采样](performance-50.png)

保留的历史失败：

- [physics-first-failures.json](physics-first-failures.json)：早期绕墙路线切入坡侧、群体目标被挡；修复后同例通过。
- [performance-before-holding.json](performance-before-holding.json)：早期停靠点被包围导致持续停滞。该旧文件的 viewport 字段为请求窗口大小，实际画布更小；其帧样本也仅保留最后 18000 帧。最终 performance.json 已记录完整约两分钟样本和实测视口，不能混用。
- [browser-lifecycle-first-failure.json](browser-lifecycle-first-failure.json)：重置断言误认为不同 seed/路径阶段的几何数应几乎一致；原日志保留。
- [browser-failure.json](browser-failure.json)：最后一次历史异常，不代表最终状态；以 browser-report/browser-interaction 的 passed 为准。

所有帧率数据仅属于隔离验证场景。单张截图不作为实际运动证明，运动结果以轨迹、碰撞与状态日志为准。

性能截图 50 档来自修复下拉框同步前的采样：选择器仍显示 30，但活动角色为 51（50 敌人 + 玩家），完整日志也为 50。最终页面已同步该选择器；历史截图保留原样。
