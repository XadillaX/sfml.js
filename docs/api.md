# System、Window 与 Graphics

> TypeScript + NAN，使用 SFML 3.1.0 官方预编译包。当前包含 SFMLError、Time、Clock、TimeoutWithPredicate、SuspendAwareClock（仅 Android 支持读取）、Angle、Vector2、Vector3、Color、FloatRect、IntRect、Vertex、Transform、Glsl 向量和矩阵及对应方法、具名运算符，以及 InputStream、MemoryInputStream、FileInputStream、Window、VideoMode、Cursor、Event、Image、Transformable、Texture、Sprite、Shape、CircleShape、RectangleShape、ConvexShape、Font、Glyph、Text、VertexArray、VertexBuffer、PrimitiveType、Drawable、Shader、RenderStates、BlendMode、StencilMode、StencilValue、View、RenderTarget、RenderTexture 和 RenderWindow。Image 提供共享像素与异步编解码；Texture 支持异步加载、裁剪、局部上传、窗口复制、读回、交换、mipmap 和 OpenGL 绑定；Sprite 支持完整变换、纹理矩形、颜色、边界和复制；Shape 支持纹理、填充、轮廓、miter limit、边界与自定义点集；Font 支持异步加载、度量和字形图集，Text 支持 Unicode 排版、字形预处理和可编辑顶点。Drawable 支持同步组合绘制，Sprite、Shape、Text 与顶点绘制使用共享命令区批量提交。View 接入相机、视口与裁剪，RenderTarget 支持坐标转换、GL 状态管理和 GPU 顶点缓冲区绘制。

本文的命令均在仓库根目录执行，源码路径也相对于根目录。安装与使用见 [项目首页](../README.md)，仓库构建和演示命令见 [开发指南](development.md)。

Audio 已接入 SoundBuffer、SoundSource、Sound、SoundStream、Music、Listener、PlaybackDevice、SoundRecorder、SoundBufferRecorder、InputSoundFile、OutputSoundFile、SoundFileWriter、SoundFileReader 和 SoundFileFactory。自定义供数、采集处理与音效使用 Worker 和 Native fast buffer。完整接口、内存生命周期和示例见 [Audio 文档](audio.md)。`npm run demo:audio` 打开播放、流式供数、音效与录音的原生交互窗口。

Network 使用 Node.js 实现 IpAddress、Dns、Packet、Socket、TcpSocket／TLS、TcpListener、UdpSocket、SocketSelector 和 Http，FTP 使用 basic-ftp，SFTP 使用 ssh2。I/O 返回 Promise，Packet 按 SFML 格式编码；接口、内存、发送背压及兼容边界见 [Network 文档](network.md)。`npm run demo:network` 运行本地回环通信演示。

旧版 `example/` 对应的脚本位于 [examples/ported](../examples/ported/README.md)。14 个脚本完成必要 API 适配并保留原演示行为；2 个依赖旧 drawAsync/displayAsync 的脚本明确报告不支持。`npm run demo:ported` 打开原综合场景，`npm run test:ported` 分别报告通过和不支持；也可直接执行 `node examples/ported/<原文件名>.cjs`。

执行 `npm run demo:types` 打开 System、Window 和 Graphics 类型的综合渲染示例，添加 `-- --uncapped` 取消帧间等待，添加 `-- --frames=120` 绘制指定帧数后退出。已构建时可直接执行 `node examples/all-types.cjs --uncapped`。窗口左侧的独立值类型保持 JS TypedArray，右侧将持久值和成员视图包装为原生对象；两侧共用 Clock 产生的 Time，绘制相同的投影粒子、Rect 边界、颜色带、VertexArray／VertexBuffer 三角形、四类 Shape 和 Text。粒子坐标通过 Transform 和 Mat3 变换，颜色通过 Mat4 计算，Transformable 提供粒子 Sprite 的旋转和原点，Image 的共享像素参与纹理上传；MemoryInputStream 通过 InputStream 接口复制色带行，FileInputStream 在初始化时读取并验证示例文件头后关闭。VideoMode 和 Event 验证尺寸复制，Cursor 由 Window 保活，RenderWindow 验证关闭状态和 RenderTarget 类型。Shader 为三角形与 Shape 着色；Font 提供 Text 字形，Glyph 的 advance 参与字间距设置。Context 验证激活、身份与设置；TimeoutWithPredicate 验证固定周期与谓词，SuspendAwareClock 验证平台支持。场景由 Drawable 经 RenderTarget 展开，覆盖上述模块的 61 个导出类名（含 GLSL 别名和抽象基类，不计枚举、命名空间及 Version 类型）；Audio 使用独立演示与测试。

综合示例每秒比对两侧实际像素，核对右侧原生读回与旧视图，确认左侧值包装对象没有请求原生句柄。右侧通过 C++ 修改 Vertex.color，结果参与纹理颜色；两侧 VertexArray 均持有 Native 存储，右侧额外取得顶点成员的原生句柄。Glsl 作为 CPU 侧数据参与 Sprite 绘制，并通过 uniform 参与 Shader 着色。示例包含纹理更新、像素读回与断言，用于正确性验证。`npm run demo -- --uncapped` 仍用于原有精灵吞吐演示。设置 `SFML_DEMO_SNAPSHOT=/tmp/all-types.ppm` 可保存综合示例截图；Esc 或关闭窗口退出。

本机需要 Node.js、Python 和 C++ 编译工具链：macOS 使用 Xcode Command Line Tools，Linux 使用 GCC/Clang 与 make，Windows 使用 Visual Studio 2022 C++ Build Tools。

编辑原生代码使用 clangd。`npm run build:native` 完成后自动生成 `build/compile_commands.json`，`.clangd` 从中读取 C++20、SFML、NAN 和当前 Node.js 的编译配置。只更新语言服务配置时执行 `npm run configure:lsp`；编辑器仍显示旧诊断时执行命令面板中的 `clangd: Restart language server`。

下载流程按系统和架构选择 GitHub Release 预编译包，解压后链接动态库。包内头文件、库和依赖一起保存在 `third_party/sfml/`，版本与架构匹配时复用已有下载。下载地址在 `tools/lib_downloader_urls.cjs`，支持 macOS x64/arm64、Linux x64、Windows x64/ia32；需要镜像时可设置 `SFML_DOWNLOAD_MIRROR=https://hub.gitmirror.com`，作为官方 URL 的前缀。

当前绑定链接 `SFML System`、`SFML Window`、`SFML Graphics` 和 `SFML Audio`。原生模块位于 `build/Release/sfml.node`；macOS/Linux 使用相对运行时库路径，Windows 将 Graphics、Audio、Window 和 System DLL 复制到原生模块旁。

## 数值缓冲与所有权

Native 资源使用共享 BackingStore，JS 通过 TypedArray／DataView 读取与计算。资源映射由 `NumericFields` 和 `nativeStruct` 统一处理：成员指针确定地址和字段类型，相邻字段合并到同一缓冲，字符串和指针不暴露为字节。每个缓冲保活对应 Native 资源，GPU 资源在所属线程延迟销毁。

| 类型 | 数值存储 |
| --- | --- |
| Angle、Vector2／3、Color、Rect、Vertex、Glyph、Glsl 向量／矩阵、Transform | JS TypedArray 起步，按需包装 Native 句柄，共用已有字节 |
| Transformable、Sprite、Shape、Text | Native 变换、外观、文字属性、边界及几何字段；draw 录制快照 |
| Texture、RenderTexture、Font 图集 | 映射实际纹理尺寸、采样标志及 GL 名称；增长、交换、重建可直接读到 |
| Font | 映射 id、字距／竖排标志、smooth；family 保留为 JS string |
| Image | 尺寸和 RGBA 像素保活同一分配；resize／加载后旧视图继续有效 |
| VertexBuffer | 映射 Native 顶点数、图元、usage 和 GL 名称 |
| Shader | Native 程序名称缓冲，编译成功提交时更新 |
| VertexArray | Native 连续顶点存储，JS TypedArray 保存长度和图元 |
| View、RenderStates、BlendMode、StencilMode、StencilValue、VideoMode | 数值字段与嵌套值使用 TypedArray；引用和字符串保持 JS 对象 |
| Version、ContextSettings | Native 数值缓冲上的只读字段；Window 设置为独立快照 |
| RenderTarget、RenderTexture、RenderWindow | 172 字节命令布局和连续顶点快照缓冲 |

BlendMode、StencilMode、StencilValue、VideoMode 的公开可写数字使用 Float64 存储，保留 NaN、小数和越界值直到原有参数校验点；复制、枚举和冻结行为保持一致。Time、Clock 使用 bigint；实时设备查询、事件、流游标、回调与资源引用按各自接口管理。

## 错误日志流

`err(): Writable` 返回单例 Node Writable。`err().write(textOrBytes)` 写入实际 `sf::err()`，默认输出到原生 stderr；支持字符串、Buffer 和 Uint8Array。write 回调表示字节已交给 SFML 日志流，目标文件的完成状态通过目标 Writable 的事件判断。对这个单例调用 end／destroy 后，它遵循 Node 流的关闭语义。

| 调用 | 行为 |
| --- | --- |
| `setErrorOutput(writable)` | 将 SFML 内部日志和 err().write 输出到目标流 |
| `setErrorOutput(null)` | 静音 |
| `setErrorOutput()`／`setErrorOutput(undefined)` | 恢复原生默认输出 |

SFML 日志路由为进程级，主线程与 Node Worker 共用最近一次设置。后台线程先将字节复制到 Native 队列，再批量交给设置目标的 JS 线程；Buffer 直接持有队列字节，允许调用方保留。分块不保证 UTF-8 字符或行边界，文本消费者可使用 StringDecoder。Node 的 stderr 输出不受该路由影响。

切换输出时，当前 JS 线程已收到的 Native 队列交给原目标，调用方随后可自行 end 旧目标并等待 finished；其他 Worker 的旧队列仍交给其原目标。目标流由调用方管理，目标错误按 Node Writable 的 error 机制处理，绑定不将其转换为 SFMLError。原生写入失败通过 err() 的 write 回调与 error 事件报告 SFMLError。

空闲日志桥不阻止进程退出，正常退出在 beforeExit 排空 Native 队列。持有当前路由的 Worker 退出时恢复默认输出；其尚未派发的 Native 字节回到原始输出。强制进程退出不保证异步日志写完。

```typescript
import { createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import { err, setErrorOutput } from 'sfml.js';

const output = createWriteStream('sfml.log');
setErrorOutput(output);
err().write('SFML diagnostic\n');

setErrorOutput();
output.end();
await finished(output);
```

## Version、Clipboard、Context 与 Touch

`version()` 返回缓存的只读 `Version`：`major`、`minor`、`patch`、`isRelease`、`string`，读取运行时 SFML 版本。

`Clipboard.getString()`／`setString(text)` 直接调用 SFML，支持 JS Unicode string。剪贴板可用性由平台决定。

`Context` 支持默认构造或 `new Context(settings, size)`，构造后激活；`setActive(boolean)` 返回成功状态，`getSettings()` 返回实际只读设置。`Context.getActiveContext()` 返回当前线程的只读 Context 引用或 undefined；`getActiveContextId()` 返回 bigint，未激活时为 0n。Window 的 GL 上下文不保证存在对应的独立 Context 对象。

`Context.isExtensionAvailable(name)` 查询扩展，`getFunction(name)` 返回 bigint 函数地址或 undefined；调用地址需要匹配的原生 GL 签名。Context 构造和激活前提交待绘制命令。保留设置视图会保活所属 Context。

`Touch.isDown(finger)`、`Touch.getPosition(finger, relativeTo?)` 直接查询 SFML，位置返回独立 Vector2i。SFML 3.1.0 已弃用实时 Touch API；支持情况遵循平台，事件可使用 TouchBegan／TouchMoved／TouchEnded。

