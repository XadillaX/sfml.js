declare const fontFace: unique symbol;

/**
 * Opaque Rml::FontFaceHandle from the active native font engine.
 *
 * @zh 当前原生字体引擎提供的不透明 Rml::FontFaceHandle。
 * @ja 現在のネイティブフォントエンジンの不透明な Rml::FontFaceHandle。
 * @ko 현재 네이티브 글꼴 엔진의 불투명 Rml::FontFaceHandle입니다.
 * @remarks Invalid after shutdown, releaseFontResources or
 * releaseRenderManagers. Obtain a new token from a live element.
 * @zh shutdown、releaseFontResources 或 releaseRenderManagers 后失效，
 * 需从存活元素重新获取。
 * @ja shutdown、releaseFontResources、releaseRenderManagers 後は無効です。
 * 有効な要素から再取得してください。
 * @ko shutdown, releaseFontResources, releaseRenderManagers 후 무효입니다.
 * 유효한 요소에서 다시 가져오세요.
 */
export interface FontFaceHandle {
  /** @internal */
  readonly [fontFace]: true;
}

/** @internal */
export const computedValues = new WeakMap<object, object>();

/**
 * Resolve the checked native owner.
 *
 * @internal
 * @param value - Public computed value or element view.
 * @returns Native owner handle.
 */
export function computedHandle(value: object): object {
  const handle = computedValues.get(value);
  if (!handle) {
    throw new TypeError('Expected ComputedValues');
  }
  return handle;
}
