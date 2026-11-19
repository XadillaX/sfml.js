import { native } from '../internal/native';

const handles = new WeakMap<TextInputContext, object>();
const wrappers = new WeakMap<object, TextInputContext>();

/**
 * Character range in Unicode code points, with an exclusive end.
 *
 * @zh Unicode 码点范围，结束位置不包含在内。
 * @ja Unicode コードポイントの範囲。終端は含みません。
 * @ko Unicode 코드 포인트 범위이며 끝 위치는 포함하지 않습니다.
 */
export interface TextInputRange {
  /**
   * First selected character.
   *
   * @zh 首个选中字符。
   * @ja 選択開始。
   * @ko 선택 시작입니다.
   */
  start: number;

  /**
   * Exclusive end.
   *
   * @zh 不含在内的结束位置。
   * @ja 選択終端。
   * @ko 제외되는 끝입니다.
   */
  end: number;
}

/**
 * Projected text-area bounds in screen pixels.
 *
 * @zh 文本区域投影后的屏幕像素边界。
 * @ja テキスト領域のスクリーンピクセル境界。
 * @ko 화면 픽셀로 투영된 텍스트 영역 경계입니다.
 */
export interface TextInputBounds {
  /**
   * Left edge.
   *
   * @zh 左边界。
   * @ja 左端。
   * @ko 왼쪽입니다.
   */
  x: number;

  /**
   * Top edge.
   *
   * @zh 上边界。
   * @ja 上端。
   * @ko 위쪽입니다.
   */
  y: number;

  /**
   * Width.
   *
   * @zh 宽度。
   * @ja 幅。
   * @ko 너비입니다.
   */
  width: number;

  /**
   * Height.
   *
   * @zh 高度。
   * @ja 高さ。
   * @ko 높이입니다.
   */
  height: number;
}

/**
 * Checked native Rml::TextInputContext for a live input or textarea widget.
 *
 * @zh 存活 input 或 textarea 控件的受检原生 Rml::TextInputContext。
 * @ja 有効な input/textarea の検証付き Rml::TextInputContext。
 * @ko 살아 있는 input/textarea의 검사된 Rml::TextInputContext입니다.
 * @remarks
 * Obtain this capability from TextInputHandler callbacks or drainEvents.
 * Blur preserves it; widget destruction, input type changes and shutdown
 * invalidate it. Offsets count Unicode code points, not UTF-16 code units.
 * Native RmlUi implements all editing operations. On supported macOS SFML
 * windows, focus attaches a native IME client; queued Cocoa edits run from
 * Context.processEvent or Context.update. Other OS bridges are unavailable.
 * getBoundingBox describes the widget; candidate placement uses the native
 * caret.
 * @zh 从 TextInputHandler 回调或 drainEvents 获取。失焦不销毁它；
 * 控件销毁、输入类型变化及 shutdown 会使其失效。偏移按 Unicode 码点计算，
 * 不是 UTF-16 代码单元。编辑在 RmlUi 原生实现中执行。在支持的 macOS SFML
 * 窗口中，聚焦会接入原生输入法客户端；Cocoa 编辑队列在 Context.processEvent
 * 或 Context.update 中执行。其他系统尚无原生桥接。getBoundingBox 返回控件
 * 边界，候选框定位使用原生光标位置。
 * @ja TextInputHandler のコールバックまたは drainEvents から取得します。
 * フォーカス解除後も有効ですが、破棄・型変更・終了で無効になります。
 * オフセットは UTF-16 ではなく Unicode コードポイントです。
 * 編集はネイティブ RmlUi が行います。対応する macOS SFML ウィンドウでは
 * フォーカス時に IME クライアントを接続し、Cocoa の編集キューを
 * Context.processEvent または Context.update で実行します。他の OS の
 * ブリッジは未実装です。getBoundingBox はウィジェットの境界を返し、
 * 候補位置にはネイティブのキャレットを使用します。
 * @ko TextInputHandler 콜백이나 drainEvents에서 얻습니다.
 * 포커스 해제 후에도 유효하지만 위젯 파괴, 유형 변경, 종료 시 만료됩니다.
 * 오프셋은 UTF-16이 아닌 Unicode 코드 포인트입니다.
 * 편집은 네이티브 RmlUi에서 수행합니다. 지원되는 macOS SFML 창에서는
 * 포커스 시 IME 클라이언트를 연결하고 Cocoa 편집 큐를 Context.processEvent
 * 또는 Context.update에서 실행합니다. 다른 OS 브리지는 아직 없습니다.
 * getBoundingBox는 위젯 경계를 반환하며 후보 위치는 네이티브 커서를 사용합니다.
 */