```typescript
import {
  Vector2, Vector2i, Vector2u, Vector2f, Texture, Sprite, RenderTexture,
  Angle, degrees, Vector3f, Color, FloatRect, IntRect, Vertex, Transform,
  Time, Clock, seconds, milliseconds, microseconds, Glsl, Transformable,
  TimeoutWithPredicate, SuspendAwareClock,
  add, addAssign, multiply, divide,
} from './src';

const origin = new Vector2('i32');      // Vector2<'i32'>，(0, 0)
const position = new Vector2i(10, 20);  // Vector2<'i32'> 的便捷类
const size = new Vector2u(640, 480);
const velocity = new Vector2f(0.1, 0.2);

position.x = 30;                       // 始终直接写 TypedArray
const copy = new Vector2i(position);   // 独立存储
const genericCopy = new Vector2(position); // 保留 'i32' 类型
const converted = new Vector2i(velocity);  // 显式转换到 i32
const alias = position;                // 普通 JS 引用

const a = new Vector2i(3, 4);
const b = new Vector2i(2, 3);
const squared = a.lengthSquared();     // 25
const dot = a.dot(b);                  // 18
const cross = a.cross(b);              // 1
const normal = a.perpendicular();      // (-4, 3)
const product = a.componentWiseMul(b); // (6, 12)
const quotient = a.componentWiseDiv(b); // (1, 1)

const heading = degrees(90);
const polar = new Vector2f(2, heading); // 极坐标构造
const rotated = velocity.rotatedBy(heading);
const unit = new Vector3f(1, 2, 3).normalized();
const total = add(unit, new Vector3f(1, 0, 0)); // 新对象
addAssign(total, unit);                // 原位写入，返回 total
const scaled = multiply(2, total);     // 两种标量乘法顺序均支持
const ratio = divide(heading, degrees(45)); // 2
const zeroCopy = new Angle(Angle.Zero); // 可修改副本

const tint = new Color(0x12345678);    // RGBA=(18, 52, 86, 120)
const tintCopy = new Color(tint);     // 独立的 4 字节存储
tintCopy.a = 255;
const modulated = multiply(tintCopy, Color.White);
addAssign(tintCopy, new Color(20, 30, 40, 0)); // 逐通道饱和加法

const bounds = new FloatRect(new Vector2f(10, 20), new Vector2f(100, 80));
const member = bounds.position;       // 成员视图，共享矩形的内存
member.x = 30;                        // 同时修改 bounds.position.x
bounds.position = velocity;           // 拷贝坐标，member 仍指向原成员
const boundsCopy = new IntRect(bounds); // 转换并创建独立矩形
const inside = bounds.contains(velocity);
const center = bounds.getCenter();    // 独立 Vector2f
const overlap = bounds.findIntersection(new FloatRect(
  new Vector2f(50, 50), new Vector2f(100, 80),
));                                  // 独立 FloatRect 或 undefined

const vertex = new Vertex(bounds.position, Color.White, new Vector2f(0, 0));
const vertexColor = vertex.color;     // 原生顶点内的 Color 视图
vertex.color = tint;                  // 只复制 RGBA，已有视图继续有效
vertexColor.a = 128;                  // 修改顶点，不影响 tint
addAssign(vertex.position, velocity);
const vertexCopy = new Vertex(vertex); // 独立的 20 字节副本

const uniformPosition = new Glsl.Vec2(velocity); // Vector2f 的原样别名
const flags = new Glsl.Bvec3(true, false, true); // 3 个 0/1 字节
const numericFlags = new Glsl.Ivec3(flags);      // (1, 0, 1)
const uniformColor = new Glsl.Vec4(Color.Red);   // (1, 0, 0, 1)
const rgba = new Glsl.Ivec4(Color.Red);          // (255, 0, 0, 255)
const mask = new Glsl.Bvec4(uniformColor);       // (true, false, false, true)

const transform = new Transform()
  .translate(new Vector2f(100, 50))
  .rotate(degrees(30))
  .scale(new Vector2f(2, 3));
const matrix = transform.getMatrix();          // 缓存的只读实时数组，16 项
const transformedPoint = transform.transformPoint(velocity);
const transformedBounds = transform.transformRect(bounds);
const inverse = transform.getInverse();        // 独立可变 Transform
transform.translate(new Vector2f(1, 0));        // matrix 自动反映同一存储的新值

const uniformMatrix3 = new Glsl.Mat3(transform); // 独立的 9 个 float
const uniformMatrix4 = new Glsl.Mat4(transform); // 独立的 16 个 float
const matrixCopy = new Glsl.Mat3(uniformMatrix3);
const elements = uniformMatrix3.array;         // 可写 Float32Array，列主序
elements[6] = 100;                             // 第三列第一行
uniformMatrix3.array = [ 1, 0, 0, 0, 1, 0, 5, 6, 1 ]; // 原位复制
// elements 仍访问同一存储；修改矩阵不影响来源 transform。

const clock = new Clock();             // 创建后立即计时
const duration = new Time(1234567n);    // 微秒 bigint，纯 JS 存储
const interval = milliseconds(16);
const precise = multiply(duration, 3n); // int64 精确乘法
const approximate = multiply(duration, 0.5); // SFML float32 秒运算
const durationRatio = divide(duration, seconds(1));
addAssign(duration, microseconds(1n));
clock.stop();
const elapsed = clock.getElapsedTime(); // 独立 Time，暂停期间保持不变
clock.start();                          // 恢复，排除暂停期间的时长
const frameTime = clock.restart();      // 返回原耗时，清零并开始
const beforeReset = clock.reset();      // 返回原耗时，清零并暂停

const fixed = new TimeoutWithPredicate(milliseconds(500));
const polling = new TimeoutWithPredicate(() => clock.isRunning());
const timeoutCopy = new TimeoutWithPredicate(polling);
fixed.getPeriod().asMicroseconds();     // 500000n，只读 Time
fixed.getPredicate()();                // false
polling.getPeriod().asMicroseconds();   // 1000n，默认检查周期
const predicate = polling.getPredicate(); // 原函数，调用时才求值
if (process.platform === 'android') {
  const stamp: bigint = SuspendAwareClock.now(); // 原生时钟的纳秒时间点
}

// 准备资源时进入 C++，循环中复用对象。
const texture = new Texture(new Vector2u(1, 1));
texture.update(new Uint8Array([ 255, 0, 0, 255 ]));
const sprite = new Sprite(texture);
const target = new RenderTexture(new Vector2u(8, 4));
const point = new Vector2f(1, 1);
const pose = new Transformable();
pose.setRotation(degrees(30));
pose.setOrigin(new Vector2f(0.5, 0.5));
sprite.setRotation(pose.getRotation());
sprite.setOrigin(pose.getOrigin());
sprite.setScale(new Vector2f(2, 1));

target.clear(Color.Black);            // 记录颜色快照；省略参数也用黑色
sprite.setPosition(point);            // 直接写共享状态
target.draw(sprite);                  // 记录位置、旋转、缩放和原点
point.x = 5;
sprite.setPosition(point);            // 直接写共享状态
sprite.rotate(degrees(60));
target.draw(sprite);                  // 保存第二份完整变换，第一份不受影响
target.display();                     // 一次原生提交，完成两次实际绘制
```

`Vector2<T>` 和 `Vector3<T>` 支持以下十种数值标量。各特化在 TypeScript 中不能隐式互换；通过构造函数显式转换。i32／u32／f32 提供 i／u／f 便捷类，其余类型使用 `new Vector2(type, …)`／`new Vector3(type, …)`。

| 标量标签 | 分量类型 | 连续存储 |
| --- | --- | --- |
| `i8`／`u8` | number | Int8Array／Uint8Array |
| `i16`／`u16` | number | Int16Array／Uint16Array |
| `i32`／`u32` | number | Int32Array／Uint32Array |
| `i64`／`u64` | bigint | BigInt64Array／BigUint64Array |
| `f32` | number | Float32Array |
| `f64` | number | Float64Array |

```typescript
const precise = new Vector2('f64', 0.1, 16777217);
const counters = new Vector3('u64', 9007199254740993n, 2n, 3n);
const scaled = multiply(counters, 3n); // bigint 标量
const bytes = new Vector2('u8', 255, 0);
const converted = new Vector2('i16', bytes); // 独立副本
const position = new Vector2f(precise); // 显式转换后传给图形 API
```

64 位整数的分量、dot、二维 cross 和 lengthSquared 均返回 bigint，运算不经过 number。整数存储按其位宽保留低位；跨类型整数转换先缩窄再转 number，i64／u64 转 f32 直接舍入到 float32。浮点转整数截断小数，转换成 bigint 时拒绝 NaN 和 Infinity。C++ 有符号算术溢出及浮点转整数超范围不作等价保证。浮点专属方法适用于 f32／f64；Angle 仍使用 float32，极坐标构造和旋转分别遵循 SFML 的三角函数精度规则。图形 API 继续要求其声明的 f32／i32／u32 向量。long double 和自定义模板类型未接入。

Angle、Vector2、Vector3、Color、FloatRect、IntRect、Vertex、Transform、Glsl 向量和矩阵共用内部 `LazyValue`，从构造开始就持有 JS TypedArray。构造、复制、数学方法、运算符和成员视图均不创建原生句柄。属性始终直接访问数组，没有 JS 字段与原生内存的状态分支。分量赋值由对应 TypedArray 处理；同标量向量复制保留全部位模式。Native 模板按分量位宽映射实际 SFML 对象，首次包装复用已有 BackingStore。

`Transform` 支持默认、复制和 9 个行主序参数构造，内部按 SFML 保存为 64 字节的列主序 Float32Array。`getMatrix()` 返回缓存的 `readonly number[]` 实时视图：数组及索引不可写，JS/C++ 修改和 lazy 包装后仍反映同一存储，视图也能独立保活数据；数学计算直接使用内部 TypedArray。复制保留浮点位模式，`Transform.Identity` 禁止修改。

`combine`、`translate`、`rotate`、`scale` 原位修改并返回自身；旋转接受 Angle，旋转和缩放支持可选中心点。组合为右乘，`translate(...).scale(...)` 对点先缩放再平移。`multiply` 支持 Transform × Transform 和 Transform × Vector2f，`multiplyAssign` 只接受两个 Transform，`equal/notEqual` 比较 SFML 的 9 个有效分量。`getInverse()` 在 float32 行列式恰好为零时返回独立的单位变换，不使用 epsilon；`transformPoint()` 与 SFML 一致，不做透视除法；`transformRect()` 变换四个角并返回包围矩形。非三角运算逐步保留 float32 舍入，旋转与预编译 SFML 的 libm/FMA 结果允许有限浮点误差。

通过 `Glsl` 命名空间访问 `Vec2/3/4`、`Ivec2/3/4`、`Bvec2/3/4`，大小写与 SFML 一致。`Vec2/3` 和 `Ivec2/3` 直接复用已有向量构造函数。`Bvec2/3/4` 用 Uint8Array 保存 0/1，对外读写 boolean；非零数值（包括 NaN）转换为 true。各维度支持默认、分量、复制和跨标量构造，维度之间不能互换。布尔向量的 C++ 布局在编译时校验为每个分量 1 字节，包装前拒绝非 0/1 数据。

`Bvec2/3` 支持非浮点专属的向量方法及具名运算符，乘除标量为 boolean，除以 false 抛出 RangeError。计算先按 C++ 整数提升，再转换回 boolean，例如 true + true 为 true、true - true 为 false。四维类型按 SFML 仅提供分量与构造转换，不提供向量数学方法、算术或比较运算符。`Vec4(Color)` 将通道除以 255 并舍入到 float32，`Ivec4(Color)` 保留 0～255 整数；`Bvec4` 不接受 Color。四维类型的原生创建、包装、读取和保活共用 `Vector4Values`，二维和三维布尔类型分别加入现有向量 family。

`Glsl.Mat3/Mat4` 分别使用 36、64 字节的列主序 Float32Array。构造接受恰好 9／16 个数值的 `ArrayLike<number>`、同尺寸矩阵或 Transform，均按值复制；不提供默认构造、跨尺寸转换或运算符。从 Transform 构造 Mat3 时取索引 `[0, 1, 3, 4, 5, 7, 12, 13, 15]`，Mat4 复制全部 16 项。浮点数组、同尺寸矩阵和 Transform 转换保留 float32 位模式。

矩阵 `.array` 直接返回可写 TypedArray，整体赋值先校验长度与元素类型，再原位复制；已有数组在赋值和原生包装后继续有效。`ReadonlyValue<Glsl.Mat3/Mat4>` 在类型层限制数组替换、索引写入、修改方法及可写别名，允许迭代和创建独立副本的 `slice()`。Mat3 与 Mat4 使用各自的强类型句柄，按需复用原 BackingStore。

只有首次请求根值的内部原生句柄才会调用对应的 `wrap*`。C++ 校验原 ArrayBuffer 的大小、对齐、固定容量和未分离状态，在原有 BackingStore 上开始真实 SFML 对象生命周期，并通过别名 shared_ptr 持有该 BackingStore。返回的新 ArrayBuffer 复用同一个 BackingStore；TS 仅替换当前数组视图，升级前取得的数组和 buffer 继续访问同一块内存。升级不分配另一份值存储，也不改变 JS 对象身份。

普通包装对象在升级后由 `nativeValue()` 将内部句柄 getter 替换为缓存属性；提前冻结或禁止扩展的包装对象保留 getter，复用 state 内的句柄。存储 getter 始终只返回当前数组，不触发原生包装。成员视图先通过 TypedArray.subarray 共享父值的 buffer 和偏移；请求成员原生句柄时，先包装父值，再通过 `rectMember` 或 `vertexMember` 取得成员别名，不单独构造成员 SFML 对象。

成员初始化器只引用父 state，不引用父 JS 包装对象；完成初始化后释放该引用，由原生所有权保活存储。父 JS 包装对象可以先被回收，成员随后仍能升级。内部代码使用视图的 `byteOffset` 和 `byteLength` 确定成员区间，不能假定其 buffer 只包含该成员。赋值统一通过 TypedArray.set 复制，保留负零和 NaN 位模式，不为来源创建句柄。

两种向量均支持 `lengthSquared`、`dot`、`cross`、逐分量乘除；Vector2 另有 `perpendicular`。浮点向量支持 `length`、`normalized`；Vector2f 还支持极坐标构造、`angle`、`angleTo`、`rotatedBy`、`projectedOnto`。整数向量调用浮点专属方法会被类型检查拒绝，JavaScript 调用则抛出 `TypeError`。

运算符按 API 草案映射为自由函数：`add`、`subtract`、`negate`、`multiply`、`divide`、`equal`、`notEqual`。Time 和 Angle 另有 `modulo`、`less`、`lessEqual`、`greater`、`greaterEqual`。普通运算产生独立对象；`addAssign`、`subtractAssign`、`multiplyAssign`、`divideAssign`、`moduloAssign` 直接修改值的内部存储并返回左操作数，不分配原生对象、不调用 NAN。向量只支持与标量相乘或相除，逐分量运算使用成员方法。类型检查与运行时检查均拒绝混用不同值类型、维度或标量类型。

运算直接在 TypeScript 中计算，返回向量时保留标量类型和便捷类。除数按目标标量类型转换后检查，零除数抛出 `RangeError`；归一化拒绝零长度，角度计算拒绝零向量，投影拒绝零轴。整数除法向零截断，结果存储按对应位宽回绕。float32 乘积与加减中间结果分别舍入，f64 使用双精度；Vector3 点积从左向右求和，长度使用 SFML 的平方和开方。原生对照代码关闭 FMA 合并；有符号整数溢出属于 C++ 未定义行为，不作等价保证。三角函数使用 JS Math，可能与系统 libm 相差少量 ULP；测试对三角函数结果使用相对／绝对容差，其余基础算术逐值比较。

Angle 使用一个元素的 Float32Array，对应 `sf::Angle` 的 4 字节布局。使用 `degrees()`、`radians()` 构造，或 `new Angle(source)` 复制；提供 `asDegrees()`、`asRadians()`、`wrapSigned()`、`wrapUnsigned()`。角度比值返回 number，比较不会自动折回一圈。取模要求正除数，按 SFML 的 float32 商转 int32 算法计算；超出该转换定义域时抛出 `RangeError`。`Angle.Zero` 是只读常量，`ReadonlyValue<T>` 可表达只读值；`*Assign` 在类型层拒绝只读值，并在运行时保护冻结对象。

Time 在 JS 中保存有符号 int64 范围的微秒 `bigint`。支持默认、复制和 `new Time(microseconds)` 构造，以及 `seconds(number)`、`milliseconds(number)`、`microseconds(bigint)` 工厂。`asMicroseconds()`、`toDuration()` 返回微秒 `bigint`，后者对应 `std::chrono::microseconds`；`asSeconds()` 返回 float32 精度的秒，`asMilliseconds()` 向零截断后按 int32 窄化。毫秒工厂将参数向零截断并检查 int32 范围。`Time.Zero` 为冻结的只读常量，副本和运算结果仍可修改。

Time 的整数标量重载使用 `bigint`，浮点标量重载使用 `number`。浮点乘除遵循 SFML 的「转 float32 秒、计算、转微秒」步骤；大整数转 float32 直接按有效位舍入，避免经过 JS number 引入二次舍入。Time 除以 Time 返回 float32 比值，取余保留被除数的符号。零除数、非有限浮点值、超出 int64 的结果，以及最小 int64 对 `-1n` 的除法或取余均抛出 `RangeError`；失败的原位运算保留原值。

Time 的构造、复制和运算均不创建原生句柄、共享内存或原生缓存。原生边界通过 `native/time-value.h` 校验微秒 `bigint`，按值构造局部 `sf::Time`；返回值通过同一辅助文件转成微秒 `bigint`。Audio 使用 Time 表示播放位置和时长，Network 将 Time 转换为 Node 异步等待期限。

`sleep(duration: ReadonlyValue<Time>): Promise<void>` 使用 Node `timers/promises.setTimeout` 异步等待，例如 `await sleep(milliseconds(16))`。等待期间事件循环继续运行；时长在调用时读取，后续修改 Time 不影响本次等待。零和负时长直接完成，正时长向上取整到毫秒，超过 Node 单次定时器上限的时长分段等待。实际恢复时间受事件循环和系统调度影响。这里采用异步等待语义，C++ `sf::sleep()` 的同步线程阻塞语义不适用。

