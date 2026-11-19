# 数值与单位

## 计算值

`element.getComputedValues()` 返回原生 `GetComputedValues()` 的实时只读视图。
修改样式后先调用 `context.update()` 再读取。98 个 getter 使用 camelCase 名称，
包括 `fontFamily`、`marginTop`、`lineHeight`、`borderRadius`、`animation` 和
`transform`。结构化结果为独立副本；动画、过渡、变换或字体句柄不存在时返回 `null`。

`new ComputedValues(element)` 按上游默认值分配独立原生存储，提供全部 83 个
原生赋值入口：82 个属性 setter，以及只写的 `setHasLetterSpacing(boolean)`。
`copyInherited(source)` 和 `copyNonInherited(source)` 只复制各自的原生字段组，
保留目标对象的关联元素。赋值只修改独立对象；字体族、光标、字间距、局部 flex
属性及动画、过渡、变换 getter 仍读取关联元素。元素销毁或运行时关闭后，独立对象
和实时视图均拒绝访问。观察引用不会保活无人引用的游离元素。

```js
const { ComputedValues, Style, resolveValueOr } = require('sfml.js-rmlui');

context.update();
const view = element.getComputedValues();
const value = new ComputedValues(element);

value.copyInherited(view);
value.copyNonInherited(view);
value.width = new Style.LengthPercentageAuto(
  Style.LengthPercentageAutoType.Percentage, 25
);
const pixels = resolveValueOr(value.width, 400, 0); // 100
```

`Style` 导出原生样式枚举、值类型及别名，字重接受 1–1000 和 Auto（0）。
`LengthPercentage`、`LengthPercentageAuto`、`NumberAuto`、`VerticalAlign`
及 `LineHeight` 分别持有原生标量存储。`valueView` 和 `typeView` 映射浮点及
枚举字段；`LineHeight.inheritValueView` 映射继承值。这些视图在包装器回收、
DOM 销毁和运行时关闭后仍有效，不保活元素。原生消费入口会重新检查枚举范围和有限值。

`new Style.VerticalAlign()` 表示 Baseline；单个数字参数表示像素长度；
两个参数表示 `(VerticalAlignType, length)`。`Style.Clip(type, number)` 保留
int8 编码：Number 搭配 0、-1、-2 分别变为 Auto、None、Always；
`getType()`、`getNumber()`、`equals(type)` 对应原生操作。边框宽度 setter
接受 int16，并保留上游存入 uint16 的转换；圆角半径检查范围后截断为 int16。

`resolveValue` 和 `resolveValueOr` 接受两种长度类。百分比使用非负基准，负基准
表示不确定；自动长度和不确定百分比返回零或指定后备值。绝对长度在负基准下仍返回
自身数值。`fontFaceHandle` 和 `element.getFontFaceHandle()` 返回按运行时
代次检查的不透明令牌，不暴露数值地址。

## 独立样式字段组

`Style.CommonValues`、`Style.InheritedValues` 和 `Style.RareValues` 按上游
默认值构造三个原生结构，暴露全部 112 个可写字段。名称使用 camelCase，
`float_` 对应 `float`。对象独立于元素，写入不会修改文档样式；
可在初始化前创建，也可在 Worker 中使用。

可寻址的数值字段提供 `字段名View`：浮点使用 `Float32Array`，边框宽度使用
`Uint16Array`，圆角使用 `Int16Array`，颜色使用 RGBA `Uint8Array`。
视图在包装器回收或运行时关闭后继续保活原生结构。颜色 getter 返回副本。
位字段通过原生访问器检查；`hasLetterSpacing` 保留原生的数值 0/1 类型。
普通 setter 在写入前拒绝非法枚举、整数、浮点或颜色值；直接写视图不执行
setter 校验。`clip` 复制独立的 `Style.Clip`，`language` 保留包含零字符的 UTF-8 文本。

```js
const values = new Style.CommonValues();

values.display = Style.Display.Flex;
values.widthType = Style.LengthPercentageAutoType.Percentage;
values.widthValueView[0] = 25;
values.backgroundColorView.set([20, 40, 60, 255]);
```

非空的 `InheritedValues.fontFaceHandle` 仍依赖字体引擎。
`shutdown()`、`releaseFontResources()` 和 `releaseRenderManagers()` 会使旧
令牌失效，包括独立 `ComputedValues` 中的副本。读取或写入过期句柄会抛错，
需从存活元素重新获取。关闭运行时后仍可赋值 `null` 并访问其他独立字段。
释放字体或渲染管理器前，必须先重新挂载或回收脱离树的元素；上游只更新上下文持有的树。
被拒绝的释放调用不会使现有令牌失效。

## 数值与单位换算

`NumericValue` 独立持有原生 `Rml::NumericValue`，默认数值为 `0`，单位为
`Unit.UNKNOWN`。`number` 和 `unit` 映射实际原生字段；`numberView` 是单元素
`Float32Array`，`unitView` 是单元素 `Int32Array`。保留的视图在包装器回收、
元素销毁和运行时关闭后仍然有效，不会保活 DOM 对象。

```js
const { NumericValue, Unit, anyUnit } = require('sfml.js-rmlui');
const distance = new NumericValue(12, Unit.DP);

distance.numberView[0] = 24;
const pixels = element.resolveLength(distance);
const quarter = element.resolveNumericValue(
  new NumericValue(25, Unit.PERCENT), 200
); // 50
const isLength = anyUnit(distance.unit & Unit.LENGTH);
```

`clone()` 创建独立原生副本。`equals()` 和 `notEquals()` 调用上游运算符，
比较数值和单位两个字段；正零与负零相等。数值写入时舍入为 float32。
样式修改后先调用 `context.update()`，再按当前计算样式解析字体相对单位。

| 单位 | 解析规则 |
| --- | --- |
| `PX` | 像素数值 |
| `DP` | 数值乘以上下文密度比 |
| `VW`、`VH` | 当前上下文宽度或高度的百分比 |
| `EM`、`REM` | 元素或文档字号的倍数 |
| `INCH`、`CM`、`MM`、`PT`、`PC` | 每英寸 96 像素，再乘以上下文密度比 |
| `NUMBER` | 数值乘以 `baseValue` |
| `PERCENT` | 数值乘以 `baseValue / 100` |
| `DEG`、`RAD` | 弧度 |
| `X` | 原数值，不缩放 |

`resolveLength()` 对所有非长度单位返回零，包括 `NUMBER` 和 `PERCENT`。
`resolveNumericValue()` 对非数值单位返回零。两个方法都要求元素仍然有效。
数值对象本身可在运行时未初始化时创建、修改和比较，也可在 Worker 中使用。

`Unit` 包含上游全部基础、数值、类型化属性、自定义属性和组合标志。
`Units` 是其集合类型别名。JavaScript 的 `|` 和 `&` 对应原生集合运算符，
`anyUnit()` 对应 `Rml::Any`。可以存储和比较单位集合，但不能把包含多个单位的
集合当成单个长度或数值解析。

构造函数和字段 setter 会拒绝非有限数、float32 溢出值和未知单位位。
原生操作在使用共享视图前再次校验，解析结果溢出时抛出异常。
可通过直接写视图修复非法字段，也可使用该字段对应的 setter 修复。
