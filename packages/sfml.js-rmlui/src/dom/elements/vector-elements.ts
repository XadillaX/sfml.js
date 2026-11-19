import { Element } from './element';
import { native } from '../../internal/native';
import { elementConstructors } from '../../internal/element-factory';

/**
 * Native Rml::ElementSVG with inline XML or a file-backed src attribute.
 *
 * @zh 原生 Rml::ElementSVG，支持内联 XML 或 src 文件属性。
 * @ja インライン XML または src ファイル属性を持つ Rml::ElementSVG。
 * @ko 인라인 XML 또는 src 파일 속성을 사용하는 Rml::ElementSVG입니다.
 */
export class ElementSVG extends Element {
  /**
   * Invoke Rml::ElementSVG::EnsureSourceLoaded for a dirty source.
   *
   * @zh 调用 Rml::ElementSVG::EnsureSourceLoaded 加载已变化的源。
   * @ja 変更されたソースを Rml::ElementSVG::EnsureSourceLoaded で読み込みます。
   * @ko 변경된 소스를 Rml::ElementSVG::EnsureSourceLoaded로 불러옵니다.
   * @remarks Layout and rendering normally invoke this automatically.
   * @zh 布局和渲染通常会自动调用此操作。
   * @ja 通常はレイアウトと描画が自動的に呼び出します。
   * @ko 일반적으로 레이아웃과 렌더링이 자동 호출합니다.
   */
  ensureSourceLoaded(): void {
    native.svgEnsureSourceLoaded(this.handle);
  }
}

/**
 * Native Rml::ElementLottie; playback uses the native system clock.
 *
 * @zh 原生 Rml::ElementLottie，播放使用原生系统时钟。
 * @ja ネイティブシステム時計で再生する Rml::ElementLottie。
 * @ko 네이티브 시스템 시계로 재생하는 Rml::ElementLottie입니다.
 */
export class ElementLottie extends Element {
  /**
   * Invoke Rml::ElementLottie::EnsureSourceLoaded for a changed src attribute.
   *
   * @zh 调用 Rml::ElementLottie::EnsureSourceLoaded 加载变化后的 src。
   * @ja 変更した src を Rml::ElementLottie::EnsureSourceLoaded で読み込みます。
   * @ko 변경된 src를 Rml::ElementLottie::EnsureSourceLoaded로 불러옵니다.
   * @remarks Native updates load the source and advance looping playback.
   * @zh 原生更新负责加载源并推进循环播放。
   * @ja ネイティブ更新がソースを読み込み、ループ再生を進めます。
   * @ko 네이티브 업데이트가 소스를 불러오고 반복 재생을 진행합니다.
   */
  ensureSourceLoaded(): void {
    native.lottieEnsureSourceLoaded(this.handle);
  }
}

elementConstructors.set('ElementSVG', ElementSVG);
elementConstructors.set('ElementLottie', ElementLottie);
