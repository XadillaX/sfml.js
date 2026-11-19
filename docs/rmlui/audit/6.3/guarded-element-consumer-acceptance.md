# 元素 Variant 消费入口验收

> 外部矩阵 44 项、独立探针 6 项和九个维护单元的命名检查通过。
> 完整包 109 个 runtime 文件、1,096 条 PASS、零 FAIL，Native 编译无错误或警告。
> 原始 3,926 条声明与既有模板状态不变，RmlUi 6.3 整体验收继续执行。

## 原生指针读取

`GuardedElementVariantPointer` 只查询已登记的共享槽，不解引用待验证的
`ScriptInterface*`，不创建 V8 对象、不回调 JS，也不扫描全部元素。
它返回登记槽对应的存活元素；其他类型、未登记槽与已失效槽返回空指针。

`ElementVariantToJs` 使用同一个解析器。有效的 Context、Event 和外部
ScriptInterface 值经过其登记 owner 校验后返回 null；未登记的非空指针抛错。
Variant、Property 和元素属性 getter 使用这条边界，不再对输入地址执行 RTTI。
属性不存在或类型转换失败时保留默认元素；成功转换出的空指针替换默认值。

Event 包装先收集登记元素的 ObserverPtr，再执行参数值转换。
普通外部 ScriptInterface 不被当作元素，其 JS 身份仍由原有登记负责。
Event 元素 getter 拒绝非空的非元素 ScriptInterface。
元素参数、目标与当前元素的销毁观察保持独立，已销毁引用仍使事件访问抛错。

`IsNativeDragElementParameter` 统一三个事件消费者的上游契约：
参数为未登记的 VOIDPTR、名称为 `drag_element`，且事件 id 属于拖拽事件。
其他参数不能借用这个名称进入元素观察路径。
真实 Context 拖拽路径继续使用已有元素来源转换，不开放任意指针输入。

## 回归证据

`external-event-parameters-red-4.log` 记录构造入口的 SIGSEGV 和 SIGBUS。
这份日志的 getter 场景仍有测试句柄错误，不作为 getter 崩溃证据。
修正测试句柄后，独立 getter 命令退出 139；其 stderr 文件为空，
退出状态来自实际命令结果，不从空日志推断。

`external-value-getters-red-1.log` 的六项 SIGSEGV 来自正式扩展测试：
Variant、Property、元素属性各覆盖 raw 指针与未登记共享槽。
临时独立扩展的 `unregistered-value-getters-red-1.log` 同样复现六项 SIGSEGV。
扩展实际创建并释放 C++ ScriptInterface，再通过 Native 接口写入其值；
测试没有构造 JS 地址、替代原生分配或创建第二个运行时。

`external-value-getters-green-1.log` 记录全部 44 项通过。
其中保留此前 31 项身份、复制、Lua、GC、运行代、所有权根与稳定帧场景，
并验证本轮构造与 getter 拒绝、非元素 null、默认值和销毁保护。
独立扩展的六条原始崩溃路径全部通过。
Native 构建无 compiler error 或 warning；九个维护单元的 LLVM 18 命名、
clang-format、cpplint 与测试脚本 lint 通过。

完整包的 Event 阶段运行已停止，没有计入通过记录。
最终实现的 `external-value-getters-package-1.log` 记录实际 `npm test`
退出零：lint、cpplint、Native/TS 构建、consumer types 和全部 runtime 通过。
共 109 个唯一 runtime 文件、1,096 条 PASS、零 FAIL；Native 编译无错误或警告。
完整状态见 [机器证据](guarded-element-consumer-evidence.json)。
外部矩阵与独立探针不计入普通 runtime 文件数或 PASS 数。
所有构建复用现有输出，测试扩展与日志保存在临时目录。

## 验证范围

本记录验证 macOS arm64 的这些消费入口，不提升完整转换模板状态。
既有稳定帧断言继续要求零 callback snapshot visits 和零 element ownership visits。
本轮没有新增 TS API，不包含重新执行的浏览器、GPU、平台 IME 或发布包验证。

后续独立字符串探针 `unregistered-property-string-red-1.log` 退出 1，
记录 Property.toString() 对 Native 写入的 raw ScriptInterface 没有抛出预期异常。
该发现属于当时未验收的后续，不能从本轮 getter 或完整包通过推断其已验收。
随后完成的 [字符串消费入口验收](variant-serialization-acceptance.md)
记录直接及嵌套序列化修复；本记录与机器证据保留当时的源码、日志指纹。

[此前 ScriptInterface 来源验收](external-script-variant-acceptance.md) 与其
[机器证据](external-script-variant-evidence.json) 保留为 31 项历史快照，
原始日志和源码指纹不重写。
八条 Core、十六条 Supplemental 后续、317 条 TypeConverter 声明、
1,393 条未映射声明及其余整体验收继续执行。