Clock 使用 `process.hrtime.bigint()` 保存纳秒起点及暂停时刻，返回 Time 时才除以 `1000n` 截断为微秒，暂停与恢复之间保留不足一微秒的部分。支持默认和复制构造、`getElapsedTime()`、`isRunning()`、`start()`、`stop()`、`restart()`、`reset()`；重复 start 或 stop 不改变已有状态。复制保留计时起点及暂停状态，之后独立运行；返回的 Time 均为独立快照。Clock 没有原生对象或定时器，原始时间戳只用于自身的时间差计算，不与 SFML 内部时钟交叉相减。单调时钟的实际分辨率及系统休眠语义由 Node.js 和平台决定。

TimeoutWithPredicate 在 JS 中保存谓词和独立的 Time 副本。`new TimeoutWithPredicate(time)` 将该时长作为周期，并提供始终返回 false 的谓词；`new TimeoutWithPredicate(predicate, period?)` 保存原函数，默认周期为 `milliseconds(1)`，`null` 对应空 `std::function`，同样使用返回 false 的谓词。`new TimeoutWithPredicate(source)` 复制周期并保留谓词身份。周期接受 Time 的全部有符号 int64 值，包括零和负值，不进行钳制。

`getPredicate()` 返回同一个原函数，类型为 `TimeoutPredicate = () => boolean`，true 表示继续，false 表示超时结束。构造、复制与 getter 不调用谓词；主动调用时，返回值和 JS 异常原样传递，也不记忆上次的 false。`getPeriod()` 返回稳定的冻结 Time，类型为 `ReadonlyValue<Time>`；需要修改时使用 `new Time(timeout.getPeriod())`。对象自身没有计时器、截止时间或调度行为。等待、检查时机与结束操作由接收它的业务接口负责；周期只是检查频率提示，具体操作可以不遵守。Sftp 接收该配置，在无进展等待达到周期时检查谓词；具体行为见 Network 文档。

SuspendAwareClock 对应 SFML 的 Android 专用时钟。`is_steady` 为 true，`now()` 返回从原生时钟纪元起算的纳秒 `bigint`，对应 `std::chrono::time_point<SuspendAwareClock, std::chrono::nanoseconds>`。Android 分支直接调用 `sf::SuspendAwareClock::now()`，底层使用包含系统休眠时间的 `CLOCK_BOOTTIME`；macOS、Windows 和桌面 Linux 调用时抛出 `SFMLError`，说明仅支持 Android。时间点使用同一时钟相减得到纳秒时长；如需 Time，显式除以 `1000n` 后构造。现有下载与构建流程面向桌面，Android 分支尚未经过设备运行验证。

Color 使用四个元素的 Uint8Array，默认不透明黑色；`r/g/b/a` 对应偏移 0/1/2/3，原生包装复用同一份数据。支持默认构造、RGB/RGBA 分量构造、`0xRRGGBBAA` 整数构造和复制构造；复制通过 `Uint8Array.set()` 完成。属性写入按 uint8 转换，超范围整数回绕、小数向零截断；使用普通 `Uint8Array`，不使用 `Uint8ClampedArray`。整数拆分和 `toInteger()` 均在 JS 中显式位移，不依赖主机大小端。

Color 的 `add`、`subtract` 分别饱和到 255 和 0；`multiply` 按通道计算 `floor(a * b / 255)`，alpha 也参与运算。三者提供 `*Assign` 版本，另有 `equal`、`notEqual`；不提供标量乘法、除法或大小比较。普通运算创建独立的 JS 数组，原位运算复用已有数组，均不调用 NAN。测试穷举全部 65,536 种通道配对，与 SFML C++ 结果逐值比较。

`Color.Black/White/Red/Green/Blue/Yellow/Magenta/Cyan/Transparent` 初始化一次，类型为 `ReadonlyValue<Color>`。常量实例冻结，setter 和原位运算均拒绝修改；复制常量得到可修改的独立对象。Color 常量和 `Angle.Zero` 导入时只创建 JS 存储，原生句柄仍按需初始化并缓存。底层视图和句柄属于内部绑定接口，不对包使用者公开。

FloatRect、IntRect 对应 `sf::Rect<float>`、`sf::Rect<int>`，共享连续 16 字节；`position`、`size` 分别占偏移 0、8 的两个 Vector2。支持默认构造、位置与尺寸构造、复制构造及两种特化的显式转换。整数转换向零截断，浮点转换按 float32 舍入。

成员 getter 首次访问时在 JS 中创建并缓存 8 字节向量视图；视图保持 Vector2f 或 Vector2i 的完整方法和运算符。成员赋值直接复制坐标，不创建视图、不改变已缓存视图的身份，也不与来源建立别名。构造矩形、交集结果及中心向量均只分配 JS 存储。`ReadonlyValue<T>` 递归限制成员写入，仍允许只读矩形的 `getCenter()`、`findIntersection()` 返回可修改的独立值。

`contains()` 包含归一化边界的左边、上边，排除右边、下边；负尺寸按实际最小值和最大值计算。`findIntersection()` 返回正面积的独立矩形，无交集、零面积或仅边界接触时返回 `undefined`。`getCenter()` 按 `position + size / 2` 计算，IntRect 先将尺寸除以 2 向零截断，再加位置。`equal()`、`notEqual()` 比较原始位置和尺寸，几何覆盖相同的负尺寸矩形不一定相等。几何计算均在 JS 中完成，浮点中间结果与 SFML 3.1.0 逐值对照；有符号溢出和超出 int32 范围的浮点转整数不作 C++ 等价保证。

Vertex 对应 `sf::Vertex`，占连续 20 字节：`position` 为偏移 0 的 Vector2f，`color` 为偏移 8 的 Color，`texCoords` 为偏移 12 的 Vector2f。默认位置和纹理坐标为 `(0, 0)`，颜色为白色。支持默认构造、`Vertex(position, color?, texCoords?)` 和复制构造；省略颜色但指定纹理坐标时传入 `undefined`。构造默认值与各参数组合由 SFML 聚合初始化对照验证。

三个成员 getter 首次访问时在 JS 中创建并缓存视图，复用 Vector2f、Color 的属性、方法和具名运算符；Vertex 本身不提供算术或相等运算符。成员赋值直接复制对应的 8、4、8 字节，保留已有视图，也不修改相邻成员。`new Vertex(source)` 直接复制全部 20 字节，保留浮点位模式和 RGBA 内容，不创建临时向量或颜色。`ReadonlyValue<Vertex>` 递归限制三个成员的修改，复制成员或整个顶点仍得到可修改的独立值。Vertex 可作为 VertexArray 的共享成员，也可组成普通数组交给 RenderTarget 绘制。

所有 TypedArray 值类型的根句柄都别名引用已有 BackingStore 的控制块，不再分配对象本体或另设 SFML 所有权控制块，并统一使用 `SharedHandle<sf::类型>`。Vector2、Vector3 的 i/u/f 特化分别使用强类型句柄，Rect 的两种特化也保持区分。坐标的日常读写不调用原生函数，编译时检查结构大小及成员偏移。

Rect 和 Vertex 通过同一个 `ReturnMember` 辅助函数，以 `shared_ptr` 别名构造指向真实 SFML 成员，共用父对象的控制块，不额外分配向量、颜色或控制块。独立值与成员视图使用同一套原生句柄接口。成员包装对象不引用父 JS 包装对象；父包装对象回收后，存活的成员视图、成员原生句柄或 BackingStore 仍保持父对象的原生内存有效。

值类型绑定按职责组织：

- `src/internal/lazy-value.ts`：始终存在的 TypedArray、一次性原生初始化、句柄缓存及成员初始化器释放。
- `native/shared-handle.h`：强类型句柄和 BackingStore 所有权。
- `native/deferred-delete.h/.cc`：图形资源的所属线程回收队列。
- `native/value-layout.h`：每种值的字节数、成员偏移断言、标量类型及成员指针列表。
- `native/value-binding.h`：`Family` 统一类型选择、创建、已有 BackingStore 包装和句柄分派；`ReturnMapped` 映射或复用 BackingStore，`Member` 创建成员视图。
- `native/values-binding.cc`：注册创建、包装和成员视图入口。
- `native/time-value.h`：Time 与微秒 bigint 的按值转换，无原生所有权。
- `native/system-binding.cc`：SuspendAwareClock 的平台条件编译与纳秒 bigint 返回。
- `test/native/time-probes.cc`：Time 数值、边界转换及 Clock 状态的 C++ 对照。
- `test/native/system-probes.cc`：TimeoutWithPredicate 构造、复制与谓词调用，以及 Android 时钟的 C++ 对照。
- `test/native/transform-probes.cc`：Transform 矩阵读写、逆变换、组合、点/矩形变换及预编译库旋转对照。
- `test/native/matrix-probes.cc`：Glsl 矩阵读写、原始数组和 Transform 构造的 C++ 对照。
- `test/native/value-probes.cc`、`value-oracle.h`：读取、改写、生命周期探针和 SFML C++ 运算对照。探针当前仍随 addon 编译，由独立的 `InitializeValueProbes` 注册。

新增值类型时，先声明 `Layout<T>`，再加入对应 `Family` 并注册 `Wrap`，JS 端通过 `LazyValue` 持有初始化数组及包装函数。单类型 Wrap 接收 buffer，多标量特化接收 scalarType 和 buffer。包装通过 `std::bit_cast` 和平凡复制构造开始对象生命周期，无需类型提供默认构造函数。复合值在布局中按 TS 成员索引顺序列出成员指针，注册 `Member<Values>`；JS 子视图的初始化器先请求父 state 的句柄，再取得成员别名。`Create` 入口仅用于具有默认构造函数的原生探针。布局和类型选择通过 C++ 模板展开，不引入运行时类型注册表。

`native/addon.cc` 负责模块初始化、版本信息和动态库探针。原生消费者从句柄取得一次所有权引用后，可以持续直读 C++ 对象，无需反查 ArrayBuffer 或 BackingStore。JS 视图与原生持有者可以独立释放，最后一个 buffer 或原生持有者释放后才回收底层存储。

图形上下文、Sprite、Texture、VertexBuffer、Shader、RenderTexture 和预览窗口使用 `MakeThreadOwned` 管理原生所有权。最后一个引用由 V8 后台 ArrayBuffer 回收线程释放时，只将对象指针和析构函数加入所属 Node 环境的队列，通过 `uv_async` 唤醒 JS 线程执行析构及资源表移除；同线程释放立即执行。普通值、像素和顶点字节存储仍按原方式释放，共享内存布局和逐次绘制路径不变。

每个 Node Worker 有独立队列，通知句柄不阻止进程退出。环境退出时排空队列并在所属线程关闭预览窗口；之后仍被 BackingStore 保活的资源，在最后一个引用释放时串行析构，不再访问已关闭的事件循环。weak_ptr 失效与资源表移除不是同一时刻，生命周期测试分别等待两者完成。

数组和原生句柄通过内部 symbol 供绑定访问，包入口不导出这些 symbol。当前在 macOS arm64、Node.js 22.22.2 上验证通过；其他平台尚未实机验证。

`Transformable` 和 Sprite 共用 `src/internal/transformable.ts` 的 TS 混入。支持位置、旋转、缩放、原点的 set/get，以及 `move()`、`rotate()`、`scale()`；修改方法返回 void。位置／缩放／原点接受 Vector2f，旋转接受 Angle，并按 SFML 的 wrapUnsigned 规则归一化。getPosition/getScale/getOrigin/getRotation 返回独立值，不创建原生值句柄。`new Transformable(source)` 可以从 Transformable 或 Sprite 的当前暂存状态复制，得到独立原生对象。

每个 Transformable 资源在创建时由 C++ 分配 28 字节暂存区，按 `position.x/y、rotation、scale.x/y、origin.x/y` 存放 7 个 float，默认值为 `[0, 0, 0, 1, 1, 0, 0]`。JS 始终通过 Float32Array 直接更新，setter 不调用 NAN、不计算矩阵。Sprite 的原生对象同时继承 sf::Sprite 与 TransformableState，通过 static_cast 调整基类指针；两个原生句柄与暂存区共享同一个控制块，任一存活引用都能保活 Sprite 和纹理。

`getTransform()`、`getInverseTransform()` 在 JS 按需计算，返回缓存的 `ReadonlyValue<Transform>`。查询时比较 7 个暂存分量，变化后原位更新缓存，兼容 C++ 对共享状态的修改。重复查询保留对象身份；旧 getMatrix 视图和已包装的矩阵句柄在重新查询后反映新值。矩阵副本使用 `new Transform(source)` 创建。缩放为零时逆变换遵循 SFML 返回单位矩阵；浮点三角函数与预编译 SFML 的 libm/FMA 允许有限误差。

`RenderTarget.clear()` 和 Sprite 的叶子绘制写入 C++ 预分配的命令区。每条命令 172 字节，包含操作码、对象编号或 RGBA、绘制时 7 个 float 的局部变换快照、16 个 float 的父变换矩阵、6 个 uint32 混合字段和 5 个 uint32 模板字段，随后 24 字节保存 Sprite 的纹理 ID、矩形和颜色，末尾 4 字节保存 Shader ID。Sprite 用 TypedArray.set 直接写共享内存，不分配 JS 快照对象、不逐次进入原生层；自定义 Drawable 回调会创建状态副本。`clear(color)` 在 JS 中把 `color.toInteger()` 写入命令区；之后修改或回收源颜色都不影响已记录的命令。`display()` 一次传入目标句柄、命令数和 display 标志，C++ 从原生对象表取得 Sprite、纹理与 Shader，按顺序应用快照及 RenderStates 并调用 SFML draw，最后执行 display。执行期间不逐个访问 V8 对象；每次绘制后恢复该 Sprite 最新的变换、纹理、矩形和颜色。

`native/batch-drawable.h/.cc` 定义 `BatchDrawable final : public sf::Drawable`。每个 RenderTextureState 内嵌一个独立实例，持有固定容量的命令区；JS 的 TypedArray 映射这块存储，BackingStore 保活其所属目标。批次对象禁止复制和移动，命令区不扩容，提交后继续使用原地址。资源引用数组在构造时预留容量，提交期间解析并持有 Sprite，结束后释放引用并重置有效命令数，保留数组容量供下次使用。

`BatchDrawable::Submit()` 先校验整批命令，再通过原生 `target.draw(*this)` 进入覆盖的 `draw()`，依次执行 clear、模板操作、Sprite 和顶点绘制。拒绝非法命令时不改变画面，已解析的资源引用也会释放；执行异常时同样清理临时引用并恢复 Sprite 最新暂存状态，已经发生的绘制不回滚。RenderTextureState 负责提交后的 display 和预览。BatchDrawable 使用每条命令保存的完整状态，内部提交采用默认外层 RenderStates。

通常一帧只在 `display()` 进入原生层。命令区装满 4096 条时会提前提交一批；Texture 上传像素、resize、swap、生成 mipmap 和切换采样设置前会先提交待绘制命令，避免改变先前 draw 使用的像素或采样方式。这些提前提交不执行 `display()`。公开 `flush()` 提交当前命令，空队列时不调用原生层；需要取得 RenderTexture 最新可采样纹理或执行内部像素读回时，仍先调用 `display()`。图形资源创建、像素上传，以及首次请求值类型的原生句柄会进入原生层；仅构造值或读写成员不会。

