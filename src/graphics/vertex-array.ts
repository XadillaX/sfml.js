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

/**
 * Native contiguous vertices, exposed through stable per-allocation views.
 * @zh 通过每次分配期间稳定的视图公开的原生连续顶点。
 * @ja 割り当てごとに安定したビューで公開される、ネイティブの連続頂点。
 * @ko 할당별로 안정적인 뷰를 통해 노출되는 네이티브 연속 꼭짓점입니다.
 */
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

  /**
   * Creates a vertex array, defaulting to Points and zero vertices; new
   * vertices are opaque white at the origin.
   * @zh 创建顶点数组；默认 Points、零个顶点，新增顶点为原点处的不透明白色。
   * @ja 頂点配列を作成します。既定は Points、0 頂点です。追加頂点は原点にあり、不透明な白です。
   * @ko 꼭짓점 배열을 만듭니다. 기본값은 Points와 0개 꼭짓점이며 새 꼭짓점은 원점의 불투명한 흰색입니다.
   */
  constructor(type?: PrimitiveType, vertexCount?: number);
  /**
   * Deep-copies vertex data and primitive type.
   * @zh 深复制顶点数据和图元类型。
   * @ja 頂点データとプリミティブ型をディープコピーします。
   * @ko 꼭짓점 데이터와 프리미티브 형식을 깊은 복사합니다.
   */
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

  /**
   * Returns the current vertex count.
   * @zh 返回当前顶点数。
   * @ja 現在の頂点数を返します。
   * @ko 현재 꼭짓점 수를 반환합니다.
   */
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
   * Returns a zero-based shared vertex view; throws RangeError for an
   * out-of-bounds index. After growth reallocates storage, previous views still
   * point to the old storage and must be retrieved again.
   * @zh 返回从零开始的顶点共享视图；越界抛出 RangeError。 扩容重新分配后，之前取得的视图仍指向旧存储，请重新获取。
   * @ja 0 始まりの頂点共有ビューを返します。範囲外なら RangeError を投げます。拡張で再割り当てした後も既存ビューは旧ストレージを指すため
   * 、再取得が必要です。
   * @ko 0부터 시작하는 꼭짓점 공유 뷰를 반환합니다. 범위를 벗어나면 RangeError를 던집니다. 확장으로 재할당한 후에도 이전
   * 뷰는 기존 저장 공간을 가리키므로 다시 가져와야 합니다.
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

  /**
   * Copies value's components into the specified vertex; index starts at zero.
   * @zh 将 value 的分量复制到指定顶点；index 从零开始。
   * @ja value の成分を指定頂点にコピーします。index は 0 始まりです。
   * @ko value의 성분을 지정한 꼭짓점에 복사합니다. index는 0부터 시작합니다.
   */
  setVertex(index: number, value: ReadonlyValue<Vertex>): void {
    this.checkIndex(index);
    if (!(value instanceof Vertex)) throw new TypeError('Expected a Vertex');
    this.bytes.set(value[vertexStorage], index * 20);
  }

  /**
   * Sets the vertex count to zero, retaining allocated capacity.
   * @zh 将顶点数清零，保留已分配的容量。
   * @ja 割り当て済み容量を保持して頂点数をゼロにします。
   * @ko 할당된 용량을 유지하고 꼭짓점 수를 0으로 설정합니다.
   */
  clear(): void {
    this.count = 0;
    this.views.clear();
  }

  /**
   * Resizes the vertex count; new vertices use defaults, and shrinking removes
   * vertices from the end.
   * @zh 调整顶点数；新增顶点使用默认值，缩小时截去末尾顶点。
   * @ja 頂点数を変更します。追加頂点は既定値を使い、縮小時は末尾の頂点を削除します。
   * @ko 꼭짓점 수를 조절합니다. 새 꼭짓점은 기본값을 사용하며 축소 시 끝의 꼭짓점을 제거합니다.
   */
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

  /**
   * Appends a vertex copy, reallocating storage if capacity is insufficient.
   * @zh 在末尾追加顶点副本，容量不足时重新分配存储。
   * @ja 頂点のコピーを末尾に追加し、容量不足ならストレージを再割り当てします。
   * @ko 꼭짓점 복사본을 끝에 추가하며 용량이 부족하면 저장 공간을 재할당합니다.
   */
  append(vertex: ReadonlyValue<Vertex>): void {
    if (!(vertex instanceof Vertex)) throw new TypeError('Expected a Vertex');
    validateCount(this.count + 1);
    this.ensureCapacity(this.count + 1);
    this.bytes.set(vertex[vertexStorage], this.count * 20);
    this.count++;
  }

  /**
   * Sets how vertices form primitives.
   * @zh 设置顶点组成图元的方式。
   * @ja 頂点からプリミティブを構成する方法を設定します。
   * @ko 꼭짓점이 프리미티브를 구성하는 방식을 설정합니다.
   */
  setPrimitiveType(type: PrimitiveType): void {
    validatePrimitiveType(type);
    this.primitiveType = type;
  }

  /**
   * Returns the current primitive type.
   * @zh 返回当前图元类型。
   * @ja 現在のプリミティブ型を返します。
   * @ko 현재 프리미티브 형식을 반환합니다.
   */
  getPrimitiveType(): PrimitiveType {
    return this.primitiveType;
  }

  /**
   * Returns axis-aligned bounds of all vertex positions; an empty array returns
   * a zero rectangle.
   * @zh 返回所有顶点位置的轴对齐包围框；空数组返回零矩形。
   * @ja 全頂点位置の軸平行境界矩形を返します。空配列ならゼロ矩形を返します。
   * @ko 모든 꼭짓점 위치의 축 정렬 경계 상자를 반환합니다. 빈 배열은 0 사각형을 반환합니다.
   */
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

  /**
   * Iterates shared vertex views in index order.
   * @zh 按索引顺序遍历顶点共享视图。
   * @ja インデックス順に頂点共有ビューを反復します。
   * @ko 인덱스 순서로 꼭짓점 공유 뷰를 순회합니다.
   */
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
