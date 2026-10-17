# Network

[English](network.md) / [简体中文](network.zh-CN.md) / **日本語** / [한국어](network.ko.md)

> Packet でメッセージを定義し、TCP／UDP で転送するか、HTTP、FTP、SFTP でプロトコル操作を行います。ネットワーク I/O は Promise を返すため、呼び出し側は操作のステータスも確認してください。

[API ナビゲーション](api.ja.md) · [基本概念](concepts.ja.md) · [ループバックのサンプル](../examples/network.cjs)

本番の Network は Node.js のトランスポートで SFML スタイルのインターフェースを実装します。FTP には basic-ftp、SFTP には ssh2、IPv6 の解析には ipaddr.js を使います。SFML C++ のネットワークモジュールは呼び出しません。Packet の形式と一部の値のセマンティクスは、独立した C++ プログラムと比較して検証しています。

## インターフェースと呼び出し方

| インターフェース | 実装と適応 |
|------|------------|
| IpAddress | IPv4 の整数／4 バイトからの構築、IPv6 の 16 バイトからの構築、コピー、fromString、toString、toInteger、toBytes、getType、isV4/isV6。静的な resolve、getLocalAddress、getPublicAddress は Promise を返す |
| Dns | resolve、queryNs、queryMx、querySrv、queryTxt、getPublicAddress。独立した Resolver とサーバー指定に対応 |
| Socket | setBlocking、isBlocking、AnyPort、Status。getLastError は直近の下位層のエラーを返す |
| TcpSocket | connect、disconnect、send、receive、ポート／リモートアドレスの照会。setupTlsClient、setupTlsServer、getCurrentCiphersuiteName |
| TcpListener | listen、close、accept、getLocalPort |
| UdpSocket | bind、unbind、send、receive、getLocalPort、MaxDatagramSize |
| SocketSelector | add、remove、clear、wait、isReady、dispatchReadyCallbacks、コピーコンストラクター、assign。Receive／Send のビットフラグ |
| Packet | append、clear、getData、getDataSize、getReadPosition、endOfPacket、isValid、コピーコンストラクター。型を明示する write/read。onSend/onReceive をオーバーライド可能 |
| Http | setHost、sendRequest、Request、Response。HTTP リクエストのバージョンを明示的に指定 |
| Ftp | connect、disconnect、login、keepAlive、作業ディレクトリ、ディレクトリ一覧、ディレクトリの移動／作成／削除、ファイルの名前変更／削除、アップロード／追記／ダウンロード、sendCommand |
| Sftp | connect と login の分離、パスワード／鍵認証、getSessionInfo、パス解決、ディレクトリと属性、名前変更／削除、ストリーミングでのアップロードとダウンロード、TimeoutWithPredicate |

I/O や待機を伴うメソッドは Promise を返し、純粋な状態照会や設定は同期的なままです。TcpSocket の `disconnect()`、listener.close、udp.unbind は、ローカルのトランスポートを同期的に終了します。FTP／SFTP の disconnect は Promise を返し、未完了の操作を中断する同期的な close も提供します。

C++ の出力参照は、戻り値のオブジェクトで表現します。

| 操作 | 戻り値 |
|------|--------|
| TCP send(Uint8Array) | `{ status, sent }` |
| TCP receive(Uint8Array) | `{ status, received }` |
| TCP send/receive(Packet) | `SocketStatus` |
| UDP send(Uint8Array または Packet, address, port) | `SocketStatus` |
| UDP receive(Uint8Array または Packet) | `{ status, received, remoteAddress?, remotePort }` |

SocketHandle は Node の transport オブジェクトの型エイリアスで、protected の getNativeHandle だけに使います。プラットフォーム間で受け渡せる OS の fd／SOCKET の数値ではありません。

## TCP、UDP、Selector

