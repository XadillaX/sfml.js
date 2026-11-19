# RmlUi 文档与事件

RML 文档是持久存在的元素树。加载一次后，根据应用状态修改元素，每帧调用 `context.update()`。

类型化表单、提交、文本选区及下拉选项接口见[表单控件](./controls.zh-CN.md)。

内存、文件和自定义输入接口见[字节流](./streams.zh-CN.md)。

子树查询、字体测量、裁剪快照与显式布局见
[元素工具](./element-utilities.zh-CN.md)。

## 加载文档

```js
const document = context.loadDocument('/absolute/path/to/panel.rml');

document.show();
```

动态标记使用 `loadDocumentFromMemory(rml, sourceUrl)`。相对路径的样式表、图片或模板需要解析基准时，传入源 URL。两种加载方式失败时均抛出异常，成功时返回初始隐藏的文档。

省略 `sourceUrl` 时使用 `"[document from memory]"`，传入 `""` 保持为空。
加载前拒绝非字符串参数及内嵌空字节。原生解析器遇到 `<head>` 时记录
`document.sourceURL`；需要源 URL 或外链资源时应包含该元素。

`initialise(window, { fileRoot })` 让文件接口先在指定目录下查找，再尝试原始路径，`/assets/...` 也遵循此规则。它不限制文件系统访问。字体必须在加载文档前单独加载。

## 原生 XML 解析 {#xml-parser}

`BaseXMLParser` 持有上游分词器。`parseEvents(stream)` 通过一次原生入口收集
有序的 `start`、`end`、`data` 快照，无须逐词调用 JavaScript。属性及内容都是
独立副本。`XMLDataType.Text`、`CDATA`、`InnerXML` 标识数据类别。
上游将显式 `<![CDATA[...]]>` 合入普通 Text；注册的原始内容标签产生 CDATA，
指定属性捕获的内部标记产生 InnerXML。

```js
const { BaseXMLParser, StreamMemory } = require('sfml.js-rmlui');
const source = new StreamMemory(Buffer.from('<panel key="ready">text</panel>'));

source.setSourceURL('views/panel.rml');

const tokenizer = new BaseXMLParser();

tokenizer.registerCDATATag('script');
tokenizer.registerInnerXMLAttribute('capture');
const events = tokenizer.parseEvents(source);

console.log(events);
```

需要同步 JavaScript 处理时，向构造器传入可选的
`handleElementStart(parser, name, attributes)`、
`handleElementEnd(parser, name)`、`handleData(parser, data, type)`。
`parse(stream)` 按原生顺序调用，回调必须返回 `undefined`。
Base 的公共 `handleElementStart`、`handleElementEnd`、`handleData` 方法也可
在回调外调用对应虚方法。回调解析器引用在返回时失效。解析前行号为零，解析时
采用从 1 开始的源行号。`getSourceURL()` 需要活动解析；直接调用虚方法没有源 URL。

`XMLParser(root)` 保留受检查的元素或文档，通过 `parse(stream)` 在原生侧构建
DOM，不支持 `parseEvents`。它的结构开标签、闭标签虚方法受保护，拒绝直接调用。
`XMLNodeHandler` 要求提供三个同步结构回调。普通元素构建可委托原生默认处理器：

```js
const { XMLParser, XMLNodeHandler, StreamMemory } = require('sfml.js-rmlui');
const delegate = XMLNodeHandler.createDefault();

XMLParser.registerNodeHandler('panel', new XMLNodeHandler({
  elementStart(parser, name, attributes) {
    parser.pushDefaultHandler();

    return delegate.elementStart(parser, 'div', attributes);
  },
  elementEnd(parser, name) {
    return delegate.elementEnd(parser, name);
  },
  elementData(parser, data, type) {
    return delegate.elementData(parser, data, type);
  },
}));

const document = context.createDocument();
const parser = new XMLParser(document);

parser.parse(new StreamMemory(Buffer.from(
  '<body><panel id="panel">content</panel></body>')));
```

