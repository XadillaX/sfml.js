# RmlUi 6.3 绑定架构与性能审计

本审计覆盖 `sfml.js-rmlui` 的全部导出模块、Addon 注册、共享存储、
宿主回调、所有权维护、资源加载和渲染链路。当前架构**未达到整体高性能验收**。
原生默认数据表达式和已保留的数值视图符合既定方向；扩展回调、全局维护、
逐元素绘制和冷资源加载仍存在明确缺口。

本文件记录 2026-11-16 改造前的源码基线。实现进度及改造后的测量另行记录，
避免将计划当成已完成的能力。它不替代 [6.3 API 完整性审计](README.md)。

## 清点范围和证据

TypeScript 编译器解析 `src/index.ts` 的实际导出符号，而不是只搜索
`export class`。范围包含 `core.ts` 的转导出、`Style` 命名空间、生成文件、
内部适配文件，以及全部 Native `.cc`、`.h`、`.mm`、`.inc` 文件。

| 项目 | 基线数量 | 口径 |
| --- | ---: | --- |
| 顶层公开导出 | 271 | 编译器解析出的名称，包含类型、枚举、函数及命名空间 |
| TypeScript 源文件 | 93 | 包括内部及生成代码 |
| Native 源文件 | 145 | 包括头文件、生成字段定义和 macOS 实现 |
| Addon 初始化模块 | 63 | `addon.cc` 实际调用的初始化函数 |
| Addon 导出属性 | 988 | 当前加载的 Native 二进制，其中 985 个函数 |
| TypeScript Native 调用位置 | 1,016 | 静态语法位置，不是运行次数 |

[完整源码清单](architecture-inventory.md)列出每个文件的声明、入口和回调位置。
[机器可读清单](architecture-inventory.json)保存源码指纹、公开符号来源、所有
Addon 导出及逐文件证据。文本匹配数量只用于导航，不能当成运行时调用量；
模板定义、生成入口、转调函数必须结合实际导出与执行路径理解。

运行次数及帧时间来自 [完整帧基线](frame-performance.md)。基线覆盖 CPU 帧、
macOS 主线程 malloc 及明确插桩的拷贝类别，不包含 GPU 完成时间，也不代表
所有隐式 STL、SFML 或驱动拷贝的总量。

## 责任与路径矩阵

| 领域 | Native 责任 | JS 路径和存储 | 热路径结论 |
| --- | --- | --- | --- |
| 运行时、Context、Document | RmlUi 全局状态、布局、更新、渲染、DOM、资源代际 | 不透明句柄；Context 尺寸有保留视图；其余查询通常一次进 Native | 默认每帧入口固定，但退出入口后的维护可能随全场景增长 |
| Element、表单、文本、布局工具 | 元素及控件内部状态；原生 RTTI；布局和文本计算 | 方法逐次调用，字符串及返回值在边界转换 | 单次操作合理；大规模逐项使用缺少共享命令路径 |
| 数值、Box、RenderBox、Vertex、样式值 | 独立数值对象及字段内存 | `MapShared` 映射 TypedArray；标量字段可直接读写 | 保留视图后读写不跨语言；部分 Box 便利方法仍逐次调用 |
| ComputedValues | 活元素或独立计算样式对象 | 生成 getter/setter 逐字段调用 Native；复杂值构造快照 | 缺少面向一组元素、多个数值字段的保留输出缓冲 |
| DataSchema、DataVariable、DataModel | schema、Numeric backing、依赖求值、默认 view/controller | 数值数组共享视图；`applyPatch` 一次进入 Native；常规 get/set 逐值转换 | 已有固定入口快路径；patch 仍解析路径和转换值，不等价于共享内存 |
| 自定义 getter/setter/transform/definition | Native 调度、类型检查、回调有效性 | 每次求值返回 JS；对象、列表和 Variant 可能再转换 | 调用次数与求值次数一致；默认 Native 表达式不需要这些回调 |
| 自定义 DataView/DataController | 实例所有权、依赖排序、初始化、释放 | 每实例 initialize/update/dependency 回调；JS 经 Element 方法返回结果 | 尚无批量计算协议；旧接口的顺序和副作用必须保留 |
| EventListener、事件与 instancer | 派发、传播、目标有效性、延迟释放 | 每监听器回调构造事件快照；重复注册在全局 registry 查找 | 注册存在二次复杂度；事件回调不能无条件合并 |
| Property、字典、规格、样式表、动画 | 属性值、元数据、原生解析和样式计算 | 数值元字段部分共享；Variant、变换、动画列表使用拥有型快照 | 样式解析可以留在 Native；复杂值不具备零拷贝通用表示 |
| Tween、Filter、Decorator、FontEffect | 调度、渲染资源和元素 lease | 扩展计算调用 JS；回调和数据依赖 Native 根或 JS 可见边 | 所有权扫描会跨对象、属性、样式表甚至 DOM；部分每入口执行 |
| Mesh、Geometry、RenderManager、Texture | 网格内存、几何、资源代际、图层和渲染状态 | 网格共享视图；复杂 render-state 和 clip-mask 做快照 | 输入映射已具备；提交仍复制网格；默认 renderer 逐几何上传、逐几何 draw |
| FontGlyph、字体、流、平台 | 字形和位图内存、字体引擎、文件与平台输入 | 数值字段映射；位图及回调 scratch 以稳定快照保护 | 字体稳态不回 JS；冷 atlas 和文件资源仍有同步处理和复制 |

