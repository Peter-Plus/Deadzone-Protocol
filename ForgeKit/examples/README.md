# 可运行示例

真实定义集中在 `../assets/definitions/`，避免两份源文件发生偏移。

| 源文件 | 演示 |
| --- | --- |
| models/simple_static.model.json | 最小静态模型 |
| models/test_weapon.model.json | 多 Primitive、父子关系、共享材质、muzzle Socket |
| models/primitives.model.json | 六种几何体 |
| models/simple_humanoid.model.json | 默认 1.8 米人形 |
| models/humanoid_test.model.json | 2.2 米人形及 grip Socket |
| animations/humanoid_idle.anim.json | Idle |
| animations/humanoid_walk.anim.json | Walk |
| animations/humanoid_run.anim.json | Run |
| animations/humanoid_attack.anim.json | Timeline、Pose 引用、非循环 |
| poses/ready.pose.json | 共享姿势 |
| materials/steel.material.json | 共享 PBR 材质 |

在工程根执行 `node tools/compiler/build.js` 编译全部示例。
