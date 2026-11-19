import { native } from '../internal/native';
import type { Context } from './context';

/**
 * Native RmlUi Debugger tools hosted in one context and inspecting another.
 *
 * @zh 原生 RmlUi Debugger 工具，支持分别指定宿主与被调试上下文。
 * @ja ホストと検査対象を別々に指定できるネイティブ RmlUi Debugger。
 * @ko 호스트와 검사 대상을 별도로 지정하는 네이티브 RmlUi Debugger입니다.
 * @remarks
 * Requires an initialized runtime. Host removal or unloading all its documents
 * shuts down the debugger. Target removal detaches inspection. All operations
 * run natively; the debugger reads models through native reflection.
 * Visibility uses upstream computed style; update the host after changing it.
 * @zh 需要已初始化的运行时。删除宿主或卸载其全部文档会关闭调试器；
 * 删除被调试上下文会解除检查。操作与数据模型反射均在原生端执行。
 * 可见性读取上游计算样式；修改后应更新宿主上下文。
 * @ja 初期化済みランタイムが必要です。ホスト削除または全文書の解除で
 * 終了し、検査対象の削除で検査を解除します。操作とモデル反射はネイティブです。
 * 表示状態は計算済みスタイルを参照するため、変更後にホストを更新します。
 * @ko 초기화된 런타임이 필요합니다. 호스트 삭제나 모든 문서 해제 시 종료하며
 * 검사 대상 삭제 시 검사를 해제합니다. 작업과 모델 반영은 네이티브에서 실행합니다.
 * 표시 상태는 계산된 스타일을 사용하므로 변경 후 호스트를 업데이트합니다.
 */
export class Debugger {
  /**
   * Static debugging operations are not instantiated.
   *
   * @zh 原生静态调试操作不需要实例化。
   * @ja 静的なデバッグ操作はインスタンス化しません。
   * @ko 정적 디버깅 작업은 인스턴스화하지 않습니다.
   */
  private constructor() {}

  /**
   * Load the native debugger into a host, initially hidden.
   *
   * @zh 将原生调试器加载到宿主，初始隐藏。
   * @ja ホストへネイティブデバッガーを読み込みます。初期状態は非表示です。
   * @ko 호스트에 네이티브 디버거를 로드하며 처음에는 숨깁니다.
   * @param host - Live host context; initially also the inspection target.
   * @zh host - 有效宿主上下文；初始也作为检查目标。
   * @ja host - 有効なホスト。初期の検査対象にもなります。
   * @ko host - 유효한 호스트이며 초기 검사 대상이기도 합니다.
   * @returns Native success; false if already initialized or loading fails.
   * @zh returns - 原生结果；已初始化或加载失败时为 false。
   * @ja returns - ネイティブの結果。初期化済みや読み込み失敗なら false。
   * @ko returns - 네이티브 결과이며 이미 초기화되었거나 로드 실패 시 false입니다.
   */
  static initialise(host: Context): boolean {
    return native.debuggerInitialise(host?.handle);
  }

  /**
   * Release native debugger documents and listeners; repeated calls are safe.
   *
   * @zh 释放原生调试器文档与监听器；可重复调用。
   * @ja ネイティブ文書とリスナーを解放します。繰り返し呼び出せます。
   * @ko 네이티브 문서와 리스너를 해제하며 반복 호출할 수 있습니다.
   */
  static shutdown(): void {
    native.debuggerShutdown();
  }

  /**
   * Select the context to inspect, or detach inspection with null.
   *
   * @zh 选择检查上下文，或用 null 解除检查。
   * @ja 検査対象を選択します。null で検査を解除します。
   * @ko 검사 대상을 선택하며 null로 검사를 해제합니다.
   * @param target - Live target context, or null to remove the native hook.
   * @zh target - 有效目标上下文；null 会移除原生检查挂钩。
   * @ja target - 有効な対象。null でネイティブフックを解除します。
   * @ko target - 유효한 대상이며 null이면 네이티브 훅을 제거합니다.
   * @returns Upstream result; false when the debugger is not initialized.
   * @zh returns - 上游结果；调试器未初始化时为 false。
   * @ja returns - 上流の結果。未初期化なら false です。
   * @ko returns - 상위 라이브러리 결과이며 초기화되지 않았으면 false입니다.
   */
  static setContext(target: Context | null): boolean {
    return native.debuggerSetContext(
      target === null ? null : target?.handle);
  }

  /**
   * Change native menu visibility; does nothing before debugger initialization.
   *
   * @zh 设置原生菜单可见性；调试器未初始化时不执行操作。
   * @ja メニューの表示を変更します。デバッガー未初期化なら何もしません。
   * @ko 메뉴 표시를 변경하며 디버거 초기화 전에는 아무 작업도 하지 않습니다.
   * @param visible - Strict boolean menu visibility.
   * @zh visible - 严格布尔型的菜单可见性。
   * @ja visible - 真偽値のメニュー表示状態。
   * @ko visible - 메뉴 표시 여부를 나타내는 불리언입니다.
   */
  static setVisible(visible: boolean): void {
    native.debuggerSetVisible(visible);
  }

  /**
   * Read native menu visibility, false when the debugger is not initialized.
   *
   * @zh 读取原生菜单可见性；调试器未初始化时为 false。
   * @ja 表示状態を読みます。デバッガー未初期化なら false です。
   * @ko 표시 상태를 읽으며 디버거 초기화 전에는 false입니다.
   * @returns Native menu visibility.
   * @zh returns - 原生菜单可见性。
   * @ja returns - ネイティブメニューの表示状態。
   * @ko returns - 네이티브 메뉴 표시 상태입니다.
   */
  static isVisible(): boolean {
    return native.debuggerIsVisible();
  }
}
