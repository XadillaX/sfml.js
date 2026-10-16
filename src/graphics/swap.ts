import { Texture } from './texture';
import { VertexBuffer } from './vertex-buffer';

/** Exchange same-type resources, preserving previously recorded draws. */
export function swap(left: Texture, right: Texture): void;
/** 同步交换两个顶点缓冲区的数据和配置，保留之前录制的绘制结果。 */
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