开标签回调返回当前解析子树已拥有的元素或 `null`；闭标签、数据回调返回布尔值。
Promise 会被拒绝。`getParseFrame()` 返回独立字段及受检查的元素、处理器引用。
`getDocumentHeader()` 返回被拥有的副本；在回调外准备修改，解析时调用
`setDocumentHeader(copy)` 写回。`pushHandler`、`pushDefaultHandler`、
XML `handleData` 需要活动解析器。回调可访问当前解析器及委托处理器，但不能
修改 DOM、流、注册表或运行时。

注册标签转为小写；`getNodeHandler` 精确查找并区分大小写。空注册设置默认
处理器，空查找返回 `null`。替换注册项会使已有 XMLParser 及借用处理器引用失效。
被拥有的处理器及持久 CDATA 标签可在初始化前注册，由新解析器采用。
`shutdown()` 清空注册并使全部解析器、处理器引用失效，也清理未采用的初始化前
设置。移除上下文使其所属根元素的解析器失效。未注册的回调循环引用可被回收。

## 原生文档头 {#document-header}

`DocumentHeader` 持有实际的原生 `Rml::DocumentHeader`。`source`、`title`、
`templateResources`、`rcss`、`scripts` 采用上游默认值：空字符串及空列表。
资源记录为 `{ path, content, isInline, line }`，默认值分别为 `""`、`""`、
`false`、`0`。内联路径标识内容来源；外部 RCSS 与脚本路径须已完成解析。

```js
const { DocumentHeader } = require('sfml.js-rmlui');
const header = new DocumentHeader({
  source: '/absolute/path/to/panel.rml',
  title: 'Panel',
  templateResources: [ 'base.rml' ],
  rcss: [{
    path: '/absolute/path/to/panel.rml',
    content: 'body { width: 320px; }',
    isInline: true,
    line: 4,
  }],
});

document.processHeader(header);
document.updateDocument();
document.show();
```

`processHeader` 执行原生模板加载，再按来源顺序合并资源；文档规则覆盖先前的模板
规则。它记录文档自身的来源与标题、调用脚本钩子并立即隐藏文档，不派发 `hide`
事件。文档标题为空时，不采用模板标题。没有加载到 RCSS 时保留已有样式表。
布局查询前调用 `updateDocument()`，显示时调用 `show()`。
没有所属上下文的脱离文档会保留已解析 RCSS，但不编译媒体块；将其容器赋给
上下文所属文档即可应用规则。

`header.replace(input)` 校验后通过一次原生入口替换全部字段，省略字段恢复默认值。
字段 setter 复制列表及记录，`snapshot()` 一次复制全部字段。修改输入或输出对象
不影响原生存储。路径禁止内嵌空字节，行偏移必须符合原生 int32 范围。getter
抛出异常时保留接收者已有存储；运行时重启使旧文档头及文档失效。

`mergeHeader(other)` 执行上游合并：保留已有非空来源与标题，以 `other.source`
解析模板路径，追加 RCSS 与脚本而不重写其路径。自合并使用来源快照。
`mergePaths(target, source, basePath)`、`mergeResources(target, source)`
返回独立的合并结果数组；需要保存时将结果赋给文档头字段。输入数组不会被修改。

`document.title` 调用原生 GetTitle/SetTitle，不修改 SFML 窗口标题。`hide()`
派发 `hide`、更新可见性与焦点，文档仍在查询列表中。`close()` 派发 `unload`
并安排销毁；下次 `context.update()` 实际销毁前，包装器仍可读取。

脚本记录保留来源顺序及内联行偏移。Core 基类脚本钩子为空，加载前选择
[NodeScriptHost 或 LuaScriptHost](scripts.zh-CN.md) 可执行受信任的
JavaScript 或 Lua。

## 修改元素

具体元素类支持 `new Constructor(tag, attributes = {})`。标签与原生类型相互独立；
例如 `new ElementFormControlInput('field', { value: 'ready' })` 构造真实的原生
输入框，并初始化文本类型默认值。Element 和 ElementText 使用原生池化分配器，
其他具体类型使用各自的原生分配器。JS 子类保留最近的已注册原生类型；
抽象类 ElementFormControl 不能直接构造。

```js
const { ElementFormControlInput } = require('sfml.js-rmlui');
const field = new ElementFormControlInput('input', { value: 'ready' });

document.appendChild(field);
document.removeChild(field);
field.release();
```

