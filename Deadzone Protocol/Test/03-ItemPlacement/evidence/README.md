# 验证清单与证据

- [x] [30 个固定 seed](static-checks.json)：104729、20261005、8675309、placement-0…26；3,052 个合法方块，单场 97–107 个。实际 Rapier 体积、9 点底面支持、初始占位、区域边界、禁放、颜色规则和从出生点到接近点的路径。
- [x] 每 seed 同配置重放稳定清单完全相同；只改物品 seed/配置，世界与初始敌人签名保持不变。检查源码 [check-placement.mjs](../src/check-placement.mjs)。
- [x] [非法配置与容量路径](negative-checks.json)：未知模板/区域/实例/标签、非法权重、冲突、负数、越界、零数量、超量、极小区域。
- [x] [独立校验器反例](extra-placement-checks.json)：主动悬空、埋地、重叠、不可达接近点和错误颜色均被检出；双门封闭的合成房间请求 2 个、成功 0 个，明确不可达，原模型没有改变。
- [x] [12 项运动回归](motion-checks.json)：三个 seed，各有玩家上坡、玩家转角、B2 转角、10 敌人仓库入口案例。方块为非阻挡可视体，运行时不加入物理碰撞。
- [x] [真实 file:// 浏览器](browser-report.json)：Three/GLB/WASM 离线加载，三个 seed 的 45 项继承运动检查、10 人有物品入口通行，零外部 HTTP 请求、零 JS 异常。
- [x] [15 次玩家实际步行到物品](browser-tours.json)：三个 seed 各检查红、蓝、绿、紫及白色。诊断场景只在建立初态时创建角色，后续位置来自真实物理解算，未用逐帧瞬移。
- [x] [定位、导出和 WASD](browser-views.json)：最终视角修正已核验，Blob 下载含完整配置和清单。
- [x] [8 次物品重投与 4 次世界重建](browser-lifecycle.json)：方块数与清单一致、刚体数保持 31，geometry 数量按世界模板有界变化。
- [x] [打开标签后的 6 次重投](label-lifecycle.json)：相同场景的 GPU texture 数与方块数无累积增长。
- [x] [同设备性能对比](performance.json)：02 与 03 各 30 秒、30 敌人、相同画布。详见正式报告，不将两次采样的负时间差解释为优化。
- [x] [来源](sources.json)和[源副本差异](source-differences.json)：开始时校验前序 132 个文件；物理、导航、生成器和建筑模型不改。
- [x] 本项写入范围为 03 子目录及 03 报告。[隔离扫描](isolation.json)观察到范围外的并行修改，不能宣称全库字节不变；本项未回退这些变化。
- [ ] 其他浏览器、桌面鼠标锁定授权、正式游戏性能目标仍未验收。

## 截图

| 内容 | 104729 | 20261005 | 8675309 |
| --- | --- | --- | --- |
| 全图与分布 | [查看](world-104729.png) | [查看](world-20261005.png) | [查看](world-8675309.png) |
| 红色室内 | [查看](room-red-104729.png) | [查看](room-red-20261005.png) | [查看](room-red-8675309.png) |
| 蓝色室内 | [查看](room-blue-104729.png) | [查看](room-blue-20261005.png) | [查看](room-blue-8675309.png) |
| 绿/黄子区域 | [查看](subregions-104729.png) | [查看](subregions-20261005.png) | [查看](subregions-8675309.png) |
| 坡地室外 | [查看](slope-outdoor-104729.png) | [查看](slope-outdoor-20261005.png) | [查看](slope-outdoor-8675309.png) |
| 有物品的 10 人入口 | [查看](crowd-items-104729.png) | [查看](crowd-items-20261005.png) | [查看](crowd-items-8675309.png) |

[第一人称近看蓝色方块](inside-blue-104729.png) · [玩家走上抬高地坪](raised-entry-final.png) · [最终全图预览](final-preview.png)

## 保留的首轮结果

`first-static-run.json`：检查器曾误要求每种模板至少两栋；原工作项要求三种模板与多个室内实例。placement-0 的 bent 只有一栋，仍合法，修正为每种至少一栋并保留所有 30 seed，没有删掉困难 seed。

`volume-first-failure.json`：placement-2 的一个倾斜方块底面合规、上缘越界；已增加八顶点体积检查，最终 30 seed 全过。

`browser-failure.json`：第一次受执行沙箱限制，Chrome GPU 进程无法启动；给予测试进程正常执行权限后真实 file:// 通过。未使用关闭浏览器安全策略的参数。
