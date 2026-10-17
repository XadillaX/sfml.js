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

/**
 * Strings distinguish the single-argument Usage and PrimitiveType constructors.
 * @zh 使用字符串区分单参数的 Usage 和 PrimitiveType 构造函数。
 * @ja 文字列により単一引数の Usage コンストラクターと PrimitiveType コンストラクターを区別します。
 * @ko 문자열로 단일 인수 Usage 생성자와 PrimitiveType 생성자를 구분합니다.
 */
export enum VertexBufferUsage {
  /**
   * Data is updated frequently, usually every frame.
   * @zh 数据频繁更新，通常每帧更新。
   * @ja データは頻繁に、通常は毎フレーム更新されます。
   * @ko 데이터가 자주 갱신되며 보통 매 프레임 갱신됩니다.
   */
  Stream = 'stream',
  /**
   * Data is updated occasionally.
   * @zh 数据不定期更新。
   * @ja データは不定期に更新されます。
   * @ko 데이터가 비정기적으로 갱신됩니다.
   */
  Dynamic = 'dynamic',
  /**
   * Data is rarely updated.
   * @zh 数据很少更新。
   * @ja データはほとんど更新されません。
   * @ko 데이터가 드물게 갱신됩니다.
   */
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

/**
 * GPU storage owned by Native; draw records a handle without uploading
 * vertices.
 * @zh Native 拥有的 GPU 存储；draw 录制句柄而不上传顶点。
 * @ja Native 所有の GPU ストレージ。draw は頂点をアップロードせずにハンドルを記録します。
 * @ko Native가 소유하는 GPU 저장 공간입니다. draw는 꼭짓점을 업로드하지 않고 핸들을 기록합니다.
 */
export class VertexBuffer extends Drawable {
  /**
   * Vertex buffer usage enumeration.
   * @zh 顶点缓冲区使用方式枚举。
   * @ja 頂点バッファー使用方法の列挙型。
   * @ko 꼭짓점 버퍼 사용 방식 열거형입니다.
   */
  static readonly Usage = VertexBufferUsage;
  readonly [graphicsNative]: NativeGraphicsHandle<'vertexBuffer'>;
  readonly [vertexBufferId]: number;
  /**
   * Read-only view of native vertex buffer metadata.
   * @zh 原生顶点缓冲区元信息只读视图。
   * @ja ネイティブ頂点バッファーメタデータの読み取り専用ビュー。
   * @ko 네이티브 꼭짓점 버퍼 메타데이터의 읽기 전용 뷰입니다.
   */
  private readonly info: Readonly<NativeVertexBufferInfo>;

  /**
   * Creates a Points/Stream buffer with no vertices allocated.
   * @zh 创建未分配顶点的 Points/Stream 缓冲区。
   * @ja 頂点未割り当ての Points/Stream バッファーを作成します。
   * @ko 꼭짓점이 할당되지 않은 Points/Stream 버퍼를 만듭니다.
   */
  constructor();
  /**
   * Specifies the primitive type, using Stream usage.
   * @zh 指定图元类型，使用 Stream 更新方式。
   * @ja プリミティブ型を指定し、使用方法は Stream とします。
   * @ko 프리미티브 형식을 지정하고 Stream 사용 방식을 적용합니다.
   */
  constructor(type: PrimitiveType);
  /**
   * Specifies usage, using the Points primitive type.
   * @zh 指定更新方式，使用 Points 图元类型。
   * @ja 使用方法を指定し、プリミティブ型は Points とします。
   * @ko 사용 방식을 지정하고 Points 프리미티브 형식을 적용합니다.
   */
  constructor(usage: VertexBufferUsage);
  /**
   * Specifies primitive type and usage.
   * @zh 指定图元类型和更新方式。
   * @ja プリミティブ型と使用方法を指定します。
   * @ko 프리미티브 형식과 사용 방식을 지정합니다.
   */
  constructor(type: PrimitiveType, usage: VertexBufferUsage);
  /**
   * Copies GPU vertex data, primitive type and usage.
   * @zh 复制 GPU 顶点数据、图元类型和更新方式。
   * @ja GPU 頂点データ、プリミティブ型、使用方法をコピーします。
   * @ko GPU 꼭짓점 데이터, 프리미티브 형식 및 사용 방식을 복사합니다.
   */
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

  /**
   * Allocates the specified number of vertices on the GPU and returns success;
   * submits previously queued draws.
   * @zh 在 GPU 上分配指定数量的顶点，返回是否成功；提交此前排队的绘制。
   * @ja GPU 上に指定数の頂点を割り当て、成功したかを返します。以前にキューに入れた描画を送信します。
   * @ko GPU에 지정한 수의 꼭짓점을 할당하고 성공 여부를 반환합니다. 이전에 대기 중이던 그리기를 제출합니다.
   */
  create(vertexCount: number): boolean {
    validateCount(vertexCount);
    flushGraphics();
    return native.allocateVertexBuffer(
      this[graphicsNative], vertexCount) !== undefined;
  }

  /**
   * Returns the allocated vertex count.
   * @zh 返回已分配的顶点数。
   * @ja 割り当て済み頂点数を返します。
   * @ko 할당된 꼭짓점 수를 반환합니다.
   */
  getVertexCount(): number {
    return this.info.count;
  }

