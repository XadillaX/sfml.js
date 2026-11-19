import { native, type NativeElementCommands } from '../../internal/native';
import { markAsUntransferable } from 'node:worker_threads';
import type { Context } from '../../runtime/context';
import type { Element } from './element';

/**
 * Ordered numeric operations consumed by ElementCommandBuffer.submit.
 *
 * @zh ElementCommandBuffer.submit 按顺序消费的数值操作。
 * @ja ElementCommandBuffer.submit が順に処理する数値操作。
 * @ko ElementCommandBuffer.submit이 순서대로 처리하는 수치 작업입니다.
 */
export enum ElementCommandOpcode {
  /**
   * Set a typed numeric property without string parsing.
   *
   * @zh 设置类型化数值属性，无需字符串解析。
   * @ja 文字列解析なしで型付き数値プロパティを設定します。
   * @ko 문자열 파싱 없이 형식화된 수치 속성을 설정합니다.
   */
  SetNumeric = 1,
  /**
   * Remove an inline property.
   *
   * @zh 移除内联属性。
   * @ja インラインプロパティを削除します。
   * @ko 인라인 속성을 제거합니다.
   */
  RemoveProperty = 2,
  /**
   * Read the current numeric property, including inherited values.
   *
   * @zh 读取当前数值属性，包含继承值。
   * @ja 継承値を含む現在の数値プロパティを読みます。
   * @ko 상속 값을 포함한 현재 수치 속성을 읽습니다.
   */
  GetNumeric = 3,
  /**
   * Read the local numeric property without inheritance.
   *
   * @zh 读取不含继承值的局部数值属性。
   * @ja 継承を除くローカル数値プロパティを読みます。
   * @ko 상속을 제외한 로컬 수치 속성을 읽습니다.
   */
  GetLocalNumeric = 4,
  /**
   * Resolve number/unit against the corresponding base value.
   *
   * @zh 根据对应基准值解析数值和单位。
   * @ja 対応する基準値で数値と単位を解決します。
   * @ko 해당 기준값으로 수치와 단위를 해석합니다.
   */
  ResolveNumeric = 5,
  /**
   * Resolve a length to pixels.
   *
   * @zh 将长度解析为像素。
   * @ja 長さをピクセルに解決します。
   * @ko 길이를 픽셀로 해석합니다.
   */
  ResolveLength = 6,
  /**
   * Set a numeric property directly on native ElementStyle.
   *
   * @zh 直接在原生 ElementStyle 上设置数值属性。
   * @ja ElementStyle に数値属性を直接設定します。
   * @ko ElementStyle에 수치 속성을 직접 설정합니다.
   */
  StyleSetNumeric = 7,
  /**
   * Remove an inline property directly from native ElementStyle.
   *
   * @zh 直接从原生 ElementStyle 移除内联属性。
   * @ja ElementStyle からインライン属性を直接削除します。
   * @ko ElementStyle에서 인라인 속성을 직접 제거합니다.
   */
  StyleRemoveProperty = 8,
  /**
   * Read a resolved numeric property directly from native ElementStyle.
   *
   * @zh 直接读取原生 ElementStyle 已解析数值属性。
   * @ja ElementStyle の解決済み数値属性を直接読みます。
   * @ko ElementStyle의 해석된 수치 속성을 직접 읽습니다.
   */
  StyleGetNumeric = 9,
  /**
   * Read an unresolved local numeric property from native ElementStyle.
   *
   * @zh 读取原生 ElementStyle 未解析的局部数值属性。
   * @ja ElementStyle の未解決ローカル数値属性を読みます。
   * @ko ElementStyle의 미해석 로컬 수치 속성을 읽습니다.
   */
  StyleGetLocalNumeric = 10,
  /**
   * Resolve a native style numeric value using bases.
   *
   * @zh 使用 bases 解析原生样式数值。
   * @ja bases を使いネイティブスタイル数値を解決します。
   * @ko bases로 네이티브 스타일 수치를 해석합니다.
   */
  StyleResolveNumeric = 11,
  /**
   * Resolve relative length; properties holds a RelativeTarget from 0 to 5.
   *
   * @zh 解析相对长度；properties 存储 0–5 的 RelativeTarget。
   * @ja 相対長を解決します。properties に RelativeTarget の 0–5 を保存します。
   * @ko 상대 길이를 해석하며 properties에 0–5의 RelativeTarget을 저장합니다.
   */
  StyleResolveRelativeLength = 12,
}

