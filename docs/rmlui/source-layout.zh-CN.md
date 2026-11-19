# RmlUi 源码目录

[English](source-layout.md) · **简体中文** · [日本語](source-layout.ja.md) · [한국어](source-layout.ko.md)

`packages/sfml.js-rmlui` 按职责组织 Native 绑定、TypeScript 接口和测试。新增实现应放入对应模块，相关头文件与实现文件放在一起。

| 目录 | 职责 |
| --- | --- |
| `runtime/` | 初始化、Context、运行时状态、能力查询、回调生命周期、Plugin、Debugger |
| `dom/documents/` | 文档、Factory、属性集合、XML 解析 |
| `dom/elements/` | Element、布局、滚动、元素实例化、SVG 和 Lottie |
| `dom/controls/` | 表单、文本控件、选项、面板 |
| `data/` | 数据模型、类型注册、地址、成员、批处理、诊断 |
| `events/` | 事件、监听器、分发和实例化 |
| `style/properties/` | Property、解析器、规范、样式表 |
| `style/effects/` | 装饰器、过滤器、效果值及其回调 |
| `style/values/` | 计算样式、样式结构、变换及映射视图 |
| `animation/` | 动画、过渡、补间及值回调 |
| `rendering/` | 渲染管理、几何、纹理、图层、资源和 SFML 渲染适配 |
| `fonts/` | 字体加载、FreeType／HarfBuzz／位图引擎、测量、字形及字体效果 |
| `scripting/` | 脚本接口、宿主和脚本对象 |
| `scripting/lua/` | Lua 宿主、模型、值、函数和实例化 |
| `platform/` | SFML 系统适配、输入、文本输入、窗口密度 |
| `io/` | 文件接口和流 |
| `values/` | Variant、数值、字符串、URL 和共享类型 |

这些目录分别位于 `native/` 和 `src/` 下。只在某一层需要的实现保留在该层。`src/internal/` 保存 Native 加载器、包装器分配和共享内存转换等跨模块内部协议。

`src/index.ts` 是 npm 公共入口，`native/addon.cc` 是 Native 模块注册入口。包级构建配置保留在根目录的 `binding.gyp`、`package.json` 和 `tsconfig.json`。

生成文件集中在 `src/generated/` 与 `native/generated/`。修改生成逻辑应编辑 `tools/codegen/` 中的生成器，再重新生成文件。

| 工具目录 | 职责 |
| --- | --- |
| `tools/build/` | 包内原生构建、Lua C++ 编译及编译数据库修正；仅在所属 Rush 工作区合并仓库 LSP 数据库 |
| `tools/codegen/` | 从上游头文件生成输入、事件、属性 ID 和样式绑定 |
| `tools/dependencies/` | 依赖版本、校验、下载和构建源清单 |
| `tools/dependencies/patches/` | RmlUi、Lua、Debugger、数值、字符串和 rlottie 补丁 |
| `tools/performance/` | 性能测量及 Native 调用计数 |
| `tools/testing/` | 递归收集并执行运行时测试、保留剪贴板、验证 npm 源码包文件清单和构建依赖 |

`test/` 按模块归档运行时和类型用例，`test/native/` 按模块归档 C++ 对照程序及其构建脚本。构建脚本复用当前包的对象文件，输出目录由调用者指定为已有临时目录。

`packages/sfmljs-rmlui-vscode/tools/testing/` 使用现有 VS Code 执行扩展集成验证；
`tools/packaging/` 验证 VSIX 的内置客户端、语言服务器、语言资源和四语说明。
仓库级 Windows 工具链初始化位于 `tools/ci/`，供现有 Node.js CI 和独立 RmlUi CI 共用。

`third_party/` 保留上游目录结构。`build/` 和 `dist/` 使用现有构建目录；源码迁移后，只移除已有新路径产物对应的旧产物。

目录迁移不代表 RmlUi 6.3 全量验收完成。`audit/6.3/` 的既有证据保留采集时的源码路径和哈希；查找这些历史路径时，使用[目录迁移映射](audit/6.3/source-layout-map.json)。
