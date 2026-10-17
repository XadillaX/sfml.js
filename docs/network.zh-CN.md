# Network

[English](network.md) · **简体中文** · [日本語](network.ja.md) · [한국어](network.ko.md)

> 使用 Packet 定义报文，通过 TCP／UDP 传输，或使用 HTTP、FTP、SFTP 完成协议操作。网络 I/O 返回 Promise，调用方同时检查操作状态。

[API 导航](api.zh-CN.md) · [核心概念](concepts.zh-CN.md) · [回环示例](../examples/network.cjs)

生产 Network 使用 Node.js 传输实现 SFML 风格接口，FTP 使用 basic-ftp，SFTP 使用 ssh2，IPv6 解析使用 ipaddr.js。它不调用 SFML C++ 网络模块；Packet 格式及部分值语义通过独立 C++ 程序对照。

## 接口与调用方式

| 接口 | 实现与适配 |
|------|------------|
| IpAddress | IPv4 整数／四字节构造，IPv6 16 字节构造，复制、fromString、toString、toInteger、toBytes、getType、isV4/isV6；静态 resolve、getLocalAddress、getPublicAddress 返回 Promise |
| Dns | resolve、queryNs、queryMx、querySrv、queryTxt、getPublicAddress；支持独立 Resolver 和指定服务器 |
| Socket | setBlocking、isBlocking、AnyPort、Status；getLastError 返回最近一次底层错误 |
| TcpSocket | connect、disconnect、send、receive、端口／远端地址查询；setupTlsClient、setupTlsServer、getCurrentCiphersuiteName |
| TcpListener | listen、close、accept、getLocalPort |
| UdpSocket | bind、unbind、send、receive、getLocalPort、MaxDatagramSize |
| SocketSelector | add、remove、clear、wait、isReady、dispatchReadyCallbacks、复制构造与 assign；Receive／Send 位标志 |
| Packet | append、clear、getData、getDataSize、getReadPosition、endOfPacket、isValid、复制构造；类型明确的 write/read；可重写 onSend/onReceive |
| Http | setHost、sendRequest、Request 与 Response；显式 HTTP 请求版本 |
| Ftp | connect、disconnect、login、keepAlive、工作目录、目录列表、切换／创建／删除目录、重命名／删除文件、上传／追加／下载、sendCommand |
| Sftp | connect 与 login 分离、密码／密钥认证、getSessionInfo、路径解析、目录和属性、重命名／删除、流式上传下载、TimeoutWithPredicate |

有 I/O 或等待的方法返回 Promise，纯状态查询和配置仍同步。`disconnect()` 的 TcpSocket 版本、listener.close、udp.unbind 同步结束本地传输。FTP／SFTP 的 disconnect 返回 Promise，另提供同步 close 中断未完成操作。

C++ 输出引用用返回对象表示：

| 操作 | 返回值 |
|------|--------|
| TCP send(Uint8Array) | `{ status, sent }` |
| TCP receive(Uint8Array) | `{ status, received }` |
| TCP send/receive(Packet) | `SocketStatus` |
| UDP send(Uint8Array 或 Packet, address, port) | `SocketStatus` |
| UDP receive(Uint8Array 或 Packet) | `{ status, received, remoteAddress?, remotePort }` |

SocketHandle 是 Node transport 对象的类型别名，仅用于受保护的 getNativeHandle；它不是可跨平台传递的操作系统 fd／SOCKET 数字。

## TCP、UDP 与 Selector

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

`setBlocking(true)` 表示 Promise 等待所需数据／写入完成，不阻塞事件循环。`setBlocking(false)` 表示根据当前封装层状态返回；TCP connect 启动连接并返回 NotReady，可用 Selector.Send 等待连接就绪。TLS 初始化返回 HandshakeStarted 后，可重复调用同一 setup 方法取得握手状态。UDP bind/send 和 TCP listen 仍等待 Node 的完成通知，以提供实际端口和操作结果。

TCP 原始字节发送的 sent 是本次被封装层接收的字节数。非阻塞模式最多提交当前 Node writable highWaterMark 的剩余容量，部分接收返回 Partial，没有空间返回 NotReady；继续发送时传入未发送的后缀。Node write 返回 false 只表示背压，本次已入队的字节不会再次要求调用者重发。Done 不代表对端应用已经消费或持久化数据。

TCP Packet 使用大端 uint32 长度前缀。Partial 后继续传入同一个 Packet，封装层保留第一次发送的快照与偏移；在它完成前，其他发送返回 NotReady，防止包内容交错。接收支持任意分段的包头和包体；非阻塞 NotReady 保留已收部分。接收中的 Packet 未完成前不能切换为原始字节接收。

TCP 接收使用 Node readable 队列和背压，不另建无限增长的数据副本。UDP 保留报文边界；目的数组小于报文时丢弃本报文并返回 Error。UDP 接收队列最多容纳 4096 个报文或 8 MiB，超过后丢弃新报文。单报文最大 65507 字节。TCP Packet 接收限制为 64 MiB；超限关闭连接并返回 Error。