```js
const sf = require('sfml.js');

function check(status) {
  if (status !== sf.SocketStatus.Done) {
    throw new Error(`Socket operation failed: ${status}`);
  }
}

async function exchange() {
  const listener = new sf.TcpListener();
  const client = new sf.TcpSocket();
  const peer = new sf.TcpSocket();
  try {
    check(await listener.listen(0, sf.IpAddress.LocalHost));
    const accepting = listener.accept(peer);
    check(await client.connect(sf.IpAddress.LocalHost,
      listener.getLocalPort(), sf.seconds(1)));
    check(await accepting);

    const received = new sf.Packet();
    const waiting = peer.receive(received);
    check(await client.send(
      new sf.Packet().write('string', '你好').write('u64', 42n)));
    check(await waiting);
    console.log(received.read('string'), received.read('u64'));
  } finally {
    listener.close();
    client.disconnect();
    peer.disconnect();
  }
}
exchange().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
```

`setBlocking(true)` は、必要なデータや書き込み完了を Promise が待つことを意味し、イベントループをブロックしません。`setBlocking(false)` は、現在のラッパー層の状態に基づいて返すことを意味します。TCP connect は接続を開始して NotReady を返し、Selector.Send で接続準備の完了を待てます。TLS の初期化が HandshakeStarted を返した後は、同じ setup メソッドを繰り返し呼んでハンドシェイクの状態を取得できます。UDP の bind/send と TCP の listen は、実際のポートと操作結果を提供するため、引き続き Node の完了通知を待ちます。

TCP の生バイト送信の sent は、今回ラッパー層が受け入れたバイト数です。ノンブロッキングモードでは、現在の Node writable highWaterMark の残り容量まで送信を受け付け、一部だけを受け入れた場合は Partial、空きがない場合は NotReady を返します。送信を続ける際は未送信の後半部分を渡してください。Node write が false を返すのはバックプレッシャーを示すだけで、今回すでにキューに入ったバイトを呼び出し側が再送する必要はありません。Done は、相手側のアプリケーションがデータを消費または永続化したことを意味しません。

TCP Packet はビッグエンディアンの uint32 の長さ接頭辞を使います。Partial の後は同じ Packet を再度渡してください。ラッパー層は最初の送信のスナップショットとオフセットを保持します。その送信が完了するまでは、パケット内容の混在を防ぐため、他の送信は NotReady を返します。受信は、ヘッダーと本体が任意の位置で分割された場合に対応します。ノンブロッキングの NotReady は受信済みの部分を保持します。受信中の Packet が完了する前に、生バイトの受信へ切り替えることはできません。

TCP の受信は Node readable のキューとバックプレッシャーを使い、無制限に増える別のデータコピーは作成しません。UDP はデータグラムの境界を維持します。転送先の配列がデータグラムより小さい場合は、そのデータグラムを破棄して Error を返します。UDP 受信キューの上限は 4096 データグラムまたは 8 MiB で、超えると新しいデータグラムを破棄します。1 データグラムの最大サイズは 65507 バイトです。TCP Packet の受信上限は 64 MiB で、超えると接続を閉じて Error を返します。

Selector はラッパー層の読み取り／書き込み可能状態を監視するものであり、OS の生の select と同一であるとはしていません。1 回の wait が準備完了状態のスナップショットを保存し、isReady がそのスナップショットを照会し、dispatchReadyCallbacks が明示的にコールバックを配送します。wait がタイムアウトすると false を返します。メンバー集合の変更や全メンバーの終了で待機が解除されます。1 つの selector で同時に実行できる wait は 1 つだけで、変更後は再び wait できます。selector のコピーは、メンバー参照と準備完了スナップショットをコピーし、socket 自体はコピーしません。

接続を閉じると、保留中の読み取り、accept、Selector の待機が解除されます。新しい接続には新しい世代番号を使うため、古い操作が新しい接続のデータを読むことはありません。使用後はネットワークオブジェクトを明示的に閉じてください。有効な Node の接続はプロセスを存続させます。

## Packet

以降のコード内の `sf` は、すべて `require('sfml.js')` を指します。書き込みと読み取りでは、同じフィールド順序と型を使う必要があります。

```js
const packet = new sf.Packet()
  .write('bool', true)
  .write('i32', -100)
  .write('u64', 18446744073709551615n)
  .write('f32', 1.5)
  .write('string', '音频🌟')
  .write('bytes', new Uint8Array([ 255, 0, 254 ]));
```

