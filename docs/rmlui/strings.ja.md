# RmlUi の文字列とリソース URL

`StringView` は不変のネイティブ UTF-8 バイトを保持し、位置はバイト単位です。
`StringIteratorU8` は JavaScript UTF-16 索引とは別にネイティブコードポイントを
読みます。これらと `URL` はランタイム初期化前も終了後も使用できます。

```js
const { StringView, StringIteratorU8, StringUtilities, URL, formatString } =
  require('sfml.js-rmlui');

const text = new StringView('Aé中😀Z');
const slice = text.subview(1, 9);

console.log(slice.begin(), slice.end(), slice.toString()); // 0 9 é中😀

const input = new Int32Array([ 0, 1, 2, 3, 4, 5 ]);
const output = new Int32Array(input.length);

StringUtilities.convertCharacterOffsetsToByteOffsets(text, input, output);
console.log(Array.from(output)); // [0, 1, 3, 6, 10, 11]

const iterator = new StringIteratorU8(slice);

while (iterator.valid()) {
  console.log(iterator.offset(), iterator.value());
  iterator.increment();
}

const url = new URL('assets/panel.rml');

url.setParameter('name', 'é中😀');
console.log(url.getQueryString()); // name=%C3%A9%E4%B8%AD%F0%9F%98%80
console.log(formatString('%s:%d', 'é', 7)); // { value: 'é:7', length: 4 }
```

## バイト、反復と一括処理

`new StringView(value = '', offset = 0, count?)` は文字列をネイティブ領域に
コピーするか、既存ビューの所有者を保持します。位置は元データの末尾までです。
count の省略時は残り全部で、指定時も末尾で切り詰めます。UTF-8 の途中の
切り出しも可能です。`toBytes()` は独立した書き込み可能なコピーを返し、
変更は元データや索引に影響しません。`equals()` は NUL 後も比較します。

`new StringIteratorU8(value, offset = 0, count?)` は入力を保持します。
位置は索引境界と一致する必要があります。末尾は `offset + count` と元データ
末尾の小さい方です。各ビューで一度だけ索引コピーを取得し、以後の移動と
読み取りにはネイティブ呼び出しがありません。末尾はバイト長、開始前は `-1`。
番兵の参照、末尾からの前進、開始前からの後退は例外です。別名ビューの
一致はネイティブ所有者と絶対バイト位置で判定します。

一括変換では `StringView` と同じ長さの固定・非共有 `Int32Array` 入出力を
再利用します。一括で一回だけ呼び出し、出力省略時は独立コピーを作ります。
重複ビューでも元の入力値を保持します。負の位置は 0、過大な位置は末尾、
文字内部は次の境界へ丸めます。分離・共有・可変長の配列は拒否します。

## ネイティブ文字列規則

大小文字変換は ASCII のみです。空白は CR、LF、空白、タブです。RML 実体は
一回だけ復号します。空の検索文字列での置換は入力を保持します。
`expandString(value, delimiter = ',', quoteOrIgnore = false, unquote?,
ignoreRepeatedDelimiters = false)` は既定引用符を除去し、独自引用符は保持します。
`joinString(values, delimiter = ',', initial = '')` は初期内容に追記し、
NUL では区切りを挿入しません。

`toUTF8` は符号なし 32 ビットコードポイントか固定・非共有の `Uint32Array` を
受け取ります。`lengthUTF8` は不完全なスライスでも非継続バイトを数えます。
`trimTrailingDotZeros` は小数点のある十進テキストが必要で、不正入力は例外です。

## リソース URL と整形

`new URL(value = '')` は実際の RmlUi リソース URL 解析器を所有します。
設定関数はネイティブ真偽値を返します。`setURL` は旧要素とパラメータを消去し、
不正入力では false と一部解析状態を残す場合があります。`setPort` は符号付き
32 ビット整数です。パラメータコピーは独立し、`__proto__` などの自身のキーも
保持します。順序はネイティブ非順序マップに従い、`clearParameters` はクエリ
キャッシュも無効にします。

`urlEncode` は NUL を含む全 UTF-8 バイトを符号化します。固定バージョンの
復号規則では `+` は空白、`%GG` は `GG`、`%A` はバイト `0A` です。
JavaScript 文字列では無効な UTF-8 を置換文字に変えます。

`createString` は整形テキスト、`formatString` はテキストと UTF-8 バイト長を
返します。型付き printf は `diuoxXfFeEgGaAcs`、`%%`、フラグ、幅、精度、
動的 `*` を扱います。整数は変換に応じた 32 ビット範囲、`%c` は 0–255、
浮動小数は有限値です。ポインター・位置指定・長さ修飾・書式内 NUL は拒否します。
幅・精度・全出力はそれぞれ百万バイトまでです。256 バイト未満の出力は NUL で
テキストを切り詰めても報告長は保持し、それ以上では NUL を保持します。
