# RmlUi 指南

<p><a class="library-brand" href="https://mikke89.github.io/RmlUiDoc/"><img src="assets/rmlui.png" width="246" height="84" alt="RmlUi"></a></p>

使用 `sfml.js-rmlui` 在 SFML 窗口内构建文档式界面：RML 描述元素树，RCSS 控制外观，JavaScript 管理应用状态和事件处理。当前源码面向 RmlUi 6.3 和 SFML 3.1。

阅读前需了解 JavaScript 和 [SFML 窗口](../sfml/window.zh-CN.md)。RmlUi 6.3 的语法类似 HTML/CSS，但没有嵌入浏览器。[原生数据模型](data-models.zh-CN.md)涵盖标量和回调绑定、递归记录及数组、自定义变量、共享数值存储和稀疏更新。下列指南介绍运行时、文档树、样式、渲染、输入、字体、脚本和资源所有权；[API 参考](/reference/rmlui/)说明对应的 TypeScript 接口约定。

## 什么是 RmlUi

[RmlUi](https://github.com/mikke89/RmlUi) 是一个采用类 HTML/CSS 文档语法的 C++ 界面库。它使用保留模式（Retained Mode）：加载 RML 后创建持久的元素树，用 RCSS 设置样式，再根据应用状态修改具体元素。RmlUi 负责布局和生成几何数据，本包通过 SFML 完成绘制。

它适合游戏菜单、HUD、背包窗口，以及希望把布局和视觉设计放在独立资源文件中的界面。RML、RCSS 和 Node.js 事件处理代码共同工作，运行时没有浏览器 DOM 或网页 JavaScript 环境。需要逐帧调用控件来组合工具界面时，可阅读 [ImGui 指南](../imgui/README.zh-CN.md)。

[官方文档](https://mikke89.github.io/RmlUiDoc/) · [官方仓库](https://github.com/mikke89/RmlUi)

## 文档目录

### 入门与文档

| 章节 | 内容 |
| --- | --- |
| [快速开始](getting-started.zh-CN.md) | 运行计数器，了解初始化、字体和帧顺序 |
| [RML 与 RCSS 入门](rml-rcss.zh-CN.md) | 编写标签、选择器和布局，连接点击事件，查阅官方语法 |
| [文档与事件](documents.zh-CN.md) | 加载 RML、修改元素、注册监听器与释放原生对象 |
| [字节流](streams.zh-CN.md) | 文件、内存与回调流的读取和生命周期 |
| [字符串与资源 URL](strings.zh-CN.md) | 字符串处理、资源路径与 URL |

### 元素、布局与控件

| 章节 | 内容 |
| --- | --- |
| [元素类名、属性与焦点](element-state.zh-CN.md) | 修改元素状态，管理焦点与类名 |
| [元素工具](element-utilities.zh-CN.md) | 定位、文本测量、投影边界与裁剪几何 |
| [元素布局、滚动与投影](layout.zh-CN.md) | 布局尺寸、滚动位置与坐标投影 |
| [盒值与渲染盒](boxes.zh-CN.md) | 盒模型数据和渲染盒 |
| [表单控件](controls.zh-CN.md) | 输入框、选择控件与表单操作 |
| [文本、进度条与标签页](text-panels.zh-CN.md) | 文本元素、进度显示与标签页 |
| [SVG 与 Lottie](vector-elements.zh-CN.md) | 原生矢量元素、装饰器、动画帧和源文件 |
| [原生类型与默认动作](rtti-default-actions.zh-CN.md) | 元素类型识别和默认事件动作 |

### 样式、动画与渲染

| 章节 | 内容 |
| --- | --- |
| [数值与单位](numeric-values.zh-CN.md) | 类型化数值、单位与转换 |
| [类型化属性](properties.zh-CN.md) | 属性定义、解析与类型化值 |
| [动画与缓动](animation.zh-CN.md) | 元素动画、关键帧与缓动 |
| [原生几何与卷积](geometry-utilities.zh-CN.md) | 批量生成网格，在共享 alpha 缓冲区上运行滤镜 |
| [渲染资源](resources.zh-CN.md) | 纹理、着色器、滤镜与工厂资源 |
| [渲染状态](render-state.zh-CN.md) | 裁剪、图层、回调纹理与状态恢复 |
| [渲染与 Retina](rendering.zh-CN.md) | 组合 SFML 与 RmlUi、适配高密度显示及了解效果支持 |

### 运行时与扩展

| 章节 | 内容 |
| --- | --- |
| [插件](plugins.zh-CN.md) | 插件注册和运行时回调 |
| [文档脚本](scripts.zh-CN.md) | Node.js 与 Lua 文档脚本 |
| [原生数据模型](data-models.zh-CN.md) | 绑定、表达式、共享数组与稀疏更新 |
| [字体](fonts.zh-CN.md) | 字体引擎、整形与字形图集 |
| [原生 Debugger](debugger.zh-CN.md) | 在独立宿主中检查元素、日志与数据模型反射 |
| [共享存储与批处理](performance.zh-CN.md) | 提交数值命令、批量自定义计算及预加载资源 |
| [源码目录](source-layout.zh-CN.md) | Native 绑定、TypeScript 接口与工具的归属 |
| [API 指南](api.zh-CN.md) | 查找类型、默认值、返回值和生命周期契约 |

指南和从源码生成的 API 参考均维护英文、简体中文、日文、韩文版本。

## 运行示例

在 monorepo 根目录执行：

```sh
node tools/bootstrap.cjs
node packages/sfml.js-rmlui/examples/demo.cjs
node packages/sfml.js-rmlui/examples/official.cjs variables
```

[示例目录](../../packages/sfml.js-rmlui/examples/README.zh-CN.md)提供截图、操作说明和源码链接。计数器的 Increment 按钮可以点击计数；variables 页的任务按钮仅展示悬停样式。

## 所有权边界

进程级运行时绑定一个 `RenderWindow`，归初始化它的 Node.js 环境和线程所有，管理上下文、文档、字体和渲染资源。元素包装器共享原生有效性。JS 引用会保活持有所有权的脱离树；已挂载节点的生命周期由原生父节点决定。销毁时自动释放监听器，访问失效包装器会抛出异常。关闭 SFML 窗口前关闭 RmlUi。文档延迟销毁和 Worker 限制见[原生对象生命周期](documents.zh-CN.md#原生对象生命周期)。
