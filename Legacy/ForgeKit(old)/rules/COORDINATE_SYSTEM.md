# 坐标、单位与原点

- +X = Right，+Y = Up，+Z = Forward，1 Unit = 1 Meter。
- 所有 position 是米，rotation 是 Euler XYZ 角度，scale 是正标量或三维正向量；缺省为零位移、零旋转、单位缩放。
- 所有部件/socket 变换相对于父节点，root 相对于世界。
- Humanoid 的 Root 位于双脚中心对应地面点，参考姿势脚底 Y=0。
- Building 的几何应围绕底面中心放置；例如高 2m 的 box，position.y=1。
- Weapon 的原点为主握把参考点，可用额外 socket 定义枪口或副握把。武器不要求包围盒最低点为 Y=0。
- Previewer 不进行隐式地面对齐。
- Cylinder/Cone/Capsule 默认长轴 Y。axis x/z 只改变几何轴，不旋转该部件局部坐标，避免 socket 隐式转向。
- Plane 位于本地 XY 平面，正面朝 +Z；水平地面需 rotation=[-90,0,0]。
