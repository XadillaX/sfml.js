# プラグイン

`Plugin` は `Rml::Plugin` の Native 所有アダプターです。作成時にコールバックを
固定し、登録します。

```js
const rmlui = require('sfml.js-rmlui');
const plugin = new rmlui.Plugin({
  getEventClasses() {
    return rmlui.PluginEventClasses.Basic;
  },
  onContextCreate(context) {
    console.log(context.name, context.dimensions.width);
  },
});

rmlui.registerPlugin(plugin);
// ランタイムを終了する前に解除します。
rmlui.unregisterPlugin(plugin);
```

初期化前にも登録できます。購読ビットは `Basic`（1）、`Document`（2）、
`Element`（4）、`DataModel`（8）で、既定の `All` は 15 です。
異なる分類はビット OR で組み合わせます。`getEventClasses` は登録ごとに一度
呼び、解除までマスクを固定します。元のオブジェクトのプロパティを変更しても、
固定した関数は置き換わりません。

| コールバック | ネイティブ通知の時点 |
| --- | --- |
| `onInitialise()` | 起動時は Basic のみ、初期化後の登録では挿入前に必ず通知 |
| `onShutdown()` | 初期化済みの明示的解除は全マスク、全体終了は Basic を登録の逆順で通知 |
| `onContextCreate(context)` | 寸法設定とコンテキスト登録の後 |
| `onContextDestroy(context)` | 文書とモデルの破棄前 |
| `onDocumentOpen(context, documentPath)` | ストリーム読み込み・解析前。パス指定のファイルは既に開いています |
| `onDocumentLoad(document)` | 生成・挿入の後、`load` イベントの前 |
| `onDocumentUnload(document)` | `unload` イベントの後 |
| `onElementCreate(element)` | Factory が属性を設定した後 |
| `onElementDestroy(element)` | 基底 Element の破棄中、メタデータと子要素の破棄前 |
| `onDataModelCreate(context, name)` | ネイティブモデルの挿入後 |
| `onDataModelDestroy(context, name)` | 削除前。`context.getDataModel(name)` で検索可能 |

引数は実体を借用する独立ラッパーです。名前・寸法・モデル検索、要素の id・タグ・
属性、文書のタイトル・URL を読み取れます。戻ると借用ハンドルのネイティブ呼び出し
は無効になります。保持した寸法ビューのメモリは安全で、終了時にゼロになります。
必要な値は通知中にコピーしてください。取得したモデルは実際の寿命に従い、削除や
コンテキスト破棄で無効になります。基底 Element 破棄中は存続する基底フィールドのみです。

通知中に登録を変更できます。自己解除は次の購読者を飛ばさず、以後の通知を停止
します。追加は次の通知から適用しますが、初期化済みなら `onInitialise` は即時です。
初期化後の `onInitialise` 中の自己解除は挿入を取り消し、戻り後に `onShutdown` を
呼びます。重複登録はエラー、未登録の解除は false です。

上流ヘッダーはファイル開始前の通知と説明していますが、RmlUi 6.3 のパス指定は
実際には StreamFile を先に開き、失敗時は通知しません。メモリ・ストリームは
文書解析前に通知します。アダプターは実測した Core の順序を保ちます。

通知は同期的に undefined を返す必要があります。例外は外側のネイティブ呼び出しの
安全な終了まで保持し、破棄と引数の無効化は完了します。Promise は拒否し、拒否結果を
処理します。DOM 変更・レイアウト・描画・入力・ランタイム終了は禁止です。
パーサー・生成器・効果・値コールバックから登録を変更できず、全体終了中の追加も拒否します。

登録中は JS ラッパーの GC 後も Native がアダプターと関数を保持します。
解除時に外側の Native 境界で参照を解放し、未登録の循環参照は GC できます。
終了時に全アダプターを無効化します。通知がない静的フレームではプラグイン関数も
登録表の走査も追加しません。
