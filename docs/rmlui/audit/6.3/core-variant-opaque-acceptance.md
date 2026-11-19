# 不透明 Variant 对象验收

> 管理对象可以通过 `voidptr` 样本进入实际的原生 `VOIDPTR` 存储。
> 十三个聚焦场景、完整包及四语站点验收通过。
> 未登记的外部 C++ 指针及完整转换目标矩阵仍需继续验收。

## 存储与身份

`{ type: 'voidptr', value: object }` 保存管理对象；
`{ type: 'voidptr', value: null }` 保存带类型的空指针。
对象第一次注册时获得隐藏的原生身份。复制、移动和重复存储相同对象共享身份；
`value`、精确 `getReference(VariantType.VOIDPTR)` 及成功的模板转换返回原对象。
公开的 `VariantOpaqueObject` 类型只标记原生来源，不暴露地址。
普通对象首次存储需要显式样本；原生输出的普通管理对象可以直接再次存储。
Element、Context、Event 等已有包装器仍按原有名义类型进入原生；
需要将其作为不透明对象存储时继续使用 `voidptr` 样本。

```js
const object = { label: 'owned object' };
const value = new Variant({ type: 'voidptr', value: object });
const copy = value.clone();

console.log(value.getType() === VariantType.VOIDPTR); // true
console.log(copy.value === object); // true
console.log(value.getInto({ type: 'voidptr', value: null }));
// { success: true, value: object }
```

数值 Variant 的内联大小、对齐及共享类型元数据保持原实现。
只有指针存储使用内联共享槽；编译期断言检查该槽没有扩大内联缓冲区。
注册表保存弱记录，管理对象通过隐藏 JS 边关联其原生身份。
原生 Variant 的槽拥有身份记录；记录只保存弱 JS 引用。
可达的 Variant、Property、字典、DOM 和独立 Context 使用 JS 保活边保留对象，
实际由 Native 拥有的树使用 Native 根。引用环仍可以由 GC 回收。

## 转换与资源边界

目标样本调用实际 `Rml::Variant::GetInto<void*>`。
成功时复制原存储以保留保护槽，成功的空指针返回 null。
失败时 Variant、属性和事件参数保留调用方回退值，
Property 与样式查询遵循原生 `T{}`，返回 null。
指针到标量保持上游不支持转换的结果；字符串转换拒绝输出地址。
数据模型继续拒绝 `SCRIPTINTERFACE` 和 `VOIDPTR`。

对象可以包含 `type`、`elementHandle`、`contextHandle` 和 `eventHandle` 等普通字段。
原生输出使用独立封套传回对象，JS 解码先恢复对象身份，不以其公开字段推断包装类型。
模板默认值仍要求显式指针样本，不能从普通对象或原生包装器隐式选择目标。

RmlUi 的原生拖拽参数 `drag_element` 有独立的裸 Element* 契约。
事件参数解码、元素参数查询及 EventInstancer 拥有者登记均先排除受保护的不透明槽。
管理对象即使用这个参数名也不会被强转为 Element*；
专用元素查询明确拒绝该类型，普通参数查询仍返回管理对象。

## 验证证据

初始十一场景全部因缺少 `voidptr` 适配失败。
接入后，公开字段识别补测确认隐式默认值未被拒绝，
拖拽补测实际触发 SIGBUS，证明裸指针强转路径缺少类型边界。
两条路径修正后，`variant-void-pointers-green-1.log` 记录十三条 PASS、零条 FAIL。
相同构建下，`variant-scriptinterfaces-green-6.log` 的十三个场景及
`variant-void-pointers-events-1.log` 的十六个事件场景均通过。

GC 场景覆盖最后一个副本清空后释放对象、对象与 Variant 的环、
游离元素自引用、独立 Context 文档自引用、Native 文档关闭及
保留已移除 Context 时的私有根清理。
16 帧静态测试记录零 callback snapshot visits 和零 element ownership visits。
这些计数不代表完整帧耗时、分配量或 GPU 耗时验收。

补丁升级曾实际重复插入 PropertyDictionary 辅助函数，Native 编译失败。
补丁器现在识别每个已完整应用的细化版本。
在现有源目录中模拟旧版保护槽并执行升级后，内容恢复为当前版本；
再次执行保持文件时间戳不变，辅助函数只有一份。
证据为 `variant-void-pointers-patch-upgrade.log`。
没有创建 worktree、临时仓库或构建、测试隔离环境。

当前 Native 第三次构建、TypeScript、消费端类型、ESLint、cpplint 和格式检查通过。
新的拥有者编译单元和六个接入编译单元均通过编译器命名检查，
对应 `variant-void-pointers-naming-4.log` 和 `variant-void-pointers-naming-final.log`。
LLVM 18 使用其匹配的 C++ 标准库和显式的系统 C 头文件顺序；
没有用诊断豁免掩盖 Xcode SDK 标准库版本不匹配。
四语站点的 81 项检查通过，构建校验 152 个本地化页面、
每语种 1,591 个 API 页面、303 个重定向及全部本地链接和资源。
ComputedFields、ArrayPrimitiveType、PrimitiveRecord 和两处 ByteColour 的
五类已有可见性警告继续保留，后续从源类型与生成器修正。
完整包 `variant-scriptinterfaces-package-4.log` 退出 0：
106 个测试文件、1,053 条 PASS、零条 FAIL，
包含 lint、cpplint、Native 与 TypeScript 构建、消费端类型及全部运行时测试。
证据脚本核验这些结果并向原始九条 Core 和九条 Supplemental 声明补充证据，
没有提升通用模板状态或改变原始分母。
完整包日志为 `variant-scriptinterfaces-package-4.log`，
站点日志为 `variant-void-pointers-site-tests-1.log` 和 `variant-void-pointers-site-1.log`，
均位于 `/tmp/rmlui-63-completion`。

## 保留的范围

该实现登记管理对象的原生身份，不能据此宣称已支持任意外部 C++ `void*`。
`ScriptInterface::GetScriptObject` 的管理关联仍使用既有 ScriptObjectRecord 拥有者；
其 JS 对象可以通过显式样本存储，但未登记的外部覆盖实现仍被拒绝。
实际 C++ void* 分配和原生 GetScriptObject 覆盖的登记路径，
见 [外部 Native 对象适配验收](external-native-adapter-acceptance.md)。
独立的 SCRIPTINTERFACE 来源、真实 Context/Event 根和 getter 调用次数，
见 [外部 ScriptInterface Variant 验收](external-script-variant-acceptance.md)。
完整 TypeConverter 目标与生命周期矩阵、迭代器转移、全部原始声明、
Lua 后续项、可选模块、GPU 与平台 IME、应用与视觉、编辑器与打包 CI、
独立整体验收继续执行。原始声明分母和通用模板状态没有提升。
