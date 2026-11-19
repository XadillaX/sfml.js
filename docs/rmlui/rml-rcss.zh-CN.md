# RML 与 RCSS 入门

RML 定义文档中的元素，RCSS 用选择器设置它们的布局和外观，JavaScript 负责加载文档并连接应用状态。本章使用[计数器示例](../../packages/sfml.js-rmlui/examples/README.zh-CN.md#demo)，请先完成[快速开始](getting-started.zh-CN.md)。

## 从三个文件看起

| 文件 | 职责 |
| --- | --- |
| [tutorial.rml](../../packages/sfml.js-rmlui/examples/assets/tutorial.rml) | 元素树、ID、文本和样式表链接 |
| [tutorial.rcss](../../packages/sfml.js-rmlui/examples/assets/tutorial.rcss) | 布局、字体、颜色和悬停状态 |
| [demo.cjs](../../packages/sfml.js-rmlui/examples/demo.cjs) | 窗口、字体加载、文档加载、输入、点击处理和帧循环 |

## 编写 RML 文档

下面是 `tutorial.rml` 的简化版本，保留了 `demo.cjs` 查询的 ID，可以配合原启动器和下方样式表试用。

```xml
<rml>
  <head>
    <title>Counter</title>
    <link type="text/rcss" href="tutorial.rcss" />
  </head>
  <body>
    <div id="window">
      <div id="title">My counter</div>
      <div id="counter" class="muted">Clicks: 0</div>
      <button id="increment">Increment</button>
    </div>
  </body>
</rml>
```

`<rml>` 是根节点，`<head>` 声明文档资源，`<body>` 放置可见界面。样式表路径相对于 RML 文件解析。标签要正确闭合，属性值用引号包围，空元素使用 `<link />` 这样的自闭合写法。文本中的 `&` 和 `<` 分别写成 `&amp;` 和 `&lt;`。

`id` 用于标识一个元素，方便查询和设置样式；`class` 用于给多个元素应用共同样式，多个类名以空格分隔。RML 不会自动赋予任意标签浏览器中的默认外观，例如 `div` 需要显式设置 `display: block` 才按块级布局。

## 用 RCSS 设置样式

将以下规则放入与 RML 同目录的 `tutorial.rcss`。启动器已经在加载文档前加载了 LatoLatin 常规和粗体字体。

```css
body {
  width: 100%;
  height: 100%;
  font-family: LatoLatin;
  font-size: 16dp;
  color: #f5f7fa;
  background: #1d2430;
}

div {
  display: block;
}

#window {
  width: 480dp;
  margin: auto;
  padding: 24dp;
  box-sizing: border-box;
  background: #2b3446;
  border: 1dp #46546e;
}

#title {
  font-size: 22dp;
  font-weight: bold;
  margin-bottom: 12dp;
}

.muted {
  color: #8fd3ff;
  margin-bottom: 18dp;
}

button {
  display: inline-block;
  padding: 10dp 24dp;
  background: #e84c88;
}

button:hover {
  background: #ff6aa2;
}
```

| 选择器 | 匹配对象 |
| --- | --- |
| `button` | 所有按钮元素 |
| `#window` | `id="window"` 的元素 |
| `.muted` | 包含 `muted` 类名的元素 |
| `#window button` | `#window` 内的后代按钮 |
| `button:hover` | 鼠标指针悬停的按钮 |

`margin` 是盒子外部的间距，`padding` 是内容与边框之间的间距。`box-sizing: border-box` 让声明的宽度包含内边距和边框。字体和文字颜色会从父元素继承，更具体的匹配规则可以覆盖通用规则。悬停样式只改变外观，点击动作仍需监听器。

固定界面尺寸和字号优先使用 `dp`：密度比例为 2 时，`16dp` 对应 32 个渲染像素，保持逻辑尺寸。`px` 使用渲染像素；`%` 的参考尺寸由具体属性决定。绑定会初始化上下文的密度比例，详见 [Retina 尺寸](rendering.zh-CN.md)。`font-family` 必须匹配已加载字体的内部族名，而非文件名。

RCSS 有自己的属性支持范围。例如边框简写是 `border: 1dp #46546e`，不要假设浏览器 CSS 声明都能直接使用。Flexbox、模板和装饰器都有对应的上游文档。

## 把点击连接到状态

启动器在加载文档后查询元素，并在帧循环外注册一次监听器：

```js
const counter = document.getElementById('counter');
const button = document.getElementById('increment');

if (!counter || !button) {
  throw new Error('Counter elements are missing');
}

let clicks = 0;

function increment() {
  clicks += 1;
  counter.innerRML = `Clicks: ${clicks}`;
}

button.addEventListener('click', increment);
```

帧循环把 SFML 事件转发给 `context.processEvent`，再调用 `update` 和 `render`。点击后修改的是已有元素，下一帧显示新数值。`innerRML` 会解析标记，写入不可信文本前需要转义。本包不会执行 RML 中的 `<script>` 内容或内联 `onclick` JavaScript。

卸载文档前，用同一个函数调用 `button.removeEventListener('click', increment)`。[文档与事件](documents.zh-CN.md)继续介绍查询、类名修改和原生对象生命周期。

## 动手改一次

修改标题、`.muted` 的颜色或按钮内边距，然后在 monorepo 根目录重新启动：

```sh
node packages/sfml.js-rmlui/examples/demo.cjs
```

修改 RML 和 RCSS 不需要重新编译原生模块。启动器在启动时读取文件，没有文件变更监听。简化文档会显示标题、计数器和按钮，点击 Increment 后计数加一。

## 官方语法参考

- [RML 手册](https://mikke89.github.io/RmlUiDoc/pages/rml.html)：[语法](https://mikke89.github.io/RmlUiDoc/pages/rml/syntax.html)、[元素索引](https://mikke89.github.io/RmlUiDoc/pages/rml/element_index.html)、[模板](https://mikke89.github.io/RmlUiDoc/pages/rml/templates.html)。
- [RCSS 手册](https://mikke89.github.io/RmlUiDoc/pages/rcss.html)：[语法与单位](https://mikke89.github.io/RmlUiDoc/pages/rcss/syntax.html)、[选择器](https://mikke89.github.io/RmlUiDoc/pages/rcss/selectors.html)、[属性索引](https://mikke89.github.io/RmlUiDoc/pages/rcss/property_index.html)。
- [基础元素样式指南](https://mikke89.github.io/RmlUiDoc/pages/style_guide.html)与 [Flexbox 布局](https://mikke89.github.io/RmlUiDoc/pages/rcss/flexboxes.html)。

上游在线手册跟随开发分支；本绑定面向 RmlUi 6.3，只开放其中一部分 API 和渲染能力。使用上游特性前，请核对本地的[渲染支持范围](rendering.zh-CN.md)和 [API 指南](api.zh-CN.md)。
