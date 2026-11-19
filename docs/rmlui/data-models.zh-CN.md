# 原生数据模型

RmlUi 在原生 Core 中求值数据表达式、调度脏视图并运行双向控制器。加载带有 `data-model` 属性的文档前，先创建同名模型。

```js
const model = context.createDataModel('application');

if (!model) {
  throw new Error('Duplicate model');
}

model.bind('title', '物品清单');
model.bind('count', 1);
const handle = model.getModelHandle();

const document = context.loadDocumentFromMemory(`
  <rml><head/><body data-model="application">
    <div>{{title}}: {{count}}</div>
  </body></rml>
`);

document.show();

model.getVariable('$.count').set(2);
handle.dirtyVariable('count');
context.update();
```

`DataModelConstructor` 负责绑定值和回调，`getModelHandle()` 返回独立的 `DataModelHandle`，用于调度根变量的脏更新。`getDataModel(name)` 返回相同构造器，`getDataModels()` 返回快照。重复名称或不存在的模型返回 `null`；`removeDataModel(name)` 返回原生布尔结果。

标量存储由 Native 持有。初始的布尔、数字、BigInt 或字符串决定原生类型。`DataVariable.get()`、`set(value)` 调用真实原生定义，转换遵循 RmlUi，包括字符串转数字的 `atof` 行为。写入不会自动标脏；变量句柄保存路径，每次调用重新解析。

`new DataModelHandle()`、`new DataModelConstructor()` 和 `new DataVariable()` 创建无效句柄，`isValid` 返回 `false`，需要有效对象的操作抛错。模型变量的有效性还检查当前路径，包括数组截断后的路径失效。

`new DataVariable(schema, initialValue)` 使用受检的已注册 `DataSchema`
分配独立的原生自有存储，省略初值时使用原生默认值。标量、枚举、数组、递归结构、
受管理引用和自定义数据复用模型绑定的定义。子变量保活根存储，并在调整大小或重定向引用
后重新解析路径。数值视图共享原生内存；旧视图在调整大小或关闭运行时后仍保留自身分配。
变量保活注册表，并随注册表失效。引用和回调目标必须来自同一注册表。数据和引用目标通过
V8 可见的边保活，不可达循环可被 GC 回收。`model.bindCustomDataVariable(name, variable)`
绑定受检别名，模型更新仍需要显式通知脏根变量。

```js
const { DataTypeRegister, DataVariable } = require('sfml.js-rmlui');
const types = new DataTypeRegister();
const real = types.registerScalar('Real', 'float64');
const reals = types.registerArray('Reals', real);
const values = new DataVariable(reals, [1, 2]);

values.getNumericView()[1] = 3;
const ownedModel = context.createDataModel('owned', {typeRegister: types});

ownedModel.bindCustomDataVariable('values', values);
ownedModel.dirtyVariable('values');
```

`DataTypeGetFunc<T>`、`DataTypeSetFunc<T>` 表示标量数据回调。`DataEventMemberFunc<T>`、`MemberGetFunc<T>` 和 `MemberSetFunc<T>` 表示宿主方法，使用 `.bind(owner)` 绑定接收者后传给 `bindEventCallback()` 或 `bindFunc()`。`MemberGetterFunc<Object, ReturnType>`、`MemberSetterFunc<Object, AssignType>` 表示用于 `registerMember()` 的值或引用方法。`VoidMemberFunc` 用省略的成员回调（`undefined`）表示。

`DataAddressEntry(nameOrIndex)` 提供可修改的 `name`、`index` 字段，使用原生默认值：由名称构造时索引为 `-1`，由索引构造时名称为 `''`。`getVariable()` 接受有序的 `DataAddress`，`child()` 接受单个地址项。解析时复制两个字段，之后修改地址项不会改变已保存变量的目标。显式地址项支持包含句点的成员名称。

```js
const { DataAddressEntry, makeLiteralIntVariable } = require('sfml.js-rmlui');
const count = model.getVariable([new DataAddressEntry('count')]);

model.bindCustomDataVariable('constant', makeLiteralIntVariable(-7));
const roots = model.getAllVariables();
// roots.count resolves the same live storage; later bound roots are absent.
```

`makeLiteralIntVariable(value)` 接受有符号 32 位整数，包含零和负数，直接调用 Core 的不可变常量构造器。读取成功，写入返回 `false`，大小为零且没有子项。独立常量在模型移除和运行时关闭后仍有效；从模型取得的变量仍受模型生命周期约束。`getAllVariables()` 通过 `DataModelConstructorAccessor` 获取原生根变量名称快照。

