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
  /** 设置对象原点在父坐标系中的位置，复制 position 的值。 */
  setPosition(this: TransformableHost, position: R<Vector2f>): void;
  /** 返回位置的独立副本。 */
  getPosition(): Vector2f;
  /** 将 offset 加到当前位置。 */
  move(this: TransformableHost, offset: R<Vector2f>): void;
  /** 设置旋转角度；屏幕坐标中正角度为顺时针。 */
  setRotation(this: TransformableHost, angle: R<Angle>): void;
  /** 返回归一化到 [0°, 360°) 的旋转角度副本。 */
  getRotation(): Angle;
  /** 在当前旋转角度上累加 angle。 */
  rotate(this: TransformableHost, angle: R<Angle>): void;
  /** 设置 X、Y 缩放因子；(1, 1) 为原始大小，负值可翻转。 */
  setScale(this: TransformableHost, factors: R<Vector2f>): void;
  /** 返回缩放因子的独立副本。 */
  getScale(): Vector2f;
  /** 将当前 X、Y 缩放因子分别乘以 factors。 */
  scale(this: TransformableHost, factors: R<Vector2f>): void;
  /** 设置局部坐标中的变换原点，旋转和缩放围绕该点进行。 */
  setOrigin(this: TransformableHost, origin: R<Vector2f>): void;
  /** 返回局部变换原点的独立副本。 */
  getOrigin(): Vector2f;
  /** 返回从局部到父坐标系的只读变换缓存；后续读取可更新同一对象。 */
  getTransform(): R<Transform>;
  /** 返回从父坐标系到局部的只读逆变换缓存；不可逆时为单位矩阵。 */
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
