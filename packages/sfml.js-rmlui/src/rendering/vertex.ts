import { native } from '../internal/native';
import type { VariantColour, VariantVector2 } from '../values/types';

/**
 * Rml::ColourbPremultiplied channels, each an integer from 0 through 255.
 *
 * @zh Rml::ColourbPremultiplied 通道，各为 0 至 255 的整数。
 * @ja 各成分が 0～255 の整数である Rml::ColourbPremultiplied。
 * @ko 각 채널이 0에서 255까지 정수인 Rml::ColourbPremultiplied입니다.
 */
export type VertexColour = Omit<VariantColour, 'type'>;

interface VertexViews {
  position: Float32Array;
  colour: Uint8Array;
  texCoord: Float32Array;
}

const vertices = new WeakMap<Vertex, VertexViews>();

/**
 * Resolve mapped native vertex fields.
 *
 * @internal
 * @param vertex - Public vertex.
 * @returns Native views.
 */
function mapping(vertex: Vertex): VertexViews {
  const value = vertices.get(vertex);
  if (!value) {
    throw new TypeError('Expected a Vertex');
  }
  return value;
}

/**
 * Map the pinned Rml::Vertex layout.
 *
 * @internal
 * @param bytes - Native mesh vertex bytes.
 * @returns Field views retaining the native allocation.
 */
function mapFields(bytes: Uint8Array): VertexViews {
  const { buffer, byteOffset } = bytes;
  return {
    position: new Float32Array(buffer, byteOffset, 2),
    colour: new Uint8Array(buffer, byteOffset + 8, 4),
    texCoord: new Float32Array(buffer, byteOffset + 12, 2),
  };
}

/**
 * Validate both float32 coordinates before writing either.
 *
 * @internal
 * @param view - Native float mapping.
 * @param value - New coordinates.
 */
function writeVector(view: Float32Array, value: VariantVector2): void {
  const { x, y } = value;
  if (typeof x !== 'number' || typeof y !== 'number' ||
      !Number.isFinite(Math.fround(x)) || !Number.isFinite(Math.fround(y))) {
    throw new RangeError('Vertex coordinates must be finite float32 values');
  }
  view.set([ x, y ]);
}

/**
 * Typed view of a native Rml::Vertex allocation.
 *
 * @zh 原生 Rml::Vertex 分配的类型化视图。
 * @ja ネイティブ Rml::Vertex 領域の型付きビュー。
 * @ko 네이티브 Rml::Vertex 할당의 타입 뷰입니다.
 * @remarks
 * Field reads copy values; typed arrays share native memory. Views survive mesh
 * resize, geometry transfer, collection and shutdown, retaining old storage.
 * @zh 字段读取返回副本；类型化数组共享原生内存。网格扩容、几何转移、回收或关闭后，
 * 视图仍保活旧存储。
 * @ja フィールド取得はコピー、配列は共有です。サイズ変更・転送・回収・終了後も
 * 古い領域を保持します。
 * @ko 필드 조회는 사본이며 배열은 공유됩니다. 크기 변경, 전송, 회수 및 종료 후에도
 * 이전 저장소를 유지합니다.
 */
export class Vertex {
  /**
   * Value-initialize a native vertex: zero vectors and opaque black colour.
   *
   * @zh 值初始化原生顶点：零向量和不透明黑色。
   * @ja ゼロベクトルと不透明な黒でネイティブ頂点を値初期化します。
   * @ko 영벡터와 불투명 검정으로 네이티브 정점을 값 초기화합니다.
   */
  constructor() {
    vertices.set(this, mapFields(native.meshVertices(native.createMesh(1, 0))));
  }

  /**
   * Writable Rml::Vertex::position mapping.
   *
   * @zh 可写的 Rml::Vertex::position 映射。
   * @ja 書き込み可能な Rml::Vertex::position マッピング。
   * @ko 쓰기 가능한 Rml::Vertex::position 매핑입니다.
   * @returns Shared x/y float32 fields.
   * @zh 共享的 x/y float32 字段。
   * @ja 共有 x/y float32 フィールド。
   * @ko 공유 x/y float32 필드입니다.
   */
  get positionView(): Float32Array {
    return mapping(this).position;
  }

  /**
   * Writable premultiplied Rml::Vertex::colour bytes.
   *
   * @zh 可写的预乘 Rml::Vertex::colour 字节。
   * @ja 書き込み可能な乗算済み Rml::Vertex::colour バイト。
   * @ko 쓰기 가능한 미리 곱한 Rml::Vertex::colour 바이트입니다.
   * @returns Shared RGBA bytes; no automatic premultiplication.
   * @zh 共享 RGBA 字节；不自动执行预乘。
   * @ja 共有 RGBA バイト。自動乗算は行いません。
   * @ko 공유 RGBA 바이트이며 자동으로 미리 곱하지 않습니다.
   */
  get colourView(): Uint8Array {
    return mapping(this).colour;
  }

  /**
   * Writable Rml::Vertex::tex_coord mapping.
   *
   * @zh 可写的 Rml::Vertex::tex_coord 映射。
   * @ja 書き込み可能な Rml::Vertex::tex_coord マッピング。
   * @ko 쓰기 가능한 Rml::Vertex::tex_coord 매핑입니다.
   * @returns Shared u/v float32 fields.
   * @zh 共享的 u/v float32 字段。
   * @ja 共有 u/v float32 フィールド。
   * @ko 공유 u/v float32 필드입니다.
   */
  get texCoordView(): Float32Array {
    return mapping(this).texCoord;
  }

