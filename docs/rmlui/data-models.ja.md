# ネイティブデータモデル

RmlUi はネイティブ Core で式を評価し、変更ビューを更新し、双方向コントローラーを実行します。`data-model` 属性を持つ文書を読み込む前に、同名のモデルを作成します。

```js
const model = context.createDataModel('application');

if (!model) {
  throw new Error('Duplicate model');
}

model.bind('title', 'Inventory');
model.bind('count', 1);
const handle = model.getModelHandle();

const document = context.loadDocumentFromMemory(`
  <rml><head/><body data-model="application">
    <div>{{title}}: {{count}}</div>
  </body></rml>
`);

document.show();

model.getVariable('$.count').set(2);
handle.dirtyVariable('count');
context.update();
```

`DataModelConstructor` は値とコールバックをバインドします。`getModelHandle()` はルート変数の変更通知用に別の `DataModelHandle` を返します。`getDataModel(name)` は同じコンストラクターを返し、`getDataModels()` はスナップショットを返します。重複名または存在しないモデルは `null` です。`removeDataModel(name)` はネイティブの真偽値を返します。

スカラーの保存領域はネイティブ側が所有します。初期値の boolean、number、BigInt、string がネイティブ型を決めます。`DataVariable.get()` と `set(value)` は実際の定義を呼び出し、文字列から数値への `atof` を含む RmlUi の変換規則に従います。設定だけではルートの変更通知を行いません。変数ハンドルはパスを保持し、毎回保存領域を解決します。

`new DataModelHandle()`、`new DataModelConstructor()`、`new DataVariable()` は無効なハンドルを作成します。`isValid` は `false` を返し、有効な値を必要とする操作は例外になります。モデル変数の有効性は配列の切り詰めを含め、現在のパスも検証します。

`new DataVariable(schema, initialValue)` は検証済みの登録済み `DataSchema` から
独立したネイティブ所有ストレージを作成します。初期値を省略すると既定値になります。
スカラー、列挙、配列、再帰構造、管理された参照とカスタムデータはモデルと同じ定義を
使います。子変数はルートを保持し、サイズ変更と参照変更の後にパスを再解決します。
数値ビューはネイティブメモリーを共有し、古いビューはサイズ変更や終了後も元の領域を
保持します。変数はレジスターを保持し、レジスターと同時に無効になります。参照と
コールバック対象には同じレジスターが必要です。データと参照は V8 から見える所有関係を
使い、到達不能な循環は GC が回収します。`model.bindCustomDataVariable(name, variable)`
は検証済み別名をバインドします。モデル更新にはルートの変更通知が必要です。

```js
const { DataTypeRegister, DataVariable } = require('sfml.js-rmlui');
const types = new DataTypeRegister();
const real = types.registerScalar('Real', 'float64');
const reals = types.registerArray('Reals', real);
const values = new DataVariable(reals, [1, 2]);

values.getNumericView()[1] = 3;
const ownedModel = context.createDataModel('owned', {typeRegister: types});

ownedModel.bindCustomDataVariable('values', values);
ownedModel.dirtyVariable('values');
```

`DataTypeGetFunc<T>` と `DataTypeSetFunc<T>` はスカラーデータのコールバック型です。`DataEventMemberFunc<T>`、`MemberGetFunc<T>`、`MemberSetFunc<T>` はホストメソッドを表し、`.bind(owner)` で this をバインドしてから `bindEventCallback()` または `bindFunc()` に渡します。`MemberGetterFunc<Object, ReturnType>` と `MemberSetterFunc<Object, AssignType>` は `registerMember()` で使う値または参照のメソッド型です。`VoidMemberFunc` は省略したメンバーコールバック（`undefined`）を表します。

`DataAddressEntry(nameOrIndex)` の `name` と `index` は変更可能です。名前から構築すると添字は `-1`、添字から構築すると名前は `''` になります。順序付き `DataAddress` を `getVariable()` に、単独の要素を `child()` に渡せます。解決時に両フィールドをコピーするため、後から要素を変更しても保持した変数の対象は変わりません。明示的な要素ならドットを含むメンバー名も指定できます。