/**
 * Per-command numeric query result.
 *
 * @zh 每条数值查询命令的结果状态。
 * @ja 数値照会コマンドごとの結果状態。
 * @ko 수치 조회 명령별 결과 상태입니다.
 */
export enum ElementCommandStatus {
  /**
   * No numeric output, or an operation failed.
   *
   * @zh 没有数值输出，或操作失败。
   * @ja 数値出力なし、または操作失敗。
   * @ko 수치 출력이 없거나 작업이 실패했습니다.
   */
  None = 0,
  /**
   * A finite number and unit were written.
   *
   * @zh 已写入有限数及其单位。
   * @ja 有限の数値と単位を書き込みました。
   * @ko 유한한 수치와 단위를 기록했습니다.
   */
  Numeric = 1,
  /**
   * No property exists for the selector.
   *
   * @zh 选择器对应的属性不存在。
   * @ja 指定したプロパティが存在しません。
   * @ko 선택한 속성이 존재하지 않습니다.
   */
  Missing = 2,
  /**
   * The selected property is not numeric.
   *
   * @zh 选定属性不是数值属性。
   * @ja 指定したプロパティは数値ではありません。
   * @ko 선택한 속성이 수치 속성이 아닙니다.
   */
  NonNumeric = 3,
}

const buffers = new WeakMap<ElementCommandBuffer, NativeElementCommands>();

/**
 * Resolve a checked retained mapping without entering Native.
 *
 * @internal
 * @param buffer - Command wrapper.
 * @returns Retained native mapping.
 */
function mapping(buffer: ElementCommandBuffer): NativeElementCommands {
  const result = buffers.get(buffer);
  if (!result) {
    throw new TypeError('Expected an ElementCommandBuffer');
  }
  return result;
}

/**
 * Retain mappings without permitting transfer to detach native command inputs.
 *
 * @internal
 * @param value - Fresh native planes.
 * @returns Protected mapping.
 */
function protect(value: NativeElementCommands): NativeElementCommands {
  for (const view of Object.values(value)) {
    if (ArrayBuffer.isView(view)) {
      markAsUntransferable(view.buffer);
    }
  }
  return value;
}