默认 SFML render/system/file/font 路径留在 C++。用户扩展是明确的宿主
回调接口，不是默认布局、解析和绘制必须绕行 JS 的证据。
`Stream callback is not implemented` 是缺少指定虚方法时的校验异常，
不是整个 Stream 适配器的未实现占位。

## 跨语言与共享存储

`rmlui-numeric-value.cc`、`rmlui-box.cc`、`rmlui-mesh.cc`、
`rmlui-font-glyph.cc`、`rmlui-style-values.cc` 和
`rmlui-data-storage.cc` 已使用 Native 持有的共享存储。映射资源须由 backing
的 owner 保活，不能直接暴露会随 DOM、资源释放或 vector resize 失效的地址。
数据数组 resize 保留旧视图，通过新 backing 和前缀复制切换到新存储。

`rmlui-computed-values.cc` 的生成字段入口仍逐字段读取。`ComputedValues`
保留的是 Native 句柄，不是完整数值字段的共享快照。解决方案是 Native 持有
一个显式刷新、版本化的数值快照，批量导出字段；JS 不直接写活元素的只读样式。

`rmlui-data-factory.cc: NativeView::Update` 每个实例调用一次 JS。
`ModelStateOf` 还遍历所有 Context 和 model 找宿主包装器。即使 JS 回调只写
`width = value + 1`，旧接口仍有每实例反向调用，以及每元素 `setProperty`
产生的正向调用和 RCSS 数字字符串解析。

高性能扩展应有明确选择的批量协议：Native 调度脏实例并提供 Native 持有的
数值输入；JS 一次计算一组结果；Native 消费共享命令缓冲。初始化、依赖声明
和释放必须保持原生实例的有效性及顺序。现有逐实例接口继续执行原有回调，
不能为了减少计数而跳过副作用、缓存可变 getter 或把事件自动合并。

## 所有权和全局维护

`rmlui-state.cc: RuntimeScope::~RuntimeScope` 在最外层入口结束时执行释放通知，
随后刷新 Tween、Filter、Decorator、FontEffect、Element/Context instancer、
data factory、event instancer 和 typed listener 的所有权。
Data model 已有 `data_ownership_dirty` 门控；其余多处仅判断 registry 是否为空。

`RefreshDataFactoryOwnership` 每次遍历所有实例、构建快照、判断根并建立
回调数组。稳定场景中的普通查询也支付 O(N) 的费用。
`RefreshElementOwnership` 遍历全部 Element wrapper；普通 `setAttribute`
直接触发它。`RefreshEventListenerOwnership` 还刷新 typed listener，
并遍历全部 listener 和 wrapper。`FindListener` 则扫描全局 registry 查重。
这些组合解释了 controller 初始化超时和逐元素属性操作的二次复杂度。

`SnapshotCallbackOwners` 为自定义字体效果扫描规格、属性、字典、样式表及
Native 元素树，并复制属性和 Variant。保活语义合理，频率与工作量不合理。
Filter、Tween、Decorator 的扫描也会遍历无关 wrapper 清理旧边。

改造须满足以下契约：

- Native 仍管理资源和实例生命周期；不得以长期强引用掩盖扫描成本。
- 原生根保活宿主闭包；脱离树的闭包通过 JS 可见 owner 边保活，闭包循环可被 GC 回收。
- 真实拓扑、转移、lease 和回调图变化触发维护；稳定查询不得触发全场景扫描。
- JS 新建 wrapper 时直接建立自身 owner 边；一次原生批量结构更新最多合并一次全量维护。
- 嵌套回调和 GC finalizer 中的变化不能丢失；建立新边前保留现有根。
- 监听器查重按元素与事件桶定位；普通已挂接元素的注册、移除只维护受影响的记录。

