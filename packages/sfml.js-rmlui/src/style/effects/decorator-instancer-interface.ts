import { native } from '../../internal/native';
import {
  renderManagerFromNative, renderManagerHandle, type RenderManager,
} from '../../rendering/render-manager';
import { styleSheetHandle, type StyleSheet } from '../properties/style-sheet';
import type { PropertySource } from '../properties/property';
import { spriteFromNative, type Sprite } from '../../rendering/spritesheet';
import { textureFromNative, type Texture } from '../../rendering/texture';

const interfaces = new WeakMap<DecoratorInstancerInterface, object>();

/**
 * Rml::DecoratorInstancerInterface for a stylesheet and render manager.
 *
 * @zh 样式表与渲染管理器对应的 Rml::DecoratorInstancerInterface。
 * @ja スタイルシートと描画管理器に対応する Rml::DecoratorInstancerInterface。
 * @ko 스타일시트와 렌더 관리자의 Rml::DecoratorInstancerInterface입니다.
 * @remarks
 * Factory-provided interfaces expire when the callback exits. Constructed
 * interfaces retain native owners and expire with their stylesheet or manager.
 * Sprite metadata is copied. Textures and managers retain their owners.
 * @zh 工厂提供的接口在回调退出时失效；显式构造的接口保留原生所有者，并随
 * 样式表或管理器失效。精灵元数据为副本；返回的纹理和管理器保留其所有者。
 * @ja 工場が渡すインターフェースはコールバック終了で失効します。構築したものは
 * 所有者を保持し、シートや管理器と共に失効します。スプライト情報はコピーです。
 * 返すテクスチャと管理器も所有者を保持します。
 * @ko 팩터리가 전달한 인터페이스는 콜백 종료 시 무효화됩니다. 생성한 인터페이스는
 * 소유자를 유지하며 시트나 관리자와 함께 무효화됩니다. 스프라이트 정보는 사본이며
 * 반환하는 텍스처와 관리자도 소유자를 유지합니다.
 */
export class DecoratorInstancerInterface {
  /**
   * Construct Rml::DecoratorInstancerInterface with retained native owners.
   *
   * @zh 保活原生所有者并构造 Rml::DecoratorInstancerInterface。
   * @ja 所有者を保持して Rml::DecoratorInstancerInterface を構築します。
   * @ko 소유자를 유지하며
   * Rml::DecoratorInstancerInterface를 생성합니다.
   * @param manager - Manager for loading textures and creating decorators.
   * @zh manager - 用于加载纹理与创建装饰器的渲染管理器。
   * @ja manager - テクスチャ読込と装飾器作成に使う描画管理器。
   * @ko manager - 텍스처 로드와 장식기 생성에 사용하는 렌더 관리자입니다.
   * @param sheet - Owned stylesheet or currently valid compiled view.
   * @zh sheet - 自有样式表或当前有效的编译视图。
   * @ja sheet - 所有スタイルシートまたは現在有効なコンパイルビュー。
   * @ko sheet - 소유 스타일시트 또는 현재 유효한 컴파일 뷰입니다.
   * @param source - Copied property source; null disables filename textures.
   * @zh source - 复制的属性来源；null 禁用文件名纹理。
   * @ja source - コピーするプロパティの出典。null ならファイル読込不可。
   * @ko source - 복사할 속성 출처이며 null이면 파일 텍스처를 비활성화합니다.
   */
  constructor(
    manager: RenderManager, sheet: StyleSheet,
    source: PropertySource | null = null,
  ) {
    interfaces.set(this, native.createDecoratorInterface(
      renderManagerHandle(manager), styleSheetHandle(sheet), source));
  }

  /**
   * Copy Rml::DecoratorInstancerInterface::GetSprite metadata.
   *
   * @zh 复制 Rml::DecoratorInstancerInterface::GetSprite 返回的元数据。
   * @ja Rml::DecoratorInstancerInterface::GetSprite の情報をコピーします。
   * @ko Rml::DecoratorInstancerInterface::GetSprite의 정보를 복사합니다.
   * @param name - Sprite name in the active stylesheet.
   * @zh name - 活动样式表中的精灵名称。
   * @ja name - 現在のスタイルシート内のスプライト名。
   * @ko name - 활성 스타일시트의 스프라이트 이름입니다.
   * @returns Independent snapshot, or null if absent.
   * @zh 独立快照；不存在时返回 null。
   * @ja 独立したコピー。存在しない場合は null。
   * @ko 독립 사본이며 없으면 null입니다.
   */
  getSprite(name: string): Sprite | null {
    return spriteFromNative(native.decoratorInterfaceGetSprite(
      decoratorInterfaceHandle(this), name));
  }

  /**
   * Invoke Rml::DecoratorInstancerInterface::GetTexture.
   *
   * @zh 调用 Rml::DecoratorInstancerInterface::GetTexture。
   * @ja Rml::DecoratorInstancerInterface::GetTexture を呼びます。
   * @ko Rml::DecoratorInstancerInterface::GetTexture를 호출합니다.
   * @param filename - Texture path relative to the declaration's source.
   * @zh filename - 相对于声明来源的纹理路径。
   * @ja filename - 宣言元を基準とするテクスチャパス。
   * @ko filename - 선언 출처를 기준으로 한 텍스처 경로입니다.
   * @returns Texture view; missing property source produces an empty texture.
   * @zh 纹理视图；缺少属性来源时返回空纹理。
   * @ja テクスチャビュー。プロパティの出典がなければ空のテクスチャです。
   * @ko 텍스처 뷰이며 속성 출처가 없으면 빈 텍스처입니다.
   */
  getTexture(filename: string): Texture {
    return textureFromNative(native.decoratorInterfaceGetTexture(
      decoratorInterfaceHandle(this), filename));
  }

  /**
   * Invoke Rml::DecoratorInstancerInterface::GetRenderManager.
   *
   * @zh 调用 Rml::DecoratorInstancerInterface::GetRenderManager。
   * @ja Rml::DecoratorInstancerInterface::GetRenderManager を呼びます。
   * @ko Rml::DecoratorInstancerInterface::GetRenderManager를 호출합니다.
   * @returns Checked manager for this instancing operation.
   * @zh 此次实例化使用的受检查管理器。
   * @ja 今回の生成で使う検証付き描画管理器。
   * @ko 이번 생성 작업의 검증된 렌더 관리자입니다.
   */
  getRenderManager(): RenderManager {
    return renderManagerFromNative(native.decoratorInterfaceGetRenderManager(
      decoratorInterfaceHandle(this)));
  }
}

/**
 * Resolve the scoped native interface.
 *
 * @internal
 * @param value - Public interface.
 * @returns Native scope token.
 */
export function decoratorInterfaceHandle(
  value: DecoratorInstancerInterface,
): object {
  const handle = interfaces.get(value);
  if (!handle) {
    throw new TypeError('Expected a scoped decorator instancer interface');
  }
  return handle;
}

/**
 * Wrap a native callback scope.
 *
 * @internal
 * @param handle - Native scope token.
 * @returns Public interface.
 */
export function decoratorInterfaceFromNative(
  handle: object,
): DecoratorInstancerInterface {
  const result = Object.create(DecoratorInstancerInterface.prototype) as
    DecoratorInstancerInterface;
  interfaces.set(result, handle);
  return result;
}
