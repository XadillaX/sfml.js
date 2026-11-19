# RmlUi 字符串与资源 URL

`StringView` 保活不可变的原生 UTF-8 字节，所有位置都以字节偏移表示。
`StringIteratorU8` 读取原生码点，与 JavaScript UTF-16 索引不同。
这些资源和 `URL` 无需初始化运行时，关闭运行时后仍可使用。

```js
const { StringView, StringIteratorU8, StringUtilities, URL, formatString } =
  require('sfml.js-rmlui');

const text = new StringView('Aé中😀Z');
const slice = text.subview(1, 9);

console.log(slice.begin(), slice.end(), slice.toString()); // 0 9 é中😀

const input = new Int32Array([ 0, 1, 2, 3, 4, 5 ]);
const output = new Int32Array(input.length);

StringUtilities.convertCharacterOffsetsToByteOffsets(text, input, output);
console.log(Array.from(output)); // [0, 1, 3, 6, 10, 11]

const iterator = new StringIteratorU8(slice);

while (iterator.valid()) {
  console.log(iterator.offset(), iterator.value());
  iterator.increment();
}

const url = new URL('assets/panel.rml');

url.setParameter('name', 'é中😀');
console.log(url.getQueryString()); // name=%C3%A9%E4%B8%AD%F0%9F%98%80
console.log(formatString('%s:%d', 'é', 7)); // { value: 'é:7', length: 4 }
```

## 字节、迭代与批处理

`new StringView(value = '', offset = 0, count?)` 将字符串复制到原生存储，
或保活现有视图的所有者。偏移须位于源内，允许指向末尾。数量默认为全部剩余
字节，在源末尾截断。允许切出部分 UTF-8。`toBytes()` 返回可独立写入的快照，
写入不会修改源或索引。`equals()` 比较全部字节，包括 NUL 后的字节。

`new StringIteratorU8(value, offset = 0, count?)` 保活输入，偏移须匹配缓存
边界。数量将末尾限制为 `offset + count`，在源末尾截断。每个视图只取得一次
原生索引快照，后续移动与读取不进入原生。末尾为视图字节长度，头前为 `-1`。
读取哨兵、从末尾前进、从头前后退均抛出异常。别名视图按原生所有者与绝对
字节位置判断迭代器相等。

批量转换复用 `StringView` 和等长、固定、非共享的输入及输出 `Int32Array`。
一批仅进入原生一次。省略输出时创建独立原生快照。重叠视图保留原始输入值。
负偏移限制为 0，超大偏移限制为末尾，字符内部字节向后续码点边界取整。
已分离、共享及可调整大小的数组均拒绝。

## 原生字符串规则

大小写转换只处理 ASCII。空白字符为回车、换行、空格和制表符。RML 实体仅
解码一次，空搜索字符串替换不修改输入。
`expandString(value, delimiter = ',', quoteOrIgnore = false, unquote?,
ignoreRepeatedDelimiters = false)` 移除默认引号，保留自定义引号。
`joinString(values, delimiter = ',', initial = '')` 追加到初始文本，
NUL 不插入分隔符。

`toUTF8` 接受一个无符号 32 位码点或固定、非共享的 `Uint32Array`。
`lengthUTF8` 统计非续接字节，即使不完整切片也遵循原生规则。
`trimTrailingDotZeros` 要求含小数点的十进制文本，无效输入抛出异常。

## 资源 URL 与格式化

`new URL(value = '')` 持有实际的原生 RmlUi 资源 URL 解析器。组件设置返回
原生布尔值。`setURL` 清除旧组件与参数；无效输入返回 false，可能保留部分
解析状态。`setPort` 接受有符号 32 位整数。参数快照为独立对象，保留
`__proto__` 等自身属性。参数顺序遵循原生无序映射。`clearParameters` 同时
使查询缓存失效。

`urlEncode` 编码全部 UTF-8 字节，包括 NUL。当前原生解码器将 `+` 转为空格、
`%GG` 转为 `GG`、`%A` 转为字节 `0A`。JavaScript 字符串将无效 UTF-8
替换为替换字符。

`createString` 返回格式化文本，`formatString` 返回文本与原生 UTF-8 字节
长度。有类型 printf 支持 `diuoxXfFeEgGaAcs`、`%%`、标志、宽度、精度与
动态 `*`。整数须符合对应的有符号或无符号 32 位范围，`%c` 为 0 至 255，
浮点数须有限。指针、位置参数和长度修饰格式抛出异常，格式中的 NUL 被拒绝。
宽度、精度及全部输出各限制为一百万字节。少于 256 字节的输出文本在 NUL
处截断，保留原始报告长度；更长输出保留 NUL。