构造复制属性，在读取 getter 前捕获运行时代次，拒绝转换期间重启。
它不修改 Factory 注册，也不发送插件创建通知；控件内部子节点仍通过 Factory
构造。自定义 ElementInstancer 回调可返回这些自有游离元素，克隆和释放保留原分配器。

`release()` 拒绝已挂接、借用及正在调用的子树，再同步执行原生析构；
子树中全部包装器均失效。仍存活的子节点包装器会保活游离所属根，直到显式释放或
全部引用被回收；GC 通过原分配器销毁无引用子树。
构造与释放只更新受影响子树的所有权边。构造使用一次代次捕获和一次原生快照提交，
释放使用一次原生入口；这些操作属于配置阶段。

在[计数器](../../packages/sfml.js-rmlui/examples/demo.cjs)加载文档后加入：

```js
const button = document.getElementById('increment');
const counter = document.querySelector('#counter');

if (!button || !counter) {
  throw new Error('Counter elements are missing');
}

button.setClass('ready', true);
button.setAttribute('title', 'Increase the counter');
button.setProperty('width', '180dp');
```

查询无匹配元素时返回 `null`。`setProperty` 返回 RCSS 是否接受该值；`removeProperty` 移除内联覆盖。`innerRML` 解析标记并替换子元素。销毁时自动释放监听器并使全部别名失效；替换后重新查询子元素。

`getElementById` 搜索整个所属文档，包括当前元素的兄弟节点；`querySelector` 仅搜索后代。RmlUi 还支持特殊 id：`#self`、`#document`、`#parent`。

## 注册与移除监听器

```js
let clicks = 0;

function increment(event) {
  clicks++;
  counter.innerRML = `Clicks: ${clicks}`;
  console.log(event.type, event.targetId);
}

button.addEventListener('click', increment);
// Optional: stop receiving clicks while keeping the button alive.
button.removeEventListener('click', increment);
```

移除时使用相同的元素、函数、事件类型和捕获标志；捕获标志默认为 false。同一函数可用于多个注册项，完全相同的重复注册只生效一次，移除不存在的注册项没有副作用。移除、元素销毁和运行时关闭均会自动释放回调。分发期间可移除自身或其他监听器。

监听器内可同步修改类名、样式、标题、目标自身的普通属性和无关子树，包括上面的计数器。替换包含活动事件目标或原生调用接收者的子树会在修改前被拒绝。属性设置和移除保守地使用相同的子树保护，祖先元素的普通属性也受此限制。活动输入元素的 `type` 设置或移除也会被拒绝，因为它可能销毁正在执行回调的原生控件。回调期间禁止关闭运行时、卸载文档及递归更新或输入；可用 `queueMicrotask` 安排这些操作在分发后执行。监听器异常从触发它的输入或其他原生操作传播。

监听器同步执行。`RmlEvent` 保存 `type`、`id`、`phase`、`targetId`、`target`、`currentTarget`、`isInterruptible`、`parameters` 和 `unprojectedMouseScreenPosition` 的快照。目标是受检元素包装器；重复查询和事件目标保持 `===` 身份一致，无 id 或重复 id 都不影响。`id` 是 RmlUi 的事件**类型**编号，不是某次派发的序号。原生元素销毁后，包装器仍会失效。

`isPropagating`、`isImmediatePropagating`、`stopPropagation()` 和 `stopImmediatePropagation()` 仅在当前监听器回调中访问原生事件，回调返回后调用会抛出异常，已复制字段仍可读取。停止传播会执行完当前 DOM 层级的监听器，立即停止传播则跳过剩余监听器。不可中断事件不受这两个方法影响。阶段值为 `EventPhase.Capture = 1`、`Target = 2`、`Bubble = 4`。目标元素上普通监听器先于 capture 监听器执行，各组内部保持注册顺序。

参数保留布尔值、数字、字符串和 null。原生有符号和无符号 64 位整数精确转换为 BigInt；传入的 JS BigInt 必须位于 `-2^63` 至 `2^64 - 1`。向量使用 `{ x, y }`、`{ x, y, z }` 或 `{ x, y, z, w }`。颜色使用 `{ type: 'colourb' | 'colourf', red, green, blue, alpha }`；字节通道范围为 0 至 255 的整数，浮点颜色和向量使用原生 float 精度。带类型的元素值及原生 `drag_element` 参数转换为受检元素。不支持的原生所有者类型和任意指针会抛出异常，不会转成字符串。

