# Core Concepts

**English** · [简体中文](concepts.zh-CN.md) · [日本語](concepts.ja.md) · [한국어](concepts.ko.md)

> When using sfml.js, distinguish values, resources and views, then distinguish command recording, submission and presentation. These boundaries determine copying, asynchronous loading and drawing behavior.

[Documentation](README.md) · [API guide](api.md)

## Values, resources and views

Value types such as vectors, angles, colors, rectangles, vertices and matrices start with JS TypedArray storage. Calculations run in JavaScript; a native handle wraps the same memory only when needed. `Time` uses a microsecond `bigint`.

Resources such as Texture, Image, Sprite, Text and audio objects are managed natively. JS wrappers and live views keep their allocations alive; resource release follows the owning thread and the lifetime of underlying dependencies.

```typescript
import { FloatRect, Vector2f } from 'sfml.js';

const rect = new FloatRect(new Vector2f(10, 20), new Vector2f(100, 80));
const member = rect.position;
member.x = 30;                     // A member view: modifies rect.

const copy = new Vector2f(member);
copy.x = 90;                       // An independent copy: does not affect rect.

rect.position = new Vector2f(5, 6); // Copies by value; member still refers to rect's member.
```

Ordinary JS assignment still assigns a reference. Use a copy constructor for an independent value. Resource copying rules vary by class: for example, `new Texture(texture)` copies GPU contents, while `new Sprite(sprite)` copies sprite properties but shares the texture.

Do not assume a return value is independent just because the method is named `get...()`:

| Access | Ownership and update behavior |
| --- | --- |
| `sprite.getPosition()` | Independent vector; call `setPosition()` after modifying the result |
| `rect.position`, `vertex.color` | Member views of the parent value; writes directly modify the parent |
| `image.pixels` | Writable RGBA view of the current image allocation |
| `target.getTexture()` | Stable read-only texture view of a RenderTexture |
| `vertexArray.getVertex(i)` | Member of current vertex storage; reacquire after structural changes |
| `soundBuffer.getSamples()` | Read-only typed view that keeps the PCM allocation alive; `undefined` for an empty buffer |

After an Image is successfully reloaded or resized, old pixel views keep the old allocation alive; they do not automatically switch to the new image. Old VertexArray members also refer to old storage after capacity growth; shrinking and expanding within capacity may reuse slots.

Constraints such as `ReadonlyValue`, `ReadonlyPixels` and `ReadonlySamples` are primarily expressed through TypeScript; not every read-only type is frozen at runtime. Copy read-only data before modifying it, and do not transfer, detach or resize the underlying shared buffer.

## Resource loading and promises

Use `loadFromFile/Memory/Stream()` for images and textures, and `openFromFile/Memory/Stream()` for fonts and music. These methods return promises:

```typescript
import { Texture } from 'sfml.js';

const texture = new Texture();
if (!await texture.loadFromFile('sprite.png')) {
  throw new Error('Cannot decode sprite.png');
}
```

Image/Texture file reading and decoding run in the background; the final texture upload to the GPU is still synchronous on the calling thread. `new Texture(image)`, pixel uploads and GPU readback are synchronous. Failed asynchronous loads generally preserve the old resource; ordinary SFML failures return `false` or `undefined`.

Multiple asynchronous loads on the same image or texture publish results in completion order. Use sequential `await` calls when you need a deterministic replacement order; do not rely on the order in which loads were started.

Input memory ownership varies by module:

| Input | Caller responsibility |
| --- | --- |
| Encoded bytes for Image/Texture | Snapshotted at call time; the original input may be modified afterward |
| `MemoryInputStream` | Retains a reference to the original bytes; keep contents unchanged during loading and give the operation exclusive cursor access |
| Asynchronous Audio reads/writes | Keep the relevant buffers unchanged until the promise completes |
| `Music.openFromMemory()` | Keep input unchanged until closing or reopening |

See [System](system.md#input-streams) and [Audio](audio.md) for the specific stream and audio contracts.

<a id="draw-snapshots"></a>

## Draw snapshots

`target.draw()` records properties and state at call time. Modifying the original object and drawing again creates another snapshot:

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

The final image contains two squares. Sprite properties, RenderStates, vertex data and required resource references are saved during recording. Before a subsequent change to texture pixels, geometry or shader uniforms, the binding submits commands that depend on the old state.

| Operation | Meaning |
| --- | --- |
| `clear()`, `draw()`, `setView()` | Record commands in order; a full queue may trigger early submission |
| `flush()` | Synchronously submit existing commands |
| `RenderWindow.display()` | Submit and swap window buffers |
| `RenderTexture.display()` | Submit and update the texture available for sampling |

`flush()` does not replace `display()` on an off-screen target. Call display before using new RenderTexture contents; sampling its own texture directly or creating cyclic dependencies between unsubmitted targets is rejected.

Batching reduces calls across the JS/C++ boundary; it does not automatically combine multiple sprites into one GPU draw. Organize large amounts of geometry sharing a texture into a VertexArray; use VertexBuffer for static geometry.

## Node.js event loop

Window operations run on the main thread. Use `pollEvent()` or `handleEvents()` each frame, and schedule the next frame with `setImmediate()`.

`waitEvent()` preserves SFML's synchronous waiting semantics. `sleep()` uses a Node timer and returns a promise; the event loop continues running while it waits. `display()` is synchronous and may be affected by frame limits, vertical sync and driver work.

Network I/O returns promises. `socket.setBlocking(true)` means the promise waits for the operation to become ready; it does not synchronously block the entire Node thread.

Audio Workers use bounded shared PCM slots, and callback views are valid only until that callback completes. Background Workers do not keep the process alive on their own; maintain a window loop or explicitly wait during playback.

## Errors and cleanup

| Result | Handling |
| --- | --- |
| `false`/`undefined`, SocketStatus, protocol responses | Check the returned status |
| `TypeError`/`RangeError` | Correct the argument type or range |
| `SFMLError` | Handle binding or underlying resource failures |
| Error thrown by a user callback | The original error object propagates |

SFML diagnostics go to stderr by default and can be routed with `setErrorOutput()`. Logging is not a substitute for checking return values.

Use `close()` for windows and each network object's shutdown API. Use `await` for asynchronous cleanup of file streams and audio Workers. Relying solely on garbage collection cannot guarantee completed file writes, timely connection shutdown or drained recording queues. See the relevant module guide for resource shutdown methods.
