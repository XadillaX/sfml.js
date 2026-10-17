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

/**
 * SFML GLSL matrices are column-major data containers without operators.
 * @zh SFML GLSL 矩阵是列主序数据容器，不提供运算符。
 * @ja SFML の GLSL 行列は演算子を持たない列優先のデータコンテナーです。
 * @ko SFML GLSL 행렬은 연산자가 없는 열 우선 데이터 컨테이너입니다.
 */
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

  /**
   * Mutable shared view of column-major matrix data.
   * @zh 列主序矩阵数据的可修改共享视图。
   * @ja 列優先の行列データの変更可能な共有ビュー。
   * @ko 열 우선 행렬 데이터의 수정 가능한 공유 뷰입니다.
   */
  get array(): Float32Array { return this[glslStorage]; }
  /**
   * Copies an array of the same length into existing matrix storage.
   * @zh 复制同长度数组到矩阵的现有存储。
   * @ja 同じ長さの配列を行列の既存ストレージにコピーします。
   * @ko 길이가 같은 배열을 기존 행렬 저장 공간에 복사합니다.
   */
  set array(source: ArrayLike<number>) { copyArray(this[glslStorage], source); }
}

/**
 * GLSL mat3 with nine column-major float32 components.
 * @zh GLSL mat3，九个列主序 float32 分量。
 * @ja 列優先の float32 成分を九つ持つ GLSL mat3。
 * @ko 열 우선 float32 성분 9개의 GLSL mat3입니다.
 */
export class Mat3 extends Matrix<'mat3'> {
  /**
   * Copies nine column-major components, a Mat3, or the 2D 3x3 matrix from a
   * Transform.
   * @zh 复制九个列主序分量、Mat3 或 Transform 中的二维 3×3 矩阵。
   * @ja 列優先の九つの成分、Mat3、または Transform の二次元 3×3 行列をコピーします。
   * @ko 열 우선 성분 9개, Mat3 또는 Transform의 2차원 3×3 행렬을 복사합니다.
   */
  constructor(source: ArrayLike<number> | R<Mat3> | R<Transform>) {
    super(9, source, buffer => native.wrapMat3(buffer));
  }
}

/**
 * GLSL mat4 with sixteen column-major float32 components.
 * @zh GLSL mat4，十六个列主序 float32 分量。
 * @ja 列優先の float32 成分を十六個持つ GLSL mat4。
 * @ko 열 우선 float32 성분 16개의 GLSL mat4입니다.
 */
export class Mat4 extends Matrix<'mat4'> {
  /**
   * Copies sixteen column-major components, a Mat4, or the OpenGL matrix from a
   * Transform.
   * @zh 复制十六个列主序分量、Mat4 或 Transform 的 OpenGL 矩阵。
   * @ja 列優先の十六個の成分、Mat4、または Transform の OpenGL 行列をコピーします。
   * @ko 열 우선 성분 16개, Mat4 또는 Transform의 OpenGL 행렬을 복사합니다.
   */
  constructor(source: ArrayLike<number> | R<Mat4> | R<Transform>) {
    super(16, source, buffer => native.wrapMat4(buffer));
  }
}
