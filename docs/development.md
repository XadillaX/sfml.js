# 开发指南

本文面向修改 sfml.js 源码或运行仓库示例的贡献者。作为依赖使用时，请从 [README](../README.md) 中的安装与 API 导航开始。

## 准备环境

需要 Node.js `^18.19.0 || >=20.5.0`、Python 和 C++20 编译工具链。通过 npm 安装原生绑定也需要这些环境。

| 平台 | 架构 | 编译环境 |
| --- | --- | --- |
| macOS 13+ | x64、arm64 | Xcode Command Line Tools |
| Linux | x64 | GCC／Clang、make，以及 X11、OpenGL 和音频依赖 |
| Windows | x64、ia32 | Visual Studio 2022 C++ Build Tools |

克隆仓库后，在仓库根目录执行：

```sh
npm ci
```

`install` 下载对应平台的 SFML 官方预编译包并编译 Native 模块，`prepare` 编译 TypeScript，生成 `dist/`。作为 npm 依赖安装时使用包内的 JavaScript 和类型声明，只需编译 Native 模块。

SFML 下载保存在 `third_party/sfml/`，版本与架构匹配时复用。需要镜像时，设置 `SFML_DOWNLOAD_MIRROR`；其值作为官方下载 URL 的前缀。

## 构建与验证

| 命令 | 用途 |
| --- | --- |
| `npm run build` | 编译 Native 与 TypeScript |
| `npm run build:native` | 编译 Native 并更新 clangd 配置 |
| `npm run build:ts` | 生成常量并编译 TypeScript |
| `npm run build:docs` | 从 TypeScript 入口生成 TypeDoc API 文档 |
| `npm run lint` | 检查源码、工具、测试和示例 |
| `npm run test:types` | 验证 TypeScript 接口 |
| `npm run test:runtime` | 串行运行运行时测试，需要先构建 |
| `npm test` | 依次执行 lint、构建、类型检查和运行时测试 |
| `npm run test:ported` | 验证迁移示例，分别报告通过和不支持 |
| `npm pack --dry-run` | 检查 npm 包文件清单 |

图形测试需要可用的显示服务和 OpenGL 上下文，运行时测试按文件串行执行。Linux 无显示器环境使用 Xvfb 和软件 OpenGL，依赖及命令见 [Linux CI](../.github/workflows/node.js.yml)；[Windows CI](../.github/workflows/node.js-windows.yml) 使用 Mesa 软件 OpenGL。

平台 CI 配置不代表所有硬件功能已经验证。SFML 的 macOS 构建不提供 Vulkan 后端，`SuspendAwareClock.now()` 仅支持 Android；能力查询和测试结果会反映平台差异。

## API 文档发布

`npm run build:docs` 使用 `typedoc.json`，从 `src/index.ts` 生成 Material 主题的 API 文档，输出到 `build/docs/`。生成文档不需要编译或加载 Native 模块；文档专用环境可以先执行 `npm ci --ignore-scripts`。

[Publish Docs 工作流](../.github/workflows/publish-docs.yml) 在 `main` 更新时运行，也支持手动触发。生成结果提交到 `gh-pages` 分支的 `docs/`，保留该分支根目录的文件，并沿用现有 `CNAME`（`sfml.js.org`）。生成内容没有变化时跳过提交。

## 运行示例

以下命令在仓库根目录执行：

```sh
npm run demo:types -- --frames=120
npm run demo:window -- --frames=120
npm run demo:audio
npm run demo:network
```

示例位于 [examples/](../examples/)。已构建时可直接运行 `node examples/<名称>.cjs`，无需重复构建。图形示例通过 Esc 或关闭窗口退出；支持 `--frames` 的入口可限制帧数，适合自动检查。

旧版 `drawAsync`／`displayAsync` 两个示例明确报告不支持，详情见 [迁移说明](../examples/ported/README.md)。

## 源码与生成文件

| 目录 | 内容 |
| --- | --- |
| `src/` | TypeScript 实现 |
| `native/` | C++ 绑定 |
| `test/` | 运行时、类型和原生对照测试 |
| `tools/` | 常量生成器、基准与测试工具 |
| `docs/` | API 与开发文档 |

`build/`、`dist/`、`node_modules/` 和下载的 SFML 均为生成内容。窗口与网络常量由当前 SFML 头文件生成，不直接编辑 `src/*/gen/constants.ts`。

Native 构建后自动生成 `build/compile_commands.json`，供 `.clangd` 使用。只更新语言服务配置时执行 `npm run configure:lsp`；编辑器仍显示旧诊断时，重启 clangd。
