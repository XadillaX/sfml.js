# 类型化属性与定义

## 属性 ID 所属规范

`PropertyId` 和 `ShorthandId` 属于主样式表规范。`MediaQueryId` 标识 14 个
媒体查询条件，`FontFaceId` 标识 `@font-face` 字段。四个枚举都从
RmlUi 6.3 的 `Core/ID.h` 生成。各枚举的数值属于不同规范，不能将媒体查询或
字体声明 ID 当成 `PropertyId` 传给 Element 属性方法。

媒体查询由 Native 解析，在上下文尺寸、像素密度或主题变化时重新计算。
分辨率使用 RmlUi 的 `x` 单位，例如 `@media (resolution: 2x)`。
字体来源按声明顺序加载；省略字形、字重、回退和字体索引时，
默认值依次为 Normal、Auto、false 和 0。

```js
const { MediaQueryId, FontFaceId } = require('sfml.js-rmlui');
const feature = MediaQueryId.AspectRatio;
const fontField = FontFaceId.FaceIndex;
```

## 自有 Variant 与转换目标

`new Variant(value)` 由 Native 持有 `Rml::Variant`。省略参数得到 `NONE`，
传入另一个 Variant 会复制精确存储类型。`getType()` 从共享元数据读取，
`clone()`、`assign(value)`、`move()`、`moveAssign(source)` 和 `clear()`
调用原生复制、赋值、移动和清空操作。原生移动保留源对象的类型；
字符串及容器的源值处于移动后状态，数值仍保留原值。
关闭运行时后类型为 `NONE`，其他原生操作失效。

`get(defaultValue)` 使用 `Rml::Variant::Get<T>` 的默认值语义，
`getInto(defaultValue)` 返回 `{ success, value }`，保留原生成功标志。
`getReference(VariantType.X)` 检查精确存储类型后读取原生引用，聚合结果是独立快照。
Element 指针的副本共享生命周期槽；`getElementValue()` 返回唯一元素对象，
目标销毁后为 `null`。`Property`、属性字典和事件参数也可以接收自有 Variant 的原生副本。

```js
const { Variant, VariantType } = require('sfml.js-rmlui');
const value = new Variant('17, bad, 3');
const result = value.getInto({ type: 'vector3i', x: 91, y: 92, z: 93 });

// { success: false, value: { x: 17, y: 92, z: 93 } }
value.assign({ type: 'character', value: 0x1f600 });
value.getType() === VariantType.INT64;
value.get({ type: 'character', value: 0 }); // 128512
```

`vector2i`、`vector3i`、`vector4i` 选择整数向量转换目标，要求 int32 分量。
RmlUi 没有这些向量的 Variant 存储类型，不能将这些选择器作为存储值。
字符串转换使用原生逗号分隔规则；分量数不足时保留全部默认值，
中途失败则保留已经转换的前缀。只有原生转换会读取到的分量才做溢出检查。
`character` 选择 `Rml::Character` 枚举；存储为 `INT64`，读取时经原生 int64
转换后得到 uint32，范围不额外缩小为 Unicode 标量。
Property 的 `get` 和元素样式查询使用类型的零值，
Element 属性、事件参数和 Variant 的 `get` 使用调用方的默认值。
未经类型化适配的原生指针仍不能作为存储输入。

字符串转换目标、`Property.toString()`、`PropertyDefinition.getValue()` 和
`PropertySpecification.propertiesToString()` 在输出需要序列化指针时抛出
`TypeError`，包括嵌套装饰器、滤镜属性中的指针。效果已有缓存文本时直接返回文本，
不读取隐藏属性。普通标量转换不扫描原生所有者。

字符串转布尔值接受 `1`、`true`、`0`、`false`，忽略大小写，不去除首尾空白。
字符串转 float、double 使用原生 `atof`；非数值文本和空字符串也会成功转换为零。
字节颜色转换遇到空字符串时返回失败并保留初始颜色；非空无效文本会先将颜色重置为
不透明黑色，再返回失败。浮点颜色各分量使用相同的浮点解析器，非数值分量得到零。

