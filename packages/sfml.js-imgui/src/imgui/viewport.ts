import { native } from '../internal/native';
import type { ImVec2Value, ImGuiViewport } from '../types';

/**
 * Get the main viewport.
 *
 * @zh 获取主视口。
 * @ja メインビューポートを取得します。
 * @ko 주 뷰포트를 가져옵니다.
 *
 * @remarks
 * - Currently represents the Platform Window created by the application which
 *   is hosting our Dear ImGui windows.
 *
 * - In 'docking' branch with multi-viewport enabled, we extend this concept to
 *   have multiple active viewports.
 *
 * - In the future we will extend this concept further to also represent
 *   Platform Monitor and support a "no main platform window" operation mode.
 *
 * return primary/default viewport. This can never be null.
 * @zh
 * 视口。
 *
 * - 目前表示由应用创建、承载 Dear ImGui 窗口的平台窗口。
 *
 * - 在启用多视口的 'docking' 分支中，此概念扩展为多个活动视口。
 *
 * - 未来将进一步扩展以表示平台显示器，并支持“无主平台窗口”操作模式。返回主/默认视口，绝不会为 null。
 * @ja
 * ビューポート。
 *
 * - 現在は、アプリケーションが作成し Dear ImGui のウィンドウを収容するプラットフォームウィンドウを表します。
 *
 * - マルチビューポートを有効にした 'docking' ブランチでは、複数のアクティブなビューポートに概念を拡張しています。
 *
 * -
 *   将来はプラットフォームのモニターも表し、「メインのプラットフォームウィンドウなし」の動作モードもサポートする予定です。プライマリ/既定のビューポートを
 *   返します。null になることはありません。
 * @ko
 * 뷰포트.
 *
 * - 현재는 응용 프로그램이 생성하여 Dear ImGui 창을 담는 플랫폼 창을 나타냅니다.
 *
 * - 다중 뷰포트가 활성화된 'docking' 브랜치에서는 여러 활성 뷰포트로 개념을 확장합니다.
 *
 * - 향후 플랫폼 모니터도 표현하고 "주 플랫폼 창 없음" 동작 모드를 지원하도록 더 확장할 예정입니다. 주/기본 뷰포트를 반환합니다.
 *   절대로 null이 아닙니다.
 *
 * @returns Borrowed handle to the main viewport, including display/work area
 * bounds.
 * @zh 主视口的借用句柄，包含显示及工作区边界。
 * @ja 表示領域・作業領域を含むメインビューポートの借用ハンドルです。
 * @ko 표시 및 작업 영역 경계를 포함한 주 뷰포트의 빌린 핸들입니다.
 */
export function GetMainViewport(): ImGuiViewport | null {
  return native.GetMainViewport();
}

/**
 * Get the center of the viewport.
 *
 * @zh 获取视口中心。
 * @ja ビューポートの中心を取得します。
 * @ko 뷰포트의 중심을 가져옵니다.
 *
 * @param self - ImGuiViewport handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiViewport 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiViewport ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiViewport 핸들입니다.
 *
 * @returns Viewport center, copied as {x,y} in absolute screen coordinates; not
 * a writable native view.
 * @zh 视口中心的绝对屏幕坐标副本 {x,y}，不是原生可写视图。
 * @ja ビューポートの中心を絶対スクリーン座標の {x,y} としてコピーします。書き込みビューではありません。
 * @ko 뷰포트 중심의 절대 화면 좌표 복사본 {x,y}입니다. 네이티브 쓰기 뷰가 아닙니다.
 */
export function Viewport_GetCenter(self: ImGuiViewport): ImVec2Value {
  return native.Viewport_GetCenter(self);
}

/**
 * Compute the center of the viewport work area, excluding reserved areas such
 * as menu bars.
 *
 * @zh 计算视口工作区的中心，排除菜单栏等预留区域。
 * @ja メニューバーなどの予約領域を除いた、ビューポートの作業領域の中心を計算します。
 * @ko 메뉴 막대 등의 예약 영역을 제외한 뷰포트 작업 영역의 중심을 계산합니다.
 *
 * @param self - ImGuiViewport handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiViewport 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiViewport ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiViewport 핸들입니다.
 *
 * @returns Center of the viewport work area excluding reserved space, copied as
 * {x,y} in absolute screen coordinates; not a writable native view.
 * @zh 排除预留空间后的视口工作区中心的绝对屏幕坐标副本 {x,y}，不是原生可写视图。
 * @ja 予約領域を除くビューポート作業領域の中心を絶対スクリーン座標の {x,y} としてコピーします。書き込みビューではありません。
 * @ko 예약된 공간을 제외한 뷰포트 작업 영역 중심의 절대 화면 좌표 복사본 {x,y}입니다. 네이티브 쓰기 뷰가 아닙니다.
 */
export function Viewport_GetWorkCenter(self: ImGuiViewport): ImVec2Value {
  return native.Viewport_GetWorkCenter(self);
}