export class TextInputContext {
  /** @internal */
  private constructor() {
    throw new TypeError('TextInputContext cannot be constructed directly');
  }

  /**
   * Whether the native widget is still alive; safe after shutdown.
   *
   * @zh 原生控件是否存活；shutdown 后可读取。
   * @ja ネイティブウィジェットの生存状態。終了後も取得可能。
   * @ko 네이티브 위젯의 생존 여부이며 종료 후에도 읽을 수 있습니다.
   * @returns Native validity.
   * @zh 原生有效性。
   * @ja ネイティブの有効性。
   * @ko 네이티브 유효성입니다.
   */
  get isValid(): boolean {
    return native.isTextInputContextValid(textInputContextHandle(this));
  }

  /**
   * Call Rml::TextInputContext::GetBoundingBox.
   *
   * @zh 调用 Rml::TextInputContext::GetBoundingBox。
   * @ja Rml::TextInputContext::GetBoundingBox を呼びます。
   * @ko Rml::TextInputContext::GetBoundingBox를 호출합니다.
   * @returns Screen bounds, or null when native projection fails.
   * @zh 屏幕边界；原生投影失败时为 null。
   * @ja スクリーン境界。投影失敗時は null。
   * @ko 화면 경계이며 투영 실패 시 null입니다.
   */
  getBoundingBox(): TextInputBounds | null {
    return native.textInputGetBoundingBox(textInputContextHandle(this));
  }

  /**
   * Call Rml::TextInputContext::GetSelectionRange.
   *
   * @zh 调用 Rml::TextInputContext::GetSelectionRange。
   * @ja Rml::TextInputContext::GetSelectionRange を呼びます。
   * @ko Rml::TextInputContext::GetSelectionRange를 호출합니다.
   * @returns Current selection in Unicode code points.
   * @zh 当前选区，单位为 Unicode 码点。
   * @ja Unicode コードポイント単位の選択範囲。
   * @ko Unicode 코드 포인트 단위의 현재 선택 범위입니다.
   */
  getSelectionRange(): TextInputRange {
    return native.textInputGetSelectionRange(textInputContextHandle(this));
  }

  /**
   * Call Rml::TextInputContext::SetSelectionRange; unfocused widgets ignore it.
   *
   * @zh 调用 SetSelectionRange；未聚焦控件忽略此操作。
   * @ja SetSelectionRange を呼びます。非フォーカス時は無視されます。
   * @ko SetSelectionRange를 호출하며 포커스가 없으면 무시합니다.
   * @param start - Nonnegative int32 start in code points.
   * @zh start - 非负 int32 码点起点。
   * @ja start - 非負 int32 の開始点。
   * @ko start - 음이 아닌 int32 시작점입니다.
   * @param end - Exclusive nonnegative int32 end, at least start.
   * @zh end - 非负 int32 结束位置，不小于 start。
   * @ja end - start 以上の非負 int32 終端。
   * @ko end - start 이상의 음이 아닌 int32 끝입니다.
   */
  setSelectionRange(start: number, end: number): void {
    native.textInputSetSelectionRange(textInputContextHandle(this), start, end);
  }

