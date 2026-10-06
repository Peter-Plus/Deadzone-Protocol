# UI 资产配置表

更新日期：2026-10-06。当前已交付 UI 资产：65 项（全部已验收；两个主武器空槽共用造型，分别登记文件）。

本表用于 UI 美术资产登记，尚未由运行时代码自动读取。路径相对于 `Assets/`，UI 图标统一存放在 `ui/icons/`；目录及交付规范见 [UI 目录说明](ui/README.md)。

## 已交付资产

背包与 HUD 共同遵循 [UI 美术规范](ui/README.md)。参考样图不计入独立 UI 资产交付数量。

以下图标已交付；毒伤、灼烧及物品与附魔首版 UI 图标均已验收。不将建议路径或占位表现记录为已交付文件。

| 资产 ID | 游戏内名称 | 类别／界面用途 | 资产路径（相对 Assets） | 格式／尺寸或 viewBox | 视觉状态／变体 | 交付状态 | 运行时接入状态 | 备注／需求来源 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ui_item_armory_crate_small | 小型普通军备箱 | 道具／背包、商店及附近列表 | `ui/icons/items/ui_item_armory_crate_small.png` | PNG / 512×512 / RGBA | v5：依普通军备箱重绘紧凑短箱，保留护角、双锁扣及加强筋，整体略小一档，透明底 | 已验收 | 未接入 | 一类奖励；非大型场景箱；64／32px 检查；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_item_armory_crate_common | 普通军备箱 | 道具／背包、商店及附近列表 | `ui/icons/items/ui_item_armory_crate_common.png` | PNG / 512×512 / RGBA | 宽体橄榄绿箱、加强筋及侧把手，透明底 | 已验收 | 未接入 | 三类奖励；非大型场景箱；64／32px 检查；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_item_armory_crate_advanced | 高级军备箱 | 道具／背包、商店及附近列表 | `ui/icons/items/ui_item_armory_crate_advanced.png` | PNG / 512×512 / RGBA | 蓝灰加固箱、金色锁扣与中央锁体，透明底 | 已验收 | 未接入 | 两类较高价值奖励；体量小于普通箱；64／32px 检查；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_equipment_backpack_level2 | 二级背包 | 背包升级／商店及附近物品详情 | `ui/icons/equipment/ui_equipment_backpack_level2.png` | PNG / 512×512 / RGBA | v2：简朴橄榄绿小布包、单前袋及 II 标记，无战术织带，主体高约 300px，透明底 | 已验收 | 未接入 | 取得后即时升级，非收入背包的普通物品；64／32px 检查；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_equipment_backpack_level3 | 三级背包 | 背包升级／商店及附近物品详情 | `ui/icons/equipment/ui_equipment_backpack_level3.png` | PNG / 512×512 / RGBA | 加高深绿背包、双侧袋、底部卷垫与 III 标记，透明底 | 已验收 | 未接入 | 取得后即时升级，非收入背包的普通物品；64／32px 检查；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_item_gold_coin | 金币 | 货币／奖励及交易界面 | `ui/icons/items/ui_item_gold_coin.png` | PNG / 512×512 / RGBA | v4：按制作人样图重绘，浅金圆边、深金底面及中央浅金卷曲纹样，现代二游风格，透明底 | 已验收 | 未接入 | 金额由 UI 动态显示；64／32px 检查；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_item_ammo_762 | 7.62mm 子弹 | 弹药／背包及拾取 | `ui/icons/items/ui_item_ammo_762.png` | PNG / 512×512 / RGBA | 绿色宽盒、黄铜包边，盒面 7.62，透明底 | 已验收 | 未接入 | AK-47 战术与 M14-A 共用；按游戏简化口径制作；64／32px 检查；[弹药配置](../Design/Item/武器弹药配置表（临时）.md) |
| ui_item_ammo_556 | 5.56mm 子弹 | 弹药／背包及拾取 | `ui/icons/items/ui_item_ammo_556.png` | PNG / 512×512 / RGBA | 橄榄绿提柄弹药箱，盒面 5.56，透明底 | 已验收 | 未接入 | M249-E4；按游戏简化口径制作；64／32px 检查；[弹药配置](../Design/Item/武器弹药配置表（临时）.md) |
| ui_item_ammo_50 | .50 手枪弹 | 弹药／背包及拾取 | `ui/icons/items/ui_item_ammo_50.png` | PNG / 512×512 / RGBA | 棕黑短盒、金色标识，盒面 .50，透明底 | 已验收 | 未接入 | DE-50 战术；按游戏简化口径制作；64／32px 检查；[弹药配置](../Design/Item/武器弹药配置表（临时）.md) |
| ui_item_ammo_12g | 12 号霰弹 | 弹药／背包及拾取 | `ui/icons/items/ui_item_ammo_12g.png` | PNG / 512×512 / RGBA | 红黑弹药盒、霰弹图形，盒面 12，透明底 | 已验收 | 未接入 | M870-C；按游戏简化口径制作；64／32px 检查；[弹药配置](../Design/Item/武器弹药配置表（临时）.md) |
| ui_item_ammo_9mm | 9mm 子弹 | 弹药／背包及拾取 | `ui/icons/items/ui_item_ammo_9mm.png` | PNG / 512×512 / RGBA | 蓝色紧凑弹药盒，盒面 9mm，透明底 | 已验收 | 未接入 | MP5 战术；按游戏简化口径制作；64／32px 检查；[弹药配置](../Design/Item/武器弹药配置表（临时）.md) |
| ui_item_ammo_338 | .338 狙击弹 | 弹药／背包及拾取 | `ui/icons/items/ui_item_ammo_338.png` | PNG / 512×512 / RGBA | 灰色长弹药盒，盒面 .338，透明底 | 已验收 | 未接入 | M24-A3；按游戏简化口径制作；64／32px 检查；[弹药配置](../Design/Item/武器弹药配置表（临时）.md) |
| ui_item_flare_gun | 信号枪 | 道具／背包及拾取 | `ui/icons/items/ui_item_flare_gun.png` | PNG / 512×512 / RGBA | 橙红短粗单管、宽口枪口及黑色握把，透明底 | 已验收 | 未接入 | 64／32px 检查；数量及倒计时由 UI 叠加；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_item_mutation_crystal | 异变结晶 | 材料／背包及交易 | `ui/icons/items/ui_item_mutation_crystal.png` | PNG / 512×512 / RGBA | 常见材料：恢复初版紫灰单枚晶体碎片，无外围特效，透明底 | 已验收 | 未接入 | 64／32px 检查；数量及倒计时由 UI 叠加；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_item_fire_demon_core | 火魔晶核 | 材料／背包及交易 | `ui/icons/items/ui_item_fire_demon_core.png` | PNG / 512×512 / RGBA | 稀有材料：饱满橙红晶簇、晶面光泽与余烬，透明底 | 已验收 | 未接入 | 64／32px 检查；数量及倒计时由 UI 叠加；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_item_vile_core | 恶毒晶核 | 材料／背包及交易 | `ui/icons/items/ui_item_vile_core.png` | PNG / 512×512 / RGBA | 稀有材料：饱满绿色晶簇、晶面光泽与薄雾微粒，透明底 | 已验收 | 未接入 | 64／32px 检查；数量及倒计时由 UI 叠加；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_item_bandage | 绷带 | 消耗品／背包及快捷槽 | `ui/icons/items/ui_item_bandage.png` | PNG / 512×512 / RGBA | 白色卷状绷带与短尾端，无束带，透明底 | 已验收 | 未接入 | 64／32px 检查；数量、冷却由 UI 叠加；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_item_first_aid_injector | 急救针 | 消耗品／背包及快捷槽 | `ui/icons/items/ui_item_first_aid_injector.png` | PNG / 512×512 / RGBA | 红白细长针筒、指托与针尖，透明底 | 已验收 | 未接入 | 64／32px 检查；数量、冷却由 UI 叠加；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_item_adrenaline | 肾上腺素 | 消耗品／背包及快捷槽 | `ui/icons/items/ui_item_adrenaline.png` | PNG / 512×512 / RGBA | 银色细长针筒、淡黄色药液与黄色色环，透明底 | 已验收 | 未接入 | 64／32px 检查；数量、冷却由 UI 叠加；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_item_energy_drink | 能量饮料 | 消耗品／背包及快捷槽 | `ui/icons/items/ui_item_energy_drink.png` | PNG / 512×512 / RGBA | 蓝色拉环饮料罐、金色闪电，透明底 | 已验收 | 未接入 | 64／32px 检查；数量、冷却由 UI 叠加；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_item_blood_bottle | 急救血瓶 | 消耗品／背包及快捷槽 | `ui/icons/items/ui_item_blood_bottle.png` | PNG / 512×512 / RGBA | 银盖红色圆柱药瓶、红标白色医用图形，透明底 | 已验收 | 未接入 | 64／32px 检查；数量、冷却由 UI 叠加；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_item_virus_serum | 病毒血清 | 消耗品／背包及快捷槽 | `ui/icons/items/ui_item_virus_serum.png` | PNG / 512×512 / RGBA | 青绿色血清小瓶、银盖与生化图形，透明底 | 已验收 | 未接入 | 64／32px 检查；数量、冷却由 UI 叠加；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_item_coolant | 冷却剂 | 消耗品／背包及快捷槽 | `ui/icons/items/ui_item_coolant.png` | PNG / 512×512 / RGBA | 蓝色压力罐、阀门护框与雪花，透明底 | 已验收 | 未接入 | 64／32px 检查；数量、冷却由 UI 叠加；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_status_poison | 毒伤 | HUD 状态图标 | `ui/icons/status/ui_status_poison.png` | PNG / 128×128 / RGBA | 绿色骷髅与交叉骨，透明底 | 已验收 | 未接入 | 24／32px 缩小检查；无层数、遮罩、底框；[需求](../Production/Plan/Art/05-完成项/08-毒伤灼烧HUD图标.md) |
| ui_status_burn | 灼烧 | HUD 状态图标 | `ui/icons/status/ui_status_burn.png` | PNG / 128×128 / RGBA | 橙色火焰，透明底 | 已验收 | 未接入 | 24／32px 缩小检查；无层数、遮罩、底框；[需求](../Production/Plan/Art/05-完成项/08-毒伤灼烧HUD图标.md) |
| ui_equipment_military_helmet | 军用盔 | 护具／背包与拾取图标 | `ui/icons/equipment/ui_equipment_military_helmet.png` | PNG / 512×512 / RGBA | 默认未附魔，三分之四视角，透明底 | 已验收 | 未接入 | 依据已交付模型；64／32px 检查；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_equipment_special_forces_helmet | 特种兵头盔 | 护具／背包与拾取图标 | `ui/icons/equipment/ui_equipment_special_forces_helmet.png` | PNG / 512×512 / RGBA | 默认未附魔，三分之四视角，透明底 | 已验收 | 未接入 | 依据已交付模型；64／32px 检查；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_equipment_ballistic_vest | 防弹衣 | 护具／背包与拾取图标 | `ui/icons/equipment/ui_equipment_ballistic_vest.png` | PNG / 512×512 / RGBA | 默认未附魔，三分之四视角，透明底 | 已验收 | 未接入 | v2 重制：模型仅参考大体形状及配色，补足自然结构与材质细节；64px 检查；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_equipment_special_forces_armor | 特种兵护甲 | 护具／背包与拾取图标 | `ui/icons/equipment/ui_equipment_special_forces_armor.png` | PNG / 512×512 / RGBA | 默认未附魔，三分之四视角，透明底 | 已验收 | 未接入 | v2 重制：模型仅参考大体形状及配色，补足自然结构与材质细节；64px 检查；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |
| ui_equipment_military_boots | 军用靴 | 护具／背包与拾取图标 | `ui/icons/equipment/ui_equipment_military_boots.png` | PNG / 512×512 / RGBA | 默认未附魔，三分之四视角，透明底 | 已验收 | 未接入 | v2 重制：模型仅参考大体形状及配色，补足自然结构与材质细节；64px 检查；[需求](../Production/Plan/Art/05-完成项/09-物品与附魔首版UI.md) |

