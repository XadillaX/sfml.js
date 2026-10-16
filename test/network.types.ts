import {
  IpAddress, IpAddressType, Dns, Packet, Socket, SocketStatus, TcpSocket,
  TcpListener, UdpSocket, SocketSelector, ReadinessType, TlsStatus,
  Http, HttpRequest, HttpResponse, Ftp, FtpResponse, Sftp, SftpResult,
  SftpSessionInfo, SftpAttributes, TimeoutWithPredicate, milliseconds,
  equal, less, SocketType, type SocketHandle,
  type SocketTransfer, type DatagramResult,
} from '..';

const ip = new IpAddress(127, 0, 0, 1);
const v6 = new IpAddress(new Uint8Array(16));
const family: IpAddressType = v6.getType();
const same: boolean = equal(ip, IpAddress.LocalHost);
const order: boolean = less(ip, v6);
const addresses: Promise<IpAddress[] | undefined> = Dns.resolve('localhost');
const mx: Promise<Dns.MxRecord[]> = Dns.queryMx('example.com');
const packet = new Packet().write('u32', 5)
  .write('i64', 6n)
  .write('string', 'hi')
  .write('bytes', new Uint8Array());
const count: number | undefined = packet.read('u32');
const large: bigint | undefined = packet.read('i64');
const text: string | undefined = packet.read('string');
const data: Uint8Array | undefined = packet.read('bytes');
class EncodedPacket extends Packet {
  protected onSend(): Uint8Array { return new Uint8Array([ 1 ]); }
  protected onReceive(bytes: Uint8Array): void { this.append(bytes); }
}
/** 仅从包根导入即可扩展 Socket 并访问受保护生命周期。 */
class CustomSocket extends Socket {
  constructor(type = SocketType.Tcp) { super(type); }
  open(family = IpAddressType.IpV4): void { this.create(family); }
  adopt(handle: SocketHandle): void { this.create(handle); }
  shutdown(): void { this.close(); }
  handle(): SocketHandle | undefined { return this.getNativeHandle(); }
  /** 自定义就绪查询不依赖包内 symbol。 */
  protected getReadiness(mask: number): number {
    return super.getReadiness(mask);
  }
  /** 自定义存活检查不依赖包内 symbol。 */
  protected isAlive(): boolean { return super.isAlive(); }
  /** 子类可唤醒 Selector。 */
  notify(): void { this.changed(); }
}
/** TCP 外部子类可以分配或接管 Node 传输。 */
class CustomTcp extends TcpSocket {
  open(): void { this.create(); }
  adopt(handle: SocketHandle): void { this.create(handle); }
  shutdown(): void { this.close(); }
}
/** UDP 外部子类可以指定地址族。 */
class CustomUdp extends UdpSocket {
  open(): void { this.create(IpAddressType.IpV6); }
  adopt(handle: SocketHandle): void { this.create(handle); }
  shutdown(): void { this.close(); }
}
const client = new TcpSocket();
const listener = new TcpListener();
const connected: Promise<SocketStatus> = client.connect(ip, 8000);
const accepted: Promise<SocketStatus> = listener.accept(client);
const sent: Promise<SocketStatus> = client.send(packet);
const received: Promise<SocketTransfer> = client.receive(new Uint8Array(20));
const tls: Promise<TlsStatus> = client.setupTlsClient('localhost');
const tlsBytes: Promise<TlsStatus> = client.setupTlsServer(
  new Uint8Array(), new Uint8Array(), new Uint8Array());
const udp = new UdpSocket();
const datagram: Promise<DatagramResult> = udp.receive(packet);
const selector = new SocketSelector();
selector.add(new CustomSocket(Socket.Type.Udp));
selector.add(new CustomTcp());
selector.add(new CustomUdp());
selector.add(client, ReadinessType.Receive, ready => { void ready; });
const waiting: Promise<boolean> = selector.wait(milliseconds(1));
const request: HttpRequest = new Http.Request('/path');
request.setHttpVersion(1, 0);
const response: Promise<HttpResponse> = new Http('localhost').sendRequest(request);
const ftp = new Ftp();
const login: Promise<FtpResponse> = ftp.login('user', 'password');
const sftp = new Sftp();
const sftpLogin: Promise<SftpResult> = sftp.login('user', 'password');
const keyLogin: Promise<SftpResult> = sftp.login('user', 'public', 'private', '');
const session: SftpSessionInfo | undefined = sftp.getSessionInfo();
const upload: Promise<SftpResult> = sftp.upload('/file', chunk => {
  chunk.data.fill(0);
  chunk.size = 4;
  return false;
}, 0o644, true, false, 0n,
new TimeoutWithPredicate(() => true, milliseconds(1)));
async function stat(): Promise<SftpAttributes> {
  return (await sftp.getAttributes('/file')).getAttributes();
}
// @ts-expect-error Network socket base class is abstract.
new Socket();
// @ts-expect-error 创建方法只能从子类访问。
client.create();
// @ts-expect-error 关闭方法只能从子类访问。
client.close();
// @ts-expect-error uint64 Packet fields require bigint.
packet.write('u64', 5);
// @ts-expect-error int32 Packet fields require number.
packet.write('i32', 5n);
// @ts-expect-error Connect expects an IpAddress, not an unresolved hostname.
client.connect('localhost', 80);
// @ts-expect-error SFTP offsets preserve integer precision with bigint.
sftp.download('/file', () => true, 5);

export {
  family, same, order, addresses, mx, count, large, text, data, EncodedPacket,
  connected, accepted, sent, received, tls, datagram, waiting, response, login,
  sftpLogin, keyLogin, session, upload, stat, tlsBytes, CustomSocket,
};