图形接口包含下文的 Texture、Sprite、Transformable 和 RenderTexture，以及 RenderTarget 的 `clear()`、`clearStencil()`、`draw(drawable, states?)`、`flush()`。`clear()` 接受 Color 或只读 Color，默认 `Color.Black`。Window 提供下文列出的创建、关闭和 OpenGL 上下文接口。离屏测试读取实际渲染像素，并与直接执行 SFML draw 的 C++ 对照比较；macOS 需要可用图形会话，Linux 需要可用的显示服务和 OpenGL 上下文。

## 错误处理

`SFMLError extends Error` 表示 SFML 绑定层的运行失败，`name` 为 `SFMLError`，保留 `message` 和 JS `stack`，可使用 `instanceof SFMLError` 判断。

| 来源 | 同步行为 | 异步行为 |
| --- | --- | --- |
| SFML 异常、C++ 标准异常、绑定层运行失败 | 抛出 SFMLError，保留错误信息 | Promise reject SFMLError |
| 非标准 C++ 异常 | 抛出 SFMLError，信息为 `Unknown native exception` | Promise reject SFMLError |
| 参数类型或范围错误 | 抛出 TypeError／RangeError | Promise reject 对应错误 |
| 用户事件、绘制、字形预处理或输入流回调抛错 | 原样传递错误对象 | Promise reject 原始错误对象 |
| SFML 返回失败状态 | 保留 false／undefined | Promise resolve false／undefined |

```typescript
import { Image, Texture, SFMLError } from 'sfml.js';

try {
  new Texture(new Image()); // 空图像不能用于创建纹理
} catch (error) {
  if (error instanceof SFMLError) {
    console.error(error.message);
  } else {
    throw error;
  }
}
```

生产 Native 方法通过 `sfmljs::SetMethod` 注册异常边界。异步工作线程和完成回调使用 `sfmljs::AsyncWorker` 捕获；流加载捕获异常后通知等待线程。`SFMLError` 是 JS 错误类，原生层只传递错误信息，不向 JS 暴露 C++ 异常对象。

## View 与 RenderTarget

View 的构造、center／size／rotation、viewport／scissor、move／rotate／zoom、变换及逆变换均已实现。默认 View 覆盖 `(0, 0, 1000, 1000)`；也可从 FloatRect、中心与尺寸、已有 View 构造。中心和尺寸使用 Vector2f，旋转使用 Angle。复制构造和 setter 按值复制，不保留参数别名。

`getCenter()`、`getSize()`、`getRotation()` 返回独立值。`getViewport()`、`getScissor()` 返回稳定的只读矩形引用，setter 更新会反映到旧引用；矩形成员禁止直接修改。`getTransform()`、`getInverseTransform()` 返回缓存的只读 Transform，修改相机后，下次查询按 float32 语义重新计算。View 的构造、修改和计算均在 JS 执行。

viewport 按 SFML 原样保存；scissor 的位置和范围必须位于 `[0, 1]`，否则抛出 RangeError。scissor 相对整个 RenderTarget，既影响 draw，也影响 clear 和 clearStencil。

| RenderTarget 方法 | 返回值 | 行为 |
|------------------|--------|------|
| `setView(view)` | `void` | 按值复制并记录视图切换 |
| `getView()` | `ReadonlyValue<View>` | 当前视图的稳定只读引用 |
| `getDefaultView()` | `ReadonlyValue<View>` | 默认视图的稳定只读引用 |
| `getViewport(view)`／`getScissor(view)` | `IntRect` | 将归一化矩形转换为像素矩形 |
| `mapPixelToCoords(point, view?)` | `Vector2f` | Vector2i 像素位置转世界坐标，省略 view 时使用当前视图 |
| `mapCoordsToPixel(point, view?)` | `Vector2i` | Vector2f 世界坐标转像素位置，省略 view 时使用当前视图 |
| `isSrgb()` | `boolean` | 基类默认 false，RenderTexture 返回实际设置 |
| `setActive(active = true)` | `boolean` | 提交待绘制命令并切换目标激活状态 |
| `pushGLStates()` | `void` | 提交命令，保存 GL 状态并设置 SFML 绘制状态 |
| `popGLStates()` | `void` | 提交命令后恢复先前保存的 GL 状态 |
| `resetGLStates()` | `void` | 提交命令后重设 SFML 绘制状态 |

像素矩形按 SFML 的 `lround` 规则舍入，包括负半整数远离零；坐标转换逐步使用 float32 计算，返回整数像素时向零截断。查询只读取 JS 状态，不提交绘制。RenderTexture 成功 resize 后，当前视图与默认视图同时重设为新尺寸；原引用继续有效。失败 resize 保留它们。

`setView()` 使用操作码 5，将 13 个 float 写入 172 字节命令的矩阵区：center、size、rotation、viewport、scissor。Native 先校验整批，再按顺序构造 sf::View 并应用。视图切换不会逐次进入 Native；切换前后的绘制各使用对应的视图快照，源 View 后续变化不影响已记录命令。

```typescript
const target = new RenderTexture(new Vector2u(800, 600));
const camera = new View(target.getDefaultView());
camera.move(new Vector2f(100, 0));
camera.zoom(0.5);
target.setView(camera);
target.draw(world);
target.setView(target.getDefaultView());
target.draw(hud);
target.display();
```

直接操作 OpenGL 前先通过 `setActive()` 或 `flush()` 结束待绘制命令，再设置自己的 GL 状态。push／pop 在同一 OpenGL 上下文中成对使用。状态接口不会隐式 display；离屏新内容仍需显式 display 才能采样。RenderTarget 的公开方法及绘制重载已补齐；RenderStates.shader 支持真实 Shader 资源。

## RenderTexture

`new RenderTexture()` 创建 `(0, 0)` 的未初始化目标；`new RenderTexture(size, settings?)` 创建指定尺寸目标，分配失败抛出异常。先 resize 成功再绘制。未初始化目标的 `setActive()`、`generateMipmap()` 和 `isSrgb()` 返回 false；`getTexture()` 可提前取得稳定视图，后续 resize 后继续使用。

| 方法 | 返回值 | 行为 |
|------|--------|------|
| `resize(size, settings?)` | `boolean` | 重建 GPU 目标；成功后内容未定义、默认视图重设为新尺寸 |
| `getSize()` | `Vector2u` | 返回独立尺寸值 |
| `getTexture()` | `ReadonlyTexture` | 返回同一只读 GPU 纹理视图 |
| `setSmooth(boolean)`／`isSmooth()` | `void`／`boolean` | 设置或查询平滑采样 |
| `setRepeated(boolean)`／`isRepeated()` | `void`／`boolean` | 设置或查询重复采样 |
| `generateMipmap()` | `boolean` | 为已 display 的内容生成 mipmap |
| `isSrgb()` | `boolean` | 查询目标实际启用的 sRGB 编码 |
| `setActive(active = true)` | `boolean` | 提交已有命令，再激活或停用目标供 OpenGL 使用 |
| `display()` | `void` | 提交绘制并更新可采样纹理；多重采样在此解析 |
| `RenderTexture.getMaximumAntiAliasingLevel()` | `number` | 查询设备支持的最大多重采样级别 |

`ContextSettings` 是配置对象类型，构造与 resize 均支持全部字段。`RenderTextureSettings` 保留为它的类型别名。

| 字段 | 默认值 | 含义 |
|------|--------|------|
| `depthBits` | `0` | 深度缓冲请求位数 |
| `stencilBits` | `0` | 模板缓冲请求位数，接受 0～32 |
| `antiAliasingLevel` | `0` | 多重采样级别 |
| `majorVersion`／`minorVersion` | `1`／`1` | OpenGL 版本请求 |
| `attributeFlags` | `ContextAttribute.Default` | Default＝0、Core＝1、Debug＝4，可组合 Core 与 Debug |
| `sRgbCapable` | `false` | 请求 sRGB 编码 |

整数设置接受 uint32，sRgbCapable 必须为 boolean。配置按值读取，后续修改对象不影响已有目标。SFML 的 FBO 路径复用当前上下文，版本和属性请求不强制创建另一个上下文；深度、模板、多重采样和 sRGB 按驱动能力分配。Core 上下文用于自定义 OpenGL，SFML Graphics 绘制需要兼容上下文。

resize 先提交读取旧纹理的消费者，再提交目标原有命令；新目标分配成功后才替换资源，失败返回 false 并保留原分配。成功后关闭 smooth、保留 repeated，sRGB 按本次设置重新请求。旧视图、Native 句柄和注册 ID 保持身份，尺寸与采样缓存同步更新；OpenGL 纹理名称可能变化。已有 Sprite 的纹理矩形保持原值，需要完整新尺寸时调用 `sprite.setTexture(view, true)`。

平滑／重复采样变更和 mipmap 生成只先提交读取旧采样状态的消费者，不隐式提交或 display 源目标。生成 mipmap 前须完成绘制并调用 display；后续 display 会使 mipmap 失效，需要重新生成。`setActive(true)` 先提交消费者及目标已有命令，最后激活本目标，确保之后的直接 OpenGL 绘制不会改到其他目标。它不替代 display。

## RenderTexture 纹理视图

`getTexture(): ReadonlyTexture` 返回缓存的同一只读视图，直接引用离屏目标的 GPU 纹理，不复制像素、不隐式提交。读取新绘制结果前，先调用源目标的 `display()`；`flush()` 只提交命令，不能替代 `display()`。视图可直接用于 Sprite、RenderStates、Texture 复制构造、Texture.update 的源参数和 `copyToImage()`。

```typescript
const source = new RenderTexture(new Vector2u(64, 64));
const view = source.getTexture();
const sprite = new Sprite(view);
const output = new RenderTexture(new Vector2u(128, 64));

source.clear(Color.Red);
source.display();
output.draw(sprite);
source.clear(Color.Blue);
source.display(); // 先提交读取旧红色内容的 output。
sprite.setPosition(new Vector2f(64, 0));
output.draw(sprite);
output.display(); // 左红、右蓝。
const screenshot = output.getTexture().copyToImage();
```

源目标提交 clear／draw 时就可能改写纹理，所以每次源 `flush()`、缓冲区满自动提交或 `display()` 前，都会先按依赖顺序提交读取旧内容的消费者。Texture 修改触发的全局 flush 遵循相同顺序。消费者提前提交不隐式 display；在其作为下一层纹理来源前，仍需显式 display。

直接采样自身目标的纹理会抛错；尚未提交的目标之间形成循环依赖时，也在录制该条绘制前拒绝。先 display 一个中间目标即可继续，正常按 display 分阶段的双缓冲交换不受影响。

视图在 JS 中保活所属目标，Native 使用指向 `sf::RenderTexture::getTexture()` 的 const shared_ptr 别名保活整个 RenderTextureState。注册表使用 weak_ptr，不产生 Native 引用环。借用视图的修改方法同时受 TypeScript、JS 运行时和 Native const 句柄限制；需要可写副本时使用 `new Texture(view)`。

执行 `npm run demo:render-texture`，查看同一离屏纹理更新前后的 Sprite 快照与 VertexArray 合成。默认持续运行，Esc 退出；自动验证可附加 `-- --frames=120`。设置 `SFML_DEMO_SNAPSHOT=/tmp/render-texture.png`，通过公开 `getTexture().copyToImage()` 保存首帧。

## Sprite

`new Sprite(texture, rect?)` 使用纹理全图或指定 IntRect；`new Sprite(sourceSprite)` 复制当前位置、旋转、缩放、原点、纹理矩形与颜色。副本有独立 Native ID 和独立暂存区，JS 与 Native 共享该副本的存储，纹理资源与源 Sprite 共用。SFML 3 没有默认 Sprite 构造，但允许从空 Texture 构造。

| 接口 | 行为 |
|------|------|
| `setTexture(texture, resetRect = false)` | 切换纹理，默认保留矩形；true 时重设为当前纹理尺寸 |
| `getTexture()` | 返回同一纹理对象的 ReadonlyTexture 类型引用 |
| `setTextureRect(rect)` | 按值复制 IntRect，允许负尺寸翻转和零尺寸 |
| `getTextureRect()` | 返回共享矩形的只读实时视图，后续 setter 更新会反映到已取出的视图 |
| `setColor(color)`／`getColor()` | 设置按值复制，查询返回独立 Color；默认白色，含透明度调制 |
| `getLocalBounds()` | 返回起点为零、宽高为矩形 float32 尺寸绝对值的 FloatRect |
| `getGlobalBounds()` | 返回自身变换后的轴对齐包围盒，不包含 draw 的外层 RenderStates |

Sprite 返回的普通 Texture 引用和矩形视图的 const 约束在 TypeScript 层生效。只读纹理可以用于 Sprite、RenderStates、Texture 复制构造和 update 的源参数，不能通过该类型调用 update、resize、swap 等修改方法；原有可写 Texture 引用仍可修改同一资源。若纹理来自 RenderTexture，则始终保留其运行时只读限制。

Sprite 新增 24 字节 Native 暂存区，保存纹理 ID、sf::IntRect 和 RGBA 整数。矩形、颜色与变换修改均不调用 Native；边界计算沿用 JS 的 float32 Transform 实现。切换到不同纹理有一次 Native 调用更新 shared_ptr，不触发 flush；每条 draw 同时保存完整属性快照和纹理引用。纹理资源自身的像素更新仍会 flush 旧绘制，保证先前 draw 不受后续修改影响。

```typescript
const sprite = new Sprite(texture, new IntRect(
  new Vector2i(16, 0), new Vector2i(-16, 16),
));
sprite.setColor(new Color(255, 160, 80, 180));
const copy = new Sprite(sprite);
target.draw(sprite);
sprite.setColor(Color.White);
target.draw(copy); // 两次绘制仍使用各自捕获的颜色。
```

在仓库根目录执行 `npm run demo:sprite`，查看裁剪动画、负宽度翻转、颜色和透明度、纹理切换、复制及旋转边界。默认持续运行，Esc 退出；自动验证可附加 `-- --frames=120`。设置 `SFML_DEMO_SNAPSHOT=/tmp/sprite.png` 可保存首帧。

## Shape

`ShapeResource extends Drawable` 管理 Native 资源及外观；`Shape extends withTransformable(ShapeResource)` 提供变换和自定义几何协议。CircleShape、RectangleShape、ConvexShape 继承 Shape，只定义各自的几何操作。每个实例持有一个真实的 `sf::Shape` 派生对象，Transformable 句柄与该对象共用所有权。

| 构造 | 参数 |
|------|------|
| `new CircleShape({ radius = 0, pointCount = 30 } = {})` | 半径与圆周点数 |
| `new RectangleShape(size = new Vector2f())` | 矩形尺寸 |
| `new ConvexShape(pointCount = 0)` | 凸多边形点数，随后按环绕顺序调用 `setPoint()` |
| `new CircleShape(source)`／`new RectangleShape(source)`／`new ConvexShape(source)` | 同类复制，独立几何、外观和变换，共用纹理资源 |

