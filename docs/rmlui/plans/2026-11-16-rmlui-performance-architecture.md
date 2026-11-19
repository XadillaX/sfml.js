# RmlUi 性能架构 Implementation Plan

> 执行方式：在当前会话使用 executing-plans，逐任务实现并验证。

**Goal:** 将现有 RmlUi 绑定的热点改为 Native 所有权、共享存储及批量消费，
通过完整帧和行为测试证明性能与语义。

**Architecture:** 默认求值、布局和绘制留在 C++。扩展计算通过显式批量协议
消费 Native 数值快照，并产生共享命令。所有权维护由真实变更驱动；
连续兼容渲染命令合批，跨状态边界提交。

**Tech Stack:** RmlUi 6.3、SFML 3.1.0、C++20、NAN/V8、TypeScript、Node.js。

**Spec:** [全绑定性能审计](../audit/6.3/architecture-performance.md)。

## 全局约束

- 禁止使用 `using-git-worktrees`，禁止创建 worktree，禁止 clone 或复制仓库绕过。
- 禁止为构建或测试创建隔离环境；在现有 `sfml.js` 工作目录完成。
- 保留无关工作；无提交、推送、发布授权。
- Native 管理生命周期；保留共享视图、绘制快照、GC 可见边、异常及回调顺序。
- 新公开 API 提供英文、中文、日文、韩文 TSDoc；C++ 保持现有可读格式。
- 中间脚本、日志、测量放 `/tmp/rmlui-63-completion`；项目文档放 `docs/rmlui`。

## Review Focus

- 结构变化可能来自 RmlUi 内部控件、数据 view 或 GC finalizer，不能只拦截 JS DOM 方法。
- 回调注册在初始化回调内部发生，嵌套变化必须在返回用户前建立正确保活边。
- 脱离树及拥有型 Context 中的闭包循环应能回收，重新挂接后必须被 Native 根保活。
- 合批不得跨裁剪、图层、shader、纹理变更或捕获边界；异常也不得留下待提交资源。
- 共享输入可 resize、保留或被修改；旧视图不得悬空，已提交结果不得随之变化。

## Task 1：真实结构版本与 data factory 维护门控

**Files:** `tools/patch-rmlui.cjs`、`native/rmlui-state.{h,cc}`、
`native/rmlui-data-factory.cc`、`native/rmlui-element-state.cc`、
`test/ownership-performance.test.cjs`、`test/performance-diagnostics.test.cjs`。

**Interfaces:** RmlUi `Element` 提供包内结构版本读取；结构创建、SetParent、
销毁使版本推进。data factory 有独立的 dirty 状态；自有/转移实例变化置脏。
新 wrapper 直接建立自身 owner 边，全量 wrapper 刷新按结构版本门控。

- [x] 写失败测试：1,000 个自定义实例后查询 100 次，
  `ownershipInstanceVisits === 0`；普通数值属性更新
  `elementOwnershipVisits === 0`。
- [x] 执行测试证明当前失败，保存输出。
- [x] 实现结构版本及门控。清除 dirty 必须发生在快照前，
  回收和嵌套变化不得被快照后的无条件清除吞掉。
- [x] 测试内部 input 类型替换、重挂接、模型移除、回调异常与 GC 循环。
- [x] 原有行为测试通过，重新测量 100k view 查询和 1k 属性场景。

## Task 2：监听器索引与局部保活

**Files:** `native/rmlui-events.cc`、`native/rmlui-listener-instancers.cc`、
`native/rmlui-state.cc`、`native/rmlui-data-diagnostics.{h,cc}`、
`test/ownership-performance.test.cjs`、`test/listeners.test.cjs`。

**Interfaces:** Native listener 索引按 Element 和 EventId/capture 桶定位，
回调 identity 在对应桶比较；插入、原生 OnDetach、移除和 shutdown 同步索引。
已挂接 Native 元素只更新当前 listener，脱离根更新当前 owner 的边。

- [x] 以 1k/10k 元素及 1k controller 注册证明查重与 ownership 工作量线性，
  验证重复添加、错误 capture、同闭包多目标、自移除和异常。
- [x] 实现索引与局部更新；typed listener 不再在每个无变更入口全量刷新。
- [x] 完成拥有型 Context、detached root、GC、默认 instancer 和延迟 release 测试。
- [x] 100k controller 在原 300 秒限制内完成初始化和完整帧测量。

## Task 3：所有扩展回调的增量维护

**Files:** `native/rmlui-{tween,filter-callbacks,decorator-callbacks,
font-effect-callbacks,element-instancers,context-instancers,event-instancers,
callback-owners}.{h,cc}` 及对应行为测试。

**Interfaces:** 各 callback/lease registry 保存变更版本及受影响 owner；
结构版本推进可合并一次全量重建；旧根列表只清理曾建立的边。
属性和样式资源变更单独推进资源图版本，字体 atlas lease 变化也必须纳入。

- [x] 为每类回调加入稳定查询 ownership 工作量为 0 的计数测试。
- [x] 在新增、附着、释放、样式资源变化和 GC finalizer 的真实位置标记变更。
- [x] 共用回调来源快照，避免字体效果独自反复复制全部属性和 DOM。
- [x] 所有 GC、样式表、动画、字体、filter、decorator 生命周期测试通过。

## Task 4：共享元素命令与数值查询

