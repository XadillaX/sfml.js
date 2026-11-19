# フォント

初期化前にネイティブ FreeType、HarfBuzz、ビットマップエンジンを選択します。
未選択の場合、初期化で既定の FreeType エンジンを作成します。

```js
const rmlui = require('sfml.js-rmlui');
const engine = new rmlui.FontEngineInterface();

rmlui.setFontEngineInterface(engine);
rmlui.initialise(window);
engine.loadFontFace('regular.ttf', 'application-font', rmlui.FontStyle.Normal);
const face = engine.getFontFaceHandle(
  'application-font', rmlui.FontStyle.Normal, rmlui.FontWeight.Normal, 20,
);

if (face) {
  const shaping = new rmlui.TextShapingContext('en');

  shaping.letterSpacing = 1;
  const widths = engine.getStringWidths(face, [ 'one', 'two' ], shaping);
  const metrics = engine.getFontMetrics(face);

  console.log(widths, metrics.ascent, metrics.lineSpacing);
}
```

`getFontEngineInterface()` は選択済みの同一ラッパーを返し、選択前と終了後は
`null` です。初期化前の `setFontEngineInterface(null)` は自動選択に戻します。
使用中の選択済みエンジンだけがフォントを操作できます。追加のエンジン構築では
グローバル provider を初期化せず、Core が Initialize と Shutdown を呼びます。
既定のレイアウト、グリフ生成、アトラス管理は C++ で処理します。

書体と効果のハンドルは不透明な Native トークンです。フォント、管理器の解放や
終了で無効になります。`prepareFontEffects(face, effects)` は書体と世代に
結び付くトークンを返します。
`generateString(manager, face, effects, text, position, colour, opacity, shaping)`
は整数の幅と順序付き `TexturedMeshList` を返します。メッシュは共有頂点と
インデックスのコピーを所有し、アトラステクスチャは管理器に属します。
フォント解放でテクスチャは無効になります。色は乗算済み RGBA バイト、
opacity は効果用の不透明度で、既定は一です。直接の生成では Native が未読込の
グリフを取得してからアトラスを構築します。新しいグリフによる再構築で古い
テクスチャビューは無効になりますが、所有するメッシュのバイトは有効です。

`FontMetrics.values` はアセント、ディセント、行間、x-height、下線位置と幅の
独立した Native コピーを共有します。`TextShapingContext.enums` は
Direction/FontKerning、`values` は字間を共有します。引数はネイティブで検証し、
使用前にコピーします。`getStringWidths` は一回の Native 呼出で配列を計測し、
Native 所有の共有 int32 幅を返します。数値領域は回収と終了後も有効で、
メトリクスを編集してもエンジンのキャッシュは変更されません。

`FontMetrics.size` と `hasEllipsis` はコピー済みの整数と真偽値を読みます。
六つの浮動小数点 getter は Native 呼出なしで `values` を参照します。
アセントは基線より上を正とし、ディセントと下線位置は下を正とします。
下線位置には負の値も使用できます。

シェーピングの既定値は空の言語、`Style.Direction.Auto`、
`Style.FontKerning.Auto`、字間ゼロです。数値は共有ビューを使用し、
言語の読取りと置換は Native を呼び出します。コールバック中の言語置換は
処理中のバッチの凍結済み引数を変更しません。初期化前に作成し終了後も
再利用できますが、実行環境の所有者制約は適用されます。
既定の FreeType は `Style.FontKerning.None` 以外でカーニングを適用し、
字間をグリフごとに整数へ切り捨てます。言語と方向はプロバイダーへ渡しますが、
FreeType は複雑な文字のシェーピングを行いません。必要な機能を持つ
プロバイダーを使用してください。

反復計測には固定の `FontMeasureBuffer` を一度だけ確保します。

```js
const buffer = new rmlui.FontMeasureBuffer(2, 64);

buffer.append('one');
buffer.append('two');
const widths = engine.measureStrings(face, buffer, shaping);

buffer.clear();
buffer.append('next');
engine.measureStrings(face, buffer, shaping); // 同じ widths を再利用。
```

`bytes` は共有 UTF-8、`offsets` は行境界、`widths` は固定共有出力です。
直接書く場合、`measureStrings` の第 5 引数に対象行数を指定します。
境界はゼロから始まり、減少せず、バイト容量内に収まる必要があります。
Native は全 UTF-8 区間を検証してから出力を書きます。対象外の幅は以前の
値を保持します。スレッドへの転送は拒否されるか独立したコピーになります。
直接の `ArrayBuffer.transfer()` は計測バッファを無効にします。以後の計測は
切り離されたビューを拒否し、転送後の領域は保持されます。計測は入出力
領域を再利用しますが、未読込のグリフでは確保が発生し得ます。
`append` は入力準備時に UTF-8 エンコードを行います。