Selector 观察封装层可读／可写状态，不声称等同于原始系统 select。一次 wait 保存就绪快照，isReady 查询该快照，dispatchReadyCallbacks 显式派发；wait 超时返回 false。修改成员集合或关闭全部成员会唤醒等待。一个 selector 同时只允许一个 wait；修改后可再次 wait。复制 selector 复制成员引用和就绪快照，不复制 socket。

关闭连接会唤醒挂起的读取、accept 和 Selector 等待；新连接使用新的代数，旧操作不能读取新连接的数据。使用结束时显式关闭网络对象，活动 Node 连接会维持进程运行。

## Packet

后续片段中的 `sf` 均指 `require('sfml.js')`。写入和读取时必须使用相同的字段顺序与类型：

```js
const packet = new sf.Packet()
  .write('bool', true)
  .write('i32', -100)
  .write('u64', 18446744073709551615n)
  .write('f32', 1.5)
  .write('string', '音频🌟')
  .write('bytes', new Uint8Array([ 255, 0, 254 ]));
```

| 类型参数 | JS 类型 | SFML 字节格式 |
|----------|---------|---------------|
| bool | boolean | 一个字节 |
| i8/u8、i16/u16、i32/u32 | number | 对应位宽的整数，大端序 |
| i64/u64 | bigint | 64 位整数，大端序 |
| f32/f64 | number | IEEE 浮点，使用运行主机字节序，与 SFML memcpy 一致 |
| string | string | 对应 sf::String：uint32 字符数 + UTF-32 大端码点 |
| utf8 | string | UTF-8 编码成 std::string：uint32 字节数 + 字节 |
| bytes | Uint8Array | 二进制 std::string：uint32 字节数 + 原字节 |

`read(type)` 返回相应类型，数据不足时返回 undefined，并使 isValid 为 false，直到 clear。失败不会跳过缺失字段；字符串长度已成功读取时，游标停在字符串正文开头。整数写入按位宽转换，64 位值不经过 number。跨大小端平台的浮点 Packet 与原 SFML 一样需要双方自行约定转换。

底层使用可增长 Buffer，读取整数和浮点直接访问同一内存。getData 返回有效区域视图，空包返回 undefined；该视图应只读使用。扩容或 clear 后旧视图仍保活旧分配。append 复制输入，发送在接受输入时建立快照，调用者随后修改输入不会改变已提交字节。这里没有额外 NAN 映射，也没有逐字节跨语言调用。

onSend 返回待发送字节，onReceive 接收完整报文；子类可以实现压缩或自定义编码。网络接收在调用 onReceive 前 clear 原包。两个钩子同步执行，异步工作应在 send/receive 外完成。

## 地址、DNS 与 TLS

IpAddress 是不可变值，toBytes 返回独立 IPv6 字节副本；toInteger 仅适用于 IPv4。fromString 不做 DNS，不接受缩写 IPv4、八进制形式或带 zone ID 的 IPv6。equal、notEqual、less、lessEqual、greater、greaterEqual 支持地址；排序先按 IPv4／IPv6，再按字节。

Dns.resolve 在不指定服务器时使用系统 lookup，包括 hosts 文件；这条路径的完成时间由系统解析器控制。指定服务器时并行查 A／AAAA，queryNs/Mx/Srv/Txt 使用独立 Resolver，超时取消该次查询，不影响其他查询。MX 的 priority 映射为 preference，SRV 的 name 映射为 target。默认服务器查询失败返回 undefined 或空数组。

getLocalAddress 通过 UDP 路由选择取得本地地址，不发送应用数据。公网地址查询需要外部 DNS／HTTP 服务，不在离线测试中发起真实公网查询。Time.Zero 表示不设超时。

TLS 支持已连接 TCP 的客户端和服务端升级。客户端默认验证系统 CA 和 hostname，可传入证书字符串／字节作为 CA，或显式传 false 关闭验证；服务端接受证书、私钥、可选口令。升级前必须排空 plaintext 读写队列。证书与密码套件由 Node/OpenSSL 提供，集合不保证与 SFML 的 Mbed TLS 一致。

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

Request 支持 setField、setMethod、setUri、setHttpVersion、setBody；Response 支持状态、HTTP 版本、字段和正文查询。getBody 按 UTF-8 解码，getBodyBytes 取得独立原始字节。setBody 可以直接接受 Uint8Array。

为支持 SFML 显式指定 HTTP/1.0／1.1 请求行，使用 Node TCP／TLS 发送请求并增量解析响应；解析支持 Content-Length、chunked、trailer、中间 1xx、HEAD／无正文状态和连接关闭定界。请求正文使用 Content-Length，禁止冲突的长度和 Transfer-Encoding。不会自动跟随重定向、解压正文或升级 HTTP/2。

