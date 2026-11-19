# RmlUi 渲染状态

## 回调纹理 {#callback-textures}

`manager.makeCallbackTexture(callback)` 返回唯一 `CallbackTexture`。
`toTexture()` 产生延迟视图，首次读取尺寸或绘制带纹理几何时调用生成函数。
`isValid` 只检查资源身份，不触发加载；`new CallbackTexture()` 为空，
`invalidHandle()` 为 `4294967295`。`release()` 可重复调用，并使已有非空视图失效。
视图保活原生资源，原 JS 所有者回收后仍可使用；释放后的缓存索引复用不会使其复活。
`Decorator.addTexture(view)` 同样保活视图及生成回调；
`getTexture(index)` 保留其有效性检查和所有权。

```js
const generated = manager.makeCallbackTexture(api =>
  api.generateTexture(
    new Uint8Array([ 128, 0, 0, 128 ]), { x: 1, y: 1 }));
const texture = generated.toTexture();

geometry.render({ x: 20, y: 20 }, texture);
generated.release();
```

生成函数收到仅在此次回调内有效的 `CallbackTextureInterface`。
`generateTexture(bytes, dimensions)` 接受非共享、紧密排列的预乘 RGBA `Uint8Array`
或 `Buffer`，长度必须恰好为宽 × 高 × 4 字节，尺寸为正整数，返回原生生成结果。
`saveLayerAsTexture()` 快照当前有效非空裁剪区域内的图层。
`getRenderManager()` 返回来源管理器。
`setTextureHandle(handle, dimensions)` 接收
`manager.generateTextureHandle(bytes, dimensions)` 创建的自有 `TextureHandle`，
验证管理器及原始尺寸后转移原生所有权。转移成功后令牌为空；
`handle.isValid` 检查所有权，`handle.release()` 释放未转移资源，不接受裸指针数字。

成功时恰好提交一次，并同步返回布尔值。返回 true 却未提交、返回 Promise 或其他
类型均会抛错。返回 false 或抛异常会回滚释放已生成或转移的纹理，失败缓存不重试。
生成期间仅接口方法可进入原生代码；资源释放、运行时及 DOM 修改、递归绘制和嵌套加载
会在原生数据库条目失效前拒绝。回调应使用预先计算的数据及传入接口。

`new CallbackTextureSource(callback)` 按管理器缓存唯一资源，
`getTexture(manager)` 返回延迟视图；省略回调时返回空视图。
源包装对象回收后，已有视图仍保活缓存资源。释放未使用管理器会移除此缓存条目；
关闭运行时使纹理、源及令牌失效。原生移动构造及赋值对应普通 JS 引用赋值，不复制资源。

运行[回调纹理](../../packages/sfml.js-rmlui/examples/callback-textures.cjs)
可验证字节生成、自有句柄转移和裁剪区域图层快照。

`context.getRenderManager()` 返回共享的原生 `RenderManager`。
`new RenderManager(getRenderInterface())` 创建独立管理器。
关闭运行时会使两者失效。资源归创建它的管理器所有。

`prepareRender({ x, y })` 要求默认状态与平衡的图层栈，再开始一帧。
`setViewport({ x, y })` 修改缓存的视口；`getViewport()` 返回整数尺寸。
尺寸必须为非负的有符号 32 位整数。

`setScissorRegion({ p0, p1 })` 将有效整数矩形与视口求交。
`null` 或无效矩形禁用裁剪。`getScissorRegion()` 返回矩形副本或 `null`；
`disableScissorRegion()` 显式禁用裁剪。

## 保存与恢复

```js
const manager = context.getRenderManager();
const saved = manager.getState();

try {
  manager.setScissorRegion({
    p0: { x: 20, y: 20 }, p1: { x: 200, y: 100 },
  });
  const matrix = new Float32Array([
    1, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 1, 0, 12, 8, 0, 1,
  ]);

  manager.setTransform(matrix);
  geometry.render({ x: 0, y: 0 });
} finally {
  manager.setState(saved);

  for (const mask of saved.clipMaskList) {
    mask.geometry.release();
  }
}
```

`RenderState` 包含 `scissorRegion`、`clipMaskList` 和 `transform`。
矩阵使用列主序 `Float32Array(16)`，所有值必须有限。
缓冲区必须固定且不共享；支持子视图。
普通几何与蒙版在几何平移后应用完整的齐次 4×4 矩阵，支持透视纹理插值，
Z 裁剪范围为 −10000 到 10000。自定义顶点程序保留 SFML 仿射变换约定。
`setTransform(null)` 使用单位矩阵。`resetState()` 禁用矩形与蒙版裁剪、
恢复单位矩阵，保留视口。

