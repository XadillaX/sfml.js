import { Resolver, lookup } from 'node:dns/promises';
import { IpAddress, IpAddressType } from './ip-address';
import { Time, seconds } from '../system/time';
import { millisecondsOf, uint, type NetworkTime } from './common';

/**
 * Mail exchanger record.
 * @zh 邮件交换服务器记录。
 * @ja メール交換サーバーのレコード。
 * @ko 메일 교환 서버 레코드.
 */
export interface MxRecord {
  /**
   * Mail server hostname.
   * @zh 邮件服务器主机名。
   * @ja メールサーバーのホスト名。
   * @ko 메일 서버 호스트 이름.
   */
  exchange: string;
  /**
   * Priority; lower values take precedence.
   * @zh 优先级，数值越小越优先。
   * @ja 優先度。値が小さいほど優先されます。
   * @ko 우선순위. 값이 작을수록 우선합니다.
   */
  preference: number;
}
/**
 * Service discovery record.
 * @zh 服务发现记录。
 * @ja サービス検出レコード。
 * @ko 서비스 검색 레코드.
 */
export interface SrvRecord {
  /**
   * Service hostname.
   * @zh 服务主机名。
   * @ja サービスのホスト名。
   * @ko 서비스 호스트 이름.
   */
  target: string;
  /**
   * Service port.
   * @zh 服务端口。
   * @ja サービスのポート。
   * @ko 서비스 포트.
   */
  port: number;
  /**
   * Selection weight among records with the same priority.
   * @zh 同优先级记录之间的选择权重。
   * @ja 同じ優先度のレコード間での選択の重み。
   * @ko 우선순위가 같은 레코드 간 선택 가중치.
   */
  weight: number;
  /**
   * Priority; lower values take precedence.
   * @zh 优先级，数值越小越优先。
   * @ja 優先度。値が小さいほど優先されます。
   * @ko 우선순위. 값이 작을수록 우선합니다.
   */
  priority: number;
}
async function query<T>(servers: readonly IpAddress[],
  timeout: NetworkTime | undefined, action: (resolver: Resolver) => Promise<T>):
  Promise<T | undefined> {
  const milliseconds = timeout ? millisecondsOf(timeout) : 0;
  const resolver = new Resolver({ timeout: milliseconds || -1, tries: 1 });
  if (servers.length) {
    resolver.setServers(servers.map(address => address.toString()));
  }
  let timer: NodeJS.Timeout | undefined;
  if (milliseconds) timer = setTimeout(() => resolver.cancel(), milliseconds);
  try { return await action(resolver); } catch { return undefined; } finally {
    if (timer) clearTimeout(timer);
  }
}
/**
 * Resolve IPv4/IPv6 addresses asynchronously; return undefined on failure.
 * With no servers, use the system resolver without applying timeout.
 * With explicit DNS servers, the default timeout is 1 second.
 * @zh 异步解析 IPv4/IPv6 地址，失败返回 undefined。
 * servers 为空时使用系统解析器，timeout 不限制该路径；指定 DNS 时默认超时 1 秒。
 * @ja IPv4/IPv6 アドレスを非同期に解決し、失敗時は undefined を返します。
 * servers が空ならシステムのリゾルバーを使い、timeout は適用しません。
 * DNS サーバーを指定した場合、既定のタイムアウトは 1 秒です。
 * @ko IPv4/IPv6 주소를 비동기로 확인하며 실패 시 undefined를 반환합니다.
 * servers가 비어 있으면 시스템 리졸버를 사용하고 timeout은 적용하지 않습니다.
 * DNS 서버를 지정하면 기본 제한 시간은 1초입니다.
 */
export async function resolve(hostname: string,
  servers: readonly IpAddress[] = [], timeout: NetworkTime | undefined = seconds(1)):
  Promise<IpAddress[] | undefined> {
  const literal = IpAddress.fromString(hostname);
  if (literal) return [ literal ];
  if (!servers.length) {
    try {
      const records = await lookup(hostname, { all: true });
      return records.map(record => IpAddress.fromString(record.address)!);
    } catch { return undefined; }
  }
  return query(servers, timeout, async resolver => {
    const results = await Promise.allSettled([
      resolver.resolve4(hostname), resolver.resolve6(hostname),
    ]);
    const addresses = results.flatMap(result =>
      (result.status === 'fulfilled' ? result.value : []));
    if (!addresses.length && results.every(result =>
      result.status === 'rejected')) throw new Error('DNS lookup failed');
    return addresses.map(address => IpAddress.fromString(address)!);
  });
}
/**
 * Query name server records; default to system DNS and a 1-second timeout.
 * Return an empty array on query failure.
 * @zh 查询域名服务器记录；默认使用系统 DNS、超时 1 秒，查询失败返回空数组。
 * @ja ネームサーバーレコードを照会します。既定はシステム DNS と 1 秒の
 * タイムアウトで、照会失敗時は空配列を返します。
 * @ko 네임 서버 레코드를 조회합니다. 기본값은 시스템 DNS와 1초 제한 시간이며,
 * 조회 실패 시 빈 배열을 반환합니다.
 */
