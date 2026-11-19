# 文档脚本

`NodeScriptHost` 为 `Context` 加载的文档选择 JavaScript 执行宿主。
在 `initialise` 后创建宿主，加载文档前调用 `setScriptHost`。
Context 切换或禁用宿主后，已有文档仍保留自己的宿主。

```js
const { NodeScriptHost } = require('sfml.js-rmlui');
const host = new NodeScriptHost({
  handlers: {
    save(event, document, context) {
      document.title = context.name;
      event.stopPropagation();
    },
  },
});

context.setScriptHost(host);
const document = context.loadDocumentFromMemory(`
<rml><head/><body>
  <button id="save" onclick="save">Save</button>
</body></rml>`, 'forms/panel.rml');

document.getElementById('save').click();
```

命名处理器只捕获一次，修改原始 options 对象不会替换回调。
未启用内联表达式时，未知处理器名称会使文档加载失败。

## 受信任的来源

两个来源选项均默认为 false。`allowInline: true` 启用 `<script>` 内容和
`on*` JavaScript 表达式；`allowExternal: true` 启用 `<script src="...">`。
外部脚本通过当前 RmlUi `FileInterface` 读取，支持自定义文件根目录。
禁用外部执行时不读取文件。Node VM 上下文不是安全边界，只能启用受信任来源。

每个文档使用独立的 VM 上下文。`globals` 捕获附加值，`document`、`context`、
`event`、`element` 是保留名称。前两个值是校验生命周期的 RmlUi 包装器。
执行 `on*` 时，`event` 是活跃事件，`element` 是当前目标。嵌套事件返回后
恢复外层值。

RmlUi 在 `</head>` 处按头部资源顺序执行脚本，此时正文尚未解析。
需要查询正文元素时，应在后续事件中执行。内联堆栈保留 RML 来源 URL 和
原始行偏移，外部堆栈使用解析后的文件路径及源码行号。

## 异常与生命周期

脚本异常原样传回发起操作的 API，加载失败的文档不会挂入 Context。
脚本及处理器必须同步返回；Promise 结果会被拒绝，其拒绝状态会被消费。

`document.loadInlineScript(content, sourcePath, sourceLine = 1)` 和
`document.loadExternalScript(sourcePath)` 调用原生虚方法。
常规文档保留上游的空实现。`context.setScriptHost(null)` 使后续加载使用
常规文档，全局 body 和事件监听器实例器继续保留。

Native 文档销毁时释放 VM 状态，即使过期的 Document 包装器仍可达。
保留的 document/context 包装器会校验原生生命周期；活跃事件操作在派发后失效。
回调期间禁止破坏性运行时重入。Factory 创建的脚本监听器使用常规的
`EventListener` 包装器，原始脚本文档失效后拒绝派发。

## 原生脚本对象

`Context`、`Element` 和 `RmlEvent` 实现 `ScriptInterface`。
`setScriptObject(object)` 在实际原生实例上注册宿主对象，
`getScriptObject()` 调用原生虚方法并返回同一对象。传 null 移除关联。
未注册实例和克隆元素返回 null。

```js
const state = { count: 0 };

element.setScriptObject(state);

if (element.getScriptObject() === state) {
  state.count++;
}

element.setScriptObject(null);
```

挂接的原生树保留脚本对象；脱离元素通过 JS 所有者保活，因此对象反向引用
Element 形成的环仍可被回收。重新挂接保留关联。原生销毁及 shutdown 释放关联，
重新初始化不会恢复旧包装器。无变更帧中的调用不扫描脚本对象注册记录。

连续监听器读取同一原生事件上的关联，每个借用事件包装器仍在自身回调后过期。
自有事件通过 JS handle 保活对象，并允许环被回收；Factory 转交后提升为原生根，
直到 Native 释放事件。注册对象不会改变原生 RTTI。外部原生 `GetScriptObject`
覆盖实现需要自己的已注册适配器，不能通过此 API 覆盖。

