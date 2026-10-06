# ForgeKit：AI 资产生成说明

本文件记录现行实现，包含独立 FPS 双臂扩展和 2026-10-05 新增的 humanoid.v2 十三节点人形；v1 七节点继续保留。

## 资产目录与用途（2026-10-04）

- **正式项目资产唯一源库**：`G:\Game\Fire\ForgeKit\assets\FSA(项目使用)`。游戏模型、动画及其源定义都在该库维护。
- **测试与预览归档**：`G:\Game\Fire\ForgeKit\assets\legacy`。其中 `definitions/` 和 `generated/` 仅用于测试模型、实验和效果预览；迁移时保留的旧正式资产副本也仅作历史参考，不是正式源，不得同步到游戏项目。
- 不要重新创建 `ForgeKit/assets/definitions` 或 `ForgeKit/assets/generated`，也不要把正式资产输出到 legacy。
- 正式模型：`assets/FSA(项目使用)/definitions/models/<分类>/<name>.model.json` → `assets/FSA(项目使用)/generated/models/<分类>/<name>.glb`。
- 正式动画：`assets/FSA(项目使用)/definitions/animations/<分类>/<name>.anim.json` → `assets/FSA(项目使用)/generated/animations/<分类>/<name>.anim.glb`。
- Pose 与材质分别放正式库 `definitions/poses/`、`definitions/materials/`，仅供引用，不单独输出。
- 只手工编辑 definitions；generated 内的 GLB 必须由编译器生成。保留分类子目录。

## 校验、编译和预览

在 ForgeKit 根目录执行；不带参数时默认处理正式 FSA 库：

```powershell
node tools/validator/validate.js
node tools/compiler/build.js
```

测试资产须显式指定 legacy：

```powershell
node tools/validator/validate.js "assets/legacy/definitions"
node tools/compiler/build.js "assets/legacy/definitions"
```

编译器写入输入 definitions 同级的 generated，并保留 models/animations 下的分类路径。全部校验与编译成功后才替换产物；错误含 Code、File、Path、Description、Fix Hint，需修正后再交付。编译不会自动清理旧文件，也不会自动修改游戏项目或配置表。

预览器选择正式库或 legacy 库下的 generated 目录，不选父目录；更新文件后重新选择目录。测试与正式目录不得混合加载作为交付来源。

## 正式资产完成后的同步要求

每次完成新增或修改的正式模型、动画后，必须完成以下交付步骤，不能只停留在 ForgeKit：

1. 校验正式 definitions、重新编译对应产物，并检查模型外观、装备连接或动画效果。
2. 将本次新增或修改的 GLB 从 `ForgeKit/assets/FSA(项目使用)/generated/` 同步到 `G:\Game\Fire\Deadzone Protocol\Assets`，保持相对于 generated 的路径。例如 `models/characters/enemies/elite/` 在目标 Assets 下保持同样结构。按实际内容比较、更新，不从 legacy 取交付文件，不覆盖无关项目资产。
3. 同步维护 `G:\Game\Fire\Deadzone Protocol\Assets\模型动画资产配置表.md`：模型记录“资产游戏内对应名称—类型—资产路径—备注”，动画记录“资产游戏内对应名称—资产路径—备注”。路径统一相对游戏项目 Assets 根目录；新增资产增加条目，修改资产更新对应备注，路径变更时同步改表与相关引用。
4. 保留配置表中已确认的游戏内名称；文件名中的英文标识不等同于显示名称。九件初版武器依次为 AK-47 战术、MP5 战术、M249-E4、M14-A、M24-A3、M870-C、DE-50 战术、军用匕首、M67 破片手榴弹，类型及准确映射以配置表为准。
5. 法师投掷 Cast 与弓箭发射 Shoot 均视为可复用角色动画，暂不归为专用资产；源定义、FSA 生成产物和游戏 Assets 中均必须存放于 animations/characters/shared/；文件名和资产 ID 统一使用 FSA_ANIM_Character_Cast / FSA_ANIM_Character_Shoot，不携带角色代号。
6. 节点、插槽、动画事件或使用契约有变化时，更新目标 `Assets/模型资产使用说明.md`；详细名称与路径对应关系只在配置表维护。遵循目标项目 AGENTS.md，若改动运行时代码或构建脚本则执行项目要求的检查与构建。
7. 最后验证目标文件与正式生成产物内容一致、配置表路径均存在且无遗漏或重复。资产入库不等于已实现游戏行为，不得把待接入逻辑描述为已完成。