export async function queryNs(hostname: string, servers: readonly IpAddress[] = [],
  timeout: NetworkTime | undefined = seconds(1)): Promise<string[]> {
  return await query(servers, timeout, resolver => resolver.resolveNs(hostname))
    ?? [];
}
/**
 * Query mail exchanger records with a default 1-second timeout;
 * return an empty array on query failure.
 * @zh 查询邮件交换记录；默认超时 1 秒，查询失败返回空数组。
 * @ja メール交換レコードを照会します。既定のタイムアウトは 1 秒で、
 * 照会失敗時は空配列を返します。
 * @ko 메일 교환 레코드를 조회합니다. 기본 제한 시간은 1초이며,
 * 조회 실패 시 빈 배열을 반환합니다.
 */
export async function queryMx(hostname: string, servers: readonly IpAddress[] = [],
  timeout: NetworkTime | undefined = seconds(1)): Promise<MxRecord[]> {
  return (await query(servers, timeout, resolver => resolver.resolveMx(hostname))
    ?? []).map(record => ({
    exchange: record.exchange, preference: record.priority,
  }));
}
/**
 * Query service discovery records (e.g. _service._tcp.domain);
 * return an empty array on failure.
 * @zh 查询服务发现记录（如 _service._tcp.domain）；失败返回空数组。
 * @ja サービス検出レコード（例: _service._tcp.domain）を照会し、
 * 失敗時は空配列を返します。
 * @ko 서비스 검색 레코드(예: _service._tcp.domain)를 조회하며,
 * 실패 시 빈 배열을 반환합니다.
 */
export async function querySrv(hostname: string, servers: readonly IpAddress[] = [],
  timeout: NetworkTime | undefined = seconds(1)): Promise<SrvRecord[]> {
  return (await query(servers, timeout, resolver => resolver.resolveSrv(hostname))
    ?? []).map(record => ({ target: record.name, port: record.port,
    weight: record.weight, priority: record.priority }));
}
/**
 * Query TXT records, each containing multiple text segments;
 * return an empty array on failure.
 * @zh 查询 TXT 记录；每条记录包含多个文本段，失败返回空数组。
 * @ja TXT レコードを照会します。各レコードは複数のテキスト断片を含み、
 * 失敗時は空配列を返します。
 * @ko TXT 레코드를 조회합니다. 각 레코드는 여러 텍스트 조각을 포함하며,
 * 실패 시 빈 배열을 반환합니다.
 */
export async function queryTxt(hostname: string, servers: readonly IpAddress[] = [],
  timeout: NetworkTime | undefined = seconds(1)): Promise<string[][]> {
  return await query(servers, timeout, resolver => resolver.resolveTxt(hostname))
    ?? [];
}
/**
 * Query the public outbound address for the given address family via OpenDNS;
 * return undefined on failure.
 * @zh 通过 OpenDNS 查询指定地址族的公网出口地址，失败返回 undefined。
 * @ja OpenDNS で指定アドレスファミリーの外向き公開アドレスを照会し、
 * 失敗時は undefined を返します。
 * @ko OpenDNS로 지정한 주소 계열의 공인 송신 주소를 조회하며,
 * 실패 시 undefined를 반환합니다.
 */
export async function getPublicAddress(timeout: NetworkTime | undefined = Time.Zero,
  type = IpAddressType.IpV4): Promise<IpAddress | undefined> {
  uint(type, 1);
  const servers = [ IpAddress.fromString(type === IpAddressType.IpV4
    ? '208.67.222.222' : '2620:119:35::35')! ];
  const addresses = await query(servers, timeout, resolver =>
    (type === IpAddressType.IpV4
      ? resolver.resolve4('myip.opendns.com')
      : resolver.resolve6('myip.opendns.com')));
  return addresses?.length ? IpAddress.fromString(addresses[0]) : undefined;
}
