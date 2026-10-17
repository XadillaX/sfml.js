import { Transform } from '../graphics/transform';
import { Vector2, Vector2f } from '../system/vector2';
import { Angle, radians, positiveRemainder } from '../system/angle';
import type { NativeGraphicsHandle } from './native';
import {
  mutableValue, vector2Storage, transformStorage, type ReadonlyValue as R,
} from './value-storage';

export const transformableState: unique symbol = Symbol('Transformable.state');
const tau = Math.fround(Math.fround(3.141592654) * 2);
const f = Math.fround;

interface TransformCache {
  input: Float32Array;
  transform: R<Transform>;
  inverse?: R<Transform>;
  inverseDirty: boolean;
}

export interface TransformableState {
  handle: NativeGraphicsHandle<'transformable'>;
  values: Float32Array;
  cache?: TransformCache;
}

export interface TransformableHost {
  readonly [mutableValue]: true;
  readonly [transformableState]: TransformableState;
}

export interface TransformableMethods extends TransformableHost {
  /**
   * Set the object's origin in parent coordinates, copying position.
   * @zh 设置对象原点在父坐标系中的位置，复制 position 的值。
   * @ja 親座標系での原点の位置を設定し、position の値をコピーします。
   * @ko 부모 좌표계에서 원점 위치를 설정하고 position 값을 복사합니다.
   */
  setPosition(this: TransformableHost, position: R<Vector2f>): void;
  /**
   * Return an independent copy of the position.
   * @zh 返回位置的独立副本。
   * @ja 位置の独立したコピーを返します。
   * @ko 위치의 독립적인 복사본을 반환합니다.
   */
  getPosition(): Vector2f;
  /**
   * Add offset to the current position.
   * @zh 将 offset 加到当前位置。
   * @ja 現在の位置に offset を加えます。
   * @ko 현재 위치에 offset을 더합니다.
   */
  move(this: TransformableHost, offset: R<Vector2f>): void;
  /**
   * Set the rotation; positive angles are clockwise in screen coordinates.
   * @zh 设置旋转角度；屏幕坐标中正角度为顺时针。
   * @ja 回転角を設定します。画面座標では正の角度が時計回りです。
   * @ko 회전 각도를 설정합니다. 화면 좌표에서 양의 각도는 시계 방향입니다.
   */
  setRotation(this: TransformableHost, angle: R<Angle>): void;
  /**
   * Return a copy of the rotation normalized to [0°, 360°).
   * @zh 返回归一化到 [0°, 360°) 的旋转角度副本。
   * @ja [0°, 360°) に正規化した回転角のコピーを返します。
   * @ko [0°, 360°)로 정규화한 회전 각도의 복사본을 반환합니다.
   */
  getRotation(): Angle;
  /**
   * Add angle to the current rotation.
   * @zh 在当前旋转角度上累加 angle。
   * @ja 現在の回転角に angle を加えます。
   * @ko 현재 회전 각도에 angle을 더합니다.
   */
  rotate(this: TransformableHost, angle: R<Angle>): void;
  /**
   * Set X/Y scale factors; (1, 1) is original size and negatives flip axes.
   * @zh 设置 X、Y 缩放因子；(1, 1) 为原始大小，负值可翻转。
   * @ja X・Y の拡大率を設定します。(1, 1) は元の大きさ、負値は反転です。
   * @ko X/Y 배율을 설정합니다. (1, 1)은 원래 크기이며 음수는 축을 뒤집습니다.
   */
  setScale(this: TransformableHost, factors: R<Vector2f>): void;
  /**
   * Return an independent copy of the scale factors.
   * @zh 返回缩放因子的独立副本。
   * @ja 拡大率の独立したコピーを返します。
   * @ko 배율의 독립적인 복사본을 반환합니다.
   */
  getScale(): Vector2f;
  /**
   * Multiply the current X/Y scale factors by the components of factors.
   * @zh 将当前 X、Y 缩放因子分别乘以 factors。
   * @ja 現在の X・Y の拡大率に factors の各成分を掛けます。
   * @ko 현재 X/Y 배율에 factors의 각 성분을 곱합니다.
   */
  scale(this: TransformableHost, factors: R<Vector2f>): void;
  /**
   * Set the local origin around which rotation and scaling take place.
   * @zh 设置局部坐标中的变换原点，旋转和缩放围绕该点进行。
   * @ja 回転と拡大縮小の中心となる原点をローカル座標で設定します。
   * @ko 회전과 크기 조절의 중심이 되는 원점을 로컬 좌표로 설정합니다.
   */
  setOrigin(this: TransformableHost, origin: R<Vector2f>): void;
  /**
   * Return an independent copy of the local origin.
   * @zh 返回局部变换原点的独立副本。
   * @ja ローカル座標の原点の独立したコピーを返します。
   * @ko 로컬 원점의 독립적인 복사본을 반환합니다.
   */
  getOrigin(): Vector2f;
  /**
   * Return the read-only cached local-to-parent transform.
   * Later reads may update the same object.
   * @zh 返回从局部到父坐标系的只读变换缓存；后续读取可更新同一对象。
   * @ja ローカルから親座標系への読み取り専用の変換キャッシュを返します。
   * 後続の読み取りで同じオブジェクトが更新される場合があります。
   * @ko 로컬에서 부모 좌표계로의 읽기 전용 변환 캐시를 반환합니다.
   * 이후 읽기에서 동일한 객체가 갱신될 수 있습니다.
   */
  getTransform(): R<Transform>;
  /**
   * Return the read-only cached parent-to-local inverse transform,
   * or the identity matrix when not invertible.
   * @zh 返回从父坐标系到局部的只读逆变换缓存；不可逆时为单位矩阵。
   * @ja 親座標系からローカルへの読み取り専用の逆変換キャッシュを返します。
   * 逆変換できない場合は単位行列になります。
   * @ko 부모 좌표계에서 로컬로의 읽기 전용 역변환 캐시를 반환합니다.
   * 역변환이 불가능하면 단위 행렬을 반환합니다.
   */
  getInverseTransform(): R<Transform>;
}

