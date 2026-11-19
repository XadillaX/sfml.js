import { native } from '../internal/native';
import { vertexFromBytes, type Vertex } from './vertex';
import type { Texture } from './texture';

const meshes = new WeakMap<Mesh, object>();

/**
 * Rml::TexturedMesh aggregate of native mesh storage and a texture view.
 *
 * @zh Rml::TexturedMesh，由原生网格存储和纹理视图组成。
 * @ja ネイティブメッシュ領域とテクスチャビューの Rml::TexturedMesh 集約。
 * @ko 네이티브 메시 저장소와 텍스처 뷰로 구성된 Rml::TexturedMesh입니다.
 */
export interface TexturedMesh {
  /**
   * Rml::TexturedMesh::mesh, consumed by RenderManager.makeGeometry.
   *
   * @zh Rml::TexturedMesh::mesh，由 RenderManager.makeGeometry 消费。
   * @ja RenderManager.makeGeometry が消費する Rml::TexturedMesh::mesh。
   * @ko RenderManager.makeGeometry가 소비하는 Rml::TexturedMesh::mesh입니다.
   */
  mesh: Mesh;

  /**
   * Rml::TexturedMesh::texture, passed to Geometry.render.
   *
   * @zh Rml::TexturedMesh::texture，传入 Geometry.render。
   * @ja Geometry.render に渡す Rml::TexturedMesh::texture。
   * @ko Geometry.render에 전달하는 Rml::TexturedMesh::texture입니다.
   */
  texture: Texture;
}

/**
 * Ordered Rml::TexturedMeshList represented by typed native-resource records.
 *
 * @zh 有序的 Rml::TexturedMeshList，以类型化原生资源记录表示。
 * @ja 型付きネイティブリソースレコードで表す順序付き Rml::TexturedMeshList。
 * @ko 타입 지정 네이티브 리소스 레코드로 표현한 순서 있는 Rml::TexturedMeshList입니다.
 */
export type TexturedMeshList = TexturedMesh[];

/**
 * Native-owned Rml::Mesh with shared vertex and index allocations.
 *
 * @zh 原生持有的 Rml::Mesh，提供共享顶点和索引分配。
 * @ja 頂点とインデックスを共有するネイティブ所有の Rml::Mesh。
 * @ko 정점 및 인덱스 할당을 공유하는 네이티브 소유 Rml::Mesh입니다.
 * @remarks
 * Views survive collection and runtime shutdown. makeGeometry validates and
 * snapshots nonempty meshes, then empties the source. Previously exported
 * views remain independent of the immutable geometry.
 * @zh 视图在回收和运行时关闭后仍有效。makeGeometry 校验并快照非空网格后清空源网格；
 * 先前导出的视图与不可变几何资源保持独立。
 * @ja ビューは回収や終了後も有効です。makeGeometry は空でないメッシュを検証・
 * コピーして元を空にします。既存ビューは不変ジオメトリと独立しています。
 * @ko 뷰는 회수 및 종료 후에도 유효합니다. makeGeometry는 비어 있지 않은 메시를
 * 검증·복사한 뒤 원본을 비웁니다. 기존 뷰는 불변 지오메트리와 독립적입니다.
 */
export class Mesh {
  /**
   * Allocate value-initialized native vertex and index vectors.
   *
   * @zh 分配值初始化的原生顶点和索引向量，顶点默认使用不透明黑色。
   * @ja ネイティブ頂点とインデックスを値初期化し、色の既定は不透明な黒です。
   * @ko 네이티브 정점과 인덱스를 값 초기화하며 기본 색은 불투명 검정입니다.
   * @param vertexCount - Number of vertices, default zero.
   * @zh vertexCount - 顶点数，默认为零。
   * @ja vertexCount - 頂点数。既定はゼロ。
   * @ko vertexCount - 정점 수이며 기본값은 0입니다.
   * @param indexCount - Number of indices, default zero.
   * @zh indexCount - 索引数，默认为零。
   * @ja indexCount - インデックス数。既定はゼロ。
   * @ko indexCount - 인덱스 수이며 기본값은 0입니다.
   */
  constructor(vertexCount = 0, indexCount = 0) {
    meshes.set(this, native.createMesh(vertexCount, indexCount));
  }

