import { X509Certificate, createPrivateKey } from 'node:crypto';
import { bytes } from './common';

/**
 * Preserve the full PEM certificate chain; parse DER certificates as X.509
 * and convert them to PEM accepted by Node TLS.
 * @zh 保留完整 PEM 证书链；DER 证书经 X.509 解析后转为 Node TLS 接受的 PEM。
 * @ja 完全な PEM 証明書チェーンを保持します。DER 証明書は X.509 として解析し、
 * Node TLS が受け付ける PEM に変換します。
 * @ko 전체 PEM 인증서 체인을 유지합니다. DER 인증서는 X.509로 파싱한 후
 * Node TLS가 허용하는 PEM으로 변환합니다.
 */
export function tlsCertificate(input: string | Uint8Array): string | Buffer {
  if (typeof input === 'string') return input;
  const data = bytes(input);
  return data.includes('-----BEGIN CERTIFICATE-----')
    ? data : new X509Certificate(data).toString();
}

/**
 * Validate and decrypt a private key, preserving raw password bytes and view
 * bounds; output password-free PKCS#8 PEM.
 * @zh 校验并解密私钥，保留密码的原始字节和视图范围，输出无密码 PKCS#8 PEM。
 * @ja 秘密鍵を検証・復号し、パスワードの生バイトとビューの範囲を保持します。
 * パスワードなしの PKCS#8 PEM を出力します。
 * @ko 개인 키를 검증하고 복호화하며 암호의 원시 바이트와 뷰 범위를 유지합니다.
 * 암호 없는 PKCS#8 PEM을 출력합니다.
 */
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
