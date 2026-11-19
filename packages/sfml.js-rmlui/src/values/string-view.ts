import { markAsUntransferable } from 'node:worker_threads';
import {
  native, type NativeStringView, type NativeStringIndex,
} from '../internal/native';

interface ViewMapping extends NativeStringView {
  owner: symbol;
  offset: number;
}

const views = new WeakMap<StringView, ViewMapping>();
const indices = new WeakMap<StringView, NativeStringIndex>();

/**
 * Read one cached native index snapshot for managed iteration.
 *
 * @internal
 * @param view - Retained byte view.
 * @returns Private native-owned snapshot.
 */
function stringIndex(view: StringView): NativeStringIndex {
  let result = indices.get(view);
  if (!result) {
    result = native.stringViewIndex(stringViewMapping(view).handle);
    markAsUntransferable(result.offsets.buffer);
    markAsUntransferable(result.characters.buffer);
    indices.set(view, result);
  }

  return result;
}

/**
 * Rml::StringView with immutable native backing retained by every slice.
 *
 * @zh Rml::StringView，每个切片均保活不可变原生存储。
 * @ja 各スライスが不変ネイティブ領域を保持する Rml::StringView。
 * @ko 각 슬라이스가 불변 네이티브 저장소를 유지하는 Rml::StringView입니다.
 * @remarks
 * All positions and lengths use bytes. Partial UTF-8 slices are allowed.
 * Byte snapshots are independently writable and never alter the owner.
 * @zh 所有位置和长度以字节计，允许切出部分 UTF-8；字节快照写入不影响所有者。
 * @ja 位置・長さはバイトで、UTF-8 の途中でも切れます。コピーの変更は独立です。
 * @ko 위치와 길이는 바이트이며 UTF-8 중간 슬라이스도 허용합니다. 복사본 쓰기는 독립적입니다.
 */
export class StringView {
  /**
   * Construct a retained byte view.
   *
   * @zh 构造保活的字节视图。
   * @ja 所有者を保持するバイトビューを構築します。
   * @ko 소유자를 유지하는 바이트 뷰를 생성합니다.
   * @param value - Copied string or retained native view; default ''.
   * @zh value - 复制到原生存储的字符串，或保活的源视图；默认为空字符串。
   * @ja value - コピーする文字列または保持する元ビュー。既定は空文字列です。
   * @ko value - 네이티브로 복사할 문자열 또는 유지할 원본 뷰이며 기본값은 빈 문자열입니다.
   * @param offset - Nonnegative byte offset, default zero.
   * @zh offset - 非负字节偏移，默认为 0。
   * @ja offset - 非負のバイト位置。既定は 0 です。
   * @ko offset - 음수가 아닌 바이트 오프셋이며 기본값은 0입니다.
   * @param count - Byte count, clipped at the end; default all remaining.
   * @zh count - 字节数量，在源末尾截断；省略时取全部剩余字节。
   * @ja count - 末尾で切り詰めるバイト数。省略時は残りの全バイトです。
   * @ko count - 원본 끝에서 제한되는 바이트 수이며 생략하면 남은 전체 바이트입니다.
   */
  constructor(value: StringView | string = '', offset = 0, count?: number) {
    const parent = typeof value === 'string'
      ? undefined : stringViewMapping(value);
    const source = parent ? parent.handle : value as string;
    const result = native.createStringView(source, offset, count);
    views.set(this, {
      ...result,
      owner: parent?.owner ?? Symbol('native string owner'),
      offset: (parent?.offset ?? 0) + offset,
    });
  }

  /**
   * Represent Rml::StringView::begin as a view-relative byte position.
   *
   * @zh 将 Rml::StringView::begin 表达为视图内字节位置。
   * @ja Rml::StringView::begin をビュー内のバイト位置で表します。
   * @ko Rml::StringView::begin을 뷰 내부 바이트 위치로 표현합니다.
   * @returns Zero, including for an empty view.
   * @zh 始终返回 0，包括空视图。
   * @ja 空ビューでも 0 を返します。
   * @ko 빈 뷰에서도 0을 반환합니다.
   */
  begin(): number {
    stringViewMapping(this);
    return 0;
  }

  /**
   * Represent Rml::StringView::end as a view-relative byte position.
   *
   * @zh 将 Rml::StringView::end 表达为视图内字节位置。
   * @ja Rml::StringView::end をビュー内のバイト位置で表します。
   * @ko Rml::StringView::end를 뷰 내부 바이트 위치로 표현합니다.
   * @returns Byte length; the end position cannot be dereferenced.
   * @zh 字节长度；末尾位置不可解引用。
   * @ja バイト長。末尾の位置は参照できません。
   * @ko 바이트 길이이며 끝 위치는 역참조할 수 없습니다.
   */
  end(): number {
    return this.size();
  }

