# 命名

Asset ID 用至少两段小写点分名称：`humanoid.zombie.basic`、`metal.dark`。各段以小写字母开头，后续允许数字和下划线。

文件名用 snake_case：`zombie_basic.model.json`、`humanoid_walk.anim.json`。材质/Pose 分别用 `.material.json`、`.pose.json`。同种输出的基本文件名必须全库唯一。

Part 与 Socket ID 是节点名：字母开头，后续字母、数字、下划线，模型内唯一。父引用只能指向 Part 或人形 Bone；Socket 是叶节点。`ModelRoot`、人形规范骨名及人形自动身体部件的 `body_` 前缀保留。

骨骼名称严格遵循 HUMANOID_RIG.md，包括大小写和 L/R 后缀，禁止 LeftUpperArm 等同义词。名称不能包含点或括号，以确保 Three.js 动画路径无歧义。