字符串转换目标同时是原生输出的初始值。过渡、动画列表会追加到它后面；
非空效果列表有缓存文本时也会追加。变换、颜色停靠点、阴影列表会替换目标文本，
空效果列表或空指针得到 `none`。浮点文本保留三位小数，再去除末尾零。
原生 `ToString`、`FromString` 和直接转换器特化为这些入口提供 C++ 支持；
JS 通过值与类型化默认值选择转换。

## 全局 RCSS 注册表与自定义解析器

`StyleSheetSpecification` 暴露全局属性及解析器注册表，生命周期自动跟随
`initialise` / `shutdown`。自定义属性应在加载文档前注册。
`registerProperty(name, defaultValue, inherited, forcesLayout = false)`
返回可修改的定义。内置名称保留；重复自定义名称保留原定义；容量溢出在修改原生映射前抛错。
`registerShorthand(name, properties, type)` 使用局部规格相同的校验和六种解析策略。

`getProperty(nameOrId)`、`getShorthand(nameOrId)` 和三个 `getRegistered…` 方法
提供全局查询及编号集合副本。`getPropertyId`、`getPropertyName`、
`getShorthandId`、`getShorthandName` 转换名称与编号。
`getShorthandUnderlyingProperties(id)` 递归收集不重复的属性编号。
`parsePropertyDeclaration(dictionary, name, value)` 写入原生声明。
`getPropertySpecification()` 返回借用的只读规格；关闭后规格、解析器和定义句柄均失效。

```js
const { StyleSheetSpecification: styles, PropertyParser, Unit } =
  require('sfml.js-rmlui');
const parser = new PropertyParser((property, value, parameters) => {
  if (!/^count:\d+$/.test(value)) {
    return false;
  }

  property.value = Number(value.slice(6)) * parameters.factor;
  property.unit = Unit.NUMBER;

  return true;
});

styles.registerParser('count-parser', parser);
styles.registerProperty('item-count', 'count:2', true)
  .addParser('count-parser', 'factor=3');
```

RCSS 中的 `item-count: count:4` 得到可继承数值 12。
`getParser(name)` 返回受检查的内置或自定义解析器，不存在时为 `null`。
`parser.parseValue(property, text, parameters = {})` 可直接解析，参数值必须为 int32。
参数映射和输出属性均为副本；保留回调属性并在返回后修改，不会影响已解析样式。
返回 false 保留正常的原生部分写入行为；抛出异常或输出存储类型不符时不接纳回调输出，
异常在原生调用退出后传播。回调必须同步返回布尔值，可读写 Property；
嵌套解析、注册表变更及 DOM／运行时操作会在回调中抛错。
注册的解析器保留闭包到关闭；未注册解析器的引用环可回收。
解析器产生的动画回调在原生默认值或样式持有期间保活；
复制到独立 Property 或字典后，使用可回收的 JS 引用关系保活。

## 属性规格

`new PropertySpecification(reserveProperties, reserveShorthands)` 持有局部原生规格。
预留容量分别为 0–127 个属性、0–254 个简写，不分配编号。
`registerProperty(name, defaultValue, inherited, forcesLayout,
id = PropertyId.Invalid)` 返回可修改的定义，可接着调用 `addParser`。
自动编号从 1 开始，后续沿最大已分配编号递增，支持显式稀疏编号。
同名注册保留现有定义；编号冲突或容量耗尽在注册前抛出。空名称和 `invalid` 为保留值。

`getProperty(nameOrId)` 返回受检查的定义或 `null`。
`getRegisteredProperties()`、`getRegisteredInheritedProperties()` 和
`getRegisteredPropertiesForcingLayout()` 返回独立的升序编号数组。
注册定义保留原生存储至关闭，即使规格包装器已回收；关闭后所有这些引用失效。

```js
const {
  PropertySpecification, PropertyDictionary, ShorthandType,
} = require('sfml.js-rmlui');
const specification = new PropertySpecification(2, 1);

specification.registerProperty('x', '0px', false, false).addParser('length');
specification.registerProperty('y', '0px', false, false).addParser('length');
const pair = specification.registerShorthand('pair', 'x,y',
  ShorthandType.Replicate);
const values = new PropertyDictionary();

specification.parseShorthandDeclaration(values, pair, '4px');
console.log(specification.propertiesToString(values, true, ';'));
```

