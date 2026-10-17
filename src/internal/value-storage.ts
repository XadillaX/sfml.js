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
export const mutableValue: unique symbol = Symbol('Value.mutable');

// Only expose reads and independent copies, never aliases or mutable callbacks.
type ReadonlyFloatArray = Readonly<Pick<Float32Array,
number | 'length' | 'byteLength' | 'byteOffset' | typeof Symbol.iterator |
'slice' | 'entries' | 'keys' | 'values'>>;

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