`DataVariable.getDefinition()` 使用 `DataVariableAccessor`，返回受检 `DataDefinition`。已注册定义保留规范 `DataSchema` 的对象标识；推断标量、函数绑定和常量保活其变量租约。`isValid`、`type` 和 `reflectMemberNames()` 每次操作都检查所有者。独立常量的定义在运行时关闭后仍有效；从模型取得的定义在模型或变量路径失效后失效。

`DataSchema.underlying` 返回规范的数组元素或受管理引用目标类型；其他类型返回 `null`。`DataPointerTraits(schema)` 通过 `isPointer`、`elementType` 和 `dereference(variable)` 提供 `PointerTraits::is_pointer_v`、`element_type` 和 `Dereference` 的运行时对应接口。值保留包装对象标识；引用返回受检目标或 `null`。定义不匹配或句柄失效时拒绝操作。C++ 原始、独占和共享指针在 JS 中使用受管理的原生引用租约，地址不会跨越边界。

`DataTypeRegister.createFamilyId()` 分配真实原生标识。`registerDefinition(familyId, name, callbacks)` 将自定义定义转移到原生注册表，返回原生插入结果。标识或名称重复时返回 `false`，且不保活被拒绝的回调。同一运行时世代内可跨注册表复用已分配的标识；伪造数字及旧世代标识会被拒绝。`getDefinition(nameOrFamilyId)` 返回规范的已注册类型，或 `null`。

`new DataStructHandle(register, definition)` 包装已有的已注册结构定义，
共享定义和注册表租约，不分配数据存储。外部注册表、标量、数组、引用、自定义定义
或失效的注册表均被拒绝。

原生 `ScalarDefinition`、`ScalarFuncDefinition`、`StructDefinition` 和
`ArrayDefinition<Container>` 分别对应标量、回调、结构和数组类型。
`StructHandle::RegisterMember` 将成员对象映射为存储成员，将标量 getter 映射为
值回调，将指针或引用 getter 映射为受检变量回调。getter/setter 对在调用 void
setter 前完成原生标量转换。省略的回调对应 `VoidMemberFunc`。
自定义 `VariableDefinition` 子类使用 `DataCustomDefinition` 回调表示；
原生注册表持有适配器，每个已绑定节点保活其数据。JS 使用原生存储和受检租约，
不接收调用方 C++ 地址。原生代码仍可通过上游头文件实例化 C++ 模板。

对有效目标，受管理引用转发原生 Get/Set/Size/Child 和反射。
上游 `BasePointerDefinition` 检查外层存储地址，但不保护空的解引用目标；
JS 适配器还会校验目标，并按文档处理空引用。数值范围检查、类型冻结和重复成员拒绝
属于受检 JS 接口策略，不代表两者的 C++ 内存布局相同。

```js
let name = 'initial';

model.bindFunc('name', () => name, value => {
  name = String(value);
});
model.registerTransformFunc('decorate', args =>
  `${args[1]}${args[0]}${args[1]}`);
model.bindEventCallback('increment', (handle, event, args) => {
  const count = model.getVariable('count');

  count.set(Number(count.get()) + Number(args[0]));
  handle.dirtyVariable('count');
  event.stopPropagation();
});
```

原生表达式中的字符串使用单引号，例如 `{{name | decorate('!')}}` 或 `data-event-click="increment(3)"`。省略 `bindFunc` 的 setter 即为只读绑定。原生 `data-value` 控制器调用 setter 并标记根变量。变换属于上下文的类型注册表，移除注册它的模型后仍可使用。重复变换名称保留第一次原生注册，不保活被拒绝的宿主回调；内置变换同样遵循此规则。

`model.update(clearDirtyVariables = true)` 调用原生 `DataModel::Update`，`Context.update()` 也会更新模型。加载和显示文档可能同步更新视图并执行 getter。

回调在运行时所属的 Node 环境中同步执行，第一个异常通过宿主边界返回；递归调用同一 getter 会被拒绝。回调期间禁止移除模型、上下文或运行时。数据回调返回后，事件操作失效，保存的事件字段仍可读取。移除模型会失效全部模型及变量句柄；销毁上下文或关闭运行时会失效关联模型。原生持有的上下文保活回调，独立自有上下文通过 V8 可见的所有权边支持回调循环回收。