`registerShorthand(name, properties, type, id = ShorthandId.Invalid)` 支持六种
`ShorthandType` 策略。组成项为逗号分隔名称，支持原生 `?`、`#` 后缀。
组成项缺失或重复注册返回 `Invalid`；无效声明不占用名称或编号。
Box 必须包含四个属性，Flex 必须包含三个，项数错误时抛出。
`getShorthand(nameOrId)` 返回结构快照，组成项区分属性和嵌套简写，定义引用仍受运行代检查。

`parsePropertyDeclaration(dictionary, nameOrId, value)` 支持属性编号，或属性、
简写、自定义变量名称。`parseShorthandDeclaration` 使用简写编号。
两者返回原生成功结果，失败时保留原生部分写入。
`setPropertyDefaults(dictionary)` 只填充缺失属性。
`propertiesToString(dictionary, includeName, delimiter)` 按编号升序序列化普通属性，
不附加末尾分隔符；分隔符必须占一个 UTF-8 字节，与原生 `char` 一致。

## 属性字典

`PropertyDictionary` 在当前运行时持有原生字典。三个映射互相独立：
普通属性使用 `PropertyId`，自定义属性使用字符串，变量简写使用 `ShorthandId`。
主样式表编号不能套用于装饰器或字体效果的局部规范。

`setProperty(id, property)`、`setCustomProperty(name, property)` 和
`setVarShorthand(id, property)` 复制输入。变量简写要求字符串 Property，单位为
`Unit.VAR_EXPRESSION`。编号必须非零且小于对应的 `MaxNumIds`。
`getProperty`、`getCustomProperty`、`getVarShorthand` 返回独立副本或 `null`。
`getProperties()`、`getCustomProperties()`、`getVarShorthands()` 返回包含副本的新 Map。

`removeProperty(id)` 无返回值；`removeCustomProperty(name)` 和
`removeVarShorthand(id)` 返回条目是否曾存在。`getNumProperties()` 只统计普通属性，
`empty()` 检查全部三个映射，`clear()` 清空三个映射。

`import(source, specificity = -1)` 在传入优先级大于或等于现有优先级时覆盖。
RmlUi 6.3 仅在 specificity 为正数时强制指定优先级；零和负数保留输入优先级。
`merge(source, specificityOffset = 0)` 先加偏移再比较；int32 溢出在修改任何条目前抛出。
自导入和自合并读取快照。`setSourceOfAllProperties(sourceOrNull)` 复制一次来源记录，
供三个映射中的全部条目使用。

存储的回调由原生副本及 JS 可见引用保活。清空或回收字典会释放引用，
回调捕获字典形成的循环也可回收。关闭运行时先释放存储资源，再使旧字典句柄失效。

## 元素属性

`Element.getProperty(nameOrId)` 会立即复制原生属性，包含继承、默认值、定义与来源。
层叠变量应在 `context.update()` 后读取。不存在的属性返回 `null`。
`getLocalProperty(nameOrId)` 读取内联覆盖及匹配的 RCSS 规则，不含继承值与默认值，
也不解析变量。
`getLocalStyleProperties()` 返回 `Map<PropertyId, Property>` 快照，
不含类规则及自定义变量。

```js
const { Property, PropertyId, Unit } = require('sfml.js-rmlui');
const width = element.getProperty('width');

element.setProperty(PropertyId.Width, new Property(120, Unit.PX));
element.setProperty('height', '30px');
console.log(width.toString()); // 仍为读取时的旧值。
element.removeProperty(PropertyId.Width);
```

`new Property()` 使用原生默认值：值为 null/NONE、单位为 UNKNOWN、优先级与解析器
索引为 -1、定义与来源为 null。单个整数参数选择枚举构造，单位为 KEYWORD；
传入单位则选择值与单位构造。后一种形式的 JavaScript 数值使用原生 DOUBLE，
枚举形式使用 INT。

`{ type, value }` 显式选择数值存储或转换模板。`byte`、`char`、`float`、
`double`、`int`、`uint` 接受有限的 JavaScript 数值；整数类型要求原生范围内的整数。
`byte` 范围为 0–255，`int` 为有符号 32 位，`uint` 为无符号 32 位；
`char` 使用当前平台的原生 char 范围，`float` 按原生单精度舍入。
`int64` 和 `uint64` 要求对应有符号或无符号 64 位范围内的精确 BigInt，
可明确选择小正数的无符号存储。原始值读取返回 number 或 BigInt。