`getState()` 复制原生网格与矩阵。源元素关闭后，几何仍有效；它属于原管理器，
释放或运行时关闭时失效。`setState()` 提交前校验全部字段，并保留独立原生副本。
修改或释放提交过的快照不会破坏活动状态。用完后释放快照中的几何。
无效输入不改变缓存状态；参数访问器在原生管理器校验前执行。

## 几何蒙版

SFML 窗口必须使用 `{ settings: { stencilBits: 8 } }`。

蒙版保留提交时的矩形写入范围与变换。修改当前 scissor 不会扩大已有蒙版；
重叠三角形及超过 255 层交集保持布尔覆盖。原生接口关闭、重开时保留定义；
JS 的 `disableClipMask()` 还会清空 Core 的蒙版列表。

```js
const { ElementUtilities, ClipMaskOperation } = require('sfml.js-rmlui');
const clipping = ElementUtilities.getClippingRegion(element, true);

manager.setScissorRegion(clipping.region);
manager.setClipMask(clipping.clipMask);

for (const mask of clipping.clipMask) {
  mask.geometry.release();
}

geometry.render({ x: 0, y: 0 });
manager.disableClipMask();

manager.setClipMask(ClipMaskOperation.Set, geometry, { x: 10, y: 20 });
manager.disableClipMask();
```

`setClipMask(masks)` 与 `setClipMask(operation, geometry, translation)`
分别调用原生重载。几何必须非空并属于同一管理器。提交复制每个网格和矩阵；
禁用、替换或重置蒙版时，释放这些原生副本。

`clipMaskGeometryEquals(a, b)` 对应原生相等比较：操作与偏移按值比较，
几何与矩阵按引用比较，两个 `null` 矩阵相等。
内容相同的不同矩阵数组不相等。独立快照具有不同资源身份；使用 `!` 表示不等。

## 图层与滤镜列表 {#render-layers}

```js
const { BlendMode, FilterHandleList } = require('sfml.js-rmlui');
const destination = manager.getTopLayer();
const layer = manager.pushLayer();

try {
  geometry.render({ x: 20, y: 20 });
  const blur = manager.compileFilter('blur', { sigma: 3 });
  const filters = new FilterHandleList();

  blur.addHandleTo(filters);

  try {
    manager.compositeLayers(layer, destination, BlendMode.Blend, filters);
  } finally {
    filters.clear();
    blur.release();
  }
} finally {
  manager.popLayer();
}
```

`pushLayer()` 选择透明离屏目标。每次调用都必须对应一次 `popLayer()`，
并在下一次 `context.render()` 或 `prepareRender()` 前保持栈平衡。
`getTopLayer()` 返回规范的不透明令牌；首次压入前返回图层零。
上下文帧内的图层零包含透明 UI 内容，帧外代表宿主窗口。
`getNextLayer()` 返回顶层下面的图层，空栈会抛错。
只能弹出此接口压入的图层。同一渲染器上的不同管理器不能交错使用活动目标。

`compositeLayers(source, destination, blendMode, filters?)` 接受同一管理器
的活动令牌。源和目标均可以是图层零。`BlendMode.Blend`
将预乘透明度的源叠加到目标；`BlendMode.Replace` 替换当前裁剪区域内的像素。
自合成会复制输入。弹出的令牌不会因目标池复用而恢复有效。
列表按插入顺序应用滤镜，包装器回收后仍持有原生资源；
已释放或属于其他管理器的条目会在合成前抛错。`clear()` 释放列表持有的所有权。

`saveLayerAsMaskImage()` 保存当前裁剪区域内的图层透明度，返回 `CompiledFilter`。
加入 `FilterHandleList` 后，在原视口位置将后续图层像素乘以蒙版透明度。
图层零也可提供蒙版。弹出源图层后快照仍有效；区域无效时返回无效滤镜。用完后释放。

装饰器渲染回调支持状态与图层的读取和提交；事件回调支持读取，拒绝修改。
回调不能弹出调用者持有的图层。回调返回时栈不平衡会报错，并在原生渲染继续前
释放此次回调压入的图层；原有回调异常会保留。
着色器与平台渲染仍需独立验收。
运行[元素检查器](../../packages/sfml.js-rmlui/examples/element-utilities.cjs)
查看原生几何裁剪、矩阵提交与状态恢复。
运行[图层合成](../../packages/sfml.js-rmlui/examples/render-layers.cjs)
查看嵌套合成、自合成模糊与透明度蒙版。空格移动图形，Escape 退出。
