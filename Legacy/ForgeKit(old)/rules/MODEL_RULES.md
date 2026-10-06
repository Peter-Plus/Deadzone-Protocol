# Model DSL V1

基础字段：`schema: model.v1`，唯一 `id`，`type: static | humanoid`，可选 `units: meter` 和 `root`。

静态模型必须包含非空 parts。人形必须声明 `rig: humanoid.v1` 和 `body`，自动创建骨架/身体，可追加 parts/socket。

| shape | 必需参数 | 几何含义 |
| --- | --- | --- |
| box | size [x,y,z] | 完整边长 |
| sphere | radius | 半径 |
| cylinder | radius, length | 等半径圆柱 |
| capsule | radius, length | length 是中间直段，总长 length+2×radius |
| cone | radius, length | 底面半径和完整高度 |
| plane | size [width,height,positiveReserved] | XY 平面，第三项为格式保留值，不产生厚度 |

参数必须为有限正数。超出 `--max-size` 阈值会警告，默认 1000m。分段数由编译器固定，禁止传 vertices、indices、Quaternion。

部件支持 position、rotation、scale、parent、material。无 parent 挂模型 root，parent 可前向引用但不能形成环。material 引用 material.v1 的 id；未指定时继承模型 material，否则用默认哑光蓝灰材质。

Socket 支持 id、parent、position、rotation、scale，作为命名 Node 写入 GLB，带 `socket:true`、`socketId` 元数据。所有引用必须存在，不允许 socket 再作为父节点。

示例请阅读 `examples/models/test_weapon.model.json`。建筑可直接以 static 部件组合，不引入单独 Building Schema。
