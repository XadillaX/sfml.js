import { native } from '../internal/native';

/** 查询 SFML 后端是否支持 Vulkan；false 可仅检查计算能力。 */
export function isAvailable(requireGraphics = true): boolean {
  return native.isVulkanAvailable(requireGraphics);
}

/**
 * 查询 Vulkan 函数地址，找不到时返回 undefined。
 * 地址以 bigint 保留精度；调用它需要匹配函数签名的原生绑定。
 */
export function getFunction(name: string): bigint | undefined {
  return native.getVulkanFunction(name);
}

/** 返回创建图形实例所需的扩展名称副本；内容取决于 SFML 平台后端。 */
export function getGraphicsRequiredInstanceExtensions(): string[] {
  return native.getVulkanGraphicsRequiredInstanceExtensions();
}