Native 扩展通过 `native/scripting/rmlui-script-object.h` 中的
`sfmlrmlui::RegisterNativeScriptObject` 登记覆盖方法实际返回的指针与 JS 所有者。
即使多个接口返回相同指针，每个接口仍保留独立关联；登记后原生覆盖仍保持权威。
`native/values/rmlui-variant-objects.h` 中的 `RegisterNativeObjectVariant` 单独登记
实际的 `void*` 分配。原生所有者在释放分配前使共享槽失效，Variant 和 Lua
副本随后返回 null。值副本沿用现有原生值所有者的 JS 保活边。
这些入口仅供 C++ 扩展使用，不向 JS 暴露地址或增加注册调用。

任意 Native `ScriptInterface` 的 Variant 来源使用
`native/values/rmlui-variant-pointers.h` 中的 `RegisterNativeScriptVariant`。
扩展同时持有真实接口与登记对象，在销毁接口前使登记失效。
JS 输出是登记时的原对象，类型为 `VariantScriptObject`；
`{ type: 'scriptinterface', value: object }` 选择指针目的类型。
复制、移动、DOM 和 Lua 副本共享同一失效槽，不延长 Native 接口的生命周期。
未登记的指针或共享槽在解引用前被拒绝。
这项登记与 `GetScriptObject` 的关联独立；后者每次查询只调用一次虚方法。
Native 可通过 `SetScriptObjectForBinding(nullptr, {})` 注销关联并释放其保活边。

已注册 Context 在移除前保活脚本对象；独立自有 Context 通过 JS 根边保活，
对象与 Context 形成的环可回收。Context 继承真实的原生基类标识。
`release()` 只释放独立自有实例，已注册 Context 使用 `remove()`。

## Lua 脚本

`LuaScriptHost` 持有真实的 Lua 5.4.8 VM。在 `initialise` 后创建，通过
`context.setScriptHost` 选择。同一 Lua 宿主的文档共享全局值，不同宿主使用
独立 VM。切换 Context 的宿主不会改变已有文档的解释器。

```js
const { LuaScriptHost } = require('sfml.js-rmlui');
const lua = new LuaScriptHost({ allowInline: true });

lua.execute(`
function save(event, element, document)
  document.title = element.id
  event:StopPropagation()
end
function sum(a, b) return a + b end
`, 'handlers.lua');
context.setScriptHost(lua);
const document = context.loadDocumentFromMemory(`
<rml><head/><body>
  <button id="save" onclick="save">Save</button>
</body></rml>`, 'forms/lua-panel.rml');

document.getElementById('save').click();
lua.call('sum', 1n, 2n); // 3n
```

两个来源选项均默认为 false。命名 Lua 函数可直接作为处理器，不需要启用源码
执行。`allowInline` 启用头部脚本和内联处理器，`allowExternal` 启用外部脚本。
Lua 使用当前 RmlUi 文件接口，并保留来源路径及行偏移。

`execute(source, path = '', line = 1)`、`call(name, ...args)`、
`getGlobal(name)`、`setGlobal(name, value)` 交换标量：null、boolean、
有限 number、string 和有符号 64 位 bigint。Lua 整数结果返回 bigint，
字符串中的空字节会完整保留。表、函数和原生指针不属于标量桥接值。

在 Native/Lua 内部，`document:GetAttribute(name)`、属性遍历及事件参数使用
RmlUi Variant。`Vector2f`、`Colourb`、`Colourf` userdata 可以作为原生值传回。
经过检查的 Element、Context 和 Event userdata 转为受保护的 ScriptInterface
指针，副本共享原始销毁或派发结束时的失效状态，不暴露原生地址。

已注册的不透明指针、Vector3/4 及聚合 Variant 存储使用 Lua 自有 userdata。
通过事件复制时保留原生值和指针身份。byte、char 读取实际存储；
超过 Lua 有符号整数上限的无符号 64 位值使用自有 userdata，避免溢出为负数。
外部不透明 userdata 会被拒绝。Node 标量方法仍只交换标量。

Lua 副本存活至 Lua GC 或 VM 关闭。文档、监听器、模型、实例器注册、
生成的元素和捕获的 Lua 函数通过实际所有者保活 VM 中的指针值。
独立 Context 以及宿主与对象的循环引用仍可回收。关闭和显式元素销毁会清除
旧指针保活边，即使失效外观对象仍被保留；无变更帧不扫描这些所有者。

