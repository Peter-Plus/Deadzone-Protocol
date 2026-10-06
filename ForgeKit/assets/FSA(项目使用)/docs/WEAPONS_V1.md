# 武器首版交付清单

2026-09-29：九件静态武器，使用内嵌材质，无外部贴图、无动画、无骨架。原点为唯一装配锚点，朝向 +Z，米制。此批为游戏外观模型，不包含真实机构实现。

| 模型 | 外观部件数 | 外包尺寸 X × Y × Z（米） | GLB 大小 | 成品 |
| --- | ---: | --- | ---: | --- |
| FSA_WPN_AR_001_Vanguard | 61 | 0.091 × 0.409 × 0.879 | 144.0 KiB | [GLB](../generated/models/weapons/AR/AR_001_Vanguard/FSA_WPN_AR_001_Vanguard.glb) |
| FSA_WPN_DMR_001_Sentinel | 66 | 0.178 × 0.441 × 1.019 | 201.2 KiB | [GLB](../generated/models/weapons/DMR/DMR_001_Sentinel/FSA_WPN_DMR_001_Sentinel.glb) |
| FSA_WPN_LMG_001_Bastion | 69 | 0.195 × 0.357 × 1.014 | 159.3 KiB | [GLB](../generated/models/weapons/LMG/LMG_001_Bastion/FSA_WPN_LMG_001_Bastion.glb) |
| FSA_WPN_Melee_001_Fang | 16 | 0.035 × 0.092 × 0.403 | 33.4 KiB | [GLB](../generated/models/weapons/Melee/Melee_001_Fang/FSA_WPN_Melee_001_Fang.glb) |
| FSA_WPN_Pistol_001_Sidekick | 23 | 0.058 × 0.266 × 0.209 | 53.2 KiB | [GLB](../generated/models/weapons/Pistol/Pistol_001_Sidekick/FSA_WPN_Pistol_001_Sidekick.glb) |
| FSA_WPN_Shotgun_001_Breacher | 36 | 0.089 × 0.297 × 1.006 | 91.3 KiB | [GLB](../generated/models/weapons/Shotgun/Shotgun_001_Breacher/FSA_WPN_Shotgun_001_Breacher.glb) |
| FSA_WPN_SMG_001_Swift | 57 | 0.091 × 0.409 × 0.636 | 136.2 KiB | [GLB](../generated/models/weapons/SMG/SMG_001_Swift/FSA_WPN_SMG_001_Swift.glb) |
| FSA_WPN_SR_001_Longwatch | 70 | 0.230 × 0.441 × 1.179 | 209.0 KiB | [GLB](../generated/models/weapons/SR/SR_001_Longwatch/FSA_WPN_SR_001_Longwatch.glb) |
| FSA_WPN_Throwable_001_Thunder | 23 | 0.105 × 0.133 × 0.093 | 92.4 KiB | [GLB](../generated/models/weapons/Throwable/Throwable_001_Thunder/FSA_WPN_Throwable_001_Thunder.glb) |

预览：打开 ForgeKit/previewer/index.html，选择 FSA(项目使用)/generated 目录，动画保持 None。

已完成：九个源定义校验通过、九件 GLB 编译成功、本地 Chrome 中目录选择发现九件模型且逐件加载无异常；现有 35 项自动测试通过。预览器地面根据模型最低点下移，避免遮挡握把和弹匣。

DMR/SR 带瞄准镜和拉栓柄，LMG 带弹箱和两脚架，SR 带两脚架，Shotgun 带泵动护木，SMG 为短管紧凑轮廓。换弹和拉栓部件均为静态外观；未制作独立机构动画。

重建时在 ForgeKit 根目录运行：

```powershell
node tools/validator/validate.js "assets/FSA(项目使用)/definitions"
node tools/compiler/build.js "assets/FSA(项目使用)/definitions"
```

编译器直接输出到本库 generated，保留分类子目录。完成后按 ASSET_RULES_FOR_AI.md 同步游戏项目 Assets 与资产配置表，无需旧 .qa 同步脚本。

## 外观修订（2026-09-29）

七类枪统一清理：有枪托的型号将枪托组件向枪身移动，连接管嵌入枪身；删除握把绿色条纹、底饰及弹匣表面条纹，普通弹匣改为整体黑色块并接入机匣；简化扳机并调整护圈，手枪护圈和扳机上端也接入枪身。主握点原点、文件名、资产 id 不变。已重新编译并同步两处 GLB，原预览器逐件加载通过。预览时请重新选择 generated 目录以更新浏览器文件快照。
