# ForgeKit

独立的程序化 3D 资产工具链 V1。用可读 JSON 定义模型、材质、Pose 和动画，经严格校验后由 Three.js 编译成单文件 GLB，在本地预览器中检查。无需 DCC 或业务 Runtime。

## 快速开始

需要 Node.js 22+。在本目录运行：

```powershell
npm ci
npm run asset -- validate
npm run asset -- build
npm run asset -- preview
```

打开终端显示的地址，默认 http://127.0.0.1:5173 。`preview` 默认包含 Watch，无需再开一个 watch 进程。首次打开自动选择基础人形；选择 `humanoid_walk.anim.glb` 即可播放。

```powershell
npm run asset -- validate assets/definitions/models/test_weapon.model.json
npm run asset -- build assets/definitions/models/test_weapon.model.json
npm run asset -- watch
npm run asset -- preview --no-watch --port 5174
npm run asset -- --definitions D:/MyAssets/definitions --out D:/MyAssets/generated preview
npm run asset -- --max-size 100 build
npm run check
```

`--definitions` 指定源目录，`--out` 指定生成/浏览目录，二者必须分离。路径可为相对当前工作目录的路径。`validate/build [path]` 仍校验整个源库，确保全局引用和 ID 唯一，再只编译选择的模型/动画；指定材质/Pose 会重建其依赖资产。Error 返回非零退出码，Warning 不阻止构建。

## 目录与产物

| 目录 | 内容 |
| --- | --- |
| `rules/` | 面向创作者/Codex 的约束与流程 |
| `schemas/` | 四种严格 JSON Schema，禁止未知字段 |
| `assets/definitions/` | 可编辑的模型、材质、姿势、动画源文件 |
| `assets/generated/models/` | `*.glb`，含几何、材质、Socket；人形包含骨架元数据 |
| `assets/generated/animations/` | `*.anim.glb`，只有骨架、单个 Clip 与元数据，无 Mesh |
| `examples/` | 与初始源库对应的完整示例 |
| `src/` | TypeScript 校验器、编译器、CLI 与原生 Web 预览器 |
| `tests/` | Schema、语义、骨架、二进制、加载回环和集成测试 |

初始库包含 5 个模型、6 个动画、3 个材质和 2 个 Pose。`test_weapon` 演示部件层级、两种材质和 Socket；`simple_humanoid` 与 `tall_humanoid` 演示不同体型共用动画；`primitive_gallery` 展示全部六种几何；`humanoid_wave` 演示显式轨道，`humanoid_bow` 演示 Pose 引用。

## 模型、动画与骨架

- +X 右、+Y 上、+Z 前，米为单位，Euler XYZ 角度输入。Quaternion 仅在编译器内部生成。
- 人形采用固定 22 Bone 的 `humanoid.v1`，默认 T-Pose，刚性 Mesh 直接挂接 Bone。无需 Skin Weight。
- SHA-256 Signature 只包含固定骨名、父骨和局部轴约定，不含尺寸。动画播放前严格检查 ID、版本、Signature，并检查实际轨道目标是否存在。
- Timeline 支持 `tracks` 或 `timeline` Pose 引用，二选一。Generator 包含 idle、breathing、walk、run。
- `position` 动画值表示相对参考 Pose 的米制局部偏移，仅允许 Root/Hips、最大 0.25m、首尾为零。绑定时保留目标角色参考骨长，避免高个角色被默认骨架平移压矮。
- 循环使用端点一致的采样；显式 Timeline 接缝较大时发出 Warning。非循环动画按 metadata 只播一次，支持 Preview Loop。

详见 [创作工作流](rules/CODEX_WORKFLOW.md)、[模型规则](rules/MODEL_RULES.md)、[动画规则](rules/ANIMATION_RULES.md)。

## 预览操作

点击画面进入 Pointer Lock，Escape 释放鼠标。WASD 移动，鼠标转向，Q/E 降低/升高，Shift 加速，F 聚焦当前模型，R 重置相机。Grid、Axes、Skeleton、Bounds、Sockets、Wireframe 可独立切换。None 停止动画并恢复参考姿势。一次只保留一个模型和一个活动 Clip。

预览器不修正模型 Y；武器以握把为原点，部分几何低于地面属于该 Pivot 的正常结果。地面和坐标辅助用于暴露原点问题。

## 构建、热更新与安全边界

源文件、规则或 Schema 变化后重校验源库，并生成候选资产。全部编译成功后才写入；单文件采用同目录临时文件 + rename。只有字节变化的 GLB 才替换，避免无关资产触发刷新。校验失败保留上一版 GLB，预览器显示错误详情。

Watch 重建整个源库来覆盖材质和 Pose 依赖，输出按字节去重。预览服务器监控生成目录，使用 Vite WebSocket 自定义消息更新列表，并仅重新载入当前发生变化的模型/动画。完整成功构建会依据 manifest 删除已不存在源文件的旧产物；不会清理 manifest 之外的外部 GLB。空源库视为错误以避免误清空。

本地 API：`GET /api/assets/models`、`GET /api/assets/animations`、`GET /api/status`。`/compiled/` 只提供允许的 GLB 路径，通过 realpath 拦截穿越和符号链接逃逸。服务器只监听 127.0.0.1。此为本地开发工具，不应直接作为公共文件服务器发布。

重复构建相同输入产生相同二进制；没有隐式随机数，输出不写时间戳/随机 UUID。请保留 `package-lock.json` 并使用 `npm ci` 固定依赖版本。生成目录不可手工编辑。

## 验证与扩展

`npm run check` 执行 TypeScript 检查、自动测试、示例校验与编译、预览器前端生产构建。`npm run build` 仅构建前端至 `dist/`，目录 API 仍由 `asset preview` 提供，不是独立静态资产服务。

Schema 源维护脚本是 `scripts/schemas.mjs`，改动后运行 `node scripts/schemas.mjs` 更新 JSON。`scripts/examples.mjs` 仅用于重置示例，会覆盖初始同名示例源，日常创作不要运行它。

V1 不包含连续蒙皮、IK、Root Motion、纹理编辑、FBX、动作捕捉重定向等策划案列出的 V2 功能。动画 GLB 的无皮肤骨架通过 `forgeBone` node extras 标识，GLTFLoader 载入后预览器恢复该标记用于 SkeletonHelper。
