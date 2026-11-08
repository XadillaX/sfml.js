# System

[English](system.md) / [简体中文](system.zh-CN.md) / **日本語** / [한국어](system.ko.md)

> System は値型、時間、入力ストリーム、Unicode の境界判定、エラー処理を提供します。通常の数値計算は JS で行い、リソースに関わる操作はインターフェースに応じてネイティブ側で実行します。

[API ナビゲーション](api.ja.md) · [基本概念](concepts.ja.md)

## ベクトルと演算

```typescript
import { Vector2f, Vector2i, add, multiply, addAssign } from 'sfml.js';

const position = new Vector2f(10, 20);
const velocity = new Vector2f(2, 3);
const next = add(position, velocity);
const doubled = multiply(velocity, 2);
addAssign(position, velocity);
const pixels = new Vector2i(position);
```

通常の演算は独立した値を返し、`*Assign` は左オペランドを変更してそれを返します。代入でベクトルのスカラー型が自動変換されることはありません。変換が必要な場合は対応するコンストラクターを使います。

| スカラータグ | JS の成分型 | ストレージ |
| --- | --- | --- |
| `i8`／`u8` | number | Int8Array／Uint8Array |
| `i16`／`u16` | number | Int16Array／Uint16Array |
| `i32`／`u32` | number | Int32Array／Uint32Array |
| `i64`／`u64` | bigint | BigInt64Array／BigUint64Array |
| `f32`／`f64` | number | Float32Array／Float64Array |

`Vector2i/u/f` と `Vector3i/u/f` はそれぞれ i32／u32／f32 に対応します。他のスカラー型には `new Vector2('f64', x, y)` などの形式を使います。

両方のベクトル型は `lengthSquared()`、`dot()`、`cross()`、成分ごとの乗除算を提供し、2 次元ベクトルはさらに `perpendicular()` を提供します。浮動小数点ベクトルは `length()` と `normalized()` を提供し、浮動小数点の 2 次元ベクトルは角度、回転、射影の操作も提供します。整数ベクトルでは、浮動小数点型専用のメソッドは使えません。

ベクトルの `multiply()`／`divide()` はスカラーを使います。成分ごとの操作には `componentWiseMul()`／`componentWiseDiv()` を使います。ゼロ除算、ゼロベクトルの正規化、ゼロ軸への射影は例外を投げます。64 ビット整数の計算では bigint を維持し、f32 の計算は SFML の精度規則に従って丸めます。三角関数の計算では、プラットフォームの数学ライブラリによる限定的な差異を許容します。

## 角度

```typescript
import { Angle, degrees, radians, divide } from 'sfml.js';

const heading = degrees(90);
const turn = radians(Math.PI);
const copy = new Angle(heading);
const ratio = divide(turn, heading);
console.log(copy.asDegrees(), ratio);
```

回転のインターフェースは Angle を受け取ります。`wrapSigned()`、`wrapUnsigned()` はそれぞれの範囲に折り返した角度を返しますが、比較時には自動的に折り返しません。`Angle.Zero` は読み取り専用の定数で、コピーすれば変更できます。Angle は float32 を使い、剰余演算では正の除数が必要です。

## 時間とクロック

```typescript
import { Clock, milliseconds, microseconds, sleep } from 'sfml.js';

const clock = new Clock();
await sleep(milliseconds(16));
const elapsed = clock.restart();
console.log(elapsed.asSeconds(), elapsed.asMicroseconds());
console.log(microseconds(1000n).asMilliseconds());
```

| インターフェース | セマンティクス |
| --- | --- |
| `new Time()`／`new Time(source)`／`new Time(bigint)` | 長さゼロ、コピー、マイクロ秒指定で構築 |
| `seconds(number)` | 秒を Time に変換 |
| `milliseconds(number)` | int32 のミリ秒入力。小数部はゼロ方向に切り捨て |
| `microseconds(bigint)` | マイクロ秒入力 |
| `asMicroseconds()`／`toDuration()` | マイクロ秒の bigint |
| `asSeconds()`／`asMilliseconds()` | float32 の秒／int32 のミリ秒 |
| `Clock.start()`／`stop()` | 計測の再開／一時停止 |
| `Clock.restart()`／`reset()` | それまでの経過時間を返し、ゼロに戻して実行／停止 |

Time は符号付き int64 のマイクロ秒を保持し、整数倍の演算には bigint、浮動小数点の倍率には number を使います。`Time.Zero` は読み取り専用の定数です。範囲外の値や不正な除算は RangeError を投げ、インプレース演算が失敗した場合は元の値を保持します。

Clock は `process.hrtime.bigint()` を使い、独立した Time のスナップショットを返します。独自のタイマーは持たず、クロックの分解能とシステムのスリープ時の挙動は Node.js とプラットフォームによって決まります。

`sleep(time)` は Promise を返し、Node のタイマーで待機するため、イベントループをブロックしません。正の時間はミリ秒単位に切り上げ、ゼロと負の時間は直ちに完了します。実際の再開時刻はスケジューリングの影響を受けます。

### タイムアウトの設定

