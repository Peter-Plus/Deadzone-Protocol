# ForgeKit

独立的程序化资产工具链：JSON Definition → 严格校验 → GLB（模型／动画）或 VFX（特效）→ 离线预览。
实现依据：上级目录的《程序化资产管线策划案_最终修订版.md》。Node.js 22+。

## 资产路径

| 内容 | 路径 |
| --- | --- |
| 模型源文件 | `assets/FSA(项目使用)/definitions/models/*.model.json` |
| 动画源文件 | `assets/FSA(项目使用)/definitions/animations/*.anim.json` |
| Pose / 材质 | `assets/FSA(项目使用)/definitions/poses/*.pose.json` / `materials/*.material.json` |
| **模型产物** | **`assets/FSA(项目使用)/generated/models/`** |
| **动画产物** | **`assets/FSA(项目使用)/generated/animations/`** |

不要直接编辑 generated；修改源文件后重新编译。输出文件名取自源文件名，与资产 id 独立。编译不会自动删除旧产物。

## 校验和编译

本目录已包含本机可用依赖。复制工程到其他机器后首次执行 `npm ci`。

```bat
node tools/validator/validate.js
node tools/compiler/build.js
node --test tests/*.test.js
```

Windows 可双击 `validate.bat` / `build.bat`，或在终端执行以保留日志。
两个 JS 命令默认处理正式 FSA 库，也可显式传入源定义目录；输出写入该 definitions 同级的 generated，并保留分类子目录。测试预览库为 assets/legacy，使用参数 "assets/legacy/definitions"；禁止重建 assets 根下的 definitions/generated。正式交付后按 rules/ASSET_RULES_FOR_AI.md 同步游戏 Assets 和资产配置表。
所有定义先统一校验，出错退出码为 1，不写产物。错误含 Code、File、Path、Description、Fix Hint。
Pose / Material 作为引用参与校验，不单独输出 GLB。同一目录树内 asset id 必须唯一，输出路径不得冲突。

## 直接打开预览器

1. 双击 `previewer/index.html`。
2. 点击“选择资产目录”。
3. 选择 **`assets/FSA(项目使用)/generated/`**，不要选择其父目录或 models 子目录。
4. 选择模型、动画；选择 None 恢复默认姿态。

**不需要本地服务器，不需要 npm run，不需要网络。** 支持带目录选择和 WebGL 的桌面 Chrome / Edge。
仅识别所选根目录下 models 的 `.glb` 和 animations 的 `.anim.glb`。模型与动画默认须 Rig 三字段一致；新增已验证的 humanoid.v1 动画 → humanoid.v2 模型单向适配，详情显示 [v1 → v2]。
点击画面后鼠标转向，也可按住左键拖动；WASD 移动，Q/E 升降，Shift 加速，F/R 聚焦或重置，Esc 释放鼠标。
可显示骨架、包围盒、坐标轴。切换时释放旧模型资源；一次只显示一个模型并播放一个动画。
“重新加载”重新读取当前选择的 File；编译更新磁盘文件后，浏览器可能保留旧快照，请重新选择目录。

## 目录和规则

- `schemas/`：模型、动画、Pose、材质、特效五类 JSON Schema，未知字段拒绝。
- `tools/validator/`、`tools/compiler/`：可直接执行的 JavaScript。
- `tools/core/`：固定骨架、签名、资产引用读取。
- `previewer/`：原生 HTML/CSS/JS 和已随附的本地 Three.js + GLTFLoader。
- `tests/`：管线与浏览器验收；`examples/`：示例索引。
- `rules/ASSET_RULES_FOR_AI.md`：创建 Definition 的完整精简规范。
- `rules/RUNTIME_ASSET_USAGE.md`：加载最终 GLB、复用动画、读取 Socket。

Humanoid 提供七节点 v1 与十三节点 v2 两套刚性关节骨架；v2 增加肘、腕和膝。均不使用连续蒙皮、IK 或 Root Motion，现有 v1 资产保持可用。详见 [十三节点规则](rules/HUMANOID_V2.md)。
参数化角色默认生成方块外观；自定义 parts 会替换默认外观，可在同一 Bone 下挂多个 Primitive。
静态示例含箱子、武器、六种 Primitive；人形含两种比例；动画含 Idle、Walk、Run、Attack。

## 开发维护

`node tests/browser-smoke.js` 在 Windows Chrome / Edge 中进行真实 file:// 验收，截图和报告写入 `.qa/`。
其他平台设置 `CHROME_PATH` 指向 Chromium。首次浏览器运行需要允许其正常创建 GPU 子进程。

预览页使用已交付的 classic vendor 脚本，规避 file:// ES Module 的跨源限制。
仅更新 Three.js 依赖时才需要 `node tools/scripts/vendor.cjs` 重新生成 vendor；页面运行没有构建步骤。
`node tools/scripts/schemas.js` 更新检入的 Schema。`tools/scripts/examples.js` 会重建示例源文件，勿对已修改的示例随意运行。

验收详情见 [ACCEPTANCE.md](ACCEPTANCE.md)。

## 世界设施模型与动画

已支持 nodes.v1 任意静态模型已有节点轨道。制作、绑定和预览入口见 [节点动画契约](rules/NODE_ANIMATIONS.md)。

## 五类环境资产规范与样件

环境类型、空间数据和制作流程见 [environment.v1 公共规范](rules/ENVIRONMENT_RULES.md)。支持地形、单层可进入建筑、实心物件、静态围挡和水平滑动铁门；复用现有模型／nodes.v1 编译器，已完成的大型交互设施保持原流程。

```powershell
node tools/environment/build.js
node --test tests/environment.test.js
```

双击 [环境样件预览](assets/environment-samples/generated/EnvironmentPreview.html)，可离线查看五件模型、碰撞、入口/通路、物品投放区、三种角色量规与铁门开启动画。样件不属于正式 FSA 美术交付，源目录为 `assets/environment-samples/definitions/`。实际碰撞与浏览器检查命令、范围和结果见 [验收记录](assets/environment-samples/ACCEPTANCE.md)。

## 特效管线与独立预览

特效源为 `assets/FSA(项目使用)/definitions/effects/**/*.effect.json`，`npm run build` 导出 `generated/effects/**/*.vfx` 和一个共用 `ForgeVFX.mjs`。每款特效一个文件，素材内嵌；无需为每款效果重复写播放器。

双击 [previewer/effects.html](previewer/effects.html) 打开专用预览器，与原模型动画入口分开。已内置溅血和附魔台样例，支持导入 .vfx／generated 目录、模型绑定、材质状态、动画同步、时间轴、火毒与多实例。

- `npm run build:effects-preview`：重建离线预览及内置样例。
- `npm run test:effects-browser`：真实浏览器验证，证据写入 `.qa/effects/`。
- `npm run deliver:effects`：同步正式产物到游戏 Assets，并逐字节核对。

制作格式、支持边界及生命周期见 [特效管线规范](rules/EFFECTS.md)。新特效优先复用已有图层；新增能力统一扩展共用播放器。美术工作项不另写交付报告，复杂约定集中写资产使用说明。