## 通用约束

环境资产另遵循 [environment.v1](ENVIRONMENT_RULES.md)：可进入建筑、地形、实心物件、静态围挡与滑动门必须配套空间契约，使用 `tools/environment/build.js` 专用入口。不要只交模型，也不要自行给现有 model.v1 添加未经支持的碰撞、门洞等字段。环境样件属于规范参考，不按正式 FSA 资产同步到游戏。

+Y 上、+X 右、+Z 正面，米制；局部 position=[x,y,z]，rotation=[x,y,z] 为 Euler XYZ 角度，scale 为正标量或三正数。默认位置/旋转零、缩放一。
人形原点在双脚中心地面；建筑原点在底面中心；武器原点在主握点。Plane 位于 XY、朝 +Z，其余轴向几何沿 Y。
asset id：字母开头，只含字母、数字、`_ . -`，最长 96 字符，整个定义目录唯一。
Part / Socket id 不允许 `.`，全模型唯一，不能叫 Asset 或与骨骼/自动外观节点重名。未知字段、NaN、Infinity、顶点/索引/Quaternion 全部禁止。

## Model

根字段：`schema:"model.v1"`、`id`、`type:"static"|"humanoid"|"fps_arms"`；可选 root、parts、materials、sockets。静态模型和 FPS 双臂必须有非空 parts。
Part：必填 id、shape；可选 parent、position、rotation、scale、material。parent 指向已定义 Part、Socket 或固定 Bone，不得形成环；未指定时挂资产根，人形挂 Root。

| shape.type | 其余必填字段 |
| --- | --- |
| box | size: [宽,高,深] |
| rock | size: [宽,高,深]、seed（0～4294967295 整数）；确定性不规则凸岩体、平面法线；不用原始顶点或节点缩放 |
| sphere | radius |
| cylinder | radiusTop, radiusBottom, height |
| capsule | radius, length（两端半球之间长度，总高 length+2×radius） |
| cone | radius, height |
| plane | width, height |

尺寸为 (0,10000]；capsule.length 可为 0；圆柱半径可为 0，但不能两个都为 0。scale 同样为 (0,10000]。
材质对象可含 color、emissive（`#RRGGBB`）、roughness/metalness/opacity（0..1）、transparent（布尔）。默认 color=#aab3c2、emissive=#000000、roughness=0.8、metalness=0、opacity=1、transparent=false。透明材质显式设置 transparent=true。
material 可写内联对象或字符串 ID。根 materials 字典可提供本地对象/别名，本地优先；全局材质文件为 `{"schema":"material.v1","id":"material.steel","color":"#556677","metalness":0.8}`。
Socket：id、parent 必填，其余 Transform 可选；不创建几何。

```json
{"schema":"model.v1","id":"example.box","type":"static","parts":[{"id":"box","shape":{"type":"box","size":[1,1,1]},"position":[0,0.5,0],"material":{"color":"#b78653"}}],"sockets":[{"id":"top","parent":"box","position":[0,0.5,0]}]}
```

## Humanoid