| ui_weapon_ak47_tactical | AK-47 战术 | 武器／背包、装备及拾取 | `ui/icons/weapons/ui_weapon_ak47_tactical.png` | PNG / 512×512 / RGBA | 枪口朝左，水平侧视，弯弹匣、战术骨架枪托，透明底 | 已验收 | 未接入 | 配色参考 `models/weapons/AR/AR_001_Vanguard/FSA_WPN_AR_001_Vanguard.glb`；主体宽 450px；[审阅](ui/concepts/2026-10-06-weapons-first-three/Review.html) |
| ui_weapon_m14_a | M14-A | 武器／背包、装备及拾取 | `ui/icons/weapons/ui_weapon_m14_a.png` | PNG / 512×512 / RGBA | 枪口朝左，水平侧视，长枪管、瞄准镜与短直弹匣，透明底 | 已验收 | 未接入 | 配色参考 `models/weapons/DMR/DMR_001_Sentinel/FSA_WPN_DMR_001_Sentinel.glb`；主体宽 450px；[审阅](ui/concepts/2026-10-06-weapons-first-three/Review.html) |
| ui_weapon_m249_e4 | M249-E4 | 武器／背包、装备及拾取 | `ui/icons/weapons/ui_weapon_m249_e4.png` | PNG / 512×512 / RGBA | 枪口朝左，水平侧视，箱式供弹、提把及收折脚架，透明底 | 已验收 | 未接入 | 配色参考 `models/weapons/LMG/LMG_001_Bastion/FSA_WPN_LMG_001_Bastion.glb`；主体宽 450px；[审阅](ui/concepts/2026-10-06-weapons-first-three/Review.html) |

