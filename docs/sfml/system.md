# System

**English** · [简体中文](system.zh-CN.md) · [日本語](system.ja.md) · [한국어](system.ko.md)

> System provides value types, time, input streams, Unicode boundaries and error handling. Ordinary numeric calculations run in JS; resource-related operations enter native code through the relevant APIs.

[API guide](api.md) · [Core concepts](concepts.md)

## Vectors and operations

```typescript
import { Vector2f, Vector2i, add, multiply, addAssign } from 'sfml.js';

const position = new Vector2f(10, 20);
const velocity = new Vector2f(2, 3);
const next = add(position, velocity);
const doubled = multiply(velocity, 2);
addAssign(position, velocity);
const pixels = new Vector2i(position);
```

Ordinary operations return independent values; `*Assign` modifies and returns the left operand. Assignment does not automatically convert a vector's scalar type; use the corresponding constructor for conversion.

| Scalar tag | JS component type | Storage |
| --- | --- | --- |
| `i8`/`u8` | number | Int8Array/Uint8Array |
| `i16`/`u16` | number | Int16Array/Uint16Array |
| `i32`/`u32` | number | Int32Array/Uint32Array |
| `i64`/`u64` | bigint | BigInt64Array/BigUint64Array |
| `f32`/`f64` | number | Float32Array/Float64Array |

`Vector2i/u/f` and `Vector3i/u/f` correspond to i32/u32/f32. For other scalars, use forms such as `new Vector2('f64', x, y)`.

Both vector types provide `lengthSquared()`, `dot()`, `cross()` and component-wise multiplication and division; 2D vectors also provide `perpendicular()`. Floating-point vectors provide `length()` and `normalized()`, with additional angle, rotation and projection operations for floating-point 2D vectors. Integer vectors do not support floating-point-only methods.

Vector `multiply()`/`divide()` use scalars; use `componentWiseMul()`/`componentWiseDiv()` for component-wise operations. Zero divisors, normalizing a zero vector and projecting onto a zero axis throw errors. 64-bit integer calculations retain bigint; f32 calculations round according to SFML precision rules, with limited platform math-library differences allowed for trigonometric operations.

## Angles

```typescript
import { Angle, degrees, radians, divide } from 'sfml.js';

const heading = degrees(90);
const turn = radians(Math.PI);
const copy = new Angle(heading);
const ratio = divide(turn, heading);
console.log(copy.asDegrees(), ratio);
```

Rotation APIs accept Angle. `wrapSigned()` and `wrapUnsigned()` return wrapped angles; comparisons do not wrap automatically. `Angle.Zero` is a read-only constant; copy it before modifying it. Angle uses float32, and modulo requires a positive divisor.

## Time and clocks

```typescript
import { Clock, milliseconds, microseconds, sleep } from 'sfml.js';

const clock = new Clock();
await sleep(milliseconds(16));
const elapsed = clock.restart();
console.log(elapsed.asSeconds(), elapsed.asMicroseconds());
console.log(microseconds(1000n).asMilliseconds());
```

| API | Semantics |
| --- | --- |
| `new Time()`/`new Time(source)`/`new Time(bigint)` | Construct zero duration, a copy or a microsecond value |
| `seconds(number)` | Convert seconds to Time |
| `milliseconds(number)` | int32 millisecond input, with fractions truncated toward zero |
| `microseconds(bigint)` | Microsecond input |
| `asMicroseconds()`/`toDuration()` | Microsecond bigint |
| `asSeconds()`/`asMilliseconds()` | float32 seconds/int32 milliseconds |
| `Clock.start()`/`stop()` | Resume/pause timing |
| `Clock.restart()`/`reset()` | Return previous elapsed time, then zero and run/pause |

Time stores signed int64 microseconds, using bigint for integer scaling and number for floating-point scaling. `Time.Zero` is a read-only constant. Out-of-range values and invalid division throw RangeError; failed in-place operations preserve the original value.

Clock uses `process.hrtime.bigint()` and returns independent Time snapshots. It has no timer of its own; clock resolution and system-suspend semantics are determined by Node.js and the platform.

`sleep(time)` returns a promise and waits using a Node timer without blocking the event loop. Positive durations round up to milliseconds; zero and negative durations complete immediately. Actual resumption time depends on scheduling.

