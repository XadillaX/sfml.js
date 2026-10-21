# SFML 公式サンプル

[English](README.md) · [简体中文](README.zh-CN.md) · **日本語** · [한국어](README.ko.md)

[SFML 公式サンプル][upstream] の JavaScript 移植です。グラフィックス、ネイティブウィンドウ、入力、音声、通信の 24 サンプルを収録しています。[Android](android/README.md) は未移植です。

[全サンプル](../README.ja.md) · [ビルド要件](../../docs/getting-started.ja.md#requirements) · [機能サンプル](../features/README.ja.md) · [ゲームとアプリ](../projects/README.ja.md)

## クイックスタート

リポジトリのルートで実行します。

```sh
npm ci
cd examples/official
node tennis/Tennis.cjs
```

以下のコマンドは `examples/official` で実行します。各スクリプトが必要な素材を読み込みます。描画にはディスプレイと OpenGL ウィンドウのサポートが必要です。

一覧：[グラフィックス](#graphics) · [入力とイベント](#input) · [オーディオ](#audio) · [ネットワーク](#network) · [プラットフォーム連携](#platform)

<a id="graphics"></a>

## グラフィックス

<div class="example-gallery">
  <article class="example-entry" id="island">
    <a href="screenshots/island.png">
      <img src="screenshots/island.png" width="360" alt="生成した島と地形パラメーター">
    </a>
    <div class="example-info">
      <p><strong><a href="island/Island.cjs">Island</a></strong></p>
      <p>地形と照明</p>
      <p><strong>操作</strong> · 矢印でパラメーターを編集、Enter で再生成</p>
      <p><code>node island/Island.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="shader">
    <a href="screenshots/shader.png">
      <img src="screenshots/shader.png" width="360" alt="蝶の画像に適用したピクセル化シェーダー">
    </a>
    <div class="example-info">
      <p><strong><a href="shader/Shader.cjs">Shader</a></strong></p>
      <p>5 種類のシェーダー</p>
      <p><a href="screenshots/shader-edge.png">sfml.js ロゴのエッジ検出プレビュー</a></p>
      <p><strong>操作</strong> · 左右で選択、マウスで調整</p>
      <p><code>node shader/Shader.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="tennis">
    <a href="screenshots/tennis.png">
      <img src="screenshots/tennis.png" width="360" alt="Tennis のプレイ中、2 つのパドルの間でボールを打ち合う場面">
    </a>
    <div class="example-info">
      <p><strong><a href="tennis/Tennis.cjs">Tennis</a></strong></p>
      <p>Pong</p>
      <p><strong>操作</strong> · Space またはタッチで開始、上下キーで移動、Esc で終了</p>
      <p><code>node tennis/Tennis.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="stencil">
    <a href="screenshots/stencil.png">
      <img src="screenshots/stencil.png" width="360" alt="ステンシルマスクで重なる赤緑青の図形">
    </a>
    <div class="example-info">
      <p><strong><a href="stencil/Stencil.cjs">Stencil</a></strong></p>
      <p>ステンシルマスクと図形のアニメーション</p>
      <p><code>node stencil/Stencil.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="text">
    <a href="screenshots/text.png">
      <img src="screenshots/text.png" width="360" alt="40 個の多言語テキストサンプル">
    </a>
    <div class="example-info">
      <p><strong><a href="text/Text.cjs">Text</a></strong></p>
      <p>多言語の 40 サンプル</p>
      <p><strong>操作</strong> · クリックで選択、F1／F2／F3 で境界とカーソル、F4 で前処理を切り替え、左右でカーソル移動</p>
      <p><code>node text/Text.cjs</code></p>
    </div>
  </article>
</div>

<a id="input"></a>

## 入力とイベント

<div class="example-gallery">
  <article class="example-entry" id="keyboard">
    <a href="screenshots/keyboard.png">
      <img src="screenshots/keyboard.png" width="360" alt="キー配列、A キーの押下と文字入力">
    </a>
    <div class="example-info">
      <p><strong><a href="keyboard/Keyboard.cjs">Keyboard</a></strong></p>
      <p>物理キー配列、キーイベント、文字入力と効果音</p>
      <p><code>node keyboard/Keyboard.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="event-handling">
    <a href="screenshots/event_handling.png">
      <img src="screenshots/event_handling.png" width="360" alt="Visitor でのキーとマウスのイベントログ">
    </a>
    <div class="example-info">
      <p><strong><a href="event_handling/EventHandling.cjs">Event handling</a></strong></p>
      <p>5 種類のイベント処理</p>
      <p><strong>操作</strong> · Enter で切り替え</p>
      <p><code>node event_handling/EventHandling.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="raw-input">
    <a href="screenshots/raw_input.png">
      <img src="screenshots/raw_input.png" width="360" alt="マウスの生の移動量とカーソル位置">
    </a>
    <div class="example-info">
      <p><strong><a href="raw_input/RawInput.cjs">Raw input</a></strong></p>
      <p>マウスの Raw Input</p>
      <p><code>node raw_input/RawInput.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="joystick">
    <a href="screenshots/joystick.png">
      <img src="screenshots/joystick.png" width="360" alt="機器が接続されていないジョイスティック画面">
    </a>
    <div class="example-info">
      <p><strong><a href="joystick/Joystick.cjs">Joystick</a></strong></p>
      <p>軸とボタン</p>
      <p><strong>操作</strong> · 0～7 で機器を選択、Tab で汎用／ゲームパッド表示を切り替え</p>
      <p><code>node joystick/Joystick.cjs</code></p>
    </div>
  </article>
</div>

<a id="audio"></a>

## オーディオ

録音サンプルにはマイクと OS の録音許可が必要です。

<div class="example-gallery">
  <article class="example-entry" id="sound-effects">
    <a href="screenshots/sound_effects.png">
      <img src="screenshots/sound_effects.png" width="360" alt="リスナー、音源と距離減衰の円">
    </a>
    <div class="example-info">
      <p><strong><a href="sound_effects/SoundEffects.cjs">Sound effects</a></strong></p>
      <p>9 種類の効果</p>
      <p><strong>操作</strong> · 左右で選択、マウスで調整、上下で減衰／波形選択、Space で DSP バイパス、F1 で出力変更</p>
      <p><code>node sound_effects/SoundEffects.cjs</code></p>
    </div>
  </article>
</div>

<div class="example-gallery">
  <article class="example-entry" id="sound">
    <div class="example-info">
      <p><strong><a href="sound/Sound.cjs">Sound</a></strong></p>
      <p>WAV 効果音と OGG、FLAC、MP3 音楽の再生</p>
      <p><code>node sound/Sound.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="sound-capture">
    <div class="example-info">
      <p><strong><a href="sound_capture/SoundCapture.cjs">Sound capture</a></strong></p>
      <p>機器とサンプルレートを選び、録音して再生または保存</p>
      <p><code>node sound_capture/SoundCapture.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="sound-device">
    <div class="example-info">
      <p><strong><a href="sound_device/SoundDevice.cjs">Sound device</a></strong></p>
      <p>機器通知、自動ルーティング、切断後の復旧。Ctrl+C で終了</p>
      <p><code>node sound_device/SoundDevice.cjs</code></p>
    </div>
  </article>
</div>

<a id="network"></a>

## ネットワーク

<div class="example-gallery">
  <article class="example-entry" id="http">
    <div class="example-info">
      <p><strong><a href="http/Http.cjs">HTTP</a></strong></p>
      <p>リダイレクト対応の対話型 HTTP GET</p>
      <p><code>node http/Http.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="ftp">
    <div class="example-info">
      <p><strong><a href="ftp/Ftp.cjs">FTP</a></strong></p>
      <p>対話型 FTP クライアント、ポート 21</p>
      <p><code>node ftp/Ftp.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="sftp">
    <div class="example-info">
      <p><strong><a href="sftp/Sftp.cjs">SFTP</a></strong></p>
      <p>対話型 SFTP。ホスト指紋を確認してから認証</p>
      <p><code>node sftp/Sftp.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="sockets">
    <div class="example-info">
      <p><strong><a href="sockets/Sockets.cjs">Sockets</a></strong></p>
      <p>TCP、TLS、UDP のメッセージ交換、ポート 50001</p>
      <p><code>node sockets/Sockets.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="voip">
    <div class="example-info">
      <p><strong><a href="voip/VoIP.cjs">VoIP</a></strong></p>
      <p>TCP による音声録音、再生、リプレイ、ポート 2435</p>
      <p><code>node voip/VoIP.cjs</code></p>
    </div>
  </article>
</div>

sockets と VoIP は 2 つのターミナルで実行し、サーバーとクライアントをそれぞれ選択します。ローカル接続には `127.0.0.1` を指定してください。

<a id="platform"></a>

## プラットフォーム連携

nodegl のビルドには CMake、C++ コンパイラー、OpenGL 開発ライブラリ（Linux では `libgl1-mesa-dev`）が必要です。Vulkan には Vulkan ローダーと 4 倍の異方性フィルタリングに対応するドライバーも必要です。

<div class="example-gallery">
  <article class="example-entry" id="window">
    <a href="screenshots/window.png">
      <img src="screenshots/window.png" width="360" alt="黒い背景で回転する 6 色の立方体">
    </a>
    <div class="example-info">
      <p><strong><a href="window/Window.cjs">Window</a></strong></p>
      <p>OpenGL ウィンドウで回転する 6 色の立方体</p>
      <p><strong>操作</strong> · 枠のドラッグでサイズ変更、Esc またはウィンドウを閉じて終了</p>
      <p><code>node window/Window.cjs</code></p>
      <p>macOS、Linux、Windows · ルートの <code>npm ci</code> で <code>@wettstein/nodegl</code> を導入</p>
    </div>
  </article>
  <article class="example-entry" id="opengl">
    <a href="screenshots/opengl.png">
      <img src="screenshots/opengl.png" width="360" alt="SFML の背景と文字の間に描画した OpenGL テクスチャ立方体">
    </a>
    <div class="example-info">
      <p><strong><a href="opengl/OpenGL.cjs">OpenGL</a></strong></p>
      <p>SFML の背景・文字と OpenGL のテクスチャ立方体を混在描画</p>
      <p><strong>操作</strong> · マウスで立方体を移動、Enter で mipmap 切替、Space で sRGB 切替、Esc で終了</p>
      <p><code>node opengl/OpenGL.cjs</code></p>
      <p>macOS、Linux、Windows · ルートの <code>npm ci</code> で <code>@wettstein/nodegl</code> を導入</p>
    </div>
  </article>
  <article class="example-entry" id="vulkan">
    <a href="screenshots/vulkan.png">
      <img src="screenshots/vulkan.png" width="360" alt="Vulkan で描画した元の色付き立方体と sfml.js ロゴ">
    </a>
    <div class="example-info">
      <p><strong><a href="vulkan/Vulkan.cjs">Vulkan</a></strong></p>
      <p>Vulkan で描画する回転テクスチャ立方体</p>
      <p><strong>操作</strong> · マウスで立方体を移動、枠のドラッグでサイズ変更、Esc またはウィンドウを閉じて終了</p>
      <p><code>node vulkan/Vulkan.cjs</code></p>
      <p>Linux x64（X11）、Windows x64、Node.js 20+ · <code>npm ci --prefix vulkan --ignore-scripts</code></p>
      <p>Vulkan は x64 の Linux／X11 と Windows 向けで、<code>nvk</code> 0.8.0、Vulkan ローダー、4 倍の異方性フィルタリングに対応するドライバー・デバイスを使います。SFML はウィンドウ、イベント、サーフェスを担当し、nvk が独自のネイティブブリッジなしで Vulkan を直接呼び出します。SFML Graphics は引き続き OpenGL を使います。SFML の Vulkan 連携はコンパイル時に macOS 非対応となるため、MoltenVK の導入だけでは有効になりません。Linux／X11 と Windows のネイティブ描画と操作はどちらも検証済みです。操作と要件は<a href="#platform">プラットフォーム連携</a>を参照してください。</p>
    </div>
  </article>
  <article class="example-entry" id="cocoa">
    <a href="screenshots/cocoa.png">
      <img src="screenshots/cocoa.png" width="360" alt="Cocoa のネイティブ操作部品と埋め込まれた sfml.js ロゴ">
    </a>
    <div class="example-info">
      <p><strong><a href="cocoa/Cocoa.cjs">Cocoa</a></strong></p>
      <p>macOS のネイティブ操作部品と埋め込み SFML ビュー</p>
      <p><strong>操作</strong> · Update または Enter で文字を更新、Visible で表示切替、ダイヤルで回転、Color で背景色、Up／Down で拡大縮小。閉じる、Cmd+Q、Ctrl+C で終了</p>
      <p><code>node cocoa/Cocoa.cjs</code></p>
      <p>macOS · <code>npm ci --prefix cocoa --ignore-scripts</code></p>
    </div>
  </article>
  <article class="example-entry" id="win32">
    <a href="screenshots/win32.png">
      <img src="screenshots/win32.png" width="360" alt="Win32 ネイティブウィンドウ内の 2 つの SFML アニメーションと Quit ボタン">
    </a>
    <div class="example-info">
      <p><strong><a href="win32/Win32.cjs">Win32</a></strong></p>
      <p>Windows のネイティブウィンドウに 2 つの SFML アニメーションと Quit ボタンを配置</p>
      <p><strong>操作</strong> · Quit、ウィンドウを閉じる、または Ctrl+C で終了</p>
      <p><code>node win32/Win32.cjs</code></p>
      <p>Windows x64、Node.js 20+ · <code>npm ci --prefix win32 --ignore-scripts</code></p>
    </div>
  </article>
  <article class="example-entry" id="x11">
    <a href="screenshots/x11.png">
      <img src="screenshots/x11.png" width="360" alt="X11 親ウィンドウ内の 2 つの SFML 子ウィンドウと回転する立方体">
    </a>
    <div class="example-info">
      <p><strong><a href="X11/X11.cjs">X11</a></strong></p>
      <p>2 つの埋め込み SFML ウィンドウで立方体が異なる速度で回転</p>
      <p><strong>操作</strong> · 任意のキー、ウィンドウを閉じる操作、Ctrl+C で終了</p>
      <p><code>node X11/X11.cjs</code></p>
      <p>X11 を利用できる Linux · ルートの <code>npm ci</code> で <code>x11</code> と <code>@wettstein/nodegl</code> を導入</p>
    </div>
  </article>
</div>

## 出典とライセンス

[SFML のサンプル][upstream]を元にしています。ソースのバージョンと素材の出典は [provenance.json](provenance.json) に記録しています。

- SFML ソース：[zlib ライセンス](SFML-LICENSE.md)。
- 素材と作者：[asset_licenses.md](asset_licenses.md)。
- Noto：[SIL Open Font License 1.1](text/resources/OFL.txt)。
- stb Perlin の移植：[MIT／パブリックドメインのデュアルライセンス](island/stb_perlin.LICENSE)。

[upstream]: https://github.com/SFML/SFML/tree/14cea1d978b3dce05780b9234925ca8be9373260/examples