| ui_weapon_military_knife | 军用匕首 | 武器／背包、装备及拾取 | `ui/icons/weapons/ui_weapon_military_knife.png` | PNG / 512×512 / RGBA | 单刃刀身、浅色刃口与黑色环纹握柄，透明底 | 已验收 | 未接入 | 配色参考 `models/weapons/Melee/Melee_001_Fang/FSA_WPN_Melee_001_Fang.glb`；[审阅](ui/concepts/2026-10-06-weapons-remaining/Review.html) |
| ui_weapon_de50_tactical | DE-50 战术 | 武器／背包、装备及拾取 | `ui/icons/weapons/ui_weapon_de50_tactical.png` | PNG / 512×512 / RGBA | 厚重枪管与套筒、黑色握把，透明底 | 已验收 | 未接入 | 配色参考 `models/weapons/Pistol/Pistol_001_Sidekick/FSA_WPN_Pistol_001_Sidekick.glb`；[审阅](ui/concepts/2026-10-06-weapons-remaining/Review.html) |
| ui_weapon_m870_c | M870-C | 武器／背包、装备及拾取 | `ui/icons/weapons/ui_weapon_m870_c.png` | PNG / 512×512 / RGBA | 泵动护木、管式弹仓与完整枪托，透明底 | 已验收 | 未接入 | 配色参考 `models/weapons/Shotgun/Shotgun_001_Breacher/FSA_WPN_Shotgun_001_Breacher.glb`；[审阅](ui/concepts/2026-10-06-weapons-remaining/Review.html) |
| ui_weapon_mp5_tactical | MP5 战术 | 武器／背包、装备及拾取 | `ui/icons/weapons/ui_weapon_mp5_tactical.png` | PNG / 512×512 / RGBA | 紧凑机匣、窄弯弹匣及伸缩枪托，透明底 | 已验收 | 未接入 | 配色参考 `models/weapons/SMG/SMG_001_Swift/FSA_WPN_SMG_001_Swift.glb`；[审阅](ui/concepts/2026-10-06-weapons-remaining/Review.html) |
| ui_weapon_m24_a3 | M24-A3 | 武器／背包、装备及拾取 | `ui/icons/weapons/ui_weapon_m24_a3.png` | PNG / 512×512 / RGBA | 长枪管、大瞄准镜与贴腮板，透明底 | 已验收 | 未接入 | 配色参考 `models/weapons/SR/SR_001_Longwatch/FSA_WPN_SR_001_Longwatch.glb`；[审阅](ui/concepts/2026-10-06-weapons-remaining/Review.html) |
| ui_weapon_m67_frag | M67 破片手榴弹 | 武器／背包、装备及拾取 | `ui/icons/weapons/ui_weapon_m67_frag.png` | PNG / 512×512 / RGBA | 灰绿圆形弹体、保险柄和拉环，透明底 | 已验收 | 未接入 | 配色参考 `models/weapons/Throwable/Throwable_001_Thunder/FSA_WPN_Throwable_001_Thunder.glb`；[审阅](ui/concepts/2026-10-06-weapons-remaining/Review.html) |
| ui_weapon_shadow_blades | 暗影双刃 | 武器／背包、装备及拾取 | `ui/icons/weapons/ui_weapon_shadow_blades.png` | PNG / 512×512 / RGBA | v3 神珍重制：X形交叉弧刃、镂空护手、紫晶核心、金属镶边及紫色刃光，透明底与半透明辉光 | 已验收 | 未接入 | 用户要求突破旧模型重制图标；旧模型 `models/weapons/Melee/Melee_002_ShadowBlades/FSA_WPN_Melee_002_ShadowBlades_R.glb` 及左刃仅供对照，模型未同步；[审阅](ui/concepts/2026-10-06-weapons-remaining/Review.html) |