```js
const { DataAddressEntry, makeLiteralIntVariable } = require('sfml.js-rmlui');
const count = model.getVariable([new DataAddressEntry('count')]);

model.bindCustomDataVariable('constant', makeLiteralIntVariable(-7));
const roots = model.getAllVariables();
// roots.count resolves the same live storage; later bound roots are absent.
```

`makeLiteralIntVariable(value)` はゼロと負数を含む符号付き 32 ビット整数を受け取り、Core の不変な定数を作成します。取得は成功し、設定は `false`、サイズはゼロで、子はありません。単独の定数はモデル削除とランタイム終了後も有効です。モデルから取得した変数にはモデルの寿命が適用されます。`getAllVariables()` は `DataModelConstructorAccessor` でネイティブルート名のスナップショットを取得します。

`DataVariable.getDefinition()` は `DataVariableAccessor` で検証済み `DataDefinition` を取得します。登録済み定義は正規の `DataSchema` の同一性を保持し、推論スカラー、関数バインド、定数は変数のリースを保持します。`isValid`、`type`、`reflectMemberNames()` は操作ごとに所有者を検証します。単独の定数の定義は終了後も有効です。モデル由来の定義はモデルまたは変数パスの失効時に無効になります。

`DataSchema.underlying` は正規の配列要素または管理参照の対象スキーマを返し、それ以外は `null` を返します。`DataPointerTraits(schema)` は `isPointer`、`elementType`、`dereference(variable)` により `PointerTraits::is_pointer_v`、`element_type`、`Dereference` の実行時相当の操作を提供します。値はラッパーの同一性を保持し、参照は検証済み対象または `null` を返します。型の不一致と失効したハンドルは拒否されます。C++ の生・専有・共有ポインターは JS では管理されたネイティブ参照リースを使用し、アドレスは境界を越えません。

`DataTypeRegister.createFamilyId()` は実際のネイティブ識別子を割り当てます。`registerDefinition(familyId, name, callbacks)` は自作定義をネイティブレジスターへ移譲し、挿入結果を返します。識別子や名前の重複は `false` を返し、拒否したコールバックを保持しません。同じランタイム世代内でレジスター間に識別子を共有できます。未割当の数値と旧世代の識別子は拒否されます。`getDefinition(nameOrFamilyId)` は正規の登録済みスキーマまたは `null` を返します。

`new DataStructHandle(register, definition)` は登録済み構造定義を包み、
定義とレジスターのリースを共有します。データ領域は割り当てません。別のレジスター、
スカラー、配列、参照、自作定義、失効したレジスターは拒否されます。

ネイティブの `ScalarDefinition`、`ScalarFuncDefinition`、`StructDefinition`、
`ArrayDefinition<Container>` はスカラー、コールバック、構造、配列スキーマに対応します。
`StructHandle::RegisterMember` はメンバーオブジェクトを保存メンバーに、スカラーの
getter を値コールバックに、ポインターと参照の getter を検証済み変数コールバックに
対応させます。getter/setter の組は void setter の呼び出し前にスカラー変換を行います。
省略したコールバックは `VoidMemberFunc` に対応します。自作 `VariableDefinition`
は `DataCustomDefinition` で表し、レジスターがアダプターを所有し、各ノードがデータを
保持します。JS はネイティブストレージと検証済みリースを使い、C++ アドレスは受け取りません。
ネイティブコードは上流ヘッダーから C++ テンプレートを実体化できます。

有効な参照先では Get/Set/Size/Child とリフレクションをネイティブへ転送します。
上流 `BasePointerDefinition` は外側の保存アドレスを検証しますが null の参照先を
保護しません。JS は参照先も検証し、null を文書化された空の動作として扱います。
数値範囲の検証、スキーマ固定、重複メンバーの拒否は JS の検証方針であり、
C++ メモリー配置の一致を意味しません。

