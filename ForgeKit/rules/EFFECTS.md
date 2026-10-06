# 特效管线 effect.v1

特效以数据定义、统一校验、单文件导出和共用播放器实现。首次迁移 `vfx_hit_blood_low` 与 `vfx_altar_feedback`，不重复为每款特效编写 JavaScript。模型／节点动画继续使用 GLB，特效文件通过资产 ID 引用参考模型和动画，不复制台体。

## 路径与命令

正式源：`assets/FSA(项目使用)/definitions/effects/<分类>/<名称>.effect.json`。源贴图及生成脚本放在该定义的目录内。正式产物：`assets/FSA(项目使用)/generated/effects/<分类>/<名称>.vfx`。

在 ForgeKit 根目录运行：

```powershell
npm run validate
npm run build
npm run build:effects-preview
npm run test:effects-browser
npm run deliver:effects
```

`validate` 检查 Schema、状态／图层／变体、曲线与模型引用；`build` 还检查贴图实际路径、PNG 头和尺寸，内嵌素材，生成共用 `generated/effects/ForgeVFX.mjs`。整个库通过验证和编译后才替换产物，出错不会先写出部分编译结果。重新生成源血滴可运行 `node "assets/FSA(项目使用)/definitions/effects/hit/generate-texture.mjs"`。

`deliver:effects` 仅同步已生成的特效、共用播放器、节点动画绑定辅助库及设施摆放参考，并逐字节核对；不修改配置表、不接入游戏玩法。修改资产后还须维护游戏配置表。只有修改播放器能力时才需要改共用代码；新增已有类型的特效只改定义／素材，重新校验编译即可。

## 单文件内容

`.vfx` 是 UTF-8 JSON：`{"schema":"forge-vfx.v1","effect":{...}}`。不是改后缀的脚本，不接受任意表达式、JS、网络贴图或自定义 shader。`effect` 遵循 [Schema](../schemas/effect.schema.json)，源定义中 `textures.<id>.source` 编译为包内 `textures.<id>.data` 的 PNG Data URL。所有贴图内嵌；宿主提供共用 Three.js 播放器与被引用的独立 GLB。

| 字段 | 规则 |
| --- | --- |
| `schema`／`id`／`name` | `effect.v1`，库内唯一 ID，显示名称 |
| `initialState`／`states` | 状态名映射 `{duration,loop,next?}`；duration 为秒，next 仅代表表现末态，非循环且不得成环 |
| `variants` | 变体名映射 `#RRGGBB`，用于颜色和图层筛选 |
| `textures` | 源目录内 PNG，禁止路径穿越和外部链接；每张最多 8 MiB、4096×4096 |
| `binding` | 可选；必填 model／attachment，引用同库静态模型及节点。animation／animationStates 为可选，若提供动画须为匹配 nodes.v1；animationStates 指定 `time`／`end`／`rest` 采样，没有动画不能单独提供 animationStates |
| `layers` | 图层数组，ID 唯一，缺少当前状态 profile 的图层关闭／恢复基础材质 |

`binding` 的动画描述由宿主同步执行，VFX 不控制玩法。预览器使用正式 ForgeRuntime 进行模型／动画签名检查和绑定；游戏侧相同约定见 [特效资产使用说明](../../Deadzone%20Protocol/Assets/特效资产使用说明.md)。

## 首版图层

### burst：突发血滴类粒子

使用纹理化实例四边形，一层一个绘制批次。`count` 为每次触发粒子数、`capacity` 为并发组数；满时覆盖最早提交的一组，不限制 Gameplay 敌人数。`duration`、`lifeRange`、`speed`、`size`、`stretch`、`gravity`、`lift`、`normalOffset`、`spread`、`normalWeight`、`shrink`、`fadeStart` 控制有限范围的随机喷散和生命周期。`texture` 引用包内贴图；`render` 指定色彩、透明度、深度测试／写入与普通／加色混合。`profiles.<state>.strength` 控制整层透明度。

位置和法线是世界空间，米制，粒子出生后留在世界轨迹，不跟随模型。顶点着色器按绝对时间计算轨迹；同一 seed 可复现。血滴基础宽 0.018～0.046 米，10 粒子／命中，最长 0.46 秒，单实例可容纳 64 组。

### cloud：局部柔雾与辉光

实例化的面向相机四边形，以内嵌 PNG 的 alpha 塑造雾丝／光晕。`position` 是局部中心，`radii` 是雾片中心分布椭球的三轴半径，`shell` 控制分布靠近外壳的程度，`count` 为片数（1～256），`seed` 保证分布可复现。`size` 为雾片宽度范围，`aspect` 为高宽比，最终软边范围还包含雾片尺寸。`drift` 为三轴漂移幅度，`speed`、`rotationSpeed` 控制漂移相位和旋转速度。profile 的 `strength` 控制透明度，`expansion` 控制中心分布扩张；render 与 burst 使用相同字段。

