# 原生类型与默认动作

`ScriptInterface` 是 `Context`、`Element` 和 `RmlEvent` 的类型基类，没有独立原生分配入口。
`ScriptInterface.getStaticClassIdentifier()` 返回真实原生基类令牌。
原生 Event 继承同一令牌，因此 `RmlEvent.getStaticClassIdentifier()` 返回相同值。
元素具有各自的令牌，并通过 ScriptInterface 基类的 `isClass` 检查。

`getScriptObject()` 在有效对象上调用原生虚方法。未注册的上下文、元素和事件返回
`null`；`setScriptObject(object)` 注册受管理宿主关联，传入 `null` 清除关联。
仅定义 JS 子类不会创建原生脚本对象。详见[脚本对象](scripts.zh-CN.md#原生脚本对象)。
事件的 RTTI 与脚本对象读取需要有效自有事件或当前回调借用。
元素销毁、自有事件释放、回调返回及关闭后，原生读取会被拒绝；
保存的事件快照字段仍可读取。`release()` 保留具体类原有分配及所有权规则。

`Element.getStaticClassIdentifier()` 返回包装类对应的不透明
`ClassIdentifier` 符号。所有导出的元素子类都继承此方法；仅在 JS 中定义的
子类使用最近的已注册原生基类。静态令牌在初始化前即可获取，同一模块内重启
运行时后仍有效，不能序列化，也不能用字符串自行构造。

`element.getClassIdentifier()` 查询对象的真实原生类型；
`element.isClass(token)` 检查原生继承关系。两者都拒绝已销毁的元素。
令牌不暴露指针地址，也不保活元素。未提供专用包装类的原生子类仍有独立令牌，
即使它们使用 `Element` 包装器。RML 标签和 JS 原型不决定原生类型。

```js
const controlType = rmlui.ElementFormControl.getStaticClassIdentifier();

if (element.isClass(controlType)) {
  // The native element derives from ElementFormControl.
}
```

`element.processDefaultAction(event)` 调用虚方法
`Rml::Element::ProcessDefaultAction`，包括输入控件及标签组的覆盖实现。
必须在该元素的监听器内同步调用，接收者必须是活事件的 `currentTarget`。
当前监听器返回后，保存的事件立即失效，即使同次派发中的其他监听器仍在执行。

```js
tabs.addEventListener('click', event => {
  event.stopPropagation();
  tabs.processDefaultAction(event);
});
```

该例手动执行一次原生标签点击动作。方法保留活事件的阶段、目标、参数和传播
状态；已停止传播的事件也可手动执行默认动作。手动调用不会取消后续的自动
默认动作。若只需手动执行，应对可中断事件调用 `stopPropagation()`；
不可中断事件不会因此取消自动动作。

顺序调用会重复原生副作用，例如复选框可以连续切换两次。禁止在同一事件的
手动动作仍执行时递归调用；嵌套的独立事件可以执行自己的动作。现有的活动
元素和回调生命周期保护仍然有效，监听器异常在最外层原生调用返回时传递。

参见[元素状态](./element-state.zh-CN.md)、
[文本与标签组](./text-panels.zh-CN.md)及[表单控件](./controls.zh-CN.md)。