```js
let name = 'initial';

model.bindFunc('name', () => name, value => {
  name = String(value);
});
model.registerTransformFunc('decorate', args =>
  `${args[1]}${args[0]}${args[1]}`);
model.bindEventCallback('increment', (handle, event, args) => {
  const count = model.getVariable('count');

  count.set(Number(count.get()) + Number(args[0]));
  handle.dirtyVariable('count');
  event.stopPropagation();
});
```

式の文字列には単一引用符を使います。例は `{{name | decorate('!')}}` と `data-event-click="increment(3)"` です。setter を省略した `bindFunc` は読み取り専用です。ネイティブ `data-value` コントローラーは setter を呼び出してルートを変更対象にします。変換関数はコンテキストの型レジストリーに属し、登録元のモデルを削除しても存続します。重複名では最初の登録を維持し、拒否したホストコールバックは保持しません。組み込み変換も同じ規則です。

`model.update(clearDirtyVariables = true)` はネイティブ `DataModel::Update` を実行します。`Context.update()` もモデルを更新します。文書の読み込みと表示時に同期更新と getter 呼び出しが発生する場合があります。

コールバックは所有 Node 環境で同期実行され、最初の例外をホスト境界へ返します。同じ getter の再帰呼び出しは拒否します。コールバック中のモデル、コンテキスト、ランタイムの削除は禁止です。イベント操作はコールバック終了時に失効しますが、保存したフィールドは読めます。モデル削除はすべての関連ハンドルを無効にし、コンテキスト破棄と終了は関連モデルを無効にします。ネイティブ所有のコンテキストはコールバックを保持し、独立所有のコンテキストは V8 に見える所有関係によって循環を回収できます。

コンテキストの既定レジスターを使うか、独立した `DataTypeRegister` を作成して `createDataModel(name, { typeRegister })` に渡します。独立レジスターはコンテキスト間で共有でき、コンテキスト削除後も存続します。既定レジスターはモデル削除後も存続し、コンテキスト破棄時に無効になります。終了時にはすべてのレジスターが無効になります。

```js
const types = model.getDataTypeRegister();
const number = types.registerScalar('Real', 'float64');
const text = types.registerScalar('Text', 'string');
const item = types.registerStruct('Item');

item.registerMember('name', text);
item.registerMember('price', number);
const items = types.registerArray('Items', item);

model.bind('items', [{ name: 'Apple', price: 2.5 }], items);
model.applyPatch({ '$.items[0].price': 3 });
context.update();
```

スカラー定義は `bool`、`string`、`int8`/`uint8`、`int16`/`uint16`、`int32`/`uint32`、`int64`/`uint64`、`float32`、`float64` に対応します。整数変換は範囲を確認し、失敗時は元の値を保持します。ネイティブ双方向コントローラーも同じ確認を行います。構造体のメンバーは自分自身の配列型を参照できます。ストレージの作成開始時に定義は固定されます。重複型名は `null`、重複メンバー名は `false` です。異なるレジスターの定義は混在できません。

`bindFunc` の getter と変換コールバックは、null、基本値、ベクトル、色、装飾リスト、変換コピー、アニメーションと遷移リスト、型付き効果リストを含む所有する `DataVariantValue` を返せます。定義が対応していれば `DataVariable.set()` も同じ値を受け付けます。変換は値をコピーし、ネイティブ共有リソースを保持します。借用した要素や void ポインターには管理参照定義が必要です。戻り値のアクセサーもコールバック中に実行され、再帰と削除の確認が適用されます。

```js
model.bindFunc('accent', () => ({
  type: 'colourb', red: 165, green: 213, blue: 205, alpha: 255,
}));
const transforms = types.getTransformFuncRegister();

transforms.register('coordinates', args => ({
  x: Number(args[0]), y: Number(args[1]),
}));
const result = transforms.call('coordinates', [ 3, 4 ]);
// { success: true, value: { x: 3, y: 4 } }
```

`TransformFuncRegister` は組み込み関数とモデル登録関数を含む実際のネイティブレジスターを呼びます。`success` は存在しない関数と null を返す関数を区別します。存在しなければ `{ success: false, value: null }` です。ラッパーは型レジスターのリースを保持し、同じ寿命を使います。入力変換後にそのリースを解決します。