  /**
   * Rml::Vertex::position in pixels.
   *
   * @zh 像素单位的 Rml::Vertex::position。
   * @ja ピクセル単位の Rml::Vertex::position。
   * @ko 픽셀 단위의 Rml::Vertex::position입니다.
   * @returns Copied coordinates.
   * @zh 坐标副本。
   * @ja 座標のコピー。
   * @ko 좌표 사본입니다.
   */
  get position(): VariantVector2 {
    const [ x, y ] = mapping(this).position;
    return { x, y };
  }

  /**
   * Write both native position coordinates.
   *
   * @zh 写入两个原生位置坐标。
   * @ja ネイティブ位置の両座標を書き込みます。
   * @ko 네이티브 위치의 두 좌표를 씁니다.
   * @param value - Finite float32 coordinates.
   * @zh value - 有限 float32 坐标。
   * @ja value - 有限 float32 座標。
   * @ko value - 유한 float32 좌표입니다.
   */
  set position(value: VariantVector2) {
    writeVector(mapping(this).position, value);
  }

  /**
   * Rml::Vertex::colour with premultiplied alpha.
   *
   * @zh 使用预乘 alpha 的 Rml::Vertex::colour。
   * @ja 乗算済みアルファを持つ Rml::Vertex::colour。
   * @ko 미리 곱한 알파를 사용하는 Rml::Vertex::colour입니다.
   * @returns Copied RGBA bytes.
   * @zh RGBA 字节副本。
   * @ja RGBA バイトのコピー。
   * @ko RGBA 바이트 사본입니다.
   */
  get colour(): VertexColour {
    const [ red, green, blue, alpha ] = mapping(this).colour;
    return { red, green, blue, alpha };
  }

  /**
   * Write all native colour bytes after validation.
   *
   * @zh 校验后写入所有原生颜色字节。
   * @ja 検証後にすべてのネイティブ色バイトを書き込みます。
   * @ko 검증 후 모든 네이티브 색상 바이트를 씁니다.
   * @param value - Premultiplied RGBA integers from 0 through 255.
   * @zh value - 0 至 255 的预乘 RGBA 整数。
   * @ja value - 0～255 の乗算済み RGBA 整数。
   * @ko value - 0에서 255까지의 미리 곱한 RGBA 정수입니다.
   */
  set colour(value: VertexColour) {
    const view = mapping(this).colour;
    const { red, green, blue, alpha } = value;
    const bytes = [ red, green, blue, alpha ];
    if (bytes.some(byte => !Number.isInteger(byte) || byte < 0 || byte > 255)) {
      throw new RangeError('Vertex colour must contain RGBA bytes');
    }
    view.set(bytes);
  }

  /**
   * Rml::Vertex::tex_coord normalized texture coordinates.
   *
   * @zh Rml::Vertex::tex_coord 归一化纹理坐标。
   * @ja Rml::Vertex::tex_coord の正規化テクスチャ座標。
   * @ko Rml::Vertex::tex_coord의 정규화 텍스처 좌표입니다.
   * @returns Copied u/v coordinates as x/y.
   * @zh 以 x/y 表示的 u/v 坐标副本。
   * @ja x/y で表す u/v 座標のコピー。
   * @ko x/y로 표현한 u/v 좌표 사본입니다.
   */
  get texCoord(): VariantVector2 {
    const [ x, y ] = mapping(this).texCoord;
    return { x, y };
  }

  /**
   * Write both native texture coordinates.
   *
   * @zh 写入两个原生纹理坐标。
   * @ja ネイティブテクスチャの両座標を書き込みます。
   * @ko 네이티브 텍스처의 두 좌표를 씁니다.
   * @param value - Finite float32 u/v coordinates represented as x/y.
   * @zh value - 以 x/y 表示的有限 float32 u/v 坐标。
   * @ja value - x/y で表す有限 float32 u/v 座標。
   * @ko value - x/y로 표현한 유한 float32 u/v 좌표입니다.
   */
  set texCoord(value: VariantVector2) {
    writeVector(mapping(this).texCoord, value);
  }

  /**
   * Compare fields using Rml::Vertex::operator== semantics.
   *
   * @zh 按 Rml::Vertex::operator== 语义比较字段。
   * @ja Rml::Vertex::operator== の意味でフィールドを比較します。
   * @ko Rml::Vertex::operator== 의미로 필드를 비교합니다.
   * @param other - Vertex to compare.
   * @zh other - 待比较顶点。
   * @ja other - 比較する頂点。
   * @ko other - 비교할 정점입니다.
   * @returns Field equality, with NaN unequal and signed zeros equal.
   * @zh 字段是否相等；NaN 不相等，有符号零相等。
   * @ja NaN は不一致、符号付きゼロは一致とするフィールドの等価性。
   * @ko 필드 동등성이며 NaN은 다르고 부호 있는 0은 같습니다.
   */
  equals(other: Vertex): boolean {
    const left = mapping(this);
    const right = mapping(other);
    return left.position.every((value, i) => value === right.position[i]) &&
      left.colour.every((value, i) => value === right.colour[i]) &&
      left.texCoord.every((value, i) => value === right.texCoord[i]);
  }
}

/**
 * Wrap one native mesh vertex without copying its storage.
 *
 * @internal
 * @param bytes - Validated native vertex slice.
 * @returns Typed vertex.
 */
export function vertexFromBytes(bytes: Uint8Array): Vertex {
  const result = Object.create(Vertex.prototype) as Vertex;
  vertices.set(result, mapFields(bytes));
  return result;
}
