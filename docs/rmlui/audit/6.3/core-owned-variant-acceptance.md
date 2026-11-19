# Owned Variant 与转换模板验收

本次对账将 `Core/Variant.h` 中漏记的 43 条编译器声明加入补充台账。
原 Core 分母保持 549，原补充分母 1482 作为历史记录保留；补充分母变为 1525。
这不构成 Core/19 或整份计划验收通过。

## 原生值与转换目标

`OwnedVariantState` 独立持有 `Rml::Variant`，没有借用 Property 作为存储。
共享的 uint32 类型元数据由独立 backing store 持有，不含 RmlUi 资源。
`getType()` 直接读取共享数据；复制、移动、赋值、清空和相等判断使用原生操作。
关闭运行时先清空全部存储，再释放上游资源；共享类型更新为 `NONE`。
原生复制到 Property、属性字典和事件参数保留精确存储类型。

转换目标单独放在 `VariantSelector`。整数向量没有 Variant 存储类型；
`vector2i`、`vector3i`、`vector4i` 只选择原生 `GetInto<VectorXi>`。
`Character` 是 char32_t 枚举，构造时调用原生枚举 Set，存储为 `INT64`。
读取经原生 `GetInto<int64_t>` 后转换枚举，不能替换成 char 到 Character 转换。

默认值由调用入口决定：Property 与样式查询使用 `T{}`；属性、事件参数和
Variant 使用调用方给定值。`getInto` 独立返回原生成功标志。
字符串整数向量转换失败可以修改默认值前缀；分量不足则全部保留。
溢出检查只访问原生转换会读取的分量，不因不可达后缀制造异常。
原生没有的 byte 到 byte、浮点到 byte、字符串到 char 转换仍保留失败行为。

`getReference(type)` 先验证精确类型，再通过实际 `GetReference<T>` 读取；
返回 JS 聚合快照，不暴露未经验证的原生引用或地址。
Element 指针共享销毁观察槽，使用相同的私有 owner 边保活。
对象销毁会移除陈旧包装器边；脱离 DOM 的自引用环可以回收。
无变化的数值读取和 update 循环不会扫描全部 owner。

## 43 条声明逐项映射

“局部”表示本机验证此条具体声明；枚举值通过不代表对应指针构造已实现。
“部分”保留未完成模板或任意指针适配，不从台账排除。

| 上游声明 | JS / Native 映射 | 状态 |
| --- | --- | --- |
| Variant | 独立 Native owner、运行代与共享元数据 | 部分 |
| Type | VariantType 精确字符编码 | 局部 |
| NONE | VariantType.NONE = 45 | 局部 |
| BOOL | VariantType.BOOL = 66 | 局部 |
| BYTE | VariantType.BYTE = 98 | 局部 |
| CHAR | VariantType.CHAR = 99 | 局部 |
| FLOAT | VariantType.FLOAT = 102 | 局部 |
| DOUBLE | VariantType.DOUBLE = 100 | 局部 |
| INT | VariantType.INT = 105 | 局部 |
| INT64 | VariantType.INT64 = 73 | 局部 |
| UINT | VariantType.UINT = 117 | 局部 |
| UINT64 | VariantType.UINT64 = 85 | 局部 |
| STRING | VariantType.STRING = 115 | 局部 |
| VECTOR2 | VariantType.VECTOR2 = 50 | 局部 |
| VECTOR3 | VariantType.VECTOR3 = 51 | 局部 |
| VECTOR4 | VariantType.VECTOR4 = 52 | 局部 |
| COLOURF | VariantType.COLOURF = 103 | 局部 |
| COLOURB | VariantType.COLOURB = 104 | 局部 |
| SCRIPTINTERFACE | VariantType.SCRIPTINTERFACE = 112；受检查的 Element | 局部 |
| TRANSFORMPTR | VariantType.TRANSFORMPTR = 116 | 局部 |
| TRANSITIONLIST | VariantType.TRANSITIONLIST = 84 | 局部 |
| ANIMATIONLIST | VariantType.ANIMATIONLIST = 65 | 局部 |
| DECORATORSPTR | VariantType.DECORATORSPTR = 68 | 局部 |
| FILTERSPTR | VariantType.FILTERSPTR = 70 | 局部 |
| FONTEFFECTSPTR | VariantType.FONTEFFECTSPTR = 69 | 局部 |
| COLORSTOPLIST | VariantType.COLORSTOPLIST = 67 | 局部 |
| BOXSHADOWLIST | VariantType.BOXSHADOWLIST = 83 | 局部 |
| VOIDPTR | VariantType.VOIDPTR = 42；存储适配未完成 | 局部 |
| Variant() | new Variant() | 局部 |
| Variant(const Variant&) | new Variant(owner)、clone() | 局部 |
| Variant(Variant&&) | move()，保留源类型 | 局部 |
| operator=(const Variant&) | assign(owner)，返回当前 JS owner | 局部 |
| operator=(Variant&&) | moveAssign(owner)，自赋值保留值 | 局部 |
| ~Variant() | SharedHandle 析构、弱注册表与关闭清理 | 局部 |
| Variant(T&&) | 25 种可存储类型与 Character 枚举 | 部分 |
| operator=(T&&) | assign(value)，原生复制赋值 | 部分 |
| Clear() | clear()、资源边清理与 NONE 元数据 | 局部 |
| GetType() | getType()，共享元数据 | 局部 |
| Get(T) | get(default)，整数向量与 Character 目标 | 部分 |
| GetInto(T&) | getInto(default)，原生 bool 和部分输出 | 部分 |
| GetReference() | 精确存储检查与快照；完整指针模板未完成 | 部分 |
| operator==(const Variant&) | equals(owner) | 局部 |
| operator!=(const Variant&) | notEquals(owner) | 局部 |

## 验证范围

独立回归覆盖全部 26 个枚举编码、25 种支持的原生存储、精确类型复制、
Native 相等语义、移动后状态、转换成功与失败、整数向量部分写入、
Character 枚举、销毁、GC、自引用环、关闭和访问器导致的 receiver 失效。
TransformPtr 的原生比较保留共享指针身份，重新解析同一内容不会自动相等。
此前新增 API 的八组 owned 场景与六组模板场景均有缺失接口的失败记录。

完整包、四语文档、格式与编译器命名检查的最终命令状态和计数保存在
`/tmp/rmlui-63-completion/` 的 `owned-variant-*` 日志及原子对账记录中。
源码审查由同一个控制器另行执行，不能称为独立审查。
任意 ScriptObject、void* 的自有适配、完整模板覆盖、全局初始化、
实际脚本引擎与插件及 Tasks 5–10 继续保留未验收状态。
