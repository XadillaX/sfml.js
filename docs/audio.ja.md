# Audio

[English](audio.md) / [简体中文](audio.zh-CN.md) / **日本語** / [한국어](audio.ko.md)

> 短い効果音には SoundBuffer + Sound、長い音声には Music を使います。独自のデータ供給、録音処理、エフェクトは Node Worker で実行します。

[API ナビゲーション](api.ja.md) · [基本概念](concepts.ja.md) · [サンプル](../examples/README.ja.md)

## インターフェースの選択

| 目的 | インターフェース |
| --- | --- |
| 短い効果音を読み込んで繰り返し再生 | SoundBuffer、Sound |
| ファイル、メモリ、入力ストリームのストリーミング再生 | Music |
| PCM を独自に生成 | SoundStream + Worker モジュール |
| 音量、パン、空間プロパティの調整 | SoundSource、Listener |
| 再生デバイスの選択 | PlaybackDevice |
| バッファへの録音 | SoundBufferRecorder |
| 収録データの独自処理 | SoundRecorder + Worker モジュール |
| 音源出力の処理 | EffectProcessor |
| 音声ファイルの読み書きと形式の拡張 | InputSoundFile、OutputSoundFile、SoundFileFactory |

ファイルと圧縮データには「空のコンストラクター + await open/load」を使います。SoundBuffer と Sound はコピーコンストラクターを提供し、SoundBuffer は PCM からの構築にも対応します。完全なシグネチャは [TypeDoc](https://sfml.js.org/ja/reference/) を参照してください。

## 短い効果音の再生

```js
const sf = require('sfml.js');

async function play() {
  const buffer = new sf.SoundBuffer();
  if (!await buffer.loadFromFile('sound.wav')) {
    throw new Error('Cannot load sound.wav');
  }
  const sound = new sf.Sound(buffer);
  sound.setVolume(25);
  sound.play();
  while (sound.getStatus() === sf.SoundStatus.Playing) {
    await sf.sleep(sf.milliseconds(10));
  }
}
play().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
```

`setLooping()` でループを制御し、`setPlayingOffset()` で再生位置を調整します。複数の Sound は同じ SoundBuffer を共有できます。Sound をコピーしても Worker のエフェクトは共有しません。

## 音楽の再生

以下のコードは async 関数内で実行してください。

```javascript
const music = new sf.Music();
try {
  if (!await music.openFromFile('music.ogg')) {
    throw new Error('Cannot open music.ogg');
  }
  music.play();
  await sf.sleep(sf.seconds(5));
} finally {
  await music.close();
}
```

Music は SoundStream を継承し、再生時間とループ区間を提供します。getter が返した Time を読み取っても、再生位置を直接変更することはできません。変更には setter を呼ぶ必要があります。

## PCM と共有メモリ

`getSamples()` は `sf::SoundBuffer::getSamples()` にマッピングされた Int16Array を返し、空のバッファでは undefined を返します。音声サンプルはチャンネルをインターリーブして配置します。sampleCount は全チャンネルを含むサンプル数で、bigint を使います。サンプルレートとチャンネル数は number、duration と playingOffset は Time を使います。

SoundBuffer の sampleRate と duration は安定した SFML フィールドに直接マッピングされ、サンプル数とチャンネル数はネイティブ側の派生フィールドに保存されます。Cone、TimeSpan、SoundFileReader.Info の数値は、それぞれのネイティブ構造体にマッピングされます。SoundSource と Listener は、安定したネイティブの数値制御領域を使って引数と結果を受け渡します。各制御操作では引き続き SFML の setter/getter を呼び、オーディオエンジンが同期、変換、状態更新を行います。位置、方向、Cone、Time は独立した値を返すため、getter の結果を変更しても音源は変わりません。

PCM と読み取り専用の channelMap ビューの BackingStore は、対応するネイティブメモリの割り当てを維持します。SoundBuffer の再読み込みが成功すると、古いビューは古い割り当てを指し続け、関連する Sound は新しいバッファに切り替わります。読み込みに失敗した場合は現在のリソースを保持します。SoundBufferRecorder は録音ごとに新しいネイティブ recorder を使い、終了時にはその `getBuffer()` を直接マッピングします。以前の録音のビューも引き続き有効です。

`new SoundBuffer(samples, channelCount, sampleRate, channelMap)` は Int16Array から同期的に構築します。配列ビューの長さをサンプル数として使い、SFML がサンプルをコピーします。読み込みに失敗すると SFMLError を投げます。

`target.assign(source)` は source の現在のサンプルとメタデータをネイティブ側でディープコピーし、target を返します。転送先の JS オブジェクトとネイティブハンドルは変わらず、関連する Sound は転送先の新しい割り当てに再バインドされます。以前に取得したサンプルとチャンネルのビューは古い割り当てを維持します。source には録音が返す ReadonlySoundBuffer も使えます。自己代入は直ちに返り、ビューや再生状態を変更しません。このメソッドと `loadFromSamples()` は現在のリソースを同期的に置き換えますが、すでに開始済みの非同期読み込みが成功すると、その結果も後から反映されます。操作順序を固定したい場合は、先に読み込みを await してください。

```js
const source = new sf.SoundBuffer(
  new Int16Array([ 1000, -1000, 500, -500 ]),
  1, 44100, [ sf.SoundChannel.Mono ],
);
const target = new sf.SoundBuffer();
target.assign(source);
```

ReadonlySamples、ChannelMap、ReadonlySoundBuffer の読み取り専用制約は TypeScript の型に適用されます。実行時にサンプルごとの Proxy はありません。JS から無理に書き込んだり、これらの読み取り専用ビューの基盤 buffer を切り離したり転送したりしないでください。独立した書き込み可能なデータが必要な場合は `slice()` を使います。

`loadFromSamples()` は SFML を同期的に呼び、SFML がコピー済みのサンプルを保持します。非同期のメモリ読み込みとファイルの read/write は、操作に関わる基盤メモリの割り当てを保持します。呼び出し側は Promise が完了するまで、入力／出力バッファを変更、切り離し、リサイズしてはいけません。`Music.openFromMemory()` と `InputSoundFile.openFromMemory()` の圧縮データは、リソースを閉じるか開き直すまで変更しないでください。

## 音源のコピー代入

`SoundSource.assign(source)` は、ピッチ、パン、音量、空間化、位置、方向、音響コーン、速度、ドップラー、指向性減衰係数、相対位置モード、距離、ゲイン、減衰の設定を同期的にコピーし、転送先自身を返します。Music と独自の SoundStream はこのメソッドを継承します。転送先の内容、ループ設定、再生位置、再生状態、エフェクトは保持され、コピー元には影響しません。コピーは 1 回のネイティブ呼び出しで完了し、SFML の setter がエンジンを更新します。制御領域の fast buffer は元のマッピングを維持します。

`Sound.assign(sourceSound)` は Sound を受け取り、上記のプロパティ、ループ設定、SoundBuffer のバインドを同期的にコピーします。2 つの Sound は同じバッファを参照し、代入は JS 参照、ネイティブ側の寿命維持、関連付けリストを更新します。転送先は停止して再生位置がゼロに戻り、コピー元の再生は変わりません。転送先は自身の EffectProcessor を保持します。既存のエフェクトキューは世代番号の更新によって無効化され、その後、古いブロックが破棄されます。転送先のネイティブ sf::Sound インスタンスと制御領域は変わりません。

どちらの assign も、自己代入では直ちに返ります。Sound に対して基底クラスのプロパティだけをコピーしたい場合は、`SoundSource.prototype.assign.call(targetSound, source)` を明示的に呼べます。変数の型を SoundSource としても、JS の動的なメソッドディスパッチは変わりません。

SFML 3.1.0 の `SoundSource::operator=` は directionalAttenuationFactor をコピーしませんが、このバインディングのプロパティコピーにはこのフィールドも含まれます。

```js
music.assign(sound); // 音源プロパティをコピーし、music の内容と再生状態は保持する。
targetSound.assign(sourceSound); // 同じバッファにバインドし、targetSound を停止して再生位置をゼロに戻す。
```

## Worker によるデータ供給

すべての Audio Worker はモジュールのファクトリーを使い、CommonJS と ESM に対応します。`module` はファイルパスまたは URL、`exportName` の既定値は `default` です。`data` は Worker の structured clone 規則に従って渡されます。ファクトリーは `{ sampleRate, channelCount, blockFrames }` と data を受け取り、対応するコールバックオブジェクトを返します。Promise を返すこともできます。

リポジトリの [audio-worker.cjs](../examples/audio-worker.cjs) には、実行可能な `tone` と `filter` のファクトリーがあります。

```js
const path = require('node:path');
const sf = require('sfml.js');

async function playStream() {
  const stream = new sf.SoundStream({
    module: path.resolve('examples/audio-worker.cjs'),
    exportName: 'tone',
    data: { frequency: 330 },
    sampleRate: 44100,
    channelCount: 1,
    channelMap: [ sf.SoundChannel.Mono ],
    blockFrames: 1024,
    queueBlocks: 8,
  });
  try {
    if (!await stream.ready) return;
    stream.play();
    await sf.sleep(sf.seconds(2));
  } finally {
    await stream.close();
  }
}
playStream().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
```

| コールバック | 契約 |
|------|------|
| `onGetData(chunk)` | ネイティブ側が提供する `chunk.samples` に書き込み、`chunk.sampleCount` を設定する。true は継続、false は最後のブロックを意味する |
| `onSeek(time)` | 生成側のカーソルを Time に移動する。初期化時にも 1 回呼ばれる |
| `onLoop()` | 最後のブロックの準備段階で呼ばれる。インターリーブされたサンプルのオフセットを bigint で返し、undefined は今回のループを禁止する。省略時は既定で `0n` を返す |
| `onClose()` | Worker の終了前にリソースをクリーンアップする |

`chunk.samples` を置き換えることはできません。sampleCount はスロットの容量を超えてはならず、チャンネル数の整数倍である必要があります。データ供給を続ける場合は、ゼロサンプルを送信できません。最後のブロックには有効なサンプルを含められます。seek 時にネイティブ側が世代番号を更新し、デバイススレッドが以前にキューへ入れたデータを破棄します。その後 Worker が新しい onSeek を実行します。

コールバックが受け取る TypedArray は、再利用可能なネイティブスロットです。そのコールバックが完了するまでの間だけ、そのコールバックが専有します。保持して後からアクセスしないでください。内容を残す必要がある場合は自身で `slice()` します。Promise が完了して初めてスロットが送信または解放されます。コールバックは必ず最終的に完了する必要があります。完了しないユーザー Promise は、正常な `close()` や録音キューの排出を妨げます。

## エフェクト

以下のコードは、作成済みの Sound に続けて async 関数内で実行します。`path` は `node:path` を指し、Worker モジュールのパスはリポジトリのルートを基準とします。

```js
const effect = new sf.EffectProcessor({
  module: path.resolve('examples/audio-worker.cjs'),
  exportName: 'filter',
  blockFrames: 1024,
  queueBlocks: 8,
  maxChannelCount: 8,
});
await effect.ready;
sound.setEffectProcessor(effect);
// 使用後は、先に音源から取り外してから Worker を終了する。
sound.setEffectProcessor();
await effect.close();
```

エフェクトのファクトリーは `process(input, inputFrameCount, output, outputFrameCount, channelCount)` を返します。input と output はネイティブの float32 キューへのマッピングです。入力はすでに空間化されており、channelCount は今回のデバイス出力のチャンネル数です。`{ inputFrameCount, outputFrameCount }` を返して実際に消費・生成したフレーム数を指定でき、部分的な消費も可能です。void を返すと、入力をすべて消費し、同じフレーム数を出力したものとみなします。残響処理以外の呼び出しでは、少なくとも 1 フレームを消費または生成する必要があります。

input が null の場合は残響処理を表します。残響を出力でき、最後に出力フレーム数としてゼロを返すと終了します。各フレームは channelCount 個のインターリーブされた float32 サンプルを持ち、今回渡された有効なビューの範囲だけにアクセスできます。`maxChannelCount` は事前割り当ての容量で、既定値は 8 です。実際のチャンネル数が容量を超えると無音を出力します。ファクトリーの context 内の channelCount は容量を表し、実際の処理では process の引数を基準とします。sampleRate は Worker の作成時に読み取るため、デバイスの切り替え後には、サンプルレートに依存するエフェクトを作り直す必要があります。

1 つの EffectProcessor を同時に取り付けられる音源は 1 つだけです。取り外した後は別の音源に取り付けられます。取り付けと取り外しは、音源の再生位置と再生／一時停止状態を保持します。取り付けたままの EffectProcessor を明示的に閉じると、その音源のエフェクト経路は無音を出力します。

## 録音

以下のコードは async 関数内で実行し、`sf` はパッケージのインポートを指します。先に入力デバイスが利用できることを確認し、OS のマイク権限を許可してください。

```js
const recorder = new sf.SoundBufferRecorder();
recorder.setChannelCount(1);
try {
  if (!await recorder.start(44100)) throw new Error('Cannot start recording');
  await sf.sleep(sf.seconds(1));
} finally {
  await recorder.stop();
}
const recorded = recorder.getBuffer();
console.log(recorded.getSampleCount());
if (!await recorded.saveToFile('recorded.wav')) throw new Error('Cannot save recording');
```

`start()`、`stop()`、`setDevice()` は Promise を返します。チャンネル数は 1 または 2 に対応します。変更する前に録音を停止し、処理中の操作を待ってください。再生デバイスと入力デバイスは別々に照会・選択します。

独自の SoundRecorder は SoundStream と同じ Worker 設定を使います。ファクトリーは任意の `onStart()`、必須の `onProcessSamples(samples)`、任意の `onStop()` を返します。onStart が false を返すと開始を取り消します。onProcessSamples はコールバック中だけ有効なネイティブの Int16Array を受け取ります。false を返すと非同期タスクが収録を停止します。通常の `await stop()` はキューの排出と onStop の完了を待ちますが、コールバックが自ら false を返した場合は、キュー内の残りのサンプルを破棄します。

## ファイルストリームとコーデックの拡張

SoundBuffer、Music、InputSoundFile は、既存の InputStream、MemoryInputStream、FileInputStream に対応しています。ファイルの読み書き、開く操作、閉じる操作はオブジェクト単位で直列に実行し、異なるオブジェクト間では並列に実行できます。開く操作が成功してからネイティブのメタデータを公開します。非同期の read/seek が完了するまで、getter は前回公開された結果を返します。

SFML 内蔵のファイル／メモリのデコードはスレッド内で実行します。非同期 InputStream は、独立したネイティブのデコードスレッドと libuv 通知のブリッジを使い、JS のファイル I/O を待つことで libuv のワーカースレッドプールを占有し尽くすのを防ぎます。InputStream の read の書き込み先バッファはネイティブ側で割り当て、完了時に有効なバイト列のスナップショットを取得します。

Music の通常のファイル／メモリ入力は `sf::Music` を使います。InputStream または登録済みの JS Reader からの入力は、容量を制限した PCM プリフェッチを使い、既定は 1024 フレーム、8 スロットです。非同期デコードはデバイスコールバックの外で実行し、再生、シーク、ループはネイティブの SoundStream を通じてデータを消費します。JS のカスタム Reader は呼び出し元の環境で動作するため、時間のかかる同期的な JS デコードは、その環境のイベントループを占有します。

SFML 内蔵の Reader／Writer は、SoundFileFactory で作成した後も `open()` を呼ぶ必要があります。WAV、FLAC、Ogg の書き込みと読み戻しにはランタイムテストがあります。その他の SFML 内蔵入力形式は、現在の SFML ビルドが提供するデコード対応を引き継ぎます。

拡張 Reader は SoundFileReader を継承し、静的な `check(stream)`、`open(stream)`、`seek(sampleOffset)`、`read(samples)`、任意の `close()` を提供します。open は `new SoundFileReader.Info({ sampleCount, sampleRate, channelCount, channelMap })` または undefined を返します。read は渡された Int16Array に書き込み、実際のサンプル数を bigint で返します。拡張 Writer は SoundFileWriter を継承し、静的な `check(filename)`、`open(filename, sampleRate, channelCount, channelMap)`、`write(samples)`、任意の `close()` を提供します。これらのメソッドは Promise を返せます。

`SoundFileFactory.registerReader(ReaderClass)` と `registerWriter(WriterClass)` で登録し、対応する unregister メソッドで解除します。同じクラスを繰り返し登録しても重複して追加されません。JS のレジストリーは現在の Node 環境に属するため、Worker は自身の環境で登録する必要があります。すべての公開 SoundBuffer、Music、音声ファイルの入口は、登録済みの JS クラスを先に調べ、一致しなければ SFML 内蔵のファクトリーにフォールバックします。テンプレートによる登録インターフェースは JS クラスで実現し、プロセス全体の C++ ファクトリーへ JS の関数ポインターを組み込むことはありません。完全な拡張例は [audio-codec.test.cjs](../test/audio-codec.test.cjs) を参照してください。

## バッファ、状態、クリーンアップ

Worker の既定値は `blockFrames = 1024`、`queueBlocks = 8` です。64～65536 フレーム、2～32 スロット、1～32 チャンネルを指定できます。スロットのメモリはネイティブ側で事前に割り当て、acquire/release によって公開と返却を行います。PCM を postMessage でコピーすることはありません。postMessage は ready、エラー、停止の通知だけを伝えます。

44100 Hz の 1024 フレームは 23.22 ms で、8 スロットには約 185.76 ms のサンプルを格納できます。これはブロックの長さとキューの容量であり、エンドツーエンドの遅延を保証する値ではありません。Worker は 2 ms ごとに利用可能なスロットを非同期で確認します。デバイスの出力は SFML とシステムのバッファにも影響されます。

| 状況 | 挙動と統計の単位 |
|------|----------------|
| Stream に準備済みの PCM がない | 無音を出力。underruns はブロック不足の回数を集計 |
| 録音キューが満杯 | 新しいサンプルを破棄。overruns はインターリーブされたサンプル数を集計 |
| エフェクトの入力キューが満杯 | 今回受信した入力フレームを破棄。overruns はフレーム数を集計 |
| エフェクトの出力が不足 | 不足部分を無音で補う。underruns はフレーム数を集計 |
| processed | Stream／Recorder はインターリーブされたサンプル数、EffectProcessor は消費した入力フレーム数 |

`getWorkerStats()` は bigint の統計スナップショットを、`getWorkerError()` は記録済みの非同期エラーを返します。Worker の初期化エラーは ready を reject させ、close／stop も Worker のエラーを報告します。C++ の例外は SFMLError にマッピングされ、SFML の診断は既存の `err()`／`setErrorOutput()` 経路に出力されます。

Audio Worker は初期化が完了すると unref され、それだけでは Node プロセスを存続させません。再生中はウィンドウループや `await sleep()` でイベントループを維持してください。終了時には `await stream.close()`、`await music.close()`、`await effect.close()`、`await recorder.stop()` を使います。ファイル書き込みは `await output.close()` で末尾処理とリソースのクリーンアップを完了します。ネイティブの音源と録音リソースは、プロジェクトのバックグラウンド解放機構を引き継ぎます。ビューは対応する割り当てを維持し、Node 環境の終了時には、その環境に属するリソースが終了します。

再生デバイスの通知は、コールバックを登録した JS スレッドへ非同期で配送され、オーディオデバイスのスレッドでは実行されません。SFML の通知コールバックはプロセス単位の単一スロットであり、最後の登録が以前の登録を置き換えます。`setNotificationCallback()` を呼ぶと登録を解除し、未配送の通知を破棄します。

## デモと検証

`npm run demo:audio`、またはビルド後に `node examples/audio.cjs` を実行します。1～4 で Sound、WorkerStream、Music、録音再生を切り替えます。Space は再生／一時停止、S は停止、E はエフェクトの切り替え、R は録音開始、T は録音終了です。矢印キーでパンと音量を操作し、Esc で閉じます。録音はメモリ内だけに保持します。

`node examples/audio.cjs --smoke --frames=90` は、スピーカー再生、Worker PCM、エフェクト処理、Music、マイク録音と再生を自動的に検証してから終了します。このモードはローカルの入力デバイスを有効にします。通常起動ではユーザーのキー入力を待ちます。

自動テストは、SFML フィールドとの比較、PCM ビュー、リソースのライフサイクル、WAV／FLAC／Ogg、非同期入力ストリーム、Worker のデータ供給とシーク、エフェクト、録音キュー、独自のコーデックを対象としています。テストコードは [test/audio.test.cjs](../test/audio.test.cjs)、[Worker テスト](../test/audio-worker.test.cjs)、[コーデックテスト](../test/audio-codec.test.cjs)を参照してください。

実際の音声出力、マイク収録、デバイスのホットプラグは対象デバイスで検証する必要があります。CI のビルドとテスト設定は[開発ガイド](development.ja.md#testing)を参照してください。

<a id="sfml-cpp-reference"></a>
## SFML C++ リファレンス

上流の [SoundBuffer](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1SoundBuffer.html)、[Sound](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Sound.html)、[Music](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Music.html)、[SoundStream](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1SoundStream.html)、[SoundRecorder](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1SoundRecorder.html)、[SoundFileFactory](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1SoundFileFactory.html) で、再生、空間オーディオ、音声ファイルの概念を確認できます。JS の非同期リソースメソッド、Worker コールバック、共有バッファの寿命は C++ と異なるため、このガイドの契約を優先してください。
