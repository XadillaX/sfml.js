# Window

[English](window.md) / [简体中文](window.zh-CN.md) / **日本語** / [한국어](window.ko.md)

> 2D 描画には RenderWindow を使い、OpenGL を自分で組み込む場合は Window を利用できます。ウィンドウ操作はメインスレッドで実行します。

[API ナビゲーション](api.ja.md) · [Graphics](graphics.ja.md) · [クイックスタート](getting-started.ja.md)

## 作成と終了

```typescript
import { RenderWindow, VideoMode, Vector2u, State, Style } from 'sfml.js';

const window = new RenderWindow(
  new VideoMode(new Vector2u(800, 600)),
  'sfml.js',
  {
    style: Style.Default,
    state: State.Windowed,
    settings: { depthBits: 24, stencilBits: 8 },
  },
);
window.close();
```

Window と RenderWindow は空のコンストラクターで作成してから `create()` を呼ぶ方法に対応しています。Vector2u のサイズや、既存の OS ウィンドウの bigint ハンドルも受け取れます。`close()` はウィンドウを閉じますが、JS オブジェクトは再び create できます。

RenderWindow は `instanceof Window` と `instanceof RenderTarget` の両方を満たします。直接描画でき、マウスの相対座標を照会できるほか、`Texture.update(window)` の入力元にも使えます。

| インターフェース | 用途 |
| --- | --- |
| `get/setPosition()`、`get/setSize()` | ウィンドウの位置とクライアント領域のサイズ |
| `setMinimumSize()`、`setMaximumSize()` | サイズ制限。undefined で制限を解除 |
| `setTitle()`、`setVisible()`、`setIcon()` | タイトル、表示と非表示、RGBA アイコン |
| `requestFocus()`、`hasFocus()` | フォーカスの要求と照会 |
| `setMouseCursor()`、`setMouseCursorVisible()`、`setMouseCursorGrabbed()` | カーソルとマウスの移動範囲の制限 |
| `setKeyRepeatEnabled()`、`setJoystickThreshold()` | 入力の挙動 |
| `setVerticalSyncEnabled()`、`setFramerateLimit()` | 表示のタイミング |
| `getSettings()`、`getNativeHandle()` | 実際のコンテキスト設定と OS ウィンドウのハンドル |

位置には Vector2i、サイズには Vector2u を使います。`setIcon(size, pixels)` は RGBA8 のバイト列を受け取り、RenderWindow では Image も受け取れます。

## イベントループ

```typescript
import { RenderWindow, Vector2u, Keyboard } from 'sfml.js';

const window = new RenderWindow(new Vector2u(800, 600), 'Events');
window.setFramerateLimit(60);

function frame() {
  window.handleEvents({
    Closed: () => window.close(),
    KeyPressed: event => {
      if (event.code === Keyboard.Key.Escape) window.close();
    },
    Resized: event => console.log(event.size.x, event.size.y),
  });
  if (!window.isOpen()) return;
  window.clear();
  window.display();
  setImmediate(frame);
}
frame();
```

`handleEvents(handlers, fallback?)` はイベントキューを空になるまで処理し、対応する型のハンドラーを優先して呼び出します。単一の関数を渡して、すべてのイベントを処理することもできます。

手動で振り分けたい場合は `pollEvent()` を使います。

```typescript
let event;
while ((event = window.pollEvent())) {
  if (event.is('Closed')) window.close();
  const key = event.getIf('KeyPressed');
  if (key) console.log(key.code, key.scancode);
}
```

`pollEvent()` はイベントがなければ undefined を返します。Event の data は kind を判別子とするユニオン型です。`is()`、`getIf()`、`visit()` で型を絞り込んだりデータにアクセスしたりできます。TextEntered は Unicode コードポイントを使います。

`waitEvent(timeout = Time.Zero)` は同期的にブロックするインターフェースで、タイムアウトまたはウィンドウの終了時に undefined を返します。Node の I/O も処理するフレームループでは pollEvent／handleEvents を使い、フレーム間でイベントループに制御を返してください。

## リアルタイム入力とシステム機能