必须增加 `rig:"humanoid.v1"` 或 `rig:"humanoid.v2"`。v1 固定七节点：Root → Body → Head / Arm_L / Arm_R / Leg_L / Leg_R，不能声明、添加或更改骨骼。v2 在固定层级中增加 Forearm_L/R、Hand_L/R、LowerLeg_L/R，共十三节点；只允许使用所选版本的固定骨架，不允许任意新增骨骼。
默认 T-Pose：左臂 +X、右臂 -X、腿 -Y，局部旋转全零。允许同一 Bone 挂多个 Part。非空 parts 替换整个默认外观；省略/清空 parts 自动生成外观。
parameters 可含 height、bodyWidth、bodyDepth、headScale、armLength、armThickness、legLength、legThickness，均为 (0,10000]。
默认 height=1.8；相对 height 的默认比例依次为 bodyWidth=.25、bodyDepth=.14、armLength=.32、armThickness=.09、legLength=.46、legThickness=.11；headScale=1。
头边长=height×.16×headScale；身体高=height−legLength−头边长，必须正数。Body 位于 y=legLength；Head 在 Body 上方身体高度；手臂根 (±bodyWidth/2,身体高×.85,0)；腿根 (±bodyWidth×.25,0,0)，均为 Body 局部坐标。

```json
{"schema":"model.v1","id":"example.person","type":"humanoid","rig":"humanoid.v1","parameters":{"height":1.8}}
```

## Animation / Pose

必填 schema=`animation.v1`、id、rig=`humanoid.v1` 或 `humanoid.v2`（FPS 见后文）、duration（0..600 秒，不含 0）、loop（布尔）、mode。
generator 模式必须有 generator=`humanoid.idle|humanoid.walk|humanoid.run`，禁止 tracks。可选 parameters：armSwing=0..180°、legSwing=0..90°、bodyBob=0..0.2m、bodyLean=-45..45°、samples=8..240 整数。
默认 Idle: 2°/0°/.005m/0°；Walk:25°/30°/.02m/2°；Run:45°/45°/.045m/10°，samples=48。

```json
{"schema":"animation.v1","id":"animation.walk","rig":"humanoid.v1","duration":1,"loop":true,"mode":"generator","generator":"humanoid.walk","parameters":{"armSwing":25,"legSwing":30,"bodyBob":0.02,"bodyLean":2}}
```

timeline 模式必须有非空 tracks，禁止 generator/parameters。tracks 键只能为所选 rig 的固定骨骼名：v1 七个，v2 十三个。键帧至少一个，time 在 0..duration 严格递增，包含 rotation、position 或 pose 中至少一项。
rotation 是绝对局部 XYZ 角度；只有 Body 可以有 position，表示相对默认位置的增量，单轴 ±0.2m。禁止所有其他骨骼位移。
缺失通道保持默认姿态；首尾缺失时间段保持最近值。Pose 通过资产 id 引用，并且必须定义当前 Bone；键帧显式字段覆盖 Pose 同名字段。

```json
{"schema":"pose.v1","id":"pose.ready","rig":"humanoid.v1","bones":{"Arm_R":{"rotation":[0,0,90]}}}
```

```json
{"schema":"animation.v1","id":"animation.attack","rig":"humanoid.v1","duration":0.8,"loop":false,"mode":"timeline","tracks":{"Arm_R":[{"time":0,"pose":"pose.ready"},{"time":0.3,"rotation":[-70,0,90]},{"time":0.8,"pose":"pose.ready"}]}}
```

手臂降至身体两侧的 Z 角为 Arm_L=-90°、Arm_R=90°。动画全部 In Place，不支持 IK、Root Motion、所选 rig 之外的额外骨骼或连续蒙皮。

### 十三节点扩展：humanoid.v2

层级增加 Arm_L/R → Forearm_L/R → Hand_L/R，以及 Leg_L/R → LowerLeg_L/R。原七节点平移与旋转规则不变；默认肘位置为 [±armLength×0.5,0,0]、腕相对前臂为 [±armLength×0.4,0,0]、膝为 [0,−legLength×0.5,0]。

