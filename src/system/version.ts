import { native } from '../internal/native';
import { readonlyStruct } from '../internal/struct-view';

/** 当前加载的 SFML 原生库版本。 */
export interface Version {
  /** 主版本号。 */
  readonly major: number;
  /** 次版本号。 */
  readonly minor: number;
  /** 补丁版本号。 */
  readonly patch: number;
  /** 是否为正式发行版本。 */
  readonly isRelease: boolean;
  /** 完整版本字符串。 */
  readonly string: string;
}

let cached: Version | undefined;

/** Runtime SFML version, cached as one immutable native-backed value. */
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
