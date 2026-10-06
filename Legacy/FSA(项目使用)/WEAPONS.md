# FSA 武器资产（第一批）

14 把原创游戏用静态武器：7 类，每类 2 把。由 ForgeKit 基础几何构建，不包含动画。

单位：米；+Y 向上；+Z 枪口方向；原点：主握点。所有材质内置，无外部贴图。
挂点：`grip_main` 唯一握持点、`muzzle` 枪口、`aim` 瞄准参考点。
全部武器使用单点挂载近似双手持枪：唯一握持点对齐角色左臂末端插槽，右臂仅播放预设动画，不绑定武器、不执行 IK。

## Demo 动画复用约定

后续所有角色使用 humanoid.v1 固定七节点骨架，共用同一套持枪、开火、换弹基础动画。武器保持 static，绑定左臂末端的表现层插槽；插槽属于角色模型，随左臂动画运动。当前未生成人物插槽或动画。
共享动作键为 hold、fire、reload，动作文件与分层清单见 laoen-catalog.json。weapon-catalog.json 记录握持类型、换弹类型和武器局部空间挂点；这些是 Demo 接入数据，不是 ForgeKit 新增 schema。
Demo 使用移动层与双臂层：Body 和双腿负责移动，双臂播放统一动作。右臂预留持枪空间，不要求双手精确贴合。各武器可调整唯一握持点或挂载偏移来适配共同姿势；不要求逐武器握持 Pose 或复杂换弹部件动作。

| 类别 | 名称 | 造型 | 文件名 | 尺寸 X × Y × Z（米） |
|---|---|---|---|---|
| AR | 哨兵 AR-01 | 常规式突击步枪 | ar_01_sentinel | 0.113 × 0.337 × 0.759 |
| AR | 游隼 AR-02 | 无托式突击步枪 | ar_02_kestrel | 0.114 × 0.337 × 0.628 |
| SMG | 黄蜂 SMG-01 | 伸缩托紧凑冲锋枪 | smg_01_wasp | 0.113 × 0.337 × 0.469 |
| SMG | 山猫 SMG-02 | 侧折托消音冲锋枪 | smg_02_lynx | 0.113 × 0.337 × 0.536 |
| LMG | 獾 LMG-01 | 弹匣式班用轻机枪 | lmg_01_badger | 0.271 × 0.355 × 0.919 |
| LMG | 堡垒 LMG-02 | 弹链箱式轻机枪 | lmg_02_bastion | 0.271 × 0.400 × 0.969 |
| DMR | 游骑兵 DMR-01 | 传统枪托精确射手步枪 | dmr_01_ranger | 0.113 × 0.411 × 0.949 |
| DMR | 守望者 DMR-02 | 现代骨架托精确射手步枪 | dmr_02_watchman | 0.113 × 0.411 × 0.909 |
| SR | 霜隼 SR-01 | 栓动狙击步枪 | sr_01_frost | 0.271 × 0.429 × 1.109 |
| SR | 磐石 SR-02 | 重型狙击步枪 | sr_02_monolith | 0.271 × 0.429 × 1.259 |
| SHOTGUN | 守卫 SG-01 | 泵动管式霰弹枪 | shotgun_01_warden | 0.116 × 0.337 × 0.899 |
| SHOTGUN | 破门者 SG-02 | 短管双管霰弹枪 | shotgun_02_breaker | 0.116 × 0.337 × 0.656 |
| PISTOL | 雨燕 P-01 | 紧凑半自动手枪 | pistol_01_swift | 0.096 × 0.243 × 0.227 |
| PISTOL | 归魂 P-02 | 长管转轮手枪 | pistol_02_revenant | 0.112 × 0.238 × 0.365 |

定义：`definitions/models/weapons/<类别>/<文件名>.model.json`。
输出：`generated/models/weapons/<类别>/<文件名>.glb`。

这是游戏视觉资产，不包含真实武器制造信息或 Gameplay 数值。静态模型中的滑套、弹匣等命名节点可供后续表现层使用；当前没有制作射击、换弹动画。

校验（在 ForgeKit 根目录运行）：`node tools/validator/validate.js "assets/FSA(项目使用)/definitions"`。
现有 build.js 固定输出到公共 assets/generated；本批调用 tools/compiler/compile.js 编译到上述 FSA 分类目录。
