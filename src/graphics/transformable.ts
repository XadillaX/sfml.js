import { native } from '../internal/native';
import {
  withTransformable, transformableState, type TransformableState,
  type TransformableMethods,
} from '../internal/transformable';
import { mutableValue, type ReadonlyValue } from '../internal/value-storage';

class TransformableResource {
  readonly [mutableValue] = true;
  readonly [transformableState]: TransformableState;

  /** 创建默认变换，或复制 source 的位置、角度、缩放和原点。 */
  constructor(source?: ReadonlyValue<TransformableMethods>) {
    if (source !== undefined && (source === null ||
        typeof source !== 'object' || !(transformableState in source))) {
      throw new TypeError('Expected a Transformable');
    }
    const { handle, buffer } = native.createTransformable();
    const values = new Float32Array(buffer);
    if (source) values.set(source[transformableState].values);
    this[transformableState] = { handle, values };
  }
}

/** sf::Transformable with native-owned staging and JS transform calculations. */
export class Transformable extends withTransformable(TransformableResource) {}
