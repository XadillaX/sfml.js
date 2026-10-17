# 基本概念

[English](concepts.md) / [简体中文](concepts.zh-CN.md) / **日本語** / [한국어](concepts.ko.md)

> sfml.js を使う際は、まず値、リソース、ビューを区別し、次にコマンドの記録、送信、表示を区別してください。これらの境界が、コピー、非同期読み込み、描画の挙動を決定します。

[ドキュメントトップ](README.ja.md) · [API ナビゲーション](api.ja.md)

## 値、リソース、ビュー

ベクトル、角度、色、矩形、頂点、行列などの値型は、最初は JS の TypedArray に格納されます。数学的な計算は JavaScript で行い、ネイティブハンドルが必要になったときにだけ、同じメモリをラップします。`Time` はマイクロ秒単位の `bigint` を使います。

Texture、Image、Sprite、Text、オーディオオブジェクトなどのリソースはネイティブ側で管理します。JS のラッパーオブジェクトと存続中のビューが、関連するメモリ割り当てを維持します。リソースの解放は、所属スレッドと基盤となる依存リソースのライフサイクルに従います。

```typescript
import { FloatRect, Vector2f } from 'sfml.js';

const rect = new FloatRect(new Vector2f(10, 20), new Vector2f(100, 80));
const member = rect.position;
member.x = 30;                     // メンバービューなので rect を変更する。

const copy = new Vector2f(member);
copy.x = 90;                       // 独立したコピーなので rect に影響しない。

rect.position = new Vector2f(5, 6); // 値をコピーする。member は引き続き rect のメンバーを指す。
```

通常の JS の代入は参照の代入です。独立した値が必要な場合はコピーコンストラクターを使います。リソースのコピー規則はクラスによって異なります。たとえば `new Texture(texture)` は GPU 上の内容をコピーしますが、`new Sprite(sprite)` はスプライトのプロパティをコピーし、テクスチャは共有します。

戻り値が独立しているかどうかを `get...()` という名前だけで判断しないでください。

| 読み取り方法 | 所有権と更新の挙動 |
| --- | --- |
| `sprite.getPosition()` | 独立したベクトル。結果を変更した後に `setPosition()` を呼ぶ必要がある |
| `rect.position`、`vertex.color` | 親の値のメンバービュー。書き込みは親の値を直接変更する |
| `image.pixels` | 現在の画像メモリへの書き込み可能な RGBA ビュー |
| `target.getTexture()` | RenderTexture の安定した読み取り専用テクスチャビュー |
| `vertexArray.getVertex(i)` | 現在の頂点ストレージのメンバー。構造が変わった後は再取得する |
| `soundBuffer.getSamples()` | PCM のメモリ割り当てを維持する読み取り専用の型付きビュー。空のバッファでは `undefined` |

Image の再読み込みや resize が成功した後も、古いピクセルビューは古いメモリ割り当てを維持し、新しい画像へ自動的に切り替わることはありません。VertexArray の容量拡張後も、古いメンバーは古いストレージを指します。一方、容量の範囲内で縮小してから再び拡大すると、スロットが再利用される場合があります。

`ReadonlyValue`、`ReadonlyPixels`、`ReadonlySamples` などの制約は主に TypeScript で表現されています。すべての読み取り専用型が実行時に凍結されているとは考えないでください。読み取り専用データを変更する場合は先にコピーし、基盤となる共有 buffer を転送、切り離し、リサイズしないでください。

## リソースの読み込みと Promise

画像とテクスチャには `loadFromFile/Memory/Stream()`、フォントと音楽には `openFromFile/Memory/Stream()` を使います。これらの入口は Promise を返します。

```typescript
import { Texture } from 'sfml.js';

const texture = new Texture();
if (!await texture.loadFromFile('sprite.png')) {
  throw new Error('Cannot decode sprite.png');
}
```

Image／Texture のファイル読み取りとデコードはバックグラウンドで実行されます。ただし、テクスチャの最終的な GPU アップロードは呼び出し元のスレッドで同期的に行われます。`new Texture(image)`、ピクセルのアップロード、GPU からの読み戻しは同期操作です。非同期読み込みが失敗した場合は通常、以前のリソースが保持されます。通常の SFML の失敗は `false` または `undefined` を返します。