  /**
   * Uploads data for the current buffer's vertex count; the source must contain
   * enough vertices. Returns whether it succeeded.
   * @zh 上传当前缓冲区顶点数的数据，源数据数量不得不足；返回是否成功。
   * @ja 現在のバッファーの頂点数分のデータをアップロードします。ソースの頂点数が不足してはいけません。成功したかを返します。
   * @ko 현재 버퍼의 꼭짓점 수만큼 데이터를 업로드합니다. 소스에는 충분한 꼭짓점이 있어야 합니다. 성공 여부를 반환합니다.
   */
  update(vertices: Vertices): boolean;
  /**
   * Uploads vertexCount vertices from the start of the source to offset (in
   * vertices); returns whether it succeeded.
   * @zh 从源起点上传 vertexCount 个顶点到 offset（以顶点为单位）；返回是否成功。
   * @ja ソースの先頭から vertexCount 個の頂点を offset（頂点単位）にアップロードし、成功したかを返します。
   * @ko 소스 시작부터 vertexCount개의 꼭짓점을 offset(꼭짓점 단위)에 업로드하고 성공 여부를 반환합니다.
   */
  update(vertices: Vertices, vertexCount: number, offset: number): boolean;
  /**
   * Copies source's GPU vertex data and returns whether it succeeded.
   * @zh 复制 source 的 GPU 顶点数据，返回是否成功。
   * @ja source の GPU 頂点データをコピーし、成功したかを返します。
   * @ko source의 GPU 꼭짓점 데이터를 복사하고 성공 여부를 반환합니다.
   */
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

  /**
   * Swaps data and settings of two buffers, first submitting queued draws to
   * preserve snapshot semantics.
   * @zh 交换两缓冲区的数据和配置，先提交排队的绘制以保留快照语义。
   * @ja 二つのバッファーのデータと設定を交換します。スナップショットの意味を保つため、先にキュー内の描画を送信します。
   * @ko 두 버퍼의 데이터와 설정을 교환합니다. 스냅샷 의미를 유지하기 위해 대기 중인 그리기를 먼저 제출합니다.
   */
  swap(other: VertexBuffer): void {
    if (!(other instanceof VertexBuffer)) throw new TypeError('Expected a VertexBuffer');
    if (other === this) return;
    flushGraphics();
    native.swapVertexBuffers(this[graphicsNative], other[graphicsNative]);
  }

  /**
   * Synchronously copies source's data and settings into this object and
   * returns this.
   * @zh 同步复制 source 的数据和配置到当前对象，返回 this。
   * @ja source のデータと設定を現在のオブジェクトに同期的にコピーし、this を返します。
   * @ko source의 데이터와 설정을 현재 객체에 동기적으로 복사하고 this를 반환합니다.
   */
  assign(source: VertexBuffer): this {
    if (!(source instanceof VertexBuffer)) {
      throw new TypeError('Expected a VertexBuffer');
    }
    if (source === this) return this;
    flushGraphics();
    native.assignVertexBuffer(this[graphicsNative], source[graphicsNative]);
    return this;
  }

  /**
   * Returns the OpenGL buffer identifier, or 0 if not yet allocated.
   * @zh 返回 OpenGL 缓冲区标识，尚未分配时为 0。
   * @ja OpenGL バッファー識別子を返します。未割り当てなら 0 です。
   * @ko OpenGL 버퍼 식별자를 반환합니다. 아직 할당되지 않았으면 0입니다.
   */
  getNativeHandle(): number {
    return this.info.nativeHandle;
  }

  /**
   * Sets how vertices form primitives.
   * @zh 设置顶点组成图元的方式。
   * @ja 頂点からプリミティブを構成する方法を設定します。
   * @ko 꼭짓점이 프리미티브를 구성하는 방식을 설정합니다.
   */
  setPrimitiveType(type: PrimitiveType): void {
    validatePrimitiveType(type);
    native.setVertexBufferPrimitiveType(this[graphicsNative], type);
  }

  /**
   * Returns the primitive type.
   * @zh 返回图元类型。
   * @ja プリミティブ型を返します。
   * @ko 프리미티브 형식을 반환합니다.
   */
  getPrimitiveType(): PrimitiveType {
    return this.info.primitiveType;
  }

  /**
   * Sets the data update frequency hint for the graphics driver.
   * @zh 设置提供给显卡驱动的数据更新频率提示。
   * @ja グラフィックスドライバーに渡すデータ更新頻度のヒントを設定します。
   * @ko 그래픽 드라이버에 제공할 데이터 갱신 빈도 힌트를 설정합니다.
   */
  setUsage(usage: VertexBufferUsage): void {
    const index = usageIndex(usage);
    native.setVertexBufferUsage(this[graphicsNative], index);
  }

  /**
   * Returns the data update frequency hint.
   * @zh 返回数据更新频率提示。
   * @ja データ更新頻度のヒントを返します。
   * @ko 데이터 갱신 빈도 힌트를 반환합니다.
   */
  getUsage(): VertexBufferUsage {
    return usages[this.info.usage];
  }

  /**
   * Binds a buffer for direct OpenGL operations; null unbinds it.
   * @zh 为直接 OpenGL 操作绑定缓冲区；null 解除绑定。
   * @ja OpenGL 直接操作用にバッファーをバインドします。null はバインドを解除します。
   * @ko 직접 OpenGL 작업을 위해 버퍼를 바인딩합니다. null은 바인딩을 해제합니다.
   */
  static bind(buffer: VertexBuffer | null): void {
    if (buffer !== null && !(buffer instanceof VertexBuffer)) {
      throw new TypeError('Expected a VertexBuffer or null');
    }
    native.bindVertexBuffer(buffer?.[graphicsNative] ?? null);
  }

  /**
   * Returns whether the current environment supports GPU vertex buffers.
   * @zh 返回当前环境是否支持 GPU 顶点缓冲区。
   * @ja 現在の環境が GPU 頂点バッファーに対応しているかを返します。
   * @ko 현재 환경의 GPU 꼭짓점 버퍼 지원 여부를 반환합니다.
   */
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