| 接口 | 行为 |
|------|------|
| `setTexture(texture, resetRect = false)`／`getTexture()` | 接受 ReadonlyTexture 或 null；null 关闭纹理，首次设置纹理且矩形全零时自动覆盖整张纹理 |
| `setTextureRect(rect)`／`getTextureRect()` | 按值设置 IntRect，读取只读实时视图 |
| `setFillColor(color)`／`getFillColor()` | 填充色，默认白色 |
| `setOutlineColor(color)`／`getOutlineColor()` | 轮廓色，默认白色 |
| `setOutlineThickness(thickness)`／`getOutlineThickness()` | 轮廓厚度，默认 0，允许负值 |
| `setMiterLimit(limit)`／`getMiterLimit()` | 轮廓尖角长度与厚度之比的上限，默认 10，最小 1 |
| `getPointCount()`／`getPoint(index)`／`getGeometricCenter()` | 本地几何点及几何中心 |
| `getLocalBounds()`／`getGlobalBounds()` | 包含轮廓的边界，全局边界应用自身变换 |
| CircleShape `setRadius()`／`getRadius()`／`setPointCount()` | 圆形几何 |
| RectangleShape `setSize()`／`getSize()` | 矩形几何 |
| ConvexShape `setPointCount()`／`setPoint(index, point)` | 凸多边形几何 |

自定义形状继承 Shape，实现 `getPointCount()` 和 `getPoint()`，在点集变化后调用 protected `update()`。update 将点集复制到 Native，由 SFML 生成填充、纹理坐标和轮廓；draw 与提交阶段不回调 JS 点方法。点集必须满足 SFML 的凸形状约束。

```typescript
import { Shape, CircleShape, Vector2f, Color } from './src';

class Triangle extends Shape {
  constructor(private readonly width: number) {
    super();
    this.update();
  }

  getPointCount(): number { return 3; }

  getPoint(index: number): Vector2f {
    return [
      new Vector2f(), new Vector2f(this.width, 0), new Vector2f(0, this.width),
    ][index];
  }
}

const circle = new CircleShape({ radius: 24, pointCount: 48 });
circle.setFillColor(Color.Cyan);
circle.setOutlineThickness(2);
circle.setMiterLimit(4);
target.draw(circle);
target.draw(new Triangle(30));
```

外观使用 28 字节共享存储，变换使用 7 个 float。位置、旋转、缩放、原点、填充色、轮廓色及纹理矩形的设置只写共享内存；切换纹理时通过一次 Native 调用维护所有权。每次 draw 使用操作码 7，记录外观和父矩阵乘自身变换的结果，并保活 Shape、纹理与 Shader；逐次 draw 不进入 Native。几何、轮廓厚度和 miter limit 修改前，只提交包含该 Shape 的目标队列，保证已录制绘制使用调用当时的几何。纹理像素及 Shader uniform 修改沿用资源快照规则。

## Font、Glyph 与 Text

`Font` 使用 `openFromFile`、`openFromMemory`、`openFromStream` 异步加载，返回 `Promise<boolean>`。加载失败保留现有字体；输入流抛错时 Promise 拒绝。内存加载在调用时复制指定视图；流加载支持分段读取，完成后数据由 Native 持有，后续字形查询不再访问输入流。文件加载遵循 SFML 的文件存续要求：字体使用期间保持源文件可用。`new Font(font)` 复制字体，保留底层输入数据。

| API | 返回值或行为 |
| --- | --- |
| `getInfo()` | 只读 `id: bigint`、`family`、`hasKerning`、`hasVerticalMetrics` |
| `getGlyph(codePoint, size, bold, outline = 0)` | 按 Unicode 码点查询只读 Glyph |
| `getGlyphById(id, size, bold, outline = 0)` | 按字体内部字形编号查询 |
| `hasGlyph(codePoint)`、`getKerning(first, second, size, bold = false)` | 字符覆盖及字偶距 |
| `getAscent(size)`、`getDescent(size)`、`getLineSpacing(size)` | 字体度量 |
| `getUnderlinePosition(size)`、`getUnderlineThickness(size)` | 下划线位置及厚度 |
| `getTexture(size)` | 保活字体资源的只读图集；尺寸随字形增长更新 |
| `setSmooth(smooth)`、`isSmooth()` | 平滑过滤 |

`Glyph` 的 44 字节布局包含 `advance`、`lsbDelta`、`rsbDelta`、`bounds: FloatRect`、`textureRect: IntRect`。独立 Glyph 从 JS 缓冲开始，Native handle 和矩形成员视图延迟创建；`new Glyph(source)` 复制数据。Font 查询返回的 Glyph 只读，查询结果、字体度量和字符覆盖按参数缓存；成功重新加载字体时清空缓存。旧图集视图继续保活其所属字体数据。

```typescript
import {
  Font, Text, TextStyle, LineAlignment, Color, Vector2f,
} from 'sfml.js';

const font = new Font();
if (!await font.openFromFile('font.ttf')) throw new Error('字体加载失败');
const text = new Text({ font, string: 'Hello\nSFML', characterSize: 30 });
text.setStyle(TextStyle.Bold);
text.setLineAlignment(LineAlignment.Center);
text.setPosition(new Vector2f(20, 30));
text.setOutlineThickness(1);
text.setGlyphPreProcessor((glyph, appearance) => {
  if (glyph.cluster < 5) appearance.fillColor = Color.Cyan;
});
target.draw(text);
```

`Text` 提供字符串、字体、字号、字间距、行间距、样式、填充色、轮廓色、轮廓厚度的 setter/getter，以及 Transformable 的变换方法、局部和全局边界。`new Text(text)` 复制属性、变换及已生成的顶点数据。首次排版前 Font 必须加载成功。

| 排版接口 | 参数 |
| --- | --- |
| `setLineAlignment`／`getLineAlignment` | `LineAlignment.Default / Left / Center / Right` |
| `setClusterGrouping`／`getClusterGrouping` | `ClusterGrouping.Grapheme / Character / None`，默认 Character |
| `setTextOrientation`／`getTextOrientation` | `TextOrientation.Default / TopToBottom / BottomToTop` |
| `getShapedGlyphs()` | 只读列表；含 glyph、position、cluster、textDirection、baseline、vertexOffset、vertexCount |
| `setGlyphPreProcessor(callback \| null)` | 按字形修改 style、fillColor、outlineColor、outlineThickness |
| `getVertexData()`／`getOutlineVertexData()` | 可编辑的填充／轮廓 VertexArray |
| `findCharacterPos(index)` | SFML 已弃用的全局字符位置查询；索引按 Unicode 码点计数 |

`Text.Style`、`Text.LineAlignment`、`Text.ClusterGrouping`、`Text.TextDirection`、`Text.TextOrientation` 也可访问对应枚举。`getShapedGlyphs()` 和字形预处理回调中的 `cluster` 均为 JS 字符串的 UTF-16 下标，可用于 `slice()`／`substring()`。例如 `A😀中` 的三个起始下标为 0、1、3。Native 保存 SFML 码点索引，JS 在首次读取 cluster 时构建索引映射并缓存；字符串变化后生成新的映射，旧字形视图继续使用原字符串的映射。字形预处理按 SFML 的几何生成顺序调用，允许修改传入的外观对象；回调内不能修改当前 Text 的排版属性或再次查询几何。回调异常原样抛出，Native 不长期保留 JS 闭包。

Text 由一个 Native `TextState` 持有 `sf::Text`、字体引用和 Transformable 状态，共享同一个所有权控制块。构造时映射 `sf::Text` 的 40 字节实际数值成员区：字号、样式和枚举使用 Uint32Array，间距和厚度使用 Float32Array，两个 Color 按 RGBA 字节读写；边界和 `m_geometryNeedUpdate` 也直接映射其原生成员。`native/text-state.h` 通过成员指针定位 SFML 3.1.0 的字段，映射前检查数值成员区的布局。JS 保留共享视图、字符串、字体和回调引用，以及 UTF-16 索引缓存。

字号、间距、样式和轮廓厚度等 setter 直接写入共享字段，并设置 SFML 自身的几何失效标记；查询边界、字形、顶点或绘制时复用同一个 `sf::Text` 按需排版。已生成几何的填充色和轮廓色修改直接更新对应顶点颜色，不重新排版或调用字形预处理器。位置、旋转、缩放、原点由同一 Native owner 内的共享变换状态提供。属性和变换读写均不调用 Native。

字形结果由 Native 连续存储，每项 80 字节，列表首次请求时映射一个 ArrayBuffer。标量直接读取共享存储，Glyph 和 position 成员视图按访问创建，成员的 Native handle 延迟解析。预处理回调也使用同一布局，每次调用持有独立快照；排版结束后清除 Native 中的临时回调，不使成功生成的几何失效。回调失败时保留原异常，并将原生几何标记设为失效以便重试。重新排版不改变已发布的分配，旧字形及成员视图仍可读取。

顶点修改影响后续绘制，排版属性变化或字体重新加载后再次生成顶点；旧顶点视图仍保活原分配。每次 draw 复制轮廓和填充顶点到批处理区，重复绘制不重新排版。图集栅格化、过滤修改和字体替换前提交待绘制命令，保持已录制绘制的快照语义。

执行 `npm run demo:text` 查看顶点动画；可传入 `-- --font=/path/to/font.ttf --text=中文示例 --frames=120`。默认字体及许可证位于 `test/fixtures/fonts/`；展示中文时通过 `--font` 指定支持中文字形的字体。

## Drawable 与 RenderStates

`Drawable` 对应 SFML 的绘制协议，独立于 `Transformable`。自定义类继承 Drawable，实现 protected `draw(target, states)`；通过 `target.draw(object)` 调用。组合对象可以持有 Transformable，显式右乘自己的变换，再按顺序绘制子对象。Sprite 已同时具备这两种能力，也支持子类覆盖 draw 并调用 `super.draw()`。

自定义 JS Drawable 的继承关系保留在 JS，展开结果写入所属目标的原生 BatchDrawable。真实的 C++ `sf::Drawable` 派生对象包括 BatchDrawable、`sf::Sprite` 和 `sf::Shape` 派生实例；BatchDrawable 是每目标复用的内部执行器，不是全局单例，也不为每个 JS 组合对象创建原生代理。批处理减少跨语言提交次数，内部仍逐条调用 SFML 绘制，不自动合并 GPU draw call。

```typescript
import {
  Drawable, RenderTarget, RenderStates, Transformable,
  Sprite, Texture, Vector2u, Vector2f, RenderTexture,
} from './src';

class Group extends Drawable {
  readonly pose = new Transformable();

  constructor(readonly children: Drawable[]) { super(); }

  protected draw(target: RenderTarget, states: RenderStates): void {
    states.transform.combine(this.pose.getTransform());
    for (const child of this.children) target.draw(child, states);
  }
}

const texture = new Texture(new Vector2u(1, 1));
texture.update(new Uint8Array([255, 80, 40, 255]));
const sprite = new Sprite(texture);
sprite.setScale(new Vector2f(20, 20));
const group = new Group([sprite]);
const target = new RenderTexture(new Vector2u(200, 100));
target.clear();
group.pose.setPosition(new Vector2f(10, 20));
target.draw(group);
group.pose.setPosition(new Vector2f(100, 20));
target.draw(group); // 第一份绘制保留原位置
target.display();
```

自定义 draw 在 `target.draw()` 内同步执行，每次收到独立的 RenderStates 值副本。修改其 transform、blendMode 或 stencilMode 不污染调用方、父级或兄弟节点；texture 和 shader 保留同一资源引用。`new RenderStates(source)` 也执行相同的值复制；transform 赋值复制矩阵。普通 JS 变量赋值仍是引用语义。回调抛错会立即传播，抛错前已记录的叶子命令仍可提交，不会重放回调。

状态校验集中在 `src/internal/render-states.ts`：自定义 Drawable 在回调前校验，Sprite 在记录叶子命令前校验；普通 Sprite 路径只校验一次。递归冻结的默认状态按对象身份直接通过，其他状态每次检查。Sprite 子类修改 states 后调用 `super.draw()` 仍会重新校验，拒绝时不占用命令槽位。默认回调副本直接初始化单位矩阵，已有 RenderStates 优先进入复制分支；回调取得的对象及其值成员始终独立，允许保存到回调之外继续使用。

RenderStates 包含 SFML 的六个状态字段：

| 字段 | 默认值 | 行为 |
|------|--------|------|
| `blendMode` | `BlendAlpha` | 颜色与 alpha 分别配置来源因子、目标因子和方程 |
| `stencilMode` | `new StencilMode()` | 比较、更新、reference、mask 和 stencilOnly |
| `transform` | 单位变换 | 与子对象变换右乘组合，保留完整矩阵 |
| `coordinateType` | `CoordinateType.Pixels` | Pixels 或 Normalized |
| `texture` | `null` | Texture 资源引用 |
| `shader` | `null` | `ReadonlyShader` 资源引用，Native 绘制时绑定 |

构造函数接受选项对象、已有 RenderStates，或单独的 Transform、BlendMode、StencilMode、Texture、Shader／null；这些参数也能直接传给 `target.draw()`。`RenderStates.Default` 为递归冻结的 `ReadonlyRenderStates`，复制后可修改。BlendMode 提供 Factor／Equation 枚举及 `BlendAlpha`、`BlendAdd`、`BlendMultiply`、`BlendMin`、`BlendMax`、`BlendNone` 常量。StencilValue 接受 int32／uint32 范围整数，有符号值按 uint32 转换。

模板绘制需要创建 `new RenderTexture(size, { stencilBits: 8 })`。`clear(color, stencil)` 同时清除颜色与模板缓冲，`clear(color)` 只清颜色，`clearStencil(value = 0)` 只清模板。`stencilOnly: true` 可先写遮罩，再用 Equal／NotEqual 等比较控制后续颜色绘制。模板比较、更新枚举和 BlendMode 字段在 JS 记录前校验；C++ 提交前再次校验命令。

Sprite 和 Shape 按 SFML 规则覆盖传入的 texture 与 coordinateType；命令保存变换、混合、模板与 Shader，以及自身的纹理、矩形和颜色。顶点命令同时保存纹理 ID 与 CoordinateType。父级非均匀缩放和子级旋转通过矩阵相乘保留，不分解为位置／角度／缩放。队列强引用叶子 Sprite、Shape、VertexBuffer、Shader 及绘制当时使用的 Texture，提交后释放队列引用。Text 将轮廓和填充顶点录制到同一批处理区，命令保活绘制时的字体图集。

执行 `npm run demo:drawable -- --frames=120` 查看嵌套组合示例：同一个组合对象绘制两次，左侧使用 alpha 混合，右侧叠加父级非均匀缩放、加法混合与模板裁剪。支持 `--uncapped` 和 `SFML_DEMO_SNAPSHOT`。`test/native/drawable-probes.cc` 使用普通 C++ Drawable／Transformable 组合及即时绘制作为独立参照，验证嵌套变换、混合方程和全部模板比较／更新操作的真实像素。

