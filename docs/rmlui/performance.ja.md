# 共有領域、バッチ処理、プリロード

Native がモデルの領域、リソース、評価、レイアウト、描画を所有します。
数値ビューとコマンド配列をフレーム間で保持し、JavaScript で書いてから一度通知・送信します。
[データモデル](data-models.ja.md)と[測定報告](audit/6.3/architecture-performance-results.md)を参照してください。

## 数値要素コマンド

`new rmlui.ElementCommandBuffer(context, elements)` で要素スロットを一度登録します。
保持済み配列の `opcodes` に `ElementCommandOpcode.SetNumeric`、
`properties` に `PropertyId.Width`、`units` に `Unit.PX` を設定します。
`elements[i]` がスロット、`numbers[i]` が数値です。最後に `submit(count)` を呼び、
要素ごとの `"2px"` の生成・解析を省きます。

Native は前方部分全体を検証・コピーしてから順に処理します。照会には先行書き込みが反映されます。
検証失敗は何も消費せず、実行失敗の完了分は `consumed` に残ります。
拡張・回収・shutdown 後も旧ビューのバイトは安全に保持できます。

## 明示的なデータビューバッチ

多数の接続済み要素に同じ JS 数値計算を行う場合、
`new rmlui.DataBatchView(model, elements, expressions, update, options)` を使います。
式ごとに固定スロットを登録し、コールバックは `slots` と `inputs` の変更区間を読み、
`commands` に書いてコマンド数を返します。[英語ガイド](performance.md)にコードがあります。

既存スケジューラーの順序を保持します。他グループや旧ビューで区間が分かれるため、
全ての文書で 1 回の通知になる保証はありません。依存関係に合わせて `sortOffset` を選びます。
例の `999` は同じ深さの既定属性ビューの後に配置します。例外では返却コマンドを適用しません。
JS getter・transform・旧 API の個別コールバックと副作用は維持します。

## ウィンドウを表示する前の準備

先に初期化し、ウィンドウを非表示にして全リソースを待ちます。

```js
window.setVisible(false);
await rmlui.preloadResources({
  textures: [ 'images/menu.png' ],
  fonts: [{ source: 'fonts/menu.ttf', family: 'Menu' }],
});
document.show();
context.update();
window.clear(sfml.Color.Black);
window.flush();
context.render();
window.display();
window.setVisible(true);
```

テクスチャパスは文書・スタイルシートの解決済みパスと一致させます。
Native ワーカーがファイル読み込み、画像デコード、アルファの事前乗算を行います。
GPU アップロードとフォント登録は所有スレッドで行います。アトラスはレイアウト・描画中に生成するため、
表示前のフレームで準備します。同一記述の並行要求は準備とコミットを共有します。
`signal` で要求を中止でき、`renderInterface` でテクスチャキャッシュの所有者を選べます。

失敗時は Promise を拒否し、既に成功したコミットを保持します。対応するリソース解放や shutdown は
未完了コミットを無効にします。フォントバイトは shutdown まで Native が保持し、
有効なテクスチャハンドルはキャッシュの削除後もリソースを保持します。

## 描画境界と測定範囲

Context は連続する互換ジオメトリを Native でまとめます。テクスチャ、変換、クリップ、
shader、レイヤー、キャプチャ、コールバックの変更前に送信します。直接 geometry を描く API は即時処理です。
静的キャッシュは再アップロードせず、同形状の変更はチャンク内の変更範囲をアップロードします。
状態が変わると複数 draw が必要になる場合があります。

測定は macOS arm64 の完全 CPU フレームです。GPU 時間、エンジン全体の無割り当て、
RmlUi 6.3 全 API の完了を証明するものではありません。