function vectorData(value: R<Vector2f>): Float32Array {
  if (!(value instanceof Vector2) || value.scalarType !== 'f32') {
    throw new TypeError('Transformable requires a Vector2f');
  }
  return value[vector2Storage] as Float32Array;
}

function angleData(value: R<Angle>): number {
  if (!(value instanceof Angle)) throw new TypeError('Expected an Angle');
  return value.asRadians();
}

function vectorCopy(data: Float32Array, offset: number): Vector2f {
  const result = new Vector2f();
  result[vector2Storage].set(data.subarray(offset, offset + 2));
  return result;
}

// Inspect the seven staged values on reads, including changes made by C++.
// Setters only write data; they never allocate or compute a transform.
function transformCache(state: TransformableState): TransformCache {
  const data = state.values;
  let cache = state.cache;
  if (cache && data.every((value, i) => Object.is(value, cache!.input[i]))) {
    return cache;
  }
  if (!cache) {
    cache = state.cache = {
      input: new Float32Array(7),
      transform: Object.freeze(new Transform()), inverseDirty: true,
    };
  }
  const cos = f(Math.cos(-data[2]));
  const sin = f(Math.sin(-data[2]));
  const sxc = f(data[3] * cos);
  const syc = f(data[4] * cos);
  const sxs = f(data[3] * sin);
  const sys = f(data[4] * sin);
  const matrix = cache.transform[transformStorage];
  matrix[0] = sxc;
  matrix[4] = sys;
  matrix[12] = f(f(f(-data[5] * sxc) - f(data[6] * sys)) + data[0]);
  matrix[1] = -sxs;
  matrix[5] = syc;
  matrix[13] = f(f(f(data[5] * sxs) - f(data[6] * syc)) + data[1]);
  cache.input.set(data);
  cache.inverseDirty = true;
  return cache;
}

// TypeScript mixin constructors require a single any[] rest parameter.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T;

/** Add the same API to independently allocated native resource wrappers. */
export function withTransformable<T extends Constructor<TransformableHost>>(
  Base: T,
): T & Constructor<TransformableMethods> {
  return class extends Base implements TransformableMethods {
    setPosition(this: TransformableHost, position: R<Vector2f>): void {
      this[transformableState].values.set(vectorData(position), 0);
    }

    getPosition(): Vector2f {
      return vectorCopy(this[transformableState].values, 0);
    }

    move(this: TransformableHost, offset: R<Vector2f>): void {
      const input = vectorData(offset);
      const data = this[transformableState].values;
      data[0] += input[0];
      data[1] += input[1];
    }

    setRotation(this: TransformableHost, angle: R<Angle>): void {
      this[transformableState].values[2] =
        positiveRemainder(angleData(angle), tau);
    }

    getRotation(): Angle {
      return radians(this[transformableState].values[2]);
    }

    rotate(this: TransformableHost, angle: R<Angle>): void {
      const data = this[transformableState].values;
      data[2] = positiveRemainder(f(data[2] + angleData(angle)), tau);
    }

    setScale(this: TransformableHost, factors: R<Vector2f>): void {
      this[transformableState].values.set(vectorData(factors), 3);
    }

    getScale(): Vector2f {
      return vectorCopy(this[transformableState].values, 3);
    }

    scale(this: TransformableHost, factors: R<Vector2f>): void {
      const input = vectorData(factors);
      const data = this[transformableState].values;
      data[3] *= input[0];
      data[4] *= input[1];
    }

    setOrigin(this: TransformableHost, origin: R<Vector2f>): void {
      this[transformableState].values.set(vectorData(origin), 5);
    }

    getOrigin(): Vector2f {
      return vectorCopy(this[transformableState].values, 5);
    }

    getTransform(): R<Transform> {
      return transformCache(this[transformableState]).transform;
    }

    getInverseTransform(): R<Transform> {
      const cache = transformCache(this[transformableState]);
      if (cache.inverseDirty) {
        const inverse = cache.transform.getInverse();
        if (cache.inverse) {
          cache.inverse[transformStorage].set(inverse[transformStorage]);
        } else {
          cache.inverse = Object.freeze(inverse);
        }
        cache.inverseDirty = false;
      }
      return cache.inverse!;
    }
  };
}