  /**
   * Byte stride of the pinned native Rml::Vertex layout.
   *
   * @zh 固定版本原生 Rml::Vertex 布局的字节步长。
   * @ja 固定バージョンの Rml::Vertex のバイトストライド。
   * @ko 고정 버전 네이티브 Rml::Vertex의 바이트 간격입니다.
   */
  static readonly vertexStride = 20;

  /**
   * Writable Rml::Mesh::vertices bytes: float32 x/y at 0/4, premultiplied
   * RGBA bytes at 8–11, float32 u/v at 12/16, repeated every 20 bytes.
   *
   * @zh 可写的 Rml::Mesh::vertices 字节：0/4 为 float32 x/y，8–11 为预乘
   * RGBA 字节，12/16 为 float32 u/v，每个顶点 20 字节。
   * @ja 書き込み可能な頂点。0/4 に float32 x/y、8–11 に乗算済み RGBA、
   * 12/16 に float32 u/v を格納し、20 バイト間隔です。
   * @ko 쓰기 가능한 정점 바이트입니다. 0/4는 float32 x/y, 8–11은 미리 곱한
   * RGBA, 12/16은 float32 u/v이며 정점당 20바이트입니다.
   * @returns View retaining the current native allocation.
   * @zh 保活当前原生分配的视图。
   * @ja 現在のネイティブ領域を保持するビュー。
   * @ko 현재 네이티브 할당을 유지하는 뷰입니다.
   */
  get vertices(): Uint8Array {
    return native.meshVertices(meshHandle(this));
  }

  /**
   * Writable Rml::Mesh::indices with three vertex indices per triangle.
   *
   * @zh 可写的 Rml::Mesh::indices，每个三角形使用三个顶点索引。
   * @ja 三角形ごとに 3 個の頂点番号を持つ書き込み可能なインデックス。
   * @ko 삼각형당 정점 인덱스 3개를 가진 쓰기 가능한 인덱스입니다.
   * @returns View retaining the current native index allocation.
   * @zh 保活当前原生索引分配的视图。
   * @ja 現在のネイティブインデックス領域を保持するビュー。
   * @ko 현재 네이티브 인덱스 할당을 유지하는 뷰입니다.
   */
  get indices(): Int32Array {
    return native.meshIndices(meshHandle(this));
  }

  /**
   * Native vertex vector size.
   *
   * @zh 原生顶点向量大小。
   * @ja ネイティブ頂点ベクトルのサイズ。
   * @ko 네이티브 정점 벡터 크기입니다.
   * @returns Current vertex count.
   * @zh 当前顶点数。
   * @ja 現在の頂点数。
   * @ko 현재 정점 수입니다.
   */
  get vertexCount(): number {
    return native.meshVertexCount(meshHandle(this));
  }

  /**
   * Map one Rml::Mesh::vertices entry without copying its allocation.
   *
   * @zh 映射一个 Rml::Mesh::vertices 条目，不复制其分配。
   * @ja 領域をコピーせず Rml::Mesh::vertices の 1 項目をマップします。
   * @ko 할당을 복사하지 않고 Rml::Mesh::vertices 항목 하나를 매핑합니다.
   * @param index - Zero-based vertex index within the current allocation.
   * @zh index - 当前分配内从零开始的顶点索引。
   * @ja index - 現在の領域内のゼロ始まりの頂点番号。
   * @ko index - 현재 할당 내 0부터 시작하는 정점 인덱스입니다.
   * @returns Live fields retaining this allocation after resize or transfer.
   * @zh 扩容或转移后仍保活此分配的实时字段。
   * @ja サイズ変更や転送後もこの領域を保持するライブフィールド。
   * @ko 크기 변경이나 전송 후에도 이 할당을 유지하는 실시간 필드입니다.
   */
  getVertex(index: number): Vertex {
    if (!Number.isInteger(index) || index < 0 || index >= this.vertexCount) {
      throw new RangeError('Vertex index is outside the mesh allocation');
    }
    return vertexFromBytes(this.vertices.subarray(
      index * Mesh.vertexStride, (index + 1) * Mesh.vertexStride));
  }

