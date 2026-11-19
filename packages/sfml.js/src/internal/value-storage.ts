export const angleStorage: unique symbol = Symbol('Angle.storage');
export const angleNative: unique symbol = Symbol('Angle.native');
export const timeStorage: unique symbol = Symbol('Time.microseconds');
export const vector2Storage: unique symbol = Symbol('Vector2.storage');
export const vector2Native: unique symbol = Symbol('Vector2.native');
export const vector3Storage: unique symbol = Symbol('Vector3.storage');
export const vector3Native: unique symbol = Symbol('Vector3.native');
export const colorStorage: unique symbol = Symbol('Color.storage');
export const colorNative: unique symbol = Symbol('Color.native');
export const rectStorage: unique symbol = Symbol('Rect.storage');
export const rectNative: unique symbol = Symbol('Rect.native');
export const vertexStorage: unique symbol = Symbol('Vertex.storage');
export const vertexNative: unique symbol = Symbol('Vertex.native');
export const glyphStorage: unique symbol = Symbol('Glyph.storage');
export const glyphNative: unique symbol = Symbol('Glyph.native');
export const transformStorage: unique symbol = Symbol('Transform.storage');
export const transformNative: unique symbol = Symbol('Transform.native');
/**
 * Internal brand removed from recursive const views.
 * @internal
 */
export const mutableValue: unique symbol = Symbol('Value.mutable');

// Only expose reads and independent copies, never aliases or mutable callbacks.
/**
 * Numeric reads and independent copies of a shared float view.
 * @zh 共享浮点视图的数值读取和独立副本。
 * @ja 共有浮動小数点ビューの数値読み取りと独立したコピー。
 * @ko 공유 부동 소수점 뷰의 숫자 읽기와 독립적인 복사본입니다.
 * @inline
 */
interface ReadonlyFloatArray {
  readonly [index: number]: number;

  /**
   * Number of float32 components.
   * @zh float32 分量数。
   * @ja float32 成分数。
   * @ko float32 성분 수입니다.
   */
  readonly length: number;

  /**
   * Size of the view in bytes.
   * @zh 视图的字节长度。
   * @ja ビューのバイト長。
   * @ko 뷰의 바이트 길이입니다.
   */
  readonly byteLength: number;

  /**
   * Byte offset within the backing storage.
   * @zh 视图在底层存储中的字节偏移。
   * @ja 基になるストレージ内でのバイトオフセット。
   * @ko 기반 저장소 내의 바이트 오프셋입니다.
   */
  readonly byteOffset: number;

  /**
   * Copies the selected components into independent mutable storage.
   * @zh 将选中分量复制到独立的可变存储。
   * @ja 選択した成分を独立した変更可能なストレージにコピーします。
   * @ko 선택한 성분을 독립적인 수정 가능 저장소에 복사합니다.
   *
   * @param start - Inclusive component index; defaults to zero.
   * @zh start - 包含的起始分量索引，默认 0。
   * @ja start - 開始成分インデックス。この位置を含み、既定値は 0。
   * @ko start - 포함되는 시작 성분 인덱스입니다. 기본값은 0입니다.
   *
   * @param end - Exclusive component index; defaults to length.
   * @zh end - 不包含的结束分量索引，默认 length。
   * @ja end - 終了成分インデックス。この位置を含まず、既定値は length。
   * @ko end - 포함되지 않는 끝 성분 인덱스입니다. 기본값은 length입니다.
   *
   * @return An independent float32 array.
   * @zh 独立的 float32 数组。
   * @ja 独立した float32 配列。
   * @ko 독립적인 float32 배열입니다.
   */
  slice(start?: number, end?: number): Float32Array;

  /**
   * Iterates component indices and values without exposing writable storage.
   * @zh 遍历分量索引和值，不暴露可写存储。
   * @ja 書き込み可能なストレージを公開せず、成分のインデックスと値を走査します。
   * @ko 쓰기 가능한 저장소를 노출하지 않고 성분 인덱스와 값을 순회합니다.
   */
  entries(): IterableIterator<[number, number]>;

  /**
   * Iterates component indices.
   * @zh 遍历分量索引。
   * @ja 成分のインデックスを走査します。
   * @ko 성분 인덱스를 순회합니다.
   */
  keys(): IterableIterator<number>;

  /**
   * Iterates component values.
   * @zh 遍历分量值。
   * @ja 成分の値を走査します。
   * @ko 성분 값을 순회합니다.
   */
  values(): IterableIterator<number>;

  /**
   * Iterates component values in storage order.
   * @zh 按存储顺序遍历分量值。
   * @ja ストレージの順序で成分の値を走査します。
   * @ko 저장 순서대로 성분 값을 순회합니다.
   */
  [Symbol.iterator](): IterableIterator<number>;
}

/**
 * Const data members recurse; methods still return independent mutable values.
 * @zh 数据成员递归只读；方法仍可返回独立的可变值。
 * @ja データメンバーは再帰的に読み取り専用になります。
 * メソッドは引き続き独立した変更可能な値を返せます。
 * @ko 데이터 멤버는 재귀적으로 읽기 전용이 됩니다.
 * 메서드는 여전히 독립적인 변경 가능 값을 반환할 수 있습니다.
 */
export type ReadonlyValue<T> = {
  readonly [K in keyof T as K extends typeof mutableValue ? never : K]:
  // Keep generic scalar coordinates verbatim; only the property becomes const.
  K extends symbol | 'scalarType' | 'x' | 'y' | 'z' | 'w' ? T[K]
    : T[K] extends Float32Array ? ReadonlyFloatArray
      : T[K] extends { readonly [mutableValue]: true }
        ? ReadonlyValue<T[K]> : T[K];
};
