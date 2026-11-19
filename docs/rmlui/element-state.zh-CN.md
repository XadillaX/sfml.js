# 元素类名、属性与焦点

## 原生样式组件

`getStyle()` 返回身份固定、元素持有的
[`ElementStyle`](/reference/rmlui/classes/ElementStyle.html)。类与伪类 setter
直接修改组件，变化后显式调用 `updateDefinition()`。`setClass` 返回类成员
是否变化。`setPseudoClass(name, activate, overrideClass = false)` 返回激活
成员是否变化；普通、覆盖和组合位分别为 1、2、3。清除普通激活不会清除覆盖位。
`getClassNameList()` 与 `getActivePseudoClasses()` 复制原生状态。

`setProperty(id, property)`、`setCustomProperty('--name', property)` 和
`setVarShorthand(id, property)` 复制类型化原生属性，并标记相应编号或名称为脏。
简写要求全局已注册编号与 VAR_EXPRESSION 字符串。
`removeProperty`、`removeCustomProperty`、`removeVarShorthand` 移除内联覆盖。
`getLocalStyleProperties()` 复制完整内联字典，包含自定义属性和简写映射。

`getProperty` 与 `getCustomProperty` 解析层叠、继承和变量。
`getLocalProperty`、`getLocalCustomProperty`、`getLocalShorthand` 复制未替换的
局部值；`getLocalPropertyWithResolvedVariables` 解析局部指定值。
`getSpecifiedProperty`、`getSpecifiedCustomProperty`、`getSpecifiedShorthand`
保留变量替换前的层叠结果。全部返回独立原生快照或 null。
`iterate()` 复制去重的普通数值编号；`iterateAll(filter = null)` 包含自定义
属性与简写，跳过简写占位符，并保留上游层叠过滤规则。

`resolveNumericValue(value, base)` 与 `resolveRelativeLength(value,
RelativeTarget)` 使用原生运算，数值必须有限且使用单一单位。
`dirtyProperty`、`dirtyInheritedProperties`、`dirtyPropertiesWithUnits` 和
`dirtyPropertiesWithUnitsRecursive` 保留真实原生脏语义，递归操作包含非 DOM
子元素。`anyPropertiesDirty()` 检查属性、变量和简写。

```js
const style = element.getStyle();

style.setClass('selected', true);
style.updateDefinition();
style.setProperty(PropertyId.Width, new Property(24, Unit.PX));
const values = new ComputedValues(element);
const dirty = style.computeValues(
  values, parent.getComputedValues(), document.getComputedValues(),
  true, 1, { x: 320, y: 240 },
);

for (const id of dirty) {
  style.dirtyProperty(id);
}

context.update();
```

`computeValues` 写入关联本元素的独立值，消费真实脏集合，并向子元素传播继承
依赖。必须按父先子后执行。它不调用元素属性变更钩子，也不更新布局；后续原生
布局更新前，重新标记返回的全部编号为脏。密度必须有限且为正，视口尺寸必须
有限；只读输出、关联其他元素的输出和已失效字体句柄均被拒绝。

`resolveKeyFrameProperty(id, propertyOrNull, block, resolver)` 使用原生变量
与简写展开。`KeyFramePropertyResolver` 复用可选缓存、依赖集和输出存储；
块属性或变量环境变化前调用 `reset()`。关键帧局部变量来自块字典，然后查找
样式表与祖先。`hasSubstitutedShorthands` 返回惰性缓存状态，
`variableDependencies` 复制最近一次解析的依赖。结果是自有快照，失败返回
null。元素销毁后样式失效；运行时关闭后样式和解析器均失效。

高频数值样式操作使用 `ElementCommandBuffer` 共享数据平面：
`StyleSetNumeric`、`StyleRemoveProperty`、`StyleGetNumeric`、
`StyleGetLocalNumeric`、`StyleResolveNumeric`、`StyleResolveRelativeLength`。
相对长度操作在 `properties` 中存储 `RelativeTarget`。一次提交在 Native
顺序消费命令前缀，无需逐元素调用 Addon；保留现有快照、生命周期和回调规则。

## 元素操作

`setClassNames(names)` 替换全部原生类名，`getClassNames()` 返回空格分隔的
类名字符串。`setPseudoClass(name, active)`、`isPseudoClassSet(name)` 和
`arePseudoClassesSet(names)` 操作原生伪类，名称不带冒号。空列表的全部启用
检查返回 true。`getActivePseudoClasses()` 返回独立快照。

`getAddress(includePseudoClasses = false, includeParents = true)` 返回
RmlUi 地址，例如 `div#item.selected:hover < body`。地址从叶节点指向祖先，
不是 CSS 选择器。

