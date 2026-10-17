# System

[English](system.md) · **简体中文** · [日本語](system.ja.md) · [한국어](system.ko.md)

> System 提供值类型、时间、输入流、Unicode 边界和错误处理。普通数值计算在 JS 中完成，资源相关操作按接口进入 Native。

[API 导航](api.zh-CN.md) · [核心概念](concepts.zh-CN.md)

## 向量与运算

```typescript
import { Vector2f, Vector2i, add, multiply, addAssign } from 'sfml.js';

const position = new Vector2f(10, 20);
const velocity = new Vector2f(2, 3);
const next = add(position, velocity);
const doubled = multiply(velocity, 2);
addAssign(position, velocity);
const pixels = new Vector2i(position);
```

普通运算返回独立值，`*Assign` 修改左操作数并返回它。赋值不自动转换向量的标量类型；需要转换时使用对应构造函数。

| 标量标签 | JS 分量类型 | 存储 |
| --- | --- | --- |
| `i8`／`u8` | number | Int8Array／Uint8Array |
| `i16`／`u16` | number | Int16Array／Uint16Array |
| `i32`／`u32` | number | Int32Array／Uint32Array |
| `i64`／`u64` | bigint | BigInt64Array／BigUint64Array |
| `f32`／`f64` | number | Float32Array／Float64Array |

`Vector2i/u/f` 和 `Vector3i/u/f` 分别对应 i32／u32／f32。其他标量使用 `new Vector2('f64', x, y)` 等形式。

两种向量提供 `lengthSquared()`、`dot()`、`cross()` 和逐分量乘除，二维向量另有 `perpendicular()`。浮点向量提供 `length()` 与 `normalized()`，浮点二维向量还提供角度、旋转和投影操作。整数向量不支持浮点专属方法。

向量的 `multiply()`／`divide()` 使用标量，逐分量操作使用 `componentWiseMul()`／`componentWiseDiv()`。零除数、零向量归一化和向零轴投影会抛错。64 位整数计算保留 bigint；f32 计算按 SFML 的精度规则舍入，三角运算允许平台数学库的有限差异。

## 角度

```typescript
import { Angle, degrees, radians, divide } from 'sfml.js';

const heading = degrees(90);
const turn = radians(Math.PI);
const copy = new Angle(heading);
const ratio = divide(turn, heading);
console.log(copy.asDegrees(), ratio);
```

旋转接口接受 Angle。`wrapSigned()`、`wrapUnsigned()` 返回折回后的角度；比较不会自动折回。`Angle.Zero` 为只读常量，复制后可修改。Angle 使用 float32，取模要求正除数。

## 时间与时钟

```typescript
import { Clock, milliseconds, microseconds, sleep } from 'sfml.js';

const clock = new Clock();
await sleep(milliseconds(16));
const elapsed = clock.restart();
console.log(elapsed.asSeconds(), elapsed.asMicroseconds());
console.log(microseconds(1000n).asMilliseconds());
```

| 接口 | 语义 |
| --- | --- |
| `new Time()`／`new Time(source)`／`new Time(bigint)` | 零时长、复制、微秒构造 |
| `seconds(number)` | 秒转换为 Time |
| `milliseconds(number)` | int32 毫秒输入，小数向零截断 |
| `microseconds(bigint)` | 微秒输入 |
| `asMicroseconds()`／`toDuration()` | 微秒 bigint |
| `asSeconds()`／`asMilliseconds()` | float32 秒／int32 毫秒 |
| `Clock.start()`／`stop()` | 继续／暂停计时 |
| `Clock.restart()`／`reset()` | 返回原耗时，清零后运行／暂停 |

Time 保存有符号 int64 微秒，整数倍运算使用 bigint，浮点倍数使用 number。`Time.Zero` 为只读常量。超范围和非法除法抛出 RangeError，失败的原位运算保留原值。

Clock 使用 `process.hrtime.bigint()`，返回独立 Time 快照。它没有自己的定时器，时钟分辨率与系统休眠语义由 Node.js 和平台决定。

`sleep(time)` 返回 Promise，通过 Node 定时器等待，不阻塞事件循环。正时长向上取整到毫秒；零与负时长直接完成，实际恢复时间受调度影响。

### 超时配置

`TimeoutWithPredicate` 保存检查周期与谓词，本身不启动计时器：