构建后执行 `node tools/benchmark-drawable.cjs` 输出 JSON 基准。场景为 128×128 离屏目标，256／1024／4095 个不同的 1 像素 Sprite 共用一张纹理；每帧增加一条 clear 命令，4095 个 Sprite 恰好占满一批。每种路径预热 30 帧，再轮换顺序采样 5 次，每次 40 帧，报告采样均值的中位数。纹理上传和资源创建在计时外，自定义回调内的状态副本分配及可能发生的 GC 计入耗时；每帧末的像素读回用于排空 GPU 工作，单独计时。

2026 年 9 月 20 日在 Apple M4 Max、macOS arm64、Node.js 22.22.2、SFML 3.1.0 上，使用同一脚本按旧／新／新／旧／旧／新顺序运行，以下为各版本三次结果的中位数，单位为 ms／帧。这组历史对照采集于 Sprite 属性快照扩展前；旧版本为 JS 校验与复制优化前的独立构建。可用 `SFML_BENCH_ROOT=/absolute/build/path` 指向另一份包含 dist 和原生模块的构建，保持基准脚本一致。

| Sprite 数量 | 路径 | JS 记录：优化前 → 后 | 记录耗时降低 | 记录至 display：优化前 → 后 |
|------------|------|--------------------:|-------------:|---------------------------:|
| 1024 | 普通 Sprite，默认状态 | 0.0823 → 0.0703 | 14.6% | 0.2817 → 0.2615 |
| 1024 | 每 Sprite 一层自定义 Drawable，默认状态 | 0.1804 → 0.1589 | 12.0% | 0.3828 → 0.3586 |
| 1024 | 普通 Sprite，可变状态 | 0.0839 → 0.0755 | 10.0% | 0.2907 → 0.2607 |
| 1024 | 每 Sprite 一层自定义 Drawable，可变状态 | 0.1788 → 0.1711 | 4.3% | 0.3703 → 0.3629 |
| 4095 | 普通 Sprite，默认状态 | 0.3389 → 0.2733 | 19.3% | 1.1966 → 1.1058 |
| 4095 | 每 Sprite 一层自定义 Drawable，默认状态 | 0.6959 → 0.6235 | 10.4% | 1.5716 → 1.5192 |
| 4095 | 普通 Sprite，可变状态 | 0.3491 → 0.3022 | 13.4% | 1.2244 → 1.1807 |
| 4095 | 每 Sprite 一层自定义 Drawable，可变状态 | 0.7402 → 0.6865 | 7.3% | 1.6915 → 1.5520 |

可变状态路径复用一个显式创建的 RenderStates，保留逐次校验。`flush_each` 每个 Sprite 都提交，优化后 1024 个 Sprite 为 0.4968 ms／帧，默认批量路径为 0.2615 ms／帧；差值包含提交方式与驱动开销，不能作为单次 NAN 调用成本。`split_batch` 单列 flush 与 display 耗时。上述时间为调用线程的墙钟时间，包含驱动工作，排除末尾读回；不代表 GPU 执行时间或真实游戏帧率，收益随回调结构、状态修改及机器负载变化。

Sprite 属性快照接入后，在同一环境重跑该脚本，结果如下。当时命令为 168 字节，额外包含纹理、矩形、颜色快照及纹理引用保活；本次为单轮脚本内五组均值的中位数，未与旧构建交错复测，不能据此精确归因版本间差值。

| Sprite 数量 | 批量 JS 记录 | 批量记录至 display | 每 Sprite 提交至 display |
|------------|------------:|------------------:|-----------------------:|
| 256 | 0.0212 ms | 0.0842 ms | 0.1594 ms |
| 1024 | 0.0849 ms | 0.2972 ms | 0.5551 ms |
| 4095 | 0.3284 ms | 1.2289 ms | 2.1899 ms |

## VertexBuffer

VertexBuffer 整类已实现，继承 Drawable，顶点数据由 Native 的 sf::VertexBuffer 持有，不保留 CPU 镜像。`VertexBufferUsage` 导出 Stream／Dynamic／Static，也可通过 `VertexBuffer.Usage` 使用；字符串枚举用于区分单参数 Usage 构造与 PrimitiveType 构造。

| 接口 | 行为 |
|------|------|
| `new VertexBuffer()` | 空缓冲区，Points／Stream |
| `new VertexBuffer(type)`／`new VertexBuffer(usage)`／`new VertexBuffer(type, usage)` | 指定图元、使用频率 |
| `new VertexBuffer(source)` | 独立复制 GPU 数据、图元和使用频率 |
| `assign(source)` | 深拷贝 GPU 数据、数量、图元和使用频率，返回当前对象；支持空源与空目标 |
| `create(count)` | 分配 GPU 存储；传入 0 释放顶点存储，返回 boolean |
| `getVertexCount()` | 查询已分配顶点数量 |
| `update(vertices)` | 从 VertexArray 或只读 Vertex 数组上传当前缓冲区数量的顶点 |
| `update(vertices, count, offset)` | 上传前 count 个源顶点到目标 offset；offset 为 0 时允许扩容，非零时越界返回 false |
| `update(sourceBuffer)` | GPU 缓冲区复制；目标容量调整为源容量，保留目标图元和使用频率 |
| `swap(other)` | 交换 GPU 存储、数量、图元和使用频率 |
| `getNativeHandle()` | OpenGL 缓冲区名称，尚未 create 时为 0 |
| `setPrimitiveType(type)`／`getPrimitiveType()` | 设置／查询图元 |
| `setUsage(usage)`／`getUsage()` | 设置／查询上传频率提示 |
| `VertexBuffer.bind(bufferOrNull)` | 在当前 GL 上下文绑定或解绑，不隐式 flush |
| `VertexBuffer.isAvailable()` | 查询当前系统的 VBO 支持 |

update 要求目标已 create；缓冲区复制还要求源已 create。源顶点不足、非法数量或偏移抛出异常。VertexArray 上传直接使用 Native 共享字节，普通数组先复制顶点的 20 字节布局；上传结束后修改源数据不会改变 GPU 内容。不同容量的 GPU 复制先分配替代存储，再复制并交换，避免 SFML 3.1.0 复制路径未调整容量与数量的问题。

`assign(source)` 在 Native 中按源配置创建临时 GPU 缓冲，复制成功后交换到目标，失败抛出 SFMLError 并保留目标资源。目标 JS 对象、Native 对象地址、注册 ID 和 fast buffer 映射保持不变，OpenGL 缓冲区名称随资源替换而变化。自赋值直接返回。空源清空目标顶点存储，并复制图元和使用频率。

```typescript
const buffer = new VertexBuffer(PrimitiveType.Triangles, VertexBuffer.Usage.Static);
buffer.create(vertices.getVertexCount()); // vertices 为 VertexArray
buffer.update(vertices);
target.draw(buffer, states);
target.draw(buffer, 3, 6, states);
```

RenderTarget 两个重载为 `draw(buffer, states?)` 和 `draw(buffer, firstVertex, vertexCount, states?)`。首顶点超出缓冲区或数量为 0 时不绘制；数量超过剩余顶点时按 SFML 截断。范围重载直接绘制 GPU 数据，完整 Drawable 绘制保留子类的 draw 分派。

操作码 6 使用 172 字节命令，记录缓冲区 ID、顶点范围、图元、纹理和 RenderStates，不复制顶点、不逐次调用 Native。create、update、assign 和 swap 修改存储前提交所有目标的已有绘制，保证快照语义；setPrimitiveType 使用录制时的图元。JS 队列和 Native 提交期间保活资源，提交后释放引用。综合示例的静态三角形只上传一次。

## VertexArray 与顶点绘制

`PrimitiveType` 提供 SFML 3 的六种图元：Points、Lines、LineStrip、Triangles、TriangleStrip、TriangleFan。VertexArray 继承 Drawable，独立于 Transformable；默认构造为空的 Points，也可指定类型与数量，或用已有 VertexArray 按值复制。

```typescript
import {
  VertexArray, PrimitiveType, Vertex, Vector2f, Color,
  RenderTexture, Vector2u,
} from './src';

const triangle = new VertexArray(PrimitiveType.Triangles, 3);
triangle.setVertex(0, new Vertex(new Vector2f(10, 10), Color.Red));
triangle.setVertex(1, new Vertex(new Vector2f(100, 10), Color.Green));
triangle.setVertex(2, new Vertex(new Vector2f(10, 100), Color.Blue));
const corner = triangle.getVertex(1);
corner.position.x = 120; // 直接修改 Native 顶点内存

const target = new RenderTexture(new Vector2u(128, 128));
target.clear();
target.draw(triangle);
corner.position.x = 20; // 不改变已经记录的顶点快照
target.display();

// 普通 Vertex 数组也可绘制，图元类型显式传入。
target.draw([...triangle], PrimitiveType.Triangles);
target.display();
```

支持 `getVertexCount()`、`getVertex(index)`、`setVertex(index, vertex)`、`clear()`、`resize(count)`、`append(vertex)`、`setPrimitiveType(type)`、`getPrimitiveType()`、`getBounds()` 和 `for...of`。索引越界或非法数量抛出 RangeError。新增顶点默认为零坐标、白色、零纹理坐标；set／append／复制构造保留原始 20 字节。`getBounds()` 在 JS 扫描位置，与 SFML 浮点边界计算对照。

Native 用固定大小的 `std::vector<sf::Vertex>` 存储真实元素，JS 维护逻辑数量。容量内读写、append／resize／clear 不跨 NAN；扩容按倍增策略分配新存储，复制有效字节。`getVertex()` 缓存成员对象，成员字段仍通过共享 TypedArray 访问；只有首次请求内部原生句柄才创建指向实际元素的别名句柄，不额外构造 Vertex。

视图绑定所属分配：扩容后旧视图保活旧内存，与新数组隔离。容量内 shrink／clear 保留槽位，后续扩展会重置新增范围，旧视图可能观察到槽位复用；结构修改后应重新取得成员，迭代期间不修改结构。Vertex 包装对象、其 position／color／texCoords、原生成员句柄及 buffer 均可独立保活存储。每个数组的容量上限为 `floor(0x7fffffff / 20)` 个顶点，实际可分配大小仍受可用内存限制。

每个目标按需创建共享顶点快照区，初始至少容纳 4096 个顶点。draw 将有效顶点字节立即复制到该区，命令记录起始偏移、数量、图元类型、完整 RenderStates；之后修改顶点、扩容、clear 或 GC 不改变已记录结果。剩余空间不足时先 flush，单条绘制超出容量则扩大存储，提交后复用；TriangleStrip／TriangleFan 保持单次完整绘制。稳态容量充足时，记录顶点命令不调用 Native；首次分配和扩容会调用一次 Native。

顶点命令使用统一的 172 字节布局，操作码为 4，复用 Sprite 局部变换字段保存顶点偏移、图元、纹理 ID 和 CoordinateType；父矩阵、混合、模板及 Shader ID 布局共用，Sprite 专用字段不参与顶点绘制。Texture 注册表使用 weak_ptr，JS 队列和提交期间的原生临时引用保活纹理，`Texture.update()` 先 flush。C++ 校验整批命令及顶点范围后，直接调用 SFML 的顶点 draw 重载。每次 VertexArray draw 为一次 SFML 顶点绘制；多个 Sprite 不自动合并，调用方需将可合并几何组织到同一数组。

## Shader

默认构造创建空 Shader。`loadFromFile`、`loadFromMemory`、`loadFromStream` 均返回 `Promise<boolean>`，各支持「单个来源 + ShaderType」「vertex + fragment」「vertex + geometry + fragment」三种参数形式。ShaderType 提供 Vertex／Geometry／Fragment，亦可通过 Shader.Type 访问。文件读取和编译在 Native 工作线程执行；流按 getSize、seek(0)、read 顺序异步读取后交给编译线程。成功时先 flush 已录制绘制，再替换程序并清除 uniform 与纹理绑定；失败保留原程序和设置。并行加载按完成顺序生效。

`setUniform` 支持 float、int、bool、Glsl 的浮点／整数／布尔 2～4 维向量、Mat3／Mat4、Texture 和 Shader.CurrentTexture。JS number 默认映射 float；int 使用 `setUniform(name, value, 'int')`，也可显式指定 `'float'`。`setUniformArray` 支持 Float32Array、number 数组及同类型 Vec2／Vec3／Vec4／Mat3／Mat4 数组，长度取数组长度。

```typescript
const shader = new Shader();
if (!await shader.loadFromMemory(`
  uniform sampler2D current;
  uniform vec4 tint;
  void main() {
    gl_FragColor = texture2D(current, gl_TexCoord[0].xy) * gl_Color * tint;
  }
`, ShaderType.Fragment)) throw new Error('Shader compilation failed');
shader.setUniform('current', Shader.CurrentTexture);
shader.setUniform('tint', new Glsl.Vec4(1, 0.5, 0.5, 1));
target.draw(sprite, shader); // 等价于 new RenderStates({ shader })
target.display();
```

uniform 修改前提交已有绘制，Shader 重载和纹理更新不改变此前 draw 的结果。Native 持有程序及采样纹理，JS 跟踪采样依赖并保活 RenderTexture 所有者；sampler 纹理与普通纹理共用消费者提交、自采样和循环依赖检查。不存在的 uniform 不加入依赖，别名按真实 location 合并。Shader.CurrentTexture 使用绘制对象的纹理；遵循 SFML 行为，设置 CurrentTexture 或标量不会删除此前同 location 的外部纹理引用，成功重载会清除全部引用。

`getNativeHandle()` 返回 GL 程序名称；Shader.bind(shader／null) 在当前上下文绑定或解绑，不隐式 flush。直接 OpenGL 操作前先提交已有命令。Shader.isAvailable() 和 Shader.isGeometryAvailable() 查询设备能力。Sprite、VertexArray、原始 Vertex 数组及 VertexBuffer 均支持 Shader，draw 录制不逐次进入 Native。

执行 `npm run demo:vertices -- --frames=120` 查看 384 个动态瓦片通过一个 VertexArray 绘制的示例，支持 `--uncapped` 与 `SFML_DEMO_SNAPSHOT`。综合示例也已加入 VertexArray，验证包装前后的实际像素一致。

执行 `node tools/benchmark-vertex-array.cjs` 对比逐个 Sprite、单个 VertexArray 和普通 Vertex 数组。三条路径绘制相同的 128×128 离屏画面，共用一张纹理；每个方块为 1 像素。Sprite 每个方块提交一次 SFML draw，顶点数组用两个三角形、六个顶点表示一个方块，一次提交全部几何。计时包含 draw 时的顶点快照、校验和 display，资源创建与动画计算在计时外，末尾读回单独计时。

2026 年 9 月 20 日，Apple M4 Max、macOS arm64、Node.js 22.22.2、SFML 3.1.0，预热 30 帧后轮换路径，取五组各 40 帧均值的中位数：