| 型引数 | JS の型 | SFML のバイト形式 |
|----------|---------|---------------|
| bool | boolean | 1 バイト |
| i8/u8、i16/u16、i32/u32 | number | 対応するビット幅の整数。ビッグエンディアン |
| i64/u64 | bigint | 64 ビット整数。ビッグエンディアン |
| f32/f64 | number | IEEE 浮動小数点。実行ホストのバイト順を使い、SFML の memcpy と一致 |
| string | string | sf::String に対応。uint32 の文字数 + UTF-32 のビッグエンディアンのコードポイント |
| utf8 | string | UTF-8 で std::string にエンコード。uint32 のバイト数 + バイト列 |
| bytes | Uint8Array | バイナリの std::string。uint32 のバイト数 + 元のバイト列 |

`read(type)` は対応する型を返します。データが不足すると undefined を返し、clear するまで isValid が false になります。失敗時に不足しているフィールドを飛ばすことはありません。文字列の長さだけが正常に読み取れた場合は、カーソルが文字列本体の先頭で止まります。整数の書き込みはビット幅に応じて変換し、64 ビット値は number を経由しません。エンディアンが異なるプラットフォーム間の浮動小数点 Packet は、元の SFML と同様に、双方で変換方法を取り決める必要があります。

内部では拡張可能な Buffer を使い、整数と浮動小数点の読み取りは同じメモリに直接アクセスします。getData は有効領域のビューを返し、空のパケットでは undefined を返します。このビューは読み取り専用として使ってください。容量拡張や clear の後も、古いビューは古い割り当てを維持します。append は入力をコピーし、送信は入力を受け入れた時点でスナップショットを作成します。呼び出し側がその後に入力を変更しても、送信済みのバイトは変わりません。追加の NAN マッピングや、バイトごとの言語境界を越える呼び出しはありません。

onSend は送信するバイト列を返し、onReceive は完全なメッセージを受け取ります。サブクラスで圧縮や独自のエンコードを実装できます。ネットワーク受信は、onReceive を呼ぶ前に元のパケットを clear します。どちらのフックも同期的に実行されるため、非同期処理は send/receive の外で完了させてください。

## アドレス、DNS、TLS

IpAddress は不変の値です。toBytes は独立した IPv6 バイト列のコピーを返し、toInteger は IPv4 にだけ適用できます。fromString は DNS を使わず、省略形の IPv4、8 進数形式、zone ID 付きの IPv6 は受け付けません。equal、notEqual、less、lessEqual、greater、greaterEqual はアドレスに対応します。並び順は最初に IPv4／IPv6、その後にバイト列で決まります。

Dns.resolve はサーバーを指定しない場合、hosts ファイルを含むシステムの lookup を使います。この経路の完了時間はシステムのリゾルバーが制御します。サーバーを指定した場合は A／AAAA を並列に照会します。queryNs/Mx/Srv/Txt は独立した Resolver を使い、タイムアウト時にはその照会だけを取り消し、他の照会には影響しません。MX の priority は preference に、SRV の name は target にマッピングします。既定のサーバーへの照会が失敗した場合は undefined または空配列を返します。

getLocalAddress は UDP のルート選択を通じてローカルアドレスを取得し、アプリケーションデータを送信しません。パブリックアドレスの照会には外部の DNS／HTTP サービスが必要です。オフラインテストでは実際のパブリックアドレス照会は行いません。Time.Zero はタイムアウトを設定しないことを意味します。

TLS は接続済み TCP のクライアント側とサーバー側のアップグレードに対応します。クライアントは既定でシステム CA と hostname を検証します。証明書の文字列／バイト列を CA として渡すか、明示的に false を渡して検証を無効にできます。サーバーは証明書、秘密鍵、任意のパスフレーズを受け取ります。アップグレード前には plaintext の読み書きキューを空にする必要があります。証明書と暗号スイートは Node/OpenSSL が提供し、SFML の Mbed TLS と同じ集合であることは保証されません。

