# 环境资产公共规范 · environment.v1

2026-10-05。适用于地形、单层可进入建筑、实心物件、静态围挡、动态通行设施。大型交互设施已独立完成，继续使用原 nodes.v1 / 特效流程，不重复纳入。

## 入口与定位

本规范统一的是空间数据与检查方式，不规定所有资产具有相同数量的节点。地区风格、建筑尺寸与外观变体属于资产内容。先阅读公共规范，再按类型阅读：

| type | 专项规范 | 可复制的样件定义 |
| --- | --- | --- |
| terrain | [地形](environment/TERRAIN.md) | [ENV_Terrain](../assets/environment-samples/definitions/ENV_Terrain.environment.json) |
| building | [单层建筑](environment/BUILDING.md) | [ENV_Building](../assets/environment-samples/definitions/ENV_Building.environment.json) |
| solid | [实心物件](environment/SOLID.md) | [ENV_Solid](../assets/environment-samples/definitions/ENV_Solid.environment.json) |
| barrier | [静态围挡](environment/BARRIER.md) | [ENV_Barrier](../assets/environment-samples/definitions/ENV_Barrier.environment.json) |
| gate | [动态通行设施](environment/GATE.md) | [ENV_Gate](../assets/environment-samples/definitions/ENV_Gate.environment.json) |

这些是生产规范样件，不是已验收的正式美术资产。源与产物位于 `assets/environment-samples/`，不覆盖 FSA、游戏 Assets 或此前 Test。制作人后续派发正式美术项时，另建正式定义，不改坏样件。

## 一份定义，统一输出

源为 `*.environment.json`，schema=`environment.v1`。机器字段以 [schema.js](../tools/environment/schema.js) 为准，未知字段拒绝。结构采用：

- `id / label / type`：唯一标识、预览名称、类型。
- `model`：内嵌现有 `model.v1 / static`，复用原模型校验和 GLB 编译器。外部材质库引用不在此版本支持范围，使用内联或模型局部材质。
- `colliders`：引用实际 Box Part 名并声明用途，尺寸与变换从该 Part 导出，不手写第二份碰撞尺寸。角色通行碰撞不从复杂装饰网格自动推断。
- `walkables`：引用 floor/ramp 碰撞节点；墙和屋顶不能冒充可走地面。
- `placement`：XZ 最小/最大边界，覆盖模型、入口、坡道、落脚和活动部件。这是生成预留范围，不是实心碰撞体。
- `profiles / entrances / routes`：声明适用通行体型、门洞信息与需通过的验收路径。没有程序从节点名称猜测入口。
- `lootZones / exclusions`：室内候选投放矩形和禁放矩形；候选区不是自动合法的出生点。
- `connectors`：围挡连接位置、向外方向、墙高和厚度。
- `terrain / gate / animation`：各专项数据，按类型使用；不支持任意跨类型混合能力。

模型根变换必须为单位变换；部件使用实际尺寸，不使用缩放。米制、+Y 上、+Z 正面，原点为地基或物件底面中心；埋地地基和坡道实体可低于原点。源模型旋转为 Euler XYZ **度**，导出碰撞为 Quaternion；实例摆放 yaw 参数为 **弧度**，不得混淆。

首版实例只允许平移和绕 Y 旋转，scale 固定为 1。要不同大小就生成独立尺寸变体，并重新验证；不能通过随意缩放把已验收门洞缩窄。`transformContract()` 统一变换碰撞、入口、路径、投放区、禁放区、连接点、门移动方向和占地四边形。地形高度场保留本地坐标，查询时先逆变换；本次物理样件地形不作旋转。

## 约束和检查边界

v1 碰撞使用 Box。墙、实心障碍、围挡、门扇只允许绕 Y 旋转；坡道可以倾斜，屋顶转换为保守包围盒，须在预览中确认没有压低室内净空。不处理任意凹网格碰撞、多层建筑、梯子或可破坏结构。装饰可以使用原模型的其他 Primitive，但如果会影响通行，须有相应 Box 结构并声明碰撞；无碰撞的装饰不得占用声明通路。

