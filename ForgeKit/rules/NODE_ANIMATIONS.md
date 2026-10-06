# 通用设施节点动画（nodes.v1）

2026-10-05。用于静态模型的活动 Part/Socket，不改变 humanoid.v1/v2 和 fps-arms.v1。

## 源定义与编译

模型仍为 model.v1 / static。动画为 animation.v1，rig="nodes.v1"，mode="timeline"，targetModel 必须引用同一 definitions 库中的静态模型 id。duration、loop、tracks 沿用 animation.v1；只允许模型中已有 Part/Socket 名，不允许 Asset 根节点、未知节点、Pose 引用或 generator。

键帧 time 严格递增，0..duration；rotation 为绝对局部 XYZ 度，position 为绝对局部米制位置（分量 ±10000 内），scale 为三个正数（每轴不超过 10000）。不同于角色 Body，position 不叠加默认平移。GLB 使用 quaternion SLERP / translation、scale LINEAR；缺少首尾时间时扩展最近键帧到边界。未写通道保持模型默认值；跨片段使用前恢复参考姿态，首版不提供任意节点跨片段混合补轨。

只有被 nodes.v1 动画引用的静态模型会增加 rigId="nodes"、rigVersion="1"、rigSignature、nodeNames 元数据。签名绑定模型 id、根变换、全部节点名称/父级/参考 TRS；修改这些字段后必须重编模型及动画。无关静态资产和旧角色/FPS 导出路径保持原契约。

动画文件没有 Mesh，包含匹配节点树和一个片段。材质、粒子和封印状态不写入动画轨道。

## 当前特效交付

附魔台粒子与材质已迁入 `generated/effects/world/interactables/vfx_altar_feedback.vfx`，由共用 ForgeVFX 播放。独立特效预览入口为 `previewer/effects.html`。节点 GLB 和签名不变，动画按 VFX binding.animationStates 与效果时钟同步；详见 [特效规范](EFFECTS.md)。游戏共享节点辅助库为 `Assets/runtime/ForgeRuntime.js`，Placement 归到 `Assets/models/world/interactables/Placement.json`。

## 绑定、预览与持久状态

使用 previewer/runtime.js 的 metadata / compatibility / captureRestPose / prepareClip。拒绝错误签名，禁止跨模型箱盖轨道混用；position 不作人形重定基准。每个实例独立节点树、AnimationMixer；修改材质前逐个克隆。

原 previewer/index.html 选择正式 generated 目录即可绑定三段新动画，单次片段末帧 clampWhenFinished。原预览器的 None 用于返回参考姿态，不是游戏持久状态接口。

完整设施预览：`node tools/scripts/build-interactables-review.mjs` 后打开 `.qa/Interactables-Review.html`，含双实例、火毒封印、解锁淡出、关键帧拖动和状态恢复。此 HTML 自包含，可直接 file:// 打开。

旧设施控制器（仅保留为已验收行为基线与旧回归预览，不再作为当前特效交付；新特效请使用上面的 VFX 管线）：`assets/FSA(项目使用)/definitions/effects/world/interactables/InteractableFeedback.js`。`ForgeInteractables.create(modelScene, clip, animationMeta, config, THREE, ForgeRuntime)` 返回：

- `setState(state)`：直接恢复持久表现；箱体 closed/opened/empty，附魔台 available/unlocked/sealed_fire/sealed_poison/exhausted。
- `play('fire'|'poison')`：收到已确认结果后播放，update(dt) 到末帧后保持打开／耗尽。
- `unlockSeal()`：当前封印用 0.65 秒消退，同一模型变为 unlocked；需由调用方确认首领确已击败。
- `stopAndRestore(confirmedState)`：停止动画后恢复玩法提供的状态。重新加载模型后也应调用 setState；不要先播放一遍开箱。
- `seek(seconds)`：验收采样，非游戏状态提交接口。
- `dispose()`：释放实例控制器拥有的材质和效果几何，模型几何仍由模型所有者管理。

update 使用世界实际 dt；只有 ESC 暂停时不推进。代码不冻结玩家、不修改背包、不触发伤害、首领或奖励。效果配置为 forge-interactable-feedback.v1，由该控制器消费，不由 GLB 编译器处理。

## 重现与检查

在 ForgeKit 根目录依次运行：

```powershell
node tools/scripts/author-interactables.mjs
node tools/validator/validate.js
node tools/compiler/build.js
npm test
node tools/scripts/build-interactables-review.mjs
node .qa/verify-interactables-browser.mjs
node .qa/verify-interactables-original.mjs
node tools/scripts/deliver-interactables.mjs
```

浏览器检查脚本使用本机 Chromium 独立临时测试配置；交付 HTML 本身不要求关闭浏览器安全设置。源与产物对应关系见游戏项目 Assets/模型动画资产配置表.md；同步校验清单保存于 ForgeKit/.qa/interactables-delivery-manifest.json。项目内不另建美术交付报告或验收预览目录。Placement.json 为摆放和碰撞参考，不自动创建物理碰撞。