## HTTP

```javascript
const sf = require('sfml.js');

async function fetchText(host, uri) {
  const http = new sf.Http(host);
  const request = new sf.Http.Request(uri);
  const response = await http.sendRequest(request, sf.seconds(5));
  if (response.getStatus() !== sf.HttpStatus.Ok) {
    throw new Error(`HTTP status: ${response.getStatus()}`);
  }
  return response.getBody();
}
```

Request は setField、setMethod、setUri、setHttpVersion、setBody に対応します。Response はステータス、HTTP バージョン、フィールド、本文の照会に対応します。getBody は UTF-8 としてデコードし、getBodyBytes は独立した生バイト列を取得します。setBody は Uint8Array を直接受け取れます。

SFML の HTTP/1.0／1.1 リクエスト行の明示的指定に対応するため、Node の TCP／TLS でリクエストを送信し、レスポンスを逐次解析します。解析は Content-Length、chunked、trailer、中間の 1xx、HEAD／本文のないステータス、接続終了による区切りに対応します。リクエスト本文には Content-Length を使い、矛盾する長さ指定と Transfer-Encoding を禁止します。リダイレクトの自動追跡、本文の展開、HTTP/2 へのアップグレードは行いません。

sendRequest の Time はリクエスト全体を制限し、第 4 引数に AbortSignal を渡してキャンセルできます。不正または途中で途切れたレスポンスは InvalidResponse に、接続／TLS の失敗とキャンセルは ConnectionFailed にマッピングします。レスポンス本文の上限は 64 MiB、未完了のヘッダーまたは chunk framing の上限は 64 KiB です。setHost はアドレスを同期的に解析し、実際の DNS と接続は sendRequest 内で行います。

## FTP

FTP は basic-ftp の制御接続、パッシブデータチャネル、ストリーミングファイル転送を使います。connect はログインせず、login の既定は anonymous です。列挙型とレスポンス型は、同梱の SFML ヘッダーから生成し、元の FTP ステータスコードはそのまま保持します。ディレクトリ一覧には NLST を送信します。

download(remoteFile, localDirectory, mode) は、ローカルディレクトリ内にリモートのファイル名で書き込みます。upload(localFile, remoteDirectory, mode, append) は、リモートディレクトリ内にローカルのファイル名で書き込みます。Binary／Ascii／Ebcdic はそれぞれ TYPE I／A／E を送信し、モードへの対応はサーバーの応答によって決まります。renameFile、deleteDirectory などは対応する操作だけを行い、暗黙の再帰削除は行いません。sendCommand では他の FTP コマンドを送信でき、引数内の改行と NUL は拒否されます。

同じ Ftp オブジェクト上の操作は直列に実行します。connect の Time は接続確立だけを制限し、他のコマンドは close で明示的に中断できます。close は制御接続とデータ接続を閉じます。接続失敗、接続終了、ローカルファイルのエラーは対応する SFML レスポンスにマッピングし、サーバーエラーはステータスコードを保持します。

<a id="sftp"></a>
## SFTP

SFTP は ssh2 を使います。connect は SSH ネゴシエーションを完了し、認証の直前で止まります。getSessionInfo でホストの公開鍵、SHA-1／SHA-256 フィンガープリント、合意したアルゴリズムを取得できます。login はパスワード、または対応する公開鍵・秘密鍵とパスフレーズに対応し、認証に失敗しても再試行できます。

ホスト鍵は known_hosts と自動照合しません。SFML と同様に、SessionInfo を公開して呼び出し側に判断を委ねます。サーバーの識別を検証する場合は、login の前に hostKey.sha256 を信頼済みのフィンガープリントと比較してください。

以下の関数には、アプリケーションから IpAddress、認証情報、既知の信頼済みフィンガープリント、データ消費コールバックを渡します。

