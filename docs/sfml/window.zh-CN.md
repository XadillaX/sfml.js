# Window

[English](window.md) · **简体中文** · [日本語](window.ja.md) · [한국어](window.ko.md)

> 二维绘制使用 RenderWindow；自行接入 OpenGL 时可使用 Window。窗口操作在主线程执行。

[API 导航](api.zh-CN.md) · [Graphics](graphics.zh-CN.md) · [快速开始](getting-started.zh-CN.md)

## 创建与关闭

```typescript
import { RenderWindow, VideoMode, Vector2u, State, Style } from 'sfml.js';

const window = new RenderWindow(
  new VideoMode(new Vector2u(800, 600)),
  'sfml.js',
  {
    style: Style.Default,
    state: State.Windowed,
    settings: { depthBits: 24, stencilBits: 8 },
  },
);
window.close();
```

Window 与 RenderWindow 支持空构造后调用 `create()`，也接受 Vector2u 尺寸或已有系统窗口的 bigint 句柄。`close()` 关闭窗口，JS 对象仍可再次 create。

RenderWindow 同时满足 `instanceof Window` 与 `instanceof RenderTarget`，可以直接绘制、查询鼠标相对坐标，也能作为 `Texture.update(window)` 的来源。

| 接口 | 用途 |
| --- | --- |
| `get/setPosition()`、`get/setSize()` | 窗口位置与客户区尺寸 |
| `setMinimumSize()`、`setMaximumSize()` | 尺寸限制；undefined 解除限制 |
| `setTitle()`、`setVisible()`、`setIcon()` | 标题、显隐、RGBA 图标 |
| `requestFocus()`、`hasFocus()` | 焦点请求与查询 |
| `setMouseCursor()`、`setMouseCursorVisible()`、`setMouseCursorGrabbed()` | 光标及鼠标限制 |
| `setKeyRepeatEnabled()`、`setJoystickThreshold()` | 输入行为 |
| `setVerticalSyncEnabled()`、`setFramerateLimit()` | 呈现节奏 |
| `getSettings()`、`getNativeHandle()` | 实际上下文设置与系统窗口句柄 |

位置使用 Vector2i，尺寸使用 Vector2u。`setIcon(size, pixels)` 接受 RGBA8 字节；RenderWindow 还接受 Image。

## 事件循环

```typescript
import { RenderWindow, Vector2u, Keyboard } from 'sfml.js';

const window = new RenderWindow(new Vector2u(800, 600), 'Events');
window.setFramerateLimit(60);

function frame() {
  window.handleEvents({
    Closed: () => window.close(),
    KeyPressed: event => {
      if (event.code === Keyboard.Key.Escape) window.close();
    },
    Resized: event => console.log(event.size.x, event.size.y),
  });
  if (!window.isOpen()) return;
  window.clear();
  window.display();
  setImmediate(frame);
}
frame();
```

`handleEvents(handlers, fallback?)` 排空事件队列，优先调用对应类型的处理器；也可传入单个函数处理全部事件。

需要手动分派时使用 `pollEvent()`：

```typescript
let event;
while ((event = window.pollEvent())) {
  if (event.is('Closed')) window.close();
  const key = event.getIf('KeyPressed');
  if (key) console.log(key.code, key.scancode);
}
```

`pollEvent()` 在没有事件时返回 undefined。Event 的 data 是以 kind 区分的联合类型，`is()`、`getIf()` 和 `visit()` 可用于收窄或访问数据。TextEntered 使用 Unicode 码点。

`waitEvent(timeout = Time.Zero)` 是同步阻塞接口，超时或关闭时返回 undefined。需要同时处理 Node I/O 的帧循环使用 pollEvent／handleEvents，并在帧间让出事件循环。

## 实时输入与系统功能

| 接口 | 说明 |
| --- | --- |
| `Keyboard.isKeyPressed(key)` | 当前键码状态 |
| `Keyboard.isKeyPressed(scancode, 'scancode')` | 当前物理扫描码状态 |
| `Keyboard.localize()`／`delocalize()`／`getDescription()` | 当前键盘布局映射及描述 |
| `Mouse.getPosition(window?)`／`setPosition(position, window?)` | 省略窗口时使用屏幕坐标 |
| `Mouse.isButtonPressed(button)` | 当前鼠标按钮状态 |
| Joystick | 连接、按钮、轴及设备标识；无窗口循环时调用 `update()` |
| Sensor | 先 `isAvailable()`，再启用及读取 |
| Clipboard | `getString()`／`setString()`，支持 JS Unicode 字符串 |
| Touch | 触点状态与位置；SFML 3.1.0 已弃用实时 Touch API |

输入命名空间中的枚举与顶层枚举共用同一对象，如 `Keyboard.Key` 与 `KeyboardKey`。

`Cursor.createFromSystem()`、`createFromPixels()` 失败时返回 undefined，构造函数失败则抛错。窗口会保活正在使用的 Cursor。macOS 使用系统光标前需先创建窗口。

VideoMode 使用 `size` 与 `bitsPerPixel`；`getDesktopMode()`、`getFullscreenModes()` 查询设备模式，`isValid()` 判断全屏模式。不要假设机器一定提供特定数量的全屏模式。

## OpenGL 与 Vulkan

Context 可创建独立 OpenGL 上下文，提供激活、实际设置、扩展查询及函数地址查询。`Context.getActiveContextId()` 返回 bigint，未激活时为 `0n`。地址由 `getFunction()` 以 bigint 返回，调用它需要匹配签名的原生代码。

RenderWindow 的 `setActive()`、`pushGLStates()`、`popGLStates()` 与 `resetGLStates()` 用于混合 SFML 和自定义 OpenGL。直接修改 GL 状态前先提交 SFML 命令，push／pop 必须在同一上下文配对。

Vulkan 命名空间提供：

- `isAvailable(requireGraphics = true)`。
- `getFunction(name)`。
- `getGraphicsRequiredInstanceExtensions()`。

`window.createVulkanSurface(instance, allocator = 0n)` 返回 bigint 表面句柄，失败为 undefined。实例、分配器与表面销毁由调用方负责。

SFML 3.1.0 的 macOS 构建不提供 Vulkan 后端；这些查询会反映不可用，安装 MoltenVK 不改变 SFML 的该平台分支。Windows／X11 的成功路径需要在对应环境验证。

## 运行演示

构建后运行 `node examples/window.cjs --frames=120`，查看事件、键码、指针位置和窗口属性；省略帧数则持续运行。

| 按键 | 行为 |
| --- | --- |
| F1／F2 | 光标类型／显隐 |
| F3／F4 | 按键重复／垂直同步 |
| F5／F6 | 窗口尺寸／尺寸限制 |
| F7／F8 | 修改标题／隐藏 1 秒后恢复 |
| F9／F10 | 事件 API／移动窗口 |
| Esc | 关闭 |

macOS 可能需要同时按 Fn。摇杆、传感器、触摸和 Vulkan 能力按设备查询结果判断；CI 构建通过不等于这些硬件路径都已验证。

<a id="sfml-cpp-reference"></a>

## SFML C++ 参考

窗口与事件参考 [sf::Window](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Window.html)、[sf::RenderWindow](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1RenderWindow.html)、[sf::Event](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Event.html)；显示模式与光标参考 [sf::VideoMode](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1VideoMode.html) 和 [sf::Cursor](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Cursor.html)。

上游事件类型和坐标规则可作为概念参考。JS 用字符串事件名和类型化载荷分派事件，并通过 `setImmediate()` 在帧间让出事件循环；`waitEvent()` 仍是同步等待，不能将 C++ 主循环直接搬入 Node.js。
