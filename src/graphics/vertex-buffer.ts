import {
  native, type NativeGraphicsHandle, type NativeVertexBufferInfo,
} from '../internal/native';
import {
  dispatchDrawable, flushGraphics, graphicsContext, graphicsNative,
  recordVertexBuffer, vertexArrayBytes, vertexBufferId,
} from '../internal/graphics-state';
import { vertexStorage, type ReadonlyValue } from '../internal/value-storage';
import { nativeStruct } from '../internal/struct-view';
import { Drawable } from './drawable';
import { PrimitiveType, validatePrimitiveType } from './primitive-type';
import { Vertex } from './vertex';
import { VertexArray } from './vertex-array';
import type { RenderStates } from './render-states';
import type { RenderTarget } from './render-target';

/** Strings distinguish the single-argument Usage and PrimitiveType constructors. */
export enum VertexBufferUsage {
  /** 数据频繁更新，通常每帧更新。 */
  Stream = 'stream',
  /** 数据不定期更新。 */
  Dynamic = 'dynamic',
  /** 数据很少更新。 */
  Static = 'static',
}

const usages = [
  VertexBufferUsage.Stream, VertexBufferUsage.Dynamic, VertexBufferUsage.Static,
];
type Vertices = VertexArray | readonly ReadonlyValue<Vertex>[];

function usageIndex(usage: VertexBufferUsage): number {
  const index = usages.indexOf(usage);
  if (index === -1) throw new RangeError('Invalid vertex buffer usage');
  return index;
}

function validateCount(count: number): void {
  if (!Number.isInteger(count) || count < 0 ||
      count > Math.floor(0x7fffffff / 20)) {
    throw new RangeError('Vertex count exceeds the buffer limit');
  }
}

/** GPU storage owned by Native; draw records a handle without uploading vertices. */
export class VertexBuffer extends Drawable {
  /** 顶点缓冲区使用方式枚举。 */
  static readonly Usage = VertexBufferUsage;
  readonly [graphicsNative]: NativeGraphicsHandle<'vertexBuffer'>;
  readonly [vertexBufferId]: number;
  /** 原生顶点缓冲区元信息只读视图。 */
  private readonly info: Readonly<NativeVertexBufferInfo>;

  /** 创建未分配顶点的 Points/Stream 缓冲区。 */
  constructor();
  /** 指定图元类型，使用 Stream 更新方式。 */
  constructor(type: PrimitiveType);
  /** 指定更新方式，使用 Points 图元类型。 */
  constructor(usage: VertexBufferUsage);
  /** 指定图元类型和更新方式。 */
  constructor(type: PrimitiveType, usage: VertexBufferUsage);
  /** 复制 GPU 顶点数据、图元类型和更新方式。 */
  constructor(source: VertexBuffer);
  constructor(
    source: PrimitiveType | VertexBufferUsage | VertexBuffer = PrimitiveType.Points,
    usage = VertexBufferUsage.Stream,
  ) {
    super();
    const copy = source instanceof VertexBuffer ? source : undefined;
    const type = copy ? copy.getPrimitiveType()
      : typeof source === 'string' ? PrimitiveType.Points : source as PrimitiveType;
    const selectedUsage = copy ? copy.getUsage()
      : typeof source === 'string' ? source : usage;
    validatePrimitiveType(type);
    const mapping = native.createVertexBuffer(
      graphicsContext(), type, usageIndex(selectedUsage), copy?.[graphicsNative]);
    this[graphicsNative] = mapping.handle;
    this[vertexBufferId] = mapping.id;
    this.info = nativeStruct<NativeVertexBufferInfo>(mapping.info);
  }

  /** 在 GPU 上分配指定数量的顶点，返回是否成功；提交此前排队的绘制。 */
  create(vertexCount: number): boolean {
    validateCount(vertexCount);
    flushGraphics();
    return native.allocateVertexBuffer(
      this[graphicsNative], vertexCount) !== undefined;
  }

  /** 返回已分配的顶点数。 */
  getVertexCount(): number {
    return this.info.count;
  }