  /**
   * Call Rml::TextInputContext::SetCursorPosition.
   *
   * @zh 调用 Rml::TextInputContext::SetCursorPosition。
   * @ja Rml::TextInputContext::SetCursorPosition を呼びます。
   * @ko Rml::TextInputContext::SetCursorPosition을 호출합니다.
   * @param position - Nonnegative int32 code-point position.
   * @zh position - 非负 int32 码点位置。
   * @ja position - 非負 int32 コードポイント位置。
   * @ko position - 음이 아닌 int32 코드 포인트 위치입니다.
   */
  setCursorPosition(position: number): void {
    native.textInputSetCursorPosition(textInputContextHandle(this), position);
  }

  /**
   * Replace a range through native SetText, bypassing maxlength.
   *
   * @zh 通过原生 SetText 替换范围，忽略 maxlength。
   * @ja ネイティブ SetText で範囲を置換し、maxlength を無視します。
   * @ko 네이티브 SetText로 범위를 바꾸며 maxlength를 무시합니다.
   * @param text - Replacement text.
   * @zh text - 替换文本。
   * @ja text - 置換テキスト。
   * @ko text - 바꿀 텍스트입니다.
   * @param start - Nonnegative int32 first code point.
   * @zh start - 非负 int32 起始码点。
   * @ja start - 非負 int32 開始点。
   * @ko start - 음이 아닌 int32 시작점입니다.
   * @param end - Exclusive int32 end, at least start.
   * @zh end - 不小于 start 的 int32 结束位置。
   * @ja end - start 以上の int32 終端。
   * @ko end - start 이상의 int32 끝입니다.
   */
  setText(text: string, start: number, end: number): void {
    native.textInputSetText(textInputContextHandle(this), text, start, end);
  }

  /**
   * Call native SetCompositionRange; [0, 0] clears composition.
   *
   * @zh 调用原生 SetCompositionRange；[0, 0] 清除合成范围。
   * @ja SetCompositionRange を呼びます。[0, 0] は変換範囲を解除します。
   * @ko SetCompositionRange를 호출하며 [0, 0]은 조합 범위를 지웁니다.
   * @param start - Nonnegative int32 first code point.
   * @zh start - 非负 int32 起始码点。
   * @ja start - 非負 int32 開始点。
   * @ko start - 음이 아닌 int32 시작점입니다.
   * @param end - Exclusive int32 end, at least start.
   * @zh end - 不小于 start 的 int32 结束位置。
   * @ja end - start 以上の int32 終端。
   * @ko end - start 이상의 int32 끝입니다.
   */
  setCompositionRange(start: number, end: number): void {
    native.textInputSetCompositionRange(
      textInputContextHandle(this), start, end);
  }

  /**
   * Commit through native CommitComposition and its length restrictions.
   *
   * @zh 通过原生 CommitComposition 提交，并应用其长度限制。
   * @ja ネイティブ CommitComposition と長さ制限で確定します。
   * @ko 네이티브 CommitComposition으로 확정하며 길이 제한을 적용합니다.
   * @param text - Composition text; [0, 0] performs no replacement.
   * @zh text - 合成文本；范围为 [0, 0] 时不替换。
   * @ja text - 変換テキスト。[0, 0] では置換しません。
   * @ko text - 조합 텍스트이며 [0, 0]이면 바꾸지 않습니다.
   */
  commitComposition(text: string): void {
    native.textInputCommitComposition(textInputContextHandle(this), text);
  }
}

/**
 * Resolve the checked input capability.
 *
 * @internal
 * @param input - Input facade.
 * @returns Native capability.
 */
function textInputContextHandle(input: TextInputContext): object {
  const handle = handles.get(input);
  if (!handle) {
    throw new TypeError('Expected a TextInputContext');
  }
  return handle;
}

/**
 * Restore the canonical input facade.
 *
 * @internal
 * @param handle - Native capability.
 * @returns Canonical facade.
 */
export function textInputContextFromNative(handle: object): TextInputContext {
  const existing = wrappers.get(handle);
  if (existing) {
    return existing;
  }
  const result = Object.create(TextInputContext.prototype) as TextInputContext;
  handles.set(result, handle);
  wrappers.set(handle, result);
  return result;
}
