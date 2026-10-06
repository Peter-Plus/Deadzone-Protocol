# 世界资产验证 01

双击 [Preview.html](Preview.html)。这是约 5.91 MiB 的自包含离线 HTML，包含程序、三个场景、三种建筑 GLB 和 A1/B2 参考模型。无 CDN、服务器、文件选择步骤或浏览器安全开关。桌面 Chrome 已在真正 `file://` 下验收。

本目录为隔离实验，不属于正式游戏地图。唯一机器交接入口为 [handoff.json](handoff.json)。本任务没有写入正式游戏与 ForgeKit 源文件；快照核对检测到任务期间其他文件发生变更，详见 isolation.json，未覆盖这些变更。

## 预览操作

- 顶部按钮：全图、俯视、聚落近景、坡地落脚。
- 左侧三个固定 seed 可以切换；也可输入新 seed 后生成。
- 下拉框或点击建筑选中实例；三种模板按钮进入去顶视角。室内视角保留屋顶，入口剖察同时显示玩家/A1/B2 量规。
- 图层包括屋顶、碰撞线框、候选区/禁放主通路、占地预留、地形三角网。等高线间隔 0.25 m，用于辅助理解真实起伏，没有修改几何高度。
- 左键旋转、右键平移、滚轮缩放。这是无碰撞检查相机，不是 FPS 或导航模拟。
- “导出场景 JSON”保存当前完整地形高度场与建筑实例。新 seed 的 GLB 可由命令行重新生成，不能仅依赖导出的 GLB 路径已经存在。

## 实际交付

160 × 160 m，1 m 高度场网格，25,921 个顶点、51,200 个三角形。15 栋单层建筑，6/5/4 栋分成三组，名义中心间距 25/30/31 m。地形高差固定归一化至 2.2 m；随机相位、建造平台以及实际合法位置/朝向随 seed 改变。所有建筑均抬高地坪，不制作高台跳跃入口。

| templateId | 外轮廓 | 地坪 | 门洞宽 × 高 | 室内净高 | 入口水平长度 / 坡度 |
| --- | --- | --- | --- | --- | --- |
| through | 10 × 10 m | +0.40 m | 3.6 × 3.6 m | 3.8 m | 3 m / 7.59° |
| bent | 12 × 12 m | +0.50 m | 3.6 × 3.6 m | 3.8 m | 3 m / 9.46° |
| warehouse | 12 × 10 m | +0.20 m | 5.0 × 3.6 m | 3.8 m | 3 m / 3.81° |

墙、隔墙及屋顶厚 0.3 m；两个真正开放的出口。bent 的两片错位隔墙要求转弯，主通路静态实测最小净宽 3.4 m；契约保守声明 3.3 m。坡道为有厚度的旋转盒体，上表面精确对齐地坪与平台。

建筑使用 ForgeKit `model.v1` box primitives 校验和编译。连续地形使用本目录独立实验网格导出器，不冒充 ForgeKit 支持自定义顶点 Schema。地形 GLB 顶点/索引与 JSON 碰撞依据逐元素核对。

## 再生成与验证

在 PowerShell 中进入：

```powershell
Set-Location -LiteralPath 'G:\Game\Fire\Deadzone Protocol\Test\01-WorldAssets'
node src/character-check.mjs
node src/generate.mjs
node src/build-preview.mjs
node src/validate.mjs
node src/browser-check.mjs
node src/stress-check.mjs
node src/finalize.mjs
```

`character-check` 只读已有游戏角色/动作，复制两个参考 GLB 到本目录，采样 10 段共用动作。`browser-check` 启动临时无头 Chrome，截图落在 evidence；受限制执行环境若阻止 GPU 子进程，需要允许该测试进程正常启动。HTML 本身不需要特殊权限。

自定义生成：

```powershell
node src/generate.mjs --seed 12345 --size 160 --count 15
node src/build-preview.mjs
node src/validate.mjs
node src/finalize.mjs
```

接受 1–40 位字母/数字/下划线/短横线 seed；count 为 12–18；size 为 160–240 范围内的偶数；cell 固定为 1 m。该命令会将 handoff 与预览切换为指定 seed，不删除其他已有场景文件。无参数执行恢复三个固定 seed。生成器最多尝试 64 个布局、每个布局最多 32 个地形候选，无法满足条件则明确报错。

不要手改 GLB 或 Preview.html。修改 src/world.mjs / config 后重跑生成；修改页面源码后重跑 build-preview；更新文件后 finalize 刷新哈希。validate 检查已有 handoff 哈希，修改源码后应先重新 generate 清除旧哈希，再按上述顺序验证和封装。

调用 ForgeKit 的实际命令（由 generate 自动执行）：

```powershell
Set-Location -LiteralPath 'G:\Game\Fire\ForgeKit'
node tools/validator/validate.js 'G:\Game\Fire\Deadzone Protocol\Test\01-WorldAssets\definitions'
node tools/compiler/build.js 'G:\Game\Fire\Deadzone Protocol\Test\01-WorldAssets\definitions'
```

输出是 definitions 同级的本项 generated，不写正式资产库。版本与依赖位置见 [dependencies.json](dependencies.json)，没有安装新依赖。

