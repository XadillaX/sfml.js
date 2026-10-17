# API 导航

[English](api.md) · **简体中文** · [日本語](api.ja.md) · [한국어](api.ko.md)

> sfml.js 以 SFML 3.1.0 为基础。手写指南解释使用方式、返回值和 Node.js 适配；完整签名与类型约束由 [TypeDoc](https://sfml.js.org/zh/reference/) 从源码生成。

[文档首页](README.zh-CN.md) · [快速开始](getting-started.zh-CN.md) · [核心概念](concepts.zh-CN.md)

所有公开接口均从 `sfml.js` 导入，导出清单见 [src/index.ts](../src/index.ts)。业务代码无需访问 `dist/internal` 或原生模块句柄。

## 按任务选择

| 任务 | 文档 | 主要接口 |
| --- | --- | --- |
| 计算坐标、角度和帧时间 | [System](system.zh-CN.md) | Vector2／3、Angle、Time、Clock、具名运算符 |
| 接入自定义文件来源 | [输入流](system.zh-CN.md#input-streams) | InputStream、MemoryInputStream、FileInputStream |
| 打开窗口、接收输入 | [Window](window.zh-CN.md) | RenderWindow、Window、Event、Keyboard、Mouse |
| 显示图片与动画 | [Graphics](graphics.zh-CN.md) | Image、Texture、Sprite |
| 绘制形状与文字 | [Graphics](graphics.zh-CN.md) | Shape、Font、Glyph、Text |
| 相机、离屏合成与批量几何 | [Graphics](graphics.zh-CN.md) | View、RenderTexture、VertexArray、VertexBuffer |
| 自定义绘制与着色器 | [Graphics](graphics.zh-CN.md) | Drawable、RenderStates、Shader、Glsl |
| 播放、录音及音频处理 | [Audio](audio.zh-CN.md) | SoundBuffer、Sound、Music、SoundStream、SoundRecorder |
| 联网与传输文件 | [Network](network.zh-CN.md) | Packet、TcpSocket、UdpSocket、Http、Ftp、Sftp |

## System

`Vector2`／`Vector3` 支持多种标量类型；`Vector2i/u/f` 和 `Vector3i/u/f` 是常用特化。`degrees()`／`radians()` 创建 Angle，时间工厂创建 Time。

JavaScript 没有 C++ 运算符重载，对应操作使用 `add()`、`multiply()`、`equal()` 及 `*Assign()`。`Clock`、异步 `sleep()`、`TimeoutWithPredicate`、输入流、`Unicode` 和错误日志接口也属于本模块。

详见 [System](system.zh-CN.md)。

## Window

`Window` 提供系统窗口及 OpenGL 上下文；二维绘制一般使用同时具有 Window 与 RenderTarget 能力的 `RenderWindow`。

事件可通过 `pollEvent()`、`handleEvents()` 或同步 `waitEvent()` 获取。键盘、鼠标、摇杆和传感器还提供实时查询。`Clipboard`、`Cursor`、`Context` 与 `Vulkan` 覆盖系统集成。

详见 [Window](window.zh-CN.md)。

## Graphics

Image 保存 CPU 侧像素，Texture 保存 GPU 纹理，Sprite 引用纹理进行绘制。Shape 提供圆、矩形、凸多边形和自定义凸形状；Font 与 Text 提供字体加载、排版及可编辑顶点。

RenderTarget 统一窗口和离屏目标的绘制接口。View 控制相机与视口，RenderStates 控制变换、混合、模板、纹理和 Shader。顶点数组及 GPU 顶点缓冲用于直接组织几何。

详见 [Graphics](graphics.zh-CN.md) 和 [绘制快照](concepts.zh-CN.md#draw-snapshots)。

## Audio

短音效使用 SoundBuffer + Sound，长音频使用 Music。SoundSource 提供音量、声像和空间音频属性；SoundStream、SoundRecorder、EffectProcessor 使用 Worker 回调处理自定义数据。

详见 [Audio](audio.zh-CN.md)，特别注意样本数、声道排列及缓冲有效期。

## Network

Network 使用 Node.js 传输实现 SFML 风格 API，生产代码不调用 SFML C++ Network。Packet 保留 SFML 编码约定；TCP、UDP、DNS、TLS、HTTP、FTP 和 SFTP 的 I/O 使用 Promise。

详见 [Network](network.zh-CN.md)，包括状态返回、部分发送、协议限制与关闭方式。

## 兼容边界

| 项目 | 当前行为 |
| --- | --- |
| C++ 指针、引用输出参数 | 用对象、视图或返回对象表达 |
| C++ 模板及运算符 | 用明确的标量标签、类和具名函数表达 |
| 文件加载 | 使用 Promise，具体失败状态按接口保留 |
| 析构 | Native 所有权配合 JS 引用；有关闭接口的资源应显式关闭 |
| `drawAsync()`／`displayAsync()` | 未提供，旧示例明确报告不支持 |
| Android SuspendAwareClock | 有条件编译接口；当前下载流程面向桌面 |
| Vulkan | 已导出查询接口；可用性取决于 SFML 平台后端，macOS 后端不可用 |

平台构建与测试范围见 [开发指南](development.zh-CN.md#testing)。

<a id="sfml-cpp-reference"></a>

## SFML C++ 参考

[SFML 3.1.0 官方文档](https://www.sfml-dev.org/documentation/3.1.0/) 解释 C++ 类和上游概念，TypeDoc 则是 sfml.js 的 JavaScript／TypeScript 签名参考。两者配合阅读：先用上游文档理解功能，再按本项目指南调用。

各模块的上游链接与适配边界：[System](system.zh-CN.md#sfml-cpp-reference)、[Window](window.zh-CN.md#sfml-cpp-reference)、[Graphics](graphics.zh-CN.md#sfml-cpp-reference)、[Audio](audio.zh-CN.md#sfml-cpp-reference)、[Network](network.zh-CN.md#sfml-cpp-reference)。
