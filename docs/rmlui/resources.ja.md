# 描画リソース

これらの API は RmlUi の初期化後に使用します。リソース変更は所有元スレッドに限定され、
イベントコールバック内では拒否されます。

```ts
import * as rmlui from 'sfml.js-rmlui';

const renderer = rmlui.getRenderInterface();
const context = rmlui.createContext('overlay', 800, 600, renderer);

for (const source of rmlui.getTextureSourceList()) {
  rmlui.releaseTexture(source, context.renderInterface);
}

rmlui.releaseCompiledGeometry(renderer);
```

| 操作 | 効果 |
| --- | --- |
| `getRenderInterface()` | 選択済み・既定の描画器を返し、未選択や shutdown 後は null です。 |
| `createRenderInterface(window)` | 独立した SFML 描画器とキャッシュを作成します。 |
| `setRenderInterface(renderer \| null)` | 初期化前に既定の描画器を選択し、null で自動選択を復元します。 |
| `context.renderInterface` | コンテキスト作成時に指定した描画器を取得します。 |
| `getTextureSourceList()` | 全管理器のファイル URL を、重複とネイティブ順を保持してコピーします。 |
| `releaseTexture(source, renderer?)` | 読み込み済みハンドルを解放した場合のみ true を返します。 |
| `releaseTextures(renderer?)` | 読み込み・生成済みテクスチャを解放し、次回使用時に再読み込みします。 |
| `releaseCompiledGeometry(renderer?)` | ハンドルを解放し、再コンパイル用メッシュを保持します。 |
| `releaseRenderManagers()` | コンテキストが使っていない管理器とフォント資源を解放し、有効なコンテキストを更新します。 |

描画器を省略するか `null` を渡すと、すべての描画器が対象になります。
不透明な `RenderInterface` を渡すと対象を限定できます。
同じウィンドウでも、個別に作成した描画器は別のキャッシュを使います。
パス解決で先頭のスラッシュなどが変わるため、`getTextureSourceList()` の URL を
そのまま指定してください。ハンドル解放後もキャッシュのソース名は残ります。
生成テクスチャには URL がありません。

描画器参照はコンテキストや未使用管理器の削除後も有効ですが、shutdown で無効になります。
再初期化では復活しません。選択済み、または Native 管理器や事前読み込みで使われた
描画器は終了までウィンドウを保持し、未使用の描画器は回収できます。
その間はウィンドウを閉じないでください。追加描画器は既定のシステムインターフェースや
高 DPI 設定を変更しません。

`releaseRenderManagers()` の前に、切り離した要素をすべて再接続または回収してください。
ジオメトリやコールバックテクスチャを保持する場合があるため、残っていれば解放を拒否します。
元の管理器に属するリソースを持つ要素は、異なる描画器へ移動できません。
`clone()` で独立したサブツリーを作成します。同じ描画器のコンテキスト間は同一性を保って移動できます。

フォントの元データとキャッシュは [フォントガイド](fonts.ja.md) を参照してください。

## コンパイル済みフィルターとシェーダー

`context.getRenderManager()` と `element.getRenderManager()` は管理器の一意の
ラッパーを返し、管理器を持たない要素は `null` を返します。同じ描画器を使う
コンテキストは管理器を共有します。`new RenderManager(renderer)` は独立した
ネイティブ管理器を作成し、ランタイム終了まで保持します。ラッパー回収後も
フォントのテクスチャキャッシュは有効です。終了時はフォントと字形テクスチャを
解放してから管理器を破棄します。

```ts
const manager = context.getRenderManager();
const compiled = manager.compileFilter('blur', { sigma: 2 });
const handles = new rmlui.FilterHandleList();

compiled.addHandleTo(handles);
console.log(compiled.isValid, handles.size);
compiled.release();
handles.clear();
```

`Filter.compileFilter(element)` は要素の管理器でネイティブ仮想関数を呼び、
相対長も解決します。`compileFilter` と `compileShader` はそれぞれ所有する
`CompiledFilter` と `CompiledShader` を返します。カスタム `Filter` の返却値は
所有権を一度だけ RmlUi に移し、JS リソースを空にします。
適用先要素の管理器で作成したリソースを返す必要があります。両者には `isValid`、
繰り返し呼べる `release()`、`0n` を返す `invalidHandle()` があります。
既定構築や非対応・失敗したコンパイルは空のリソースになります。
必須引数の欠落や不正な形式は例外です。スカラー・ベクトル・色・色停止値をコピーします。

