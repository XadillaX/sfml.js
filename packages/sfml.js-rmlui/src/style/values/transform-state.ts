import { markAsUntransferable } from 'node:worker_threads';
import { native, type NativeElementTransforms } from '../../internal/native';
import type { Element } from '../../dom/elements/element';

const handles = new WeakMap<TransformState, object>();

/**
 * Resolve a checked native transform-state token.
 *
 * @internal
 * @param value - State wrapper.
 * @returns Native token.
 */
export function transformStateHandle(value: TransformState): object {
  const result = handles.get(value);
  if (!result) {
    throw new TypeError('Expected a TransformState');
  }
  return result;
}

/**
 * Rml::TransformState, independently owned or a read-only element view.
 *
 * @zh Rml::TransformState，独立持有或元素的只读视图。
 * @ja 独立所有または要素の読み取り専用ビューの Rml::TransformState。
 * @ko 독립 소유 또는 요소의 읽기 전용 뷰인 Rml::TransformState입니다.
 * @remarks
 * Matrix reads copy sixteen column-major floats into native-owned storage.
 * Copies outlive the element and runtime. Element views query current state;
 * reads throw after element destruction or removal of its transform state.
 * @zh 矩阵读取复制十六个列主序浮点数到原生存储；副本可在元素及运行时销毁后
 * 使用。元素视图查询当前状态；元素销毁或移除变换状态后，读取抛出异常。
 * @ja 行列は列優先の 16 個の値をネイティブ領域にコピーし、終了後も使えます。
 * 要素ビューは現在の状態を読み、要素または変換状態の削除後は例外になります。
 * @ko 행렬은 열 우선 값 16개를 네이티브 저장소에 복사하며 종료 후에도 사용됩니다.
 * 요소 뷰는 현재 상태를 읽고 요소나 변환 상태가 제거되면 예외를 던집니다.
 */
export class TransformState {
  /**
   * Construct an independent native transform state.
   *
   * @zh 构造独立原生变换状态。
   * @ja 独立したネイティブ変換状態を構築します。
   * @ko 독립적인 네이티브 변환 상태를 생성합니다.
   */
  constructor() {
    handles.set(this, native.createTransformState());
  }

  /**
   * Set Rml::TransformState::SetTransform on an independent state.
   *
   * @zh 对独立状态调用 Rml::TransformState::SetTransform。
   * @ja 独立状態で Rml::TransformState::SetTransform を呼びます。
   * @ko 독립 상태에서 Rml::TransformState::SetTransform을 호출합니다.
   * @param matrix - Sixteen finite column-major floats, or null to clear.
   * @zh matrix - 十六个有限列主序浮点数；null 清除。
   * @ja matrix - 列優先の有限な 16 値。null で解除。
   * @ko matrix - 열 우선 유한 값 16개이며 null은 해제합니다.
   * @returns Whether the native transform changed.
   * @zh 原生变换是否改变。
   * @ja ネイティブ変換が変わったか。
   * @ko 네이티브 변환 변경 여부입니다.
   */
  setTransform(matrix: Float32Array | null): boolean {
    return native.transformStateSetTransform(
      transformStateHandle(this), matrix);
  }

  /**
   * Set Rml::TransformState::SetLocalPerspective on an independent state.
   *
   * @zh 对独立状态调用 Rml::TransformState::SetLocalPerspective。
   * @ja 独立状態で Rml::TransformState::SetLocalPerspective を呼びます。
   * @ko 독립 상태에서 Rml::TransformState::SetLocalPerspective를 호출합니다.
   * @param matrix - Sixteen finite column-major floats, or null to clear.
   * @zh matrix - 十六个有限列主序浮点数；null 清除。
   * @ja matrix - 列優先の有限な 16 値。null で解除。
   * @ko matrix - 열 우선 유한 값 16개이며 null은 해제합니다.
   * @returns Whether the native perspective changed.
   * @zh 原生透视是否改变。
   * @ja ネイティブ透視が変わったか。
   * @ko 네이티브 원근 변경 여부입니다.
   */
  setLocalPerspective(matrix: Float32Array | null): boolean {
    return native.transformStateSetLocalPerspective(
      transformStateHandle(this), matrix);
  }

