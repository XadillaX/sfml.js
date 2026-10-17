# sfml.js 文档

[English](README.md) · **简体中文** · [日本語](README.ja.md) · [한국어](README.ko.md)

> 本文档对应当前仓库的 SFML 3.1.0 绑定。第一次使用从「快速开始」阅读；查询具体方法签名时使用 [TypeDoc](https://sfml.js.org/zh/reference/)。

## 开始使用

| 文档 | 解决的问题 |
| --- | --- |
| [快速开始](getting-started.zh-CN.md) | 安装依赖、选择导入方式、打开第一个窗口 |
| [核心概念](concepts.zh-CN.md) | 值与资源如何复制、加载何时完成、draw 何时生效 |
| [API 导航](api.zh-CN.md) | 五个模块分别提供什么能力 |
| [示例目录](../examples/README.zh-CN.md) | 在仓库中运行完整演示 |

## 按模块阅读

| 模块 | 内容 |
| --- | --- |
| [System](system.zh-CN.md) | 向量、角度、时间、输入流、Unicode 与错误处理 |
| [Window](window.zh-CN.md) | 窗口生命周期、事件、实时输入、OpenGL 与 Vulkan |
| [Graphics](graphics.zh-CN.md) | 图片、纹理、精灵、形状、文字、视图与绘制 |
| [Audio](audio.zh-CN.md) | 播放、流式供数、音效、录音与编解码 |
| [Network](network.zh-CN.md) | Packet、TCP／UDP、DNS、TLS、HTTP、FTP 与 SFTP |

## 参与开发

[开发指南](development.zh-CN.md) 说明构建、测试、源码组织与现有文档发布流程。

方法签名和导出列表以 [src/index.ts](../src/index.ts) 及其源码注释为准。[SFML 3.1.0 官方 C++ 文档](https://www.sfml-dev.org/documentation/3.1.0/) 可用于理解上游概念、类和用法；各模块指南提供对应类的直达链接。JavaScript 的参数、Promise、事件循环、共享内存和网络适配以本项目说明及 TypeDoc 为准。
