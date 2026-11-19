import { native } from '../internal/native';
import { meshFromNative, type Mesh } from './mesh';
import { textureHandle, type Texture } from './texture';
import {
  compiledShaderHandle, type CompiledShader,
} from './compiled-resources';
import type { VariantVector2 } from '../values/types';

const geometries = new WeakMap<Geometry, object>();

/**
 * Choose whether releasing geometry preserves or clears its owned mesh.
 *
 * @zh 原生几何资源释放模式。
 * @ja ネイティブジオメトリの解放モード。
 * @ko 지오메트리 해제 시 소유 메시를 유지할지 지울지 선택합니다.
 */
export enum GeometryReleaseMode {
  /**
   * Return the owned mesh when releasing geometry.
   *
   * @zh 释放几何资源时返回自有网格。
   * @ja ジオメトリ解放時に所有メッシュを返します。
   * @ko 지오메트리 해제 시 소유 메시를 반환합니다.
   */
  ReturnMesh = 0,
  /**
   * Clear the mesh and return an empty mesh.
   *
   * @zh 清空网格并返回空网格。
   * @ja メッシュを消去して空メッシュを返します。
   * @ko 메시를 지우고 빈 메시를 반환합니다.
   */
  ClearMesh = 1,
}

/**
 * Unique Rml::Geometry owning an immutable native mesh snapshot.
 *
 * @zh 持有不可变原生网格快照的唯一 Rml::Geometry。
 * @ja 不変なネイティブメッシュのコピーを所有する一意の Rml::Geometry。
 * @ko 불변 네이티브 메시 사본을 소유하는 고유 Rml::Geometry입니다.
 */
export class Geometry {
  /**
   * Create an empty native geometry resource.
   *
   * @zh 创建空原生几何资源。
   * @ja 空のネイティブジオメトリリソースを作成します。
   * @ko 빈 네이티브 지오메트리 리소스를 생성합니다.
   */
  constructor() {
    geometries.set(this, native.createGeometry());
  }

  /**
   * Read Rml::Geometry::InvalidHandle, the uint32 stable-index sentinel.
   *
   * @zh 读取 Rml::Geometry::InvalidHandle，即 uint32 稳定索引哨兵值。
   * @ja uint32 安定インデックスの無効値 Rml::Geometry::InvalidHandle。
   * @ko uint32 안정 인덱스 무효값인 Rml::Geometry::InvalidHandle을 읽습니다.
   * @returns Native invalid index, 4294967295.
   * @zh 原生无效索引 4294967295。
   * @ja ネイティブ無効インデックス 4294967295。
   * @ko 네이티브 무효 인덱스 4294967295입니다.
   */
  static invalidHandle(): 4294967295 {
    return 4294967295;
  }

  /**
   * Native resource validity, independent of lazy GPU compilation.
   *
   * @zh 原生资源有效性，与延迟 GPU 编译无关。
   * @ja 遅延 GPU コンパイルとは独立したネイティブリソースの有効性。
   * @ko 지연 GPU 컴파일과 독립적인 네이티브 리소스 유효성입니다.
   * @returns False for an empty or released geometry.
   * @zh 空资源或已释放资源返回 false。
   * @ja 空または解放済みの場合は false。
   * @ko 비어 있거나 해제된 리소스는 false입니다.
   */
  get isValid(): boolean {
    return native.geometryIsValid(geometryHandle(this));
  }

  /**
   * Invoke Rml::Geometry::Render with native rounded translation.
   *
   * @zh 使用原生取整平移调用 Rml::Geometry::Render。
   * @ja ネイティブで丸めた移動量で Rml::Geometry::Render を呼びます。
   * @ko 네이티브에서 반올림한 이동량으로 Rml::Geometry::Render를 호출합니다.
   * @param translation - Finite pixel translation.
   * @zh translation - 有限像素平移。
   * @ja translation - 有限値のピクセル移動量。
   * @ko translation - 유한 픽셀 이동량입니다.
   * @param texture - Optional texture from the same render manager.
   * @zh texture - 来自同一渲染管理器的可选纹理。
   * @ja texture - 同じ描画管理器の任意テクスチャ。
   * @ko texture - 같은 렌더 관리자의 선택적 텍스처입니다.
   * @param shader - Optional shader from the same render manager.
   * @zh shader - 来自同一渲染管理器的可选着色器。
   * @ja shader - 同じ描画管理器の任意シェーダー。
   * @ko shader - 같은 렌더 관리자의 선택적 셰이더입니다.
   */
  render(
    translation: VariantVector2, texture?: Texture, shader?: CompiledShader,
  ): void {
    native.renderGeometry(geometryHandle(this), translation,
      texture === undefined ? undefined : textureHandle(texture),
      shader === undefined ? undefined : compiledShaderHandle(shader));
  }

  /**
   * Copy Rml::Geometry::GetMesh into independently owned native storage.
   *
   * @zh 将 Rml::Geometry::GetMesh 复制到独立持有的原生存储。
   * @ja Rml::Geometry::GetMesh を独立所有のネイティブ領域へコピーします。
   * @ko Rml::Geometry::GetMesh를 독립 소유 네이티브 저장소로 복사합니다.
   * @returns Mutable snapshot; throws for empty or released geometry.
   * @zh 可变快照；空资源或已释放资源会抛错。
   * @ja 変更可能なコピー。空または解放済みの場合は例外。
   * @ko 변경 가능한 사본이며 비어 있거나 해제된 리소스는 예외입니다.
   */
  getMesh(): Mesh {
    return meshFromNative(native.geometryGetMesh(geometryHandle(this)));
  }

  /**
   * Invoke Rml::Geometry::Release; repeated release returns an empty mesh.
   *
   * @zh 调用 Rml::Geometry::Release；重复释放返回空网格。
   * @ja Rml::Geometry::Release を呼び、再解放時は空メッシュを返します。
   * @ko Rml::Geometry::Release를 호출하며 재해제 시 빈 메시를 반환합니다.
   * @param mode - Return or discard native mesh storage.
   * @zh mode - 返回或丢弃原生网格存储。
   * @ja mode - ネイティブメッシュ領域を返すか破棄するか。
   * @ko mode - 네이티브 메시 저장소 반환 또는 폐기입니다.
   * @returns Owned mesh; default mode is ReturnMesh.
   * @zh 自有网格；默认模式为 ReturnMesh。
   * @ja 所有メッシュ。既定モードは ReturnMesh。
   * @ko 소유 메시이며 기본 모드는 ReturnMesh입니다.
   */
  release(mode = GeometryReleaseMode.ReturnMesh): Mesh {
    return meshFromNative(native.releaseGeometry(geometryHandle(this), mode));
  }
}

/**
 * Resolve a native geometry token.
 *
 * @internal
 * @param value - Public geometry.
 * @returns Native handle.
 */
export function geometryHandle(value: Geometry): object {
  const handle = geometries.get(value);
  if (!handle) {
    throw new TypeError('Expected an owned geometry');
  }
  return handle;
}

/**
 * Wrap unique native geometry storage.
 *
 * @internal
 * @param handle - Native handle.
 * @returns Public geometry.
 */
export function geometryFromNative(handle: object): Geometry {
  const result = Object.create(Geometry.prototype) as Geometry;
  geometries.set(result, handle);
  return result;
}