参数 getter 可以执行 JavaScript。派发会在这些 getter 执行完毕后校验接收元素和元素引用；其中任何对象已销毁时都会抛出异常。派发返回前，元素类型的参数会受到保护，不能通过替换子树销毁。

```js
button.addEventListener('counter-update', event => {
  console.log(event.target === button, event.parameters.total);
  event.stopPropagation();
});
button.dispatchEvent('counter-update', { total: 9007199254740993n });
button.click();
```

`dispatchEvent(type, parameters?, options?)` 支持嵌套派发。省略选项时使用 RmlUi 事件定义；传入 `{ interruptible, bubbles }` 时，未指定的成员默认为 true。返回值表示是否继续传播。`click()` 调用 `Rml::Element::Click`。内外回调拥有独立事件句柄，内层执行时外层回调仍有效。首个未捕获监听器异常从最外层原生入口重新抛出，在该入口返回前跳过后续 JS 监听器。

`context.processEvent(event)` 对键盘、文本和滚轮返回传播状态。对鼠标和触摸，false 表示有元素参与交互，与传播控制无关。忽略的事件返回 true。无论返回值如何，都应处理原生窗口关闭事件。

## 直接输入

上下文支持直接输入，无需构造 SFML 事件。`KeyIdentifier` 导出上游全部 `KI_*` 名称，包括 177–250 的自定义范围；`KeyModifier` 导出七个 `KM_*` 标志，使用按位或组合。修饰键参数默认值为 0。

```js
context.processKeyDown(rmlui.KeyIdentifier.KI_A, rmlui.KeyModifier.KM_CTRL);
context.processKeyUp(rmlui.KeyIdentifier.KI_A);
context.processTextInput('水😀');
context.processTextInput(0x1f642);
context.processMouseMove(40, 80);
context.processMouseButtonDown(0);
context.processMouseButtonUp(0);
context.processMouseWheel({ x: 1, y: 0 });
context.processMouseLeave();
```

键盘、文本和滚轮方法返回是否继续传播。鼠标方法返回是否未与元素交互，`isMouseInteracting` 提供相反的状态提示。鼠标按键使用最近一次提交的位置：左键 0、右键 1、中键 2。窗口坐标使用物理像素。滚轮向量的正值向右、向下；数值参数保留已弃用的垂直滚轮重载。字符串只产生一个 `textinput` 事件，数值表示 Unicode 标量；非法标量和孤立 UTF-16 代理项会抛出异常。直接文本输入保留控制字符。

`processTouchStart`、`processTouchMove`、`processTouchEnd` 和 `processTouchCancel` 接收 `{ identifier, position: { x, y } }` 列表。标识必须是精确、非负的原生 `uintptr_t` 值，超过 `Number.MAX_SAFE_INTEGER` 时使用 `bigint`；坐标转为原生浮点数。完整列表校验后才转发，每条触点都处理，结果取逻辑与。空列表返回 true；未知标识的 move/end 返回 true，cancel 返回 false。cancel 没有修饰键参数。RmlUi 6.3 通过鼠标模拟触摸，取消操作会释放左键，可能产生点击。

SFML 键盘转发使用事件中的修饰键快照；系统键在 macOS 映射为 `KI_LMETA/KI_RMETA`，其他平台为 `KI_LWIN/KI_RWIN`。指针事件读取实时修饰键；SFML 不提供锁定键开关状态，对应标志保持为 0。直接输入可显式提供全部七个标志。SFML 触摸事件转为单条列表。`TextEntered` 将 CR 转为 LF，跳过其他控制字符。RmlUi 回调期间禁止再次输入；需要时可嵌套 `dispatchEvent`。回调异常传至最外层输入调用；保留的事件控制方法在回调结束后失效，关闭运行时也不会恢复。

## 默认构造事件 {#default-events}

运行时初始化后，`new rmlui.RmlEvent()` 创建自有原生 `Rml::Event()`。
目标与当前元素为 null，类型和参数为空，编号为 `EventId.Invalid`，
阶段为 `EventPhase.None`，鼠标屏幕坐标为 `{ x: 0, y: 0 }`，事件不可中断。
公开的 `target` 类型因此为 `Element | null`。

