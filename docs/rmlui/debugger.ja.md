# ネイティブ Debugger

> `Debugger` は初期化済み SFML ランタイム内で上流 RmlUi のツールを実行します。
> ホストはツールを表示し、検査対象には別のコンテキストを指定できます。

```js
const { Debugger } = require('sfml.js-rmlui');

if (!Debugger.initialise(host)) {
  throw new Error('Debugger initialization failed');
}

Debugger.setContext(application);
Debugger.setVisible(true);
host.update();
```

通常のフレームで `host.update()` と `host.render()` を呼び、表示側の
コンテキストへ入力を渡します。`isVisible()` は計算済みスタイルを読むため、
初期化や表示変更後にホストを更新してください。埋め込みフォントを読み込み、
既に初期化されている場合は `initialise()` が false を返します。

メニューには Element Info、Event Log、Data Models、輪郭表示があります。
Data Models はスカラー、配列、構造体と登録済みのカスタム定義をネイティブ反射で
読み、表示中は上流の 0.3 秒間隔で更新します。JS getter と反射コールバックの
例外は `host.update()` から伝播します。組み込み反射は C++ で実行されます。

`setContext(null)` で検査を解除します。対象削除や対象の全文書解除はフックを
外してホストを維持します。ホスト削除やホストの全文書解除は終了します。
内部文書の個別 close/unload は拒否されます。`Debugger.shutdown()` は文書と
リスナーを解放し、アプリのログインターフェースを復元します。
初期化済みランタイムでは繰り返し終了できます。

全メソッドでランタイム所有者を検証します。通常のイベントコールバックからは
`isVisible()` のみ使用でき、変更操作の再入は拒否されます。ランタイム終了後は
再初期化が必要です。借用した Factory の汎用 allocator はそのランタイム中有効で、
プラグイン終了時に登録のみ解除されます。以前の対象で遅延解放を待つフックも
ネイティブ allocator の寿命で保護されます。

ローカル macOS 検証は別々の対象と所有コンテキスト、ログ、スカラーとカスタム
配列／構造体反射、例外、切替、遅延解放、密度 1 と 2 のポインター操作を含みます。
[検証記録](audit/6.3/debugger-native-contracts.md)を参照してください。
各プラットフォーム、サンプルの F8 接続、全体検証は別途必要です。
