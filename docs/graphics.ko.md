# Graphics

[English](graphics.md) / [简体中文](graphics.zh-CN.md) / [日本語](graphics.ja.md) / **한국어**

> Image/Texture로 리소스를 준비하고, Sprite, Shape, Text 또는 정점으로 장면을 구성한 뒤 RenderWindow나 RenderTexture에 그리기를 맡깁니다.

[API 안내](api.ko.md) · [창과 이벤트](window.ko.md) · [그리기 스냅샷](concepts.ko.md#draw-snapshots)

## Image: CPU 픽셀

Image는 RGBA8 픽셀을 저장하며, `.pixels`는 네이티브 할당을 직접 매핑한 Uint8Array입니다.

```typescript
import { Image, Color, Vector2u } from 'sfml.js';

const image = new Image(new Vector2u(64, 64), Color.White);
image.setPixel(new Vector2u(0, 0), Color.Red);
image.pixels[3] = 128;
if (!await image.saveToFile('image.png')) throw new Error('Cannot save image');
```

| 인터페이스 | 동작 |
| --- | --- |
| 빈 생성자, 크기와 색상, 크기와 RGBA 바이트, 복사 생성자 | 독립적인 픽셀 리소스 생성 |
| `loadFromFile/Memory/Stream()` | 비동기 로딩, boolean 반환 |
| `saveToFile()`/`saveToMemory(format)` | 비동기 인코딩. 각각 boolean/바이트 또는 undefined 반환 |
| `getSize()`, `getPixel()`, `setPixel()` | 크기 및 단일 픽셀 작업 |
| `pixels`/`getPixelsPtr()` | 쓰기 가능한 뷰/읽기 전용 타입 뷰. 후자는 빈 이미지에서 undefined |
| `resize(size, color?)` | 다시 할당하고 채움. 크기가 같아도 이전 내용을 유지하지 않음 |
| `copy()`, `createMaskFromColor()`, `flipHorizontally()`, `flipVertically()` | 영역 복사, 마스크, 뒤집기 |

원본 RGBA 입력 길이는 너비 × 높이 × 4여야 하며, 생성 시 복사합니다. 성공적으로 다시 로드하거나 resize한 뒤에도 이전 뷰는 이전 할당의 수명을 계속 유지합니다. 로딩 실패 시에는 현재 이미지를 유지합니다. 픽셀 buffer를 분리하거나 크기를 바꾸지 마세요.

비동기 메모리 로딩은 호출 시 인코딩된 입력을 복사하고, 비동기 저장은 호출 시 픽셀을 복사합니다. 읽기, 디코딩, 인코딩은 백그라운드에서 실행하지만 스냅샷에는 여전히 메인 스레드 비용이 발생합니다. 입력 스트림 사용 규칙은 [System](system.ko.md#input-streams)을 참고하세요.

## Texture: GPU 텍스처

```typescript
import { Texture, Sprite } from 'sfml.js';

const texture = new Texture();
if (!await texture.loadFromFile('sprite.png')) {
  throw new Error('Cannot load sprite.png');
}
texture.setSmooth(true);
const sprite = new Sprite(texture);
```

빈 생성자는 비동기 로딩에 적합합니다. `new Texture(size)`는 GPU 저장소를 할당하고, `new Texture(image)`는 디코딩된 이미지를 업로드하며, `new Texture(sourceTexture)`는 GPU 내용을 복사합니다. 마지막 두 방식은 파일을 읽지 않습니다.

| 인터페이스 | 동작 |
| --- | --- |
| `loadFromFile/Memory/Stream(source, sRgb?, area?)` | 비동기 디코딩 후 호출 스레드에서 업로드. area는 IntRect |
| `loadFromImage(image, sRgb?, area?)` | 동기식 업로드, boolean 반환 |
| `update(pixels)`/`update(pixels, size, dest)` | 전체/부분 RGBA 업로드 |
| `update(imageOrTextureOrWindow, dest?)` | 소스 내용 복사 |
| `resize(size, sRgb?)` | 저장소 재생성. 성공 후 픽셀은 정의되지 않음 |
| `copyToImage()` | 동기식 GPU 읽어오기로 독립적인 Image 생성 |
| `assign(source)`/`swap(other)` | 독립 복사/내용 교환. 대상 객체의 정체성은 유지 |
| `setSmooth()`/`setRepeated()` | 부드러운 샘플링/반복 샘플링 |
| `generateMipmap()` | mipmap 생성. 내용 업데이트 후 다시 생성해야 함 |
| `getNativeHandle()`/`Texture.bind()` | OpenGL 이름/현재 컨텍스트에 바인딩 |
| `Texture.getMaximumSize()` | 현재 장치의 최대 텍스처 변 길이 |

로딩 실패 시 이전 내용을 유지합니다. 여러 로딩은 완료 순서대로 적용되므로, 순서를 확정하려면 하나씩 await하세요. GPU 업로드와 읽어오기는 동기식 작업이며, 큰 텍스처는 호출 스레드를 점유합니다.

부분 update는 크기를 조정하거나 자르지 않으며, 대상 영역이 범위를 벗어나면 예외가 발생합니다. 로딩 시 자르기 사각형의 어느 한쪽 크기가 0이면 전체 이미지를 사용합니다. 그 밖의 비어 있지 않은 영역은 이미지 범위에 맞게 조정하며, 잘못된 음수 크기나 범위를 벗어난 시작점은 거부합니다.

텍스처 크기를 바꿔도 Sprite의 텍스처 사각형은 자동으로 바뀌지 않습니다. 전체 이미지가 필요하면 `sprite.setTexture(texture, true)`를 호출하세요. 텍스처 내용이나 샘플링 설정을 수정하기 전에 바인딩은 이전 상태에 의존하는 그리기를 제출합니다.

## Sprite와 변환

Sprite는 Texture나 다른 Sprite에서 생성해야 합니다. Sprite를 복사하면 외형과 변환을 복사하고 같은 텍스처를 참조합니다.

| 인터페이스 | 의미 |
| --- | --- |
| `setPosition()`/`move()` | 위치 및 상대 이동, Vector2f |
| `setRotation()`/`rotate()` | 각도 및 상대 회전, Angle |
| `setScale()`/`scale()`, `setOrigin()` | 배율과 원점, Vector2f |
| `getTransform()`/`getInverseTransform()` | 캐시된 읽기 전용 행렬. 조회 시 업데이트 |
| `setTexture(texture, resetRect?)` | 텍스처 전환. 기본적으로 텍스처 사각형 유지 |
| `setTextureRect(rect)` | 사각형 복사. 음수 크기로 뒤집기 가능 |
| `setColor(color)` | 색상 및 alpha 변조 |
| `getLocalBounds()`/`getGlobalBounds()` | 로컬/자체 변환 적용 후의 축 정렬 경계 |

변환 getter가 반환하는 위치, 배율, 원점, 각도는 독립적인 값입니다. 수정 후에는 setter로 다시 써야 합니다. 반면 `getTextureRect()`는 읽기 전용 실시간 뷰를 반환하며, 이후 setter가 이를 업데이트합니다.

global bounds에는 draw에 전달한 바깥쪽 RenderStates가 포함되지 않습니다. Shape와 Text도 같은 변환 인터페이스를 제공합니다.

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

ConvexShape는 점 개수를 받은 뒤 `setPoint()`로 볼록 다각형 정점을 채웁니다. 세 가지 도형 모두 같은 타입의 복사 생성자, 텍스처, 채우기, 윤곽선, 경계 조회를 지원합니다.

사용자 정의 도형은 Shape를 상속하여 `getPointCount()`와 `getPoint()`를 구현하고, 점 집합이 바뀐 뒤 protected `update()`를 호출합니다. 점 집합은 볼록 도형 조건을 만족해야 합니다. update가 지오메트리를 생성하며, 그리기를 제출할 때 JS 점 메서드를 다시 조회하지 않습니다.

윤곽선 두께는 음수일 수 있습니다. miter limit의 기본값은 10이고 최솟값은 1입니다. 지오메트리, 윤곽선 두께, miter limit를 변경하기 전에 이전 지오메트리를 참조하는 명령을 먼저 제출합니다.

## Font, Glyph, Text

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

Font의 로딩 메서드는 `openFromFile/Memory/Stream()`이며 loadFromFile이 아닙니다. 로딩 실패 시 이전 폰트를 유지합니다. 메모리 입력은 네이티브 측에서 보유합니다. 파일 방식에서는 폰트를 사용하는 동안 원본 파일에 접근할 수 있어야 합니다.

Font는 글리프, 커닝, 줄 간격, 어센더와 디센더, 밑줄 메트릭을 제공합니다. `getGlyph()`는 Unicode 코드 포인트로, `getGlyphById()`는 폰트 내부 번호로 조회합니다. `getTexture(size)`는 글리프가 추가됨에 따라 커지는 읽기 전용 아틀라스를 반환합니다.

Text는 폰트, 문자열, 글자 크기, 간격, 채우기, 윤곽선, 스타일, 줄 정렬, 자소 묶음, 텍스트 방향 설정을 지원합니다. `getShapedGlyphs()`는 글리프 목록을 반환하고, `setGlyphPreProcessor()`는 글리프별 외형을 조절할 수 있게 합니다.

`getShapedGlyphs()`와 전처리 콜백의 cluster는 JS UTF-16 인덱스를 사용합니다. 예를 들어 `A😀中`의 인덱스는 0, 1, 3입니다. 사용 중단 예정인 `findCharacterPos()`는 Unicode 코드 포인트 인덱스를 사용합니다. 전처리 콜백에서는 현재 Text의 레이아웃 속성을 다시 수정하거나 지오메트리를 조회할 수 없습니다.

`getVertexData()`와 `getOutlineVertexData()`는 편집 가능한 정점을 제공합니다. 수정은 이후 draw에 영향을 주며, 레이아웃을 다시 계산하면 새 지오메트리가 생성됩니다. 이전 뷰는 원래 할당의 수명을 유지합니다. 각 draw는 정점 스냅샷을 저장합니다.

## View와 좌표

View는 중심, 크기, 회전, viewport, scissor를 제어합니다.

```typescript
import { RenderTexture, View, Vector2u, Vector2f } from 'sfml.js';

const target = new RenderTexture(new Vector2u(800, 600));
const camera = new View(target.getDefaultView());
camera.move(new Vector2f(100, 0));
camera.zoom(0.5);
target.setView(camera);
```

setView는 값으로 복사합니다. `getView()`와 `getDefaultView()`는 안정적인 읽기 전용 참조를 반환하므로, 수정하려면 View로 복사하세요.

`mapPixelToCoords(Vector2i, view?)`는 픽셀을 월드 좌표로, `mapCoordsToPixel(Vector2f, view?)`는 반대 방향으로 변환합니다. view를 생략하면 현재 뷰를 사용합니다.

viewport와 scissor는 대상 전체에 대한 정규화된 사각형을 사용합니다. scissor는 `[0, 1]` 범위에 있어야 하며, draw, clear, clearStencil 모두에 영향을 줍니다.

## RenderTexture와 오프스크린 합성

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

`getTexture()`는 안정적인 읽기 전용 GPU 텍스처 뷰를 반환합니다. 픽셀을 복사하거나 암묵적으로 display를 호출하지 않습니다. `flush()`는 그리기만 제출하므로 새 내용을 샘플링하기 전에는 여전히 display가 필요합니다. 같은 대상에서 자신의 텍스처를 직접 샘플링할 수 없습니다.

`resize(size, settings?)`가 성공하면 현재 뷰와 기본 뷰를 초기화하며, 픽셀 내용은 정의되지 않습니다. 실패하면 원래 대상을 유지합니다. 기존 텍스처 뷰는 계속 유효하지만, 연결된 Sprite의 텍스처 사각형은 필요에 따라 다시 설정해야 합니다.

ContextSettings는 depthBits, stencilBits, antiAliasingLevel, majorVersion, minorVersion, attributeFlags, sRgbCapable을 지원합니다. 실제 기능은 드라이버의 영향을 받으며, SFML Graphics에는 호환 OpenGL 컨텍스트가 필요합니다.

## Drawable과 RenderStates

사용자 정의 복합 객체는 Drawable을 상속하여 동기식 protected draw를 구현합니다. 호출할 때마다 독립적인 RenderStates 값 복사본을 받지만, 리소스 참조는 계속 공유합니다.

```typescript
import { Drawable, RenderTarget, RenderStates, Transformable } from 'sfml.js';

class Group extends Drawable {
  /** 복합 객체의 로컬 변환입니다. */
  readonly pose = new Transformable();

  /** 순서대로 그릴 자식 객체를 보관합니다. */
  constructor(readonly children: Drawable[]) { super(); }

  /** 로컬 변환을 부모 상태에 합성한 뒤 각 자식 객체를 그립니다. */
  protected draw(target: RenderTarget, states: RenderStates): void {
    states.transform.combine(this.pose.getTransform());
    for (const child of this.children) target.draw(child, states);
  }
}
```

| RenderStates 필드 | 기본값 |
| --- | --- |
| transform | 항등 변환 |
| blendMode | BlendAlpha |
| stencilMode | 기본 StencilMode |
| coordinateType | CoordinateType.Pixels |
| texture/shader | null |

draw는 RenderStates, 상태 옵션 또는 개별 Transform, Texture, Shader, BlendMode, StencilMode 등을 받습니다. Sprite와 Shape는 자신의 텍스처와 좌표 모드를 사용합니다.

스텐실 마스크를 사용하려면 대상에 stencilBits가 있어야 합니다. `clear(color, stencil)`은 색상과 스텐실을 함께 지우고, `clearStencil()`은 스텐실만 지웁니다. BlendMode는 Alpha, Add, Multiply, Min, Max, None 프리셋을 제공합니다.

## 정점과 GPU 버퍼

```typescript
import { VertexArray, Vertex, PrimitiveType, Vector2f, Color } from 'sfml.js';

const triangle = new VertexArray(PrimitiveType.Triangles, 3);
triangle.setVertex(0, new Vertex(new Vector2f(10, 10), Color.Red));
triangle.setVertex(1, new Vertex(new Vector2f(100, 10), Color.Green));
triangle.setVertex(2, new Vertex(new Vector2f(10, 100), Color.Blue));
triangle.getVertex(1).position.x = 120;
```

VertexArray는 get/setVertex, append, resize, clear, getBounds와 반복을 지원합니다. draw는 연속된 정점의 스냅샷을 즉시 저장하므로, 이후 수정하거나 용량을 늘려도 이미 기록된 화면은 바뀌지 않습니다. 구조를 수정한 뒤에는 멤버를 다시 가져오고, 순회 중에는 구조를 수정하지 마세요.

SFML 3은 Points, Lines, LineStrip, Triangles, TriangleStrip, TriangleFan을 지원합니다. 여러 사각형을 삼각형으로 구성하여 하나의 VertexArray에 넣으면 실제 SFML draw 호출 수를 줄일 수 있습니다.

VertexBuffer는 정점을 GPU에 저장합니다. 먼저 `create(count)`, 이어서 `update(vertices)`를 호출하고 둘의 불리언 반환값을 확인하세요. Usage에는 Stream, Dynamic, Static이 있습니다. 범위 그리기에는 `target.draw(buffer, firstVertex, vertexCount, states?)`를 사용합니다.

`assign()`은 GPU 데이터, 프리미티브, usage를 깊은 복사합니다. `update(sourceBuffer)`는 데이터를 복사하되 대상의 프리미티브와 usage를 유지합니다. `swap()`은 리소스를 교환합니다. 저장소를 수정하기 전에 이전 그리기를 제출합니다. GL 이름은 바뀔 수 있으므로 사용 전에 다시 가져오세요.

## Shader, Transform, GLSL

Shader는 비동기 `loadFromFile/Memory/Stream()`을 사용하며, 단일 단계 또는 vertex/fragment/geometry 조합을 지원합니다. 다시 로드하는 데 성공하면 프로그램을 교체하고 uniform 상태를 비우며, 실패하면 이전 프로그램을 유지합니다.

`setUniform()`은 number, boolean, Glsl 벡터/행렬, Texture, `Shader.CurrentTexture`를 받습니다. number의 기본값은 float이며, 정수에는 세 번째 인수로 `'int'`를 사용합니다. uniform 수정 전에 기존 그리기를 제출합니다.

`Glsl.Vec2/3/4`, `Ivec2/3/4`, `Bvec2/3/4`는 GLSL 벡터에 대응합니다. Mat3/Mat4는 배열, 같은 크기의 행렬, Transform에서 생성하며, `.array`는 열 우선 Float32Array입니다. 4차원 벡터와 행렬에는 범용 벡터 산술 연산자를 제공하지 않습니다.

Transform은 이동, 회전, 크기 조절, combine을 지원하며, 제자리에서 수정하고 자신을 반환합니다. 합성은 오른쪽 곱셈이므로 `translate(...).scale(...)`는 점에 먼저 크기 조절을 적용한 뒤 이동을 적용합니다. getMatrix는 읽기 전용 실시간 배열을 반환합니다. 특이 행렬의 역행렬을 구하면 독립적인 항등 변환을 반환합니다.

`Shader.isAvailable()`, `isGeometryAvailable()`, `VertexBuffer.isAvailable()`로 기능을 확인할 수 있습니다. Texture/Shader/VertexBuffer의 bind를 직접 사용하기 전에 기존 SFML 명령을 명시적으로 제출하세요.

## 예제와 성능 검증

[예제 목록](../examples/README.ko.md)은 텍스처, 스프라이트, 텍스트, 정점, 복합 객체 그리기, 오프스크린 합성을 위한 독립 진입점을 제공합니다.

빌드 후 `tools/benchmark-image.cjs`, `tools/benchmark-drawable.cjs`, `tools/benchmark-vertex-array.cjs`를 실행하여 현재 구현을 측정할 수 있습니다. 벤치마크의 호출 스레드 시간에는 기록, 제출, 드라이버 작업이 포함되므로, 이를 GPU 시간이나 실제 게임 프레임 레이트로 곧바로 해석해서는 안 됩니다.

<a id="sfml-cpp-reference"></a>
## SFML C++ 레퍼런스

- 이미지와 그리기 객체: [Image](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Image.html), [Texture](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Texture.html), [Sprite](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Sprite.html), [Shape](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Shape.html), [Drawable](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Drawable.html).
- 텍스트와 카메라: [Font](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Font.html), [Text](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Text.html), [View](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1View.html).
- 렌더링과 지오메트리: [RenderTexture](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1RenderTexture.html), [RenderTarget](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1RenderTarget.html), [Shader](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Shader.html), [VertexArray](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1VertexArray.html), [VertexBuffer](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1VertexBuffer.html).

렌더링 개념은 업스트림 C++ 문서를 참고하세요. 리소스 생성과 로딩, 그리기 스냅샷의 동작은 이 JS 가이드의 규칙을 따릅니다.
