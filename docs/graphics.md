# Graphics

**English** · [简体中文](graphics.zh-CN.md) · [日本語](graphics.ja.md) · [한국어](graphics.ko.md)

> Prepare assets with Image/Texture, organize scenes with Sprite, Shape, Text or vertices, then draw them with RenderWindow or RenderTexture.

[API guide](api.md) · [Windows and events](window.md) · [Draw snapshots](concepts.md#draw-snapshots)

## Image: CPU pixels

Image stores RGBA8 pixels; `.pixels` is a Uint8Array mapped directly to the native allocation:

```typescript
import { Image, Color, Vector2u } from 'sfml.js';

const image = new Image(new Vector2u(64, 64), Color.White);
image.setPixel(new Vector2u(0, 0), Color.Red);
image.pixels[3] = 128;
if (!await image.saveToFile('image.png')) throw new Error('Cannot save image');
```

| API | Behavior |
| --- | --- |
| Default construction, size and color, size and RGBA bytes, copy construction | Create an independent pixel resource |
| `loadFromFile/Memory/Stream()` | Asynchronous loading; returns boolean |
| `saveToFile()`/`saveToMemory(format)` | Asynchronous encoding; returns boolean/bytes or undefined, respectively |
| `getSize()`, `getPixel()`, `setPixel()` | Size and single-pixel operations |
| `pixels`/`getPixelsPtr()` | Writable view/read-only typed view; the latter is undefined for an empty image |
| `resize(size, color?)` | Reallocate and fill; old contents are not preserved even when the size is unchanged |
| `copy()`, `createMaskFromColor()`, `flipHorizontally()`, `flipVertically()` | Region copying, masking and flipping |

Raw RGBA input must have a length of width * height * 4 and is copied during construction. After a successful reload or resize, old views keep the old allocation alive; a failed load preserves the current image. Do not detach or resize the pixel buffer.

Asynchronous memory loading copies encoded input at call time; asynchronous saving copies the pixels at call time. Reading, decoding and encoding run in the background, but taking snapshots still has a main-thread cost. See [System](system.md#input-streams) for input-stream rules.

## Texture: GPU textures

```typescript
import { Texture, Sprite } from 'sfml.js';

const texture = new Texture();
if (!await texture.loadFromFile('sprite.png')) {
  throw new Error('Cannot load sprite.png');
}
texture.setSmooth(true);
const sprite = new Sprite(texture);
```

Default construction suits asynchronous loading; `new Texture(size)` allocates GPU storage, `new Texture(image)` uploads a decoded image, and `new Texture(sourceTexture)` copies GPU contents. The latter two do not read files.

| API | Behavior |
| --- | --- |
| `loadFromFile/Memory/Stream(source, sRgb?, area?)` | Decode asynchronously and upload on the calling thread; area is an IntRect |
| `loadFromImage(image, sRgb?, area?)` | Synchronous upload; returns boolean |
| `update(pixels)`/`update(pixels, size, dest)` | Upload all/a region of RGBA pixels |
| `update(imageOrTextureOrWindow, dest?)` | Copy source contents |
| `resize(size, sRgb?)` | Recreate storage; pixel contents are undefined on success |
| `copyToImage()` | Synchronous GPU readback into an independent Image |
| `assign(source)`/`swap(other)` | Independent copy/content swap, preserving target object identity |
| `setSmooth()`/`setRepeated()` | Smooth/repeated sampling |
| `generateMipmap()` | Generate mipmaps; regenerate after updating contents |
| `getNativeHandle()`/`Texture.bind()` | OpenGL name/binding in the current context |
| `Texture.getMaximumSize()` | Maximum texture side length on the current device |

Failed loads preserve old contents. Multiple loads take effect in completion order; await sequentially for a deterministic order. GPU upload and readback are synchronous, and large textures occupy the calling thread.

Partial update does not scale or crop, and an out-of-bounds destination region throws. Loading uses the full image if either dimension of the crop rectangle is zero; other nonempty regions are adjusted to image bounds. Invalid negative sizes or out-of-bounds origins are rejected.

Texture size changes do not automatically update a Sprite's texture rectangle; call `sprite.setTexture(texture, true)` when you need the full image. Before changing texture contents or sampling settings, the binding submits draws that depend on the old state.

## Sprite and transforms

Sprite must be constructed from a Texture or another Sprite. Copying a Sprite copies its appearance and transform while referencing the same texture.

| API | Semantics |
| --- | --- |
| `setPosition()`/`move()` | Position and relative movement, using Vector2f |
| `setRotation()`/`rotate()` | Angle and relative rotation, using Angle |
| `setScale()`/`scale()`, `setOrigin()` | Scale and origin, using Vector2f |
| `getTransform()`/`getInverseTransform()` | Cached read-only matrices, updated when queried |
| `setTexture(texture, resetRect?)` | Switch texture, preserving the texture rectangle by default |
| `setTextureRect(rect)` | Copy the rectangle; negative sizes can flip the image |
| `setColor(color)` | Color and alpha modulation |
| `getLocalBounds()`/`getGlobalBounds()` | Local/own-transformed axis-aligned bounds |

Transform getters return independent position, scale, origin and angle values. Write changes back through setters. In contrast, `getTextureRect()` returns a read-only live view that subsequent setters update.

Global bounds do not include outer RenderStates passed to draw. Shape and Text provide the same transform APIs.

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

ConvexShape accepts a point count; then use `setPoint()` to fill in the convex polygon's vertices. All three shape classes support same-type copy construction, textures, fills, outlines and bounds queries.

For a custom shape, extend Shape, implement `getPointCount()` and `getPoint()`, and call protected `update()` after changing the points. The point set must form a convex shape. update generates geometry; submitting a draw does not query the JS point methods again.

Outline thickness may be negative; the miter limit defaults to 10 and has a minimum of 1. Commands referencing old geometry are submitted before geometry, outline thickness or the miter limit changes.

## Font, Glyph and Text

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

Font loads through `openFromFile/Memory/Stream()`, not loadFromFile. Failed loads preserve the old font. Memory input is held natively; for file input, keep the source file available while the font is in use.

Font provides glyphs, kerning, line spacing, ascent, descent and underline metrics. `getGlyph()` queries by Unicode code point, while `getGlyphById()` queries by the font's internal identifier; `getTexture(size)` returns a read-only atlas that grows as glyphs are added.

Text supports font, string, character size, spacing, fill, outline, style, line alignment, grapheme grouping and text direction settings. `getShapedGlyphs()` returns a glyph list; `setGlyphPreProcessor()` can adjust appearance per glyph.

The cluster values from `getShapedGlyphs()` and preprocessing callbacks use JS UTF-16 indices: for example, `A😀中` gives 0, 1 and 3. The deprecated `findCharacterPos()` uses Unicode code-point indices. Preprocessing callbacks must not modify layout properties or query geometry on the current Text.

`getVertexData()` and `getOutlineVertexData()` provide editable vertices. Changes affect subsequent draws; relayout generates new geometry, while old views keep the original allocation alive. Each draw saves a vertex snapshot.

## View and coordinates

View controls the center, size, rotation, viewport and scissor:

```typescript
import { RenderTexture, View, Vector2u, Vector2f } from 'sfml.js';

const target = new RenderTexture(new Vector2u(800, 600));
const camera = new View(target.getDefaultView());
camera.move(new Vector2f(100, 0));
camera.zoom(0.5);
target.setView(camera);
```

setView copies by value. `getView()` and `getDefaultView()` return stable read-only references; copy into a View when you need to make changes.

`mapPixelToCoords(Vector2i, view?)` converts pixels to world coordinates; `mapCoordsToPixel(Vector2f, view?)` performs the reverse conversion. Omitting view uses the current view.

viewport and scissor use normalized rectangles relative to the entire target. scissor must lie within `[0, 1]` and affects draw, clear and clearStencil.

## RenderTexture and off-screen composition

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

`getTexture()` returns a stable read-only GPU texture view; it neither copies pixels nor implicitly calls display. `flush()` only submits draws; display is still required before sampling new contents. A target cannot directly sample its own texture.

Successful `resize(size, settings?)` resets the current and default views and leaves pixel contents undefined; failure preserves the original target. Existing texture views remain valid, but associated Sprites' texture rectangles must be reset as needed.

ContextSettings supports depthBits, stencilBits, antiAliasingLevel, majorVersion, minorVersion, attributeFlags and sRgbCapable. Actual capabilities depend on the driver; SFML Graphics requires a compatibility OpenGL context.

## Drawable and RenderStates

Custom composite objects extend Drawable and implement synchronous protected draw. Each call receives an independent RenderStates value copy, while resource references remain shared:

```typescript
import { Drawable, RenderTarget, RenderStates, Transformable } from 'sfml.js';

class Group extends Drawable {
  /** Local transform of the composite object. */
  readonly pose = new Transformable();

  /** Retain child objects in drawing order. */
  constructor(readonly children: Drawable[]) { super(); }

  /** Combine the local transform with the parent state, then draw each child. */
  protected draw(target: RenderTarget, states: RenderStates): void {
    states.transform.combine(this.pose.getTransform());
    for (const child of this.children) target.draw(child, states);
  }
}
```

| RenderStates field | Default |
| --- | --- |
| transform | Identity transform |
| blendMode | BlendAlpha |
| stencilMode | Default StencilMode |
| coordinateType | CoordinateType.Pixels |
| texture/shader | null |

draw accepts RenderStates, state options, or individual Transform, Texture, Shader, BlendMode, StencilMode and similar values. Sprite and Shape use their own textures and coordinate modes.

Stencil masking requires stencilBits on the target. `clear(color, stencil)` clears both color and stencil, while `clearStencil()` clears only stencil. BlendMode provides Alpha, Add, Multiply, Min, Max and None presets.

## Vertices and GPU buffers

```typescript
import { VertexArray, Vertex, PrimitiveType, Vector2f, Color } from 'sfml.js';

const triangle = new VertexArray(PrimitiveType.Triangles, 3);
triangle.setVertex(0, new Vertex(new Vector2f(10, 10), Color.Red));
triangle.setVertex(1, new Vertex(new Vector2f(100, 10), Color.Green));
triangle.setVertex(2, new Vertex(new Vector2f(10, 100), Color.Blue));
triangle.getVertex(1).position.x = 120;
```

VertexArray supports get/setVertex, append, resize, clear, getBounds and iteration. draw immediately saves a contiguous vertex snapshot; later edits or capacity growth do not change recorded output. Reacquire members after structural changes, and do not change the structure during iteration.

SFML 3 supports Points, Lines, LineStrip, Triangles, TriangleStrip and TriangleFan. Organize multiple squares as triangles in one VertexArray to reduce actual SFML draw calls.

VertexBuffer stores vertices on the GPU; call `create(count)`, then `update(vertices)`, checking both boolean return values. Usage provides Stream, Dynamic and Static. Draw a range with `target.draw(buffer, firstVertex, vertexCount, states?)`.

`assign()` deep-copies GPU data, primitive type and usage; `update(sourceBuffer)` copies data while preserving the target's primitive type and usage; `swap()` exchanges resources. Old draws are submitted before storage changes. GL names may change, so reacquire them before use.

## Shader, Transform and GLSL

Shader uses asynchronous `loadFromFile/Memory/Stream()`, supporting a single stage or vertex/fragment/geometry combinations. A successful reload replaces the program and clears uniform state; failure preserves the old program.

`setUniform()` accepts number, boolean, Glsl vectors/matrices, Texture and `Shader.CurrentTexture`. number defaults to float; use the third argument `'int'` for integers. Existing draws are submitted before uniforms change.

`Glsl.Vec2/3/4`, `Ivec2/3/4` and `Bvec2/3/4` correspond to GLSL vectors. Mat3/Mat4 are constructed from arrays, same-size matrices or Transform; `.array` is a column-major Float32Array. Four-dimensional vectors and matrices do not provide the general vector arithmetic operators.

Transform supports translation, rotation, scaling and combine, modifying and returning itself. Composition uses right multiplication: `translate(...).scale(...)` scales a point first, then translates it. getMatrix returns a read-only live array; inverting a singular matrix returns an independent identity transform.

Query capabilities through `Shader.isAvailable()`, `isGeometryAvailable()` and `VertexBuffer.isAvailable()`. Explicitly submit existing SFML commands before directly using Texture/Shader/VertexBuffer bind.

## Examples and performance verification

The [examples directory](../examples/README.md) provides separate entry points for textures, sprites, text, vertices, composite drawing and off-screen composition.

After building, run `tools/benchmark-image.cjs`, `tools/benchmark-drawable.cjs` and `tools/benchmark-vertex-array.cjs` to measure the current implementation. Calling-thread time in these benchmarks includes recording, submission and driver work; it cannot be treated directly as GPU time or actual game frame rate.

<a id="sfml-cpp-reference"></a>

## SFML C++ reference

- Images and drawables: [Image](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Image.html), [Texture](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Texture.html), [Sprite](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Sprite.html), [Shape](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Shape.html) and [Drawable](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Drawable.html).
- Text and cameras: [Font](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Font.html), [Text](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Text.html) and [View](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1View.html).
- Rendering and geometry: [RenderTexture](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1RenderTexture.html), [RenderTarget](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1RenderTarget.html), [Shader](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Shader.html), [VertexArray](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1VertexArray.html) and [VertexBuffer](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1VertexBuffer.html).

Use these original C++ references for rendering concepts. Resource construction, asynchronous loading and draw snapshots follow this JavaScript guide and the [core concepts](concepts.md#draw-snapshots), not C++ constructor or immediate-drawing assumptions.