```js
const event = new rmlui.RmlEvent();
const listener = new rmlui.EventListener(value => {
  console.log(value.target, value.getParameter('count', 0));
});

listener.processEvent(event);
event.release();
listener.release();
```

自有事件在显式释放、GC 或关闭前保持有效。手动监听器收到独立借用句柄，
在回调返回时失效。`setCurrentElement(element)` 独立观察当前节点，
替换或清空后不再观察旧节点。引用节点销毁后，原生访问抛出异常，
`release()` 仍可执行。`isType(nameOrId)` 在释放后仍比较保留的类型或编号快照。

## 事件定义

元素和上下文监听器接受事件名称或数字 `EventId`。同一名称和编号共用监听器身份，重复注册只生效一次，两种形式都可以移除同一注册项。`context.getRootElement()` 返回唯一的根元素包装器，上下文监听器注册在该根元素上。

`registerEventType(name, interruptible, bubbles, defaultActionPhase?)` 返回原生编号。重新注册同名自定义事件会保留编号、替换标志；内置事件的标志不会被覆盖。自定义编号在运行时关闭后失效。`DefaultActionPhase.None`、`Target` 和 `TargetAndBubble` 控制监听器结束后的原生默认动作，默认值是 `None`。派发选项只覆盖中断和冒泡标志，保留已注册的默认动作阶段。停止可中断的 click 事件会阻止复选框切换。

## 上下文注册表与调度

`getContext(nameOrIndex)` 保留包装器身份，`getNumContexts()` 返回活动上下文数量。名称不存在或索引越界时返回 `null`；这与固定版本 6.3 的实际实现一致，头文件中「索引钳制」的注释不准确。索引顺序由原生注册表决定。`removeContext(name)` 在名称不存在时返回 false；成功移除及 `context.remove()` 返回 true，并使所有别名失效。`context.name` 会检查原生生命周期。

`context.dimensions` 是只有 getter 的原生共享视图，会反映 `setDimensions()` 和转发的尺寸变化事件，在 resize 监听器中也能读取新尺寸。宽高必须为非负 int32。包装器被 GC 后，底层存储仍有效；原生上下文销毁后，视图归零。

`setDensityIndependentPixelRatio(ratio)` 设置正有限手动比率，更新和缩放均保留该值。传入 `null` 恢复与绑定窗口同步。`requestNextUpdate(seconds)` 只缩短原生下一次更新的延迟，零表示立即更新。无待更新任务时，`getNextUpdateDelay()` 返回 `Infinity`。`update()` 先重置延迟，再由原生元素请求后续更新时间；这些接口不会创建 JS 定时器。

## 脱离节点与 DOM 所有权

`document.createElement(tag)`、`document.createTextNode(text)` 和 `element.clone()` 返回原生持有的脱离节点，工厂失败时返回 `null`。文本按字面处理；克隆复制原生属性、样式和内容，不复制 JS 监听器。脱离节点没有所属文档。

```js
const panel = document.createElement('div');
const label = document.createTextNode('Hello <world> & 世界');

if (panel && label) {
  panel.appendChild(label);
  document.appendChild(panel);
  const detached = document.removeChild(panel);

  document.insertBefore(detached, null);
}
```

`appendChild(child, domElement = true)` 与 `insertBefore(child, adjacent)` 转移脱离节点的所有权并返回同一包装器。已挂载节点必须先移除，不含嵌套文档的脱离子树可以转移到其他上下文。`removeChild` 返回持有所有权的脱离节点，非子节点返回 `null`。`replaceChild(child, replaced)` 返回被替换的脱离节点；参考节点为 `null` 或非子节点时追加并返回 `null`。`insertBefore` 在参考节点不存在时追加，否则继承参考节点的 DOM 或非 DOM 状态。环、插入上下文根、转移活动原生调用或事件子树均在修改前抛出异常。Debugger 拥有的文档仍受保护。