  /**
   * Resize native vectors in fresh storage, preserving their common prefix.
   *
   * @zh 在新存储中调整原生向量大小，保留共同前缀。
   * @ja 共通の先頭部分を保持し、新しい領域でベクトルのサイズを変更します。
   * @ko 공통 접두부를 유지하며 새 저장소에서 벡터 크기를 변경합니다.
   * @param vertexCount - New vertex count; new vertices are value-initialized.
   * @zh vertexCount - 新顶点数；新增顶点值初始化，颜色为不透明黑色。
   * @ja vertexCount - 新しい頂点数。追加分は値初期化し、不透明な黒です。
   * @ko vertexCount - 새 정점 수이며 추가 정점은 불투명 검정으로 값 초기화됩니다.
   * @param indexCount - New index count; new indices are zeroed.
   * @zh indexCount - 新索引数；新增索引清零。
   * @ja indexCount - 新しいインデックス数。追加分はゼロ初期化します。
   * @ko indexCount - 새 인덱스 수이며 추가 인덱스는 0으로 초기화됩니다.
   * @remarks
   * Previously returned views retain the old storage; obtain new views to edit
   * the resized mesh.
   * @zh 先前返回的视图保留旧存储；编辑调整后的网格需重新获取视图。
   * @ja 既存ビューは古い領域を保持します。変更後の編集には新しいビューを取得します。
   * @ko 기존 뷰는 이전 저장소를 유지하며 변경된 메시 편집에는 새 뷰를 사용합니다.
   */
  resize(vertexCount: number, indexCount: number): void {
    native.meshResize(meshHandle(this), vertexCount, indexCount);
  }

  /**
   * Rml::Mesh::operator bool; checks only whether indices are nonempty.
   *
   * @zh Rml::Mesh::operator bool；仅检查索引是否非空。
   * @ja Rml::Mesh::operator bool。インデックスが空でないかだけを確認します。
   * @ko Rml::Mesh::operator bool이며 인덱스가 비어 있지 않은지만 검사합니다.
   * @returns Native truth value; makeGeometry performs full validation.
   * @zh 原生布尔值；完整校验由 makeGeometry 执行。
   * @ja ネイティブ真偽値。完全な検証は makeGeometry が行います。
   * @ko 네이티브 참값이며 전체 검증은 makeGeometry에서 수행합니다.
   */
  get isValid(): boolean {
    return native.meshIsValid(meshHandle(this));
  }

  /**
   * Compare native Rml::Mesh vertices and indices.
   *
   * @zh 比较原生 Rml::Mesh 顶点和索引。
   * @ja ネイティブ Rml::Mesh の頂点とインデックスを比較します。
   * @ko 네이티브 Rml::Mesh의 정점 및 인덱스를 비교합니다.
   * @param other - Mesh to compare.
   * @zh other - 待比较网格。
   * @ja other - 比較するメッシュ。
   * @ko other - 비교할 메시입니다.
   * @returns Native operator== result.
   * @zh 原生 operator== 结果。
   * @ja ネイティブ operator== の結果。
   * @ko 네이티브 operator== 결과입니다.
   */
  equals(other: Mesh): boolean {
    return native.meshEquals(meshHandle(this), meshHandle(other));
  }
}

/**
 * Resolve native mesh storage.
 *
 * @internal
 * @param value - Public mesh.
 * @returns Native handle.
 */
export function meshHandle(value: Mesh): object {
  const handle = meshes.get(value);
  if (!handle) {
    throw new TypeError('Expected an owned mesh');
  }
  return handle;
}

/**
 * Wrap owned native mesh storage.
 *
 * @internal
 * @param handle - Native handle.
 * @returns Public mesh.
 */
export function meshFromNative(handle: object): Mesh {
  const result = Object.create(Mesh.prototype) as Mesh;
  meshes.set(result, handle);
  return result;
}
