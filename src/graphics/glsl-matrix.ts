import { GlslValue, glslStorage } from '../internal/glsl-value';
import { native, type NativeValueMapping } from '../internal/native';
import {
  transformStorage, type ReadonlyValue as R,
} from '../internal/value-storage';
import { Transform } from './transform';

type Kind = 'mat3' | 'mat4';
type Source<K extends Kind> = ArrayLike<number> | R<Matrix<K>> | R<Transform>;
const transform3Indices = [ 0, 1, 3, 4, 5, 7, 12, 13, 15 ];

function copyArray(target: Float32Array, source: ArrayLike<number>): void {
  if (source === null || typeof source !== 'object') {
    throw new TypeError('Expected an array of matrix elements');
  }
  if (source.length !== target.length) {
    throw new RangeError(`Expected ${target.length} matrix elements`);
  }
  for (let i = 0; i < source.length; i++) {
    if (typeof source[i] !== 'number') {
      throw new TypeError('Matrix elements must be numbers');
    }
  }
  // TypedArray.set preserves float32 NaN payloads and supports self-assignment.
  target.set(source);
}

/** SFML GLSL matrices are column-major data containers without operators. */
abstract class Matrix<K extends Kind> extends GlslValue<K, Float32Array> {
  protected constructor(
    length: 9 | 16, source: Source<K>,
    wrap: (buffer: ArrayBuffer) => NativeValueMapping<K>,
  ) {
    super(new Float32Array(length), wrap);
    const values = this[glslStorage];
    if (source instanceof Transform) {
      const data = source[transformStorage];
      if (length === 16) {
        values.set(data);
      } else {
        // Copy the nine SFML entries as bits, including signed zero and NaN.
        const input = new Uint32Array(data.buffer, data.byteOffset, 16);
        const output = new Uint32Array(values.buffer);
        for (let i = 0; i < 9; i++) output[i] = input[transform3Indices[i]];
      }
    } else if (source instanceof Matrix) {
      copyArray(values, source[glslStorage]);
    } else {
      copyArray(values, source as ArrayLike<number>);
    }
  }

  /** 列主序矩阵数据的可修改共享视图。 */
  get array(): Float32Array { return this[glslStorage]; }
  /** 复制同长度数组到矩阵的现有存储。 */
  set array(source: ArrayLike<number>) { copyArray(this[glslStorage], source); }
}

/** GLSL mat3，九个列主序 float32 分量。 */
export class Mat3 extends Matrix<'mat3'> {
  /** 复制九个列主序分量、Mat3 或 Transform 中的二维 3×3 矩阵。 */
  constructor(source: ArrayLike<number> | R<Mat3> | R<Transform>) {
    super(9, source, buffer => native.wrapMat3(buffer));
  }
}

/** GLSL mat4，十六个列主序 float32 分量。 */
export class Mat4 extends Matrix<'mat4'> {
  /** 复制十六个列主序分量、Mat4 或 Transform 的 OpenGL 矩阵。 */
  constructor(source: ArrayLike<number> | R<Mat4> | R<Transform>) {
    super(16, source, buffer => native.wrapMat4(buffer));
  }
}
