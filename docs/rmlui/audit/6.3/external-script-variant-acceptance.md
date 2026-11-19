# 外部 ScriptInterface Variant 验收

本页保留 31 项验收时的历史快照；后续消费入口修复与 44 项矩阵见
[元素 Variant 消费入口验收](guarded-element-consumer-acceptance.md)。

> 真实 C++ ScriptInterface、Context 和 Event 子类已接入登记与所有权路径。
> 外部矩阵 31 项通过；完整包 109 个文件、1,096 条 PASS、零条 FAIL。
> 四语站点 81 项测试与构建通过，六个维护单元的命名检查通过。
> 原始声明分母和其余模板状态保持不变，RmlUi 6.3 整体验收继续执行。

## 原生来源与身份

`native/rmlui-variant-pointers.h` 提供 Native 专用
`RegisterNativeScriptVariant(interface, javascript_object)`。
它登记真实 `ScriptInterface*` 和 JS 原对象，返回 `NativeScriptVariantOwner`。
扩展持有登记与实际分配，在释放接口前调用 `Invalidate()`；登记析构也使槽失效。
这些操作不分配 V8 对象、不回调 JS，也不把地址转换为 JS 数字。

```cpp
auto registration = sfmlrmlui::RegisterNativeScriptVariant(
    interface, javascript_object);
if (!registration) {
  return;
}

Rml::Variant value;
registration->SetVariant(&value);

registration->Invalidate();
// 此后才释放 interface；所有副本共享已经置空的槽。
```

复制、移动、Property、DOM 属性、事件和 Lua 快照共享原生失效槽。
复制值保留 JS 身份，不延长 C++ 分配的生命周期。
原生地址检查只向 JS 返回布尔值。
同一 JS 对象的重复登记和失效后再次登记被拒绝。
关闭时置空槽并清除 generation，重启不会恢复旧地址。

JS 读取返回原对象，公开类型为 `VariantScriptObject`。
显式 `{ type: 'scriptinterface', value: object }` 选择实际
`GetInto<ScriptInterface*>`；成功的空指针转换返回 null，
失败转换保留调用方默认值，Property 的目的类型仍使用 `T{}`。
目的对象的公开字段保持不透明，样本不会读取其 `type` 或其他用户 getter。
数据模型仍拒绝指针值，指针输出与 VOIDPTR 来源保持独立。

此登记与 `GetScriptObject` 关联独立。
普通宿主对象、未登记 Native 地址、自行构造但未登记的共享槽均不能获得
ScriptInterface 来源。转换先查登记槽，再访问原生对象。
Element 的槽也按实际共享槽地址登记，Context/Event 使用其原有名义槽，
没有使用三个类继承的相同 RTTI 标识猜测具体类型。

## Getter 与所有权

`ReadScriptObject` 每次查询只调用一次原生虚函数。
非空、返回 null 和恢复原值的路径使用同一次读取的结果完成关联验证。
原生覆盖仍保持权威，JS setter 不能替换已登记的 Native 关联。

Native 通过 `SetScriptObjectForBinding(nullptr, {})` 注销关联并释放保活边。
getter 恢复非空值后，必须重新登记准确身份才能读取。
真实 C++ Context 子类使用自身根元素，保留对象直至释放；
独立 JS Context 与脚本对象形成的环可以回收。
真实 C++ Event 子类通过传入的元素根跟踪所有权；
挂接根保留对象，事件释放后清理保活，脱离根与事件的 JS 环可以回收。

已知的 `Context::GenerateDragParameters` 来源在事件转换时进入既有 Element 槽。
拖拽参数仍返回原元素，活动回调期间的树销毁保护保持有效。

## 回归证据

`script-getter-once-red.log` 记录一次查询实际调用两次 getter；
修正后的聚焦场景验证非空、null 和恢复路径都只调用一次。

`external-script-variants-red.log` 的六项失败复现任意 ScriptInterface
未适配的路径，包含来源销毁后的崩溃。
`external-script-guard-origin-red.log` 进一步复现未登记共享槽的解引用崩溃。
正式路径只允许登记槽，不再对这些地址做 RTTI 解引用。

`external-script-selector-red.log` 复现显式样本读取原对象 `type` getter。
正式样本只转换已有 Element、Context 和 Event 包装器，
其余目的对象原样交由 Native 验证私有登记，不读取公开字段。

真实 Event 子类测试还发现包装函数留在匿名命名空间，扩展无法链接。
现在导出已有包装实现，保留实际 EventPtr 的原生释放链。
该链接问题不是 Context/Event 所有权根回归。

完整包测试曾在 `input.test.cjs` 的 `drag` 场景拒绝内部 raw 参数。
来源转换修正后，输入整组 13 个场景通过；未登记地址拒绝测试仍保留。

后续独立探针 `unregistered-event-parameter-red.log` 退出 139，
复现外部 Event 的参数包含已经销毁的未登记共享槽时的崩溃。
`WrapOwnedEventImpl` 在调用值转换前仍会对参数做 RTTI 解引用。
这条构造入口不在上述 31 个场景内，当时尚未验收。
后续构造、Event getter 与三个值 getter 的修复和回归记录见消费入口验收。

## 验证范围

聚焦、完整包、六个维护单元的 LLVM 18 命名、四语站点与源码指纹的最终结果
见 [机器证据](external-script-variant-evidence.json)。
站点校验 152 个本地化页面、每语种 1,596 个 API 页面、
303 个重定向和全部本地链接及资源，没有 RmlUi 类型引用警告。
无关 sfml.js 的 TypeDoc 引用警告仍保留。
外部扩展场景单独执行，不计入通用 `npm test` 的文件数和 PASS 数。
扩展复用现有 Addon 和编译数据库，仅在临时目录生成一个小型测试二进制。
执行没有创建 worktree、仓库副本或构建、测试隔离环境。

16 个稳定帧验证零 callback snapshot visits 和零 element ownership visits。
本记录不包含初始化、完整 CPU 帧、malloc、GPU 或平台 IME 的验收结论。
本地 POSIX 扩展证据不能推广为 Windows/Linux、发布包加载或稳定 ABI。

原始 3,926 条声明不改变分母。
八条 Core 值接口、九条 Supplemental 值接口、ScriptInterface getter 与两个
Lua Utilities 只补充本次来源与生命周期证据，不整体提升通用模板状态。
完整 TypeConverter 目的类型、未映射声明、Lua 后续契约、可选模块、
GPU/平台 IME、应用与视觉、编辑器、打包 CI 和整体验收继续执行。
