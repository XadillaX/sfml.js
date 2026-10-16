import { X509Certificate, createPrivateKey } from 'node:crypto';
import { bytes } from './common';

/** 保留完整 PEM 证书链；DER 证书经 X.509 解析后转为 Node TLS 接受的 PEM。 */
export function tlsCertificate(input: string | Uint8Array): string | Buffer {
  if (typeof input === 'string') return input;
  const data = bytes(input);
  return data.includes('-----BEGIN CERTIFICATE-----')
    ? data : new X509Certificate(data).toString();
}

/** 校验并解密私钥，保留密码的原始字节和视图范围，输出无密码 PKCS#8 PEM。 */
export function tlsPrivateKey(input: string | Uint8Array,
  password: string | Uint8Array): string | Buffer {
  const key = typeof input === 'string' ? input : bytes(input);
  const passphrase = typeof password === 'string' ? password : bytes(password);
  if (typeof key === 'string' || key.includes('-----BEGIN ')) {
    return createPrivateKey({ key, format: 'pem', passphrase })
      .export({ format: 'pem', type: 'pkcs8' });
  }
  // 每一种 DER 容器均交给 OpenSSL 实际解析校验，不通过前缀猜测密钥格式。
  let failure: unknown;
  for (const type of [ 'pkcs8', 'pkcs1', 'sec1' ] as const) {
    try {
      return createPrivateKey({ key, format: 'der', type, passphrase })
        .export({ format: 'pem', type: 'pkcs8' });
    } catch (error) { failure ??= error; }
  }
  throw failure;
}
