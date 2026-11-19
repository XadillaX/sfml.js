# RmlUi 快速开始

运行完整的[计数器源码](../../packages/sfml.js-rmlui/examples/demo.cjs)及其 [RML](../../packages/sfml.js-rmlui/examples/assets/tutorial.rml)／[RCSS](../../packages/sfml.js-rmlui/examples/assets/tutorial.rcss) 资源。窗口展示计数器、Increment 按钮、模糊和圆角裁剪。

## 准备工作区

参照[平台要求](../sfml/getting-started.zh-CN.md#requirements)，准备 C++20 原生工具链、Python、显示环境和 OpenGL。macOS 还需 Xcode Command Line Tools 和 CMake，以构建带补丁的 SFML Window 库。

```sh
# From the monorepo root.
node tools/bootstrap.cjs
cd packages/sfml.js-rmlui
npm run demo
```

Bootstrap 按依赖顺序安装并构建工作区，初始化时执行一次即可。修改本包后运行 `npm run build`；仅修改 TypeScript 时运行 `npm run build:ts`。这些命令使用本地源码，不依赖 npm 是否已发布对应版本。

源码包内置原生构建脚本。显式 npm `install` 钩子先准备依赖及原生声明，再配置并构建
绑定和两个原版 Invaders 模块，复用现有 `build/`。仓库 LSP 合并只在所属 Rush 工作区
执行。安装使用随包交付的 JavaScript／类型，不要求 TypeScript 编译器。
`npm run test:package` 检查实际 npm 文件清单及构建脚本的依赖。

[VS Code 扩展](../../packages/sfmljs-rmlui-vscode/README.zh-CN.md)内置语言服务器，
支持 RML／RCSS 补全、诊断、悬浮说明和颜色预览。

## 初始化与资源

计数器以 `settings.stencilBits: 8` 创建 `RenderWindow`，检查 `initialise(window)`，加载内置 LatoLatin 常规／粗体字体，再读取 `window.getSize()` 创建上下文。字体加载是同步操作，必须在加载文档前完成。RCSS 的 `font-family` 必须匹配字体内部名称。

```js
if (!rmlui.initialise(window)) {
  throw new Error('RmlUi initialisation failed');
}

const size = window.getSize();
const context = rmlui.createContext('main', size.x, size.y);
```

此片段位于计数器创建窗口之后。必须在初始化**之后**读取尺寸，因为 macOS 可能启用了 Retina 表面。`loadDocument` 返回的文档初始隐藏，需调用 `document.show()`。

## 系统接口与应用时间

`getSystemInterface()` 返回当前所选原生接口，尚未选择或关闭后返回 `null`。
自定义系统行为时，在 `initialise` 前创建 `SystemInterface(window, callbacks)`，
再调用 `setSystemInterface(system)`。省略的回调使用 SFML／上游实现。
八个可选回调覆盖翻译、资源路径连接、日志、光标、剪贴板及键盘操作。

```js
const system = new rmlui.SystemInterface(window, {
  translateString(input) {
    return { value: input, translations: 0 };
  },
});

rmlui.setSystemInterface(system);
rmlui.initialise(window);

// Before each update, optionally drive native animations with application time.
system.clock[0] = elapsedSeconds;
context.update();
// Restore the native SFML clock.
system.clock[0] = NaN;
```

`clock` 是原生持有的单元素 `Float64Array`，原生读取时间无需 JS 回调或 Addon
调用。输入秒数必须有限且非负；初始值 `NaN` 选择 SFML 时钟。回调同步执行，
`this` 保持为回调对象，不能重入 RmlUi API。初始化后不能替换接口。
关闭时释放原生接口及回调，使初始化前创建的对象失效；已取得的时钟缓冲仍可读取。

## 应用日志

`Log.message(type, format, ...values)` 和
`Log.parseError(filename, line, format, ...values)` 在一次 Addon 调用内完成
格式化，并通过原生 `Rml::Log` 派发。所选 `SystemInterface.logMessage`
收到最终级别与文本，初始化前也可使用。

```js
rmlui.Log.message(rmlui.LogType.Info, '%s: %d', 'loaded documents', 3);
rmlui.Log.parseError('panel.rml', 12, 'Unexpected %s', 'tag');
```

格式化遵循 [字符串指南](strings.zh-CN.md) 的受检查标量规则。
原生日志缓冲最多保留 1,021 个 UTF-8 字节，并在 NUL 处终止。
`parseError` 先截断消息，再截断带文件名和行号的结果；负行号省略行号前缀。
两个方法返回 `void`；原生 `Rml::Log` 忽略日志回调的布尔结果。
回调异常会传播，回调重入及其他运行时环境的调用会被拒绝。

## 文件接口

`FileInterface(root)` 使用根目录优先的文件系统策略；传入 `FileCallbacks`
可提供自定义资源字节。初始化前通过 `setFileInterface` 选择，
`getFileInterface()` 返回所选包装器。未选择时安装原生文件系统默认接口。
显式 `fileRoot` 须与已经选择的文件系统接口一致。

```js
const resources = new Map([
  ['virtual.rml', Buffer.from('<rml><body><p>Ready</p></body></rml>')],
]);
const files = new rmlui.FileInterface({
  open(path) {
    return resources.get(path) ?? null;
  },
});

rmlui.setFileInterface(files);
rmlui.initialise(window);
const document = context.loadDocument('virtual.rml');
```

open 返回的数组复制为原生持有的快照，read、seek、tell、length 留在 Native。
也可返回已有 `StreamMemory` 或自定义 `Stream`；不能返回使用此接口的
`StreamFile`。可选回调覆盖全部七个上游虚方法，保留 `this`，
必须同步返回，不能重入 RmlUi API。

`files.open(path)` 返回校验过的 `FileHandle` 或 null；须用同一接口执行
`read(output, size, file)`、seek、tell、length 和 close。`loadFile` 返回字节
快照或 null，空文件返回空数组。shutdown 关闭未关闭的文件，
并使全部接口及 token 失效。
自定义预加载在所属线程获取一次字节快照，图片解码和预乘在线程池执行；
文件系统预加载的读取与解码都在线程池执行。

## 选择渲染接口

`getRenderInterface()` 返回实际选定的 Native 接口；未选定或 shutdown 后返回
`null`。可在初始化前后创建 SFML 接口；在 `initialise` 前调用
`setRenderInterface(renderer)` 选定默认接口。传入 `null` 恢复自动选择。

```js
const renderer = rmlui.createRenderInterface(renderWindow);

rmlui.setRenderInterface(renderer);
rmlui.initialise(systemWindow);
const context = rmlui.createContext('ui', 800, 600);
```

初始化保留已选定接口。上下文使用该接口的渲染窗口；初始化窗口仍提供系统计时、
输入和 DPI。`createContext` 的显式接口参数可选择另一套资源缓存。
选定接口及被 Native 管理器、预加载使用的接口持有原生窗口至 shutdown；
未使用接口可回收。所有使用中的窗口必须保持打开至 shutdown。
绘制和几何处理留在 Native，保留既有合批及绘制快照语义。

## 每一帧

计数器转发所有事件，收到原生关闭事件后退出循环，再依次更新与绘制：

```js
context.update();
window.clear(sfml.Color.Black);
// Set your scene view with window.setView(sceneView), then draw the scene.
window.flush();
context.render();
window.display();
```

循环停止、RmlUi 关闭前，保持窗口打开。`processEvent` 已处理尺寸变化事件；应用需要自定义上下文尺寸时可显式调用 `setDimensions`。

## 点击与清理

计数器使用命名函数 `increment` 注册和移除监听器。点击 Increment 会更新 JavaScript 状态和 `counter.innerRML`。退出前依次移除监听器、卸载文档、移除上下文、调用 `shutdown()`，最后关闭窗口。

| 现象 | 检查项 |
| --- | --- |
| 缺少原生模块或字体 | 完成 bootstrap，使用本地示例资源。 |
| 没有文字 | 检查 `loadFontFace` 返回值和 RCSS 字体族。 |
| 文档不可见 | 按顺序调用 `show`、`update` 和 `render`。 |
| 点击无反应 | 转发事件并注册处理函数；variables 任务按钮未注册。 |
| 文字过小或模糊 | 使用初始化后的尺寸和 RCSS `dp`，见 [Retina](rendering.zh-CN.md)。 |
| 退出崩溃 | 在原生所有者和窗口销毁前清理监听器，停止使用包装器。 |

继续阅读[文档与事件](documents.zh-CN.md)。
