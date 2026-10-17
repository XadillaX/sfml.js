# Graphics

[English](graphics.md) · **简体中文** · [日本語](graphics.ja.md) · [한국어](graphics.ko.md)

> 从 Image／Texture 准备素材，用 Sprite、Shape、Text 或顶点组织场景，再交给 RenderWindow 或 RenderTexture 绘制。

[API 导航](api.zh-CN.md) · [窗口与事件](window.zh-CN.md) · [绘制快照](concepts.zh-CN.md#draw-snapshots)

## Image：CPU 像素

Image 保存 RGBA8 像素，`.pixels` 是直接映射 Native 分配的 Uint8Array：

```typescript
import { Image, Color, Vector2u } from 'sfml.js';

const image = new Image(new Vector2u(64, 64), Color.White);
image.setPixel(new Vector2u(0, 0), Color.Red);
image.pixels[3] = 128;
if (!await image.saveToFile('image.png')) throw new Error('Cannot save image');
```

| 接口 | 行为 |
| --- | --- |
| 空构造、尺寸与颜色、尺寸与 RGBA 字节、复制构造 | 创建独立像素资源 |
| `loadFromFile/Memory/Stream()` | 异步加载，返回 boolean |
| `saveToFile()`／`saveToMemory(format)` | 异步编码；返回 boolean／字节或 undefined |
| `getSize()`、`getPixel()`、`setPixel()` | 尺寸与单像素操作 |
| `pixels`／`getPixelsPtr()` | 可写视图／只读类型视图，后者在空图像时为 undefined |
| `resize(size, color?)` | 重新分配并填充，尺寸相同也不保留旧内容 |
| `copy()`、`createMaskFromColor()`、`flipHorizontally()`、`flipVertically()` | 区域复制、遮罩与翻转 |

原始 RGBA 输入长度必须为宽 × 高 × 4，构造时复制。成功重载或 resize 后，旧视图继续保活旧分配；失败加载保留当前图像。不要分离或调整像素 buffer。

异步内存加载在调用时复制编码输入；异步保存复制调用时的像素。读取、解码和编码在后台执行，但快照仍有主线程成本。输入流使用规则见 [System](system.zh-CN.md#input-streams)。

## Texture：GPU 纹理

```typescript
import { Texture, Sprite } from 'sfml.js';

const texture = new Texture();
if (!await texture.loadFromFile('sprite.png')) {
  throw new Error('Cannot load sprite.png');
}
texture.setSmooth(true);
const sprite = new Sprite(texture);
```

空构造适合异步加载；`new Texture(size)` 分配 GPU 存储，`new Texture(image)` 上传已解码图像，`new Texture(sourceTexture)` 复制 GPU 内容。后两种不执行文件读取。

| 接口 | 行为 |
| --- | --- |
| `loadFromFile/Memory/Stream(source, sRgb?, area?)` | 异步解码、调用线程上传；area 为 IntRect |
| `loadFromImage(image, sRgb?, area?)` | 同步上传，返回 boolean |
| `update(pixels)`／`update(pixels, size, dest)` | 上传全部／局部 RGBA |
| `update(imageOrTextureOrWindow, dest?)` | 复制源内容 |
| `resize(size, sRgb?)` | 重建存储，成功后像素未定义 |
| `copyToImage()` | 同步 GPU 读回，得到独立 Image |
| `assign(source)`／`swap(other)` | 独立复制／交换内容，保留目标对象身份 |
| `setSmooth()`／`setRepeated()` | 平滑／重复采样 |
| `generateMipmap()` | 生成 mipmap；更新内容后需重新生成 |
| `getNativeHandle()`／`Texture.bind()` | OpenGL 名称／当前上下文绑定 |
| `Texture.getMaximumSize()` | 当前设备的最大纹理边长 |

加载失败保留旧内容。多个加载按完成顺序生效，确定顺序时逐次 await。GPU 上传和读回是同步操作，大纹理会占用调用线程。

局部 update 不缩放或裁剪，目的区域越界会抛错。加载的裁剪矩形任一尺寸为零时使用全图；其他非空区域按图像范围调整，非法负尺寸或起点越界被拒绝。

纹理尺寸变化不会自动修改 Sprite 的纹理矩形，需要全图时调用 `sprite.setTexture(texture, true)`。修改纹理内容或采样设置前，绑定提交依赖旧状态的绘制。

## Sprite 与变换

Sprite 必须从 Texture 或其他 Sprite 构造。复制 Sprite 会复制外观和变换，并引用同一纹理。

| 接口 | 语义 |
| --- | --- |
| `setPosition()`／`move()` | 位置及相对移动，Vector2f |
| `setRotation()`／`rotate()` | 角度及相对旋转，Angle |
| `setScale()`／`scale()`、`setOrigin()` | 缩放与原点，Vector2f |
| `getTransform()`／`getInverseTransform()` | 缓存的只读矩阵，查询时更新 |
| `setTexture(texture, resetRect?)` | 切换纹理，默认保留纹理矩形 |
| `setTextureRect(rect)` | 复制矩形，负尺寸可用于翻转 |
| `setColor(color)` | 颜色与 alpha 调制 |
| `getLocalBounds()`／`getGlobalBounds()` | 局部／自身变换后的轴对齐边界 |

变换 getter 的位置、缩放、原点和角度返回独立值。修改后要通过 setter 写回。`getTextureRect()` 则返回只读实时视图，后续 setter 会更新它。

global bounds 不包括 draw 传入的外层 RenderStates。Shape 和 Text 也提供同样的变换接口。

## Shape

```typescript
import { CircleShape, RectangleShape, Vector2f, Color } from 'sfml.js';

const circle = new CircleShape({ radius: 24, pointCount: 48 });
circle.setFillColor(Color.Cyan);
circle.setOutlineColor(Color.White);
circle.setOutlineThickness(2);
const rectangle = new RectangleShape(new Vector2f(120, 40));
rectangle.setPosition(new Vector2f(60, 20));
```

ConvexShape 接受点数，随后用 `setPoint()` 填入凸多边形顶点。三类形状均支持同类复制构造、纹理、填充、轮廓和边界查询。

自定义形状继承 Shape，实现 `getPointCount()` 和 `getPoint()`，点集变化后调用 protected `update()`。点集必须满足凸形状要求，update 生成几何，提交绘制时不会再次查询 JS 点方法。

轮廓厚度可以为负；miter limit 的默认值为 10，最小为 1。改变几何、轮廓厚度或 miter limit 前，会先提交引用旧几何的命令。

## Font、Glyph 与 Text

```typescript
import { Font, Text, TextStyle, LineAlignment, Color, Vector2f } from 'sfml.js';

const font = new Font();
if (!await font.openFromFile('font.ttf')) throw new Error('Cannot open font');
const text = new Text({ font, string: 'Hello\nSFML', characterSize: 30 });
text.setPosition(new Vector2f(20, 30));
text.setStyle(TextStyle.Bold);
text.setLineAlignment(LineAlignment.Center);
text.setFillColor(Color.White);
```

Font 的加载方法为 `openFromFile/Memory/Stream()`，不是 loadFromFile。加载失败保留旧字体。内存输入由 Native 持有；文件方式在字体使用期间应保持源文件可用。

Font 提供字形、字偶距、行间距、上下伸部与下划线度量。`getGlyph()` 按 Unicode 码点查询，`getGlyphById()` 按字体内部编号查询；`getTexture(size)` 返回随字形增长的只读图集。

Text 支持字体、字符串、字号、间距、填充、轮廓、样式、行对齐、字素分组及文字方向配置。`getShapedGlyphs()` 返回字形列表，`setGlyphPreProcessor()` 可按字形调整外观。

`getShapedGlyphs()` 和预处理回调的 cluster 使用 JS UTF-16 下标，例如 `A😀中` 为 0、1、3；已弃用的 `findCharacterPos()` 使用 Unicode 码点索引。预处理回调中不能再次修改当前 Text 的排版属性或查询几何。

`getVertexData()` 与 `getOutlineVertexData()` 提供可编辑顶点。修改影响后续 draw，重新排版会生成新几何；旧视图保活原分配。每次 draw 保存顶点快照。

## View 与坐标

View 控制中心、尺寸、旋转、viewport 和 scissor：

```typescript
import { RenderTexture, View, Vector2u, Vector2f } from 'sfml.js';

const target = new RenderTexture(new Vector2u(800, 600));
const camera = new View(target.getDefaultView());
camera.move(new Vector2f(100, 0));
camera.zoom(0.5);
target.setView(camera);
```

setView 按值复制。`getView()` 与 `getDefaultView()` 返回稳定只读引用；需要修改时复制为 View。

`mapPixelToCoords(Vector2i, view?)` 将像素转换为世界坐标，`mapCoordsToPixel(Vector2f, view?)` 反向转换。省略 view 时使用当前视图。

viewport 与 scissor 使用相对整个目标的归一化矩形。scissor 必须位于 `[0, 1]`，同时影响 draw、clear 和 clearStencil。

## RenderTexture 与离屏合成

```typescript
import { RenderTexture, Vector2u, Sprite, Color } from 'sfml.js';

const source = new RenderTexture(new Vector2u(64, 64));
source.clear(Color.Red);
source.display();

const output = new RenderTexture(new Vector2u(128, 128));
output.clear();
output.draw(new Sprite(source.getTexture()));
output.display();
await output.getTexture().copyToImage().saveToFile('offscreen.png');
```

`getTexture()` 返回稳定的只读 GPU 纹理视图，不复制像素，也不隐式 display。`flush()` 仅提交绘制，采样新内容前仍需 display。不能在同一目标上直接采样自身纹理。

`resize(size, settings?)` 成功后重置当前和默认视图，像素内容未定义；失败保留原目标。已有纹理视图继续有效，但关联 Sprite 的纹理矩形需按需重设。

ContextSettings 支持 depthBits、stencilBits、antiAliasingLevel、majorVersion、minorVersion、attributeFlags、sRgbCapable。实际能力受驱动影响，SFML Graphics 需要兼容 OpenGL 上下文。

## Drawable 与 RenderStates

自定义组合对象继承 Drawable，实现同步 protected draw。每次调用会收到独立 RenderStates 值副本，资源引用仍共享：

```typescript
import { Drawable, RenderTarget, RenderStates, Transformable } from 'sfml.js';

class Group extends Drawable {
  /** 组合对象的本地变换。 */
  readonly pose = new Transformable();

  /** 保留按顺序绘制的子对象。 */
  constructor(readonly children: Drawable[]) { super(); }

  /** 将本地变换组合到父状态后绘制各子对象。 */
  protected draw(target: RenderTarget, states: RenderStates): void {
    states.transform.combine(this.pose.getTransform());
    for (const child of this.children) target.draw(child, states);
  }
}
```

| RenderStates 字段 | 默认值 |
| --- | --- |
| transform | 单位变换 |
| blendMode | BlendAlpha |
| stencilMode | 默认 StencilMode |
| coordinateType | CoordinateType.Pixels |
| texture／shader | null |

draw 接受 RenderStates、状态选项，或单独的 Transform、Texture、Shader、BlendMode、StencilMode 等。Sprite 与 Shape 使用自身纹理和坐标模式。

模板遮罩需要目标提供 stencilBits。`clear(color, stencil)` 同时清颜色与模板，`clearStencil()` 只清模板。BlendMode 提供 Alpha、Add、Multiply、Min、Max、None 预设。

## 顶点与 GPU 缓冲

```typescript
import { VertexArray, Vertex, PrimitiveType, Vector2f, Color } from 'sfml.js';

const triangle = new VertexArray(PrimitiveType.Triangles, 3);
triangle.setVertex(0, new Vertex(new Vector2f(10, 10), Color.Red));
triangle.setVertex(1, new Vertex(new Vector2f(100, 10), Color.Green));
triangle.setVertex(2, new Vertex(new Vector2f(10, 100), Color.Blue));
triangle.getVertex(1).position.x = 120;
```

VertexArray 支持 get/setVertex、append、resize、clear、getBounds 和迭代。draw 立即保存连续顶点快照；之后修改或扩容不会改变已录制画面。结构修改后重新取得成员，迭代期间不要修改结构。

SFML 3 支持 Points、Lines、LineStrip、Triangles、TriangleStrip、TriangleFan。多个方块可用三角形组织进一个 VertexArray，从而减少实际 SFML draw 次数。

VertexBuffer 把顶点保存在 GPU；先 `create(count)`，再 `update(vertices)`，检查两者的布尔返回值。Usage 提供 Stream、Dynamic、Static。范围绘制使用 `target.draw(buffer, firstVertex, vertexCount, states?)`。

`assign()` 深拷贝 GPU 数据、图元和 usage；`update(sourceBuffer)` 复制数据并保留目标图元和 usage；`swap()` 交换资源。修改存储前提交旧绘制。GL 名称可能变化，使用前重新获取。

## Shader、Transform 与 GLSL

Shader 使用异步 `loadFromFile/Memory/Stream()`，支持单阶段或 vertex／fragment／geometry 组合。成功重载替换程序并清空 uniform 状态，失败保留旧程序。

`setUniform()` 接受 number、boolean、Glsl 向量／矩阵、Texture 和 `Shader.CurrentTexture`。number 默认 float，整数使用第三个参数 `'int'`。uniform 修改前提交已有绘制。

`Glsl.Vec2/3/4`、`Ivec2/3/4`、`Bvec2/3/4` 对应 GLSL 向量；Mat3／Mat4 从数组、同尺寸矩阵或 Transform 构造，`.array` 是列主序 Float32Array。四维向量与矩阵不提供通用向量算术运算符。

Transform 支持平移、旋转、缩放与 combine，原位修改并返回自身。组合为右乘，`translate(...).scale(...)` 对点先缩放再平移。getMatrix 返回只读实时数组；奇异矩阵求逆返回独立单位变换。

通过 `Shader.isAvailable()`、`isGeometryAvailable()` 和 `VertexBuffer.isAvailable()` 查询能力。直接使用 Texture／Shader／VertexBuffer 的 bind 前，先显式提交已有 SFML 命令。

## 示例与性能验证

[示例目录](../examples/README.zh-CN.md) 提供纹理、精灵、文字、顶点、组合绘制和离屏合成的独立入口。

构建后运行 `tools/benchmark-image.cjs`、`tools/benchmark-drawable.cjs`、`tools/benchmark-vertex-array.cjs` 可测当前实现。基准中的调用线程时间包含记录、提交和驱动工作，不能直接当作 GPU 时间或真实游戏帧率。

<a id="sfml-cpp-reference"></a>

## SFML C++ 参考

| 主题 | 上游类 |
| --- | --- |
| 图片与绘制对象 | [Image](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Image.html)、[Texture](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Texture.html)、[Sprite](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Sprite.html)、[Shape](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Shape.html) |
| 文字与相机 | [Font](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Font.html)、[Text](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Text.html)、[View](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1View.html) |
| 绘制与几何 | [RenderTarget](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1RenderTarget.html)、[RenderTexture](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1RenderTexture.html)、[Drawable](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Drawable.html)、[Shader](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Shader.html)、[VertexArray](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1VertexArray.html)、[VertexBuffer](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1VertexBuffer.html) |

上游文档可用于理解纹理坐标、变换、相机、混合与图元等渲染概念。JS 的资源构造、Promise 加载及 draw 快照与提交时机按本指南执行；C++ 示例中的同步文件构造不直接适用于本绑定。
