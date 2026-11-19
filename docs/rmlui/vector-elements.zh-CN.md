# SVG 与 Lottie

`sfml.js-rmlui` 将上游 SVG 和 Lottie 插件编入 Native addon。解析、几何、
纹理和动画推进由 RmlUi 持有并执行，正常调用 `context.update()` 与
`context.render()` 即可。

```xml
<svg id="icon" width="40" height="20" viewBox="0 0 40 20">
  <rect width="40" height="20" fill="#00ff00"/>
</svg>
<svg src="assets/icon.svg" crop-to-content=""/>
<lottie src="assets/animation.json"/>
```

RCSS 的 `width`、`height` 控制渲染区域，`image-color` 调整着色，`opacity`
控制透明度。SVG 文件和 Lottie JSON 通过当前原生文件接口加载，路径相对于
文档 URL。SVG 同时支持 `svg("assets/icon.svg" crop-to-content)` 装饰器；
`crop-to-content` 将图像裁剪到内容边界。

```js
const { ElementSVG, ElementLottie } = require('sfml.js-rmlui');

const icon = document.getElementById('icon');

if (icon instanceof ElementSVG) {
  icon.innerRML = '<rect width="40" height="20" fill="#ff0000"/>';
  icon.ensureSourceLoaded();
}

const animation = new ElementLottie('lottie');

animation.setAttribute('src', 'assets/animation.json');
document.appendChild(animation);
```

两类元素保留 Element 的方法和所有权检查，包括直接构造、原生 RTTI 和
`getIntrinsicDimensions()`。`ensureSourceLoaded()` 调用上游公开方法；
布局、更新和渲染通常会自动加载变化后的源。SVG 的 `innerRML` 读取或替换
内联 XML；设置 `src` 时，上游返回空内容并忽略内联替换。

Lottie 根据原生系统时钟自动循环播放。上游 `renderSync` 保持动画比例；
RCSS 区域比例不同时，内容居中显示。上游 ElementLottie 没有逐元素暂停、
速度或跳帧方法。配置共享系统时钟会同时影响运行时中的其他计时行为。

构建固定使用 LunaSVG 3.5.0、其自带的 PlutoVG 1.3.1，以及 rlottie 0.2，
具体提交和归档 SHA-256 见[依赖清单](../../packages/sfml.js-rmlui/tools/dependencies/optional-dependencies.json)。
图片解码器直接链接到 addon，内嵌 PNG 无需额外加载器库。该版本的 NEON
实现依赖 ARM32 汇编，因此 ARM64 使用 rlottie 自带的可移植光栅器。

[本地验收记录](audit/6.3/vector-native-contracts.md)覆盖 macOS arm64 的
通道、透明度、源替换、尺寸、裁剪、装饰器、动画帧、内嵌图片和运行时重启。
其他平台、替代字体和整体验收仍未完成。