| 方块数 | Sprite 总耗时 | VertexArray 总耗时 | 普通 Vertex 数组总耗时 | VertexArray 记录耗时 |
|-------:|--------------:|------------------:|----------------------:|--------------------:|
| 256 | 0.0815 ms | 0.0194 ms | 0.0435 ms | 0.0036 ms |
| 1024 | 0.2611 ms | 0.0220 ms | 0.1412 ms | 0.0039 ms |
| 4095 | 1.3025 ms | 0.0571 ms | 0.8026 ms | 0.0108 ms |

该场景中，1024 个方块的 VertexArray 主线程耗时约为 Sprite 的 1／12；普通数组需要逐项检查和复制，连续存储的 VertexArray 只复制一段字节。此结果包含快照成本，但不代表 GPU 时间或真实游戏帧率；动态几何重建、纹理切换、填充率和图元组织都会影响收益。

## Texture

`new Texture()` 创建尺寸为 `(0, 0)` 的空纹理，适合随后加载；`new Texture(size, sRgb = false)` 分配指定尺寸，尺寸必须为正。`getSize()` 返回独立 Vector2u。加载和更新保留 Native 对象地址、句柄与纹理 ID，既有 Sprite 和 RenderStates 的引用继续有效。

`new Texture(image, sRgb = false, area?)` 从 Image 上传，可指定裁剪区域；空 Image 或上传失败抛出异常。`new Texture(sourceTexture)` 创建独立 GPU 资源，复制像素及 smooth、repeated、sRGB 设置，沿用 SFML 的原生纹理拷贝路径，不复制 mipmap。两者均不执行文件读取或图片解码。

`assign(sourceTexture)` 同步复制源纹理到现有目标，返回目标自身。复制前提交所有目标的待绘制命令；Native 创建临时 SFML 纹理副本，成功后交换资源，失败抛出 SFMLError 并保留目标资源。目标对象地址、注册 ID、fast buffer 映射及关联 Sprite 的纹理引用不变，OpenGL texture name 随资源替换而变化。源可为 RenderTexture／Font 的只读纹理视图，目标必须是可写 Texture；RenderTexture 的源内容以最近一次 display 为准。复制范围和 mipmap 行为与复制构造相同，自赋值直接返回。已经提交的异步加载仍在完成时更新原目标，需要固定顺序时先 await 加载。

| 方法 | 返回值 | 行为 |
|------|--------|------|
| `resize(size, sRgb = false)` | `boolean` | 分配纹理；零尺寸或超过设备限制返回 false，保留原状态 |
| `copyToImage()` | `Image` | 同步 GPU 读回，返回独立 Image；空纹理返回空 Image |
| `Texture.getMaximumSize()` | `number` | 查询当前设备支持的最大纹理边长 |
| `getNativeHandle()` | `number` | 查询当前 OpenGL texture name；空纹理为 0 |
| `Texture.bind(textureOrNull, coordinateType = CoordinateType.Normalized)` | `void` | 在当前 GL 上下文绑定纹理，null 解除绑定 |
| `generateMipmap()` | `boolean` | 生成多级纹理；空纹理或硬件不支持返回 false |
| `swap(other)` | `void` | 交换内容、尺寸、采样及 mipmap，保留双方对象身份 |
| `assign(source)` | `this` | 独立复制内容、尺寸和采样设置，保留目标身份；空源清空目标 |
| `loadFromFile(filename, sRgb = false, area?)` | `Promise<boolean>` | 后台读取与解码，再上传 GPU |
| `loadFromMemory(data, sRgb = false, area?)` | `Promise<boolean>` | 输入为编码后的 Uint8Array，后台解码 |
| `loadFromStream(stream, sRgb = false, area?)` | `Promise<boolean>` | 从可寻址 InputStream 后台解码，再上传 GPU |
| `loadFromImage(image, sRgb = false, area?)` | `boolean` | 从已解码的 Image 同步上传 |
| `update(pixels)` | `void` | 上传与当前纹理等大的 RGBA 字节 |
| `update(pixels, size, dest)` | `void` | 把指定尺寸的 RGBA 字节上传至 dest |
| `update(imageOrTextureOrWindow, dest?)` | `void` | 复制整个源对象，默认目标位置为 `(0, 0)` |
| `setSmooth(boolean)`／`isSmooth()` | `void`／`boolean` | 控制平滑过滤，默认关闭 |
| `setRepeated(boolean)`／`isRepeated()` | `void`／`boolean` | 控制超出纹理范围时重复采样，默认关闭 |
| `isSrgb()` | `boolean` | 查询驱动实际启用的 sRGB 状态 |

```typescript
import { Texture, Image, Vector2u, Vector2i, IntRect, Color } from './src';

async function loadTexture(filename: string) {
  const texture = new Texture();
  const area = new IntRect(new Vector2i(16, 16), new Vector2i(64, 64));
  if (!await texture.loadFromFile(filename, false, area)) {
    throw new Error(`Texture load failed: ${filename}`);
  }
  texture.setSmooth(true);
  texture.setRepeated(true);
  const patch = new Image(new Vector2u(1, 1), Color.Red);
  texture.update(patch, new Vector2u(0, 0));
  texture.generateMipmap();
  const backup = new Texture(texture);
  await backup.copyToImage().saveToFile('texture-backup.png');
  return texture;
}
```

文件和内存加载复用 Image 的 `Nan::AsyncWorker`：工作线程只负责读取、解码，不操作 GPU 或 V8。完成后在调用线程上传 GPU，Promise 在上传完成后返回。调用时复制编码输入与裁剪矩形，并固定相对文件路径；之后修改、detach 或回收输入不会影响加载。GPU 分配和上传仍同步执行，大纹理上传会占用主线程时间；未提供同步文件或内存解码接口。

流加载复用 Image 的流桥接，裁剪矩形同样在调用时复制，上传前提交旧绘制。InputStream 在加载期间独占其游标；不能并发修改流内容或让多个加载共用同一游标。

`area` 使用 IntRect，任一尺寸为零时加载全图，其余合法区域按 SFML 3.1.0 规则调整到图像范围：负起点夹到零，尺寸限制到该起点后的剩余范围。非空矩形的负尺寸或起点超出图像范围抛出 RangeError，避免触发原生断言。文件不存在、解码失败、空 Image 或 SFML 分配失败返回 false，原纹理内容、尺寸和采样设置保留；参数类型错误抛出异常，异步接口以 Promise rejection 返回。

每次 GPU 上传与采样变更前，统一 flush 已登记目标的待绘制命令。异步解码期间继续使用当前纹理，完成时才 flush 和替换，因此已录制的绘制仍使用旧内容。多个加载按完成顺序提交；需要固定覆盖顺序时逐次 await。每次加载默认关闭 sRGB，可通过参数重新启用；平滑和重复设置跨加载保留。尺寸、采样与 GL 名称查询直接读取 Native 共享数值视图。

resize、生成 mipmap 和 swap 同样先 flush；成功 resize 后像素内容未定义，需要重新上传。resize 保留 smooth／repeated，sRGB 默认重置为 false。像素更新、加载和 resize 会使 mipmap 失效，后续需要再次生成。

`copyToImage()` 将 SFML 读回结果移动到独立 Image 资源，JS 直接映射其 Native 像素，不再复制 RGBA 字节。GPU 读回和 SFML 内部转换仍有成本；读回结果支持 Image 的像素编辑、resize 和异步保存，旧像素视图在 GC 后仍按 Image 的生命周期规则有效。读回与复制构造不修改源纹理，无需 flush 当前普通 Texture 的绘制队列。

swap 交换 sf::Texture 基类资源，双方数值视图保持绑定各自对象，注册 ID、句柄和 JS 对象引用保持原身份。已有 Sprite／RenderStates 下一次绘制使用对应对象的内容；进行中的异步加载仍写回发起加载的 Texture 对象。self-swap 不执行操作。

局部 update 不缩放、不裁剪，超出目标范围抛出 RangeError。原始像素长度必须等于 `size.x * size.y * 4`，支持 Buffer 和带偏移的 Uint8Array 子视图，拒绝 detached、shared、resizable buffer。空区域不执行上传，合法 self-update 不执行重叠 GPU 拷贝。Native 层再次检查类型、长度和范围。Texture 的尺寸变化不会自动重设已有 Sprite 的纹理矩形；需要完整新尺寸时在加载完成后调用 `sprite.setTexture(texture, true)`。

`update(window, dest?)` 复制真实 `sf::Window` 的当前帧缓冲，沿用 SFML 的上下翻转及 mipmap 失效处理；复制前提交已有绘制命令。窗口未创建或已关闭时不执行操作。应在窗口绘制结束、交换缓冲前复制所需帧。

`getNativeHandle()` 返回 OpenGL 的纹理名称，与绑定内部注册 ID 不同；resize、加载或 swap 后应重新查询。调用方使用原生名称期间须保留纹理对象。`bind()` 接受普通 Texture、RenderTexture 的只读纹理视图或 null，支持 Normalized／Pixels 坐标；直接使用当前 GL 上下文，不隐式 flush 或切换目标。采样离屏新内容前仍需调用源目标的 `display()`。通过外部 OpenGL 写纹理前，调用方须先提交读取旧内容的绘制队列。

`Window()` 创建未打开的对象。`Window(mode, title, options?)` 和 `create(mode, title, options?)` 接受 VideoMode，也保留 Vector2u 尺寸输入。选项为 `{ style, state, settings }`，默认使用 `Style.Default`、`State.Windowed` 和 SFML 上下文设置；`Window(handle, settings?)`／`create(handle, settings?)` 接受已有窗口的 bigint 原生句柄。Window 操作在主线程执行。

| API | 已实现 | 未实现 |
|-----|--------|--------|
| Window 生命周期 | 构造、create、close、isOpen | — |
| 事件 | pollEvent、waitEvent、handleEvents，23 种事件字段 | — |
| 窗口属性 | getPosition／setPosition、getSize／setSize、setMinimumSize、setMaximumSize、setTitle、setIcon、setVisible | — |
| 输入控制 | setMouseCursorVisible、setMouseCursorGrabbed、setMouseCursor、setKeyRepeatEnabled、setJoystickThreshold、requestFocus、hasFocus | — |
| 上下文与呈现 | getSettings、setVerticalSyncEnabled、setFramerateLimit、setActive、display、getNativeHandle、createVulkanSurface | — |
| VideoMode | 默认／尺寸／复制构造、size、bitsPerPixel、getDesktopMode、getFullscreenModes、isValid，六个具名比较运算符 | — |
| Cursor | 系统／像素构造、createFromSystem、createFromPixels、Cursor.Type | — |
| Keyboard | 两种 isKeyPressed、localize、delocalize、getDescription、setVirtualKeyboardVisible，Key／Scan／Scancode 及计数 | — |
| Mouse | isButtonPressed、全局与窗口相对 getPosition／setPosition，Button／Wheel 及计数 | — |
| Joystick | isConnected、getButtonCount、hasAxis、isButtonPressed、getAxisPosition、getIdentification、update，Identification、Axis 及计数 | — |
| Sensor | isAvailable、setEnabled、getValue，Type 及计数 | — |
| Context | 构造、setActive、getSettings、getActiveContext、getActiveContextId、isExtensionAvailable、getFunction | — |
| Clipboard | getString、setString | — |
| Touch | isDown、全局与窗口相对 getPosition | — |
| Window 模块其余类型 | ContextSettings 及事件输入常量；WindowBase 公开功能由 Window 提供 | Vulkan 命名空间函数 |

`setMinimumSize(undefined)`／`setMaximumSize(undefined)` 解除限制。`setIcon(size, pixels)` 使用 RGBA8 像素。`getSettings()` 返回实际获得的七项上下文设置。`createVulkanSurface(instance, allocator = 0n)` 返回 bigint 表面句柄，失败返回 undefined；实例和分配器均由调用方管理，表面由调用方通过 Vulkan 销毁。

