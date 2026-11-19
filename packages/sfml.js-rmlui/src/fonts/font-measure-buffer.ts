import { TextEncoder } from 'node:util';
import { markAsUntransferable } from 'node:worker_threads';
import { native, type NativeFontMeasureBuffer } from '../internal/native';

interface BufferState {
  readonly storage: NativeFontMeasureBuffer;
  length: number;
  byteLength: number;
}

const buffers = new WeakMap<FontMeasureBuffer, BufferState>();
const encoder = new TextEncoder();

/**
 * Resolve the genuine native allocation and logical length.
 *
 * @internal
 * @param buffer - Public buffer.
 * @returns Retained storage.
 */
function mapping(buffer: FontMeasureBuffer): BufferState {
  const result = buffers.get(buffer);
  if (!result) {
    throw new TypeError('Expected a FontMeasureBuffer');
  }
  return result;
}

/**
 * Resolve the checked native measurement token.
 *
 * @internal
 * @param buffer - Public buffer.
 * @returns Native owner.
 */
export function fontMeasureBufferHandle(buffer: FontMeasureBuffer): object {
  return mapping(buffer).storage.handle;
}

/**
 * Return the original output view without invoking public accessors.
 *
 * @internal
 * @param buffer - Public buffer.
 * @returns Width storage.
 */
export function fontMeasureWidths(buffer: FontMeasureBuffer): Int32Array {
  return mapping(buffer).storage.widths;
}

/**
 * Reusable native UTF-8, offset and width storage for font measurement.
 *
 * @zh 用于字体测量的可复用原生 UTF-8、边界索引和宽度存储。
 * @ja フォント計測用の再利用可能なネイティブ UTF-8、境界、幅の領域。
 * @ko 글꼴 측정을 위한 재사용 가능한 네이티브 UTF-8, 경계 및 너비 저장소입니다.
 * @remarks Capacities are fixed. Native measurement validates all active
 * slices, then overwrites active widths in place. Escaped views retain storage
 * after collection and shutdown. Direct writers supply an explicit row count
 * to FontEngineInterface.measureStrings.
 * @zh 容量固定。原生测量先校验所有有效片段，再就地覆盖有效宽度。视图在回收和
 * 关闭后保活存储。直接写入视图时向 measureStrings 指定有效行数。
 * @ja 容量は固定です。全有効区間を検証して幅を上書きします。ビューは回収と終了
 * 後も領域を保持します。直接書く場合は measureStrings に行数を指定します。
 * @ko 용량은 고정됩니다. 유효 구간을 모두 검증한 뒤 너비를 덮어씁니다. 뷰는 회수와
 * 종료 후에도 저장소를 유지합니다. 직접 쓸 때는 measureStrings에 행 수를 지정합니다.
 */
export class FontMeasureBuffer {
  /**
   * Allocate fixed native arrays once.
   *
   * @zh 一次分配固定原生数组。
   * @ja 固定ネイティブ配列を一度だけ確保します。
   * @ko 고정 네이티브 배열을 한 번 할당합니다.
   * @param capacity - Maximum rows, an integer from zero to 2147483647.
   * @zh capacity - 最大行数，0–2147483647 的整数。
   * @ja capacity - 最大行数。0〜2147483647 の整数。
   * @ko capacity - 최대 행 수이며 0~2147483647의 정수입니다.
   * @param byteCapacity - Maximum packed UTF-8 bytes in the same range.
   * @zh byteCapacity - 打包 UTF-8 的最大字节数，范围相同。
   * @ja byteCapacity - UTF-8 の最大バイト数。同じ範囲です。
   * @ko byteCapacity - 같은 범위의 최대 UTF-8 바이트 수입니다.
   */
  constructor(capacity: number, byteCapacity: number) {
    const storage = native.createFontMeasureBuffer(capacity, byteCapacity);
    markAsUntransferable(storage.bytes.buffer);
    markAsUntransferable(storage.offsets.buffer);
    markAsUntransferable(storage.widths.buffer);
    buffers.set(this, {
      storage,
      length: 0,
      byteLength: 0,
    });
  }

