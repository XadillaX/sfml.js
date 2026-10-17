import { native } from '../internal/native';
import { readonlyStruct } from '../internal/struct-view';

/**
 * The version of the currently loaded native SFML library.
 * @zh 当前加载的 SFML 原生库版本。
 * @ja 現在読み込まれているネイティブ SFML ライブラリのバージョン。
 * @ko 현재 로드된 네이티브 SFML 라이브러리 버전.
 */
export interface Version {
  /**
   * The major version number.
   * @zh 主版本号。
   * @ja メジャーバージョン番号。
   * @ko 주 버전 번호.
   */
  readonly major: number;
  /**
   * The minor version number.
   * @zh 次版本号。
   * @ja マイナーバージョン番号。
   * @ko 부 버전 번호.
   */
  readonly minor: number;
  /**
   * The patch version number.
   * @zh 补丁版本号。
   * @ja パッチバージョン番号。
   * @ko 패치 버전 번호.
   */
  readonly patch: number;
  /**
   * Whether this is an official release version.
   * @zh 是否为正式发行版本。
   * @ja 正式リリース版かどうか。
   * @ko 정식 릴리스 버전인지 여부.
   */
  readonly isRelease: boolean;
  /**
   * The full version string.
   * @zh 完整版本字符串。
   * @ja 完全なバージョン文字列。
   * @ko 전체 버전 문자열.
   */
  readonly string: string;
}

let cached: Version | undefined;

/**
 * Runtime SFML version, cached as one immutable native-backed value.
 * @zh 运行时 SFML 版本，缓存为单个由原生存储支持的不可变值。
 * @ja 実行時の SFML バージョン。ネイティブ格納領域を持つ単一の不変値として
 * キャッシュされる。
 * @ko 런타임 SFML 버전. 네이티브 저장소에 기반한 단일 불변 값으로 캐시된다.
 */
export function version(): Version {
  if (!cached) {
    const mapping = native.getVersion();
    cached = readonlyStruct<Version>(mapping.buffer, {
      major: [ 'i8', 0 ], minor: [ 'i8', 1 ], patch: [ 'i8', 2 ],
      isRelease: [ 'bool', 3 ],
    }, { string: mapping.string });
  }
  return cached;
}
