import { native } from '../internal/native';

/**
 * Query whether the SFML backend supports Vulkan; false checks only
 * compute capabilities.
 * @zh 查询 SFML 后端是否支持 Vulkan；false 可仅检查计算能力。
 * @ja SFML バックエンドの Vulkan 対応を確認する。false なら計算機能のみ確認する。
 * @ko SFML 백엔드가 Vulkan을 지원하는지 조회한다. false이면 연산 기능만 확인한다.
 */
export function isAvailable(requireGraphics = true): boolean {
  return native.isVulkanAvailable(requireGraphics);
}

/**
 * Query a Vulkan function address, returning undefined if not found.
 * The address uses bigint to preserve precision; calling it requires a
 * native binding with the matching function signature.
 * @zh 查询 Vulkan 函数地址，找不到时返回 undefined。
 * 地址以 bigint 保留精度；调用它需要匹配函数签名的原生绑定。
 * @ja Vulkan 関数のアドレスを取得し、見つからなければ undefined を返す。
 * アドレスは bigint で精度を保つ。呼び出しには関数シグネチャが一致する
 * ネイティブバインディングが必要。
 * @ko Vulkan 함수 주소를 조회하고 찾지 못하면 undefined를 반환한다.
 * 주소는 bigint로 정밀도를 유지한다. 호출하려면 함수 시그니처와 일치하는
 * 네이티브 바인딩이 필요하다.
 */
export function getFunction(name: string): bigint | undefined {
  return native.getVulkanFunction(name);
}

/**
 * Return a copy of the extension names required to create a graphics instance;
 * the contents depend on SFML's platform backend.
 * @zh 返回创建图形实例所需的扩展名称副本；内容取决于 SFML 平台后端。
 * @ja グラフィックスインスタンス作成に必要な拡張名のコピーを返す。
 * 内容は SFML のプラットフォームバックエンドに依存する。
 * @ko 그래픽 인스턴스 생성에 필요한 확장 이름의 복사본을 반환한다.
 * 내용은 SFML 플랫폼 백엔드에 따라 달라진다.
 */
export function getGraphicsRequiredInstanceExtensions(): string[] {
  return native.getVulkanGraphicsRequiredInstanceExtensions();
}