```js
element.setClassNames('item selected');
element.setPseudoClass('invalid', true);
element.setAttributes({
  title: 'Inventory',
  count: 12,
  sequence: 9223372036854775807n,
  position: { x: 20, y: 40 },
});
const count = element.getAttribute('count', 0);
const raw = element.getAttributeValue('sequence');
```

`setAttribute(name, value)` 和 `setAttributes(values)` 支持字符串、布尔值、
数字、有符号或无符号 64 位 BigInt、向量、带类型标记的颜色和 null。
null 存储原生 Variant NONE，不会删除键。用 `hasAttribute(name)` 区分缺失键
和 NONE，用 `removeAttribute(name)` 删除键。`getNumAttributes()` 返回键数量。

批量设置合并键，对整组属性调用一次原生 `OnAttributeChange`。全部 JS getter
和转换完成后才借用接收元素并应用属性组。转换失败不会修改已有属性。
原生回调本身可能产生副作用，因此该操作不提供事务回滚。输入控件的类型变更
沿用单属性更新的子树销毁保护。修改活动事件分发目标的属性可能抛错；
回调内仍可读取属性。

原有的 `getAttribute(name)` 返回原生字符串转换结果或 null。
`getAttribute(name, defaultValue)` 根据默认值类型选择原生转换模板。
number 选择 double；BigInt 选择 int64，默认值超过 INT64_MAX 时选择 uint64。
缺失键返回默认值。转换遵循原生规则：number 默认值会让无效数字字符串转成零；
无效整数字符串则保留 BigInt 默认值。不安全的数字或字符串到整数转换，
会在进入原生转换前抛错。null 无法确定转换类型，不能作为默认值。

`getAttributeValue(name)` 返回原始值快照，缺失键和 NONE 均返回 null。
`getAttributes()` 把全部键和值复制为自有数据属性。向量和颜色均按值复制；
元素销毁后快照仍可读取，修改快照不会改变原生属性。

属性值接受受生命周期保护的元素引用、独立样式列表和变换，以及带类型的脚本或
不透明指针值。使用 [`VariantValue`](/reference/rmlui/types/VariantValue.html)
类型选择原生表示；任意宿主对象需要类型明确的指针样本或已验证的原生来源。
事件参数还支持回调作用域内的元素引用。参见[原生值](./numeric-values.zh-CN.md)。

`getContext()` 经所属文档返回唯一上下文对象。分离元素和上下文根节点返回
null，与原生 `Element::GetContext` 一致。`getFocusLeafNode()` 返回最深的
焦点后代；没有后代聚焦时返回当前元素。

参见[文档控制](./documents.zh-CN.md)和
[原生类型与默认动作](./rtti-default-actions.zh-CN.md)。

`getEventDispatcherSummary()` 复制原生调试字符串，例如 `click (2)`；
捕获和非捕获监听器合并计数。没有监听器时返回空字符串。

`getEventDispatcher()` 返回身份固定、元素持有的
[`EventDispatcher`](/reference/rmlui/classes/EventDispatcher.html)。
`attachEvent(idOrName, listener, capture = false)` 和
`detachEvent(idOrName, listener, capture = false)` 与 Element 的监听器方法
共享注册项，相同注册幂等。`detachAllEvents()` 递归移除全部监听器，包含原生
控件监听器和非 DOM 子元素。活动回调安全结束；带类型解绑通知在外层调用边界
执行，使用元素标识副本。`toString()` 返回相同的原生摘要。销毁或关闭使组件
失效；组件令牌保活分离元素。

```js
const dispatcher = element.getEventDispatcher();

dispatcher.attachEvent(EventId.Click, onClick);
EventDispatcher.dispatchEvent(
  element, EventId.Click, 'click', {}, true, false, DefaultActionPhase.Target,
);
dispatcher.detachEvent(EventId.Click, onClick);
```

静态 `dispatchEvent(target, id, type, parameters, interruptible, bubbles,
defaultActionPhase)` 要求显式指定全部标志。id 选择监听器，type 是独立的名称
副本，不读取注册默认值。与上游一致，bubbles 为 false 时，`TargetAndBubble`
仍执行祖先默认动作。参数访问器先于目标校验执行。

`getClosestScrollableContainer()` 先检查当前元素，再向祖先查找。
先调用 `context.update()`。auto/scroll 仅在对应轴的内容超过客户区时符合条件；
`overscroll-behavior: contain` 无需内容溢出也符合条件。没有容器时返回 null。

`getDataModel()` 返回与上下文查询相同的受检 `DataModelConstructor`；
未关联模型时返回 null。原生节点脱离会清除关联，重新插入后遵循新父节点的模型。
移除模型会让已保留的模型句柄失效。元素销毁后查询失效，已保留的模型遵循
上下文生命周期。查询复用原生指针索引，不扫描模型或元素集合。