### Timeout configuration

`TimeoutWithPredicate` stores a polling period and predicate; it does not start a timer itself:

- `new TimeoutWithPredicate(time)`: fixed period; the predicate always returns false.
- `new TimeoutWithPredicate(predicate, period?)`: default period of 1 ms; true means continue waiting.
- `getPeriod()` returns a read-only Time, and `getPredicate()` returns the original function.

The receiving API determines when checks occur. SFTP currently uses it to control waiting without progress; see [Network](network.md#sftp).

`SuspendAwareClock.now()` returns a native nanosecond time point that includes system suspend time. Only the Android branch supports it; desktop calls throw SFMLError. The current automatic download flow has no Android build target.

## Colors, rectangles and vertices

| Type | Construction and main operations |
| --- | --- |
| Color | RGB/RGBA, `0xRRGGBBAA`, copying; `r/g/b/a`, `toInteger()` |
| FloatRect/IntRect | `position` + `size`, copying, explicit conversion; `contains()`, `findIntersection()`, `getCenter()` |
| Vertex | `position`, `color`, `texCoords`, or copy construction |

These values are primarily used by graphics APIs. Color components are stored as uint8, and direct writes narrow to that type. Color addition and subtraction saturate; multiplication computes `floor(a * b / 255)` per channel. Color constants are read-only.

Rectangle and vertex members are shared views. Rectangles include the left and top edges and exclude the right and bottom edges. Negative sizes use normalized bounds; an intersection without positive area returns `undefined`. Vertex defaults to zero position and texture coordinates, with white color.

<a id="input-streams"></a>

## Input streams

InputStream is a seekable byte-stream protocol whose methods may return synchronous values or promises:

| Method | Return value |
| --- | --- |
| `read(data)` | Writes into a Uint8Array and returns the actual byte count as bigint; EOF is `0n` |
| `seek(position)` | Actual byte position as bigint |
| `tell()` | Current byte position as bigint |
| `getSize()` | Total byte count as bigint |

`undefined` indicates I/O failure; thrown errors propagate unchanged. Any object implementing these four methods can also be passed as a stream; a Node Readable needs an additional adapter to support seeking.

`MemoryInputStream(data)` retains a reference to the input bytes. Keep contents unchanged during loading and give each operation exclusive cursor access. `FileInputStream` uses a Node file handle, serializing asynchronous I/O and seeking per object:

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

Wait for loading to finish before closing the stream. Await multiple loads on the same stream sequentially. FileInputStream supports file offsets from 0 to 2^53 - 1; EOF does not automatically close the file, so seeking again is allowed.

## Unicode and version

`Unicode.isGraphemeBoundary(text, position)`, `isWordBoundary()` and `isSentenceBoundary()` use SFML's Unicode rules. position is a UTF-16 index into a JS string, ranging from 0 to `text.length`; the middle of a surrogate pair is not a boundary.

`version()` returns a cached, read-only SFML runtime version containing `major`, `minor`, `patch`, `isRelease` and `string`. It is not the npm package version.

## Errors and logging

SFMLError indicates a binding or SFML runtime failure; test it with `instanceof SFMLError`. Argument errors use TypeError/RangeError; errors thrown by user callbacks propagate unchanged. Ordinary SFML failure statuses remain false/undefined rather than all being converted to exceptions.

`err()` returns a singleton Node Writable that writes to `sf::err()`. `setErrorOutput(writable)` redirects SFML logs; pass null to silence them, or no arguments to restore the default stderr:

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

Log routing is process-wide, and Workers share the latest setting; Node's own stderr is unaffected. Background logs are dispatched in byte chunks without guaranteed UTF-8 character or line boundaries; use StringDecoder when parsing text.

<a id="sfml-cpp-reference"></a>

## SFML C++ reference

The original references for [Vector2](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Vector2.html), [Angle](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Angle.html), [Time](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Time.html), [Clock](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Clock.html) and [InputStream](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1InputStream.html) describe the upstream math, time and stream concepts.

For JavaScript, follow this guide's named operators, bigint time representation, promise-based sleep and stream method contracts rather than copying C++ signatures.