自定义非空 parts 的 v2 模型可选 jointPositions，键仅上述六个新增骨骼，值是相对固定父节点的局部 position，分量有限且在 ±10000 米内；缺省使用默认位置。v1/FPS/static 禁用，使用默认自动外观时也禁用。它只调整默认关节位置，动画仍只有 Body 可以位移。零局部旋转为参考姿态；不得用 Mesh/Socket 占用新骨骼名称。

v2 的 timeline / pose 支持十三节点绝对局部 XYZ 旋转。generator 只生成原七节点的基础摆动，其余关节保持默认，不自动补屈肘或屈膝。Pose 必须同 rig。

v1 资产保留原版本与签名。v2 模型播放 v1 动画必须使用显式单向适配，不能直接跳过签名校验，也不支持反向播放。当前 ForgeRuntime.compatibility / prepareClip 已支持此路径，含默认姿态缓存、Body 平移重定基准及新关节缺失轨道补齐。详见 [十三节点契约与炎巫迁移](HUMANOID_V2.md) 和 [运行时使用说明](RUNTIME_ASSET_USAGE.md)。

## 独立 FPS 双臂：fps-arms.v1

此节仅适用于玩家第一人称双臂，不改变上文敌人/NPC 的 humanoid.v1 七节点规则。

- 模型 `type:"fps_arms"`、`rig:"fps-arms.v1"`，必须非空 parts；不接受 parameters，不自动生成外观。Part/Socket 可挂下述固定节点，未指定 parent 的 Part 挂 Root。不能声明额外骨骼。
- 层级：`Root → UpperArm_L → Forearm_L`、`Root → UpperArm_R → Forearm_R`。Root 是不可动画的容器，只有四个关节骨骼，每臂两个单轴旋转自由度，无独立手腕/手指。
- +Y 上、+X 为镜头左侧（镜头沿 +Z 看、+Y 向上）、+Z 为镜头前方；L 在 +X、R 在 -X，与正面朝观察者的人形 T-Pose 左右约定分开。
- 原点是镜头参考点；肩部局部位置 L=[.15,-.16,0]、R=[-.225,-.16,0]；上臂长 .28m，前臂长 .25m，各段沿本地 +Z。前臂节点位于上臂 [0,0,.28]。
- 默认准备姿态：肩部 rest quaternion 为 Y(左 -16°/右 +16°) × X(40°)，肘部为 X(-80°)。这是骨架的固定基准，不是额外动画自由度。尺寸、基准及单轴约定纳入 rigSignature。
- 手部几何直接挂 Forearm，不增加节点自由度。FSA 模型设置 `Weapon_L`（挂 Forearm_L，支撑参考）、`Weapon_R`（挂 Forearm_R，原单武器挂件）及 `Camera_FPS`（挂 Root，相机点位）三个原 Socket（暗影双刃专用扩展见下文）；默认姿态下插槽坐标轴对齐全局 +Y/+Z，武器原点直接对齐它。
- Pose、Animation 的 rig 也支持 `fps-arms.v1`；仅 timeline，禁止 humanoid generator。tracks/bones 仅接受四个关节名，不接受 Root。
- FPS rotation 必须 `[角度,0,0]`，表示相对各关节默认姿态的本地 X 轴旋转增量；编译为 `qRest × qX(angle)`。禁止任何骨骼 position。零旋转增量保持默认准备姿态；这与人形绝对局部 Euler 的语义不同。
- Pose 引用必须与动画同 rig。运行时仍按 rigId、rigVersion、rigSignature 三字段检查兼容性；FPS 不能播放七节点人形动画。
- FSA 项目已交付双臂模型与基础 FPS 动画，并追加空手 Roll、暗影双刃等扩展。当前清单和外部事件时刻以游戏项目 `Assets/模型动画资产配置表.md`、`Assets/模型资产使用说明.md` 为准。

### 暗影双刃专用挂接（2026-10-05）

