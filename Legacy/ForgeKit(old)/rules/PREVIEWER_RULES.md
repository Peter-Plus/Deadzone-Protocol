# 预览器

运行 `npm run asset -- preview` 自动构建、监听、打开本地服务地址；浏览器需自行打开终端地址。`--no-watch` 可只浏览已有输出，`--out` 指定允许的生成根目录。

上方模型列表、下方动画列表，动画首项固定为 None。始终只显示一个模型，播放一个动画。切换模型释放旧几何/材质；切换动画停止并恢复参考姿势，再校验兼容性后播放。快速连续点击由请求序号隔离过时加载结果。

Pointer Lock：点击画面捕获鼠标，Esc释放。W/S前后，A/D左右，Q/E上下，Shift加速，鼠标旋转，F按模型世界包围盒聚焦，R重置。Grid/Axes/Skeleton/Bounds/Sockets/Wireframe 可切换。

loop=true 使用 LoopRepeat；loop=false 使用 LoopOnce 并保留最后一帧，勾选 Preview Loop 可临时重复。None 恢复 T-Pose。签名不匹配显示 Animation incompatible with current model / Rig mismatch 和具体字段，不创建播放器。

显示模型/动画 metadata、FPS、三角面数和源校验结果。Y=0为地面，不暗中改变模型高度。修改当前源定义会热更新；不相关资产不会重载当前模型。失败保留上次正确 GLB，显示错误。
