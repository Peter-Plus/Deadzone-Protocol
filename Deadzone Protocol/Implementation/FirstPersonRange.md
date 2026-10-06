# 第一人称训练场实现

2026-09-30。默认打开 Play.html 进入本场景；#foundation 保留旧基础诊断。当前是射击与移动原型，不是生存单局。

## 运行模块

| 目录 / 入口 | 真实职责 |
| --- | --- |
| src/app/range-application.ts | 初始化、组装与销毁；RAF、暂停、重开、错误提示。 |
| src/config/range.json / range-config.ts | 原型配置及严格运行时校验；不与 foundation 配置混用。 |
| src/input/range-input.ts | DOM 键鼠采集、Pointer Lock、窗口模式、短按缓冲与失焦清理。 |
| src/character/player.ts | 视角、平面移动、跳跃、重力与玩家只读快照；依赖物理端口。 |
| src/physics/contracts.ts | 普通数据的 move/raycast/removeTarget/dispose 端口。 |
| src/physics/rapier-world.ts | 唯一 Rapier 适配入口；胶囊控制器、静态盒碰撞、最近射线命中、World 生命周期。 |
| src/combat/weapon.ts | 单把自动武器的射速、弹匣、备弹、开火与换弹时间线。 |
| src/range/level.ts | 测试场的结构化几何与 EntityId。 |
| src/range/session.ts | 固定 Tick 中组装玩家、武器、靶子血量/成绩；输出冻结快照。 |
| src/presentation/assets/range-assets.ts | 六个内嵌 GLB 的解析与必须节点校验。 |
| src/presentation/range-view.ts | 世界表现、第一人称视图组、动画采样、枪口闪光与命中点表现。 |
| src/ui/range-panel.ts / range.css | 开始菜单、操作说明、弹药、靶子成绩、命中准星。 |

app 允许访问适配层与 UI；Gameplay 不访问 Three.js/DOM。Player 与 Range 只导入 physics/contracts，不能直接导入 Rapier。边界测试检查这些约束。当前配置类型仍以测试场为载体，扩展正式玩法时按实际需求抽出共享配置，勿预建全量系统。

## 物理与坐标

制作人明确选择 Rapier；依赖固定 @dimforge/rapier3d-compat 0.21.0，init 完成后才能创建 World。兼容包内嵌 WASM，没有运行时 .wasm 请求。

单位米/秒；Y 向上；初始朝向为 +Z。玩家使用 position-based kinematic body + 竖直胶囊，半径 0.3m、高度 1.8m；0.01m 接触间隙、0.15m 地面吸附、45° 爬坡阈值。未启用自动爬台阶，也未验收坡面、移动平台或动态刚体互动。

每步：输入归一化 → Player 计算期望位移 → CharacterController.computeColliderMovement → setNextKinematicTranslation → world.step → 返回脚底位置/着地/头顶受阻。着地后不继续每步压向地面，离地/起跳后恢复重力，避免接触面反复 shape cast 导致移动停顿。八方向地面移动回归测试覆盖该问题。

视角使用 YXZ 旋转，鼠标右移减少 yaw，下移增加 pitch。pitch 限制在 ±1.45rad。相机与射线共用朝向定义，+Z 朝前时屏幕右方为世界 -X。射线从逻辑眼睛位置沿准星方向出发，排除玩家自身，命中最近碰撞体；墙体和掩体可挡住目标。

所有静态碰撞数据来自 level.ts 中的 box 描述，Three.js 网格由同一描述构造，不从美术几何推算碰撞。靶面碰撞尺寸为 1.3×1.7×0.3m；靶架只是表现，不另设碰撞。靶子销毁时移除靶面 collider，画面隐藏该组。

## 武器与靶子

当前仅 Vanguard、自动连发、无散布 Hitscan，默认 8 发/秒、30 发弹匣、180 备弹、34 伤害；5 个 100HP 靶子每个三枪击倒。没有生存属性、敌人、弹药拾取或胜负 GameFlow。