可以使用上下文默认注册表，也可以创建独立的 `DataTypeRegister`，通过 `createDataModel(name, { typeRegister })` 传入。独立注册表支持跨上下文共享，移除上下文后仍有效。默认注册表在移除模型后仍有效，随上下文销毁而失效。关闭运行时会失效所有注册表。

```js
const types = model.getDataTypeRegister();
const number = types.registerScalar('Real', 'float64');
const text = types.registerScalar('Text', 'string');
const item = types.registerStruct('Item');

item.registerMember('name', text);
item.registerMember('price', number);
const items = types.registerArray('Items', item);

model.bind('items', [{ name: 'Apple', price: 2.5 }], items);
model.applyPatch({ '$.items[0].price': 3 });
context.update();
```

原生标量 schema 支持 `bool`、`string`、`int8`/`uint8`、`int16`/`uint16`、`int32`/`uint32`、`int64`/`uint64`、`float32` 和 `float64`。整数转换校验目标范围，拒绝写入时保留原值；原生双向控制器使用相同检查。结构体成员可以引用自身类型的数组。开始创建存储后，schema 会被冻结。类型名称重复返回 `null`，成员重复返回 `false`；不同注册表的定义不能混用。

`bindFunc` getter 和变换回调可返回任意自有 `DataVariantValue`，包括 null、基本值、向量、颜色、装饰列表、变换快照、动画与过渡列表，以及具类型的效果列表。底层定义支持时，`DataVariable.set()` 也接受这些值。转换复制值存储并保活原生共享资源；借用的元素及 void 指针需要受管引用定义。返回值的访问器在活跃回调内执行，遵循相同的递归和移除检查。

```js
model.bindFunc('accent', () => ({
  type: 'colourb', red: 165, green: 213, blue: 205, alpha: 255,
}));
const transforms = types.getTransformFuncRegister();

transforms.register('coordinates', args => ({
  x: Number(args[0]), y: Number(args[1]),
}));
const result = transforms.call('coordinates', [ 3, 4 ]);
// { success: true, value: { x: 3, y: 4 } }
```

`TransformFuncRegister` 调用真实原生注册表，包含内置函数和模型注册的函数。返回的 `success` 区分函数不存在和函数返回 null；不存在时返回 `{ success: false, value: null }`。外观对象保活所属类型注册表租约，使用相同的生命周期。输入转换结束后才解析该租约。

数值数组通过 `variable.getNumericView()` 暴露共享存储，视图类型与标量 schema 对应。布尔和字符串数组通过受检子项读写。`variable.resize(count)` 保留已有项，新项使用原生默认值，不自动标记根变量。扩容后需重新获取数值视图；旧视图保留原分配，不再修改新数组。视图可以在模型或上下文销毁后继续持有内存，不保活这些对象。原生表达式、视图、控制器和 JS 变量句柄每次使用时重新解析数组路径。

`applyPatch` 在写入前只转换指定的标量值，并标记成功写入项的根变量，也可以在原生数据事件回调中调用。创建记录存储时不会读取未注册属性。转换 getter 抛错不会导致补丁部分写入；首个异常会停止后续赋值，被拒绝的写入返回 `false`。类型注册需要在原生回调之外执行。数组 `.size`、索引子项、结构体具名子项及成员反射均使用原生定义。

数据事件函数可同步调整已注册数组的长度，同一原生事件表达式中的后续语句立即看到新长度。getter、setter、变换、自定义定义及成员回调内禁止调整长度；数据事件期间嵌套的普通监听器也不能调用。getter 派发数据事件时仍保留此限制。修改后标记源根变量，交还应用控制权后再更新视图。

官方 `data-binding` 应用运行上游全部四个模型，包含同步记录鼠标位置、增删主题、原生双向控件和 Invaders 模拟；`tree-view` 遍历真实示例目录，保持上游后代节点的可见性和折叠规则。两者均直接加载原始资源：

```sh
node packages/sfml.js-rmlui/examples/official.cjs data-binding
node packages/sfml.js-rmlui/examples/official.cjs tree-view
```

上游表单标记包含 `onsubmit="submit_form"`，应用没有安装对应处理器。移植保留这个行为；`ElementForm.submit()` 仍会派发原生提交事件。

`registerReference(name, targetSchema)` 注册可空的受管模型引用，目标可以是标量、数组或结构体，必须具有同一注册表的底层定义。绑定值为 `DataVariable` 或 `null`，也可以用于结构体成员及数组元素。引用的引用会被拒绝，与 RmlUi 6.3 `DataTypeRegister::GetDefinition<T>()` 中明确禁止指向指针的指针的 `static_assert` 一致。递归结构体成员和包含引用的数组仍然支持。