sendRequest 的 Time 限制整次请求，可传第四个 AbortSignal 参数取消。无效或截断响应映射为 InvalidResponse，连接／TLS 失败与取消映射为 ConnectionFailed。响应正文上限 64 MiB，未完成的头部或 chunk framing 上限 64 KiB。setHost 同步解析地址，实际 DNS 和连接在 sendRequest 中完成。

## FTP

FTP 使用 basic-ftp 的控制连接、被动数据通道和流式文件传输。connect 不登录；login 默认 anonymous。枚举和响应类型按随包 SFML 头文件生成，原始 FTP 状态码保持原值。目录列表发送 NLST。

download(remoteFile, localDirectory, mode) 写入本地目录下的远端文件名；upload(localFile, remoteDirectory, mode, append) 写入远端目录下的本地文件名。Binary／Ascii／Ebcdic 分别发送 TYPE I／A／E，模式是否支持由服务器响应决定。renameFile、deleteDirectory 等仅执行对应操作，不隐式递归删除。sendCommand 可发送其他 FTP 命令，参数中的换行和 NUL 被拒绝。

同一 Ftp 对象上的操作串行。connect 的 Time 只约束连接建立，其他命令可用 close 主动中断。close 关闭控制与数据连接。连接失败、连接关闭、本地文件错误映射为对应 SFML 响应；服务器错误保留状态码。

<a id="sftp"></a>

## SFTP

SFTP 使用 ssh2。connect 完成 SSH 协商并停在认证前，getSessionInfo 可读取主机公钥、SHA-1／SHA-256 指纹以及协商算法；login 支持密码或匹配的公私钥和口令，认证失败可重试。

主机密钥不自动匹配 known_hosts，沿用 SFML 暴露 SessionInfo 供调用方判断的方式。需要校验服务器身份时，在 login 前将 hostKey.sha256 与可信指纹比较。

下面的函数由应用传入 IpAddress、认证信息、已知可信指纹和消费回调：

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

download 回调接收最多 65536 字节的 Buffer 视图；返回 false 停止，EOF 会以零字节回调结束。upload 回调接收 `{ data, size }`，填写 Buffer，将 size 设为有效字节数，返回 false 时仍写出本次有效数据后停止。回调可以返回 Promise。每次分配独立 Buffer，回调保留旧视图不会看到后续块覆盖；上传回调完成后，调用方不得继续修改已提交块。

属性包含路径、FileType、权限、bigint 大小／UID／GID，以及 Date 时间。ssh2 的偏移和属性数值接口使用 number，因此本绑定只接受 0～2⁵³−1 的精确偏移，超过范围拒绝，避免静默丢失精度；时间精度为协议提供的秒。rename(overwrite=true) 使用 OpenSSH POSIX rename 扩展，不支持该扩展的服务器返回错误。

Time 转为单次无进展等待的周期；TimeoutWithPredicate 在连接没有入站数据或操作完成通知达到一个周期时调用谓词，true 继续等待，false 返回 Timeout 并关闭会话。Time.Zero 不设置计时器。该机制是 Node 事件层面的等待，不能等同于 libssh2 的 EAGAIN／内核就绪细节。

close 会中断进行中的等待；用户回调 Promise 无法被强行终止，但它随后完成时不会对重新建立的会话继续读写。SFTP 协议状态映射为对应 Result.Value；底层错误无法与 libssh2 专属值逐一对应时返回 Error 和原消息，不伪造专属错误。

## 验证与演示

`npm run demo:network` 在本机回环地址运行 TCP、Packet、UDP、Selector 示例，结束时关闭所有连接。

`npm run test:runtime` 包含网络测试，启动本地 TCP／UDP／DNS／FTP／SSH 服务，测试真实套接字、分段报文、发送背压、TLS 信任与 hostname 失败、密码和公钥认证、目录与流式文件操作、超时和取消。`network-oracle.test.cjs` 在临时目录编译 SFML C++ 程序，对照 Packet 每个字段的字节与 IPv4／IPv6 字符串；Windows 下跳过该 Unix 编译命令。

依赖版本以 [package.json](../package.json) 和锁文件为准。本地回环测试不验证公网服务可用性；平台配置与执行方法见 [开发指南](development.zh-CN.md#testing)。

<a id="sfml-cpp-reference"></a>

## SFML C++ 参考

报文与套接字参考 [sf::Packet](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Packet.html)、[sf::TcpSocket](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1TcpSocket.html)、[sf::UdpSocket](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1UdpSocket.html)；应用协议参考 [sf::Http](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Http.html)、[sf::Ftp](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Ftp.html)、[sf::Sftp](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Sftp.html)。

上游文档可用于理解 Packet 格式与协议概念。实际传输由 Node.js 实现，Promise I/O、状态返回、背压、超时和容量限制以本文为准；不要假设与 C++ 的阻塞调用或系统句柄完全相同。
