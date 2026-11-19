# 表单控件

所有返回元素的入口都依据原生运行时类型创建包装器。查询、遍历、创建、复制和
事件目标保持包装器身份一致。`ElementFormControlInput`、
`ElementFormControlTextArea`、`ElementFormControlSelect` 继承
`ElementFormControl`，`ElementForm` 继承 `Element`。标签名不决定包装器类型。

```js
const { ElementFormControlInput } = require('sfml.js-rmlui');

const input = document.querySelector('input');

if (input instanceof ElementFormControlInput) {
  input.setName('message');
  input.setValue('A🌙中');
  input.setDisabled(false);

  input.focus();
  input.setSelectionRange(1, 3);

  console.log(input.getSelection()); // { start: 1, end: 3, text: '🌙中' }
}
```

通过 `getName` / `setName`、`getValue` / `setValue`、
`isDisabled` / `setDisabled` 及 `isSubmitted` 访问原生控件行为。
`setDisabled(false)` 会移除属性。`isSubmitted()` 按控件类型判断是否参与提交，
禁用状态另行判断。

`form.submit(name = '', value = '')` 派发原生 `submit` 事件。
提交者名称为空时使用 `submit` 键。禁用、未命名、不参与提交的控件会被忽略；
同名值以 `, ` 连接。此操作不发起 HTTP 请求。

## 以原生属性保存值的控件

`ElementFormControl.createInstancer(valueAttribute = 'value')` 为此抽象基类
创建不含 JS 回调的自有原生分配器。`GetValue` 将指定属性读取为原生字符串，
缺省为空；`SetValue` 写入同一属性。名称、禁用、焦点和缺省
`IsSubmitted = true` 使用真实原生基类。修改禁用状态后，先更新上下文，
再读取依赖计算样式的焦点行为。

```js
const { ElementFormControl, Factory } = require('sfml.js-rmlui');

const allocator = ElementFormControl.createInstancer('payload');

Factory.registerElementInstancer('value-field', allocator);

const field = Factory.instanceElement(null, 'value-field', 'input', {
  name: 'answer', payload: 'Native value',
});

if (!(field instanceof ElementFormControl)) {
  throw new Error('Expected a native form control');
}

field.setValue('Updated');
console.log(field.getAttribute('payload')); // Updated

allocator.releaseElement(field);
```

原生 `data-attr-payload` 绑定可通过共享数据更新同一值，不逐控件回调 JS。
JS 子类方法不会重写原生虚方法；直接 `new ElementFormControl(tag)` 仍被拒绝。
Factory 应用分配属性，直接 `allocator.instanceElement` 不应用。
直接克隆控件在注册替换后仍保留原分配器及属性名，复制释放观察者而不重放
JS 分配回调。祖先克隆按当前 Factory 注册重新解析后代。
分配器和元素在关闭时失效。

原生 `Form::Submit` 仅选择 `input`、`textarea`、`select` 标签。应将分配器
注册到这些标签之一，或在 Factory 调用中使用它们作为实际标签；任意自定义标签
不会被选入提交。显式释放已挂接控件前，必须先将其移出父节点。

## 输入框与文本域

`select()`、`setSelectionRange(start, end)` 和 `getSelection()` 使用 Unicode
码点索引，不是 JavaScript UTF-16 索引或 UTF-8 字节偏移。修改选区需要焦点。
正常输入前应调用 `context.update()`；
`element.focus(focusVisible = false)` 返回原生请求是否成功。
`element.blur()` 释放焦点。非 text/password 输入类型忽略文本选择，
返回 `{ start: 0, end: 0, text: '' }`。

密码输入框的选区 `text` 返回 `*` 掩码，索引仍按原始 Unicode 码点计数。
`getValue()` 和表单提交保留实际值。全选密码 `密🌙` 时返回
`{ start: 0, end: 2, text: '**' }`。

`setCompositionRange(start, end)` 设置原生 IME 组合反馈；结束位置不大于
起始位置时清除反馈。此调用不修改或提交文本，也不代表已经支持平台输入法。

文本域还提供 `setNumColumns` / `getNumColumns`（默认 20）、
`setNumRows` / `getNumRows`（默认 2）、`setMaxLength` / `getMaxLength`
（默认 -1，无限制）及 `setWordWrap` / `getWordWrap`（默认 true）。
行列设置的最小值为 1。修改最大长度会按码点截短已有文本；
原生 `setValue` 随后仍可超出上限，用户编辑受上限限制。