检查器拒绝缺少结构声明、无效引用、过窄门洞、主通路受阻、投放区与禁放区重叠、超坡度地形、门动画与碰撞位移不一致等情况。路径每 0.08m 采样，并检查角色半径、净高和边缘支撑。2026-10-06 起，普通建筑取消外加坡板，入口向上高差上限 10cm；建筑不同支持面之间分别检查向上 10cm、向下 20cm，不能把小落差当作必须阻挡的陡坡。同一支持面仍按坡度检查。这是样件通路检查，不是游戏寻路系统，不表示所有室内位置都可达，也不保证多人不会堵门。

`profiles` 描述通行量规，不修改游戏角色参数。样件沿用 Test/02 的保守范围：player 半径 0.30m／高 1.80m，A1 0.78m／1.95m，B2 1.34m／3.20m；另加 0.06m 横向余量、最大坡度 15°。它们不是对当前所有角色动作重新测量后的最终值。新正式建筑必须核对当时角色与动画；不默认首领都可进入民居。

## 命令和产物

在 ForgeKit 根目录运行：

```powershell
node tools/environment/build.js
node --test tests/environment.test.js
node tools/environment/verify-physics.js
node tools/environment/verify-browser.js
```

默认编译样件，产出 `models/*.glb`、`animations/*_Open.anim.glb`、`contracts/*.environment.json`、`environment-manifest.json` 及自包含 `EnvironmentPreview.html`。清单和契约记录源文件及 GLB 的哈希，供交付核对；不要手改 generated。源定义包含 model/animation，导出契约改为资产路径及算好的空间数据，不能将导出契约再次当作创作源输入。`verify-physics.js` 只读使用相邻游戏现有 Rapier 依赖；独立分发 ForgeKit 时，该项目集成检查需要提供相应依赖，不影响核心编译和预览。

可指定源与输出目录：

```powershell
node tools/environment/build.js "assets/FSA(项目使用)/definitions/environments" "assets/FSA(项目使用)/generated"
```

此命令只处理指定目录直接包含的环境定义；不递归，子目录需分别调用。采用 FSA 唯一 id 避免与已有模型重名。一次调用先完成全部校验和编译，再逐文件替换产物。新增预览/清单只包含本次输入；不删除其他资产。旧 `tools/compiler/build.js` 不扫描 `.environment.json`，环境必须使用专用入口。

正式资产交付仍遵循 [AI 资产规则](ASSET_RULES_FOR_AI.md)：从 FSA generated 同步本次模型、动画和对应 `contracts` 至游戏 Assets，登记模型动画表并写明空间契约路径。只有已实际交付的资产才登记，样件不登记成正式资产。游戏现阶段尚没有正式环境契约消费器，资产导出不等于游戏接入。

`author-samples.js` 仅用于明确需要重置这五份参考定义时；不是每次编译前都运行，避免覆盖人工修改。预览器、导出器和空间检查代码共用，不按单个美术物件复制一套程序。

验收证据见 [样件验收记录](../assets/environment-samples/ACCEPTANCE.md)。

2026-10-06：building 新增可选 roofMode（full／partial／none），用于明确无顶或局部缺顶状态；未知字段仍严格拒绝，旧定义默认继续要求真实 roof。详见 building 专项规范。生成器和预览继续共用，不因每款建筑新增独立工具。

2026-10-06 室内门组合补充：building.doors 可引用独立 gate（id/asset/position/yaw/pocket），position 为建筑局部米制，yaw 为度。构建时将同级 doors 源依赖加入当前输出批次，门的规范登记保持独立；不把活动门烘焙为固定墙。组合预览中每实例独立状态，一次开启并保持末帧，移动碰撞随动画同进度变换；绿色开关可点击，重置和采样只作验收。组合通路检查使用所有门完全开启状态，关闭阻挡及中间帧另外检查。此能力属于 ForgeKit，不表示游戏运行时已接入。
