# 坐标

+Y 向上、+X 向右、+Z 正面；1 单位 = 1 米。
position 为米，rotation 为 Euler XYZ 角度，scale 为正数或三个正数。默认位置/旋转为零，缩放为一。
所有 Part / Socket Transform 均相对 parent；root Transform 作用于整个资产。
人形以双脚中心地面为原点；建筑以底面中心为原点；武器以主握点为原点。编辑者应按此放置静态几何。
Plane 位于局部 XY 平面，正面朝 +Z。Cylinder / Cone / Capsule 长轴为 Y；尺寸均为未缩放的局部尺寸。