RmlUi を初期化し、文書より先にフォントを読み込みます。`loadFontFace` は
`Rml::LoadFontFace` の 3 つのオーバーロードに対応します。

```js
const fs = require('node:fs');
const { loadFontFace, FontStyle, FontWeight } = require('sfml.js-rmlui');

loadFontFace('regular.ttf');
loadFontFace('collection.ttc', false, FontWeight.Normal, 1);
loadFontFace('regular.ttf', 'application-font', FontStyle.Normal);
loadFontFace(
  fs.readFileSync('italic.ttf'),
  'application-font', FontStyle.Italic, 530, true, 0,
);
```

最初の形式はフォント内部のファミリーと書体を使います。名前付きのファイル・
メモリ形式では指定したファミリーと書体を RCSS 用に登録します。名前が空なら
ファミリーと書体はメタデータに従います。パスは現在のファイルインターフェース、
および設定済みの `initialise(window, { fileRoot })` を通して解決します。

`FontWeight.Auto`（0）はウェイトを検出し、可変フォントでは利用可能な全ウェイトを
読み込みます。1〜1000 の整数は可変フォントのウェイトを選択するか、通常フォントの
登録ウェイトを変更します。`Normal` は 400、`Bold` は 700 です。既定値は
コレクションインデックスが 0、ウェイトが Auto、代替指定が false です。
代替フォントは他の書体にない文字を補います。重複登録では既存の代替指定は変わりません。

戻り値は RmlUi の成否です。ファイル・データ・フェイスが無効なら false、
引数の型や範囲が不正なら例外になります。同期処理のため、初期化元の環境で、
イベントコールバック外から呼び出してください。

メモリ入力は Buffer、Uint8Array、サブビューに対応します。ネイティブ側でビューの
範囲だけをコピーするため、復帰後は入力を変更・転送・回収できます。共有・切り離し
済みのバッファは拒否します。コピーは `shutdown` 後まで保持します。コレクションの
一部が登録されている場合があるため、失敗した読み込みでも保持します。

既定エンジンの `releaseFontResources()` は字形・テクスチャキャッシュを解放し、フォントハンドルを
無効にして全コンテキストを更新します。登録済みフェイスと元データは保持され、
以後のレイアウトと描画で再構築できます。初期化済みランタイムで、イベント外から
呼び出してください。

## 組み込みエンジンと機能確認

```js
const engine = new rmlui.FontEngineInterface('harfbuzz');

engine.registerLanguage('ar', 'Arab', 'rtl');
rmlui.setFontEngineInterface(engine);
rmlui.initialise(window);
engine.loadFontFace('Cairo-Regular.ttf', 'arabic', rmlui.FontStyle.Normal);
console.log(engine.kind, rmlui.getCapabilities());
```

コンストラクターは `freetype`、`harfbuzz`、`bitmap` または同期カスタム
コールバックを受け取ります。`kind` はこの種類を返し、カスタムは `custom` です。
終了後の古いエンジンは拒否します。切り替えるには終了後、新しいエンジンを作成し、
次の初期化前に選択します。

HarfBuzz 15.1.0 は C++ でクラスタ、接続字形、合字を処理し、既定エンジンと
同じコンパイル済み FreeType を使用します。言語、方向、カーニング、整数の字間に
従いますが、計測の直前文字は上流実装で無視します。`registerLanguage` は BCP47
タグを 4 文字 ISO15924 コードと `ltr`／`rtl` に登録し、Auto 方向で使用します。
初期化前に呼び出してください。ファイル、名前付きファイル、メモリを読み込めます。
名前付きファイルのアダプターは終了まで元バイトを保持します。

ビットマップエンジンは上流の単一ページ XML `.fnt` と相対パスのアトラスを読み、
アトラスのアドバンスとカーニングを使用します。計測は直前文字を含みます。
サイズはアトラス固定で、ファミリー、書体、サイズの要求は上流の緩やかな最適一致を
使います。シェーピング、字間、カーニング切り替え、フォント効果と効果の不透明度は
無視します。一般のメモリ読込は false です。Debugger の特殊ファミリーは成功を返す
ものの、埋め込みフォントを読まず、既存のビットマップ書体を使用します。

