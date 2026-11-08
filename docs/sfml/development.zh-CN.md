# 开发指南

[English](development.md) · **简体中文** · [日本語](development.ja.md) · [한국어](development.ko.md)

> 本文面向修改源码、维护文档及运行仓库测试的贡献者。作为依赖使用时，从 [快速开始](getting-started.zh-CN.md) 阅读。

[文档首页](README.zh-CN.md) · [API 导航](api.zh-CN.md) · [示例目录](../../packages/sfml.js/examples/README.zh-CN.md)

<a id="get-the-source"></a>

## 获取源码

准备 Node.js、Python 与 C++20 工具链，平台安装命令见 [安装环境](getting-started.zh-CN.md#requirements)，然后执行：

```sh
git clone https://github.com/XadillaX/node-sfml.git
cd node-sfml
node tools/bootstrap.cjs
```

`node tools/bootstrap.cjs` 使用 Rush 安装依赖，按依赖顺序构建 interop、两个绑定包和站点。SFML 与 ImGui 原生库由所属包下载。此仓库推荐 Node.js 20 或 22；站点要求 Node.js 20 及以上。

## 构建

以下命令均在仓库根目录执行：

| 命令 | 用途 |
| --- | --- |
| `npm --prefix packages/sfml.js run build` | 编译 Native 与 TypeScript |
| `npm --prefix packages/sfml.js run build:native` | 编译 Native 并更新 clangd 配置 |
| `npm --prefix packages/sfml.js run build:ts` | 生成常量并编译 TypeScript |
| `npm --prefix site run build` | 构建四语官网与生成的 API 参考 |
| `npm --prefix site run build:reference` | 单独生成 TypeDoc API 文档 |
| `npm --prefix site run dev` | 启动官网开发预览 |
| `npm --prefix site run preview` | 在本地预览官网生产构建 |
| `npm --prefix packages/sfml.js run lint` | 检查源码、工具、测试和示例 |
| `npm --prefix packages/sfml.js run test:types` | 验证 TypeScript 接口 |
| `npm --prefix packages/sfml.js run test:runtime` | 串行运行运行时测试，需要先构建 |
| `npm --prefix packages/sfml.js test` | 依次执行 lint、构建、类型检查和运行时测试 |
| `npm --prefix packages/sfml.js pack --dry-run` | 检查 npm 包文件清单 |

只修改 TypeScript 时可执行 `npm --prefix packages/sfml.js run build:ts`；修改 Native 后执行 `npm --prefix packages/sfml.js run build`。运行时测试不会自动重建，运行前确保构建与源码一致。

<a id="testing"></a>

## 测试与验证

```sh
npm --prefix packages/sfml.js test
```

`npm --prefix packages/sfml.js test` 执行 lint、Native 与 TypeScript 构建、类型检查和运行时测试。

运行时测试按文件串行运行，覆盖公开接口、原生 SFML 对照、实际渲染像素、异步 I/O、快照及生命周期。类型测试位于 `test/*.types.ts`，运行时测试为 `test/*.test.cjs`，原生对照在 `test/native/`。

图形测试需要显示服务和 OpenGL 上下文。Linux 无显示器环境按 [Linux CI](../../.github/workflows/node.js.yml) 安装 Xvfb 后运行：

```sh
LIBGL_ALWAYS_SOFTWARE=1 \
  xvfb-run -a -s "-screen 0 1280x1024x24 -noreset" npm --prefix packages/sfml.js run test:runtime
```

CI 配置覆盖 Linux、macOS、Windows 的 Node.js 20／22，[Windows CI](../../.github/workflows/node.js-windows.yml) 使用 Mesa 软件 OpenGL。

CI 不能代替扬声器、麦克风、摇杆、传感器、全屏切换等设备验收。SFML 的 macOS 后端不支持 Vulkan，SuspendAwareClock.now 仅支持 Android；报告结果时说明实际运行平台与跳过项。

## 维护文档

各包 README 负责介绍自己的包。根目录 `docs/sfml/`、`docs/imgui/` 和 `docs/interop/` 存放指南，可运行示例与 API 源码注释保留在所属包。根 `site/` 是私有 Rush 项目 `sfml-js-site`，负责 VitePress、TypeDoc、多语言和站点测试。

- 示例导入公开包 `sfml.js`；仅仓库演示脚本使用仓库相对路径。
- 区分完整示例与依赖上下文的片段，说明 async 函数、素材和设备要求。
- 检查加载布尔值与网络状态，示例结束时关闭所持资源。
- 修改公开行为时，同步维护 JSDoc、对应指南及受影响示例。

安装官网依赖并构建：

```sh
node common/scripts/install-run-rush.js build --to sfml-js-site
```

bootstrap 完成后，`npm --prefix site run dev` 准备 Markdown 并启动站点。修改指南正文后重启该命令；主题修改支持热更新。`npm --prefix site run build` 将完整站点生成到 `site/build/site/`。核心 URL 保留 `/guide`、`/examples` 和 `/reference`，ImGui 使用 `/imgui/` 与 `/reference/imgui/`，原生扩展指南使用 `/interop/`，均提供中、日、韩语言路径。

`npm --prefix site test` 检查路由、本地化和主题行为；站点构建还检查全部链接、锚点、语言覆盖和资源。`npm --prefix site run build:reference` 将两个包的 API 参考生成到 `site/build/site/reference/` 及对应语言目录。TypeDoc 读取包内源码注释并检查译文完整性，ImGui 的 API 译文直接维护在声明旁。

[Publish Docs 工作流](../../.github/workflows/publish-docs.yml) 在 `main` 更新时运行，也支持手动触发。生成结果提交到 `gh-pages` 分支的 `docs/`，保留该分支根目录的文件，并沿用现有 `CNAME`（`sfml.js.org`）。生成内容没有变化时跳过提交。

旧 TypeDoc 类、接口等链接会跳转到对应的英文参考页面，并保留片段锚点。API 语言切换保留当前页面和成员锚点。

JSDoc 先写英文正文，再依次写 `@zh`、`@ja` 和 `@ko` 译文。每组译文紧跟对应的正文或块标签；参数译文使用 `@zh name - 说明`，日文和韩文同理。标识符、示例代码和链接保持完整。缺少正文译文时，文档构建会直接失败。

```ts
/**
 * Read the elapsed time.
 * @zh 读取经过的时间。
 * @ja 経過時間を読み取ります。
 * @ko 경과 시간을 읽습니다.
 * @param unit - Time unit.
 * @zh unit - 时间单位。
 * @ja unit - 時間の単位。
 * @ko unit - 시간 단위.
 */
```

自动生成的常量注释维护在 `tools/constant-docs.json` 及 `tools/constant-docs.cjs` 的模板中。修改后运行 `npm --prefix packages/sfml.js run generate:window` 和 `npm --prefix packages/sfml.js run generate:network`，不要直接编辑生成文件中的注释。

## 运行示例

以下命令在仓库根目录执行：

```sh
npm --prefix packages/sfml.js run demo:types -- --frames=120
npm --prefix packages/sfml.js run demo:window -- --frames=120
npm --prefix packages/sfml.js run demo:audio
npm --prefix packages/sfml.js run demo:network
```

示例分为 [总览](../../packages/sfml.js/examples/README.zh-CN.md)、[功能示例](../../packages/sfml.js/examples/features/README.zh-CN.md)、[官方示例](../../packages/sfml.js/examples/official/README.zh-CN.md) 和 [游戏与应用](../../packages/sfml.js/examples/projects/README.zh-CN.md)。命令和 [截图支持](../../packages/sfml.js/examples/features/README.zh-CN.md#screenshots) 随入口说明。构建后直接运行脚本，仅对支持的入口传入 `--frames`。

## 源码与生成文件

| 目录 | 内容 |
| --- | --- |
| `packages/sfml.js/` | 核心源码、原生绑定、测试和示例 |
| `packages/sfml.js-imgui/` | ImGui 绑定源码、多语言 API 注释和演示 |
| `packages/sfml.js-interop/` | 共享头文件和 SFML SDK 下载器 |
| `docs/` | 按包分区的共享指南 |
| `site/` | VitePress、TypeDoc、主题和站点测试 |
| `common/` | Rush 配置和统一锁文件 |

`build/`、`dist/`、`node_modules/` 和下载的 SFML 均为生成内容。窗口与网络常量由当前 SFML 头文件生成，不直接编辑 `src/*/gen/constants.ts`。

原生构建生成各包的编译数据库，并合并到根目录 `compile_commands.json`，由根 `.clangd` 使用。`node tools/configure-lsp.cjs` 只合并已有数据库，不重新编译原生代码。

## 实现约定

值类型通过 TypedArray 计算与共享存储，Native 资源及其视图负责内存保活。图形资源在所属线程销毁；绘制记录必须保持快照语义，不能因后续属性修改改变已录制结果。

相关入口包括 `src/internal/lazy-value.ts`、`src/internal/graphics-state.ts`、`packages/sfml.js-interop/include/shared-handle.h`、`native/deferred-delete.h`、`native/batch-drawable.h`。添加公开字段和方法时补充说明功能、参数及上游对应关系的 JSDoc。

下载器、安装钩子和平台构建相互关联，修改时需要验证对应平台。下载地址及架构映射在 `packages/sfml.js-interop/tools/lib_downloader_urls.cjs`，缓存位于 `packages/sfml.js-interop/third_party/sfml/`。

## 提交变更

PR 说明具体行为、相关验证及未验证的平台路径。Native 变更运行受影响的原生对照测试；纯文档变更检查链接、代码示例与 TypeDoc 构建。性能数字应附机器、Node.js／SFML 版本、场景和测量方法。
