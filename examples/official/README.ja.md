# SFML 公式サンプル

[English](README.md) · [简体中文](README.zh-CN.md) · **日本語** · [한국어](README.ko.md)

[SFML/SFML][upstream] の 22 サンプルを JavaScript に移植しています。参照コミットは
`14cea1d978b3dce05780b9234925ca8be9373260` です。sfml.js 向けの変更版であり、元のディレクトリ名、シーン、操作方法、素材を保持しています。

[全サンプル](../README.ja.md) · [ビルド要件](../../docs/getting-started.ja.md#requirements)

sfml.js をビルドした後、リポジトリのルートから公式サンプルのディレクトリに移動して実行します。

```sh
cd examples/official
node tennis/Tennis.cjs
```

素材は各スクリプトからの相対パスで読み込みます。対話型サンプルは閉じるまで実行され、他のサンプルの `--frames` 引数には対応していません。描画にはディスプレイと OpenGL、録音にはマイクと OS の録音許可が必要です。

一覧：[グラフィックス](#graphics) · [プラットフォーム連携](#platform) · [入力とイベント](#input) · [オーディオ](#audio) · [ネットワーク](#network)

X11 の画像は Linux CI の Xvfb／Mesa、それ以外は macOS のネイティブ SFML ウィンドウで撮影しています。画像から原寸表示、サンプル名からソースコードを開けます。

<a id="graphics"></a>

## グラフィックス

<table>
  <thead>
    <tr>
      <th width="44%">実行画面</th>
      <th>サンプルと操作</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/island.png">
          <img src="screenshots/island.png" width="360"
               alt="生成した島と地形パラメーター">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="island/Island.cjs">Island</a></strong></p>
        <p>地形と照明</p>
        <p><strong>操作</strong> · 矢印でパラメーターを編集、Enter で再生成</p>
        <p><code>node island/Island.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/shader.png">
          <img src="screenshots/shader.png" width="360"
               alt="sfml.js ロゴに適用したエッジ検出シェーダー">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="shader/Shader.cjs">Shader</a></strong></p>
        <p>5 種類のシェーダー</p>
        <p><strong>操作</strong> · 左右で選択、マウスで調整</p>
        <p><code>node shader/Shader.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/tennis.png">
          <img src="screenshots/tennis.png" width="360"
               alt="sfml.js ロゴを表示する Tennis の開始画面">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="tennis/Tennis.cjs">Tennis</a></strong></p>
        <p>Pong</p>
        <p><strong>操作</strong> · Space で開始、上下で移動、Esc で終了。タッチ操作にも対応</p>
        <p><code>node tennis/Tennis.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/stencil.png">
          <img src="screenshots/stencil.png" width="360"
               alt="ステンシルマスクで重なる赤緑青の図形">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="stencil/Stencil.cjs">Stencil</a></strong></p>
        <p>ステンシルマスクと図形のアニメーション</p>
        <p><code>node stencil/Stencil.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/text.png">
          <img src="screenshots/text.png" width="360"
               alt="40 個の多言語テキストサンプル">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="text/Text.cjs">Text</a></strong></p>
        <p>多言語の 40 サンプル</p>
        <p><strong>操作</strong> · クリックで選択、F1／F2／F3 で境界とカーソル、F4 で前処理を切り替え、左右でカーソル移動</p>
        <p><code>node text/Text.cjs</code></p>
      </td>
    </tr>
  </tbody>
</table>

<a id="platform"></a>

## プラットフォーム連携

Cocoa は macOS 専用で、[objc-js](https://github.com/iamEvanYT/objc-js) を使用します。`examples/official` からローカル依存をインストールします。Apple Silicon／Intel の同梱ビルドを使用します。

```sh
npm ci --prefix cocoa --ignore-scripts
node cocoa/Cocoa.cjs
```

X11 には Linux、X11 ディスプレイサーバー（または XWayland）、デスクトップ OpenGL が必要です。ルートの `npm ci` で開発依存の `x11` と `koffi` を導入します。サンプル専用モジュールの追加コンパイルは不要です。

Window と OpenGL は SFML ウィンドウと外部パッケージ `koffi` でシステムのデスクトップ OpenGL を呼び出します。macOS、Linux、Windows の互換コンテキストに対応し、macOS と Linux は検証済み、Windows は未検証です。

<table>
  <thead>
    <tr>
      <th width="44%">実行画面</th>
      <th>サンプルと操作</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/window.png">
          <img src="screenshots/window.png" width="360"
               alt="黒い背景で回転する 6 色の立方体">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="window/Window.cjs">Window</a></strong></p>
        <p>640 × 480 OpenGL ウィンドウ、24 ビット深度バッファと 6 色の立方体</p>
        <p><strong>操作</strong> · 枠のドラッグでサイズ変更、Esc またはウィンドウを閉じて終了</p>
        <p><code>node window/Window.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/opengl.png">
          <img src="screenshots/opengl.png" width="360"
               alt="SFML の背景と文字の間に描画した OpenGL テクスチャ立方体">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="opengl/OpenGL.cjs">OpenGL</a></strong></p>
        <p>800 × 600 SFML／OpenGL 混在描画、テクスチャ立方体と sRGB</p>
        <p><strong>操作</strong> · マウスで立方体を移動、Enter で mipmap 切替、Space でウィンドウを再作成して sRGB 切替、Esc で終了</p>
        <p><code>node opengl/OpenGL.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/cocoa.png">
          <img src="screenshots/cocoa.png" width="360"
               alt="Cocoa のネイティブ操作部品と埋め込まれた sfml.js ロゴ">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="cocoa/Cocoa.cjs">Cocoa</a></strong></p>
        <p>485 × 379 のネイティブウィンドウに 440 × 260 の SFML ビューを埋め込み</p>
        <p><strong>操作</strong> · Update または Enter で文字を更新、Visible で表示切替、ダイヤルで回転、Color で背景色、Up／Down で拡大縮小。閉じる、Cmd+Q、Ctrl+C で終了</p>
        <p><code>node cocoa/Cocoa.cjs</code>（macOS）</p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/x11.png">
          <img src="screenshots/x11.png" width="360"
               alt="X11 親ウィンドウ内の 2 つの SFML 子ウィンドウと回転する立方体">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="X11/X11.cjs">X11</a></strong></p>
        <p>650 × 330 の親に 310 × 310 のビューを 2 つ埋め込み、右の立方体は左の 30% の速度で回転</p>
        <p><strong>操作</strong> · 任意のキー、ウィンドウを閉じる操作、Ctrl+C で終了</p>
        <p><code>node X11/X11.cjs</code></p>
      </td>
    </tr>
  </tbody>
</table>

<a id="input"></a>

## 入力とイベント

入力の画像はスクリプトイベントを使用しています。ジョイスティックは未接続です。

<table>
  <thead>
    <tr>
      <th width="44%">実行画面</th>
      <th>サンプルと操作</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/keyboard.png">
          <img src="screenshots/keyboard.png" width="360"
               alt="キー配列、A キーの押下と文字入力">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="keyboard/Keyboard.cjs">Keyboard</a></strong></p>
        <p>物理キー配列、キーイベント、文字入力と効果音</p>
        <p><code>node keyboard/Keyboard.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/event_handling.png">
          <img src="screenshots/event_handling.png" width="360"
               alt="Visitor でのキーとマウスのイベントログ">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="event_handling/EventHandling.cjs">Event handling</a></strong></p>
        <p>5 種類のイベント処理</p>
        <p><strong>操作</strong> · Enter で切り替え</p>
        <p><code>node event_handling/EventHandling.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/raw_input.png">
          <img src="screenshots/raw_input.png" width="360"
               alt="マウスの生の移動量とカーソル位置">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="raw_input/RawInput.cjs">Raw input</a></strong></p>
        <p>マウスの Raw Input</p>
        <p><code>node raw_input/RawInput.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/joystick.png">
          <img src="screenshots/joystick.png" width="360"
               alt="機器が接続されていないジョイスティック画面">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="joystick/Joystick.cjs">Joystick</a></strong></p>
        <p>軸とボタン</p>
        <p><strong>操作</strong> · 0～7 で機器を選択、Tab で汎用／ゲームパッド表示を切り替え</p>
        <p><code>node joystick/Joystick.cjs</code></p>
      </td>
    </tr>
  </tbody>
</table>

<a id="audio"></a>

## オーディオ

音声効果の画像は null 再生デバイスで撮影しています。

<table>
  <thead>
    <tr>
      <th width="44%">実行画面</th>
      <th>サンプルと操作</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/sound_effects.png">
          <img src="screenshots/sound_effects.png" width="360"
               alt="リスナー、音源と距離減衰の円">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="sound_effects/SoundEffects.cjs">Sound effects</a></strong></p>
        <p>9 種類の効果</p>
        <p><strong>操作</strong> · 左右で選択、マウスで調整、上下で減衰／波形選択、Space で DSP バイパス、F1 で出力変更</p>
        <p><code>node sound_effects/SoundEffects.cjs</code></p>
      </td>
    </tr>
  </tbody>
</table>

| サンプルと操作 | 実行 |
| --- | --- |
| **[Sound](sound/Sound.cjs)**<br>WAV 効果音と OGG、FLAC、MP3 音楽の再生 | `node sound/Sound.cjs` |
| **[Sound capture](sound_capture/SoundCapture.cjs)**<br>機器とサンプルレートを選び、録音して再生または保存 | `node sound_capture/SoundCapture.cjs` |
| **[Sound device](sound_device/SoundDevice.cjs)**<br>機器通知、自動ルーティング、切断後の復旧。Ctrl+C で終了 | `node sound_device/SoundDevice.cjs` |

<a id="network"></a>

## ネットワーク

| サンプルと操作 | 実行 |
| --- | --- |
| **[HTTP](http/Http.cjs)**<br>リダイレクト対応の対話型 HTTP GET | `node http/Http.cjs` |
| **[FTP](ftp/Ftp.cjs)**<br>対話型 FTP クライアント、ポート 21 | `node ftp/Ftp.cjs` |
| **[SFTP](sftp/Sftp.cjs)**<br>対話型 SFTP。ホスト指紋を確認してから認証 | `node sftp/Sftp.cjs` |
| **[Sockets](sockets/Sockets.cjs)**<br>TCP、TLS、UDP のメッセージ交換、ポート 50001 | `node sockets/Sockets.cjs` |
| **[VoIP](voip/VoIP.cjs)**<br>TCP による音声録音、再生、リプレイ、ポート 2435 | `node voip/VoIP.cjs` |

sockets と VoIP は 2 つのターミナルで実行し、サーバーとクライアントをそれぞれ選択します。ローカル接続には `127.0.0.1` を指定してください。

FTP／SFTP のダウンロードや録音の保存先には、一時ディレクトリまたは任意の出力パスを入力してください。

## Node 向けの調整


- 描画は `setImmediate` でイベントループに制御を返します。素材と通信には公開非同期 API、音声コールバックには音声 Worker を使います。
- island は 4 Worker を再利用し、元の 32 ブロックと 800 × 600 メッシュを保持します。Perlin は元の表を使い、境界では符号付き座標でアンダーフローを回避します。
- テキストのクラスタ位置は JavaScript の UTF-16 インデックスです。Noto のサブセットは変更せずにコピーしています。[フォントの説明](text/resources/readme.md)を参照してください。
- バインディングが公開する距離減衰は逆距離のみです。Surround は元の 4 式を JavaScript で計算し、ネイティブの空間パンを保持します。生成音の周波数がゼロの場合は無音です。
- TLS は元の公開デモ鍵を使い、DNS／IP SAN 付きの `localhost` 証明書に置き換えています。証明書検証は有効です。別ホスト間でも、この鍵と証明書はデモ専用です。
- X11 のウィンドウは外部パッケージ `x11`、借用ウィンドウの OpenGL コンテキストは `sf.Window(BigInt(xid))` で管理し、`koffi` から `libGL.so.1` を呼び出します。頂点は Koffi の安定したメモリに配置し、SFML コンテキスト、頂点、親ウィンドウ、X11 接続の順で解放します。

- Window は `koffi` でシステム OpenGL のエクスポート関数を呼び出します。元の 6 色の頂点、毎秒 50／30／90 度の 3 軸回転、サイズに追従する透視投影を保持します。頂点用の安定したネイティブメモリはウィンドウを閉じてから解放し、サイズがゼロの間は描画を休止します。

- OpenGL は `koffi` で元の位置／UV 頂点を描画し、SFML の背景と文字はそれぞれ GL 状態を保存・復元します。Enter はテクスチャの再読み込みまたは mipmap 生成、Space は新しい sRGB 設定でウィンドウと背景を再作成します。mipmap と sRGB の対応はドライバーによります。
  立方体には現在の [sfml.js シンボル](../../assets/branding/sfml-js-symbol-pentagon.svg) を 256 × 256 PNG に変換し、元の濃い灰色の背景と合成したテクスチャを使用します。

- Cocoa は [objc-js](https://github.com/iamEvanYT/objc-js) で元の XIB 配置を JavaScript から構築します。`sf.RenderWindow(BigInt(NSView*))` がビューを借用し、`NSTimer` が通常／イベント追跡モードで 60 Hz 描画、Node が AppKit 入力を処理します。メニューは終了と標準テキスト編集に絞り、XIB コンパイルやアプリバンドルは不要です。タイマー停止、SFML 終了、Cocoa 終了、ラッパー解放の順で片付けます。objc-js 1.6.0 のクラスコールバックが Node を保持するため、処理後に明示的に終了します。

残りの 3 サンプル（`android`、`vulkan`、`win32`）は未移植です。

検証にはネイティブ描画、地形生成、文字／キー操作、音声デコード、Worker DSP、ローカル通信を含みます。実マイク、スピーカー、ジョイスティック、機器の抜き差し、外部 FTP／SFTP は対象環境での確認が必要です。

移植時に X11、Window、OpenGL を Ubuntu 24.04、Node.js 22、Xvfb、Mesa で検証しました。実 GPU と XWayland は対象外です。Cocoa は macOS 上でネイティブ操作、通常／イベント追跡モードの描画、終了処理を検証し、Up／Down はスクリプトで制御しました。Window の掲載画像は固定時刻で macOS 上で撮影しています。

## 出典とライセンス

[provenance.json](provenance.json) にコミット、ソース／XIB のハッシュ、未変更の 57 素材の SHA-256、および Cocoa、Shader、Tennis、OpenGL の 6 点の sfml.js ロゴ素材の出典と変換方法を記録しています。プロジェクトで採用したブランド素材を使い、元のテクスチャ寸法と透明度を保持しています。

- SFML ソース：[zlib ライセンス](SFML-LICENSE.md)。
- 素材と作者：[asset_licenses.md](asset_licenses.md)。
- Noto：[SIL Open Font License 1.1](text/resources/OFL.txt)。各フォントの著作権メタデータを保持しています。
- stb Perlin の移植：[MIT／パブリックドメインのデュアルライセンス](island/stb_perlin.LICENSE)。

[upstream]: https://github.com/SFML/SFML/tree/14cea1d978b3dce05780b9234925ca8be9373260/examples