随父级变换，推荐单位／均匀缩放。创建即按初始状态采样；emit 的 position 仅重新设置此实例的局部中心偏移，不增加云团，多个目标需各自创建实例。没有当前状态 profile 时隐藏。绝对时间采样支持反向 seek；clear／dispose 与其他图层一致。此能力位于共用播放器，新雾气只写定义与贴图。

魅影的 arrival、charge、vanish 是三个正式定义；charge 为单手效果，双手复用同一文件。重新生成源贴图：`node "assets/FSA(项目使用)/definitions/effects/shadow/generate-textures.mjs"`。`node tests/shadow-browser.js` 检查三项独立预览、亮暗背景、清理、导入和多实例。

### surface：护罩与地面区域

共用程序化表面，不需外部纹理。`shape` 为 ellipsoid／disc／rectangle；`position` 是局部偏移，`size` 为三轴缩放。椭球基础半径 1；disc 为 XZ 平面单位半径圆；rectangle 为 XZ 平面 1×1 正方形。render 决定基础颜色／透明度／混合；`accent` 为亮部色，`detailScale` 为世界尺度细节频率，`speed` 为动画速度，`rimWidth` 为范围内侧归一化边缘宽度。profile 定义 strength 和 expansion。

ellipsoid 显示轮廓辉光、网格和流动能量；地面区域显示流动斑驳毒液、气泡及内侧边界。着色器由共用播放器实现，资产仅提供受校验参数。地面细节使用世界坐标，尺寸变化不拉伸图案。此层没有碰撞、地形投射或自动 Gameplay 寿命。

播放器 `setSegment(start,end,width)` 为单位矩形提供中心／朝向／长度计算，返回平面长度；只接受居中且 XZ size=1 的 rectangle 图层。端点在父级坐标空间，须同高。零位移得到零长度，停止调用后保留上次范围。直线路径由调用方提供，不收集曲线轨迹。圆形使用 `root.scale.set(radius,1,radius)`。通用生命周期见项目使用说明。

`tests/poison-effects.test.js` 检查真实 C2 捶胸动作包裹、任意方向矩形端点与宽度、零长度、坏输入、持续状态、淡出和反向采样；`node tests/poison-browser.js` 检查临时组合预览与离线渲染。

### sector：可配置扇区预警与破地尖刺

`angle` 为 1～360 度扇角，`radius` 为正长度（米，顶点到外弧）；+Z 为中线，原点为扇区顶点。`seed` 生成可重复的参差分布，`density` 是每平方米视觉密度，`capacity` 是最多显示的刺数（≤256），`height` 是升起高度范围。`color`／`emissive` 为刺的暗面与发光色，`smokeColor` 为缠绕气流颜色。profile 使用 strength、growth、smoke、ground 分别控制尖刺透明度、生长、魂气和地面预警。

玩家仅通过已有状态机显式切换预警／释放；不自动提交伤害。`setSector(angleDegrees,radiusMeters)` 更新全部 sector 图层，保留播放状态和时间；坏参数先拒绝，不部分修改。相同尺寸调用复用布局；不同尺寸重用固定容量缓冲区。边缘预留尖刺和魂气宽度，使图形不越过实际扇区。完整 360° 可用。实例只产生扇形地面、尖刺、魂气三个批次，没有每根刺独立材质或模型文件。

现有 `vfx_chaos_rift_spikes` 使用 warning 持续预警和 erupt 单次释放；原动作 0.80 秒出斧后约 0.28 秒成形。预警无自动 next，以支持中断。自动测试见 `tests/fire-chaos-effects.test.js`，组合浏览器验证见 `tests/fire-chaos-browser.js`。

### orbit：几何环绕类粒子

支持 cone 和 sphere，实例化批量绘制。`position` 为挂点局部中心、`angularSpeed` 为弧度／秒，按 count 均分圆周；`bob` 定义上下正弦偏移，`pulse` 定义正弦平方的缩放脉动。二者 frequency 都按弧度／秒，phaseStep 为相邻粒子的弧度相位差。profile 定义 `strength` 和 `radius`，variant 可控制火／毒图层互斥。坐标跟随 attachment。

### material：模型材质变化

`prefixes` 筛选模型 Mesh 名称前缀。profile 定义基础色倍率、emissive（固定颜色或 `$variant`）及强度曲线。必须绑定模型；每实例克隆被修改的材质，退出／销毁时恢复，禁止影响共享材质实例。基础材质需具有 color 与 emissive。

## 曲线

profile 值可为常数、`{keys:[[0,value],[1,value]],interpolation:"linear"|"smooth"}` 或 `{wave:"sin"|"sinSquared",domain:"seconds"|"normalized",frequency,phase,amplitude,bias}`。