真实文档可以从上下文根移除，再插入同一活动上下文内的其他元素，原始 `basic/demo` 沙盒使用该路径。文档保留自身的 owner-document 身份和借用上下文，脱离后也一样。上下文根只接受自己的文档作为 DOM 子节点。`getNumDocuments()` 只统计根节点下的直接文档，嵌套文档须单独调用 `updateDocument()`。`close()` 和 `unload()` 只将根文档加入待销毁队列；嵌套或脱离文档存活至所属树被销毁。关闭外层文档会销毁其嵌套树；移除上下文时，先销毁包含其文档的独立拥有树，再释放上下文。

在 `dragdrop` 回调中，经过类型检查的 `drag_element` 参数允许同步移除和插入，保留上游物品栏的转移算法。绑定会保活节点的原生所有权和监听器，直到最外层原生调用结束。其祖先、普通参数别名、事件目标和活动方法接收者仍受保护。原生节点脱离时会取消拖拽，上游不会在移除后发送 `dragend`。

`getNumChildren()` 统计 DOM 子节点，传入 `true` 时包含内部节点。`getChild(index)` 可访问两类节点，越界返回 `null`。首尾子节点、兄弟节点和 `hasChildNodes()` 遵循 DOM 成员规则。`querySelectorAll`、`getElementsByTagName` 和 `getElementsByClassName` 返回实时包装器的快照数组。`contains` 包含自身，`closest` 仅搜索祖先、不含自身，与固定版本的原生实现一致。

保留后代节点会保活脱离的原生树。不可达的脱离树可以回收，包括监听器捕获包装器形成的引用环。插入后由原生父节点拥有子树；监听器在脱离和重新插入后保留。销毁会使所有借用别名失效。

原生控件内部子节点可以读取，但不能移除或替换，因为控件持有这些节点的原始指针。通过 JS 所有权接口添加的非 DOM 节点仍可转移，包装器回收后重新获取也不受影响。

## 文档层级、焦点与布局

`context.createDocument(instancerName = 'body')` 创建空文档，工厂失败时返回 `null`。
`getDocument(idOrIndex)` 返回唯一文档包装器或 `null`；索引按文档栈顺序排列。
`getNumDocuments()` 不包含待销毁文档。`setDocumentsBaseTag(tag)` 与
`getDocumentsBaseTag()` 控制后续文档的根标签，初始为 `body`，不改变实例工厂名称。

`context.unloadDocument(document)` 和 `unloadAllDocuments()` 同步派发 unload，
随后从查询列表移除文档，在 `context.update()` 时销毁。销毁前重复卸载无操作。
`document.getContext()` 返回唯一所属上下文，工厂创建的脱离文档返回 `null`。
实际销毁后所有句柄拒绝访问。

```js
const { ModalFlag, FocusFlag, ScrollFlag, ScrollBehavior } = require('sfml.js-rmlui');

document.show(ModalFlag.Modal, FocusFlag.Auto, ScrollFlag.None);
document.show(ModalFlag.Keep, FocusFlag.Keep, ScrollFlag.Auto);
context.setDefaultScrollBehavior(ScrollBehavior.Instant, 1);
```

`show()` 默认使用 `None / Auto / Auto`。第一个参数兼容 `false / true`，
分别表示 `None / Modal`。`ModalFlag.Keep` 保留模态状态。
`FocusFlag.None` 不请求焦点，`Document` 聚焦文档，`Keep` 恢复上次焦点，
`Auto` 选择首个可 Tab 导航的 `autofocus` 元素，没有时聚焦文档。
`ScrollFlag.None` 禁止因聚焦而滚动，`Auto` 将刚获得焦点的子元素滚动到可见区域。
`isModal()` 仅在模态标志已设置且文档可见时返回 true。隐藏后返回 false，
内部标志仍保留；再次使用 `ModalFlag.Keep` 显示时恢复模态状态。

`findNextTabElement(current, forward, wrapAround = true)` 仅查找，不改变焦点；
起始元素必须属于该文档。`context.getFocusElement()` 和 `getHoverElement()`
返回实时包装器或 `null`。`unfocusDocument(document)` 移除焦点历史并请求恢复
前一个焦点；仍处于模态状态的文档可能拒绝这个请求。

文档的 `pullToFront()` / `pushToBack()`，以及上下文的
`pullDocumentToFront(document)` / `pushDocumentToBack(document)` 调整文档栈顺序。
上下文的文档操作拒绝其他上下文的文档。