/**
 * Native-owned numeric command planes with a registered element slot table.
 *
 * @zh Native 持有的数值命令平面，配合预注册元素槽位表。
 * @ja 登録済み要素スロット表を持つネイティブ所有の数値コマンド領域。
 * @ko 등록된 요소 슬롯 테이블을 사용하는 네이티브 소유 수치 명령 영역입니다.
 * @remarks
 * Write the retained TypedArrays, then submit a prefix in one Native call.
 * The entire prefix is validated and copied to retained Native scratch before
 * execution. Queries observe preceding commands. Numeric inputs require a
 * finite float32 and a single applicable Unit. Missing/non-numeric properties
 * produce NaN and Unit.UNKNOWN with an explicit outputStatus.
 * consumed counts only completed commands; prevalidation errors leave it zero.
 * Runtime failures preserve the completed prefix and throw.
 * The handle retains registered elements and context through GC-visible edges.
 * Views retain bytes only, safely surviving collection, reserve and shutdown.
 * Submission is permitted in data-view/event callbacks; value, parser,
 * instancer and render callbacks cannot submit. Recursive use of the same
 * buffer while consuming is rejected.
 * @zh 写入保留的 TypedArray 后，一次原生调用提交前缀。执行前校验整个前缀，
 * 并复制到保留的 Native 暂存区。查询可见前面的命令结果。输入要求有限 float32
 * 及单个适用 Unit。缺失或非数值属性输出 NaN、Unit.UNKNOWN 和明确状态。
 * consumed 仅计已完成命令；预校验失败为零，运行时失败保留已完成前缀并抛错。
 * 句柄通过 GC 可见边保活元素和上下文；视图仅保留字节，回收、扩容或关闭后仍安全。
 * 数据 view 和事件回调可提交；数值、解析器、实例化和渲染回调不可提交。
 * 消费期间禁止递归使用同一缓冲区。
 * @ja 配列を書いて 1 回の呼び出しで前方部分を送信します。全入力を検証し、
 * 保持済み領域にコピーしてから順に処理します。照会は先行操作を反映します。
 * 数値は有限 float32 と単一の適用可能 Unit が必要です。不在・非数値は NaN と
 * Unit.UNKNOWN、明示した状態を返します。consumed は完了分のみで、
 * 検証失敗はゼロ、実行失敗は完了分を保持して例外を投げます。
 * GC 可視の参照で要素とコンテキストを保持し、ビューはバイトのみを保持します。
 * 回収・拡張・終了後も安全です。view・イベント内で送信できますが、
 * 値・パーサー・インスタンサー・描画内では不可。同じ領域の再入を拒否します。
 * @ko 배열을 쓴 뒤 한 번의 호출로 앞부분을 제출합니다. 전체 입력을 검증하고
 * 유지된 네이티브 임시 영역에 복사한 뒤 순서대로 처리합니다. 조회는 앞선 작업을
 * 반영합니다. 유한한 float32와 적용 가능한 단일 Unit이 필요합니다.
 * 없거나 수치가 아닌 속성은 NaN, Unit.UNKNOWN과 명시적인 상태를 반환합니다.
 * consumed는 완료한 명령만 세며 검증 실패는 0, 실행 실패는 완료분을 보존하고
 * 예외를 던집니다. GC에 보이는 참조로 요소와 컨텍스트를 유지합니다.
 * 뷰는 바이트만 유지하므로 수집·확장·종료 후에도 안전합니다.
 * view·이벤트 안에서는 제출할 수 있으나 값·파서·인스턴서·렌더 안에서는 불가하며
 * 같은 버퍼의 재진입을 거부합니다.
 */
export class ElementCommandBuffer {
  /**
   * Allocate retained planes and register element slots once.
   *
   * @zh 分配保留平面并一次性注册元素槽位。
   * @ja 領域を確保し、要素スロットを一度登録します。
   * @ko 유지할 영역을 할당하고 요소 슬롯을 한 번 등록합니다.
   * @param context - Owning context.
   * @zh context - 所属上下文。
   * @ja context - 所属コンテキスト。
   * @ko context - 소유 컨텍스트입니다.
   * @param elements - Elements in slot order, all attached to this context.
   * @zh elements - 按槽位排列的元素，均须属于该上下文。
   * @ja elements - スロット順の要素。全てこのコンテキストに所属。
   * @ko elements - 슬롯 순서의 요소이며 모두 이 컨텍스트에 속해야 합니다.
   * @param capacity - Maximum prefix length; defaults to the element count.
   * @zh capacity - 最大前缀长度，默认为元素数。
   * @ja capacity - 最大送信数。既定値は要素数。
   * @ko capacity - 최대 제출 수이며 기본값은 요소 수입니다.
   */
  constructor(
    context: Context, elements: readonly Element[], capacity = elements.length,
  ) {
    buffers.set(this, protect(native.createElementCommands(
      context.handle, elements.map(element => element.handle), capacity,
    )));
  }

  /**
   * Retained command capacity.
   *
   * @zh 保留的命令容量。
   * @ja 保持済みのコマンド容量。
   * @ko 유지된 명령 용량입니다.
   * @returns Maximum prefix length.
   * @zh 最大前缀长度。
   * @ja 最大送信数。
   * @ko 최대 제출 수입니다.
   */
  get capacity(): number {
    return mapping(this).capacity;
  }

  /**
   * Input ElementCommandOpcode for each command.
   *
   * @zh 每条命令的输入 ElementCommandOpcode。
   * @ja 各コマンドの入力 ElementCommandOpcode。
   * @ko 각 명령의 입력 ElementCommandOpcode입니다.
   * @returns Retained opcode plane.
   * @zh 保留的操作码平面。
   * @ja 保持済み操作コード領域。
   * @ko 유지된 작업 코드 영역입니다.
   */
  get opcodes(): Uint8Array {
    return mapping(this).opcodes;
  }