`TimeoutWithPredicate` は確認間隔と述語を保持するだけで、自身ではタイマーを開始しません。

- `new TimeoutWithPredicate(time)`：固定間隔で、述語は常に false を返します。
- `new TimeoutWithPredicate(predicate, period?)`：既定の間隔は 1 ms で、true は待機を続けることを意味します。
- `getPeriod()` は読み取り専用の Time を、`getPredicate()` は元の関数を返します。

確認のタイミングは、これを受け取るインターフェースが決定します。現在は SFTP が進展のない待機を制御するために使っています。詳細は [Network](network.ja.md#sftp) を参照してください。

`SuspendAwareClock.now()` は、システムのスリープ時間を含むネイティブのナノ秒単位の時刻を返します。Android 分岐のみでサポートされ、デスクトップでの呼び出しは SFMLError を投げます。現在の自動ダウンロードフローには Android のビルド対象はありません。

## 色、矩形、頂点

| 型 | 構築と主な操作 |
| --- | --- |
| Color | RGB／RGBA、`0xRRGGBBAA`、コピー。`r/g/b/a`、`toInteger()` |
| FloatRect／IntRect | `position` + `size`、コピー、明示的変換。`contains()`、`findIntersection()`、`getCenter()` |
| Vertex | `position`、`color`、`texCoords`、またはコピーコンストラクター |

これらの値は主にグラフィックスのインターフェースで使います。Color の成分は uint8 で保存され、直接書き込むとその幅に縮小されます。色の加減算は飽和演算であり、色同士の乗算はチャンネルごとに `floor(a * b / 255)` を計算します。Color の定数は読み取り専用です。

矩形と頂点のメンバーは共有ビューです。矩形には左端と上端を含み、右端と下端は含みません。負のサイズは正規化した範囲として計算し、交差部分の面積が正でなければ `undefined` を返します。Vertex の既定の位置とテクスチャ座標はゼロ、色は白です。

<a id="input-streams"></a>
## 入力ストリーム

InputStream はシーク可能なバイトストリームのプロトコルです。メソッドは同期値または Promise を返せます。

| メソッド | 戻り値 |
| --- | --- |
| `read(data)` | Uint8Array に書き込み、実際のバイト数を bigint で返す。EOF は `0n` |
| `seek(position)` | 実際のバイト位置を bigint で返す |
| `tell()` | 現在のバイト位置の bigint |
| `getSize()` | 総バイト数の bigint |

`undefined` は I/O の失敗を意味し、投げられたエラーはそのまま伝播します。これら 4 つのメソッドを実装したオブジェクトもストリームとして渡せます。Node Readable には、シーク機能を補うアダプターが必要です。

`MemoryInputStream(data)` は入力バイト列への参照を保持します。読み込み中は内容を変更せず、1 回の操作がカーソルを専有するようにしてください。`FileInputStream` は Node のファイルハンドルを使い、非同期の読み書きとシークをオブジェクト単位で直列に実行します。

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

読み込みの完了を待ってからストリームを閉じてください。同じストリームから複数回読み込む場合は、1 回ずつ await します。FileInputStream のファイルオフセットの範囲は 0～2⁵³−1 です。EOF でファイルが自動的に閉じることはなく、再度 seek できます。

## Unicode とバージョン

`Unicode.isGraphemeBoundary(text, position)`、`isWordBoundary()`、`isSentenceBoundary()` は SFML の Unicode 規則を使います。position は JS 文字列の UTF-16 インデックスで、範囲は 0～`text.length` です。サロゲートペアの途中は境界ではありません。

`version()` はキャッシュされた読み取り専用の SFML ランタイムバージョンを返し、`major`、`minor`、`patch`、`isRelease`、`string` を含みます。これは npm パッケージのバージョンではありません。

## エラーとログ

SFMLError はバインディング層または SFML の実行時エラーを表し、`instanceof SFMLError` で判定できます。引数のエラーには TypeError／RangeError を使い、ユーザーコールバックが投げたエラーはそのまま伝播します。SFML が返す通常の失敗ステータスは引き続き false／undefined であり、すべてが例外に変換されるわけではありません。

`err()` は `sf::err()` に書き込むシングルトンの Node Writable を返します。`setErrorOutput(writable)` で SFML のログをリダイレクトし、null を渡すと出力を抑止し、引数を省略すると既定の stderr に戻します。

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

ログのルーティングはプロセス単位の設定であり、Worker も最後に設定された内容を共有します。Node 自身の stderr には影響しません。バックグラウンドのログはバイトチャンク単位で配送され、UTF-8 の文字境界や行境界は保証されません。テキストを解析する場合は StringDecoder を利用できます。

<a id="sfml-cpp-reference"></a>
## SFML C++ リファレンス

上流の [Vector2](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Vector2.html)、[Angle](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Angle.html)、[Time](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Time.html)、[Clock](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Clock.html)、[InputStream](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1InputStream.html) は、数学、時間、ストリームの概念を説明しています。JavaScript の名前付き演算関数、bigint による時間表現、Promise を返す sleep、ストリームのメソッドについては、このバインディングのガイドに従ってください。