Weapon 是唯一弹药所有者，暂由 RangeSession 持有。Item 尚未实现；未来整合时让 ItemInstance 持有这一个武器状态，Equipment 只引用它，不能另复制弹药。

- update(dt, trigger) 最多提交一发并返回是否开火，调用者执行射线。只由固定 Tick 驱动；配置限制射速不高于固定频率。保留连续射击的冷却余量，避免 8Hz 在 60Hz Tick 下变成 7.5Hz，也不积累闲置时间来补射。
- requestReload 拒绝满弹匣、零备弹和重复换弹。在动作时间 1.18 秒单次提交 min(弹匣缺口, 备弹)，1.45 秒结束；时间跨越也正确提交。直到动作结束都不能射击。
- cancelAction 区分提交前后：不提交未来事件，不撤销已提交弹药。当前 UI 没有取消/切枪入口，接口由测试覆盖，供后续模块接入。
- 暂停停止模拟，换弹不取消，恢复后按原进度继续。重开创建新会话和物理 World，恢复靶子、弹药与统计。

射速/伤害/动作时间是配置值；动画只表现已发生的 Gameplay，不靠动画回调扣弹或造成伤害。

## 资产与动画

源 GLB 未修改。构建器对 .glb 使用 base64 loader，产物内嵌：FPS Arms、Vanguard、Firearm Idle/Walk/Fire/Reload。运行时 atob → Uint8Array → GLTFLoader.parseAsync(ArrayBuffer)。资产测试保证无外部 buffer/image URI，节点与动画目标可绑定；本轮没有建立通用资产缓存/全部装备加载器。

保留原节点层级与局部变换；整枪挂在 Weapon_R 并归零外层局部变换。Camera_FPS 下挂 Three.js 相机，镜头相对参考节点局部变换归零。视图组按 Player 姿态移动旋转，并减去相机参考偏移，使实际相机世界位置严格等于逻辑眼睛。相机不会跟随手臂关节动画。

World 和 Hands 两个 Three.js Scene 使用同一相机；先画世界、清深度、再画双臂。这是第一人称遮挡处理，武器网格不参与物理。Vanguard 枪口闪光使用经 Bore 几何位置核对的独立局部偏移 (0, 0.137, 0.575)，不将 Weapon_R 当作枪口。

AnimationMixer 根据只读动作/模拟时间采样。Reload/Fire 用 Weapon.actionTime；Idle/Walk 循环采样模拟时间；当前切换直接切动作，尚无精细混合。暂停时动作停在对应姿态。当前只有一个双臂实例，每次应用启动独立解析节点，不共享可变动画实例。

重开复用 renderer 和模型实例，恢复各靶子可见性；替换物理 World。应用销毁停止 RAF、移除监听/ResizeObserver、释放 World、GPU geometry/material 与 renderer。已有资产没有纹理；日后加入纹理必须同步扩展释放逻辑。

## 输入与生命周期

菜单暂停时不采集 Gameplay 按键。锁定模式按正常 Pointer Lock 请求；拒绝时退回菜单，提示用窗口模式，不自动假装已锁定。窗口模式右键拖动或方向键观察。两种模式均支持 WASD、Space、左键/F、R、Escape。

短按 Fire/Jump/Reload 缓冲至下一固定步，只消费一次；Fire 按住时持续为真。blur、页面隐藏、锁定丢失和暂停清空按键、鼠标状态与待处理事件。RAF 前次时间也清除，恢复后不补算后台时间。运行异常或 WebGL 上下文丢失停止循环，提示刷新。

## 交付限制

Play.html 约 5 MB，自包含代码/WASM/资源。制作人已反馈完成本轮验收。自动化只验收 HTTP 下同一产物，工具不允许 file://；内置浏览器的 Pointer Lock 请求被拒绝，已验证窗口模式及失败提示。人工整体验收不替代后续新增功能的回归或跨浏览器测试。

无音效、后坐力/散布/ADS、枪械切换、物品系统、敌人、存档和完整生存玩法；不把靶子当 Enemy 模块。现有自动测试和手动结果见 Production/Reviews/FirstPersonRangeVerification.md。
