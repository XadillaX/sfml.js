import { native } from '../internal/native';
import {
  withTransformable, transformableState, type TransformableState,
  type TransformableMethods,
} from '../internal/transformable';
import { mutableValue, type ReadonlyValue } from '../internal/value-storage';

class TransformableResource {
  readonly [mutableValue] = true;
  readonly [transformableState]: TransformableState;

  /**
   * Creates a default transform or copies source's position, angle, scale and
   * origin.
   * @zh 创建默认变换，或复制 source 的位置、角度、缩放和原点。
   * @ja 既定の変換を作成するか、source の位置、角度、拡大縮小、原点をコピーします。
   * @ko 기본 변환을 만들거나 source의 위치, 각도, 배율 및 원점을 복사합니다.
   */
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

/**
 * sf::Transformable with native-owned staging and JS transform calculations.
 * @zh 具有原生层拥有的暂存区和 JS 变换计算的 sf::Transformable。
 * @ja ネイティブ所有のステージング領域と JS による変換計算を備えた sf::Transformable。
 * @ko 네이티브 소유 스테이징과 JS 변환 계산을 사용하는 sf::Transformable입니다.
 */
export class Transformable extends withTransformable(TransformableResource) {}