```js
const itemRef = types.registerReference('ItemRef', item);

model.bind('selected', model.getVariable('items[0]'), itemRef);
model.getVariable('selected.price').set(4);
model.dirtyVariable('items');
model.dirtyVariable('selected');
const selected = model.getVariable('selected');

selected.setReference(null);
model.dirtyVariable('selected');
// selected.getReference() === null
```

`getReference()` 返回受检目标，`setReference(target)` 替换或清空引用，不自动标脏。空标量引用读为 null、写入返回 `false`；空数组引用大小为 0，空引用没有子项。目标模型被移除或数组路径失效时抛错；依赖自身的循环路径受递归深度限制。存储只保留原生弱路径，V8 可见的边保活目标；清空、截断数组和移除模型会释放这些边，跨自有上下文的引用循环可以回收。数值视图与扩容沿当前引用目标执行。

`registerEnum(name, integerKind)` 使用受检底层整数宽度存储原生枚举值，支持全部八种有符号及无符号整数类型，包含完整 `uint64` 范围。数值数组视图使用底层宽度。它不限定具名枚举值集合。构造器也提供 `registerScalar`、`registerStruct`、`registerArray` 和 `registerCustomDataVariableDefinition`，使用本构造器的原生类型注册表。

```js
const { DataVariableType } = require('sfml.js-rmlui');
const status = model.registerEnum('Status', 'uint8');

model.bind('status', 2, status);
const custom = model.registerCustomDataVariableDefinition('Price', {
  type: DataVariableType.Scalar,
  get: payload => ({ success: true, value: payload.price }),
  set: (payload, value) => {
    if (typeof value !== 'number') {
      return false;
    }

    payload.price = value;

    return true;
  },
});

model.bindCustomDataVariable('price', { price: 3 }, custom);
model.getVariable('price').set(4);
```

自定义定义实现真实原生 `VariableDefinition::Get`、`Set`、`Size`、`Child` 和 `ReflectMemberNames`。`get(payload)` 返回 `{ success, value }`，仅成功时读取值，值必须是自有 Variant。`set(payload, value)` 返回布尔值；`size(payload)` 返回非负原生 int；`child(payload, nameOrIndex)` 返回同一注册表中的受检 `DataVariable` 或 `null`；`reflectMemberNames()` 返回类型级成员名称。省略方法使用原生默认值，数组 `"size"` 子项由 child 回调提供。

`bindCustomDataVariable(name, payload, schema)` 保活原始 JS 数据，不进行序列化；`getPayload()` 返回同一对象。返回值访问器仍在活跃回调内执行，递归、破坏性操作及首个异常遵循现有运行时检查。子变量租约保活至最外层原生调用结束，涵盖后续回调。数值视图和扩容沿自定义子项路径到达已注册原生数组；自定义数组自身不提供原生扩容存储。失败绑定不保活数据，移除模型会释放数据，自有上下文循环可以回收。

`registerMember(name, schema, getter?, setter?)` 注册原生成员访问器。回调接收当前父路径的受检 `DataVariable`，包括数组扩容后新增的元素。绑定时不读取或保留访问器成员的初始属性。普通标量和枚举先按声明的原生宽度转换，再调用 setter；自定义标量成员直接交换自有 Variant。省略 setter 表示只读；getter 传 `undefined`、提供 setter 表示只写。

```js
const accessorTypes = new rmlui.DataTypeRegister();
const real = accessorTypes.registerScalar('Real', 'float64');
const product = accessorTypes.registerStruct('Product');

product.registerMember('price', real);
product.registerMember('doublePrice', real,
  parent => Number(parent.child('price').get()) * 2,
  (parent, value) => parent.child('price').set(Number(value) / 2));
```

成员必须在绑定存储前注册。数组或结构 getter 返回同一注册表、完全相同定义的受检变量或 `null`；标量引用 getter 使用引用类型。引用 getter 将读写、子路径、数值视图和扩容操作转发到当前目标，不接受按值 setter。空目标遵循受管理引用的读写语义。返回的租约保活至整次原生调用结束；保存的父变量和子变量在扩容或模型移除后重新解析路径。

`registerScalar(name, { get?, set? })` 为保活数据注册标量类型回调。getter 直接返回自有 Variant，setter 采用原生 `void` 语义，可实现枚举到标签的映射：

