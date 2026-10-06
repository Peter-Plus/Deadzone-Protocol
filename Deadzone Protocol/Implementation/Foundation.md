# 基础工程实现

范围说明：本文描述 Core 和 `#foundation` 基础诊断入口。默认入口已升级为第一人称训练场，当前新增能力见 [FirstPersonRange.md](FirstPersonRange.md)。下文 Sandbox 的未实现项不代表整个项目都没有对应能力。

## 工程结构

```text
src/
  main.ts                  浏览器启动、配置解析、启动失败提示
  app/application.ts       依赖组装、requestAnimationFrame、暂停、重启、生命周期
  core/                    时间、事件、随机、实体 ID；无浏览器/Three.js 依赖
  config/                  基础场景 JSON、版本与字段校验
  sandbox/session.ts       临时验证模拟；不是正式世界或玩家系统
  presentation/scene-view.ts Three.js 场景与 GPU 资源所有权
  ui/foundation-panel.ts   DOM、操作回调、只读状态展示
  styles.css
tests/                     Node 自动测试，包括领域依赖边界
tools/build.mjs             esbuild 构建、只绑定回环地址的开发服务
```

TypeScript strict；源码使用 ES modules；浏览器 WebGL 2；开发工具需要 Node >=22。依赖版本和传递依赖由 package-lock.json 锁定。安装后构建不需要 CDN、ForgeKit 或 Legacy 文件。当前未初始化 Git 仓库。

主要交付入口为根目录 Play.html：esbuild 生成无 import 的 IIFE，再将 JS/CSS 内联进 HTML。配置一起打包，无运行时 fetch；启动不需要 npm、服务器或联网。dist/Play.html 是同一文件的发布副本；dist/index.html 与分离 JS/CSS 是可选的 HTTP 入口。测试编译产物在 .test-build。Play.html 作为可直接运行的交付文件保留，改源码后必须重新构建，开发 watch 不更新它。

Assets 是已有源资产根目录，基础诊断路径不加载 GLB；默认训练场现已内嵌所需 GLB 和 Rapier WASM，详见 FirstPersonRange.md。直接打开 HTML 是制作人明确要求，不能直接 fetch 邻近 GLB/JSON 并默认可行。

## 依赖与数据流

app 组装 config → SandboxSession → SceneView / FoundationPanel。

Session 暴露只读的 SceneDefinition（初始化布局）和 SessionSnapshot（动态状态）。表现模块仅消费值，不修改模拟对象。UI 使用 app 提供的操作回调，不直接访问 Session。当前表现/UI 类型引用 sandbox；正式玩法接入时再迁移必要契约，不提前创建通用 ECS、容器、插件系统或全局服务定位器。

Core 和 config 不依赖业务模块；sandbox 只依赖 Core/config。tests/boundaries.test.mjs 检查领域源码的静态依赖和浏览器全局引用；新增 Gameplay 目录时须扩展该守卫。

## 可复用接口

| 入口 | 行为与限制 |
| --- | --- |
| FixedClock(stepSeconds, maxSteps) | advance(dt, callback) 推进固定模拟步；返回剩余时间比例。dt 用秒，禁止负数/NaN/Infinity。ticks 与 elapsedSeconds 可查询。 |
| FixedClock.droppedSeconds / reset() | 单帧最多接收 stepSeconds × maxSteps 的时间，超出部分累计丢弃；reset 清除步数、余量和丢弃计数。 |
| TickScheduler.register(hz, callback) | 返回取消函数；每个宿主 Tick 最多回调一次，传入累计模拟秒数。不是精确相位定时器，非整除频率会量化到宿主 Tick，需求严格定时的系统应自行按固定 Tick 计算。 |
| TickScheduler.update(dt) / clear() | 按注册顺序执行；同次调度新增订阅下次生效，移除立即生效。错误向调用者传播。 |
| SeededRandom(seed).next() | Mulberry32 + 字符串 FNV-1a 初始化，输出 [0,1)。不用于安全用途或全局唯一标识。 |
| SeededRandom.fork(name) | 从原始 seed 派生命名流，不消耗父流。同名 fork 每次返回从头开始的同一序列，系统应保存自己的随机流实例。 |
| EntityIds.create() | 单局内递增 EntityId，不复用；新局重新从 1 分配。跨局不得保留实体引用。 |
| EventBus<Events>.on / emit / clear | 类型化同步广播，on 返回取消函数；注册顺序稳定。监听器异常向调用者传播，不吞掉错误；clear 会中止尚未交付的监听。 |
| parseConfig(unknown) | 校验字段、范围、版本及未知键，返回冻结的嵌套配置；字段错误抛出明确路径。 |

Gameplay 状态每固定步更新；渲染每 RAF 读取快照。当前未做运动插值，探针以固定步状态显示。时钟保留余量以消除常见 30/60/144Hz 帧划分差异；严重卡顿丢弃时间是明确取舍，不承诺任意机器或物理引擎下的完全确定性。

## 会话与资源生命周期

SandboxSession 构造时由命名流 sandbox-markers 生成冻结标记物布局，分配实体 ID，注册低频诊断 Tick。探针按模拟时间沿圆周移动，速度只是验证参数。

暂停停止推进时钟，不累计墙钟时间；恢复时 app 清除前次 RAF 时间。进入后台自动暂停，返回后手动继续。重启校验 seed 后创建新 Session，dispose 旧 Session，替换场景内容、重置时钟和 ID；保留一个 WebGLRenderer，不重建上下文。

SceneView 拥有场景 Geometry/Material；重启释放旧标记物与地面资源，最终 dispose 释放探针、renderer、ResizeObserver 和 canvas。app dispose 取消 RAF 和 DOM 监听。pagehide 非 bfcache 导航时销毁；bfcache 保留实例，由页面可见性规则暂停。

运行异常或图形上下文丢失时停止循环并提示刷新；当前不实现自动图形恢复。错误配置、浏览器不支持 WebGL 时显示启动错误。ui 面板以 10Hz 刷新数值，避免每渲染帧重建 DOM。

## 未实现边界

Sandbox 仍只负责诊断：灰色标记物没有碰撞，绿色探针不是玩家。新训练场的物理、输入、武器与资产不放入 sandbox。整个项目尚无正式 GameFlow、Modifier、玩家生存属性、敌人、背包、导航、安全圈或存档；没有 GPU 泄漏量化测试。未来玩法数值不能塞进 foundation.json。
