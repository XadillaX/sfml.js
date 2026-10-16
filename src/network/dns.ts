import { Resolver, lookup } from 'node:dns/promises';
import { IpAddress, IpAddressType } from './ip-address';
import { Time, seconds } from '../system/time';
import { millisecondsOf, uint, type NetworkTime } from './common';

/** 邮件交换服务器记录。 */
export interface MxRecord {
  /** 邮件服务器主机名。 */
  exchange: string;
  /** 优先级，数值越小越优先。 */
  preference: number;
}
/** 服务发现记录。 */
export interface SrvRecord {
  /** 服务主机名。 */
  target: string;
  /** 服务端口。 */
  port: number;
  /** 同优先级记录之间的选择权重。 */
  weight: number;
  /** 优先级，数值越小越优先。 */
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
 * 异步解析 IPv4/IPv6 地址，失败返回 undefined。
 * servers 为空时使用系统解析器，timeout 不限制该路径；指定 DNS 时默认超时 1 秒。
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
/** 查询域名服务器记录；默认使用系统 DNS、超时 1 秒，查询失败返回空数组。 */
export async function queryNs(hostname: string, servers: readonly IpAddress[] = [],
  timeout: NetworkTime | undefined = seconds(1)): Promise<string[]> {
  return await query(servers, timeout, resolver => resolver.resolveNs(hostname))
    ?? [];
}
/** 查询邮件交换记录；默认超时 1 秒，查询失败返回空数组。 */
export async function queryMx(hostname: string, servers: readonly IpAddress[] = [],
  timeout: NetworkTime | undefined = seconds(1)): Promise<MxRecord[]> {
  return (await query(servers, timeout, resolver => resolver.resolveMx(hostname))
    ?? []).map(record => ({
    exchange: record.exchange, preference: record.priority,
  }));
}
/** 查询服务发现记录（如 _service._tcp.domain）；失败返回空数组。 */
export async function querySrv(hostname: string, servers: readonly IpAddress[] = [],
  timeout: NetworkTime | undefined = seconds(1)): Promise<SrvRecord[]> {
  return (await query(servers, timeout, resolver => resolver.resolveSrv(hostname))
    ?? []).map(record => ({ target: record.name, port: record.port,
    weight: record.weight, priority: record.priority }));
}
/** 查询 TXT 记录；每条记录包含多个文本段，失败返回空数组。 */
export async function queryTxt(hostname: string, servers: readonly IpAddress[] = [],
  timeout: NetworkTime | undefined = seconds(1)): Promise<string[][]> {
  return await query(servers, timeout, resolver => resolver.resolveTxt(hostname))
    ?? [];
}
/** 通过 OpenDNS 查询指定地址族的公网出口地址，失败返回 undefined。 */
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