**Files:** 新建 `native/rmlui-element-commands.{h,cc}`、
`src/element-commands.ts`；更新 `native/addon.cc`、`binding.gyp`、
`src/internal/native.ts`、`src/core.ts`；增加类型及运行时测试。

**Interfaces:** Native 持有命令存储和 element lease 表；JS 使用 TypedArray
写 opcode、element slot、PropertyId、number、Unit。提交一次校验并按顺序消费。
数值查询由一次 Native 调用填充同一保留输出数组。资源性 Variant 继续使用拥有型快照。

- [x] 测试 1k/10k/100k 数值命令的一次入口、0 次反向调用和有限数校验。
- [x] 测试队列后改写输入、元素销毁、跨 Context、callback 重入、
  部分失败及异常时的确定消费语义。
- [x] 完成公开 TSDoc、类型检查和与原 typed property 输出的一致性测试。

## Task 5：显式批量 view 计算协议

**Files:** 新建 `native/rmlui-data-batch.{h,cc}`、`src/data-batch.ts`；
更新 `native/rmlui-data-factory.cc`、`tools/patch-rmlui.cjs` 和导出；
新增批量 view 类型及运行时测试。

**Interfaces:** 批量组在 Native scheduler 的稳定顺序区间内接收脏实例的
slot 和数值输入，一次 JS 计算写共享结果，由 Task 4 命令 consumer 应用。
旧逐实例 update 不自动切换协议。model 句柄按 Native pointer 索引。

- [x] 测试依赖脏集合、sortOffset 顺序、同一帧追加更新和释放。
- [x] 验证批量组返回、异常、GC、跨组依赖及原回调副作用不被跳过。
- [x] 100k 数值更新双向调用按批次计数，完整输出与原场景一致。

## Task 6：连续兼容几何合批

**Files:** `native/render-interface-sfml.{h,cc}`、
`native/rmlui-context.cc`、`native/rmlui-render-manager.cc`、
`native/rmlui-data-diagnostics.{h,cc}`；新增 renderer 行为测试。

**Interfaces:** Native renderer 录制不可变几何及状态；在 context render 返回、
target/texture/shader/scissor/stencil/layer/capture/resource release 前 flush。
保留兼容批次缓存；少量或不兼容几何仍可使用原 VBO。

- [x] 先验证顺序、透明叠加、共享纹理、裁剪、变换、mask、滤镜和图层像素。
- [x] 合并连续兼容几何，容量增长有界；记录真实 draw、上传与复制。
- [x] 验证旧 mesh 视图、纹理更新和释放不改写已录制快照。
- [x] 全脏与静态 100k 行重新测量；稳定缓存不得每帧重新上传全部几何。

## Task 7：Native 异步资源预加载

**Files:** 新建 `native/rmlui-resource-preload.{h,cc}`、
`src/resource-preload.ts`；更新 renderer、fonts、runtime 及导出。

**Interfaces:** 工作线程读取、解码、预乘并持有结果；所属线程校验 generation
后提交 GPU 资源或字体内存；同步 RmlUi virtual 命中预加载缓存。

- [x] 验证主线程不执行文件读取/解码，重复资源去重、取消和加载异常。
- [x] 验证 runtime shutdown/restart、资源释放及同时请求不提交过期结果。
- [x] 验证初始化展示前可 await 全部资源，热帧无缺失资源或延迟补图。

## Task 8：全量验收与状态对账

**Files:** `docs/rmlui/audit/6.3/architecture-performance-results.md`、
更新后的 CSV/JSON 测量产物、相关公开说明。

- [x] 执行 `npm run lint`、`npm run cpplint`、Native/TS build、types、
  全部 runtime 测试。使用现有构建目录，输出日志到 `/tmp/rmlui-63-completion`。
- [x] 同一机器、相同负载、诊断关闭计时，重测 1k/10k/100k 的完整 CPU 帧。
- [x] 分别记录双向调用、所有权 visits、malloc、复制、上传、draw 与输出检查。
- [x] 更新每项通过/失败及未覆盖范围；API 完整性任务独立对账。

## 本地验收记录

[完整结果](../audit/6.3/architecture-performance-results.md)记录 37 个成功场景、
95 组负载、7,600 个计时帧，失败为 0。75 个当前运行时测试文件全部执行，
690 个 literal PASS 行，0 FAIL；Native/TS build、consumer types、lint、
cpplint、148 个 Native 文件格式、87 个编译单元命名及四语公开契约检查通过。

100k 全脏共享路径完整 CPU 帧 p50/p95 为 140.872/146.825 ms，双向调用 6/0；
显式批量 view 为 103.643/109.954 ms、6/1。连续兼容几何为 10 draw；
静态帧上传及全场景 ownership visits 为 0。原始帧、5 帧计数、构建日志和
394 个源码/配置/二进制文件的前后指纹均保存到结果 JSON；6 个基线文件指纹未改变。

本计划的通过范围是 macOS arm64 性能架构与行为契约。单标量大量默认 view 的
文档初始化仍有一次性成本，全脏帧仍有布局、分配及几何复制；GPU 完成时间、
其他平台和完整 API/应用验收没有由本计划推定通过。

[完整性计划](2026-11-14-rmlui-63-completion.md)继续独立执行：
Core 549 条声明为 391 本地验证、20 部分、138 待处理；Data 131 条为
48 本地验证、79 部分、4 待处理。Core 19 组整体验收和完整性 Tasks 4–10 保持开放。
