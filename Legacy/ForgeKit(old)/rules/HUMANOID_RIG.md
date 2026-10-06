# Humanoid Rig V1

固定契约 `humanoid.v1`，共 22 根骨骼：

```text
Root
└── Hips
    ├── Spine
    │   └── Chest
    │       ├── Neck
    │       │   └── Head
    │       ├── Clavicle_L
    │       │   └── UpperArm_L
    │       │       └── LowerArm_L
    │       │           └── Hand_L
    │       └── Clavicle_R
    │           └── UpperArm_R
    │               └── LowerArm_R
    │                   └── Hand_R
    ├── UpperLeg_L
    │   └── LowerLeg_L
    │       └── Foot_L
    │           └── Toe_L
    └── UpperLeg_R
        └── LowerLeg_R
            └── Foot_R
                └── Toe_R
```

T-Pose：所有骨骼局部旋转为 identity，局部 +X/+Y/+Z 与世界规范一致；躯干沿 +Y，L 臂沿 +X，R 臂沿 -X，腿沿 -Y，脚面向 +Z。旋转按 XYZ Euler；不是让每根骨骼的长轴都朝局部 Y。Root 地面，Hips 骨盆中心。Mesh 直接随所属 Bone 运动。

body 支持 height（默认1.8）、shoulderWidth（.267×height）、hipWidth（.178×height）、bodyThickness（.12×height），单位米；armLengthScale、legLengthScale、headScale、handScale、footScale 默认1，正数且≤3。米制参数正数且≤10。

总高度归一化：脚、腿、躯干、头的权重为 `.04×footScale`、`.46×legLengthScale`、`.36`、`.14×headScale`，共同缩放至 height。因此改变头/腿比例仍保持指定总身高和地面 Pivot。手臂长度为 `.32×height×armLengthScale`，肩宽/髋宽独立指定。不接受含糊的 armLength/legLength 字段，使用 Scale 字段。

Rig 元数据写在 ModelRoot / AnimationRoot 的 glTF node extras：rigId=humanoid，rigVersion="1"，rigSignature=SHA-256。哈希输入是按骨名排序的 [name,parent] 和 `+X:right;+Y:up;+Z:forward;Euler:XYZ;identity-rest`，与身高骨长无关。

三项元数据任一缺失/不一致必须拒播，并显示具体 mismatch。实际缺失轨道目标也要拒播。参考局部平移只用于维护目标角色比例；V1 不做任意外部骨架重定向。
