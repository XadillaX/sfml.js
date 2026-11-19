import { native } from '../internal/native';
import type { NativeClipMaskGeometry } from '../internal/native';
import { geometryHandle, geometryFromNative } from './geometry';
import type {
  ClipMaskGeometry, ElementRectangle,
} from '../dom/elements/element-utilities';

/**
 * Owned snapshot of Rml::RenderState.
 *
 * @zh Rml::RenderState 的自有快照。
 * @ja Rml::RenderState の所有スナップショット。
 * @ko Rml::RenderState의 소유 스냅샷입니다.
 * @remarks
 * Reads and submissions copy matrices and meshes. Release snapshot geometries
 * when finished. Submitting a snapshot keeps independent native copies.
 * @zh 读取和提交均复制矩阵与网格。用完后释放快照几何；
 * 提交的状态持有独立原生副本。
 * @ja 取得と設定は行列とメッシュをコピーします。取得したジオメトリは使用後に
 * 解放してください。設定した状態は独立したネイティブコピーを保持します。
 * @ko 조회와 제출은 행렬과 메시를 복사합니다. 사용 후 스냅샷 지오메트리를
 * 해제하세요. 제출한 상태는 독립 네이티브 사본을 유지합니다.
 */
export interface RenderState {
  /**
   * Integer Rml::RenderState::scissor_region; null means disabled.
   *
   * @zh 整数 Rml::RenderState::scissor_region；null 表示禁用。
   * @ja 整数の Rml::RenderState::scissor_region。null は無効化。
   * @ko 정수 Rml::RenderState::scissor_region이며 null은 비활성화입니다.
   */
  scissorRegion: ElementRectangle | null;

  /**
   * Rml::RenderState::clip_mask_list with independently owned geometry.
   *
   * @zh 持有独立几何的 Rml::RenderState::clip_mask_list。
   * @ja 独立したジオメトリを所有する Rml::RenderState::clip_mask_list。
   * @ko 독립 지오메트리를 소유하는 Rml::RenderState::clip_mask_list입니다.
   */
  clipMaskList: ClipMaskGeometry[];

  /**
   * Rml::RenderState::transform as a copied column-major 4×4 matrix.
   *
   * @zh Rml::RenderState::transform 的列主序 4×4 矩阵副本。
   * @ja Rml::RenderState::transform の列優先 4×4 行列コピー。
   * @ko Rml::RenderState::transform의 열 우선 4×4 행렬 사본입니다.
   */
  transform: Float32Array;
}

/**
 * Compare Rml::ClipMaskGeometry with native pointer equality semantics.
 *
 * @zh 按原生指针相等语义比较 Rml::ClipMaskGeometry。
 * @ja ネイティブのポインター同一性で Rml::ClipMaskGeometry を比較します。
 * @ko 네이티브 포인터 동일성으로 Rml::ClipMaskGeometry를 비교합니다.
 * @param left - First mask.
 * @zh left - 第一个蒙版。
 * @ja left - 最初のマスク。
 * @ko left - 첫 번째 마스크입니다.
 * @param right - Second mask.
 * @zh right - 第二个蒙版。
 * @ja right - 二番目のマスク。
 * @ko right - 두 번째 마스크입니다.
 * @returns Operations and offsets must match by value; geometry and transform
 * must reference the same objects. Null transforms compare equal.
 * @zh 操作与偏移按值比较；几何与变换必须引用同一对象。null 变换相等。
 * @ja 操作と位置は値、ジオメトリと行列は同じ参照である必要があります。
 * null 行列同士は同一です。
 * @ko 연산과 오프셋은 값이 같고 지오메트리와 행렬은 같은 참조여야 합니다.
 * null 행렬끼리는 같습니다.
 */
export function clipMaskGeometryEquals(
  left: ClipMaskGeometry, right: ClipMaskGeometry,
): boolean {
  return native.clipMaskGeometryEquals(
    clipMaskToNative(left), clipMaskToNative(right));
}

/**
 * Convert a mask after reading its JS accessors.
 *
 * @internal
 * @param mask - Public mask.
 * @returns Native input.
 */
export function clipMaskToNative(mask: ClipMaskGeometry):
NativeClipMaskGeometry {
  return {
    operation: mask.operation, geometry: geometryHandle(mask.geometry),
    absoluteOffset: mask.absoluteOffset, transform: mask.transform,
  };
}

/**
 * Wrap copied native geometry.
 *
 * @internal
 * @param mask - Native snapshot.
 * @returns Public snapshot.
 */
export function clipMaskFromNative(mask: NativeClipMaskGeometry):
ClipMaskGeometry {
  return { ...mask, geometry: geometryFromNative(mask.geometry) };
}
