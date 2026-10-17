import { Texture } from './texture';
import { VertexBuffer } from './vertex-buffer';

/**
 * Exchange same-type resources, preserving previously recorded draws.
 * @zh 交换同类型资源，同时保留此前录制的绘制。
 * @ja 以前に記録された描画を保持しつつ、同じ型のリソースを交換します。
 * @ko 이전에 기록된 그리기를 유지하면서 동일한 형식의 리소스를 교환합니다.
 */
export function swap(left: Texture, right: Texture): void;
/**
 * Synchronously swaps data and settings of two vertex buffers, preserving
 * previously recorded draw results.
 * @zh 同步交换两个顶点缓冲区的数据和配置，保留之前录制的绘制结果。
 * @ja 二つの頂点バッファーのデータと設定を同期的に交換し、以前に記録された描画結果を保持します。
 * @ko 두 꼭짓점 버퍼의 데이터와 설정을 동기적으로 교환하며 이전에 기록된 그리기 결과를 유지합니다.
 */
export function swap(left: VertexBuffer, right: VertexBuffer): void;
export function swap(
  left: Texture | VertexBuffer, right: Texture | VertexBuffer,
): void {
  if (left instanceof Texture && right instanceof Texture) left.swap(right);
  else if (left instanceof VertexBuffer && right instanceof VertexBuffer) {
    left.swap(right);
  } else {
    throw new TypeError('Expected two Textures or two VertexBuffers');
  }
}