```js
const label = model.registerScalar('StatusLabel', {
  get: data => ['idle', 'ready', 'done'][data.code],
  set: (data, value) => {
    data.code = ['idle', 'ready', 'done'].indexOf(String(value));
  },
});

model.bindCustomDataVariable('statusLabel', { code: 1 }, label);
model.bindCustomDataVariable('countAlias', model.getVariable('count'));
```

两参数 `bindCustomDataVariable(name, variable)` 注册高级变量别名。它保活同注册表中的受检目标，每次原生操作重新解析路径，包括数组扩容和推断整数的范围校验，不添加公开类型名称。目标移除或缩容会使访问失效；模型移除释放目标所有权。写入后，应给视图使用的源根和别名根分别标脏。被拒绝的成员、标量注册及重名别名绑定不会保留对应回调或目标。

`DataView` 和 `DataController` 实现真实原生虚方法。为活跃元素创建实例，通过 `DataViewInstancer` 或 `DataControllerInstancer` 返回。`initialize(model, element, expression, modifier)` 通过受检 `DataModelConstructor` 接口传入实际原生模型，返回布尔值。视图 `update(model)` 返回文档是否改变；`getVariableNameList()` 向 Core 原生调度器提供根变量依赖。

```js
const { Factory, DataView, DataViewInstancer } = require('sfml.js-rmlui');

Factory.registerDataViewInstancer(new DataViewInstancer(element => {
  let name = '';

  return new DataView(element, {
    initialize(_model, _element, expression) {
      name = expression;

      return true;
    },
    update(current) {
      const label = String(current.getVariable(name).get());

      if (element.getAttribute('title') === label) {
        return false;
      }

      element.setAttribute('title', label);

      return true;
    },
    getVariableNameList: () => [name],
  }, -10);
}), 'label');
// <span data-label="count">悬停显示当前计数</span>
```

`Factory.registerDataViewInstancer(instancer, name, structural = false)` 和 `registerDataControllerInstancer(instancer, name)` 调用真实原生注册表，返回 void。保留首次注册，包括默认实例器；被拒绝的注册不会保活回调。名称精确匹配。结构注册向原生解析器加入完整 `data-` 名称；使用该精确属性才能将未展开的子标记保存到 `rmlui-inner-rml`。初始化仍接收原始属性表达式及修饰符。

`Factory.instanceDataView(name, element)` 和 `instanceDataController(name, element)` 返回真实自有原生默认实例、自定义实例或 null。默认视图为 `attr`、`attrif`、`class`、`if`、`visible`、`rml`、`style`、`text`、`value`、`checked`、`alias`、`for`；默认控制器为 `checked`、`event`、`value`。实例器可委派给这些默认实现，保留原生行为和释放追踪。

直接调用 `instanceView(element)`、`instanceController(element)` 也将所有权返回调用方。RML 解析将唯一所有权转交 Core；返回已转交、过期、已初始化或元素不匹配的实例会抛错。手动 `initialize` 只允许一次，不注册模型调度。默认控制器在初始化时挂载原生监听器，释放时解绑。自定义控制器可以在初始化时注册宿主监听器，在可选 `release()` 钩子中移除。

`getElement()` 使用原生观察者，元素销毁后返回 null；`isValid` 同时检查原生释放和运行时代际。视图 `sortOrder` 读取原生缓存的深度及偏移；`getVariableNameList()` 返回独立列表。`release()` 只销毁调用方自有实例，回调重入或 Core 持有时拒绝，包含默认原生控制器和表达式的回调路径。Core 销毁会失效借用接口。可选释放通知在原生栈返回后执行，捕获的元素可能已经失效；先前异常及环境清理会抑制通知，无引用自有实例的 GC 不保证发送通知。自有上下文与回调循环仍可回收。

十二个默认视图和三个控制器已有本地交互验收，四个官方数据绑定模型和树视图应用通过脚本状态校验。

仓库维护工具 `node packages/sfml.js-rmlui/tools/performance/measure-data.cjs` 校验 1 千、1 万、10 万个真实绑定元素及 100 个原生数组根变量。[实测记录](audit/6.3/data-performance.md) 包含无脏变量、1% 脏变量、全脏变量更新、稀疏补丁、视图映射和扩容。10 万行的单次模型更新分别耗时 0.051、0.201、18.781 ms；稀疏更新只读取对应的 1,000 个受检值。分配及复制计数仅覆盖数据存储和数值扩容。完整性能及平台验收尚未完成。
