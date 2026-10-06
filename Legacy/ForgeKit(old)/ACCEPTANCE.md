# V1 验收记录

验证环境：Windows、Node.js 22.19.0，依赖使用 package-lock.json。所有资产由 TypeScript 编译器和 GLTFExporter 生成。

## 自动检查

`npm run check`：TypeScript、19 项测试、16 个源定义校验、11 个 GLB 构建、Vite 前端构建通过。Vite 提示 Three.js bundle 大于默认 500kB 阈值，是体积提示，不影响本地预览。

测试覆盖：

- JSON Schema 的合法/非法数据、未知字段、非有限数、错误尺寸、版本、Rig。
- 部件重复名、未知父节点、循环、材质/Socket 引用、可配置尺寸 Warning。
- 未知骨名、重复 JSON 轨道、重复/越界时间、Root Motion、Pose 引用、循环接缝。
- 22 Bone 契约、签名稳定性、层级变化改变签名、体型变化不改变签名、地面与身高。
- Primitive 长轴、父子层级、Socket、GLB header/metadata、GLTFLoader 加载回环。
- 四种 Generator 的单 Clip、无 Mesh、首尾姿势和 GLB 字节确定性；Pose 时间线及 clip duration。
- AnimationMixer 驱动双腿、原地运动和跨体型平移绑定。
- Watch 的真实文件修改→编译→WebSocket 通知；错误输入保留正确 GLB；恢复合法输入后恢复构建。
- HTTP 目录列表、GLB 响应、路径穿越/非 GLB/非 GET 拒绝。
- 全量成功构建清理 manifest 管理的旧产物，保留外部 GLB。
- 并发原子写入不混合内容、不遗留临时文件；Windows 短暂文件占用使用有界重试，不删除旧产物。

集成测试故意写入非法尺寸，因此测试日志中会出现预期的 ERROR / FAIL 校验报告；以测试汇总的 pass/fail 和进程退出码判断结果。

## 浏览器检查

在 Codex 内置 Chromium 浏览器中实际加载并检查：

1. 默认人形加载正常，T-Pose、朝向、地面及元数据可见。
2. 行走动画正常加载，Skeleton 与 Bounds 可显示。
3. 切换静态武器时人形动画被拒绝，界面列出缺失的 Rig 字段。
4. 使用 GLTFExporter 生成专用测试资产，保持 rigId/rigVersion 相同而故意修改 rigSignature：界面显示 `Rig mismatch` 与两个签名，Animation 保持 None；浏览器没有 error/warn 控制台记录。
5. 将当前人形源 `headScale:1` 改为 `1.2`，模型自动更新，页面显示 `热更新 · models/simple_humanoid.glb`。测试后源参数已恢复为1，并重新编译。
6. 检查了窄窗口与1280×720窗口中的布局。

相机 Pointer Lock、WASD/鼠标、Q/E、Shift、F/R/Esc 的处理已实现；本轮没有自动化模拟持续按键及真实鼠标捕获运动。可按 README 在本地交互确认。

## 与策划案的实现取舍

- Watch 为正确覆盖材质/Pose 依赖而重新校验和编译源库，仅写入字节变化的产物，当前无关资产不重载。
- 预览默认内置 Watch，仍支持分开的 watch 与 preview --no-watch 进程。
- 动画平移显式采用参考姿势局部偏移，保持跨体型骨长，不做外部骨架重定向。
- V1 是刚性身体部件骨架，无连续 Skin Weight；bone 标记通过 glTF extras 恢复到 SkeletonHelper。
