import { native, type NativeGraphicsHandle, type NativeVertices } from '../internal/native';
import { LazyValue } from '../internal/lazy-value';
import {
  dispatchDrawable, recordVertices, vertexArrayBytes,
} from '../internal/graphics-state';
import { vertexStorage, type ReadonlyValue } from '../internal/value-storage';
import { Vector2f } from '../system/vector2';
import { Drawable } from './drawable';
import { FloatRect } from './rect';
import { PrimitiveType, validatePrimitiveType } from './primitive-type';
import { Vertex, vertexFromState } from './vertex';
import type { RenderStates } from './render-states';
import type { RenderTarget } from './render-target';

const maxVertices = Math.floor(0x7fffffff / 20);
const defaultVertex = new Vertex()[vertexStorage];

export let vertexArrayFromMapping: (mapping: NativeVertices) => VertexArray;

function validateCount(count: number): void {
  if (!Number.isInteger(count) || count < 0 || count > maxVertices) {
    throw new RangeError('Vertex count exceeds the buffer limit');
  }
}

/** Native contiguous vertices, exposed through stable per-allocation views. */
export class VertexArray extends Drawable implements Iterable<Vertex> {
  private handle: NativeGraphicsHandle<'vertices'>;
  private bytes: Uint8Array;
  private coordinates: Float32Array;
  private readonly metadata = new Uint32Array(2);
  private readonly views = new Map<number, Vertex>();

  static {
    vertexArrayFromMapping = mapping => Object.assign(
      Object.create(VertexArray.prototype), {
        handle: mapping.handle,
        bytes: new Uint8Array(mapping.buffer),
        coordinates: new Float32Array(mapping.buffer),
        metadata: new Uint32Array([
          mapping.buffer.byteLength / 20, PrimitiveType.Triangles,
        ]),
        views: new Map<number, Vertex>(),
      });
  }

  /** 创建顶点数组；默认 Points、零个顶点，新增顶点为原点处的不透明白色。 */
  constructor(type?: PrimitiveType, vertexCount?: number);
  /** 深复制顶点数据和图元类型。 */
  constructor(source: VertexArray);
  constructor(source: PrimitiveType | VertexArray = PrimitiveType.Points,
    vertexCount = 0) {
    super();
    const copy = source instanceof VertexArray ? source : undefined;
    const type = copy ? copy.primitiveType : source as PrimitiveType;
    const count = copy ? copy.count : vertexCount;
    validatePrimitiveType(type);
    validateCount(count);
    const mapping = native.createVertexStorage(count);
    this.handle = mapping.handle;
    this.bytes = new Uint8Array(mapping.buffer);
    this.coordinates = new Float32Array(mapping.buffer);
    this.count = count;
    this.primitiveType = type;
    if (copy) this.bytes.set(copy.bytes.subarray(0, count * 20));
  }

  /** 返回当前顶点数。 */
  getVertexCount(): number {
    return this.count;
  }

  private get count(): number { return this.metadata[0]; }
  private set count(value: number) { this.metadata[0] = value; }
  private get primitiveType(): PrimitiveType { return this.metadata[1]; }
  private set primitiveType(value: PrimitiveType) { this.metadata[1] = value; }

  get [vertexArrayBytes](): Uint8Array {
    return this.bytes.subarray(0, this.count * 20);
  }

  /**
   * 返回从零开始的顶点共享视图；越界抛出 RangeError。
   * 扩容重新分配后，之前取得的视图仍指向旧存储，请重新获取。
   */
  getVertex(index: number): Vertex {
    this.checkIndex(index);
    let vertex = this.views.get(index);
    if (!vertex) {
      const handle = this.handle;
      vertex = vertexFromState(new LazyValue(
        this.bytes.subarray(index * 20, (index + 1) * 20),
        () => native.vertexStorageMember(handle, index),
      ));
      this.views.set(index, vertex);
    }
    return vertex;
  }

  /** 将 value 的分量复制到指定顶点；index 从零开始。 */
  setVertex(index: number, value: ReadonlyValue<Vertex>): void {
    this.checkIndex(index);
    if (!(value instanceof Vertex)) throw new TypeError('Expected a Vertex');
    this.bytes.set(value[vertexStorage], index * 20);
  }

  /** 将顶点数清零，保留已分配的容量。 */
  clear(): void {
    this.count = 0;
    this.views.clear();
  }

  /** 调整顶点数；新增顶点使用默认值，缩小时截去末尾顶点。 */
  resize(vertexCount: number): void {
    validateCount(vertexCount);
    this.ensureCapacity(vertexCount);
    for (let i = this.count; i < vertexCount; i++) {
      this.bytes.set(defaultVertex, i * 20);
    }
    if (vertexCount < this.count) {
      for (const index of this.views.keys()) {
        if (index >= vertexCount) this.views.delete(index);
      }
    }
    this.count = vertexCount;
  }

  /** 在末尾追加顶点副本，容量不足时重新分配存储。 */
  append(vertex: ReadonlyValue<Vertex>): void {
    if (!(vertex instanceof Vertex)) throw new TypeError('Expected a Vertex');
    validateCount(this.count + 1);
    this.ensureCapacity(this.count + 1);
    this.bytes.set(vertex[vertexStorage], this.count * 20);
    this.count++;
  }

  /** 设置顶点组成图元的方式。 */
  setPrimitiveType(type: PrimitiveType): void {
    validatePrimitiveType(type);
    this.primitiveType = type;
  }

  /** 返回当前图元类型。 */
  getPrimitiveType(): PrimitiveType {
    return this.primitiveType;
  }

  /** 返回所有顶点位置的轴对齐包围框；空数组返回零矩形。 */
  getBounds(): FloatRect {
    if (this.count === 0) return new FloatRect();
    const data = this.coordinates;
    let left = data[0];
    let top = data[1];
    let right = left;
    let bottom = top;
    for (let i = 1; i < this.count; i++) {
      const x = data[i * 5];
      const y = data[i * 5 + 1];
      if (x < left) left = x;
      else if (x > right) right = x;
      if (y < top) top = y;
      else if (y > bottom) bottom = y;
    }
    return new FloatRect(
      new Vector2f(left, top), new Vector2f(right - left, bottom - top));
  }

  /** 按索引顺序遍历顶点共享视图。 */
  * [Symbol.iterator](): IterableIterator<Vertex> {
    for (let i = 0; i < this.count; i++) yield this.getVertex(i);
  }

  protected draw(target: RenderTarget, states: RenderStates): void {
    target[recordVertices](this.bytes.subarray(0, this.count * 20),
      this.primitiveType, states);
  }

  [dispatchDrawable](target: RenderTarget, states: RenderStates): void {
    if (this.draw === VertexArray.prototype.draw) this.draw(target, states);
    else super[dispatchDrawable](target, states);
  }

  private checkIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.count) {
      throw new RangeError('Vertex index is out of range');
    }
  }

  private ensureCapacity(count: number): void {
    if (count <= this.bytes.byteLength / 20) return;
    const capacity = Math.min(maxVertices,
      Math.max(count, 4, this.bytes.byteLength / 10));
    const mapping = native.createVertexStorage(capacity);
    const bytes = new Uint8Array(mapping.buffer);
    bytes.set(this.bytes.subarray(0, this.count * 20));
    this.handle = mapping.handle;
    this.bytes = bytes;
    this.coordinates = new Float32Array(mapping.buffer);
    this.views.clear();
  }
}
