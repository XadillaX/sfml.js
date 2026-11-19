# SVG と Lottie

上流の SVG／Lottie プラグインは Native addon に組み込まれます。
RmlUi が解析、ジオメトリ、テクスチャ、再生を管理します。
通常の `context.update()` と `context.render()` で実行できます。

```xml
<svg id="icon" width="40" height="20" viewBox="0 0 40 20">
  <rect width="40" height="20" fill="#00ff00"/>
</svg>
<svg src="assets/icon.svg" crop-to-content=""/>
<lottie src="assets/animation.json"/>
```

RCSS の `width`／`height` が描画領域、`image-color` が色調、
`opacity` が透明度を設定します。ファイルは現在の Native ファイル
インターフェースで文書 URL からの相対パスとして読み込みます。
SVG は `svg("assets/icon.svg" crop-to-content)` デコレーターにも対応し、
`crop-to-content` は内容の境界まで切り抜きます。

```js
const { ElementSVG, ElementLottie } = require('sfml.js-rmlui');

const icon = document.getElementById('icon');

if (icon instanceof ElementSVG) {
  icon.innerRML = '<rect width="40" height="20" fill="#ff0000"/>';
  icon.ensureSourceLoaded();
}

const animation = new ElementLottie('lottie');

animation.setAttribute('src', 'assets/animation.json');
document.appendChild(animation);
```

Element の所有権検証、直接構築、Native RTTI、
`getIntrinsicDimensions()` を利用できます。`ensureSourceLoaded()` は
上流の公開メソッドを呼び出し、通常はレイアウトや更新が自動実行します。
SVG の `innerRML` はインライン XML を読み書きします。`src` がある場合、
上流は空文字列を返し、インラインの書き換えを無視します。

Lottie は Native システム時計でループ再生します。`renderSync` は縦横比を
維持し、RCSS 領域の比率が異なる場合は中央に配置します。上流 ElementLottie
には要素ごとの一時停止、速度変更、シーク API がありません。
共有システム時計の設定は、他の時間依存の動作にも影響します。

[依存関係一覧](../../packages/sfml.js-rmlui/tools/dependencies/optional-dependencies.json)は
LunaSVG 3.5.0、同梱 PlutoVG 1.3.1、rlottie 0.2 のコミットと SHA-256 を固定します。
PNG デコーダーは addon に静的リンクされ、別の画像ローダーは不要です。
この版の NEON は ARM32 アセンブリが必要なため、ARM64 は上流の移植可能な
ラスタライザーを使用します。

[ローカル検証](audit/6.3/vector-native-contracts.md)は macOS arm64 の色、
透明度、ソース更新、サイズ、切り抜き、デコレーター、フレーム、埋め込み画像、
再初期化を対象にします。他の OS、代替フォント、全体の受け入れは未完了です。
