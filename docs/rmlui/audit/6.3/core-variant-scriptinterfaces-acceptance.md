# ScriptInterface Variant 生命周期验收

> Element、Context 和 RmlEvent 已接入相同的原生指针存储。
> 十三个生命周期场景、完整包及四语文档检查通过。
> 外部 C++ ScriptObject 与 void* 登记路径见新增验收记录。
> 任意 Native 接口的登记与失效路径见后续专项记录。
> 完整模板验收继续执行。

## 原生存储与转换

`Variant`、`Property`、元素属性和事件参数接受原生脚本对象。
`{ type: 'scriptinterface', value: target }` 选择实际
`Rml::Variant::GetInto<ScriptInterface*>`，`target` 可以是有效的
Element、Context、RmlEvent 或带类型的空指针。
转换成功的空指针返回 null；转换失败保留调用方默认值。
Property 和样式查询使用原生 `T{}`，指针初始值为 null。

```js
const value = new Variant(context);
const destination = { type: 'scriptinterface', value: null };

console.log(value.getInto(destination)); // { success: true, value: context }
context.remove();
console.log(value.getInto(destination)); // { success: true, value: null }
```

原始 `value` 和精确 `getReference(VariantType.SCRIPTINTERFACE)` 返回原包装器。
标量目标保留上游未定义转换的失败结果；字符串目标仍拒绝原生指针。
RML 序列化不会输出受保护的指针地址。
数据模型继续拒绝指针值，指针样本没有混入 `DataVariantValue`。

Context 和 Event 继承 ScriptInterface，但没有声明独立的 RmlUi RTTI 标识。
绑定使用原生句柄和共享槽的登记身份识别它们。
没有通过继承的同一个类型标识推断对象实际类型，也没有将 Event* 强转为 Context*。
Element 保留既有的原生 RTTI 路径。

## 生命周期与 GC

复制和移动后的指针 Variant 共享同一个失效槽。
槽只记录指针和弱状态，原生资源仍由 Context、Event 或 Element 的原拥有者管理。
Context 的根销毁观察和移除路径置空槽；事件回调结束、显式释放、Factory 转移、
关闭及 EventState 析构均置空对应槽。
事件槽按共享槽地址登记，保留每个回调借用的独立身份与失效时间。

可达 Variant、Property 和字典通过私有 JS 边保活目标句柄。
原生已登记 Context 的文档属于 Native 根。
独立 Context 的文档快照归到其可回收的 JS 句柄，避免文档保存自身 Context 指针
形成全局保活环。Context 指针本身不会增加原生所有权。
移除 Context 时只登记待清理的弱状态；返回外层 Native 边界后清除私有指针边。
保留已失效包装器不会继续保活文档里的目标，原生析构和 GC 回调不分配 V8 对象。

注册表只保存弱状态，并在槽销毁时直接删除索引。
稳定帧只检查资源、拓扑与拥有者版本；没有新变化时不扫描全部拥有者。
数值 Variant 的大小、共享元数据和热路径保持原实现。
发生指针或文档变化时仍可能构建拥有者快照；本记录没有完整帧耗时或 GPU 耗时结论。

## 验证证据

最初九个场景均在缺失适配的实现上失败，接入后九个场景通过。
它们覆盖 Context 移除、原生副本、成功空指针和失败默认值、事件释放、
嵌套回调到期、事件参数、GC 引用环、访问器失效和稳定帧扫描。
16 帧稳定测试记录零 callback snapshot visits 和零 element ownership visits。

补测独立 Context 的文档自引用时，实际 WeakRef 仍可读取 Context，确认全局根分类泄漏。
该回归和独立 Context 保活、Factory 事件转移、保留已移除 Context 的私有边清理
共同组成最终十三个通过场景。已移除包装器保活事件的回归同样取得了实际失败证据。
最终聚焦日志为 `variant-scriptinterfaces-green-6.log`；Native 构建、lint 和消费端类型检查通过。
四语站点的 81 项检查通过，构建校验 152 个本地化页面、
每语种 1,591 个 API 页面、303 个重定向及全部本地链接和资源。
五类已有的源类型可见性警告仍待源级修正。
完整包 `variant-scriptinterfaces-package-4.log` 退出 0：
106 个测试文件，1,053 条 PASS，零条 FAIL，
包含 lint、cpplint、Native 与 TypeScript 构建、消费端类型和全部运行时测试。
文档、编译器命名和最终源码指纹由
`/tmp/rmlui-63-completion/record-variant-scriptinterfaces.py` 核验并写入原台账。
本节验收通过不代表整个 RmlUi 6.3 范围验收通过。

完整包 `variant-scriptinterfaces-package-3.log` 实际退出 1：
运行到 51 个测试文件，记录 493 条 PASS 和 1 条 FAIL。
失败场景为 `events.test.cjs` 的 `parameter-validation`。
模板默认值入口曾接受未带类型标签的原生对象，与公开 `VariantDefault` 类型不一致。
入口现在要求指针使用显式样本；直接传入 Element、Context、Event 或 Variant 会抛出异常。
实际修正后的 Native 构建、事件整组和十三个指针场景退出 0，
日志分别为 `variant-scriptinterfaces-default-build.log`、
`variant-scriptinterfaces-default-green.log` 和 `variant-scriptinterfaces-green-5.log`。
该回归最终包含在完整包第四次运行中。

源码审查由同一个控制器进行，不能称为独立审查。
代码按校验、读取、生命周期修改和输出分组，逻辑段之间保留空行。
执行使用现有目录，没有创建 worktree 或构建、测试隔离环境。

## 保留的范围

Core 的原 549 条声明和 Supplemental 的原 1,547 条声明不改分母。
八条 Core 值模板、Event 类型和 Property/Variant 模板行只补充已验证证据；
没有因三个已登记脚本对象的支持而整体提升通用模板状态。
管理对象的 VOIDPTR 存储与目的类型见 [不透明对象验收](core-variant-opaque-acceptance.md)。
[外部 Native 对象适配验收](external-native-adapter-acceptance.md) 补充了实际
C++ ScriptObject 覆盖和 void* 分配的登记路径。
[外部 ScriptInterface Variant 验收](external-script-variant-acceptance.md)
补充任意 Native 接口的共享槽与来源检查。完整 TypeConverter 目的类型矩阵、
三个迭代器构造与移动契约、Lua 后续项、可选模块、GPU 与平台 IME、
应用、视觉测试、编辑器和打包 CI、独立整体验收继续执行。