数値配列の `variable.getNumericView()` は型に対応する共有ビューを返します。boolean と string の配列は検証済みの子要素操作を使います。`variable.resize(count)` は既存要素を保持し、新要素を既定値にします。ルート変更通知は行いません。サイズ変更後は新しい数値ビューを取得します。以前のビューは元の領域を保持し、新しい配列には書き込みません。ビューはモデルやコンテキストを保持せず、その破棄後もメモリーを使えます。ネイティブ式、ビュー、コントローラー、JS ハンドルは毎回パスを解決します。

`applyPatch` は書き込み前に指定スカラーだけを変換し、設定できたルートだけを変更対象にします。ネイティブデータイベントのコールバック内でも使えます。登録されていない属性は読み取りません。変換 getter の例外は部分書き込みを起こしません。最初の例外は以後の設定を停止し、拒否された設定は `false` を返します。型登録はコールバック外で実行します。配列 `.size`、添字付きの子、名前付きの子、メンバーリフレクションはネイティブ定義を使用します。

データイベント関数では登録配列のサイズを同期変更でき、同じイベント式の後続文は新しいサイズをすぐ参照します。getter、setter、変換、自作定義、メンバーのコールバックと途中の通常リスナーでは禁止です。getter がデータイベントを送出しても制限は残ります。変更後に元のルートを変更通知し、アプリケーションに戻ってからビューを更新します。

公式 `data-binding` は上流の四つのモデルを実行します。マウス座標記録、項目の追加と削除、双方向コントロール、Invaders の動作を含みます。`tree-view` は実際のサンプルディレクトリーを走査し、上流の子孫表示と折りたたみ規則を使います。原本のリソースを直接読み込みます：

```sh
node packages/sfml.js-rmlui/examples/official.cjs data-binding
node packages/sfml.js-rmlui/examples/official.cjs tree-view
```

上流のフォームには `onsubmit="submit_form"` がありますが、アプリケーションに対応ハンドラーはありません。この動作を保持します。`ElementForm.submit()` はネイティブ submit イベントを送出します。

`registerReference(name, targetSchema)` は null 許容の管理モデル参照を登録します。スカラー、配列、構造体の対象は同じレジスターの基底定義と一致する必要があります。`DataVariable` または `null` をバインドし、メンバーや配列要素にも使えます。参照への参照は RmlUi 6.3 `DataTypeRegister::GetDefinition<T>()` のポインターへのポインターを禁止する `static_assert` に合わせて拒否します。再帰的な構造体のメンバーと参照の配列は対応します。

```js
const itemRef = types.registerReference('ItemRef', item);

model.bind('selected', model.getVariable('items[0]'), itemRef);
model.getVariable('selected.price').set(4);
model.dirtyVariable('items');
model.dirtyVariable('selected');
const selected = model.getVariable('selected');

selected.setReference(null);
model.dirtyVariable('selected');
// selected.getReference() === null
```

`getReference()` は検証済み対象を返し、`setReference(target)` は通知せず対象を置換またはクリアします。空スカラー参照の読み取りは null、書き込みは `false` です。空配列参照のサイズは 0、空参照に子はありません。削除されたモデルや無効な配列パスは例外となり、自己依存パスには深度制限があります。ネイティブ側は弱いパスを保持し、V8 可視の辺が対象を保持します。クリア、切り詰め、モデル削除で辺を解放し、所有コンテキスト間の参照循環も回収できます。数値ビューとサイズ変更は現在の参照先を使います。

`registerEnum(name, integerKind)` は検証済みの基底整数幅でネイティブ列挙値を保存します。全八種類の符号付き・符号なし整数と完全な `uint64` 範囲に対応し、数値配列ビューも基底の幅を使います。名前付き列挙値の集合は制限しません。コンストラクターには自身の型レジスターを使う `registerScalar`、`registerStruct`、`registerArray`、`registerCustomDataVariableDefinition` もあります。