`compile(source, path = '', line = 1)` 返回 `LuaFunction`，不会执行源码。
`getFunction(name)` 捕获当前命名函数；之后替换该全局函数不会改变已捕获的引用。

```javascript
const chunk = lua.compile('local a, b = ...; return a + b, "ready"');
const results = chunk.callResults(2, 9007199254740993n, 2n);

// [9007199254740995n, "ready"]
chunk.release();
```

`LuaFunction.call(...args)` 复制第一个标量结果。
`callResults(resultCount = 0, ...args)` 执行一次，复制指定数量的结果，
不足部分补 null，多余结果丢弃。调用和错误处理后均恢复外层 Lua 栈。
从 Node 调用时保留正在执行的外层 Lua 事件及文档全局值；Node 事件不会选择
新的 Lua 作用域。Native 引用在宿主被 GC 后继续保活 VM。
`release()` 解除引用及 VM 保活，再次调用或释放会拒绝；shutdown 使所有函数
失效。`executeFile(path)` 通过当前 RmlUi FileInterface 显式读取并执行文件，
不受文档 `allowExternal` 限制，错误信息保留文件路径。

DOM 监听器和数据事件直接在 Native/Lua 执行。嵌套派发后恢复外层
`document`、`context`、`event`、`element` 全局值。保留的事件以及已销毁 DOM 的
代理会拒绝访问。Lua 提供标准库，来源策略用于受信任脚本。
协程共享宿主的注册表和全局值，分别保留独立调用栈；可以创建监听器、模型及实例器，
执行 yield 后继续 resume。同一个数据事件回调的递归调用会被拒绝。

在文档脚本中，`context:OpenDataModel(name, table)` 返回托管模型。
同一宿主重复打开已有模型会返回原包装器。名称归属于 Context，多个 Context
可以分别使用同名模型。嵌套表写入会标记所属根变量，整体替换表或数组后，
已有原生数据地址会读取新值。Lua 数组从 1 开始，RML 数据表达式从 0 开始。
通过 Lua、Node 或 Context 销毁移除模型后，所有保留的模型及表代理失效。
Native 模型在宿主被 GC 后继续保活 VM，原生控制器和视图销毁后才释放变量定义。

`ElementInstancer.new(function(tag) ... end)` 创建托管 Lua 分配器。
在回调外通过 `rmlui:RegisterTag(tag, instancer)` 注册。返回未挂入父节点的
自有 `Element.new(tag)`、自有 `ElementPtr` 或 nil。注册记录、生成的元素及
Node Factory 包装器分别保活分配器和 VM。替换 tag 后，旧元素继续使用自己的
释放链路及原始分配器。`rmlui:CreateContext` 创建的 Context 继承当前 Lua 宿主。

`shutdown` 在 DOM 和模型销毁后关闭所有原生 Lua VM。VM finalizer 不能创建
Context，也不能重入已销毁的 RmlUi 对象。

## Native Lua 类型扩展

Native 扩展通过 `Rml::Lua::LuaType<T>` 在托管 VM 中注册方法、getter 和 setter
描述表。`ExtraInit<T>` 可以注册构造函数，先继承 Element 描述表，再由自定义表
覆盖同名成员。原生 Element 子类必须定义 RmlUi RTTI；Element 的 `As` 表按 RTTI
检查转换，不兼容的子类返回 nil。

`push(..., true)` 将分配对象的所有权交给 Lua GC。借用的 Element、Context 和
Event 沿用原生失效检查。借用的自定义值由扩展所有者管理，Lua 使用期间必须保活
原生分配对象。方法在 GC 期间保活接收者，错误退出后恢复原有引用。
nil 方法接收者返回 nil。未知属性赋值沿用上游忽略赋值的行为。
`Element:SetAttribute` 将输入转换为字符串。

Native `PushIndex` 和 `GetIndex` 在从 0 开始的 `int` 与从 1 开始的 Lua 整数之间
转换。原生范围 `[-2147483648, 2147483647]` 对应
`[-2147483647, 2147483648]`；Lua 的 0 返回原生 `-1` 哨兵。
越界 Lua 输入在缩窄之前报错。原生集成使用经过检查的托管宿主，
任意外部 VM 指针没有 JS 入口。