  /**
   * Read Rml::StringView::size without a native call.
   *
   * @zh 无需原生调用读取 Rml::StringView::size。
   * @ja ネイティブ呼び出しなしで Rml::StringView::size を取得します。
   * @ko 네이티브 호출 없이 Rml::StringView::size를 읽습니다.
   * @returns Byte length.
   * @zh 字节长度。
   * @ja バイト長。
   * @ko 바이트 길이입니다.
   */
  size(): number {
    return stringViewMapping(this).length;
  }

  /**
   * Check whether this UTF-8 view contains no bytes.
   *
   * @zh 查询此 UTF-8 视图是否不含字节。
   * @ja この UTF-8 ビューにバイトがないかを調べます。
   * @ko 이 UTF-8 뷰에 바이트가 없는지 확인합니다.
   * @returns Whether this view has no bytes.
   * @zh 视图是否没有字节。
   * @ja ビューが空かどうか。
   * @ko 뷰가 비어 있는지 여부입니다.
   */
  empty(): boolean {
    return this.size() === 0;
  }

  /**
   * Copy the view using Rml::StringView's String conversion.
   *
   * @zh 通过 Rml::StringView 的 String 转换复制视图。
   * @ja Rml::StringView の String 変換でビューをコピーします。
   * @ko Rml::StringView의 String 변환으로 뷰를 복사합니다.
   * @returns UTF-8 decoded text, replacing incomplete or invalid UTF-8.
   * @zh UTF-8 解码文本，不完整或无效的 UTF-8 使用替换字符。
   * @ja 不完全・無効な UTF-8 を置換した復号テキスト。
   * @ko 불완전하거나 잘못된 UTF-8을 대체 문자로 처리한 텍스트입니다.
   */
  toString(): string {
    return native.stringViewText(stringViewMapping(this).handle);
  }

  /**
   * Copy all bytes into an independently owned native snapshot.
   *
   * @zh 复制全部字节到独立持有的原生快照。
   * @ja 全バイトを独立所有するネイティブコピーへ複製します。
   * @ko 모든 바이트를 독립 소유 네이티브 복사본으로 복사합니다.
   * @returns Writable snapshot that preserves incomplete UTF-8 and NUL.
   * @zh 保留不完整 UTF-8 和 NUL 的可写快照。
   * @ja 不完全な UTF-8 と NUL を保持する書き込み可能なコピー。
   * @ko 불완전한 UTF-8과 NUL을 보존하는 쓰기 가능한 복사본입니다.
   */
  toBytes(): Uint8Array {
    const result = native.stringViewBytes(stringViewMapping(this).handle);
    markAsUntransferable(result.buffer);
    return result;
  }

  /**
   * Create another view retaining this same immutable native owner.
   *
   * @zh 创建保活同一不可变原生所有者的视图。
   * @ja 同じ不変ネイティブ所有者を保持するビューを作ります。
   * @ko 같은 불변 네이티브 소유자를 유지하는 뷰를 만듭니다.
   * @param offset - Byte offset inside this view.
   * @zh offset - 此视图内的字节偏移。
   * @ja offset - このビュー内のバイト位置。
   * @ko offset - 이 뷰 내부의 바이트 오프셋입니다.
   * @param count - Byte count, clipped at the end; default all remaining.
   * @zh count - 字节数量，在末尾截断；省略时取剩余全部字节。
   * @ja count - 末尾で切り詰めるバイト数。省略時は残り全部です。
   * @ko count - 끝에서 제한되는 바이트 수이며 생략하면 남은 전체 바이트입니다.
   * @returns Retained byte slice.
   * @zh 保活的字节切片。
   * @ja 所有者を保持するバイトスライス。
   * @ko 소유자를 유지하는 바이트 슬라이스입니다.
   */
  subview(offset: number, count?: number): StringView {
    return new StringView(this, offset, count);
  }

  /**
   * Compare every byte with Rml::StringView::operator==.
   *
   * @zh 用 Rml::StringView::operator== 比较全部字节。
   * @ja Rml::StringView::operator== で全バイトを比較します。
   * @ko Rml::StringView::operator==로 모든 바이트를 비교합니다.
   * @param other - Other view or UTF-8 string.
   * @zh other - 另一个视图或 UTF-8 字符串。
   * @ja other - 比較するビューまたは UTF-8 文字列。
   * @ko other - 비교할 뷰 또는 UTF-8 문자열입니다.
   * @returns Byte equality including bytes after NUL.
   * @zh 包括 NUL 后字节在内的相等结果。
   * @ja NUL の後も含めたバイトの一致。
   * @ko NUL 뒤의 바이트까지 포함한 일치 여부입니다.
   */
  equals(other: StringView | string): boolean {
    return native.stringViewOperation(
      stringViewMapping(this).handle, 'equals',
      stringViewMapping(other).handle);
  }
}