  /**
   * Copy Rml::TransformState::GetTransform.
   *
   * @zh 复制 Rml::TransformState::GetTransform。
   * @ja Rml::TransformState::GetTransform をコピーします。
   * @ko Rml::TransformState::GetTransform을 복사합니다.
   * @returns Column-major matrix or null when unset.
   * @zh 列主序矩阵；未设置时为 null。
   * @ja 列優先の行列。未設定なら null。
   * @ko 열 우선 행렬이며 설정되지 않으면 null입니다.
   */
  getTransform(): Float32Array | null {
    return native.transformStateGetTransform(transformStateHandle(this));
  }

  /**
   * Copy Rml::TransformState::GetLocalPerspective.
   *
   * @zh 复制 Rml::TransformState::GetLocalPerspective。
   * @ja Rml::TransformState::GetLocalPerspective をコピーします。
   * @ko Rml::TransformState::GetLocalPerspective를 복사합니다.
   * @returns Column-major matrix or null when unset.
   * @zh 列主序矩阵；未设置时为 null。
   * @ja 列優先の行列。未設定なら null。
   * @ko 열 우선 행렬이며 설정되지 않으면 null입니다.
   */
  getLocalPerspective(): Float32Array | null {
    return native.transformStateGetLocalPerspective(transformStateHandle(this));
  }

  /**
   * Copy Rml::TransformState::GetInverseTransform.
   *
   * @zh 复制 Rml::TransformState::GetInverseTransform。
   * @ja Rml::TransformState::GetInverseTransform をコピーします。
   * @ko Rml::TransformState::GetInverseTransform을 복사합니다.
   * @returns Column-major inverse, or null for absent or singular transforms.
   * @zh 列主序逆矩阵；无变换或矩阵奇异时为 null。
   * @ja 列優先の逆行列。未設定・特異行列なら null。
   * @ko 열 우선 역행렬이며 미설정 또는 특이 행렬이면 null입니다.
   */
  getInverseTransform(): Float32Array | null {
    return native.transformStateGetInverseTransform(transformStateHandle(this));
  }
}

/**
 * Wrap a checked borrowed native transform state.
 *
 * @internal
 * @param token - Native state token.
 * @returns Read-only element state wrapper.
 */
export function transformStateFromNative(token: object): TransformState {
  const result = Object.create(TransformState.prototype) as TransformState;
  handles.set(result, token);
  return result;
}

const buffers = new WeakMap<ElementTransformBuffer, NativeElementTransforms>();

/**
 * Resolve native transform-buffer storage.
 *
 * @internal
 * @param value - Buffer wrapper.
 * @returns Native mapping.
 */
function mapping(value: ElementTransformBuffer): NativeElementTransforms {
  const result = buffers.get(value);
  if (!result) {
    throw new TypeError('Expected an ElementTransformBuffer');
  }
  return result;
}

/**
 * Reusable native transform snapshots for many elements in one native entry.
 *
 * @zh 一次进入原生即可读取多个元素的可复用变换快照。
 * @ja 一回のネイティブ呼び出しで複数要素を読む再利用可能な変換コピー。
 * @ko 네이티브 호출 한 번으로 여러 요소를 읽는 재사용 변환 복사본입니다.
 * @remarks
 * Call update/render before refresh. RmlUi computes transforms during render.
 * No JS callbacks or per-element native calls occur during refresh. Numerical
 * views retain storage only; they never retain a document or render manager.
 * @zh RmlUi 在渲染时计算变换，refresh 前调用 update/render。refresh 不产生
 * JS 回调或逐元素原生调用；数值视图仅保活存储，不保活文档或渲染管理器。
 * @ja 変換は描画時に計算するため refresh 前に update/render を呼びます。
 * 更新に JS コールバックや要素別呼び出しはなく、ビューは領域だけを保持します。
 * @ko 변환은 렌더링 시 계산되므로 refresh 전에 update/render를 호출하세요.
 * 갱신에 JS 콜백이나 요소별 호출이 없으며 뷰는 저장소만 유지합니다.
 */
