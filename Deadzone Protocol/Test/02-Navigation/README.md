# 02 · 随机建筑与敌人寻路验证

直接双击 **[Play.html](Play.html)**。Three.js、Rapier WASM、三种建筑 GLB、A1/B2、FPS 双臂和六段动作均内嵌；不需要 npm、服务器、CDN 或浏览器安全开关。需要支持 WebGL 2 / WebAssembly 的桌面浏览器。

这是独立验证子工程，未接入正式游戏。报告见 [02-寻路验证报告](../../Production/Plan/工作项/报告/02-寻路验证报告.md)，机器交接见 [handoff.json](handoff.json)。

## 操作

- 默认 160 × 160 米、15 栋建筑、三类模板、三个聚落。默认 29 个 A1 + 1 个 B2；压力档 49 个 A1 + 1 个 B2。前 15 个敌人分别在不同建筑内合法出生，其余分布在室外。
- 初始为全图观察；鼠标拖动旋转、滚轮缩放。点击“第一人称进入”，WASD 移动、Shift 奔跑；没有跳跃或自动爬台阶。
- 点击场景尝试锁定鼠标。锁定失败仍可按住右键拖动观察，也可用方向键转头。Esc 释放鼠标。输入 seed 时不会驱动角色。
- “单敌人追击”选最近一个；“群体追击”分配玩家附近可见、互不重叠的停靠位置。玩家移动超过 1.8 米会更新路线；静态搜索排队执行，每渲染帧最多处理一个常规请求。
- 靠近玩家且停靠点被其他敌人堵住时，连续停滞超过 3 秒的敌人可以在合法、无遮墙的位置进入明确的 **等待** 状态；它不会记为抵达。玩家继续移动或再次点击追击会重新分配路线。没有攻击、伤害或隔墙接触判定。
- “恢复巡逻”让敌人跨建筑/聚落行走；“暂停”“重置”控制当前世界。三个固定 seed 按钮与输入框都能重新联合生成地形、平台、建筑和出生点。
- 回归下拉框可单独重建绕墙、出门、转角、B2 上下坡、玩家上坡、10 敌人进门、地形接缝与墙内不可达案例。**此按钮重建初态，运行中不瞬移**。恢复随机世界点击“重置”。
- 页面下方图层开关包含路径、碰撞线框、入口/坡道、角色体积、屋顶及 A1 导航采样。侧栏较长时可滚动。

## 运动与导航

复用 01 的原始 `src/world.mjs`，版本 1.0.0，保持其内容与 SHA256 不变。场景平台和建筑共同生成，地形视觉网格与 Rapier trimesh 使用完全相同的顶点和三角形。建筑视觉加载原 GLB，物理由交接的墙、地板、屋顶、旋转坡道盒体构建；建筑预留范围不当作墙。

导航使用 **0.5 米网格 A***，按角色半径、高度、15° 坡度、边界与墙体净空分别建立图。局部空间索引减少重复几何查询；斜向边和平滑线段按不超过 0.18 米间距检查。坡道横向净空包含完整角色半径，禁止从坡道侧边切入。目标位于墙内、无支撑层或无法连通时返回 null。

| 角色 | 导航 / 胶囊半径 | 胶囊总高 | 默认移动速度 |
| --- | ---: | ---: | ---: |
| 玩家 | 0.30 m | 1.80 m | 4.5 m/s；奔跑 6.5 |
| A1 | 0.78 m | 1.95 m | 3.0 m/s |
| B2 | 1.34 m | 3.20 m | 2.2 m/s |

每个角色有独立 Rapier 胶囊、控制器、动画混合器。60 Hz 固定步长；接触皮肤 0.008 米、向下吸附 0.10 米、爬坡上限 15°；关闭自动爬台阶。脚底高度只从物理刚体位置得出，不调用支撑查询去抬升、贴地或设置目标位置。角色之间使用保守水平圆的连续位移检查与本步位置预留，阻止相互重叠；Rapier 控制器负责静态地形/建筑碰撞。它不是动态刚体推挤模拟。

低于预期实际位移的持续时间用于卡住计数。超过 0.7 秒后，最多每两秒考虑一次附近角色占位的绕行搜索。10 敌人宽门案例保留原门洞与碰撞，无隐形拓宽。导航与动态圆比实际动画体积保守，B2 不缩放；动画平移按 canonicalTranslations 重定至模型自己的骨骼基准。

## 独立构建与检查

开发命令在本目录执行。只读使用正式项目已经安装的 `../../node_modules`，没有安装依赖或运行正式游戏的构建。