/**
 * Resolve a retained immutable byte owner.
 *
 * @internal
 * @param value - Public view or string.
 * @returns Checked native mapping.
 */
export function stringViewMapping(
  value: StringView | string,
): ViewMapping {
  const view = typeof value === 'string' ? new StringView(value) : value;
  const result = views.get(view);
  if (!result) {
    throw new TypeError('Expected a StringView or string');
  }

  return result;
}

/**
 * Managed Rml::StringIteratorU8 with one cached native index per byte view.
 *
 * @zh 托管 Rml::StringIteratorU8，每个字节视图复用一次原生索引。
 * @ja バイトビューごとに一つの索引を使う管理 Rml::StringIteratorU8。
 * @ko 바이트 뷰당 네이티브 인덱스 하나를 재사용하는 관리형 반복자입니다.
 * @remarks
 * Movement and dereference use private snapshots with no native calls.
 * Before-begin and end sentinels are numeric offsets, never invalid pointers.
 * @zh 移动与解引用读取私有快照，不调用原生；头前和末尾哨兵仅为数值偏移。
 * @ja 移動・参照に呼び出しはなく、番兵は無効ポインターでなく数値です。
 * @ko 이동과 역참조에 호출이 없으며 센티널은 무효 포인터가 아닌 숫자입니다.
 */
export class StringIteratorU8 {
  #view: StringView;
  #index: NativeStringIndex;
  #position: number;

  /**
   * Construct an iterator at a checked UTF-8 byte boundary.
   *
   * @zh 在经校验的 UTF-8 字节边界构造迭代器。
   * @ja 検証した UTF-8 バイト境界に反復子を構築します。
   * @ko 검증한 UTF-8 바이트 경계에 반복자를 생성합니다.
   * @param value - Source retained for the iterator's entire lifetime.
   * @zh value - 在迭代器整个生命周期内保活的源。
   * @ja value - 反復子の存続中に保持する元データ。
   * @ko value - 반복자의 전체 수명 동안 유지할 원본입니다.
   * @param offset - Start byte offset, default zero.
   * @zh offset - 起始字节偏移，默认为 0，须为索引边界。
   * @ja offset - 索引境界にある開始バイト位置。既定は 0 です。
   * @ko offset - 인덱스 경계의 시작 바이트 오프셋이며 기본값은 0입니다.
   * @param count - Limit end to offset plus count; default the source end.
   * @zh count - 按原生构造将末尾限制为 offset 加 count；省略时使用源末尾。
   * @ja count - 末尾を offset と count の和までに制限。省略時は元データ末尾です。
   * @ko count - 끝을 offset과 count의 합으로 제한하며 생략하면 원본 끝을 사용합니다.
   */
  constructor(value: StringView | string, offset = 0, count?: number) {
    const source = typeof value === 'string' ? new StringView(value) : value;
    if (!Number.isInteger(offset) || offset < 0 || offset > source.size()) {
      throw new RangeError('Iterator offset is outside the byte view');
    }
    if (count !== undefined &&
        (!Number.isInteger(count) || count < 0 || count > 0x7fffffff)) {
      throw new RangeError('Iterator count is outside the native range');
    }

    this.#view = count === undefined
      ? source : source.subview(0, Math.min(source.size(), offset + count));
    this.#index = stringIndex(this.#view);
    this.#position = this.#index.offsets.indexOf(offset);
    if (this.#position < 0) {
      throw new RangeError('Iterator offset must be a UTF-8 byte boundary');
    }
  }

  /**
   * Read the native iterator validity contract.
   *
   * @zh 读取原生迭代器有效性契约。
   * @ja ネイティブ反復子の有効性契約を取得します。
   * @ko 네이티브 반복자의 유효성 계약을 읽습니다.
   * @returns Whether the current position can be dereferenced.
   * @zh 当前位置是否可解引用。
   * @ja 現在位置を参照できるかどうか。
   * @ko 현재 위치를 역참조할 수 있는지 여부입니다.
   */
  valid(): boolean {
    return this.#position >= 0 &&
      this.#position < this.#index.characters.length;
  }