- `new TimeoutWithPredicate(time)`：固定周期，谓词始终返回 false。
- `new TimeoutWithPredicate(predicate, period?)`：默认周期 1 ms，true 表示继续等待。
- `getPeriod()` 返回只读 Time，`getPredicate()` 返回原函数。

接收它的接口决定何时检查，当前 SFTP 使用它控制无进展等待，详见 [Network](network.zh-CN.md#sftp)。

`SuspendAwareClock.now()` 返回包含系统休眠时间的原生纳秒时间点，仅 Android 分支支持；桌面调用抛出 SFMLError。当前自动下载流程没有 Android 构建目标。

## 颜色、矩形与顶点

| 类型 | 构造与主要操作 |
| --- | --- |
| Color | RGB／RGBA、`0xRRGGBBAA`、复制；`r/g/b/a`、`toInteger()` |
| FloatRect／IntRect | `position` + `size`、复制、显式转换；`contains()`、`findIntersection()`、`getCenter()` |
| Vertex | `position`、`color`、`texCoords`，或复制构造 |

这些值主要用于图形接口。Color 分量按 uint8 存储，直接写入会窄化；颜色加减是饱和运算，颜色相乘按通道计算 `floor(a * b / 255)`。Color 常量只读。

矩形成员和顶点成员是共享视图。矩形包含左、上边界，排除右、下边界；负尺寸按归一化范围计算，交集无正面积时返回 `undefined`。Vertex 默认位置、纹理坐标为零，颜色为白色。

<a id="input-streams"></a>

## 输入流

InputStream 是可寻址字节流协议，方法可返回同步值或 Promise：

| 方法 | 返回值 |
| --- | --- |
| `read(data)` | 写入 Uint8Array，返回实际字节数 bigint；EOF 为 `0n` |
| `seek(position)` | 返回实际字节位置 bigint |
| `tell()` | 当前字节位置 bigint |
| `getSize()` | 总字节数 bigint |

`undefined` 表示 I/O 失败，抛出的错误原样传播。实现这四个方法的对象也可以作为流传入；Node Readable 需额外适配寻址能力。

`MemoryInputStream(data)` 保留输入字节引用。加载期间保持内容不变，并让单次操作独占游标。`FileInputStream` 使用 Node 文件句柄，按对象串行执行异步读写与寻址：

```typescript
import { FileInputStream, Image } from 'sfml.js';

async function readImage(filename: string) {
  const stream = new FileInputStream();
  try {
    if (!await stream.open(filename)) throw new Error('Cannot open file');
    const image = new Image();
    if (!await image.loadFromStream(stream)) throw new Error('Cannot decode image');
    return image;
  } finally {
    await stream.close();
  }
}
```

等待加载完成后再关闭流。同一个流的多次加载应逐次 await。FileInputStream 的文件偏移范围为 0～2⁵³−1；EOF 不会自动关闭文件，允许再次 seek。

## Unicode 与版本

`Unicode.isGraphemeBoundary(text, position)`、`isWordBoundary()`、`isSentenceBoundary()` 使用 SFML 的 Unicode 规则。position 是 JS 字符串的 UTF-16 下标，范围为 0～`text.length`；代理对中间不是边界。

`version()` 返回缓存的只读 SFML 运行时版本，包含 `major`、`minor`、`patch`、`isRelease` 与 `string`。它不是 npm 包版本。

## 错误与日志

SFMLError 表示绑定层或 SFML 运行失败，可用 `instanceof SFMLError` 判断。参数错误使用 TypeError／RangeError；用户回调抛出的错误原样传播。SFML 返回的普通失败状态仍是 false／undefined，不会全部转换成异常。

`err()` 返回单例 Node Writable，写入 `sf::err()`。`setErrorOutput(writable)` 重定向 SFML 日志，传入 null 静音，不传参数恢复默认 stderr：

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

日志路由是进程级配置，Worker 共用最近的设置；Node 自身的 stderr 不受影响。后台日志按字节块派发，不保证 UTF-8 字符或行边界，解析文本时可使用 StringDecoder。

<a id="sfml-cpp-reference"></a>

## SFML C++ 参考

数学与时间参考 [sf::Vector2](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Vector2.html)、[sf::Angle](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Angle.html)、[sf::Time](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Time.html) 和 [sf::Clock](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Clock.html)；流协议参考 [sf::InputStream](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1InputStream.html)。

上游说明可用于理解数学、时间和流的概念。JS 使用具名运算符、bigint 微秒、Promise sleep 和可异步的输入流方法，调用方式及边界以本文为准。