```javascript
async function download(address, username, password, trustedFingerprint, consume) {
  const client = new sf.Sftp();
  try {
    const connection = await client.connect(address, 22, sf.seconds(5));
    if (!connection.isOk()) throw new Error(connection.getMessage());
    const info = client.getSessionInfo();
    if (!info || info.hostKey.sha256 !== trustedFingerprint) {
      throw new Error('Unexpected SFTP host key');
    }
    const authentication = await client.login(username, password, sf.seconds(5));
    if (!authentication.isOk()) throw new Error(authentication.getMessage());
    const result = await client.download('/file', async bytes => {
      await consume(bytes);
      return true;
    });
    if (!result.isOk()) throw new Error(result.getMessage());
  } finally {
    client.close();
  }
}
```

download コールバックは最大 65536 バイトの Buffer ビューを受け取ります。false を返すと停止し、EOF はゼロバイトのコールバックで終了します。upload コールバックは `{ data, size }` を受け取り、Buffer に書き込んで size を有効なバイト数に設定します。false を返した場合も、今回の有効なデータを書き出してから停止します。コールバックは Promise を返せます。毎回独立した Buffer を割り当てるため、コールバックが古いビューを保持しても後続のブロックで上書きされることはありません。アップロードのコールバックが完了した後は、呼び出し側が送信済みのブロックを変更してはいけません。

属性にはパス、FileType、権限、bigint のサイズ／UID／GID、Date の時刻が含まれます。ssh2 のオフセットと属性の数値インターフェースは number を使うため、このバインディングは 0～2⁵³−1 の正確に表現できるオフセットだけを受け付けます。範囲外の値は拒否し、精度が黙って失われるのを防ぎます。時刻の精度はプロトコルが提供する秒単位です。rename(overwrite=true) は OpenSSH POSIX rename 拡張を使い、この拡張に対応しないサーバーはエラーを返します。

Time は、1 回の進展のない待機に対する間隔へ変換されます。TimeoutWithPredicate は、接続に着信データも操作完了通知もない状態が 1 間隔に達すると述語を呼びます。true は待機を継続し、false は Timeout を返してセッションを閉じます。Time.Zero はタイマーを設定しません。これは Node のイベント層での待機であり、libssh2 の EAGAIN／カーネルの準備完了状態の詳細と同一視することはできません。

close は進行中の待機を中断します。ユーザーコールバックの Promise を強制終了することはできませんが、後から完了しても、再接続されたセッションで読み書きを続けることはありません。SFTP プロトコルのステータスは対応する Result.Value にマッピングします。下位層のエラーを libssh2 固有の値と一対一で対応付けられない場合は、固有のエラーを作り出すのではなく、Error と元のメッセージを返します。

## 検証とデモ

`npm run demo:network` はローカルのループバックアドレスで TCP、Packet、UDP、Selector のサンプルを実行し、終了時にすべての接続を閉じます。

`npm run test:runtime` にはネットワークテストが含まれます。ローカルの TCP／UDP／DNS／FTP／SSH サービスを起動し、実際のソケット、分割されたメッセージ、送信時のバックプレッシャー、TLS の信頼と hostname の失敗、パスワードと公開鍵の認証、ディレクトリとストリーミングファイル操作、タイムアウト、キャンセルをテストします。`network-oracle.test.cjs` は一時ディレクトリで SFML C++ プログラムをコンパイルし、Packet の各フィールドのバイト列と IPv4／IPv6 文字列を比較します。Windows ではこの Unix 向けコンパイルコマンドをスキップします。

依存関係のバージョンは [package.json](../package.json) とロックファイルを基準とします。ローカルのループバックテストは公開サービスの可用性を検証しません。プラットフォームの設定と実行方法は[開発ガイド](development.ja.md#testing)を参照してください。

<a id="sfml-cpp-reference"></a>
## SFML C++ リファレンス

上流の [Packet](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Packet.html)、[TcpSocket](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1TcpSocket.html)、[UdpSocket](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1UdpSocket.html)、[Http](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Http.html)、[Ftp](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Ftp.html)、[Sftp](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Sftp.html) は、パケット形式とプロトコルの概念を確認するための資料です。実際の通信には Node.js のトランスポートと Promise ベースの I/O を使うため、ステータス、サイズ上限、待機の挙動は、この JavaScript 向けガイドの説明を優先してください。