`addHandleTo` は空を無視し、順序と重複を保持します。ラッパー回収後もリストが
リソースを所有します。明示解放はリソースを空にしますが既存要素は削除しません。
`size` は要素数で、`clear()` はリストの所有権を解放します。ポインターは公開しません。
終了時はすべてのコンパイル済みリソースを管理器より先に解放します。
全体の `releaseRenderManagers()` は未使用の借用管理器とリソースを無効にします。
使用中の共有管理器と独立管理器は保持されます。

描画器は十種類の組み込みフィルター、保存アルファマスク、レイヤー、グラデーション、
creation と明示的なシェーダーソースを実装しています。
パラメーターとネイティブ描画インターフェースの契約は
[描画](./rendering.ja.md)を参照してください。寿命テストは実行した操作を検証します。

未キャッシュのテクスチャ読み込みは二回の seek、長さと実際の読み取り量を確認します。
失敗や例外では開いたハンドルを一回だけ閉じ、転送成功時だけ出力寸法を変更します。
ファイル画像はアルファを一回乗算し、生成 RGBA は既に乗算済みです。
無効寸法、空・短いピクセル範囲、GPU resize 失敗ではネイティブ描画器がゼロを返し、
成功転送を記録しません。アプリのコールバック例外はランタイム境界で伝播します。

## メッシュ、ジオメトリ、テクスチャビュー

`new Mesh(vertexCount, indexCount)` はネイティブベクトルを確保します。
`vertices` は 20 バイト間隔の `Rml::Vertex` を持つ書き込み可能な `Uint8Array` です。
0/4 に float32 x/y、8–11 に乗算済み RGBA、12/16 に float32 u/v を格納します。
`indices` は三角形ごとに 3 番号を持つ `Int32Array` です。回収・終了後も領域を保持します。
`resize()` は共通の先頭部分を新領域に保存します。変更後はビューを再取得してください。

`manager.makeGeometry(mesh)` は有限座標・三角形数・番号範囲を検証し、
ネイティブベクトルをコピーして空でない元メッシュを空にします。既存ビューは
ジオメトリを変更できません。インデックスが空なら元を保持して空ジオメトリを返します。
`mesh.isValid` はネイティブ同様、インデックスが空でないかだけを確認します。

`Geometry.render(translation, texture?, shader?)` は RmlUi の丸めを使い、
同じ管理器のテクスチャとシェーダーを受け取ります。直接 RmlUi を描画する前に
保留中の sfml.js ウィンドウ命令を flush してください。`getMesh()` は独立した
変更可能なコピーで、空・解放済みリソースでは例外です。`release()` はメッシュを返し、
`GeometryReleaseMode.ClearMesh` は破棄します。再解放は空メッシュを返します。
メッシュの等価比較にはネイティブ値を使います。

`manager.loadTexture(source, documentPath?)` はキャッシュ済み `Texture` を返します。
既定のパス解決は source 先頭の `/` を除去します。必要なら相対名と文書パスを使います。
読込は遅延され、`isValid` は項目の存在、`getDimensions()` は読込後の寸法を返します。
失敗時の寸法はゼロです。`equals()` は管理器と項目の同一性を比較します。
`new Texture()` は空ビューです。