同じ画像やテクスチャに対する複数の非同期読み込みは、完了した順に結果を反映します。上書き順序を確定したい場合は、開始順に頼らず、1 件ずつ `await` してください。

入力メモリの所有権はモジュールによって異なります。

| 入力 | 呼び出し側の責任 |
| --- | --- |
| Image／Texture のエンコード済みバイト列 | 呼び出し時にスナップショットを作成するため、その後は元の入力を変更できる |
| `MemoryInputStream` | 元のバイト列への参照を保持する。読み込み中は内容を変更せず、カーソルを専有する |
| Audio の非同期読み書き | Promise が完了するまで関連するバッファを変更しない |
| `Music.openFromMemory()` | 閉じるか再度開くまで入力を変更しない |

ストリームとオーディオオブジェクトの具体的な契約は [System](system.ja.md#input-streams) と [Audio](audio.ja.md) を参照してください。

<a id="draw-snapshots"></a>
## 描画スナップショット

`target.draw()` は呼び出し時点のプロパティと状態を記録します。元のオブジェクトを変更してから再度描画すると、別のスナップショットが作成されます。

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

最終的な画像には 2 つの四角形が含まれます。Sprite のプロパティ、RenderStates、頂点データ、必要なリソース参照は記録時に保存されます。その後、テクスチャのピクセル、ジオメトリ、Shader の uniform を変更する際は、バインディングが古い状態に依存するコマンドを先に送信します。

| 操作 | 意味 |
| --- | --- |
| `clear()`、`draw()`、`setView()` | コマンドを順番に記録する。キューが満杯になると、途中で送信される場合がある |
| `flush()` | 記録済みのコマンドを同期的に送信する |
| `RenderWindow.display()` | コマンドを送信し、ウィンドウのバッファを交換する |
| `RenderTexture.display()` | コマンドを送信し、サンプリング可能なテクスチャを更新する |

`flush()` はオフスクリーンターゲットの `display()` の代わりにはなりません。RenderTexture の新しい内容を使う前に display を呼んでください。自身のテクスチャを直接サンプリングしたり、未送信のターゲット間に循環依存を作ったりすると拒否されます。

バッチ処理は JS／C++ 境界の呼び出しを減らしますが、複数の Sprite を自動的に 1 回の GPU 描画にまとめるわけではありません。同じテクスチャを共有する大量のジオメトリは VertexArray で構成でき、静的なジオメトリには VertexBuffer を利用できます。

## Node.js のイベントループ

ウィンドウ操作はメインスレッドで実行します。フレームごとに `pollEvent()` または `handleEvents()` を使い、`setImmediate()` で次のフレームを予約します。

`waitEvent()` は SFML の同期的な待機セマンティクスを維持しています。`sleep()` は Node のタイマーを使って Promise を返すため、待機中もイベントループは動き続けます。`display()` は同期メソッドであり、フレームレート制限、垂直同期、ドライバーの処理の影響を受ける場合があります。

ネットワーク I/O は Promise を返します。`socket.setBlocking(true)` は Promise が操作可能になるまで待機することを意味し、Node のスレッド全体を同期的にブロックするものではありません。

Audio Worker は容量を制限した共有 PCM スロットを使います。コールバックのビューは、そのコールバックが完了するまでしか有効ではありません。バックグラウンドの Worker だけではプロセスを存続させないため、再生中はウィンドウループを維持するか、明示的に待機してください。

## エラーとクリーンアップ

| 結果 | 対処 |
| --- | --- |
| `false`／`undefined`、SocketStatus、プロトコルのレスポンス | 戻されたステータスを確認する |
| `TypeError`／`RangeError` | 引数の型や範囲を修正する |
| `SFMLError` | バインディングや基盤リソースの実行時エラーに対処する |
| ユーザーコールバックが投げた例外 | 元のエラーオブジェクトがそのまま伝播する |

SFML の診断は既定で stderr に出力され、`setErrorOutput()` で出力先を変更できます。ログは戻り値の確認の代わりにはなりません。

ウィンドウには `close()`、ネットワークオブジェクトにはそれぞれの終了インターフェースを使います。ファイルストリームとオーディオ Worker の非同期クリーンアップには `await` が必要です。ガベージコレクションだけに頼っても、ファイルへの書き込み完了、接続の速やかな終了、録音キューの排出は保証されません。リソースの終了方法は、対応するモジュールのドキュメントを参照してください。