  /**
   * Input registered element slot for each command.
   *
   * @zh 每条命令的预注册元素槽位。
   * @ja 各コマンドの登録済み要素スロット。
   * @ko 각 명령의 등록된 요소 슬롯입니다.
   * @returns Retained slot plane.
   * @zh 保留的槽位平面。
   * @ja 保持済みスロット領域。
   * @ko 유지된 슬롯 영역입니다.
   */
  get elements(): Uint32Array {
    return mapping(this).elements;
  }

  /**
   * Input PropertyId for property commands; ignored by resolution commands.
   *
   * @zh 属性命令的 PropertyId 输入；解析命令忽略此字段。
   * @ja プロパティ操作の PropertyId 入力。解決操作では無視します。
   * @ko 속성 명령의 PropertyId 입력이며 해석 명령에서는 무시합니다.
   * @returns Retained property selector plane.
   * @zh 保留的属性选择器平面。
   * @ja 保持済みプロパティ選択領域。
   * @ko 유지된 속성 선택 영역입니다.
   */
  get properties(): Uint32Array {
    return mapping(this).properties;
  }

  /**
   * Input single numeric Unit for set and resolution commands.
   *
   * @zh 设置及解析命令的单个数值 Unit 输入。
   * @ja 設定・解決操作の単一数値 Unit 入力。
   * @ko 설정·해석 명령의 단일 수치 Unit 입력입니다.
   * @returns Retained unit plane.
   * @zh 保留的单位平面。
   * @ja 保持済み単位領域。
   * @ko 유지된 단위 영역입니다.
   */
  get units(): Int32Array {
    return mapping(this).units;
  }

  /**
   * Input float32 number for set and resolution commands.
   *
   * @zh 设置及解析命令的 float32 数值输入。
   * @ja 設定・解決操作の float32 数値入力。
   * @ko 설정·해석 명령의 float32 수치 입력입니다.
   * @returns Retained numeric plane.
   * @zh 保留的数值平面。
   * @ja 保持済み数値領域。
   * @ko 유지된 수치 영역입니다.
   */
  get numbers(): Float32Array {
    return mapping(this).numbers;
  }

  /**
   * Input base value for ResolveNumeric, including percentage resolution.
   *
   * @zh ResolveNumeric 的基准值输入，包含百分比解析。
   * @ja パーセント解決を含む ResolveNumeric の基準値入力。
   * @ko 백분율 해석을 포함한 ResolveNumeric의 기준값 입력입니다.
   * @returns Retained base-value plane.
   * @zh 保留的基准值平面。
   * @ja 保持済み基準値領域。
   * @ko 유지된 기준값 영역입니다.
   */
  get bases(): Float32Array {
    return mapping(this).bases;
  }

  /**
   * Numeric outputs at the corresponding command indices.
   *
   * @zh 对应命令索引上的数值输出。
   * @ja 対応するコマンド位置の数値出力。
   * @ko 해당 명령 인덱스의 수치 출력입니다.
   * @returns Retained output plane; do not write while submitting.
   * @zh 保留的输出平面；提交期间不可写入。
   * @ja 保持済み出力領域。送信中は書き込まないでください。
   * @ko 유지된 출력 영역이며 제출 중 쓰지 마세요.
   */
  get outputNumbers(): Float32Array {
    return mapping(this).outputNumbers;
  }

  /**
   * Units of query outputs, PX for lengths, NUMBER for resolved numbers.
   *
   * @zh 查询输出的单位；解析长度为 PX，解析数值为 NUMBER。
   * @ja 照会結果の単位。解決した長さは PX、数値は NUMBER。
   * @ko 조회 출력 단위이며 해석한 길이는 PX, 수치는 NUMBER입니다.
   * @returns Retained output unit plane.
   * @zh 保留的输出单位平面。
   * @ja 保持済み出力単位領域。
   * @ko 유지된 출력 단위 영역입니다.
   */
  get outputUnits(): Int32Array {
    return mapping(this).outputUnits;
  }