export class ElementTransformBuffer {
  /**
   * Register a fixed element list and allocate native output storage once.
   *
   * @zh 注册固定元素列表，一次性分配原生输出存储。
   * @ja 固定の要素リストを登録し、ネイティブ出力領域を一度確保します。
   * @ko 고정 요소 목록을 등록하고 네이티브 출력 저장소를 한 번 할당합니다.
   * @param elements - Live elements, at most one million.
   * @zh elements - 实时元素，最多一百万个。
   * @ja elements - 有効な要素。最大百万個。
   * @ko elements - 유효한 요소이며 최대 백만 개입니다.
   */
  constructor(elements: readonly Element[]) {
    const value = native.createElementTransformBuffer(
      elements.map(element => element.handle));
    markAsUntransferable(value.matrices.buffer);
    markAsUntransferable(value.flags.buffer);
    buffers.set(this, value);
  }

  /**
   * Number of registered elements.
   *
   * @zh 已注册元素数量。
   * @ja 登録した要素数。
   * @ko 등록된 요소 수입니다.
   * @returns Fixed element count.
   * @zh 固定元素数量。
   * @ja 固定の要素数。
   * @ko 고정 요소 수입니다.
   */
  get length(): number {
    return mapping(this).length;
  }

  /**
   * Reused output: each element occupies 48 column-major floats.
   *
   * @zh 复用输出：每个元素占 48 个列主序浮点数。
   * @ja 再利用する出力。要素ごとに列優先の 48 値。
   * @ko 재사용 출력이며 요소마다 열 우선 값 48개입니다.
   * @returns Transform at offset 0, perspective at 16, inverse at 32.
   * @zh 变换偏移 0，透视偏移 16，逆矩阵偏移 32。
   * @ja 変換は 0、透視は 16、逆行列は 32 のオフセット。
   * @ko 변환 오프셋 0, 원근 16, 역행렬 32입니다.
   */
  get matrices(): Float32Array {
    return mapping(this).matrices;
  }

  /**
   * Matrix-presence bits per element: transform 1, perspective 2, inverse 4.
   *
   * @zh 每元素矩阵存在位：变换 1、透视 2、逆矩阵 4。
   * @ja 要素ごとの存在ビット。変換 1、透視 2、逆行列 4。
   * @ko 요소별 존재 비트이며 변환 1, 원근 2, 역행렬 4입니다.
   * @returns Reused native flags; absent matrix slots contain zero floats.
   * @zh 复用原生标志；不存在的矩阵槽填零。
   * @ja 再利用するフラグ。存在しない行列スロットはゼロ。
   * @ko 재사용 플래그이며 미존재 행렬 슬롯은 0입니다.
   */
  get flags(): Uint8Array {
    return mapping(this).flags;
  }

  /**
   * Refresh all snapshots in one native call without reallocating output.
   *
   * @zh 一次原生调用刷新全部快照，不重新分配输出。
   * @ja 出力の再確保なしに一回の呼び出しで全コピーを更新します。
   * @ko 출력 재할당 없이 호출 한 번으로 모든 복사본을 갱신합니다.
   * @remarks
   * Destroyed elements or runtime generations throw before any output changes.
   * JS writes only modify the output snapshot, never native element transforms.
   * @zh 元素或运行时失效时，在修改输出前抛出异常；JS 写入只改变输出快照。
   * @ja 要素や世代が無効なら出力変更前に例外になり、JS の書き込みはコピーだけを変えます。
   * @ko 요소나 세대가 무효화되면 출력 변경 전에 예외를 던지며 JS 쓰기는 복사본만 바꿉니다.
   */
  refresh(): void {
    native.refreshElementTransformBuffer(mapping(this).handle);
  }
}