`getCapabilities()` は初期化前、動作中、終了後に独立したスナップショットを返します。
`compiled` はバイナリへのリンク、`available` は現在のランタイムでの利用可能状態です。
モジュールには初期化、フォントには選択も必要です。初期化前の選択は
`selectedFontEngine` に表示しますが、まだ利用できません。モジュールの利用可能状態は
Lua ホストや表示中の Debugger の存在を意味しません。機能フラグは実装の仕様であり、
利用時は `compiled` と `available` も確認します。カスタムの機能は実装次第です。

両エンジンは既定でコンパイルします。既存のパッケージディレクトリで無効化できます。

```sh
GYP_DEFINES="rmlui_harfbuzz=0 rmlui_bitmap_font=0" npm run build
```

各フラグは独立した 0 または 1 です。未コンパイルのエンジンの構築は例外となり、
自動代替しません。依存インストーラーは固定アーカイブを引き続き検証します。
同じビルドディレクトリを再利用します。別 OS と全プロジェクトの検証は別に記録します。

## カスタム書体エンジン

コンストラクターに同期の `FontEngineCallbacks` を渡すと上流の仮想関数を
実装できます。Core が初期化と終了を呼び、三つの読込フックにはメタデータ、
明示名、独立したメモリバイト列を渡します。初期化や書体選択で
`engine.createFontFace(metrics, advances?)` を呼んで登録します。トークンは
所有するエンジンと世代に結び付きます。任意のメトリクスと世代フックを省略すると、
登録値と共有 `face.version` を利用します。

`FontAdvanceTable` は独立したコードポイント幅を Native に保存します。
`face.advances` を編集後、`face.version[0]` を増加するとジオメトリが失効します。
字間を加算しますが、カーニングとシェーピングは行いません。文脈を使う計測には
一括フックを実装します。

```js
let customFace;
const custom = new rmlui.FontEngineInterface({
  initialize() {
    customFace = custom.createFontFace({
      size: 20, ascent: 15, descent: 5, lineSpacing: 20, xHeight: 10,
      underlinePosition: 2, underlineThickness: 1, hasEllipsis: true,
    });
  },
  getFontFaceHandle() {
    return customFace.handle;
  },
  measureStrings(face, packed, count, shaping, priorCharacter) {
    for (let i = 0; i < count; ++i) {
      packed.widths[i] =
        (packed.offsets[i + 1] - packed.offsets[i]) * 7;
    }
  },
});

rmlui.setFontEngineInterface(custom);
rmlui.initialise(window);
```

この例は ASCII バイトの幅のみ計算します。描画には `generateString` を実装し、
整数幅と Texture ビュー付きの所有メッシュを返します。`prepareFontEffects`
で保持する不透明データは生成フックに渡します。Native がメッシュを受け取り、
書体・効果・テクスチャの世代を検証します。

一括フックは Native UTF-8 コピー、uint32 境界、int32 結果を受け取り、
空でないバッチにつき一回呼ばれます。各行の JS 文字列を生成しません。
上流の単一文字列要求にも count 一で対応します。有効な幅を全て書き、
`undefined` を返します。成功と入出力の接続を確認してから結果を書き戻します。
例外、Promise、Core の再入、ビューの切り離しでは元の幅を部分変更しません。
Native の幅表のオーバーフローも全出力を保持します。

容量は幾何級数的に増加し、定常呼出で同じオブジェクトと配列を再利用します。
有効な入力バイトと境界、出力幅のみコピーします。後続呼出は保存したビューを
上書きします。拡張と切り離しではバッファを交換し、古い配列は GC・終了後も
純粋な Native 領域を保持します。Worker 転送は拒否またはコピーです。
互換の `getStringWidths` と `getStringWidth` は文字列変換が必要で、
単一文字列フックは行ごとに呼ばれます。

カスタム解放では書体・効果を無効にし、作業領域を破棄してから
`releaseFontResources` フックを呼びます。その後、または次の書体選択で
再登録します。保存した数値配列は安全です。カスタムの機能はコールバック次第です。
HarfBuzz と上流のビットマップエンジンは組み込みの名前で選択してください。

パッケージ内で `node tools/performance/measure-custom-font-performance.cjs` を実行すると、
1,000・10,000・100,000 行で同じ出力の Native・一括 JS・互換計測を比較します。
準備、レイアウト、描画、表示、GPU は計時外です。JSON は p50/p95 と
双方向呼出、確保、明示的コピーの件数を記録します。