`element.getIntrinsicDimensions()` 返回原生虚方法的
`{ valid, dimensions: { x, y }, ratio }`。未赋值的输出初始为零，
输入框和文本域的原生重载也由此访问。依赖字体的结果需要已加载的字体和最新布局。

## 原生文本输入生命周期

`new TextInputHandler()` 在 Native 记录生命周期通知，不逐控件回调 JS。
可通过 `createContext(name, width, height, renderer, handler)` 的第五个参数
设置上下文处理器，或使用 `setTextInputHandler(handler)` 设置全局处理器。
已有上下文保留原选择；全局选择保活至 shutdown。

```js
const { TextInputHandler, createContext } = require('sfml.js-rmlui');
const handler = new TextInputHandler();
const context = createContext('editor', 800, 600, null, handler);

// 加载并显示文档、更新布局，然后聚焦文本输入。
const events = handler.drainEvents();

for (let i = 0; i < events.kinds.length; ++i) {
  const input = events.contexts[i];

  if (events.kinds[i] === 0 && input?.isValid) {
    input.setCursorPosition(0);
  }
}
```

`drainEvents()` 只进入 Addon 一次。原生持有的 `Uint32Array` 快照分别用
0、1、2 表示激活、失活、销毁；`contexts` 是对应的唯一
`TextInputContext`。应定期排空历史通知；数值快照在处理器释放和 shutdown 后仍有效。

`TextInputContext` 提供 `getBoundingBox()`（投影失败返回 null）、
`getSelectionRange()`、`setSelectionRange()`、`setCursorPosition()`、
`setText()`、`setCompositionRange()` 和 `commitComposition()`。
编辑在 Native 执行。偏移是非负 int32 Unicode 码点，结束位置不包含在内，
范围必须有序。`setText()` 忽略 maxlength；`commitComposition()` 根据
替换范围之外的剩余文本应用长度限制。固定版本源码修正了上游合成长度公式。
空合成范围不替换文本。

显式 `onActivate`、`onDeactivate` 构造回调同步执行，仅可重入受检
`TextInputContext` 方法。`onDestroy` 在句柄失效后的安全原生边界执行，
不从析构或 V8 finalizer 调用，不能再读取或编辑已销毁控件。
失焦保留句柄；控件销毁、输入类型变化及 shutdown 使其失效。
shutdown 后仍可读取 `isValid`。这些接口不安装或验证平台输入法和候选窗口。

可以在初始化前创建并设置全局处理器。待初始化处理器属于下一次成功初始化；
初始化被拒绝时保留该选择。即使未初始化，shutdown 仍使其失效；
Node 环境清理会释放它们，不调用 JS。创建处理器会占用当前环境的配置所有权，
其他 worker 不能访问这些设置。初始化前选择 null，会在初始化时使用原生默认处理器；
初始化后选择 null，会对新上下文禁用全局处理器。

## 下拉选项

`setSelection(index)` 选择选项；固定的 6.3 实现会在索引越界时清除选择。
`getSelection()` 返回索引或 -1。`getOption(index)` 返回唯一选项包装器或 null，
`getNumOptions()` 返回数量。后两个方法会处理待迁移子节点，可能销毁非 option
节点，因此原生事件回调期间禁止调用。

`add(rml, value, before = -1, selectable = true)` 添加选项内容。
`add(element, before = -1)` 转移持有所有权的脱离 `option` 节点；
移动已附着的节点前先调用 `removeChild`。转移保留包装器身份，插入索引越界时追加。
所有权错误、文档插入及循环引用会在消耗所有权前被拒绝。

`remove(index)` 销毁对应选项，越界时无操作；`removeAll()` 销毁全部选项，
保留的包装器随后拒绝访问。`showSelectBox()` 打开选择框，
`hideSelectBox()` 关闭并保留当前值，`cancelSelectBox()` 恢复打开时的值并关闭。
`isSelectBoxVisible()` 返回原生选择框状态。

新增的控件修改接口拒绝回调重入，纯值及选区读取仍可使用。监听器异常在原生
操作返回后传播。销毁和关闭运行时使所有别名失效，详见[文档生命周期](./documents.zh-CN.md)。

非表单元素请参阅[文本、进度条与标签页](./text-panels.zh-CN.md)。
