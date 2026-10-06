# 后续 Codex 会话交接

基线：2026-09-30 第一人称训练场。A/B/E 已完成一个可玩的原型切片，下面更新为后续扩展任务，不能重做已经落地的代码。未创建其他会话。

## 每个会话的共同入口

先读项目 README、Implementation/README.md、Implementation/FirstPersonRange.md，需要 Core 时再读 Foundation.md，然后只读负责模块的 Design。执行 npm run check 确认基线。不要依赖旁边 ForgeKit/Legacy 的 node_modules 或直接修改其项目。

**制作人明确要求双击 HTML 即可运行游戏。** Play.html 是主要交付入口，npm 只用于开发/构建。所有新依赖必须兼容这一交付方式：资产考虑构建时嵌入字节，再解析 ArrayBuffer；物理 WASM 也要确定内嵌初始化方案。不能以要求用户启服务、关闭浏览器安全策略或联网 CDN 作为默认解决方案。各模块验收都须检查最终 file:// 入口；当前自动化浏览器不允许 file://，需在交接中保留人工实测项。

当前不是 Git 仓库。多人并行前应确定代码版本管理和集成方式；若直接共用目录，必须划定文件所有权，避免同时改同一文件。实施前先检查目录和当前代码；不要按旧计划覆盖已有实现，也不要创建空类占位。

共享文件 src/app、src/main.ts、package.json、package-lock.json、tsconfig.json、基础配置及 Core 由集成会话负责。模块需要变更共享文件时，把具体依赖版本、API 变更和接入示例写入自身交接文档，交由集成会话实施。单独运行模块测试可使用自己的测试文件与独立验收入口。

每个任务交付：实际源码、必要测试、Implementation/<模块>.md、相关 Guide、尚待制作人决策的问题。文档必须区分“已实现接口”和“建议接口”。公共接口尽量使用 TypeScript readonly plain data；Gameplay 不导入 DOM/Three.js。扩展 tests/boundaries.test.mjs 的目录列表由集成会话完成。

## 并行关系

现在适合并行推进 C（物品）、D（空间基础）和 B 的完整角色动画接入。A 只在新增碰撞需求时扩展；E 在 C 的实例所有权稳定后整合。下一条可见玩法建议为单个敌人追击/受击/死亡，但须单独阅读 Character 设计并规划，不直接把靶子改名为 Enemy。不要同时派发互相依赖且尚未冻结契约的任务。

### A · 物理与玩家扩展（基础已实现）

可直接给新会话的任务：

> Rapier 已选定并接入，不再重复询问选型。先读 Implementation/FirstPersonRange.md、src/physics、src/input、src/character/player.ts 及对应 Design。当前已支持胶囊移动、地面、跳跃、墙体、头顶碰撞和射线。仅按新任务扩展台阶/坡面/动态物体或生存属性，不重写已有移动入口。保留固定 Tick、失焦清理、独立物理端口与八方向地面运动回归。新碰撞玩法先建立小测试，再由集成会话接入训练场或正式会话。

重点：物理查询结果需要能关联 EntityId；单位和射线前向一致；输入焦点与 pointer lock 丢失必须清理状态。先确定最大敌人数和目标平台需求，再决定物理参与范围。

### B · 角色与更多装备动画（FPS 基础已实现）

> 先阅读 src/presentation/assets/range-assets.ts、range-view.ts 和 Implementation/FirstPersonRange.md，已有双臂/Vanguard/四段 Firearm 动画已通过内嵌 GLB 接入。按 Design/Asset 和资产说明扩展完整角色的 Idle/Walk/Attack/Hit/Death；每个角色必须独立可变节点和动画状态。当前按需要建立通用实例/资源缓存，不预先加载全部资产。提供角色展示验收入口，并验证死亡末帧与实例隔离。已有 Weapon_R 和 Camera_FPS 接法保留；类别切换、Holster/Draw 和左臂姿态恢复在装备系统需要时再接入。Gameplay Event 继续由玩法时间驱动，不由动画回调决定伤害或扣弹。

写入范围：src/presentation/assets、src/presentation/animation、对应测试和文档。源 GLB 不改名、不覆写。缺失环境资产可用简单几何体，不启动资产生成工具链重构。

### C · 物品、背包与装备

> 阅读 Design/Item/Item.md，以及 Combat 对 WeaponState 与 Equipment 的职责规定。在 src/item 实现无 UI、无 Three.js 的物品实例、容量规则、存放与装备操作。先用可执行测试固定装备和背包对同一 ItemInstance 的所有权/引用规则，再实现新增、移除、装备、更换与容量不足的原子失败。配置放在独立物品配置模块；不得把弹药/耐久复制到多个所有者。交付只读查询、显式操作 API、物品 ID 和 ItemInstance 生命周期，以及供战斗模块访问武器实例状态的契约。暂不实现商店、掉落概率或 UI。

写入范围：src/item、tests/item*.test.mjs、模块文档。若设计对容量或物品类别的细节不足，列出局部假设与测试，涉及玩法取舍时与制作人讨论。

### D · 世界空间基础

> 阅读 Design/World/World.md 的地图、SpawnGrid、SpawnRule、SpatialGrid 和 Building 部分。在 src/world 实现纯数据的生成网格与运行时空间查询，两者职责分离。使用 SeededRandom 的命名随机流，以 EntityId 关联查询结果。交付占用/禁生规则、确定性抽样、实体插入/移动/移除与邻域查询，测试边界、负坐标、重复更新、删除和固定种子复现。合法出生位置需要通过调用者提供的碰撞/通行性查询判定，不能凭视觉模型推断。先不实现完整地图内容、天气、安全圈或敌人 AI。

写入范围：src/world、对应测试和文档。给 A 提供建筑碰撞描述需求，给后续敌人模块提供只读空间查询；不要自行固定物理引擎数据格式。

### E · 武器与 Item 整合（单枪射击已实现）

> 先读 src/combat/weapon.ts、src/range/session.ts 和 Implementation/FirstPersonRange.md。单把 Vanguard 的自动射击、射线、弹药、换弹提交和靶子伤害已实现并有测试；当前 Weapon 由训练场会话拥有。等 C 的 ItemInstance 接口稳定后，将同一个武器状态移交 Item 所有，Equipment 只引用，不能复制弹药。再按实际任务扩展 ADS/散布/后坐力、切枪和更多武器状态。保留换弹提交前后取消、空弹、暂停、帧率一致性测试。不要以动画驱动武器真值，也不要一次实现所有武器类别。

## 集成会话职责

审核新增依赖与接口；扩展领域依赖测试；在 app 中按明确顺序组装输入→模拟→物理/玩法→只读快照→表现。为正式玩法建立自己的会话，不把 SandboxSession 演变成全局上帝对象。维持基础验证入口，增加独立 gameplay 入口时更新启动 Guide。

已有可玩训练切片：基础玩家与碰撞 + 一把武器 + 靶子。后续建议：单个敌人 → 简单拾取 → HP/SP → 安全圈与 Final。每段完成后运行相关测试和浏览器验收，切勿将 Design 的全部系统一次性建立为空壳。
