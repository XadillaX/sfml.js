# 渲染与多窗口

组合 SFML 场景与 ImGui 控件，在面板内添加自定义图形，并明确资源所属窗口。运行[场景检查器](../../packages/sfml.js-imgui/examples/scene-inspector.cjs)观察场景合成，运行[工作台](../../packages/sfml.js-imgui/examples/workbench.cjs)观察面板内绘制：

```sh
node packages/sfml.js-imgui/examples/scene-inspector.cjs
node packages/sfml.js-imgui/examples/workbench.cjs
```

每次执行一条命令，关闭窗口后退出该示例。检查器把运动的 SFML 圆形画在控件后方；工作台在选中对象标签旁为 ImGui 圆形预留空间。

## 先提交场景，再绘制 UI

检查器每帧按以下顺序执行：

```js
SFML.Update(window, seconds);
drawControls(seconds);
window.clear(background);
window.draw(circle);
SFML.Render(window);
window.display();
```

这里的 `seconds`、`background`、`circle` 和 `drawControls` 来自完整检查器。控件先修改模型，再录制场景绘制。`SFML.Render` 在后端渲染前调用 `window.flush()`，确保已录制的 SFML 内容先于 UI 覆盖层提交。

不要在 UI 渲染后 clear，否则会抹掉 UI。在 `SFML.Render` 后绘制 SFML 内容，可能把它覆盖到控件上。常规覆盖层无需手动管理 OpenGL 状态。

## 在面板内部绘制

当前窗口的绘制列表适合受窗口裁剪约束的装饰图形。工作台在可见窗口内使用以下模式：

```js
function drawPreview() {
  const origin = ImGui.GetCursorScreenPos();
  const list = ImGui.GetWindowDrawList();
  if (list) {
    ImGui.ImDrawList_AddCircleFilled(
      list,
      [ origin.x + 48, origin.y + 48 ],
      32,
      ImGui.GetColorU32(ImGui.ImGuiCol.PlotHistogram)
    );
  }
  ImGui.Dummy([ 96, 96 ]);
  ImGui.SameLine();
  ImGui.TextUnformatted('Custom preview');
}
```

在 Begin 成功后调用 `drawPreview()`。绘制列表使用屏幕坐标，`GetCursorScreenPos` 提供合适的起点。颜色从当前样式转为打包值，避免自行猜测字节顺序。绘制命令不会预留布局空间或创建交互项，因此需要 `Dummy` 推进布局。

需要点击或拖动时，使用 `InvisibleButtonEx` 等交互项占据对应区域，再通过控件、鼠标查询更新状态。可见图元本身不会参与输入处理。

## 纹理 ID 属于渲染后端

`ImGui.Image` 接收 `bigint` 形式的后端纹理标识，不接收 `sf.Texture` 对象或文件名。不能把 JavaScript 对象或 interop 指针转换为 bigint 来猜一个 ID：原生对象地址与 GPU 纹理标识含义不同。

图像集成应使用明确支持的纹理 ID 桥接。[互操作指南](../interop/README.zh-CN.md)介绍原生对象共享，但对象句柄本身不是 ImGui 纹理适配器。实际 GPU 纹理必须存活到所有引用它的绘制命令消费结束。没有经过核验的桥接时，可像检查器一样直接用 SFML 在同一窗口绘制场景预览。

## 按原生窗口管理上下文

每个 `SFML.Init(window)` 初始化对应原生窗口的集成。Begin 创建的 ImGui 面板不是第二个 SFML 窗口。多个原生窗口需要分别执行初始化、更新、渲染和关闭。

仓库中的[多窗口运行测试](../../packages/sfml.js-imgui/test/multi-window.test.cjs)验证上下文切换。应用应按以下顺序组织：

1. 初始化各窗口，分别保留状态和时钟。
2. 访问字体、样式或 IO 前，调用 `SFML.SetCurrentWindow(window)` 选中所属窗口。
3. 转发该窗口的事件，开始它的帧，声明控件。
4. 清屏、渲染并显示该窗口。
5. 关闭时先 `SFML.Shutdown(window)`，再 `window.close()`，并从后续帧处理中移除。

ProcessEvent、Update 和 Render 会选择对应集成上下文，但加载字体或改样式时，不应依赖最后碰巧处理了哪个窗口。字体与借用视图属于原上下文，不能作为另一窗口的句柄使用。

窗口更新节奏不同时，分别计算经过时间。同一时钟依次为各窗口 restart，测得的是窗口之间的间隔，不是各自帧时长。

## 限定帧资源生命周期

当前帧获取绘制列表，不要跨 Shutdown 缓存，也不要假设其内容能保留到下一帧。JavaScript 仍持有句柄不代表拥有原生资源。

`AddCallbackEx` 在控件构建之后的渲染阶段执行，不能在里面调用 Begin、添加控件、切换上下文或销毁渲染器仍在使用的资源。克隆列表需要独立管理生命周期和回调保活，见[回调章节](callbacks.zh-CN.md)。

图形覆盖后续控件时检查预留空间；位置错误时检查屏幕坐标与局部坐标；多窗口使用了错误样式或字体时先查上下文选择。

API：[Render](/reference/imgui/functions/SFML.Render.html)、[GetWindowDrawList](/reference/imgui/functions/ImGui.GetWindowDrawList.html)、[ImDrawList_AddCircleFilled](/reference/imgui/functions/ImGui.ImDrawList_AddCircleFilled.html)、[SetCurrentWindow](/reference/imgui/functions/SFML.SetCurrentWindow.html)。