リソースはラッパー回収後も独立管理器を保持します。未使用の借用管理器の解放や終了で
無効になります。`releaseTexture` と `releaseCompiledGeometry` は GPU データだけを
解放するため再利用できます。[コールバックテクスチャ](
./render-state.ja.md#callback-textures)は遅延バイト生成、所有ハンドル転送、
レイヤー保存を提供し、ネイティブ所有権を保持します。

## 型付き頂点とスプライトシート

`new Vertex()` は 1 頂点を所有し、`mesh.getVertex(index)` は既存項目をマップします。
`position`、`colour`、`texCoord` は取得時にコピーし、代入時に全成分を書き込みます。
`positionView`、`colourView`、`texCoordView` はネイティブメモリを共有します。
新しい頂点はゼロベクトルと不透明な黒（`red/green/blue = 0`、`alpha = 255`）です。
色には乗算済みバイトを渡します。自動乗算は行いません。
`equals()` は符号付きゼロを等しく、NaN を異なる値として比較します。
サイズ変更、ジオメトリ転送、回収、終了後も既存ビューは元の領域を保持します。

`new TextureSource(source?, documentPath?)` は入力文字列を保持し、管理器ごとに
テクスチャをキャッシュします。`getSource()`、`getDefinitionSource()` は元の文字列を
返し、`getTexture(manager)` は遅延読込の `Texture` ビューを返します。
キャッシュ中は管理器を保持し、未使用管理器の解放でキャッシュをリセットします。
有効な管理器で再利用できますが、終了時には無効になります。
`TexturedMesh` は `{ mesh, texture }` レコード、`TexturedMeshList` は順序付き配列です。
メッシュを `makeGeometry()`、テクスチャを `Geometry.render()` に渡します。

`SpritesheetList` はネイティブコレクションを所有します。
`addSpriteSheet(name, imageSource, definitionSource, definitionLineNumber,
displayScale, definitions)` はピクセル単位の `[name, { p0, p1 }]` ペアをコピーし、
同名スプライトを上書きします。`merge(other)` はシートを追加し同名項目を上書きし、
自己マージではコピーを使います。`reserve(sheets, sprites)` は
`numSpriteSheets()`、`numSprites()` を変えずに容量を確保します。
`getSprite(name)` は null または `{ rectangle, spriteSheet }` のコピーです。

`Spritesheet` は `name`、`definitionLineNumber`、`displayScale`（解像度の逆数）、
独立した `textureSource` を持ちます。コンストラクターの 5 引数は上流と同じく
名前、ソース、文書パス、行番号、倍率です。挿入、マージ、リスト回収で取得済みの
メタデータは変わらず、コピーへの編集はリストに反映しません。`SpriteMap` は名前から
コピーへのマップです。テクスチャソースには上記のランタイム寿命規則が適用されます。

## Decorator の生成と手動要素データ

`new DecoratorInstancer(callback)` は同期
`(name, properties, active) => Decorator | null` ファクトリーを受け取ります。
`registerProperty` と `registerShorthand` でローカル属性を定義し、
`DecoratorInstancer.register(name, instancer)` で登録します。既存宣言が参照するため、
置換後も登録済みインスタンサーは終了まで保持します。未登録の循環参照は GC できます。

`active` は呼び出し中だけ有効な `DecoratorInstancerInterface` です。
`getSprite(name)` は情報をコピーし、`getTexture(filename)` は宣言元のパスで解決し、
`getRenderManager()` は検証付き管理器を返します。入れ子の委譲にも対応します。
終了や例外の後は保存したインターフェースを使えません。返されたリソースの寿命は
独立しています。属性の出典がない場合、テクスチャは空です。

```js
const builtin = rml.DecoratorInstancer.get('horizontal-gradient');
const defaults = new rml.PropertyDictionary();

builtin.getPropertySpecification().setPropertyDefaults(defaults);
rml.DecoratorInstancer.register('delegated',
  new rml.DecoratorInstancer((_name, _properties, active) =>
    builtin.instanceDecorator('horizontal-gradient', defaults, active)));
```

辞書には既定値も含めて登録済み属性が必要です。コールバックはコピーを受け取ります。
文書の読み込み中にも呼ばれるため、DOM 変更、属性登録、終了、同じインスタンサーへの
再帰は禁止です。RmlUi は装飾器を複数要素で共有し、要素データを再生成できます。

`decorator.generateElementData(element, paintArea = BoxArea.Padding)` は所有
`DecoratorData` または null を返します。領域は `Auto` 以外を指定します。
`renderElement(element, data)` は元の装飾器、要素、管理器を検証します。
直接描画の前に SFML の保留コマンドを flush してください。
`releaseElementData(data)` は一度だけ解放し、装飾器が有効なら再実行できます。
要素破棄後も解放でき、放棄したデータは GC が解放します。管理器解放時は先に手動
データを破棄し、装飾器を無効にします。RmlUi の自動要素データとは独立しています。

`new Decorator<Data>(manager, callbacks)` は三つのネイティブ仮想関数を
同期 JavaScript で実装します。`generateElementData(element, paintArea)` は
オブジェクトか null を返し、null は描画を無効にします。
`renderElement(element, data)` と `releaseElementData(data)` は同じデータを
受け取ります。Promise とプリミティブ値は拒否します。要素の参照と幾何リソースの
作成・描画・解放が可能です。DOM 変更、終了、同じ装飾器への再帰呼び出しは拒否します。

カスタム装飾器では `addTexture(texture)`、`getNumTextures()`、
`getTexture(index = 0)` を使えます。同じ描画管理器のテクスチャが必要です。
無効なテクスチャの追加は -1、重複追加は既存の添字を返します。
範囲外の取得は無効なテクスチャを返します。組み込み装飾器では使用できません。

ネイティブ文書とグローバルなスタイルキャッシュは、非アクティブなメディアブロックも
含めてコールバックを保持します。JS 所有のシート、コンテナー、明示的生成インターフェース、
切り離したツリーは GC から見える参照で保持するため、不要な循環は回収できます。
手動データは独立した所有権を持ち、要素を保持するだけでは手動データを保持しません。

明示的解放は最外層の RmlUi 呼び出しが戻る前にコールバックを呼びます。
ネイティブ解放は安全な実行境界まで
コールバックを遅延し、GC デストラクター内で JavaScript を実行しません。
GC による解放は次の RmlUi 呼び出しで処理し、回収済みデータやクロージャーは省略します。
確実な後処理には明示的解放を使います。終了時は管理器を無効にする前に手動データを
解放し、その後コールバックのクロージャーを消去します。

## スタイルシートと明示的な生成インターフェース

`StyleSheetContainer` は解析した RCSS とメディアブロックを所有します。
`loadStyleSheetContainer(source, sourceUrl = '', beginLineNumber = 1)` で
テキストを読み込みます。URL は相対リソースの基準、正の行番号は出典です。
戻り値は上流パーサーの結果で、失敗時にも解析済みのルールが残る場合があります。
読込とマージはコンパイル前に行います。`mergeStyleSheetContainer(other)` は
コンパイル済みの受信側と自己マージを拒否します。
`combineStyleSheetContainer(other)` は新しい未コンパイルの結合結果を返します。

`updateCompiledStyleSheet(context)` は画面、密度、テーマの条件を評価します。
`getCompiledStyleSheet()` は初回コンパイル前は null、後は検証付き読み取り専用
`StyleSheet` ビューを返します。更新結果が true なら以前のすべてのビューが
失効し、false なら維持されます。メディアブロックが残っていても失効します。
ビューは JS ラッパーとは独立してネイティブコンテナーを保持します。

`sheet.combineStyleSheet(other)` は独立した変更可能なシートを作成します。
所有する結合結果のみ `mergeStyleSheet(other)` と `buildNodeIndex()` を使えます。
要素照合の前に索引を構築してください。`getSprite`、`getNamedDecorator`、
`getKeyframes` は独立した情報とプロパティ辞書、または不在時に null を返します。
結合時には後続の同名装飾器とアニメーションが優先されます。

`getElementDefinition(element)` は階層を照合し、不変のネイティブ
`ElementDefinition` を返します。該当なし、またはテキスト要素なら null です。
`getProperty(id)`、`getCustomProperty(name)`、`getPropertyIds()`、
`getProperties()` の結果は独立したコピーです。要素の破棄やシートのマージ後も
定義は有効で、shutdown で無効になります。マージ後は索引を再構築してください。

`element.getStyleSheet()` は文書のコンパイルビューを返します。
`document.getStyleSheetContainer()` は読み取り専用で、load、merge、update は
例外を投げます。`document.setStyleSheetContainer(container)` は所有者を保持し、
メディアクエリーをコンパイルします。null はルールを解除します。
`updateDocument()` でスタイルと配置を適用してください。メディア変更は、
同じコンテナーを共有する文書でも以前のビューを無効化します。文書の破棄や
置換後も、保持したコンテナーと未更新のビューは有効です。
`reloadStyleSheet()` は元の読取可能な文書 URL から style とリンク先 RCSS を
再読込し、DOM とインライン属性を維持します。

`new DecoratorInstancerInterface(manager, sheet, source = null)` は所有者を保持し、
`PropertySource` をコピーします。工場コールバックの外でも
`instancer.instanceDecorator` に渡せます。出典が null ならファイル名による
テクスチャ要求は空になります。シートまたは管理器が無効になると失効します。
コールバック由来のインターフェースは引き続きコールバック終了時に失効します。
shutdown はシートとコンテナーを無効化します。
`sheet.instanceDecorators(manager, declarations, source = null)` は共有装飾器の
独立した配列を返します。宣言文字列が空でなければ文字列、出典パス、描画管理器で
キャッシュし、空なら毎回生成します。マージはキャッシュを消去し、管理器の破棄は
リソース解放前にその管理器のキャッシュを解放します。返された装飾器は元のシートが
回収されても有効ですが、元の管理器に属します。工場の例外は呼び出し元へ伝わり、
ネイティブ生成の失敗は空の配列になります。[Stream 入力](./streams.ja.md)は
ファイル、メモリー、同期コールバックをサポートします。

## Factory の解析とキャッシュ

`Factory.instanceElement(parent, instancer, tag, attributes = {})` は独立した
タグと所有 Variant 属性でネイティブ生成器を呼びます。要素は実際のネイティブ派生型を
保持し、`parent.appendChild(node)` まで切り離されています。null の親に対応し、
生成失敗時は null です。登録された `*` が未知の名前のフォールバックになります。
属性に借用要素ポインターは保存できません。

`Factory.instanceElementText(parent, text)` は翻訳、エンティティ復号後に
ネイティブテキストまたは RML の子を追加します。空白だけなら追加しません。
`instanceElementStream(parent, stream)` は現在位置と参照元 URL で解析します。
ネイティブ解析結果と部分書込を維持します。6.3 のストリーム補助関数は構文診断後も
true を返します。ホストの読み取り失敗は例外です。コンテキストのルートへの追加と、
コールバックからの再解析は拒否します。

`instanceStyleSheetString(text)`、`instanceStyleSheetFile(filename)`、
`instanceStyleSheetStream(stream)` は未コンパイルの所有コンテナーを返し、
解析失敗時は null です。ファイルは設定済みネイティブファイルインターフェースを
使い、開く処理の失敗も null です。解析された規則がない場合は null です。
構文診断後に部分的なコンテナーが返る場合もあります。
`document.setStyleSheetContainer(container)` で結果を適用します。

`Factory.clearStyleSheetCache()` と `Factory.clearTemplateCache()` は以後の
読込に適用し、保持中のコンテナーとコンパイルビューを無効にしません。
コールバック内のキャッシュ変更は拒否します。`isStructuralDataView(name)` は
`for` などの接頭辞なしの正確な名前を使います。
`getStructuralDataViewAttributeNames()` は完全な `data-` 属性名の独立配列です。
終了でネイティブ所有者は無効になります。

[要素ファクトリー](../../packages/sfml.js-rmlui/examples/factory-elements.cjs)
アプリはネイティブ入力、子要素の解析、キャッシュクリアを検証します。

## 要素生成器

`ElementFormControl.createInstancer(valueAttribute = 'value')` は JS コールバック
なしのネイティブ入力生成器を提供し、仮想関数の値を指定属性に保持します。
他の生成器と同じ検証付き生成・複製・解放の由来を保持します。共有データ更新、
直接生成の属性規則と送信対象タグは [フォーム入力](./controls.ja.md) を参照。

`Factory.getElementInstancer(tag)` は一意の `ElementInstancer` または null を
返します。未知のタグは登録済みの `*` にフォールバックします。登録名は小文字に
変換されますが、検索キーは正確なままです。
`Factory.registerElementInstancer(name, instancer)` は終了まで保持します。
置換された生成器も、既存の要素が使用している間は保持されます。
null はその名前を無効にし、`*` を無効にするとフォールバックもなくなります。

```js
const input = Factory.getElementInstancer('input');
const custom = new ElementInstancer((parent, tag, attributes) =>
  input.instanceElement(parent, tag, attributes), snapshot => {
  console.log('Released', snapshot.tagName, snapshot.attributes);
});

Factory.registerElementInstancer('account-control', custom);
const field = Factory.instanceElement(null, 'account-control', 'account', {
  type: 'text', value: 'Native control',
});

custom.releaseElement(field);
```

生成コールバックは null、または別の生成器の
`instanceElement(parent, tag, attributes = {})` で作った切り離した要素を返します。
直接呼出しは生成器の動作に従い、Factory はその後に属性とプラグイン通知を適用します。
Factory と clone はネイティブ派生型と元の生成器を保持し、入れ子に対応します。
借用・追加済み・実行中・生成元が未記録の要素は移譲できません。
コールバックに渡す属性と解放通知は独立したコピーです。

`releaseElement(element)` はこの生成器で作った所有の切り離した要素だけを受け入れ、
破棄後は全ラッパーが無効です。ネイティブが同期で破棄し、その後の安全な境界で
任意の解放通知に破棄前の `{ tagName, attributes }` を渡します。
生成コールバック内の GC を含め、ネイティブデストラクターは JS を呼びません。
GC の通知は次のネイティブ呼出しで、到達可能な通知コールバックがある場合に実行します。
回収済みコールバックと環境終了では JS を呼びません。
通知の例外は伝播しますが、ネイティブ破棄は完了します。

別の生成器と値コピーは使えますが、DOM・登録変更と再帰は拒否します。
登録済みは終了まで保持します。未登録はネイティブの木または切り離した所有者の
可視参照に従い、循環 GC を許可します。終了は生成器を無効にし、ネイティブプールより
先に要素を解放します。要素ファクトリーはカスタム入力の生成と解放を検証します。

## コンテキスト生成器と所有文書ストリーム

`new ContextInstancer()` はネイティブコンストラクターを使います。

`new Context(name, manager, handler)` は登録済み Factory 生成器を選ばず、
所有するネイティブコンテキストを直接構築します。寸法ゼロと密度 1 を保持し、
Core 登録やプラグイン生成通知を行わず、`remove()` または GC で解放します。
文字入力ハンドラーは明示的に渡し、null はそのままです。
`context.getTextInputHandler()` は実際の検証付き借用ハンドラーか null を返します。
カスタムハンドラーとネイティブ組み立て入力は[文字入力](./text-panels.ja.md)を
参照してください。実際の入力方式の検証は [IME 記録](./audit/6.3/native-ime-checkpoint.md)に分けて記録します。

構築には `*` 生成器の非 null ルートと `body` 生成器の `ElementDocument` が必要です。
無効化・生成拒否・文書型不一致は参照前に例外となり、コールバック例外の同一性も保持します。
失敗時は生成済み要素を破棄し、Core 登録を追加しません。

`new ContextInstancer(create, release?)` は別の型付き生成器に委譲し、
ネイティブ破棄後の安全な境界で `{ name }` を通知します。
返す割当は要求された名前、描画管理オブジェクト、文字入力ハンドラーを一致させます。
null は生成を拒否し、例外は伝播します。入れ子の解放通知は外側から内側です。

`Factory.registerContextInstancer(instancer)` は `createContext` の生成器を選び、
置換済みも終了まで保持します。`Factory.instanceContext(name, manager, handler)` と
`instancer.instanceContext(name, manager, handler)` は Core に登録しない所有
コンテキストを返します。文字入力ハンドラーがなければ null を渡します。
既定寸法はゼロなので、レイアウト前に `setDimensions` を使います。
子は V8 の可視参照でコンテキストを保持し、クロージャー循環は回収できます。
`context.remove()` は同名の登録コンテキストを削除せず、この割当を解放します。
`instancer.releaseContext(context)` は最外生成器も検証し、登録済みは拒否します。
グローバルなフォント資源と描画管理の解放前に所有コンテキストを解放してください。
上流の資源無効化は登録された Core コンテキストだけを走査します。

`Factory.instanceDocumentStream(context, stream, documentBaseTag)` は参照元 URL と
ネイティブ文書ヘッダー処理を使い、所有する切り離した文書を解析します。
ベースタグは文書生成器を選び、ソースは `body` などの登録 XML ハンドラーを使います。
コンテキストに追加せず、読込通知も送信しません。子は文書を保持します。
コンテキスト削除時は借用資源より先にこれらの文書を破棄します。
ストリーム例外は伝播し、構文診断後に部分的な文書を返す場合があります。

```js
const custom = new ContextInstancer((name, manager, handler) =>
  new Context(name, manager, handler));

Factory.registerContextInstancer(custom);
const owned = Factory.instanceContext(
  'independent', context.getRenderManager(), null);

owned.setDimensions(760, 480);
const parsed = Factory.instanceDocumentStream(owned, new StreamMemory(
  Buffer.from('<rml><head/><body id="parsed"/></rml>')), 'body');

console.log(parsed.id, owned.getNumDocuments()); // parsed, 0
owned.remove();
```

## イベント生成器と所有イベント

`new EventInstancer()` はネイティブイベントを生成します。カスタム関数は別の生成器の
所有 `RmlEvent` を返し、null で生成を拒否します。対象、ID、型、中断フラグは
要求と一致させ、パラメーターは変更できます。所有権移転で元のハンドルは無効になります。
`Factory.registerEventInstancer(instancer)` は実際のネイティブ送信に使われ、
置換済みを含む登録生成器を終了まで保持します。

`Factory.instanceEvent(target, id, type, parameters, interruptible)` と
`instancer.instanceEvent(...)` は未送信の所有イベントを返します。
`event.setPhase(phase)` と `event.setCurrentElement(elementOrNull)` はマウス投影を含む
ネイティブ設定を実行し、保持したフィールドを更新します。伝播とパラメーターの操作には
有効なイベントが必要で、所有イベントは対象、現在要素、パラメーター要素も検証します。
`event.release()` は所有イベントを解放し、`instancer.releaseEvent(event)` は
最外生成器も検証します。送信コールバックの借用イベントは解放できません。
GC と終了でも削除し、コピーしたフィールドは解放後も読めます。
解放通知は削除後の安全な境界で `{ type, id }` を最外生成器から順に受け取り、
環境終了時は JS を呼びません。

```js
const allocator = new EventInstancer();
const custom = new EventInstancer((...args) =>
  allocator.instanceEvent(...args), snapshot => console.log(snapshot.type));

Factory.registerEventInstancer(custom);
const id = registerEventType('account-save', true, true);
const event = Factory.instanceEvent(input, id, 'account-save',
  { value: input.getValue() }, true);

event.setPhase(EventPhase.Target);
event.setCurrentElement(input);
console.log(event.getParameter('value', ''));
event.release();
```

## ネイティブリスナーとインライン属性

`new EventListener(process, attach?, detach?)` はネイティブリスナーを作ります。
`element.addEventListener(type, listener, capture?)` に渡し、同じ引数で
`removeEventListener` を呼んで解除します。複数の要素・イベント型・段階に
登録でき、同一登録は重複しません。ネイティブ要素が関数を保持し、
分離した要素と関数の循環は回収できます。

`EventListenerInstancer(create)` は正確な属性値と要求元要素を受け取り、
有効な `EventListener` または null を返します。
`Factory.registerEventListenerInstancer(instancerOrNull)` は実際の RML
`on*` 属性を制御し、生成器を置換または終了まで保持します。
属性値を JavaScript として評価しません。属性の置換・削除は旧リスナーを
解除します。生成中は要素の `id`・`tagName` の読み取りとリスナー生成が
可能ですが、DOM 変更は拒否します。
`Factory.instanceEventListener(value, element)` と
`instancer.instanceEventListener(value, element)` の結果は未登録なので、
登録まで保持してください。

登録・解除関数は登録時にコピーした `{ id, tagName }` を受け取ります。
実際の登録ごとにネイティブ処理後の外側境界で一度通知します。
環境終了では JavaScript を呼びません。手動の `listener.onAttach(element)`・
`onDetach(element)` は通知のみで、実際の登録は要素の操作を使います。
`listener.processEvent(event)` は送信せず、期限付きイベント借用を渡し、
処理中の元イベントの解放・移転・再帰を拒否します。
全登録解除後、非活動リスナーを `listener.release()` で破棄できます。
終了ですべて無効化し、関数の保持を解除します。

```js
Factory.registerEventListenerInstancer(new EventListenerInstancer(
  (action, element) => new EventListener(event => {
    if (action === 'save') {
      console.log(element.id, event.type);
    }
  })));
button.setAttribute('onclick', 'save');
button.click();
button.removeAttribute('onclick');
```
