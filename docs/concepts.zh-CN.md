# 核心概念

[English](concepts.md) · **简体中文** · [日本語](concepts.ja.md) · [한국어](concepts.ko.md)

> 使用 sfml.js 时，先区分值、资源和视图，再区分命令录制、提交与呈现。这些边界决定了复制、异步加载和绘制的行为。

[文档首页](README.zh-CN.md) · [API 导航](api.zh-CN.md)

## 值、资源与视图

向量、角度、颜色、矩形、顶点和矩阵等值类型从 JS TypedArray 存储开始，数学计算在 JavaScript 中完成，需要原生句柄时才包装同一块内存。`Time` 使用微秒 `bigint`。

Texture、Image、Sprite、Text 和音频对象等资源由 Native 管理。JS 包装对象及存活视图共同保活相关分配；资源释放遵循所属线程与底层依赖的生命周期。

```typescript
import { FloatRect, Vector2f } from 'sfml.js';

const rect = new FloatRect(new Vector2f(10, 20), new Vector2f(100, 80));
const member = rect.position;
member.x = 30;                     // 成员视图，修改 rect。

const copy = new Vector2f(member);
copy.x = 90;                       // 独立副本，不影响 rect。

rect.position = new Vector2f(5, 6); // 按值复制，member 仍指向 rect 的成员。
```

普通 JS 赋值仍是引用赋值。需要独立值时使用复制构造；资源的复制规则按类区分，例如 `new Texture(texture)` 复制 GPU 内容，`new Sprite(sprite)` 复制精灵属性但共用纹理。

不要仅凭 `get...()` 判断返回值是否独立：

| 读取方式 | 所有权与更新行为 |
| --- | --- |
| `sprite.getPosition()` | 独立向量；修改结果后需调用 `setPosition()` |
| `rect.position`、`vertex.color` | 父值的成员视图；写入直接修改父值 |
| `image.pixels` | 当前图像分配的可写 RGBA 视图 |
| `target.getTexture()` | RenderTexture 的稳定只读纹理视图 |
| `vertexArray.getVertex(i)` | 当前顶点存储的成员；结构变化后应重新获取 |
| `soundBuffer.getSamples()` | 保活 PCM 分配的只读类型视图，空缓冲为 `undefined` |

Image 成功重载或 resize 后，旧像素视图继续保活旧分配，并不会自动改为新图像。VertexArray 扩容后旧成员也指向旧存储；在容量内缩小后重新扩大则可能复用槽位。

`ReadonlyValue`、`ReadonlyPixels`、`ReadonlySamples` 等约束主要通过 TypeScript 表达；不能把所有只读类型都理解为运行时冻结。需要修改只读数据时先复制，不要转移、分离或调整底层共享 buffer。

## 资源加载与 Promise

图片和纹理用 `loadFromFile/Memory/Stream()`，字体和音乐用 `openFromFile/Memory/Stream()`。这些入口返回 Promise：

```typescript
import { Texture } from 'sfml.js';

const texture = new Texture();
if (!await texture.loadFromFile('sprite.png')) {
  throw new Error('Cannot decode sprite.png');
}
```

Image／Texture 文件读取和解码在后台执行；纹理最终 GPU 上传仍在调用线程同步完成。`new Texture(image)`、像素上传及 GPU 读回是同步操作。异步加载失败通常保留旧资源，普通 SFML 失败返回 `false` 或 `undefined`。

同一图片或纹理上的多个异步加载按完成顺序发布结果。需要确定覆盖顺序时逐次 `await`，不要依赖发起顺序。

输入内存的所有权因模块而异：

| 输入 | 调用方的责任 |
| --- | --- |
| Image／Texture 的编码字节 | 调用时建立快照，后续可修改原输入 |
| `MemoryInputStream` | 保留原字节引用；加载期间保持内容不变，独占游标 |
| Audio 异步读写 | Promise 完成前保持相关缓冲不变 |
| `Music.openFromMemory()` | 输入保持不变，直到关闭或重新打开 |

流与音频对象的具体契约见 [System](system.zh-CN.md#input-streams) 和 [Audio](audio.zh-CN.md)。

<a id="draw-snapshots"></a>

## 绘制快照

`target.draw()` 记录调用时的属性和状态。修改原对象后再绘制，会得到另一份快照：

```typescript
import {
  Color, Image, RenderTexture, Sprite, Texture, Vector2f, Vector2u,
} from 'sfml.js';

const target = new RenderTexture(new Vector2u(64, 32));
const sprite = new Sprite(new Texture(
  new Image(new Vector2u(16, 16), Color.White),
));

target.clear();
sprite.setPosition(new Vector2f(0, 0));
target.draw(sprite);
sprite.setPosition(new Vector2f(32, 0));
target.draw(sprite);
target.display();
```

最终画面包含两个方块。Sprite 属性、RenderStates、顶点数据和所需资源引用在录制时保存；随后更改纹理像素、几何或 Shader uniform 时，绑定先提交依赖旧状态的命令。

| 操作 | 含义 |
| --- | --- |
| `clear()`、`draw()`、`setView()` | 按顺序录制命令；队列满时可能提前提交 |
| `flush()` | 同步提交已有命令 |
| `RenderWindow.display()` | 提交并交换窗口缓冲 |
| `RenderTexture.display()` | 提交并更新可采样纹理 |

`flush()` 不能替代离屏目标的 `display()`。使用 RenderTexture 的新内容之前先 display；直接采样自身纹理或建立未提交目标间的循环依赖会被拒绝。

批处理减少 JS／C++ 边界调用，并不会自动把多个 Sprite 合并成一次 GPU 绘制。大量共享纹理的几何可组织为 VertexArray；静态几何可使用 VertexBuffer。

## Node.js 事件循环

窗口操作在主线程执行。逐帧使用 `pollEvent()` 或 `handleEvents()`，并通过 `setImmediate()` 安排下一帧。

`waitEvent()` 保留 SFML 的同步等待语义。`sleep()` 使用 Node 定时器，返回 Promise；等待期间事件循环继续运行。`display()` 为同步方法，可能受到帧率限制、垂直同步和驱动工作的影响。

网络 I/O 返回 Promise。`socket.setBlocking(true)` 表示 Promise 等待操作就绪，不会同步阻塞整个 Node 线程。

Audio Worker 使用有界共享 PCM 槽位，回调视图只在本次回调完成前有效。后台 Worker 不独自维持进程；播放期间保留窗口循环或显式等待。

## 错误与清理

| 结果 | 处理方式 |
| --- | --- |
| `false`／`undefined`、SocketStatus、协议响应 | 检查返回状态 |
| `TypeError`／`RangeError` | 修正参数类型或范围 |
| `SFMLError` | 处理绑定或底层资源运行失败 |
| 用户回调抛错 | 原始错误对象继续传播 |

SFML 诊断默认写入 stderr，可用 `setErrorOutput()` 路由；日志不是返回值检查的替代品。

窗口使用 `close()`，网络对象使用各自的关闭接口，文件流和音频 Worker 的异步清理需要 `await`。仅依赖垃圾回收无法保证文件完成写入、连接及时结束或录音队列排空。资源的关闭方式见对应模块文档。