```powershell
Set-Location -LiteralPath 'G:\Game\Fire\Deadzone Protocol\Test\02-Navigation'
npm run check
node src/browser-check.mjs
node src/finalize.mjs
```

`npm run check` 构建本目录的 `build/check.mjs`，检查 20 个 seed、三个 seed 的 45 个实际 Rapier 案例、动作体积、随机流、真实碰撞顶墙、45 个室内随机出生后的离室运动和合成窄门负例，最后生成本目录 `Play.html`。浏览器检查使用独立无头 Chrome，完整运行约 7 分钟，写入本目录 evidence 和临时 profile。Chrome 路径可用 `CHROME_PATH` 环境变量覆盖；自动化执行沙箱须允许 GPU 子进程正常启动，HTML 不需特殊安全设置。

只重建 HTML：`node src/build.mjs`。不要手改生成 HTML。

任意新 seed：

```powershell
node src/generate.mjs --seed new-seed-042 --size 160 --count 15 --enemies 30
```

输出 `scenes/<seed>.json` 和 `<seed>.spawns.json`，随后在页面输入同 seed 即可重现默认规模的世界。CLI 支持 01 的 160–240 米偶数尺寸、12–18 栋建筑；页面使用 `config/default.json` 的规模配置，若需预览非默认规模，请同步修改配置再构建。seed 限 1–40 位字母、数字、下划线和短横线。配置里的固定 60 Hz 与角色体型还由源码契约规定，不能只改 JSON 就声称改变物理策略。

## 给工作项 03

入口是 [handoff.json](handoff.json)，不是逆向 HTML。所有路径相对本目录；米制、+Y 向上、+Z 正前；位置为 `[x,y,z]`，旋转为 Euler XYZ 弧度，缩放 1。建筑根在地基底面，角色位置在胶囊脚底。

```js
import {generate, templates, transform, inverse, rng} from './src/world.mjs';
import {Navigation, PROFILES, spatialAPI} from './src/navigation.mjs';
const scene = generate('104729');
const navs = Object.fromEntries(Object.entries(PROFILES)
  .map(([kind, profile]) => [kind, new Navigation(scene, profile, 0.5)]));
const api = spatialAPI(scene, navs); // 全部同步，无 DOM 或 Three.js
const support = api.support(0, 0); // height / normal / surfaceId，或 null
const route = api.reachable([x1,y1,z1], [x2,y2,z2], 'A1'); // 路径或 null
const canStand = api.isLegal([x,y,z], 'A1'); // 水平体积、净空与坡度
const lootRandom = rng(scene.seed, 'loot.v1'); // 不改变布局或敌人出生
```

- `scene.buildings` 提供 instanceId、templateId、position/rotation/scale、聚落、平台和世界入口；`transform` / `inverse` 同步转换局部与世界。
- `templates()` / `templates/*.json` 提供局部 `interiorRegions` 矩形、floorY、`exclusions` 入口/坡道矩形与有半径的主通路折线；室外范围来自 `scene.outdoorRegions`。这些是采样区域，不是已验证可放物品的位置；物资仍要减去墙、禁放区并按自己的体积膨胀检查。
- `support` 按真实三角面返回地形、地板或坡道，排除屋顶。它是几何查询，不是移动/碰撞解算。`isLegal` 不验证传入 y 是否等于支持面；调用方需查询高度。`reachable` 检查目标 y 与支持面相差不超过 0.3 米。
- 静态可达性不承诺动态人群一定即时让路。物资不会改变导航；若未来新增实体障碍，需显式重建导航和物理，当前未实现动态门/破坏。
- `src/simulation.mjs` 的顶层 `initialize()` 异步初始化 WASM；之后 `new Simulation(scene, navs)`、`add`、`route`、`tick`、`stats`、`dispose` 为同步。必须释放旧 World。

## 证据与限制

[证据索引](evidence/README.md) 汇总当前通过记录与保留的失败记录。完整性能环境、采样持续时间、平均/P95 帧时间见报告和 `evidence/performance.json`。这些是本隔离场景的无头浏览器结果，不代表正式项目 90/120 FPS 验收。

鼠标锁定的人工授权体验尚需在有窗口的桌面浏览器确认；真实 file:// 加载与键盘移动已自动验证。模型没有足部 IK，原地动画的个别脚尖会低于模型基准约 2–3 厘米；碰撞支撑正确不等于动画脚掌完全贴合。离散动作采样不构成连续动画扫掠证明。无战斗、感知、死亡、物资、安全圈或多层世界。