| インターフェース | 説明 |
| --- | --- |
| `Keyboard.isKeyPressed(key)` | 現在のキーコードの状態 |
| `Keyboard.isKeyPressed(scancode, 'scancode')` | 現在の物理スキャンコードの状態 |
| `Keyboard.localize()`／`delocalize()`／`getDescription()` | 現在のキーボード配列とのマッピングと説明 |
| `Mouse.getPosition(window?)`／`setPosition(position, window?)` | ウィンドウを省略した場合はスクリーン座標を使用 |
| `Mouse.isButtonPressed(button)` | 現在のマウスボタンの状態 |
| Joystick | 接続、ボタン、軸、デバイス識別情報。ウィンドウループがない場合は `update()` を呼ぶ |
| Sensor | 最初に `isAvailable()` を確認し、その後に有効化と読み取りを行う |
| Clipboard | `getString()`／`setString()`。JS の Unicode 文字列に対応 |
| Touch | タッチ点の状態と位置。SFML 3.1.0 ではリアルタイム Touch API は非推奨 |

入力名前空間内の列挙型とトップレベルの列挙型は同じオブジェクトを共有します。たとえば `Keyboard.Key` と `KeyboardKey` が該当します。

`Cursor.createFromSystem()`、`createFromPixels()` は失敗時に undefined を返し、コンストラクターは失敗時に例外を投げます。ウィンドウは使用中の Cursor の寿命を維持します。macOS では、システムカーソルを使う前にウィンドウを作成する必要があります。

VideoMode は `size` と `bitsPerPixel` を使います。`getDesktopMode()`、`getFullscreenModes()` でデバイスのモードを照会し、`isValid()` でフルスクリーンモードの有効性を判定します。特定の数のフルスクリーンモードが必ず提供されるとは想定しないでください。

## OpenGL と Vulkan

Context は独立した OpenGL コンテキストを作成でき、有効化、実際の設定、拡張の照会、関数アドレスの照会を提供します。`Context.getActiveContextId()` は bigint を返し、有効なコンテキストがなければ `0n` です。`getFunction()` はアドレスを bigint で返します。その関数を呼び出すには、シグネチャが一致するネイティブコードが必要です。

RenderWindow の `setActive()`、`pushGLStates()`、`popGLStates()`、`resetGLStates()` は、SFML と独自の OpenGL 処理を混在させるために使います。GL の状態を直接変更する前に SFML のコマンドを送信してください。push／pop は同じコンテキスト内で対にする必要があります。

Vulkan 名前空間は以下を提供します。

- `isAvailable(requireGraphics = true)`。
- `getFunction(name)`。
- `getGraphicsRequiredInstanceExtensions()`。

`window.createVulkanSurface(instance, allocator = 0n)` はサーフェスハンドルを bigint で返し、失敗時は undefined です。インスタンス、アロケーター、サーフェスの破棄は呼び出し側が管理します。

SFML 3.1.0 の macOS ビルドには Vulkan バックエンドがありません。これらの照会は利用不可を示し、MoltenVK をインストールしても SFML のこのプラットフォーム分岐は変わりません。Windows／X11 の成功経路は、それぞれの環境で検証する必要があります。

## デモの実行

ビルド後に `node examples/window.cjs --frames=120` を実行すると、イベント、キーコード、ポインターの位置、ウィンドウのプロパティを確認できます。フレーム数を省略すると継続して実行します。

| キー | 動作 |
| --- | --- |
| F1／F2 | カーソルの種類／表示と非表示 |
| F3／F4 | キーリピート／垂直同期 |
| F5／F6 | ウィンドウサイズ／サイズ制限 |
| F7／F8 | タイトルの変更／1 秒間非表示にしてから復元 |
| F9／F10 | イベント API／ウィンドウの移動 |
| Esc | 閉じる |

macOS では Fn キーも同時に押す必要がある場合があります。ジョイスティック、センサー、タッチ、Vulkan の機能は、デバイスの照会結果に基づいて判断してください。CI のビルド成功は、これらのハードウェア固有の処理がすべて検証済みであることを意味しません。

<a id="sfml-cpp-reference"></a>
## SFML C++ リファレンス

上流の [Window](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Window.html)、[RenderWindow](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1RenderWindow.html)、[Event](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Event.html)、[VideoMode](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1VideoMode.html)、[Cursor](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Cursor.html) では、ウィンドウ、イベント型、座標規則を確認できます。それらの概念はこのガイドで説明する範囲で適用されますが、JS では文字列と型付きペイロードでイベントを振り分け、`setImmediate()` でイベントループに制御を返します。`waitEvent()` は同期的に待機する点に注意してください。
