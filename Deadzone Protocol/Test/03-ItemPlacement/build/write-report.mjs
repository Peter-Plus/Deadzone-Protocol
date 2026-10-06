import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p)),s=read('evidence/static-checks.json'),p=read('evidence/performance.json'),motion=read('evidence/motion-checks.json'),iso=read('evidence/isolation.json');if(s.results.length!==30)throw Error('Wait for all 30 seeds');
const link=(text,name)=>`[${text}](../../../../Test/03-ItemPlacement/${name})`,f=n=>n.toFixed(2);
const summary=s.results.slice(0,3).map(r=>`| ${r.seed} | ${r.requested} | ${r.success} | ${r.failed} | ${r.success-40} / 40 | ${Object.entries(r.colors).map(([k,v])=>k+' '+v).join('、')} |`).join('\n');
const perf=p.runs.map(r=>`| ${r.name} | ${f(r.seconds)} | ${r.samples} | ${f(r.meanMs)} ms | ${f(r.p95Ms)} ms | ${f(r.maxMs)} ms | ${r.renderer.render.calls} | ${r.renderer.memory.geometries} |`).join('\n');
const regions=s.results.slice(0,3).map(r=>`### seed ${r.seed}\n\n| 建筑 / 区域 | 规则 | 请求 | 成功 | 失败 | 拒绝候选原因（次数） |\n| --- | --- | ---: | ---: | ---: | --- |\n`+r.stats.map(t=>`| ${t.key} | ${t.ruleId} | ${t.requested} | ${t.success} | ${t.failed} | ${Object.entries(t.rejections).map(([k,v])=>k+' '+v).join('；')||'无'} |`).join('\n')).join('\n\n');
const report=`# 03 — 室内外随机物品投放验证报告

日期：2026-10-05。结论：**通过本项独立场景的功能验证，保留容量与性能限制**。能按建筑模板、实例、室内区域/标签随机投放指定颜色；实际位置经过完整体积、真实支持面、入口禁放与玩家接近路径检查。交付自包含、已实际验证 file:// 的 HTML。未接入正式游戏。

## 交付与运行

- ${link('Play.html','Play.html')}：约 ${(fs.statSync('Play.html').size/2**20).toFixed(2)} MiB，双击离线运行。
- ${link('配置文件','config/placement.json')}：颜色、规则、数量、权重、尺寸、间距和搜索上限。
- ${link('README','README.md')}：操作与修改示例；${link('handoff.json','handoff.json')}：版本、命令、来源 SHA256 和逐文件清单。
- ${link('验证清单与截图','evidence/README.md')}；${link('三个代表 seed 的完整分布','distributions/104729.json')}。

在 Test/03-ItemPlacement 下执行：

\
node src/build.mjs
node src/verify-placement.mjs
node src/extra-placement-check.mjs
node src/browser-placement.mjs
node src/browser-views.mjs
node src/finalize.mjs
\

完整检查命令为 npm --cache ./.npm-cache run check。构建和检查均限制本项，无新依赖；只读复用现有 Three.js 0.180.0、Rapier compat 0.21.0、esbuild 0.28.2、Node ${process.version}。没有运行正式工程的构建。

## 前序来源、坐标与规则

读取 01/02 README、报告与 handoff，实际校验 01 的 57 个文件和 02 的 75 个文件，均与交接 SHA256 相符。复制模型、动画、导航、物理、生成器及表现基线；来源和校验见 ${link('sources.json','evidence/sources.json')}。world-assets.v1 / navigation.v1，均为 1.0.0；本项 item-placement.v1 / placement.v1，版本 1.0.0。

保留 160 × 160 m、15 栋、三个聚落、29 A1 + 1 B2 和玩家；第一人称、真实敌人模型/独立动画、巡逻追击、Rapier 控制器、0.5 m 导航网格与原调试功能均继承。未修改 world.mjs、navigation.mjs、simulation.mjs、cases.mjs、建筑 GLB 或角色 GLB；app/page/build 为本项副本增量。源差异见 ${link('source-differences.json','evidence/source-differences.json')}。

米制、Y 向上，实例原点为地基底面，Y 旋转弧度、scale=1。室内在局部区域随机采样再完整变换；方块中心在实际地坪之上半高。室外以真实三角网高度和法线定向，使完整底面共面；拒绝跨折线/不适合完整支撑的位置，不从天空射线取屋顶、不统一 y=0。

模板 A=through 默认红；模板 B=bent 默认蓝；模板 C=warehouse 原 storage 区沿局部 Z=0 分为 south 绿、north 黄。A-1 按实例覆盖紫色；室外 central-corridor 细分白色区及 cyan/orange=3:1 权重区。所有颜色是测试标签，无品质语义。实例覆盖时原模板颜色限制明确让位，例如 A-1/through 是紫色。

优先级固定为 instanceId 100 + regionId 20 + tag 10 + templateId 2；最高分唯一命中，平分冲突报错，kind 仅作过滤。未匹配区域不投放。原模板 exclusions 始终禁放，不能被颜色规则覆盖。改变 template-A-red.colors 为 {"blue":1} 并重新构建，即可将该模板非实例覆盖区域统一改蓝；其他示例见 README。

物品边长默认 0.32 m，无刚体。检查八顶点区域包含、墙/屋顶体积、外接球保守间距、膨胀后的入口/坡道/主通路和初始角色占位。每物品附 access 接近点，胶囊可站立、与物品之间无墙且从出生点连通。只改物品配置/seed，世界与敌人出生流不变。运行中非阻挡方块允许被角色走过，不动态追着敌人重投。

## 生成与合法性

30 个固定世界 seed：104729、20261005、8675309、placement-0 至 placement-26；物品 seed=loot-104729。共 **${s.results.reduce((a,r)=>a+r.success,0)} 个方块**，每场 **${Math.min(...s.results.map(r=>r.success))}–${Math.max(...s.results.map(r=>r.success))} 个**，全部有三种模板和多个建筑实例室内投放，每场 40 个室外方块。

${link('static-checks.json','evidence/static-checks.json')} 保存 seed 清单、SHA256、颜色计数、每区域统计和真实查询摘要。独立验证不调用生成器的合法性谓词：使用 Rapier cuboid intersection 验完整体积（0.2 mm 接触容差）、每底面 9 点向下短射线验支撑、真实胶囊验接近点、短射线验取物视线、重新从出生点求完整路径，另作禁放范围离散审计和成对实体交叠检查。最大支持面误差 **${Math.max(...s.results.map(r=>r.audit.maxSupportError)).toExponential(3)} m**。支持射线从底面上方 0.12 m 出发，避免击中室内屋顶。

| world seed | 请求 | 成功 | 失败 | 室内 / 室外 | 颜色数量 |
| --- | ---: | ---: | ---: | --- | --- |
${summary}

失败数量是请求未满足，不是非法方块。狭小 bent-storage 及少量 warehouse 子区域因初始敌人占用、保守间距耗尽尝试预算；不无限循环，不移到别区补数。拒绝候选还包括跨三角折线等，候选拒绝数通常大于最终缺额。默认每物品 100 次、每区域最多 2400 次；达到上限如实返回成功/失败/原因。

每个 seed 连续生成两次稳定清单完全相同；更换 placement seed 物品改变但布局/敌人初态签名不变；更改室外规则数量为零也保持签名。浏览器额外比较重投前后完整物理快照完全不变。generationMs 属计时诊断字段，不纳入稳定比较。

${link('失败路径','evidence/negative-checks.json')}：零数量生成 0/0；超量场景请求 230000，合法生成 191、失败 229809，遵守搜索上限；极小子区域测试成功 87、失败 18，原区域外没有溢出。未知模板/区域/实例/标签、非法权重、负数、规则冲突和越界细分全部明确报错。

${link('独立校验器及封闭空间反例','evidence/extra-placement-checks.json')}：主动篡改方块为悬空、埋地、重叠、错误颜色或不可达接近点，均被实际查询检出。内存测试向 A-1 双门同时加入真实碰撞与导航障碍，4 次候选全部因无连通接近点失败，2 请求 / 0 成功；没有改变资产或将此合成反例冒充原建筑。所有默认建筑本身均为已连通的单层模型。

## 实际浏览器、运动和资源

${link('browser-report.json','evidence/browser-report.json')}：Chrome 154.0.8037.93，在真正 file:// 下加载 GLB、WASM 和 JS，无外部 HTTP 请求、无 JS 异常。不是 HTTP 结果替代离线双击验收。

三个 seed 各建立红/蓝/绿/紫/白五种诊断路线，玩家从建筑坡外或场景中心通过物理解算走到接近点，共 15 条成功；诊断初态会重新创建角色，行走过程没有坐标拉回/瞬移。${link('逐步物理轨迹','evidence/browser-tours.json')} 可查支撑和到达状态。实际 WASD 输入移动、定位观察、Blob 下载均已核验；鼠标锁定的桌面授权交互仍留人工确认。

Node 12 项专项回归通过，浏览器另运行继承的 45 项运动回归，并在页面保留物品网格时让每 seed 10 敌人通过仓库入口。玩家上坡约 2.02 s，转角约 5.03–5.05 s，B2 转角约 12.30–12.48 s；10 敌人分别在 **31.43 / 29.97 / 19.88 s** 全部抵达，和 02 数值一致。方块不加入角色物理世界；禁放范围避免视觉堵门，而实际运行也未新增阻塞。动态人群仍按 02 策略拥堵/等待，不保证任意时刻所有人立即到达。

资源：8 次物品重投方块 Mesh 数始终等于当前清单，刚体保持 31、材质 8、同世界 geometry 254；4 次世界重建 geometry 为 254/270 交替而非增长。打开标签后相同 seed 重投 6 次，实际上传的可见 texture 数保持 21、mesh 数 101；其余视锥外标签尚未上传 GPU。${link('生命周期','evidence/browser-lifecycle.json')} / ${link('标签纹理','evidence/label-lifecycle.json')}。

截图：${link('全图分布','evidence/world-104729.png')}、${link('红色室内','evidence/room-red-104729.png')}、${link('蓝色室内','evidence/room-blue-104729.png')}、${link('相邻绿黄区域','evidence/subregions-104729.png')}、${link('抬高地坪第一人称','evidence/raised-entry-final.png')}、${link('坡地室外','evidence/slope-outdoor-104729.png')}。另外两个 seed 同类型截图在证据索引中。

## 性能实测与限制

设备：Windows ${p.env.release}，${p.env.cpu}，${p.env.logicalCpus} 逻辑核心，${f(p.env.memoryGiB)} GiB 内存。Chrome ${p.env.browser.product} 无头模式。相同窗口请求 1600 × 1040，实际内容 **1578 × 942**，WebGL 画布 **1282 × 868**，DPR=1。两档均为 seed 104729、30 敌人追击、同一默认图层，分别预热后采样约 30 s；初始化和主动重建不计入稳定帧样本。本次未独立记录 GPU 型号，不借用 02 历史报告冒充本次驱动采样。

| 版本 | 秒 | 帧样本 | 平均 | P95 | 最慢帧 | 末帧 draw calls | geometry |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${perf}

新增 99 方块对应 **+99 draw calls、+1 共享 geometry**，仍无新物理体。本次 03 帧均值低于 02，可能受系统负载、JIT 和采样阶段影响，**不解释为投放提高性能，也不据此推导负开销**；可确认的渲染提交与资源增量如上。初始化物品生成浏览器样本约 ${f(p.runs[1].placementMs)} ms，同步生成会短暂停顿。未承诺正式 90/120 FPS，未重做 02 的 50 人长期压力结论；02 的主线程路径搜索和拥挤限制仍保留。性能原始记录见 ${link('performance.json','evidence/performance.json')}。

## 修正与范围

1. 首轮 placement-2 被独立体积检查发现一个倾斜方块上缘越界；初稿仅验证底面。现改为八顶点全部在区域内，保留 ${link('首轮失败','evidence/volume-first-failure.json')}，最终 30 seed 全部通过。
2. 测试器曾额外要求每模板至少两栋，placement-0 的原始布局只有一栋 bent；工作项要求三种模板与多个室内实例，已按该要求检查，未改世界 seed 或删去该测试。保留 first-static-run.json。
3. 旋转房屋的物品定位相机原先用世界偏移导致墙面遮挡；已使用建筑局部偏移和去顶观察。调试标签缩小，默认关闭；最终 screenshots 重新核验。
4. 首次 Chrome GPU 启动受执行沙箱限制；允许测试进程正常执行后通过真实离线测试，未关闭浏览器安全策略。首轮 browser-failure.json 保留。

可复用：独立区域解析与规则优先级、配置校验、独立物品随机流、完整体积/真实支持/接近路径的验证方法、分布清单与证据。实验限定：三种单层建筑、Y 旋转、静态地形、矩形候选区、非阻挡立方体。没有正式 Inventory、拾取经济、装备、稀有度、商店、世界事件或新的敌人系统。

本项实际写入仅 Test/03-ItemPlacement 与本报告；未修改 01、02、ForgeKit、正式 src/tests、包文件、根 Play.html 或工作项原文。新增/修改分类为源码、局部配置、复制资产、独立构建/检查入口、Play.html、README、handoff、分布和证据，逐文件清单/SHA256 见 handoff。

${link('隔离扫描','evidence/isolation.json')} 对 ${iso.protectedCount} 个受保护文件比较，观察到 ${iso.changed.length} 个已有路径变化和 ${iso.added.length} 个新路径，涉及其他 Boss 动作/资产说明/计划文档等，并非本项写入操作；未覆盖或回退。因此**不能宣称全库字节不变**。01/02 实际复制来源会在 finalize 再逐个校验，保持原独立入口。

## 代表 seed 的逐区域统计

${regions}
`;
const body=report.replace('\n\\\nnode','\n```powershell\nnode').replace('node src/finalize.mjs\n\\\n','node src/finalize.mjs\n```\n');fs.writeFileSync('../../Production/Plan/工作项/报告/03-物品投放验证报告.md',body);console.log('Wrote report');
