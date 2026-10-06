# 证据索引

以下均为交付 Preview.html 在 Chrome 中通过 `file://` 实际渲染的截图，不是概念图。场景光照和等高线辅助查看实际几何；主报告只宣称静态资产与空间契约通过。

| 证据 | 内容 |
| --- | --- |
| [全图 104729](01-overview-104729.png) | 160 × 160 m 完整场景与三个聚落 |
| [全图 20261005](02-overview-20261005.png) | 不同布局、模板/朝向和地形 |
| [全图 8675309](02-overview-8675309.png) | 第三个可复现例子 |
| [预留范围俯视](03-map-reservations.png) | 建筑、双侧入口和转向空间 |
| [聚落近景](04-settlement.png) | 真实建筑间距 |
| [双出口室内](05-interior-through.png) | 去顶后查看贯通入口 |
| [转折小屋室内](05-interior-bent.png) | 错位隔墙和转折禁放主通路 |
| [仓库室内](05-interior-warehouse.png) | 5 m 开敞入口与内部区域 |
| [室内眼高视角](06-inside-eye-level.png) | 屋顶存在时的实际室内面 |
| [抬高地坪与量规](07-raised-entry-gauges.png) | +0.50 m，水平坡长 3 m，9.46°；实际 A1/B2 与玩家参考、碰撞线框 |
| [坡地落脚](08-platform-slope.png) | 建筑水平平台及外围连续地形，0.25 m 等高线 |
| [地形三角网](08-terrain-wire.png) | 实际起伏网格，没有用平面碰撞替代 |

自动验收入口为 ../src/browser-check.mjs。validation-failure.txt 如果保留，记录的是开发阶段的坡度/高差约束拒绝案例；最终结论以 validation.json 的 passed 字段为准。