修改后应先调用 `context.update()` 再处理输入或渲染。`document.updateDocument()`
更新本文档的样式与布局，便于查询几何信息，不清理上下文待销毁文档。
`getElementAtPoint(point, ignoreElement = null, element = null)` 按物理像素坐标查询
当前布局，包含变换、裁剪及模态焦点规则，可忽略子树或指定搜索根节点。
元素参数必须属于本上下文；上下文根节点虽无所属文档，也可使用。
坐标转为 float 后必须在 int32 范围内。
变换矩阵在 `render()` 时刷新，修改变换后须先渲染再做相应命中测试。
RmlUi 6.3 将逆变换坐标与祖先裁剪矩形比较，平移后的裁剪命中边界可能与视觉边界不同；
绑定保留这一原生行为。
`setDefaultScrollBehavior(behavior, speedFactor = 1)` 要求速度为正有限 float，
默认行为设为 `Auto` 时采用平滑滚动。

## 事件参数类型转换

`event.getParameter(name, defaultValue)` 按 RmlUi 的 `GetParameter<T>` 规则读取
实时原生参数，仅在本次监听器回调仍活跃时可用；嵌套派发不会使外层回调失效。
回调结束后使用 `event.parameters` 保留的原始值；修改这个 JS 快照不会改变原生参数。

```js
element.addEventListener('change', event => {
  const value = event.getParameter('value', 0);
  const text = event.getParameter('value', '');

  console.log(value, text, event.isType('change'));
});
```

非空默认值决定结果类型：number 使用 double，BigInt 使用 int64，默认值超过
INT64_MAX 时使用 uint64；向量和颜色返回副本。参数缺失时返回默认值。
原生转换与 JavaScript 不同：非数字字符串遇到 number 默认值会得到 0，
遇到 BigInt 默认值则保留默认值。不安全的数值或字符串整数溢出会抛出异常。
自有变换、动画、过渡、装饰及效果默认值使用相应原生类型适配器；
拒绝通用指针到数值或字符串的转换。

`event.getElementParameter(name, defaultValue = null)` 是带检查的元素指针等价接口。
参数缺失或无法转换时返回有效备用元素，否则返回身份唯一的原生元素包装器。
支持原生 ScriptInterface 元素值及上游 `drag_element` 指针契约，拒绝任意指针。
每次检查原生事件及其自有引用；借用事件在回调返回后失效。返回的元素保留自身
正常生命周期，节点销毁后失效。原始元素快照仍可通过 `parameters` 读取；
持久属性不接受借用元素指针。

`event.isType(nameOrId)` 根据保留的类型名或编号快照实现两个原生相等运算，
回调结束后仍可使用。

## 文本字节与鼠标光标

`context.processTextInput(text)` 接收 Unicode 字符串或标量数值。
`context.processTextInputChar(byte)` 调用原生 `char` 重载：整数
字节 0–127 派发 ASCII，保留控制字符；128–255 返回 `false`，不派发事件。
两者都返回事件是否仍在传播。

`context.enableMouseCursor(enabled)` 要求布尔值。启用后在下一次鼠标更新时
刷新原生光标；禁用后 RmlUi 停止修改系统光标，不会隐藏光标。
上下文移除后，这两个操作都会抛出异常。

## 原生对象生命周期

| 操作 | 效果 |
| --- | --- |
| `document.hide()` | 隐藏文档，文档和包装器仍有效。 |
| `document.close()`／`unload()` | 同步分发 `unload`，在 `context.update()` 时销毁；实际销毁前包装器仍可读取。 |
| `context.remove()` | 销毁上下文及全部文档。 |
| `shutdown()` | 所有上下文、文档和元素包装器失效。 |

包装器共享原生有效性。JS 引用会保活持有所有权的脱离树，但无法阻止原生父节点或上下文销毁已挂载元素；访问已销毁对象会抛出异常。重建同名上下文或重新初始化运行时不会恢复旧包装器。上下文移除后，保留的尺寸视图归零。

进程级运行时归初始化它的 Node.js 环境和线程所有。Worker 可导入扩展并查询版本，跨环境访问运行时会抛出异常。所有者环境退出时自动释放原生资源，不调用 JS 监听器。关闭渲染窗口前关闭 RmlUi。