关键帧按 0..1 归一化时间严格递增并覆盖两端。wave 的 frequency 为每秒／每个归一化周期的循环次数，phase 为弧度；结果是 `bias + amplitude × wave(2π × frequency × time + phase)`。循环状态的归一化时间取余，seconds 波形连续推进。附魔原有正弦平方聚拢／强度曲线可精确表示。

## 专用预览器

双击 [previewer/effects.html](../previewer/effects.html)，与 `previewer/index.html` 的模型动画预览完全独立，无服务器、无联网依赖。

- 内置四十三款编译样例（含四款定制与四款通用武器附魔）；溅血／附魔台及五种静态飞行物保留参考 GLB。飞行物使用静态槽位绑定，无动画依赖；其余角色技能与装备组合审阅使用独立临时页面。
- 打开单个 `.vfx` 或选择 `generated` 目录批量载入；单文件可复用内置同 ID 参考模型，其他绑定需提供对应 GLB。目录导入以所选 GLB 为准。
- 选择表现状态、火毒变体、亮暗背景、距离；拖拽旋转，滚轮缩放，右键平移。
- 播放／暂停、拖动时间轴；结束后再次播放重播。`next` 到时恢复指定表现末态。
- 1／2／30／50 个实例、仅控制第一个实例、禁止突发反馈及清除；显示绘制数与资源计数。
- 修改源定义后重新编译并重建内置样例，或在打开的预览器中重新选择最新 `.vfx`。目录选择是文件快照，不自动热重载。

## 验证与范围

`tests/effects.test.js` 检查坏定义、确定性导出、自包含纹理、路径限制、附魔台旧版行为对比、实例材质隔离、时间采样及释放。`tests/effects-browser.js` 在 file:// Chrome 检查实际贴图、50 个实例、状态切换、动画末态、单文件导入与资源计数；技术证据保存在 `.qa/effects/`，不新增美术交付报告。

当前支持受控连续 beam 火焰流；尚不支持通用连续发射器、世界轨迹拖尾、碰撞、序列图动画或任意 shader。遇到这些实际需求时扩展受校验的通用图层，不能把特效专用代码塞进 `.vfx`。旧 `InteractableFeedback.js`／`AltarFeedback.json` 留在 ForgeKit 源库作为已验收基线与旧设施回归参照，不再交付游戏；新制作使用 effect.v1。

### beam：可调长度的连续局部火焰流

起点为局部原点，+Z 向前。length、width 独立控制长宽；speed 为沿轴流速，size 为相对宽度的雾片尺寸，spread 为横向分布系数，count／seed 保持固定容量与确定性。纹理内嵌，profiles.strength 控制显隐。setBeam(length,width) 更新全部 beam 图层，先验证全部参数，不重新分配缓冲区、不重置状态；长度 0 隐藏，长度 0～10000 米，宽度大于 0 且至多 10000 米。采用绝对时间采样，支持反向 seek；显式结束，不产生伤害或自主碰撞。当前炎魔咆哮为三层 288 片，资产默认 8 米，临时预览覆盖 2～18 米；超长距离固定粒子数会降低密度。

### suction／arc 与 cloud 上升参数

suction 以局部原点为吸引顶点、+Z 为中线，angle／radius 控制扇区，height 控制垂直厚度，speed 为向心流动速度，size 是雾片尺寸，count／seed 固定容量和分布。沿扇区向原点汇聚，不查询或改变 Gameplay 目标。setSector 同时支持 sector 和 suction，先统一校验再更新，无重分配、不重置时序。云片软边不作为判定范围，极端角度／半径仍须按实际场景审阅。

arc 为程序化弯月条带，plane 为 horizontal（XZ）或 vertical（YZ），共同沿 +Z 飞行，radius／angle／width 控制轮廓，speed 控制内部流纹，profiles.strength 控制显隐。只提供形状，不驱动位移／碰撞。新斩击变体只改定义。

cloud profiles 可选 rise 曲线（沿局部 +Y 位移）和 riseSpread（0～1），默认均为 0；riseSpread=1 按稳定粒子种子分散上升速度，形成从地面到高处的连续喷涌。省略新字段时旧效果行为不变。测试见 tests/chaos-skills.test.js 与 tests/chaos-skills-browser.js。

warning 图层：shape 为 sector 或 circle，angle／radius 控制范围，ground 为局部地面偏移，profiles.strength 控制边界显隐。setSector 联动扇形警示与吸引，setGroundOffset(y) 更新警示高度和吸引下界；只适用于根保持 +Y 朝上的平面地面，地形高度由宿主提供。suction 下界沿固定约 45° 张开并夹到地面，独立样例默认局部地面 -2.5 米。地狱之眼 warning 不自动 next，erupt 由外部事件触发。