| ui_attribute_hp | HP | HUD 属性栏 | `ui/icons/attributes/ui_attribute_hp.png` | PNG / 1254×1254 / RGBA | 象牙白十字，透明底 | 已验收 | 未接入 | 本轮六图标，24／32px 审阅；原尺寸少量边缘残留 |
| ui_attribute_sp | SP | HUD 属性栏 | `ui/icons/attributes/ui_attribute_sp.png` | PNG / 1254×1254 / RGBA | 象牙白头部侧影，透明底 | 已验收 | 未接入 | 同上 |
| ui_attribute_st | ST | HUD 属性栏 | `ui/icons/attributes/ui_attribute_st.png` | PNG / 1254×1254 / RGBA | 象牙白奔跑人形，透明底 | 已验收 | 未接入 | 同上 |
| ui_skill_roll | 翻滚 | HUD 技能冷却 | `ui/icons/skills/ui_skill_roll.png` | PNG / 1254×1254 / RGBA | 象牙白蜷身翻转与弧形动势，透明底 | 已验收 | 未接入 | 同上；无冷却遮罩 |
| ui_skill_shadow_assault | 影袭 | HUD 技能冷却 | `ui/icons/skills/ui_skill_shadow_assault.png` | PNG / 1254×1254 / RGBA | 紫色交叉双刃与突进线，透明底 | 已验收 | 未接入 | 同上；无冷却遮罩 |
| ui_element_shadow | 影元素 | 装备元素身份 | `ui/icons/elements/ui_element_shadow.png` | PNG / 1254×1254 / RGBA | 紫色弯月状影纹，透明底 | 已验收 | 未接入 | 同上；区别于影袭技能 |