```js
const count = new Property({ type: 'uint', value: 12 }, Unit.NUMBER);
const narrow = count.get({ type: 'int', value: 0 });

element.setAttribute('total', { type: 'uint64', value: 12n });
const total = element.getAttribute('total', { type: 'uint64', value: 0n });
```

这些类型样本可用于 Property、属性及事件的模板读取，原生 Variant 相等比较区分存储类型。
RmlUi 6.3 没有 byte 到 byte、double 到 byte、string 到 char 的转换器：
原始读取保留 byte 值，但上述模板转换保留属性或事件的回退值，Property 返回 `T{}`。
不安全的浮点及字符串整数转换会在原生强转或扫描前抛错；
合法十进制前缀仍被接受，包括无符号字符串转换中的符号前缀。
输入访问器先执行，再检查接收对象是否仍有效。

`value` 支持标量、向量、颜色、颜色停靠点、阴影、变换及
[过渡／动画列表](animation.zh-CN.md#css-动画值) Variant 的复制，
属性和元素属性支持持久保存 Element 引用；复制后仍返回同一个元素包装器。
`property.getElementValue()` 和
`element.getElementAttribute(name, fallback = null)` 选择原生
`ScriptInterface*` 转换。键缺失或转换失败返回回退值；
已销毁的保存目标成功转换为 null。可达拥有者保活独立元素；
移除或替换值会释放引用，自引用与跨元素循环可回收。
显式释放和 DOM 销毁使所有原生副本的引用变为空；关闭使该运行代的拥有者失效。

Element、Context 和 RmlEvent 输入使用受保护的原生 ScriptInterface 存储。
`get({ type: 'scriptinterface', value: null })` 选择原生基类指针模板；
属性与事件参数读取保留调用方的回退值，Property 使用空指针作为初始目标。
Context 移除、事件释放和每个回调结束都会使全部存储副本变为 null。
原始读取返回原 Context 或事件包装器。可达副本通过可回收的 JS 引用边保活目标；
无变化的帧不会扫描拥有者。

指针模板读取使用元素接口或 scriptinterface 样本。`getAttribute(name)`、字符串默认值读取、
`Property.toString()` 和 `PropertyDefinition.getValue(property)` 拒绝指针值。
RML 序列化不会输出指针地址。原始 `value`、`getAttributeValue()` 和
`getAttributes()` 返回 Element、Context、RmlEvent 或 null。

装饰器、滤镜及字体效果 Variant 返回
`DecoratorList`、`FilterList`、`FontEffectList` 资源对象，也可用于属性和事件输入。

```js
const { FilterList } = require('sfml.js-rmlui');
const filters = new FilterList('blur(2px) brightness(75%)');

element.setProperty(PropertyId.Filter, new Property(filters, Unit.FILTER));
console.log(filters.value, filters.list);
```

构造函数调用原生规范解析 RCSS。`value` 是原始文本，`isNull` 表示原生共享指针
是否为空，`list` 返回声明副本或自有 `FontEffect` 包装器。装饰器声明含 `type`、`isNamed`、`paintArea`
及 `properties`；滤镜声明含 `type`、`properties`。每个属性条目包含实例器局部
`id`、`name` 和独立 `Property`。命名装饰器稍后由样式表解析。字体效果元数据
包含 `hasUniqueTexture`、非预乘 `colour`、`layer`（`FontEffectLayer.Back`／
`Front`）及精确 BigInt `fingerprint`。

修改元数据不会修改原生声明。列表赋给另一个属性时保留共享资源身份；
分别解析相同文本会创建不同指针。空文本或 `"none"` 创建带类型的空指针列表，
其 `value` 为 `''`，`list` 为空。属性类型转换失败返回该类型的空列表，
属性／事件默认值接口保留传入的回退值。上游 CSS `font-effect: none` 仍返回
Variant NONE（`null`）。列表在 DOM 关闭或包装对象 GC 后仍可由持有者使用，
但必须处于原始运行代。关闭运行时会释放资源并使列表访问失效；已复制的字体
标量元数据与数值装饰记录仍可读取，FontEffect 包装器本身会失效。

`FontEffectList` 还支持 `(effects, text?)` 构造及可写的 `value`、`list`。
文本写入不解析 RCSS；列表写入保留输入顺序并保存不可变的原生效果。
每次写入创建新存储，已有 Property 和 DOM 保留旧快照。`[]` 构造或向空指针写入
均分配非空存储。RCSS 解析结果保留上游的背层／前层排序。

`new FontEffect()` 构造原生基础效果：白色、Back 层、指纹 `0n`、无独立纹理、
不支持字形指标且不生成纹理。解析得到的效果保留原生派生行为。
设置 `colour`、`layer` 或 `fingerprint` 可编辑包装器，重新赋回列表后应用。
写入复制元数据，不修改其他持有者的效果。`colour` 返回独立副本，需整体赋值。

`FontGlyph` 的 `bearing`、`advance`、`bitmapDimensions`、`colorFormat`
通过对应 `Int32Array` 视图映射原生字段。位图赋值将输入视图的准确字节范围复制到
原生独占存储；`bitmapData` 和 `bitmapOwnedData` 返回保活的可写字节视图。
赋值任一字段都会设置数据指针，`null` 清空位图。`weakCopy()` 复制指标并共享当前分配，
其 `bitmapOwnedData` 为 null。源字形替换位图或包装器被回收后，弱副本和导出视图
仍然有效。这些独立数值在运行时关闭后仍可用。

`effect.getGlyphMetrics(glyph, origin?, dimensions?)` 返回
`{ supported, origin, dimensions }`，默认使用零原点及字形位图尺寸。
`effect.generateGlyphTexture(bytes, dimensions, stride, glyph)` 调用原生字形生成，
写出预乘 RGBA 字节。stride 以字节计，行尾填充保持不变。接口校验缓冲区边界、
格式、分离／共享缓冲区及源与目标重叠。

`new FontEffect(callbacks)` 接受可选的同步回调 `hasUniqueTexture()`、
`getGlyphMetrics(glyph, origin, dimensions)` 和
`generateGlyphTexture(destination, dimensions, stride, glyph)`。
省略的方法保留原生基础行为。指标回调使用实际输入原点，返回
`{ supported, origin, dimensions }`。字形参数是可保留的原生自有快照。
已有位图必须覆盖声明尺寸，自定义指标调用也会检查；指标调用允许 null 位图。

纹理回调接收原生持有的临时存储，并保留原始行距。行像素初始值来自目标，
填充字节初始为零。成功同步返回后仅提交行像素；保留视图不会引用目标。
异常、Promise、临时缓冲区分离、目标转移或缩容都会放弃本次写入。
递归回调及运行时／DOM 修改被拒绝，元数据编辑仍可安全进行。

列表、属性快照、字典条目及嵌套声明属性保留自定义效果回调，包括属性定义的默认值。
样式表保留未激活规则及关键帧；文档保留样式直到原生对象销毁，
包括 `close()` 到下一次上下文更新之间的时间。游离元素树及独立保留的定义
使用 GC 可见引用，回调与持有者之间的循环可以回收。已注册默认值和全局样式表缓存
属于原生持有者。上下文根还覆盖光标代理及其拖拽克隆，以及已卸载但在下一次更新前
尚未销毁的文档。元素属性跟随所属元素树的持有关系。

默认字体引擎的字体层在文档关闭后仍会保留效果。`releaseFontResources()` 释放
这些缓存引用；其他值或样式仍持有效果时，回调继续存活。所有权跟踪保留原生效果身份
及字形图集复用。关闭运行时会释放所有回调，即使旧包装对象仍可访问。
自定义属性解析器可以构造效果及复制效果列表，嵌套 RCSS 解析仍被禁止。

`FontEffect.fillColorValuesFromAlpha(bytes, dimensions, stride)` 暴露原生
protected 辅助函数，将各 RGBA 像素的 alpha 字节复制到三个颜色通道，保留 alpha
及行间填充。接口接受非共享 `Uint8Array` 子视图，并校验尺寸、行距及存储边界。
这项像素操作可在初始化前、关闭后及 worker 中使用。

`DecoratorDeclaration` 和 `FilterDeclaration` 是可写记录。`instancer` 字段
接收 `DecoratorInstancer.get(name)` 或 `FilterInstancer.get(name)` 返回的
类型化引用；名称不存在时返回 `null`。装饰器的空引用表示命名引用，滤镜则要求
非空实例器。空构造函数初始化 `type: ''`、`properties: []`、`instancer: null`，
装饰器的 `paintArea` 为 `BoxArea.Auto`。`isNamed` 随当前实例器字段计算。

`new DecoratorList(records, text?)` 和 `new FilterList(records, text?)`
将记录复制到原生存储。这两类列表的 `value` 和 `list` 都可写。
修改 `value` 只改变元数据文本，不解析 RCSS；修改 `list` 复制声明而保留 `value`。
每次赋值都会创建新的原生共享列表，已有属性和事件保留的旧列表不受影响。
向空指针列表写入字段会创建非空存储，使用 `[]` 构造也得到非空的空列表。
输入数组、声明和属性均保留独立性。

```js
const records = filters.list;
const sigma = records[0].properties.find(entry => entry.name === 'sigma');

sigma.property.value = 6;
filters.list = records;
element.setProperty(PropertyId.Filter, new Property(filters, Unit.FILTER));
```

从解析结果获取实例器所需的完整属性字典。原生转换会在替换列表前拒绝缺失必需
属性、未知局部编号、实例器类型不匹配、失效引用和非法绘制区域。
属性 `name` 仅用于显示，`id` 决定字段。

`DecoratorInstancer`、`FilterInstancer`、`FontEffectInstancer` 均提供
`get(name)`、`register(name, instancer)` 和 `getPropertySpecification()`。
注册名称转换为小写，查询按输入名称原样匹配。替换注册后，旧实例器仍保留至关闭，
以保护已存在的引用。属性规格是只读视图，使用局部编号。

`new FontEffectInstancer(callback)` 实现原生字体效果创建回调。
通过 `registerProperty(name, defaultValue, affectsGeneration = true)`
注册属性并调用 `addParser(...)`，通过 `registerShorthand(...)` 注册
`font-effect` 简写以解析匿名 RCSS 参数。同名属性保留首次定义；
无效简写不占用编号，原生插入前检查属性和简写容量。

```js
const source = new FontEffect();
const custom = new FontEffectInstancer((name, properties) => {
  source.colour = properties.getProperty(tint.id).get({
    type: 'colourb', red: 255, green: 255, blue: 255, alpha: 255,
  });

  return source;
});
const tint = custom.registerProperty('tint', 'white', false)
  .addParser('color');

custom.registerShorthand('font-effect', 'tint', ShorthandType.FallThrough);
FontEffectInstancer.register('tint', custom);
const effects = new FontEffectList('tint(red)');
```

回调接收自有字典副本，同步返回 `FontEffect` 或 `null`。
原生代码先复制元数据，再由 RCSS 解析器设置指纹，保留返回包装器的快照及字形虚函数实现。
RmlUi 6.3 保存 `affectsGeneration`，但实际解析指纹仍使用全部属性；绑定保持此行为。
直接调用 `instanceFontEffect(name, properties)` 需要完整局部属性，可先调用
`specification.setPropertyDefaults(properties)`；直接调用不计算 RCSS 指纹。
回调可以操作属性、字典、效果副本并委托其他实例器；递归实例化、解析、注册以及
DOM/运行时变更会抛错，异常在最外层原生调用退出后传播。
已注册回调保留到关闭，未注册的回调引用环可被 GC 回收。关闭使全部视图失效。
`new FilterInstancer(callback)` 提供滤镜工厂。使用
`registerProperty(name, defaultValue).addParser(...)` 注册属性，以 `filter`
为简写名称；此注册没有 `affectsGeneration` 参数。回调接收字典副本，同步返回
自有 `Filter` 或 `null`，可委托
`FilterInstancer.get(name).instanceFilter(name, properties)`。
直接调用需要包含默认值的完整局部属性。字典后续变更不影响已创建滤镜的原生参数。

```js
const blur = FilterInstancer.get('blur');
const parameters = new PropertyDictionary();

blur.getPropertySpecification().setPropertyDefaults(parameters);
const filter = blur.instanceFilter('blur', parameters);
const overflow = filter.extendInkOverflow(element, {
  p0: { x: 0, y: 0 },
  p1: { x: 40, y: 30 },
});
```

`extendInkOverflow` 调用原生虚函数，返回 `Rectanglef` 角点副本，不修改输入；
相对长度使用传入的存活元素解析。滤镜实例器遵循上述回调限制、替换和关闭语义。
`compileFilter(element)` 返回唯一编译资源，见 [渲染资源](resources.zh-CN.md)。
`new Filter({ compileFilter, extendInkOverflow? })` 同步实现原生虚函数。
编译回调接收元素，返回通过该元素渲染管理器创建的 `CompiledFilter`。
返回值的所有权会移交原生：原包装器的 `isValid` 变为 false，再次返回它会抛错。
来自其他管理器的资源会被拒绝，所有权仍归原包装器。返回新建的空
`CompiledFilter` 表示编译失败。可选的溢出回调接收矩形副本，必须返回有限数值角点。

```js
const custom = new Filter({
  compileFilter(element) {
    return element.getRenderManager().compileFilter('blur', { sigma: 2 });
  },
  extendInkOverflow(element, overflow) {
    overflow.p0.x -= 6;
    overflow.p1.x += 6;

    return overflow;
  },
});

FilterInstancer.register('custom', new FilterInstancer(() => custom));
```

效果回调可读取属性和盒模型副本、解析数值长度、编译资源；拒绝 DOM/样式修改、
关闭运行时及递归渲染。原生元素效果保留回调；脱离文档的子树与独立滤镜使用
GC 可见引用，捕获自身的闭包也能回收。关闭运行时会释放回调并使滤镜包装器失效。
自定义装饰器创建和字体字形虚函数覆盖均已实现；原生所有权保留其回调，
游离或独立对象的循环仍可回收，并在关闭运行时释放。

`ColorStopList` 的结构是 `{ type: 'colorstoplist', values: ColorStop[] }`；
`BoxShadowList` 的结构是 `{ type: 'boxshadowlist', values: BoxShadow[] }`。
颜色使用 `{ type: 'colourb-premultiplied', red, green, blue, alpha }`，
各通道为 0 到 255 的整数。RGB 已预乘透明度，读写不再进行乘除。
数值字段使用 `{ number, unit }`，保留原生顺序、负偏移、相对单位，以及省略的
颜色停靠位置（`Unit.UNKNOWN`）。结果是独立副本，GC 或关闭运行时后仍可读取。

```js
/** @type {import('sfml.js-rmlui').BoxShadowList} */
const emptyShadows = {
  type: 'boxshadowlist', values: [],
};
const shadows = element.getProperty('box-shadow', emptyShadows);

if (shadows.values.length) {
  shadows.values[0].offsetX = { number: 8, unit: Unit.PX };
  element.setProperty(PropertyId.BoxShadow,
    new Property(shadows, Unit.BOXSHADOWLIST));
}
```

这两类列表同样适用于属性和事件。`getAttributeValue(name)` 读取原始列表，
`getAttribute(name)` 保留已有的字符串转换行为。属性和事件的模板读取使用传入的
回退值；样式属性转换失败则返回空列表。非法条目、非有限数及越界颜色字节会抛错，
不会修改目标值。输入数值字段可使用 NumericValue 对象；输出为普通记录，不含共享视图。
`Property.equals` 和 `notEquals` 按值比较原生列表及各条目的所有字段；
单条目列表的比较等价于原生 ColorStop/BoxShadow 运算符。

`get(typeExemplar)` 通过类型样本选择转换：`0` 选择 double，`0n` 选择有符号
64 位整数，`''` 选择字符串，也支持向量和颜色结构。转换失败返回原生 `T{}`，
不会使用样本的具体值兜底。`element.getProperty(name, typeExemplar)` 在属性缺失时
也返回 `T{}`。`getNumericValue()` 返回独立的 `NumericValue`；
`toString()` 使用原生定义。相等比较只比较单位和值，不比较元数据。

`unit`、`specificity`、`parserIndex` 分别通过单元素 `Int32Array` 映射原生元数据，
并在原生调用边界同步到属性。视图只保活这些整数，回收线程不会因此释放样式资源。
缓冲区已标记为不可转移；结构化克隆会复制数据。
`source` 是复制的 `{ path, lineNumber, ruleName }`。修改副本不会影响元素，
需要调用 `setProperty` 写回。

`PropertyDefinition` 提供编号、继承标志、布局标志、相对目标和默认属性副本。
`parseValue(property, text)` 直接修改输出属性，失败时也保留原生的 UNKNOWN 单位。
`getValue(property)` 返回 `{ success, value }` 两个原生输出。
固定版本 RmlUi 6.3 的关键词反序列化即使得到有效文本，也会返回 `success: false`。

`PropertyDefinition(id, defaultValue, inherited, forcesLayout)` 创建可修改的独立定义，
可链式调用 `addParser(name, parameters = '')` 和 `setRelativeTarget(target)`。
从属性取得的内建定义只读。独立定义保留至关闭，保护原生属性借用的指针。

属性与定义要求已初始化且由当前环境拥有的运行时。DOM 销毁不影响副本；关闭运行时
会使其失效。关闭时先释放属性资源，再销毁 RmlUi 内存池与解析器，并将共享元数据
重置为原生默认值。旧句柄不能在重新初始化后使用。保留的视图仍可读写，但不会影响
新运行代。原生边界会拒绝伪造句柄、非法单位位、非有限数及不匹配的复杂值存储。

`Transform` 在 Native 中持有原语列表，构造参数使用标准 `TransformPrimitive`
记录。`TransformPrimitiveType` 包含全部 22 种原生类型。`getPrimitive(index)` 和
`primitives` 返回副本；给 `primitives` 赋值可整体替换列表，也可调用
`addPrimitive`、`clearPrimitives` 和 `getNumPrimitives`。非法索引或分量会抛错。

```js
const { Transform, TransformPrimitiveType: T, makeTransformPrimitive } =
  require('sfml.js-rmlui');
const rotate = makeTransformPrimitive(T.ROTATE2D,
  [{ number: 90, unit: Unit.DEG }]);
const transform = new Transform([rotate]);

element.setProperty(PropertyId.Transform,
  Transform.makeProperty(transform.primitives));
```

已解析分量使用数值，标准记录中的角度使用弧度。平移与透视使用 `{ number, unit }`，
保留相对单位。`makeTransformPrimitive(type, numericValues)` 调用原生 NumericValue
数组构造函数：角度接受 RAD/DEG/PERCENT，Rotate3D 轴要求 NUMBER；矩阵与缩放直接复制数值。
标量重载通过显式分量表达：原生平移默认 PX，角度默认 DEG，等比缩放为每个轴重复同一数值。
Matrix3D 使用列主序的 16 个系数。DecomposedMatrix4 使用 `perspective`、
`quaternion`（x/y/z/w）、`translation`、`scale` 和 `skew` 五个向量。

原始值使用 `{ type: 'transform', primitives: [...] }`；`primitives: null` 保留原生
TransformPtr 空指针，空数组则表示恒等变换。Property 的 `Get<T>` 转换失败时返回空指针记录，
属性与事件读取使用传入的回退值。赋值时将原语复制到新的原生对象。
Property 原生相等比较使用指针身份：`property.clone()` 保留身份，从快照重建会创建新指针。
纯 Transform 和快照在关闭后仍可用，`makeProperty` 要求运行时有效。
整体列表赋值提供原生可写 `GetPrimitives` 的能力，不借出可变长向量中的引用。

`element.iterateLocalProperties(filterInheritedBy = null)` 一次进入 Native，
按原生顺序返回 `[name, Property]` 数组。它包含行内覆盖、样式表和类规则、
自定义变量及含变量的简写，遵循原生去重和简写占位符规则。指定筛选元素时，
仅保留该元素实际继承的属性，其自有覆盖会被排除。全部值在释放原生迭代器和
创建包装器前完成复制。后续属性、类变更或元素销毁不会使快照失效；
该方法不保留实时原生迭代器。