## 02 / 03 数据契约

所有交付路径相对本目录；`schemaVersion=world-assets.v1`，未知版本须拒绝。模板、场景与交接同版本；地形独立为 `heightfield.v1`。

坐标：米制、+Y 向上、建筑局部 +Z 正前。根位于地基底面中心，scale=[1,1,1]；建筑 position.y 为平台高度，floorElevation 为根上方地坪高度。场景/碰撞 rotation 是 Euler XYZ **弧度**，ForgeKit definition 的 rotation 则为 **角度**。实例只绕 Y 旋转。`transform` / `inverse` 在纯模块 src/world.mjs 中；视觉、碰撞、入口、区域都应用同一实例变换。

| 数据 | 接入方式 |
| --- | --- |
| handoff.templates | 读取每个模板 JSON；不从 GLB 节点名猜用途 |
| template.visualAsset | 独立建筑 GLB，自包含材质 |
| colliders | shape=box，size 为全尺寸；position 为盒中心；rotation 为局部旋转；role 区分 wall/floor/roof/ramp。不要创建整栋 AABB 实心碰撞 |
| walkableSurfaces | floor/ramp 上表面；floor 全面覆盖门槛，墙体作为阻挡减去；roof 不参与可走面 |
| entrances / connections | 坡顶/坡底、宽高、坡长与坡度、外侧 2 m landing、两出口连通折线 |
| reservation | 地基＋入口坡道＋转向和侧向间隙的生成预留矩形，**不是不可行走区域** |
| scene.buildings | instanceId、templateId、position/rotation/scale、旋转后的预留多边形、platform 与入口世界坐标 |
| terrain | row-major x 最快，索引 k=z*columns+x，原点在西南角；每格 a=(x,z),b=(x+1,z),c=(x,z+1),d=(x+1,z+1)，三角形 a,c,d 与 a,d,b |
| interiorRegions | 每模板一个可采样矩形，min/max 为局部 [x,z]，floorY 与 heightSource 对应地坪；不是单一固定投放点 |
| exclusions | 入口/坡道/转向矩形，以及有 radius 的主通路折线；物品体积还需膨胀检测 |
| outdoorRegions | 中央 14 × 14 m 可采样范围；使用 terrain 高度/法线，并拒绝与建筑预留及禁放区冲突的样本 |

纯生成模块可直接复用，不依赖 DOM、Three.js 或 Node API：

```js
import {generate, templates, ground, walkSurface, transform, rng} from './src/world.mjs';
const scene = generate('12345', {size:160, count:15, cell:1});
const contracts = templates(); // definition 是真实 ForgeKit 源，其余为辅助契约
const surface = walkSurface(scene, contracts, worldX, worldZ);
// surface: height / normal / surfaceId；仍需另做墙碰撞和胶囊 sweep
const lootRandom = rng(scene.seed, 'loot.v1'); // 不影响建筑和地形独立种子流
```

`ground()` 使用实际三角形插值，**不能用双线性插值**替代，否则高度/法线会与 GLB 不同。`terrainBuffers()` 返回同一顶点与三角形，02 可用于静态 trimesh。walkSurface 优先取建筑地板/坡道，再取地形，禁止把屋顶作为第二层可走面。地板下方地形保留；墙体另做碰撞。建筑必须与场景平台共同使用，不可随意搬动模型而沿用旧高度场。

## 验证与边界

- [validation.json](evidence/validation.json)：定义/模板/实例/地形、入口连续性、预留无重叠、GLB 加载与实际几何匹配、三个固定 seed 重现比较、错误版本与破坏数据拒绝。
- [character-clearance.json](evidence/character-clearance.json)：实际模型默认姿态及每段动作 121 个采样时刻；Body 位移按 canonicalTranslations 重定基。B2 参考宽 2.629 m、攻击最高点 3.138 m，门顶余量 0.462 m。行走/奔跑包围盒的保守水平半径 1.322 m，对声明的主通路半宽保留 0.328 m。
- [browser-report.json](evidence/browser-report.json)：file:// 加载、三个 seed、新 seed、图层、相机与截图，无外部请求/JS 异常。
- [generator-stress.json](evidence/generator-stress.json)：60 组规模/seed，以及浏览器生成场景的独立静态复验。
- [isolation.json](evidence/isolation.json)：558 个受保护文件 SHA256 前后比较。11 个既有文件变化、6 个新增路径，与其他角色资产工作相关；全库不变检查未通过，未回退这些本任务未写入的文件。
- [截图索引](evidence/README.md)。

静态检查通过不等于运行时移动通过：未接入 Rapier 导航/角色控制器，没有敌人 AI、拥堵、物资 Gameplay 或通关内容。动作采样不是连续 swept-volume 证明；死亡、任意攻击方向、多人同门与转身仍需 02 验证。接缝数学上齐平，GLB 浮点容差检查为 0.00002 m；后续物理引擎接触皮肤与 trimesh 边缘行为尚未实测。

矩形平台/规则聚落保留实验性质；地形采用连续三角网，法线在三角形接缝上可变，未做无限地形或多层结构。预览相机可穿墙，地形边界不代表正式世界围栏。动画参考与正式模型保持原尺寸，没有缩小角色来迁就门洞。