  /**
   * Read the cached Rml::StringIteratorU8 dereference value.
   *
   * @zh 读取缓存的 Rml::StringIteratorU8 解引用值。
   * @ja キャッシュした Rml::StringIteratorU8 の参照値を取得します。
   * @ko 캐시한 Rml::StringIteratorU8 역참조 값을 읽습니다.
   * @returns Native codepoint, or zero for a malformed character.
   * @zh 原生码点；无效字符返回 0。
   * @ja ネイティブコードポイント。不正な文字では 0 です。
   * @ko 네이티브 코드포인트이며 잘못된 문자이면 0입니다.
   */
  value(): number {
    if (!this.valid()) {
      throw new RangeError('Iterator cannot dereference a sentinel');
    }

    return this.#index.characters[this.#position];
  }

  /**
   * Advance with the native operator++ boundary rules.
   *
   * @zh 按原生 operator++ 边界规则向前移动。
   * @ja ネイティブ operator++ の境界規則で前進します。
   * @ko 네이티브 operator++ 경계 규칙으로 앞으로 이동합니다.
   * @returns This iterator; advancing end throws.
   * @zh 此迭代器；从末尾前进会抛出异常。
   * @ja この反復子。末尾からの前進は例外になります。
   * @ko 이 반복자이며 끝에서 앞으로 이동하면 예외가 발생합니다.
   */
  increment(): this {
    if (this.#position >= this.#index.characters.length) {
      throw new RangeError('Cannot increment the end sentinel');
    }

    if (this.#position < 0 && this.#index.startsWithContinuation) {
      this.#position = 1;
    } else {
      this.#position++;
    }

    return this;
  }

  /**
   * Move backward with the native operator-- boundary rules.
   *
   * @zh 按原生 operator-- 边界规则向后移动。
   * @ja ネイティブ operator-- の境界規則で後退します。
   * @ko 네이티브 operator-- 경계 규칙으로 뒤로 이동합니다.
   * @returns This iterator; decrementing before-begin throws.
   * @zh 此迭代器；从头前哨兵后退会抛出异常。
   * @ja この反復子。開始前の番兵からの後退は例外になります。
   * @ko 이 반복자이며 시작 전 센티널에서 뒤로 이동하면 예외가 발생합니다.
   */
  decrement(): this {
    if (this.#position < 0) {
      throw new RangeError('Cannot decrement the before-begin sentinel');
    }

    this.#position--;
    if (this.#position === 0 && this.#index.startsWithContinuation) {
      this.#position = -1;
    }

    return this;
  }

  /**
   * Read Rml::StringIteratorU8::offset using a safe numeric sentinel.
   *
   * @zh 用安全数值哨兵读取 Rml::StringIteratorU8::offset。
   * @ja 安全な数値番兵で Rml::StringIteratorU8::offset を取得します。
   * @ko 안전한 숫자 센티널로 Rml::StringIteratorU8::offset을 읽습니다.
   * @returns Byte offset, or minus one before the beginning.
   * @zh 字节偏移；位于头前时返回 -1。
   * @ja バイト位置。開始前では -1 です。
   * @ko 바이트 오프셋이며 시작 전에서는 -1입니다.
   */
  offset(): number {
    return this.#position < 0 ? -1 : this.#index.offsets[this.#position];
  }

  /**
   * Resolve native get() as a byte offset inside the retained view.
   *
   * @zh 将原生 get() 表达为保活视图内的字节偏移。
   * @ja ネイティブ get() を保持したビュー内のバイト位置として表します。
   * @ko 네이티브 get()을 유지된 뷰 내부의 바이트 오프셋으로 표현합니다.
   * @returns Current byte offset.
   * @zh 当前字节偏移。
   * @ja 現在のバイト位置。
   * @ko 현재 바이트 오프셋입니다.
   */
  get(): number {
    return this.offset();
  }

  /**
   * Compare iterator positions in the same retained byte view.
   *
   * @zh 比较同一保活字节视图内的迭代器位置。
   * @ja 同じ保持バイトビュー内の反復子位置を比較します。
   * @ko 동일하게 유지된 바이트 뷰 내부의 반복자 위치를 비교합니다.
   * @param other - Other iterator.
   * @zh other - 另一个迭代器。
   * @ja other - 比較する反復子。
   * @ko other - 비교할 반복자입니다.
   * @returns Whether source view and position are identical.
   * @zh 原生所有者与绝对字节位置是否相同。
   * @ja ネイティブ所有者と絶対バイト位置が同じかどうか。
   * @ko 네이티브 소유자와 절대 바이트 위치가 같은지 여부입니다.
   */
  equals(other: StringIteratorU8): boolean {
    const lhs = stringViewMapping(this.#view);
    const rhs = stringViewMapping(other.#view);
    return lhs.owner === rhs.owner &&
      lhs.offset + this.offset() === rhs.offset + other.offset();
  }
}
