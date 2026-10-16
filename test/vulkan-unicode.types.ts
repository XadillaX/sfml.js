import { Vulkan, Unicode } from '..';

const available: boolean = Vulkan.isAvailable(false);
const address: bigint | undefined = Vulkan.getFunction('vkCreateInstance');
const extensions: string[] = Vulkan.getGraphicsRequiredInstanceExtensions();
const grapheme: boolean = Unicode.isGraphemeBoundary('😀a', 2);
const word: boolean = Unicode.isWordBoundary('hello world', 6);
const sentence: boolean = Unicode.isSentenceBoundary('Hi. There.', 4);

// @ts-expect-error Vulkan 能力标志必须为 boolean。
Vulkan.isAvailable(1);
// @ts-expect-error 函数名必须为字符串。
Vulkan.getFunction(1);
// @ts-expect-error UTF-16 索引必须为 number。
Unicode.isGraphemeBoundary('a', 0n);

export { available, address, extensions, grapheme, word, sentence };
