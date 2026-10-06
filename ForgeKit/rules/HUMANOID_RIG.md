# Humanoid v1

固定层级：Root → Body → Head / Arm_L / Arm_R / Leg_L / Leg_R。
这七个节点由 Compiler 创建，DSL 不允许声明或改变骨骼。允许增加 Mesh，禁止增加 Bone。
默认姿态为 identity T-Pose：左臂沿 +X，右臂沿 -X，腿向 -Y，脸向 +Z。所有旋转使用 XYZ。
height 默认 1.8；legLength 默认 height×0.46；头边长 height×0.16×headScale；身体高度为 height−legLength−头边长，必须大于零。
Body 在 (0, legLength, 0)；Head 相对 Body 在 (0, 身体高度, 0)；手臂根位于 (±bodyWidth/2, 身体高度×0.85, 0)；腿根位于 (±bodyWidth×0.25, 0, 0)。
默认 bodyWidth=height×0.25，bodyDepth=height×0.14，armLength=height×0.32，armThickness=height×0.09，legThickness=height×0.11，headScale=1。
Rig Metadata 为 rigId、rigVersion、rigSignature。SHA-256 签名只来自骨骼名称、父子关系和轴约定，外观、材质、比例不会改变签名。
Mesh 直接挂接节点，不输出 Skin。GLTFLoader 可能把节点读取为 Object3D；请通过名称或 userData.bone 获取节点。
