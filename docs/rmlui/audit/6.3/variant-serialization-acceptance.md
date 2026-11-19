# Variant 字符串消费入口验收

> macOS arm64 外部矩阵 118 项、独立原始探针和五个维护单元的命名检查通过。
> 完整包 109 个 runtime 文件、1,096 条 PASS、零 FAIL，Native 编译无错误或警告。
> 四语文档测试、构建及链接检查通过。完整 RmlUi 6.3 验收继续执行。

## 输出边界

`CheckVariantStringConversion` 按实际 Variant 类型拒绝 `SCRIPTINTERFACE`
和 `VOIDPTR` 的字符串输出，包括 raw 指针、共享槽和已失效槽。
它在访问待验证指针之前完成检查，不读取对象的 RTTI 或脚本身份。

`Property.toString()`、`PropertyDefinition.getValue()`、
`PropertySpecification.propertiesToString()` 和公共模板的字符串目标
使用同一个检查。模板转换仍保留原生成功标志、默认值和部分转换语义。
检查失败抛出 `TypeError`，不把地址作为 JS 字符串返回。

装饰器与滤镜的检查使用显式待处理列表，只遍历原生序列化实际读取的
普通属性。共享列表只访问一次，检查不递归消耗 C++ 栈。
已有缓存文本和无 instancer 的声明不读取隐藏属性；
默认值、自定义属性和简写值也不被误当作本次字符串输出。
普通标量检查直接返回，不分配遍历容器，也不扫描原生所有者。
原生 C++ `TypeConverter<void*, String>` 和
`TypeConverter<ScriptInterface*, String>` 的 `%p` 契约保留不变。

## 实际回归

测试扩展创建真实 C++ ScriptInterface 或对象，写入原生值后释放实际分配。
测试不构造 JS 地址、替代句柄或第二套依赖及构建环境。
直接值、装饰器和滤镜各覆盖四种指针来源，并分别调用六个公共入口：
Property 文本、定义文本、字典文本、Property 字符串目标、
Variant 字符串目标和 Variant GetInto。

`external-serialization-red-2.log` 包含 46 条有效的缺少指针异常回归。
其中字典和缓存文本场景的参数错误不作为产品回归证据。
修正显式参数后的 `serialization-dictionaries-red-1.log`
独立记录 12 条字典回归及两条缓存文本控制通过。
首轮扩展编译错误仅为测试设置错误，不计入产品失败。
原始独立探针与嵌套滤镜字符串目标也分别记录预期异常缺失。

`external-serialization-green-1.log` 全部 118 项通过：
保留此前 44 项身份、getter、事件、所有权及 GC 场景，
新增 72 项拒绝场景和两项缓存文本控制。
原始独立 Property 文本探针退出零。外部场景未重复计入普通包测试数量。

最终 `external-serialization-package-2.log` 记录完整 `npm test` 退出零，
涵盖 lint、cpplint、Native/TS 构建、consumer types 和全部 runtime。
第一轮完整包命令只在新增文档的行长 lint 处失败，不作为通过记录。
clang-format、cpplint、五个 LLVM 18 维护单元的命名和 whitespace 检查通过。
现有稳定帧场景继续验证零 callback snapshot visits 和零 element ownership visits。

文档站命令实际退出零：81 项测试，零失败、零跳过；
152 个本地化页面、每种语言 1,596 个 API 页面、303 个重定向和全部本地链接、
资源通过检查。RmlUi 未产生 TypeDoc 警告，原有其他包的警告仍保留在构建日志。
公共方法的异常说明及属性指南已同步英文、中文、日文和韩文。

## 范围与后续

[机器证据](variant-serialization-evidence.json) 保留原始 3,926 条声明的指纹，
列出 12 条相关原始消费声明及本轮源码、日志指纹。未提升任何原始声明状态。
六个直接入口的行为执行与共用转换边界的源码对账分别记录，
不把它们解释为全部模板的运行覆盖。

[此前元素消费者记录](guarded-element-consumer-acceptance.md) 及其机器证据
保留为历史快照。其当时未修复的序列化发现由本记录接续，旧源码指纹不重写。
本轮未执行 GPU、平台 IME、浏览器或发布包验收。
八条 Core、十六条 Supplemental 后续、317 条 TypeConverter 声明、
剩余完整清单、Lua 后续、可选模块和官方应用验收继续执行。