  /**
   * Shared packed UTF-8 bytes; unused capacity is not measured.
   *
   * @zh 共享打包 UTF-8 字节；不测量未使用的容量。
   * @ja 共有 UTF-8 バイト。未使用の領域は計測しません。
   * @ko 공유 UTF-8 바이트이며 사용하지 않은 용량은 측정하지 않습니다.
   * @returns Fixed writable byte view.
   * @zh 固定可写字节视图。
   * @ja 固定の書き込み可能なバイトビュー。
   * @ko 고정 쓰기 가능한 바이트 뷰입니다.
   */
  get bytes(): Uint8Array {
    return mapping(this).storage.bytes;
  }

  /**
   * Shared row boundaries, starting at zero and monotonically increasing.
   *
   * @zh 共享行边界，从零开始单调递增，允许相等。
   * @ja ゼロから始まる共有行境界。同じ値を許す単調増加です。
   * @ko 0부터 시작하는 공유 행 경계이며 같은 값을 허용하는 단조 증가입니다.
   * @returns Capacity plus one uint32 offsets.
   * @zh 长度为容量加一的 uint32 边界索引。
   * @ja 容量に 1 を加えた長さの uint32 境界。
   * @ko 용량보다 하나 더 긴 uint32 경계입니다.
   */
  get offsets(): Uint32Array {
    return mapping(this).storage.offsets;
  }

  /**
   * Shared int32 output reused by every measurement.
   *
   * @zh 每次测量复用的共享 int32 输出。
   * @ja 毎回の計測で再利用する共有 int32 出力。
   * @ko 모든 측정에서 재사용하는 공유 int32 출력입니다.
   * @returns Width view; inactive rows retain their previous values.
   * @zh 宽度视图；无效行保留原值。
   * @ja 幅のビュー。非対象行は以前の値を保持します。
   * @ko 너비 뷰이며 비활성 행은 이전 값을 유지합니다.
   */
  get widths(): Int32Array {
    return mapping(this).storage.widths;
  }

  /**
   * Number of rows written with append.
   *
   * @zh 通过 append 写入的行数。
   * @ja append で書いた行数。
   * @ko append로 작성한 행 수입니다.
   * @returns Default active measurement count.
   * @zh 默认的有效测量行数。
   * @ja 計測対象行数の既定値。
   * @ko 기본 활성 측정 행 수입니다.
   */
  get length(): number {
    return mapping(this).length;
  }

  /**
   * Reset the append cursor without reallocating or clearing output.
   *
   * @zh 重置追加位置，不重新分配或清空输出。
   * @ja 再確保や出力消去をせず、追加位置をリセットします。
   * @ko 재할당하거나 출력을 지우지 않고 추가 위치를 초기화합니다.
   */
  clear(): void {
    const state = mapping(this);
    state.length = 0;
    state.byteLength = 0;
    state.storage.offsets[0] = 0;
  }

  /**
   * Encode one string directly into the native byte view.
   *
   * @zh 将一个字符串直接编码到原生字节视图。
   * @ja 文字列をネイティブのバイトビューに直接エンコードします。
   * @ko 문자열 하나를 네이티브 바이트 뷰에 직접 인코딩합니다.
   * @param string - Text; isolated UTF-16 surrogates become U+FFFD.
   * @zh string - 文本；孤立 UTF-16 代理项转换为 U+FFFD。
   * @ja string - テキスト。孤立 UTF-16 サロゲートは U+FFFD に変換します。
   * @ko string - 텍스트이며 단독 UTF-16 서로게이트는 U+FFFD로 변환됩니다.
   * @throws RangeError when row or byte capacity is exhausted; the logical
   * length and active slices remain unchanged.
   * @zh 容量耗尽时抛出 RangeError；逻辑长度及有效片段不变。
   * @ja 容量不足時は RangeError。論理長と有効区間は変更しません。
   * @ko 용량 부족 시 RangeError를 던지며 논리 길이와 유효 구간은 유지됩니다.
   */
  append(string: string): void {
    if (typeof string !== 'string') {
      throw new TypeError('Expected a font string');
    }
    const state = mapping(this);
    const { bytes, offsets, widths } = state.storage;
    if (state.length >= widths.length) {
      throw new RangeError('Font measurement row capacity is exhausted');
    }
    const start = state.byteLength;
    if (start > bytes.length) {
      throw new RangeError('Font measurement byte capacity is exhausted');
    }
    const { read, written } = encoder.encodeInto(string, bytes.subarray(start));
    if (read !== string.length) {
      throw new RangeError('Font measurement byte capacity is exhausted');
    }
    state.byteLength = start + written;
    offsets[++state.length] = state.byteLength;
  }
}