```js
const { DataVariableType } = require('sfml.js-rmlui');
const status = model.registerEnum('Status', 'uint8');

model.bind('status', 2, status);
const custom = model.registerCustomDataVariableDefinition('Price', {
  type: DataVariableType.Scalar,
  get: payload => ({ success: true, value: payload.price }),
  set: (payload, value) => {
    if (typeof value !== 'number') {
      return false;
    }

    payload.price = value;

    return true;
  },
});

model.bindCustomDataVariable('price', { price: 3 }, custom);
model.getVariable('price').set(4);
```

カスタム定義は実際のネイティブ `VariableDefinition::Get`、`Set`、`Size`、`Child`、`ReflectMemberNames` を実装します。`get(payload)` は `{ success, value }` を返し、成功した場合だけ所有する Variant を読み取ります。`set(payload, value)` は真偽値、`size(payload)` は非負のネイティブ int を返します。`child(payload, nameOrIndex)` は同じレジスターの検証済み `DataVariable` または `null` を返し、`reflectMemberNames()` は型レベルの名前を返します。省略したメソッドはネイティブ既定値を使い、配列の `"size"` の子は child コールバックが提供します。

`bindCustomDataVariable(name, payload, schema)` は元の JS データを直列化せず保持し、`getPayload()` は同じオブジェクトを返します。戻り値のアクセサーも実行中のコールバック内で評価され、再帰、破壊的操作、最初の例外には既存の検査を適用します。子変数のリースは後続のコールバックを含む最外ネイティブ呼び出しの終了まで保持されます。数値ビューとサイズ変更はカスタム子のパスを通じて登録済みネイティブ配列に到達します。カスタム配列自体はサイズ変更用ストレージを持ちません。失敗したバインドはデータを保持せず、モデル削除で解放し、所有コンテキストの循環も回収できます。

`registerMember(name, schema, getter?, setter?)` はネイティブメンバーアクセサーを登録します。コールバックは拡張後の配列要素も含め、現在の親パスの検証済み `DataVariable` を受け取ります。アクセサーの初期プロパティは読み取らず保持しません。通常のスカラーと列挙値は宣言した幅で変換してから setter を呼びます。カスタムスカラーメンバーは所有 Variant を直接交換します。setter を省略すると読み取り専用、getter を `undefined` にすると書き込み専用です。

```js
const accessorTypes = new rmlui.DataTypeRegister();
const real = accessorTypes.registerScalar('Real', 'float64');
const product = accessorTypes.registerStruct('Product');

product.registerMember('price', real);
product.registerMember('doublePrice', real,
  parent => Number(parent.child('price').get()) * 2,
  (parent, value) => parent.child('price').set(Number(value) / 2));
```

ストレージのバインド前に登録してください。配列や構造の getter は同じ型レジスターの同じ定義の変数、または `null` を返します。スカラーの参照 getter は参照スキーマを使います。参照 getter は読書き、子パス、数値ビュー、サイズ変更を現在のターゲットへ転送し、値の setter は受け取りません。null は管理参照の意味に従います。返したリースは外側のネイティブ呼び出し終了まで保持され、保存した親と子変数はサイズ変更やモデル削除後にパスを再解決します。

`registerScalar(name, { get?, set? })` は保持するデータのスカラー型コールバックを登録します。getter は所有 Variant を直接返し、setter はネイティブ `void` の意味です。列挙値からラベルへの変換にも使えます。

```js
const label = model.registerScalar('StatusLabel', {
  get: data => ['idle', 'ready', 'done'][data.code],
  set: (data, value) => {
    data.code = ['idle', 'ready', 'done'].indexOf(String(value));
  },
});

model.bindCustomDataVariable('statusLabel', { code: 1 }, label);
model.bindCustomDataVariable('countAlias', model.getVariable('count'));
```

