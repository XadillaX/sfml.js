# 文本输入、回调与缓冲区

输入框编辑字节，列表向 JavaScript 获取标签，曲线获取数值。运行完整[工作台](../../packages/sfml.js-imgui/examples/workbench.cjs)：

```sh
node packages/sfml.js-imgui/examples/workbench.cjs
```

Name 修改下方显示的文本，Selection 切换对象，Frame ms 读取帧耗时环形缓冲区。让 Name 获得焦点，可观察回调字节计数。`CallbackAlways` 指输入处于编辑活动状态时的回调，不代表未激活时也无条件调用应用函数。

## 存储与读取 UTF-8

缓冲区在帧循环外创建一次，容量单位是**字节**，包含结尾零字节。字符数量不等于字节数量，许多非 ASCII 字符需要多个 UTF-8 字节。

以下辅助函数拒绝溢出，不会在多字节字符中间截断：

```js
const name = new Uint8Array(128);

function writeText(target, value) {
  const bytes = Buffer.from(value, 'utf8');
  if (value.includes('\0') || bytes.length >= target.length) {
    throw new RangeError('Text needs room for one trailing zero byte');
  }
  target.fill(0);
  target.set(bytes);
}

function readText(source) {
  const end = source.indexOf(0);
  return Buffer.from(source.subarray(0, end < 0 ? source.length : end))
    .toString('utf8');
}

writeText(name, 'Scene');
```

初始化后，在每帧的可见窗口内调用：

```js
if (ImGui.InputText('Name', name, name.length)) {
  console.log(readText(name));
}
```

默认返回值表示内容变化。设置 `EnterReturnsTrue` 后，返回值改为 Enter 确认；根据连续保存或确认保存的需要选择。无论返回值如何，编辑状态都在缓冲区内。

不要每帧用旧应用字符串覆盖缓冲区。初始化后让 ImGui 编辑，在加载另一对象或执行重置时明确同步。选用合适的固定容量；`CallbackResize` 不会把类型化数组变成可自动扩容的原生字符串，在回调中换一个数组不是受支持的所有权方案。

## 同步读取回调数据

普通 `InputText` 不需要回调。确实需要 JavaScript 回调行为时，使用 `InputTextEx`：

```js
let callbackBytes = 0;

function inspectInput(data) {
  const fields = ImGui.viewImGuiInputTextCallbackData(data);
  callbackBytes = fields.BufTextLen;
  return 0;
}

function drawTextEditor() {
  ImGui.InputTextEx(
    'Name',
    name,
    name.length,
    ImGui.ImGuiInputTextFlags.CallbackAlways,
    inspectInput
  );
  ImGui.TextUnformatted(`Current name: ${readText(name)}`);
  ImGui.TextUnformatted(`Last active callback: ${callbackBytes} bytes`);
}
```

`BufTextLen` 是已使用的 UTF-8 字节数，`BufSize` 是容量。句柄和字段视图只在本次回调内借用；复制需要的数字或文本，不要保留视图，不要在回调里 await 或交给定时器。返回契约要求的数字，通常用零表示默认处理。

## 为列表与曲线提供数据

选择数组和数据放在循环外；每次调用期间保持行顺序稳定。getter 可能被多次调用，应快速且没有副作用：

```js
const labels = [ 'Player', 'Light', 'Camera' ];
const selected = new Int32Array([ 0 ]);
const timings = new Float32Array([ 16, 17, 15, 19, 16 ]);

function drawData() {
  ImGui.ListBoxCallbackEx(
    'Selection',
    selected,
    labels.length,
    index => labels[index]
  );
  ImGui.TextUnformatted(`Selected: ${labels[selected[0]]}`);
  ImGui.PlotLinesCallbackEx(
    'Frame ms',
    timings.length,
    index => timings[index],
    null,
    0,
    null,
    0,
    40,
    [ 0, 70 ]
  );
}
```

在可见窗口内调用 `drawData()`。索引从零开始；数据缩短时先约束选中索引，空列表应展示空状态，不能直接索引。环形缓冲区把最旧样本偏移传给 `valuesOffset`，工作台展示了该模式。

远端数据应在渲染之外加载，到达后更新模型。`async` getter 返回 Promise，而原生调用需要立即得到字符串或数字，不能等待它。

## 区分内存所有权

| 数据 | 所有者 | 有效期 |
| --- | --- | --- |
| 应用创建的类型化数组 | JavaScript | 所有读写调用期间保持存活 |
| 文本回调句柄、视图 | 当前原生回调 | 仅当前回调内 |
| IO、样式、字体 | ImGui 上下文、图集 | 所有者销毁或不兼容重建后不可继续使用 |
| Storage 引用视图 | 原生存储 | 结构变化可能使地址失效 |
| DrawList、DrawCmd 回调句柄 | 渲染器 | 遵循对应帧或回调作用域 |

`AddCallbackEx` 在渲染器处理绘制列表时执行，通常位于 `SFML.Render` 内，不用于声明控件。捕获的资源和 `userData` 指向的对象要保留到所有可能调用结束；克隆绘制列表可能独立重放，当前帧完成并不等于其生命周期结束。

原生句柄和不透明指针不是 JavaScript 回调。不要把函数转为 `bigint` 或传入原始指针接口，应选择声明明确接收 JavaScript 函数的 `Ex` 包装。

文本被截断时检查字节容量和零结尾；解码正确但显示方框时检查[字体覆盖](fonts.zh-CN.md)；回调失败时先查返回类型、标志和借用数据有效期。

API：[InputTextEx](/reference/imgui/functions/ImGui.InputTextEx.html)、[ListBoxCallbackEx](/reference/imgui/functions/ImGui.ListBoxCallbackEx.html)、[PlotLinesCallbackEx](/reference/imgui/functions/ImGui.PlotLinesCallbackEx.html)、[AddCallbackEx](/reference/imgui/functions/ImGui.AddCallbackEx.html)。