  /**
   * ElementCommandStatus at each completed command index.
   *
   * @zh 每条已完成命令索引上的 ElementCommandStatus。
   * @ja 完了した各コマンド位置の ElementCommandStatus。
   * @ko 완료한 각 명령 인덱스의 ElementCommandStatus입니다.
   * @returns Retained output status plane.
   * @zh 保留的输出状态平面。
   * @ja 保持済み出力状態領域。
   * @ko 유지된 출력 상태 영역입니다.
   */
  get outputStatus(): Uint8Array {
    return mapping(this).outputStatus;
  }

  /**
   * Number of completed operations from the last submit, including failures.
   *
   * @zh 上次提交已完成的操作数，失败后也可读取。
   * @ja 前回送信の完了操作数。失敗後も読み取れます。
   * @ko 마지막 제출의 완료 작업 수이며 실패 후에도 읽을 수 있습니다.
   * @returns Completed prefix length.
   * @zh 已完成前缀长度。
   * @ja 完了した前方部分の長さ。
   * @ko 완료한 앞부분의 길이입니다.
   */
  get consumed(): number {
    return mapping(this).progress[0];
  }

  /**
   * Validate and consume the prefix in one Native entry.
   *
   * @zh 一次 Native 入口校验并消费前缀。
   * @ja 1 回のネイティブ呼び出しで前方部分を検証・処理します。
   * @ko 한 번의 네이티브 진입으로 앞부분을 검증하고 처리합니다.
   * @param count - Prefix length within capacity.
   * @zh count - 容量内的前缀长度。
   * @ja count - 容量内の送信数。
   * @ko count - 용량 내의 제출 수입니다.
   * @returns Completed command count; throws on failure.
   * @zh 已完成命令数；失败时抛出异常。
   * @ja 完了操作数。失敗時は例外を投げます。
   * @ko 완료 명령 수이며 실패 시 예외를 던집니다.
   */
  submit(count: number): number {
    return native.submitElementCommands(mapping(this).handle, count);
  }

  /**
   * Grow retained capacity, preserving existing entries and old view bytes.
   *
   * @zh 扩大保留容量，保留已有条目及旧视图字节。
   * @ja 容量を拡張し、既存の項目と旧ビューのバイトを保持します。
   * @ko 용량을 확장하며 기존 항목과 이전 뷰의 바이트를 유지합니다.
   * @param capacity - Requested capacity; smaller requests do not shrink.
   * @zh capacity - 所需容量；较小请求不会缩容。
   * @ja capacity - 希望容量。小さい要求では縮小しません。
   * @ko capacity - 요청 용량이며 작은 요청은 축소하지 않습니다.
   */
  reserve(capacity: number): void {
    const value = mapping(this);
    const next = native.reserveElementCommands(value.handle, capacity);
    buffers.set(this, protect({
      ...next, handle: value.handle, progress: value.progress,
    }));
  }

  /**
   * Replace the registered element table; queued slots use the new table.
   *
   * @zh 替换整个预注册元素表；已有命令槽位将使用新表。
   * @ja 登録要素表を置換します。既存スロットは新しい表を使います。
   * @ko 등록 요소 테이블 전체를 교체하며 기존 슬롯은 새 테이블을 사용합니다.
   * @param elements - Elements in the same context, in slot order.
   * @zh elements - 同一上下文中按槽位排列的元素。
   * @ja elements - 同じコンテキストのスロット順要素。
   * @ko elements - 같은 컨텍스트의 슬롯 순서 요소입니다.
   */
  replaceElements(elements: readonly Element[]): void {
    native.replaceCommandElements(
      mapping(this).handle, elements.map(element => element.handle),
    );
  }
}

/**
 * Adopt a scheduler's native command mapping without allocating another buffer.
 *
 * @internal
 * @param value - Mapping created with the batch's element slots.
 * @returns Wrapper for the retained mapping.
 */
export function adoptElementCommands(
  value: NativeElementCommands,
): ElementCommandBuffer {
  const buffer = Object.create(
    ElementCommandBuffer.prototype,
  ) as ElementCommandBuffer;
  buffers.set(buffer, protect(value));
  return buffer;
}