二引数の `bindCustomDataVariable(name, variable)` は高度な別名を登録します。同じレジスターの検証済みターゲットを保持し、配列のサイズ変更や推論整数の範囲チェックも毎回パスから解決します。公開型名は追加しません。ターゲット削除や切り詰め後のアクセスは無効になり、モデル削除で所有関係を解放します。書き込み後はビューが使う元と別名の両ルートに変更印を付けてください。拒否された登録や重複別名はコールバックやターゲットを保持しません。

`DataView` と `DataController` は実際のネイティブ仮想操作を実装します。有効な要素に作成し、`DataViewInstancer` または `DataControllerInstancer` から返します。`initialize(model, element, expression, modifier)` は実際のモデルの検証済み `DataModelConstructor` を受け取り、真偽値を返します。ビューの `update(model)` は文書の変化を返し、`getVariableNameList()` は Core のネイティブ更新処理にルート依存を渡します。

```js
const { Factory, DataView, DataViewInstancer } = require('sfml.js-rmlui');

Factory.registerDataViewInstancer(new DataViewInstancer(element => {
  let name = '';

  return new DataView(element, {
    initialize(_model, _element, expression) {
      name = expression;

      return true;
    },
    update(current) {
      const label = String(current.getVariable(name).get());

      if (element.getAttribute('title') === label) {
        return false;
      }

      element.setAttribute('title', label);

      return true;
    },
    getVariableNameList: () => [name],
  }, -10);
}), 'label');
// <span data-label="count">現在の数をホバーで表示</span>
```

`Factory.registerDataViewInstancer(instancer, name, structural = false)` と `registerDataControllerInstancer(instancer, name)` は実際の登録処理を呼び、void を返します。既定値を含む最初の登録を保持し、拒否した関数は保持しません。名前は完全一致です。構造登録は完全な `data-` 名をパーサーに追加します。その属性を正確に使うと未展開の子を `rmlui-inner-rml` に保存します。初期化には元の属性式と修飾子を渡します。

`Factory.instanceDataView(name, element)` と `instanceDataController(name, element)` は実際の所有する既定または自作インスタンス、あるいは null を返します。既定ビューは `attr`、`attrif`、`class`、`if`、`visible`、`rml`、`style`、`text`、`value`、`checked`、`alias`、`for`、既定コントローラーは `checked`、`event`、`value` です。生成器から既定実装への委譲はネイティブ動作と解放追跡を保持します。

直接の `instanceView(element)` と `instanceController(element)` は所有権を呼び出し側に返します。RML 解析は唯一の所有権を Core に移し、移転済み・無効・初期化済み・別要素の結果は例外です。手動 `initialize` は一度のみで、モデル更新処理には登録しません。既定コントローラーは初期化でネイティブリスナーを登録し、解放で解除します。自作のホストリスナーは任意の `release()` 通知で解除してください。

`getElement()` はネイティブ監視を使い、要素の破棄後は null です。`isValid` は解放と世代も検証します。`sortOrder` はキャッシュした深さと順序、`getVariableNameList()` は独立した一覧を返します。`release()` は呼び出し側の所有者のみを破棄し、コールバック中と Core 所有中は拒否します。既定コントローラーと式の関数も対象です。Core の破棄は借用を無効化します。解放通知はネイティブ処理後に実行し、保持した要素は無効な場合があります。先行例外と環境終了時は抑止し、未参照の所有インスタンスの GC では保証しません。所有コンテキストの関数循環は回収可能です。

十二の既定ビューと三つのコントローラーのローカル操作テスト、公式の四モデルとツリービューの状態テストが通過しています。

リポジトリーの保守ツール `node packages/sfml.js-rmlui/tools/performance/measure-data.cjs` は、1 千・1 万・10 万個の実際のバインド要素と 100 個のネイティブ配列ルートを検証します。[測定記録](audit/6.3/data-performance.md) は dirty なし・1% dirty・全 dirty の更新、疎なパッチ、ビュー取得と拡張を含みます。10 万行のモデル更新は単回測定で順に 0.051、0.201、18.781 ms、疎な更新は対応する 1,000 個の検証付き値だけを読みました。割り当て・コピー計数はデータストレージと数値配列の拡張のみが対象です。性能とプラットフォームの全検証は未完了です。
