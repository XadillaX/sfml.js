# Graphics

[English](graphics.md) / [简体中文](graphics.zh-CN.md) / **日本語** / [한국어](graphics.ko.md)

> Image／Texture で素材を用意し、Sprite、Shape、Text、頂点でシーンを構成して、RenderWindow または RenderTexture に描画を渡します。

[API ナビゲーション](api.ja.md) · [ウィンドウとイベント](window.ja.md) · [描画スナップショット](concepts.ja.md#draw-snapshots)

## Image：CPU 側のピクセル

Image は RGBA8 のピクセルを保持します。`.pixels` はネイティブのメモリ割り当てに直接マッピングされた Uint8Array です。

```typescript
import { Image, Color, Vector2u } from 'sfml.js';

const image = new Image(new Vector2u(64, 64), Color.White);
image.setPixel(new Vector2u(0, 0), Color.Red);
image.pixels[3] = 128;
if (!await image.saveToFile('image.png')) throw new Error('Cannot save image');
```

| インターフェース | 挙動 |
| --- | --- |
| 空のコンストラクター、サイズと色、サイズと RGBA バイト列、コピーコンストラクター | 独立したピクセルリソースを作成 |
| `loadFromFile/Memory/Stream()` | 非同期で読み込み、boolean を返す |
| `saveToFile()`／`saveToMemory(format)` | 非同期でエンコード。boolean／バイト列または undefined を返す |
| `getSize()`、`getPixel()`、`setPixel()` | サイズと単一ピクセルの操作 |
| `pixels`／`getPixelsPtr()` | 書き込み可能なビュー／型上の読み取り専用ビュー。後者は空の画像では undefined |
| `resize(size, color?)` | 再割り当てして塗りつぶす。サイズが同じでも以前の内容は保持しない |
| `copy()`、`createMaskFromColor()`、`flipHorizontally()`、`flipVertically()` | 領域のコピー、マスク、反転 |

生の RGBA 入力の長さは幅 × 高さ × 4 でなければならず、構築時にコピーされます。再読み込みや resize が成功した後も、古いビューは古いメモリ割り当てを維持します。読み込みに失敗した場合は現在の画像を保持します。ピクセルの buffer を切り離したりリサイズしたりしないでください。

非同期のメモリ読み込みでは呼び出し時にエンコード済み入力をコピーし、非同期の保存では呼び出し時点のピクセルをコピーします。読み取り、デコード、エンコードはバックグラウンドで実行しますが、スナップショットの作成にはメインスレッドのコストがかかります。入力ストリームの使用規則は [System](system.ja.md#input-streams) を参照してください。

## Texture：GPU テクスチャ

```typescript
import { Texture, Sprite } from 'sfml.js';

const texture = new Texture();
if (!await texture.loadFromFile('sprite.png')) {
  throw new Error('Cannot load sprite.png');
}
texture.setSmooth(true);
const sprite = new Sprite(texture);
```

空のコンストラクターは非同期読み込みに適しています。`new Texture(size)` は GPU ストレージを割り当て、`new Texture(image)` はデコード済みの画像をアップロードし、`new Texture(sourceTexture)` は GPU 上の内容をコピーします。後者 2 つはファイルを読み取りません。

| インターフェース | 挙動 |
| --- | --- |
| `loadFromFile/Memory/Stream(source, sRgb?, area?)` | 非同期でデコードし、呼び出し元スレッドでアップロード。area は IntRect |
| `loadFromImage(image, sRgb?, area?)` | 同期的にアップロードし、boolean を返す |
| `update(pixels)`／`update(pixels, size, dest)` | RGBA 全体／一部をアップロード |
| `update(imageOrTextureOrWindow, dest?)` | 入力元の内容をコピー |
| `resize(size, sRgb?)` | ストレージを再構築。成功後のピクセルは未定義 |
| `copyToImage()` | GPU から同期的に読み戻し、独立した Image を取得 |
| `assign(source)`／`swap(other)` | 独立したコピー／内容の交換。対象オブジェクトの同一性は維持 |
| `setSmooth()`／`setRepeated()` | 平滑化／繰り返しサンプリング |
| `generateMipmap()` | mipmap を生成。内容を更新した後は再生成が必要 |
| `getNativeHandle()`／`Texture.bind()` | OpenGL 名／現在のコンテキストへのバインド |
| `Texture.getMaximumSize()` | 現在のデバイスの最大テクスチャ辺長 |

読み込みに失敗した場合は以前の内容を保持します。複数の読み込みは完了順に反映されるため、順序を確定したい場合は 1 件ずつ await してください。GPU へのアップロードと読み戻しは同期操作であり、大きなテクスチャは呼び出し元スレッドを占有します。

部分 update は拡大縮小やクリッピングを行わず、転送先の領域が範囲外なら例外を投げます。読み込み時の切り出し矩形は、いずれかのサイズがゼロなら画像全体を使います。それ以外の空でない領域は画像の範囲に調整され、不正な負のサイズや範囲外の始点は拒否されます。

テクスチャのサイズが変わっても、Sprite のテクスチャ矩形は自動的に変わりません。画像全体を使う場合は `sprite.setTexture(texture, true)` を呼んでください。テクスチャの内容やサンプリング設定を変更する前に、バインディングは古い状態に依存する描画を送信します。

## Sprite と変換

Sprite は Texture または別の Sprite から構築する必要があります。Sprite をコピーすると外観と変換をコピーし、同じテクスチャを参照します。

| インターフェース | セマンティクス |
| --- | --- |
| `setPosition()`／`move()` | 位置と相対移動。Vector2f |
| `setRotation()`／`rotate()` | 角度と相対回転。Angle |
| `setScale()`／`scale()`、`setOrigin()` | スケールと原点。Vector2f |
| `getTransform()`／`getInverseTransform()` | キャッシュされた読み取り専用行列。照会時に更新 |
| `setTexture(texture, resetRect?)` | テクスチャを切り替える。既定ではテクスチャ矩形を保持 |
| `setTextureRect(rect)` | 矩形をコピー。負のサイズで反転可能 |
| `setColor(color)` | 色と alpha の変調 |
| `getLocalBounds()`／`getGlobalBounds()` | ローカル／自身の変換適用後の軸平行境界 |

変換の getter が返す位置、スケール、原点、角度は独立した値です。変更後は setter で書き戻す必要があります。一方、`getTextureRect()` は読み取り専用のライブビューを返し、後続の setter によってその内容が更新されます。

global bounds には、draw に渡した外側の RenderStates は含まれません。Shape と Text も同じ変換インターフェースを提供します。

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

ConvexShape は点の数を受け取り、その後 `setPoint()` で凸多角形の頂点を設定します。3 種類の形状はいずれも同じクラスからのコピー構築、テクスチャ、塗りつぶし、輪郭、境界の照会に対応しています。

独自の形状は Shape を継承し、`getPointCount()` と `getPoint()` を実装します。点の集合を変更した後は protected の `update()` を呼びます。点の集合は凸形状の要件を満たす必要があります。update がジオメトリを生成し、描画の送信時に JS の点取得メソッドが再度呼ばれることはありません。

輪郭の太さは負の値にもできます。miter limit の既定値は 10、最小値は 1 です。ジオメトリ、輪郭の太さ、miter limit を変更する前に、古いジオメトリを参照するコマンドを送信します。

## Font、Glyph、Text

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

Font の読み込みメソッドは `openFromFile/Memory/Stream()` であり、loadFromFile ではありません。読み込みに失敗した場合は以前のフォントを保持します。メモリ入力はネイティブ側が保持します。ファイルから読み込む場合は、フォントの使用中も元のファイルを利用できる状態にしてください。

Font はグリフ、カーニング、行間、アセンダー、ディセンダー、下線のメトリクスを提供します。`getGlyph()` は Unicode コードポイント、`getGlyphById()` はフォント内部の ID で照会します。`getTexture(size)` はグリフの追加に伴って拡大する読み取り専用のアトラスを返します。

Text はフォント、文字列、文字サイズ、間隔、塗りつぶし、輪郭、スタイル、行揃え、書記素のグループ化、文字方向の設定に対応しています。`getShapedGlyphs()` はグリフ一覧を返し、`setGlyphPreProcessor()` ではグリフごとに外観を調整できます。

`getShapedGlyphs()` と前処理コールバックの cluster は JS の UTF-16 インデックスを使います。たとえば `A😀中` では 0、1、3 です。非推奨の `findCharacterPos()` は Unicode コードポイントのインデックスを使います。前処理コールバック内で、現在の Text のレイアウトプロパティを再び変更したり、ジオメトリを照会したりすることはできません。

`getVertexData()` と `getOutlineVertexData()` は編集可能な頂点を提供します。変更は後続の draw に影響し、再レイアウトすると新しいジオメトリが生成されます。古いビューは元のメモリ割り当てを維持します。各 draw は頂点のスナップショットを保存します。

## View と座標

View は中心、サイズ、回転、viewport、scissor を制御します。

```typescript
import { RenderTexture, View, Vector2u, Vector2f } from 'sfml.js';

const target = new RenderTexture(new Vector2u(800, 600));
const camera = new View(target.getDefaultView());
camera.move(new Vector2f(100, 0));
camera.zoom(0.5);
target.setView(camera);
```

setView は値をコピーします。`getView()` と `getDefaultView()` は安定した読み取り専用参照を返すため、変更したい場合は View にコピーしてください。

`mapPixelToCoords(Vector2i, view?)` はピクセル座標をワールド座標に変換し、`mapCoordsToPixel(Vector2f, view?)` は逆変換します。view を省略した場合は現在のビューを使います。

viewport と scissor は、ターゲット全体に対する正規化された矩形を使います。scissor は `[0, 1]` の範囲内である必要があり、draw、clear、clearStencil のすべてに影響します。

## RenderTexture とオフスクリーン合成

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

`getTexture()` は安定した読み取り専用の GPU テクスチャビューを返します。ピクセルをコピーせず、暗黙に display を呼ぶこともありません。`flush()` は描画を送信するだけなので、新しい内容をサンプリングする前には display が必要です。同じターゲット内で自身のテクスチャを直接サンプリングすることはできません。

`resize(size, settings?)` が成功すると、現在のビューと既定のビューがリセットされ、ピクセルの内容は未定義になります。失敗時は元のターゲットを保持します。既存のテクスチャビューは引き続き有効ですが、関連する Sprite のテクスチャ矩形は必要に応じて再設定してください。

ContextSettings は depthBits、stencilBits、antiAliasingLevel、majorVersion、minorVersion、attributeFlags、sRgbCapable に対応します。実際の機能はドライバーに依存し、SFML Graphics には互換性のある OpenGL コンテキストが必要です。

## Drawable と RenderStates

独自の複合オブジェクトは Drawable を継承し、同期的な protected draw を実装します。呼び出しごとに独立した RenderStates の値コピーを受け取りますが、リソースの参照は共有されます。

```typescript
import { Drawable, RenderTarget, RenderStates, Transformable } from 'sfml.js';

class Group extends Drawable {
  /** 複合オブジェクトのローカル変換。 */
  readonly pose = new Transformable();

  /** 順番に描画する子オブジェクトを保持する。 */
  constructor(readonly children: Drawable[]) { super(); }

  /** ローカル変換を親の状態に合成してから各子オブジェクトを描画する。 */
  protected draw(target: RenderTarget, states: RenderStates): void {
    states.transform.combine(this.pose.getTransform());
    for (const child of this.children) target.draw(child, states);
  }
}
```

| RenderStates のフィールド | 既定値 |
| --- | --- |
| transform | 恒等変換 |
| blendMode | BlendAlpha |
| stencilMode | 既定の StencilMode |
| coordinateType | CoordinateType.Pixels |
| texture／shader | null |

draw は RenderStates、状態オプション、または単独の Transform、Texture、Shader、BlendMode、StencilMode などを受け取ります。Sprite と Shape は自身のテクスチャと座標モードを使います。

ステンシルマスクには、ターゲットが stencilBits を提供している必要があります。`clear(color, stencil)` は色とステンシルを同時にクリアし、`clearStencil()` はステンシルだけをクリアします。BlendMode は Alpha、Add、Multiply、Min、Max、None のプリセットを提供します。

## 頂点と GPU バッファ

```typescript
import { VertexArray, Vertex, PrimitiveType, Vector2f, Color } from 'sfml.js';

const triangle = new VertexArray(PrimitiveType.Triangles, 3);
triangle.setVertex(0, new Vertex(new Vector2f(10, 10), Color.Red));
triangle.setVertex(1, new Vertex(new Vector2f(100, 10), Color.Green));
triangle.setVertex(2, new Vertex(new Vector2f(10, 100), Color.Blue));
triangle.getVertex(1).position.x = 120;
```

VertexArray は get/setVertex、append、resize、clear、getBounds、反復処理に対応しています。draw は連続した頂点データのスナップショットを即座に保存し、その後の変更や容量拡張が記録済みの画像を変えることはありません。構造を変更した後はメンバーを再取得し、反復処理中には構造を変更しないでください。

SFML 3 は Points、Lines、LineStrip、Triangles、TriangleStrip、TriangleFan に対応しています。複数の四角形を三角形として 1 つの VertexArray にまとめることで、実際の SFML draw の呼び出し回数を減らせます。

VertexBuffer は頂点を GPU に保存します。先に `create(count)`、次に `update(vertices)` を呼び、両方の真偽値の戻り値を確認してください。Usage は Stream、Dynamic、Static を提供します。範囲を指定した描画には `target.draw(buffer, firstVertex, vertexCount, states?)` を使います。

`assign()` は GPU データ、プリミティブ、usage をディープコピーします。`update(sourceBuffer)` はデータをコピーし、転送先のプリミティブと usage は保持します。`swap()` はリソースを交換します。ストレージを変更する前に古い描画を送信します。GL 名は変わる場合があるため、使用前に再取得してください。

## Shader、Transform、GLSL

Shader は非同期の `loadFromFile/Memory/Stream()` を使い、単一ステージまたは vertex／fragment／geometry の組み合わせに対応しています。再読み込みが成功するとプログラムを置き換えて uniform の状態をクリアし、失敗時は以前のプログラムを保持します。

`setUniform()` は number、boolean、Glsl のベクトル／行列、Texture、`Shader.CurrentTexture` を受け取ります。number は既定で float として扱い、整数には第 3 引数の `'int'` を使います。uniform を変更する前に記録済みの描画を送信します。

`Glsl.Vec2/3/4`、`Ivec2/3/4`、`Bvec2/3/4` は GLSL のベクトルに対応します。Mat3／Mat4 は配列、同じサイズの行列、Transform から構築し、`.array` は列優先の Float32Array です。4 次元ベクトルと行列には、汎用のベクトル算術演算関数はありません。

Transform は平行移動、回転、拡大縮小、combine に対応し、インプレースで変更して自身を返します。合成は右からの乗算であり、`translate(...).scale(...)` は点に対して先に拡大縮小を、次に平行移動を適用します。getMatrix は読み取り専用のライブ配列を返します。特異行列の逆行列を求めると、独立した恒等変換を返します。

`Shader.isAvailable()`、`isGeometryAvailable()`、`VertexBuffer.isAvailable()` で機能を照会できます。Texture／Shader／VertexBuffer の bind を直接使う前に、記録済みの SFML コマンドを明示的に送信してください。

## サンプルと性能検証

[サンプル一覧](../examples/README.ja.md)には、テクスチャ、スプライト、テキスト、頂点、複合描画、オフスクリーン合成の独立した実行入口があります。

ビルド後に `tools/benchmark-image.cjs`、`tools/benchmark-drawable.cjs`、`tools/benchmark-vertex-array.cjs` を実行すると、現在の実装を計測できます。ベンチマークにおける呼び出し元スレッドの時間には、記録、送信、ドライバーの処理が含まれます。GPU 時間や実際のゲームのフレームレートと直接同一視することはできません。

<a id="sfml-cpp-reference"></a>
## SFML C++ リファレンス

上流の描画概念は、次の SFML 3.1.0 リファレンスを参照してください。

- 画像と描画オブジェクト：[Image](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Image.html)、[Texture](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Texture.html)、[Sprite](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Sprite.html)、[Shape](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Shape.html)。
- テキストとカメラ：[Font](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Font.html)、[Text](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Text.html)、[View](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1View.html)。
- 描画とジオメトリ：[RenderTexture](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1RenderTexture.html)、[RenderTarget](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1RenderTarget.html)、[Drawable](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Drawable.html)、[Shader](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Shader.html)、[VertexArray](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1VertexArray.html)、[VertexBuffer](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1VertexBuffer.html)。

C++ リファレンスは描画の仕組みを理解するための資料です。JavaScript のリソース構築と読み込み、draw が記録するスナップショットの挙動は、このガイドと[基本概念](concepts.ja.md#draw-snapshots)に従ってください。