  /** 上传当前缓冲区顶点数的数据，源数据数量不得不足；返回是否成功。 */
  update(vertices: Vertices): boolean;
  /** 从源起点上传 vertexCount 个顶点到 offset（以顶点为单位）；返回是否成功。 */
  update(vertices: Vertices, vertexCount: number, offset: number): boolean;
  /** 复制 source 的 GPU 顶点数据，返回是否成功。 */
  update(source: VertexBuffer): boolean;
  update(source: Vertices | VertexBuffer, vertexCount?: number,
    offset = 0): boolean {
    if (source instanceof VertexBuffer) {
      if (vertexCount !== undefined) {
        throw new TypeError('Buffer copies do not accept a vertex range');
      }
      flushGraphics();
      return native.copyVertexBuffer(
        this[graphicsNative], source[graphicsNative]) !== undefined;
    }
    const count = vertexCount ?? this.info.count;
    validateCount(count);
    if (!Number.isInteger(offset) || offset < 0 || offset > 0xffffffff) {
      throw new RangeError('Vertex offset is out of range');
    }
    let bytes: Uint8Array;
    if (source instanceof VertexArray) {
      bytes = source[vertexArrayBytes];
      if (count * 20 > bytes.byteLength) {
        throw new RangeError('Not enough source vertices');
      }
    } else {
      if (!Array.isArray(source)) throw new TypeError('Expected vertex data');
      if (count > source.length) throw new RangeError('Not enough source vertices');
      bytes = new Uint8Array(count * 20);
      for (let i = 0; i < count; i++) {
        const vertex = source[i];
        if (!(vertex instanceof Vertex) || vertex[vertexStorage].byteLength !== 20) {
          throw new TypeError('Expected attached Vertex values');
        }
        bytes.set(vertex[vertexStorage], i * 20);
      }
    }
    if (!this.info.nativeHandle ||
        (offset !== 0 && offset + count > this.info.count)) return false;
    flushGraphics();
    return native.updateVertexBuffer(
      this[graphicsNative], bytes, count, offset) !== undefined;
  }

  /** 交换两缓冲区的数据和配置，先提交排队的绘制以保留快照语义。 */
  swap(other: VertexBuffer): void {
    if (!(other instanceof VertexBuffer)) throw new TypeError('Expected a VertexBuffer');
    if (other === this) return;
    flushGraphics();
    native.swapVertexBuffers(this[graphicsNative], other[graphicsNative]);
  }

  /** 同步复制 source 的数据和配置到当前对象，返回 this。 */
  assign(source: VertexBuffer): this {
    if (!(source instanceof VertexBuffer)) {
      throw new TypeError('Expected a VertexBuffer');
    }
    if (source === this) return this;
    flushGraphics();
    native.assignVertexBuffer(this[graphicsNative], source[graphicsNative]);
    return this;
  }

  /** 返回 OpenGL 缓冲区标识，尚未分配时为 0。 */
  getNativeHandle(): number {
    return this.info.nativeHandle;
  }

  /** 设置顶点组成图元的方式。 */
  setPrimitiveType(type: PrimitiveType): void {
    validatePrimitiveType(type);
    native.setVertexBufferPrimitiveType(this[graphicsNative], type);
  }

  /** 返回图元类型。 */
  getPrimitiveType(): PrimitiveType {
    return this.info.primitiveType;
  }

  /** 设置提供给显卡驱动的数据更新频率提示。 */
  setUsage(usage: VertexBufferUsage): void {
    const index = usageIndex(usage);
    native.setVertexBufferUsage(this[graphicsNative], index);
  }

  /** 返回数据更新频率提示。 */
  getUsage(): VertexBufferUsage {
    return usages[this.info.usage];
  }

  /** 为直接 OpenGL 操作绑定缓冲区；null 解除绑定。 */
  static bind(buffer: VertexBuffer | null): void {
    if (buffer !== null && !(buffer instanceof VertexBuffer)) {
      throw new TypeError('Expected a VertexBuffer or null');
    }
    native.bindVertexBuffer(buffer?.[graphicsNative] ?? null);
  }

  /** 返回当前环境是否支持 GPU 顶点缓冲区。 */
  static isAvailable(): boolean {
    return native.isVertexBufferAvailable();
  }

  protected draw(target: RenderTarget, states: RenderStates): void {
    target[recordVertexBuffer](this, 0, this.info.count, states);
  }

  [dispatchDrawable](target: RenderTarget, states: RenderStates): void {
    if (this.draw === VertexBuffer.prototype.draw) this.draw(target, states);
    else super[dispatchDrawable](target, states);
  }

}