SFML 3.1.0 的 macOS 构建没有 Vulkan 后端，原生 `createVulkanSurface()` 固定返回 false，绑定对应返回 undefined。本机动态库的 `sf::Vulkan::isAvailable(true)`／`isAvailable(false)` 均返回 false，`getFunction("vkCreateInstance")` 返回 nullptr。该限制由 SFML 的平台分支决定，安装 MoltenVK 不会使这条 SFML 调用路径可用。成功路径需在提供 Vulkan 后端的 Windows 或 X11 平台验证。依据：[Vulkan.cpp](https://github.com/SFML/SFML/blob/3.1.0/src/SFML/Window/Vulkan.cpp) 与 [WindowImpl.cpp](https://github.com/SFML/SFML/blob/3.1.0/src/SFML/Window/WindowImpl.cpp)。

`RenderWindow` 提供完整 Window 和 RenderTarget 公开方法，支持默认构造、`RenderWindow(mode, title, options?)`、`RenderWindow(handle, settings?)`，以及 `setIcon(image)` 和 `setIcon(size, pixels)`。对象同时满足 `instanceof Window` 和 `instanceof RenderTarget`，可直接传给 Mouse 相对坐标接口和 `Texture.update(window)`。

clear、draw 和 setView 使用共享命令区录制，flush 提交，display 提交后交换窗口缓冲。支持 Sprite、VertexArray、原始顶点、VertexBuffer、Drawable 组合与 Shader。close、create 和尺寸修改前提交已有命令；重建重置默认和当前 View，普通缩放保留 View 内容。光标及绘制资源在使用期间保活，窗口通过所属线程延迟回收。

```typescript
import {
  RenderWindow, Vector2u, Image, Color, Texture, Sprite, Keyboard,
} from 'sfml.js';

const window = new RenderWindow(new Vector2u(800, 600), 'SFML');
const sprite = new Sprite(new Texture(
  new Image(new Vector2u(80, 80), Color.Green)));
window.setFramerateLimit(60);
function frame() {
  window.handleEvents({ Closed: () => window.close() });
  if (Keyboard.isKeyPressed(Keyboard.Key.Escape)) window.close();
  if (!window.isOpen()) return;
  window.clear();
  window.draw(sprite);
  window.display();
  setImmediate(frame);
}
frame();
```

`pollEvent()` 返回 `Event | undefined`。`waitEvent(timeout = Time.Zero)` 保持 SFML 的同步阻塞语义，超时或关闭返回 undefined；Node.js 帧循环使用 pollEvent／handleEvents，并在帧间让出事件循环。Event 的 `data` 是以 `kind` 区分的联合类型，保留 SFML 事件字段，包括 SensorChanged 的 `type`。`is(kind)` 收窄类型，`getIf(kind)` 返回对应数据或 undefined，`visit(fn)` 返回回调结果。`handleEvents(handlers, fallback?)` 优先调用具名事件处理器，也接受一个处理所有事件的函数。

```typescript
import {
  Window, VideoMode, Vector2u, State, KeyboardKey,
} from 'sfml.js';

const window = new Window(new VideoMode(new Vector2u(800, 600)), 'SFML', {
  state: State.Windowed,
  settings: { depthBits: 24 },
});
function frame() {
  window.handleEvents({
    Closed: () => window.close(),
    KeyPressed: event => {
      if (event.code === KeyboardKey.Escape) window.close();
    },
    Resized: event => console.log(event.size.x, event.size.y),
  });
  if (!window.isOpen()) return;
  window.display();
  setImmediate(frame);
}
frame();
```

Cursor 构造失败抛出异常，两个静态工厂失败返回 undefined。macOS 上系统光标需先创建窗口，纯离屏场景可使用像素光标。`setMouseCursor()` 在 Native 层保留光标所有权，替换光标、重建或关闭窗口后释放；JS Cursor 被 GC 不影响窗口正在使用的光标。VideoMode 和 Event 的复制保持向量值语义。

`npm run generate:window` 从 SFML 头文件生成 Style、State、CursorType、KeyboardKey、KeyboardScancode、MouseButton、MouseWheel、JoystickAxis、SensorType 及计数常量。生成代码位于 `src/window/gen/constants.ts`，标注自动生成，不能手改；Native 和 TS 构建前都会运行生成器。键值直接来自当前下载的头文件，不再维护第二份数值表。

Keyboard、Mouse、Joystick、Sensor 通过同名命名空间提供同步实时查询。`Keyboard.isKeyPressed(key)` 查询键码，`Keyboard.isKeyPressed(scancode, 'scancode')` 查询扫描码；localize／delocalize 使用当前键盘布局，getDescription 返回字符串。命名空间中的枚举与顶层生成枚举共用同一对象。

`Mouse.getPosition(window?)` 返回独立 Vector2i，`Mouse.setPosition(position, window?)` 设置坐标，省略 window 时使用屏幕坐标。`Joystick.getIdentification(id)` 返回含 name、vendorId、productId 的独立对象。没有窗口事件循环时调用 `Joystick.update()` 刷新状态。`Sensor.getValue(type)` 返回独立 Vector3f，使用前先查询 isAvailable，再通过 setEnabled 控制启用状态。

```typescript
import { Keyboard, Mouse, Joystick, Sensor } from 'sfml.js';

const escape = Keyboard.isKeyPressed(Keyboard.Key.Escape);
const physicalA = Keyboard.isKeyPressed(Keyboard.Scancode.A, 'scancode');
const pointer = Mouse.getPosition();
Joystick.update();
const controller = Joystick.getIdentification(0);
if (Sensor.isAvailable(Sensor.Type.Gravity)) {
  Sensor.setEnabled(Sensor.Type.Gravity, true);
  const gravity = Sensor.getValue(Sensor.Type.Gravity);
  Sensor.setEnabled(Sensor.Type.Gravity, false);
  console.log(gravity);
}
```

执行 `npm run demo:window` 打开 Window 交互演示。鼠标点击移动圆环，滚轮改变半径，方向键移动位置；输入字符、切换焦点和拖动窗口边缘时，右侧显示真实事件，下面显示键码、扫描码、修饰键、坐标和 Unicode 码点。非 ASCII 字符在诊断字体中显示为问号，原字符输出到终端。

| 按键 | 操作 |
|------|------|
| F1／F2 | 切换系统及自定义光标／光标显隐 |
| F3／F4 | 按键重复／垂直同步 |
| F5／F6 | 切换窗口尺寸／尺寸限制 |
| F7／F8 | 修改标题／隐藏 1 秒后恢复 |
| F9 | 切换 pollEvent、handleEvents、waitEvent |
| F10／Esc | 移动窗口／关闭 |

macOS 上可能需要同时按 Fn。演示通过公开 Window／Event 接口接收事件，内部 OpenGL 辅助函数只将离屏纹理呈现到窗口，不读取事件队列；每帧使用 setActive／resetGLStates 恢复离屏绘制状态。已构建时可执行 `node examples/window.cjs`，加 `--frames=120` 自动退出。

在仓库根目录执行以下命令，查看文件加载、PNG 裁剪、动态局部上传和平滑／重复采样示例：

```bash
npm run demo:texture
```

默认持续运行，Esc 退出；自动验证时可附加 `-- --frames=120`。示例还演示 Image／复制构造、读回后编码 PNG、resize、mipmap 和局部纹理 swap。设置 `SFML_DEMO_SNAPSHOT=/tmp/texture.png` 可保存首帧。

## Image

`Image` 提供默认、尺寸与填充色、尺寸与原始 RGBA 字节、复制构造。构造与 `resize()` 默认填充不透明黑色；任一尺寸为零时得到 `(0, 0)` 空图像。原始字节接受 `Uint8Array`（含 Buffer 和子视图），长度必须等于 `width * height * 4`，并复制进 SFML 自有内存。复制构造产生独立像素。

```typescript
import { Image, Vector2u, Color, Texture } from './src';

async function prepareTexture(filename: string) {
  const image = new Image();
  if (!await image.loadFromFile(filename)) return undefined;
  image.setPixel(new Vector2u(0, 0), Color.Red);
  image.pixels[3] = 128; // 直接修改 Native 像素

  const encoded = await image.saveToMemory('png');
  if (encoded) {
    const copy = new Image();
    await copy.loadFromMemory(encoded);
  }
  const texture = new Texture(image.getSize());
  texture.update(image.pixels);
  return texture;
}
```

`loadFromFile()`、`loadFromMemory()`、`loadFromStream()`、`saveToFile()` 均返回 `Promise<boolean>`；`saveToMemory(format)` 返回 `Promise<Uint8Array | undefined>`。只提供这些异步接口，不提供同步方法、文件或流构造函数及重复的 Async 后缀。普通加载／保存失败按 SFML 返回 false 或 undefined；非法参数及捕获的异常使 Promise 拒绝。失败加载保留当前尺寸、像素和视图身份。

`InputStream` 定义 `read(data: Uint8Array)`、`seek(position: bigint)`、`tell()`、`getSize()`。方法可返回 `bigint | undefined` 或相应 Promise：read 填充传入缓冲并返回实际字节数，EOF 返回 `0n`；seek 返回实际位置，tell 返回当前位置，getSize 返回总字节数；undefined 表示 I/O 失败。异常或 Promise rejection 使加载拒绝。也可传入实现这四个方法的对象，Node Readable 需要另行提供 seek／tell／getSize。

`MemoryInputStream(data?)` 保留编码字节引用，`open(data)` 更换输入并重置游标。用法为 `await image.loadFromStream(new MemoryInputStream(encoded))`，Texture 接受相同输入。加载期间保持输入不变。短读、seek 和 EOF 直接遵循 SFML 解码器的请求，不预先把流读成整块文件。

`FileInputStream` 使用 Node 的 FileHandle 管理文件句柄，回调版 `fs.read` 直接写入调用方的 Uint8Array，无中间缓冲复制或固定分块。使用无参构造后 `await open(filename)`：成功返回 true，打开失败返回 false 并关闭原文件。read／seek／tell／getSize 均返回 `Promise<bigint | undefined>`，I/O 失败或未打开时返回 undefined，EOF 返回 `0n`。read 返回实际读取字节数，允许短读，游标按实际字节数推进。文件位置使用 bigint，对应 Node 数值偏移的有效范围为 0 至 2⁵³−1；seek 可以越过 EOF。getSize 通过 `FileHandle.stat` 读取当前文件大小。

文件按需读取，EOF 保留句柄，支持再次 seek 或读取后来追加的数据。同一实例的操作按调用顺序执行，读取回调完成后才执行后续 seek／close；`close()` 关闭 FileHandle，重复关闭不报错，重开文件重置游标。传给 loadFromStream 后等待加载结束再关闭，同一个流的多次加载顺序 await。

```typescript
import { FileInputStream, Image } from 'sfml.js';

async function readImage(filename: string) {
  const stream = new FileInputStream();
  try {
    if (!await stream.open(filename)) throw new Error('Cannot open image');
    const image = new Image();
    if (!await image.loadFromStream(stream)) throw new Error('Cannot decode image');
    return image;
  } finally {
    await stream.close();
  }
}
```

Texture 和 Shader 的 loadFromStream 接受同一个 FileInputStream 类型。

流解码由独立 Native 线程调用 `sf::Image::loadFromStream()`，通过 libuv 异步通知在 JS 线程执行流方法，等待其同步结果或 Promise；不占用文件 I/O 的 libuv 线程池。read 缓冲由 Native 分配并映射到 JS，完成时截取有效字节快照后交给解码器，旧缓冲保活对应分配。成功后在 JS 线程映射新图像；Node Worker 退出时唤醒等待中的线程、结束解码并关闭异步句柄。

`Nan::AsyncWorker::Execute()` 在 libuv 工作线程中创建、读取和解码新的 `sf::Image`，或编码并保存快照；不访问 V8 或当前 ImageState。主线程的 `HandleOKCallback()` 创建外部 BackingStore，成功后替换当前图像并更新 JS 视图。文件路径以调用时的工作目录解析，直接由 SFML 在工作线程读取文件，不先经过 JS fs。多个加载可以并行，按完成顺序替换当前图像；需要确定顺序时逐次 await。加载期间仍可操作当前图像，成功完成后会被加载结果替换。

每个 Image 有稳定的 Native 句柄，指向 `ImageState -> shared_ptr<sf::Image>`。`.pixels` 返回缓存的可写 `Uint8Array`，映射 `sf::Image::getPixelsPtr()` 的连续 RGBA8 内存，无额外同步调用。像素的对齐需求为 1 字节，不依赖四字节整数的大小端。`getPixel()` 直接读共享内存并返回独立 Color，`setPixel()` 直接写四个字节，二者都检查坐标；`getSize()` 返回独立 Vector2u。

`getPixelsPtr()` 返回同一个数组的 `ReadonlyPixels` 类型视图，空图像返回 undefined。该类型允许索引读取、迭代和独立 `slice()`，隐藏修改方法、可写回调和 buffer/subarray 别名。只读限制在 TypeScript 层生效，运行时仍是原 Uint8Array，没有 Proxy 或逐字节访问器；需要修改时使用 `.pixels`。不应分离或调整像素视图的底层 buffer。

`resize()` 即使尺寸相同也新建并填充图像，再切换状态；不会保留原内容。旧视图的 BackingStore 独立持有原图像，无需复制旧像素。旧视图、旧 buffer 或其子视图仍存活时，原分配继续有效；修改旧视图不影响新图像，最后一个引用释放后回收原内存。Image 包装对象可以先于像素视图被 GC。

异步 `loadFromMemory()` 在调用时复制输入字节，支持正确的 byteOffset／byteLength，拒绝已分离、可调整容量或 SharedArrayBuffer 输入。调用返回后可立即修改、分离或释放输入。异步保存同样在调用时复制当前图像，避免编码线程与 `.pixels` 写入发生数据竞争；保存结果反映调用时的像素。快照复制发生在主线程，耗时随字节数增长；文件 I/O 和编解码在工作线程执行。编码结果将 `std::vector<uint8_t>` 移入外部 BackingStore，绑定不再复制输出。共享像素映射是零拷贝，输入快照、保存快照及 SFML 解码器内部复制不属于零拷贝。

`createMaskFromColor()`、`flipHorizontally()`、`flipVertically()`、`copy()` 各用一次原生调用，原位修改像素并保持当前视图身份。遮罩比较完整 RGBA，alpha 按 uint8 转换；copy 使用 SFML 的矩形检查、目标裁剪和整数 alpha over 运算，失败返回 false 且不改图像。自复制先建立源快照，明确支持重叠区域，避免上游 memcpy 路径的重叠未定义行为。

测试包含 6 种编码格式（png、bmp、tga、jpg、jpeg、qoi）往返、Unicode 文件路径、异常参数、失败保留、输入分离、异步快照、并发加载、GC 回收与实际纹理渲染。JPEG 按有损格式检查；逐字节比较使用无损格式。`native/image-state.h` 定义所有权与映射，`native/image-binding.cc` 提供批量操作和异步任务，独立的 `test/native/image-probes.cc` 验证指针共享及分配生命周期。

构建后执行 `node tools/benchmark-image.cjs` 可复测 16×16 与 1024×1024 的复制、翻转、遮罩和 PNG／QOI 编解码。输出每操作毫秒数，采用预热后五次采样中位数，同时给出 JS 调用、C++ 内部循环与 JS 数组操作基线；编解码总时间包含快照、排队和回调，另列提交阶段耗时。掩码用不匹配像素测扫描，复制用独立源图像；文件与压缩结果受缓存、图像内容和机器负载影响，不设性能通过阈值。

2026 年 9 月 20 日在 macOS arm64、Node.js 22.22.2 上的单独基准结果如下，单位均为每操作毫秒。C++ 基线的一批循环仅跨一次 NAN，绑定列为每次调用公开 Image 方法。

| 尺寸 | 操作 | Image 绑定 | C++ 循环 | JS 数组基线 |
|------|------|-----------:|---------:|------------:|
| 16×16 | 水平翻转 | 0.000303 | 0.000195 | 0.000480 |
| 16×16 | 垂直翻转 | 0.000108 | 0.000011 | 0.000508 |
| 16×16 | 遮罩扫描 | 0.000218 | 0.000074 | 0.000212 |
| 16×16 | 整幅复制 | 0.000264 | 0.000027 | 0.000062 |
| 1024×1024 | 水平翻转 | 0.693 | 0.692 | 1.814 |
| 1024×1024 | 垂直翻转 | 0.063 | 0.063 | 1.847 |
| 1024×1024 | 遮罩扫描 | 0.264 | 0.268 | 0.695 |
| 1024×1024 | 整幅复制 | 0.054 | 0.056 | 0.051 |

大图的绑定耗时接近 C++ 循环；微小差值受测量噪声影响。小图会体现跨语言开销，同尺寸整幅复制的 `pixels.set(source.pixels)` 更快，但只覆盖复制全部字节的情形，不包含矩形检查、裁剪或 alpha 混合。JS 翻转基线是逐字节循环，不代表所有 JS 优化方案。

| 尺寸／格式 | 内存编码 | 内存解码 | 文件保存 | 文件加载 | 编码提交阶段 |
|-----------|---------:|---------:|---------:|---------:|-------------:|
| 16×16 PNG | 0.030 | 0.013 | 0.090 | 0.097 | 0.0025 |
| 16×16 QOI | 0.014 | 0.010 | 0.072 | 0.126 | 0.0030 |
| 1024×1024 PNG | 34.755 | 0.440 | 35.289 | 0.607 | 0.0663 |
| 1024×1024 QOI | 4.111 | 1.521 | 18.325 | 2.399 | 0.0665 |

这组输入为确定性的 RGBA 模式，1024×1024 的 PNG 输出 42,531 字节，QOI 输出 5,242,902 字节，不能据此概括真实照片的格式优劣。编码提交阶段包含主线程快照与排队，完整编码等待时间包含工作线程执行。

## 验证范围

在仓库根目录执行 `npm test`，完成 lint、构建、类型检查和运行时测试；已构建时可单独运行 `npm run test:runtime`。测试按文件串行执行，覆盖公开 API、SFML 原生对照、像素结果、异步 I/O、资源快照与生命周期。具体测试清单以 [test/](../test/) 为准。

本地验证环境为 macOS arm64、Node.js 22.22.2。实体摇杆、传感器采样、全屏切换和 geometry shader 成功路径未实机验证。SFML 3.1.0 的 macOS 构建不提供 Vulkan 后端，Windows／X11 的 surface 创建成功路径未实机验证。平台 CI 配置不代表这些硬件能力已经验证。