本轮六图标：[审阅页](ui/concepts/2026-10-06-hud-six/Review.html) · [工作项](../Production/Plan/Art/05-完成项/14-HUD技能属性元素与武器剪影图标.md)。保留内置 AI 生图原始分辨率与透明通道，原尺寸仍有少量边缘残留，制作人于 2026-10-06 确认接受当前版本并完成验收。

## 武器图标验收

2026-10-06：[首版十把武器图标](../Production/Plan/Art/05-完成项/13-首版十把武器图标.md)全部已验收，暗影双刃采用 v3 交叉辉光版；运行时未接入。

## 武器 HUD 剪影与空槽图标（2026-10-06）

内置 AI 生图制作；[审阅页](ui/concepts/2026-10-06-hud-weapons-slots/Review.html)。保留原始分辨率及透明通道。原尺寸仍可见细小边缘／镂空残留，制作人于 2026-10-06 确认接受当前版本并完成验收。

| 资产 ID | 名称 | 资产路径（相对 Assets） | 格式／尺寸 | 交付状态 | 运行时接入状态 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| ui_weapon_silhouette_ak47_tactical | AK-47 战术 | `ui/icons/weapon_silhouettes/ui_weapon_silhouette_ak47_tactical.png` | PNG / 1774×887 / RGBA | 已验收 | 未接入 | 象牙白实心剪影；96×48／64×32px 检查 |
| ui_weapon_silhouette_m14_a | M14-A | `ui/icons/weapon_silhouettes/ui_weapon_silhouette_m14_a.png` | PNG / 1774×887 / RGBA | 已验收 | 未接入 | 象牙白实心剪影；96×48／64×32px 检查 |
| ui_weapon_silhouette_m249_e4 | M249-E4 | `ui/icons/weapon_silhouettes/ui_weapon_silhouette_m249_e4.png` | PNG / 1774×887 / RGBA | 已验收 | 未接入 | 象牙白实心剪影；96×48／64×32px 检查 |
| ui_weapon_silhouette_military_knife | 军用匕首 | `ui/icons/weapon_silhouettes/ui_weapon_silhouette_military_knife.png` | PNG / 1774×887 / RGBA | 已验收 | 未接入 | 象牙白实心剪影；96×48／64×32px 检查 |
| ui_weapon_silhouette_de50_tactical | DE-50 战术 | `ui/icons/weapon_silhouettes/ui_weapon_silhouette_de50_tactical.png` | PNG / 1774×887 / RGBA | 已验收 | 未接入 | 象牙白实心剪影；96×48／64×32px 检查 |
| ui_weapon_silhouette_m870_c | M870-C | `ui/icons/weapon_silhouettes/ui_weapon_silhouette_m870_c.png` | PNG / 1774×887 / RGBA | 已验收 | 未接入 | 象牙白实心剪影；96×48／64×32px 检查 |
| ui_weapon_silhouette_mp5_tactical | MP5 战术 | `ui/icons/weapon_silhouettes/ui_weapon_silhouette_mp5_tactical.png` | PNG / 1774×887 / RGBA | 已验收 | 未接入 | 象牙白实心剪影；96×48／64×32px 检查 |
| ui_weapon_silhouette_m24_a3 | M24-A3 | `ui/icons/weapon_silhouettes/ui_weapon_silhouette_m24_a3.png` | PNG / 1774×887 / RGBA | 已验收 | 未接入 | 象牙白实心剪影；96×48／64×32px 检查 |
| ui_weapon_silhouette_m67_frag | M67 破片手榴弹 | `ui/icons/weapon_silhouettes/ui_weapon_silhouette_m67_frag.png` | PNG / 1774×887 / RGBA | 已验收 | 未接入 | 象牙白实心剪影；96×48／64×32px 检查 |
| ui_weapon_silhouette_shadow_blades | 暗影双刃 | `ui/icons/weapon_silhouettes/ui_weapon_silhouette_shadow_blades.png` | PNG / 1774×887 / RGBA | 已验收 | 未接入 | 象牙白实心剪影；96×48／64×32px 检查 |
| ui_slot_primary_1 | 主武器 1 空槽 | `ui/icons/slots/ui_slot_primary_1.png` | PNG / 1774×887 / RGBA | 已验收 | 未接入 | 象牙白中空轮廓；两个主武器槽共用造型 |
| ui_slot_primary_2 | 主武器 2 空槽 | `ui/icons/slots/ui_slot_primary_2.png` | PNG / 1774×887 / RGBA | 已验收 | 未接入 | 象牙白中空轮廓；两个主武器槽共用造型 |
| ui_slot_secondary | 副武器空槽 | `ui/icons/slots/ui_slot_secondary.png` | PNG / 1774×887 / RGBA | 已验收 | 未接入 | 象牙白中空轮廓；小尺寸检查 |
| ui_slot_melee | 近战空槽 | `ui/icons/slots/ui_slot_melee.png` | PNG / 1774×887 / RGBA | 已验收 | 未接入 | 象牙白中空轮廓；小尺寸检查 |
| ui_slot_throwable | 投掷物空槽 | `ui/icons/slots/ui_slot_throwable.png` | PNG / 1774×887 / RGBA | 已验收 | 未接入 | 象牙白中空轮廓；小尺寸检查 |
| ui_slot_consumable | 消耗品空槽 | `ui/icons/slots/ui_slot_consumable.png` | PNG / 1254×1254 / RGBA | 已验收 | 未接入 | 象牙白中空轮廓；小尺寸检查 |
| ui_slot_helmet | 头盔空槽 | `ui/icons/slots/ui_slot_helmet.png` | PNG / 1254×1254 / RGBA | 已验收 | 未接入 | 象牙白中空轮廓；小尺寸检查 |
| ui_slot_armor | 护甲空槽 | `ui/icons/slots/ui_slot_armor.png` | PNG / 1254×1254 / RGBA | 已验收 | 未接入 | 象牙白中空轮廓；小尺寸检查 |
| ui_slot_boots | 靴子空槽 | `ui/icons/slots/ui_slot_boots.png` | PNG / 1254×1254 / RGBA | 已验收 | 未接入 | 象牙白中空轮廓；小尺寸检查 |

## 维护规则

- 已交付表逐文件填写实际路径与规格；不同文件的视觉状态或变体分别登记。
- 交付状态使用“待验收”或“已验收”，运行时接入状态独立记录为“未接入”或“已接入”。
- 替换文件时保留稳定的资产 ID，同步更新路径、规格、日期与变更备注。
- 只登记 UI 用途资产；模型、动画见 [模型动画资产配置表](模型动画资产配置表.md)，场景特效与非 UI 二维资产按 [目录分类](README.md) 归档。