现有双臂在原 Weapon_L / Weapon_R / Camera_FPS 之外，新增 ShadowBlade_L/R 两个 Socket，分别挂 Forearm_L/R；局部位置均为 [0,0,0.251]，局部 XYZ 角度分别为 [40,16,-12] / [40,-16,12]。左、右独立刃模型原点为握柄中心、+Y 指向刃尖，分别挂对应 Socket 后清零局部变换，缩放 1。Weapon_L 仍是原支撑参考，Weapon_R 继续承载原单武器，不把双刃交叉挂到旧插槽。

专用八段 fps-arms.v1 动画位于 `animations/fps/melee/shadow_blades/`，左肩 stance 偏移 [+0.15,0,0]；Draw 使用 in，Holster 使用 out，其余 constant。新增 Socket 不改变四关节骨架或 rigSignature。握点与旧装备衔接、左肩混合、影袭位移/命中窗口详见游戏项目使用说明；资产入库不表示游戏已有双持和技能逻辑。

### FPS 模型默认姿态扩展

fps_arms 模型可选 rigPose 对象，键仅 UpperArm_L/Forearm_L/UpperArm_R/Forearm_R，值为有限角度标量；在对应节点固定基准上追加本地 X 轴旋转。只影响模型默认姿态，不修改动画导出规则。static/humanoid 禁止该字段。播放旧动画时其轨道会覆盖默认姿态。Camera_FPS 的 rotation=[0,180,0] 对应相机 -Z 前向，运行时应用其世界四元数，不要额外乘基准。

### FPS 动画专用摆位

FPS timeline 可选 stance={leftOffset:[x,0,z],blend:"constant"|"in"|"out"|"assist"}。分量范围 ±0.15m，Y 必须为 0，仅 fps-arms.v1 可用。它是左上臂整段的站位调整，不新增骨骼；原 tracks 仍禁止 position，仅支持本地 X 轴旋转。编译器额外生成 UpperArm_L.position 曲线，使用 canonical-local 编码。constant 为全程偏移；in 在末尾 25% 淡入；out 在开头 25% 淡出；assist 在开头 12% 淡出、末尾 12% 淡入，中间零偏移。全部使用 smoothstep。根节点不移动。

2026-10-05：cone 可选 radialSegments（整数 3～64）；省略保持原 24 段外观。显式指定时使用平面法线，供棱角水晶使用；不改变其他资产。

## 大型交互物节点动画

现支持 animation.v1 / nodes.v1，targetModel 引用静态模型，绝对局部 TRS 轨道和签名校验。制作前阅读 [节点动画契约](NODE_ANIMATIONS.md)；封印与材质效果独立交付，不属于 GLB 动画轨道。

## 特效资产（effect.v1）

新增特效先读 [特效管线规范](EFFECTS.md)。正式源在 `assets/FSA(项目使用)/definitions/effects/`，命名为 `*.effect.json`；贴图与制作脚本保留制作侧，编译后每款只交付一个 `generated/effects/**/*.vfx`。校验与编译已纳入默认 validate/build 命令。游戏所有特效共用 `Assets/effects/ForgeVFX.mjs`，不得新增一款一个播放器的交付方式。

制作完成后重建 `previewer/effects.html` 专用预览器，验证单次／循环、状态／材质、绑定和多实例；模型动画仍使用独立 GLB 和原预览入口。同步命令 `npm run deliver:effects`，另须维护游戏 `Assets/特效资产配置表.md` 及 `Assets/特效资产使用说明.md`。不另写美术交付报告。

2026-10-06 室内门组合补充：building.doors 可引用独立 gate（id/asset/position/yaw/pocket），position 为建筑局部米制，yaw 为度。构建时将同级 doors 源依赖加入当前输出批次，门的规范登记保持独立；不把活动门烘焙为固定墙。组合预览中每实例独立状态，一次开启并保持末帧，移动碰撞随动画同进度变换；绿色开关可点击，重置和采样只作验收。组合通路检查使用所有门完全开启状态，关闭阻挡及中间帧另外检查。此能力属于 ForgeKit，不表示游戏运行时已接入。