只给所有入口统一加「脏标记」仍不合格：逐元素入口仍会在每次结束时全量扫描。
门控应由 Native 的真实结构变更与特定 callback lease 变更驱动。

## 渲染、拷贝和冷资源

`CompileGeometry` 为每个 RmlUi handle 分配一个静态 SFML VBO，展开索引并上传。
`DrawGeometry` 每次重新应用 view、计算 transform、调用 SFML draw。
静态几何不重复上传，但没有把多个兼容几何合成 GPU draw。

`rmlui-mesh.cc: TakeMesh` 为保留旧共享视图复制 Native mesh，再将 facade 切换
到空 mesh。这是快照成本，不是零拷贝移动。可在唯一拥有、无外部视图时移动；
有保留视图时必须继续快照，或设计不可变共享几何输入。

渲染合批必须按原顺序合并连续兼容命令。target、texture、shader、scissor、
stencil/clip-mask、图层和捕获构成边界；改变边界、释放资源和返回宿主前提交。
录制后修改 mesh/transform/texture，不能改写已录制输出。
只把循环搬进 C++，或将 100,000 个 draw 叫作一个「批次」，不算 GPU 合批。

`RenderInterfaceSFML::LoadTexture` 同步打开、读取、解码、逐像素预乘并上传。
`LoadFontFace` 路径重载同步加载；内存重载复制 view 后长期保留。
RmlUi 的同步资源协议应由异步预加载的 Native 资源缓存满足，不能直接将同步
虚方法改成 Promise。加载、解码和预乘可离开主线程，GPU 上传仍须在所属线程执行。

Stream 和 FontEffect callback 的 scratch/字形快照让宿主保留数据后仍安全。
优化需增加显式借用或批量协议，不能把原生短命指针替换进现有可保留视图。
冷 atlas 可以提前准备字形或提供批量 glyph 处理；稳态不应重复调用宿主。

## 定量基线与验收

| 路径 | 双向调用 JS→Native / Native→JS | 完整 CPU 帧 p50 / p95 |
| --- | --- | --- |
| 100,000 行共享视图、全脏 | 6 / 0 | 361.563 / 394.562 ms |
| 100,000 行 batch patch、全脏 | 6 / 0 | 438.218 / 460.985 ms |
| 100,000 行逐值 set、全脏 | 100,006 / 0 | 389.503 / 413.601 ms |
| 100,000 行 JS getter、全脏 | 6 / 200,000 | 382.573 / 398.135 ms |
| 100,000 行 JS transform、全脏 | 7 / 200,000 | 405.683 / 418.621 ms |
| 100,000 个自定义 view、全脏 | 100,006 / 100,000 | 417.172 / 433.740 ms |

共享填充输入 p50 为 0.032 ms；逐值 set 为 23.609 ms；patch 为 44.785 ms。
共享路径全脏帧的主线程 malloc 中位数为 2,102,500 次、242,891,500 请求字节；
几何展开与 VBO 上传分别 12 MB、100,000 次上传和 100,000 次 draw。
静态帧上传为 0，draw 仍为 100,000 次。

100,000 个自定义 view 的无变更查询 p95 为 6.050 ms。
1,000 行逐元素属性操作累计 1,001,000 次所有权访问，帧 p95 为 146.088 ms。
100,000 个 controller 的整场景在 300 秒上限内未完成，未获得帧分位数；
独立初始化探针的最后进度为 20,000，不能推断精确超时位置或初始化总时长。

高性能验收依次检查：

1. 固定拓扑、固定 lease 的查询和数字更新：全局 ownership visit 为 0。
2. controller 挂接初始化：listener 查重和维护工作随元素数量线性增长。
3. 选择批量 view 协议后：双向调用按批次增长，不按行数增长；输出及副作用符合所选协议。
4. 连续兼容几何：draw 和上传按批次计；静态缓存稳定；截图、透明叠加、裁剪及图层保持一致。
5. 冷资源：文件读取、解码和预乘在工作线程；所属线程提交并保持资源代际有效。
6. 同样的 1k/10k/100k 负载重新记录完整帧 p50/p95、malloc、复制、上传和 draw，
   同时通过 GC、别名、快照、回调重入、异常、跨环境和资源释放测试。

上述条件必须以运行时证据判定。新增接口、编译通过或只测输入循环都不能替代验收。

## 执行方案

按 [性能架构实施计划](../../plans/2026-11-16-rmlui-performance-architecture.md)
在现有工作目录中执行。先消除稳定查询和监听器初始化的全局维护，随后落实共享
命令、批量扩展、几何合批和资源预加载，并逐项记录验证结果。
