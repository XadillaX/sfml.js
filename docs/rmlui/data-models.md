# Native data models

RmlUi evaluates data expressions, schedules dirty views, and runs two-way controllers in native Core. Create the model before loading documents that declare its name.

```js
const model = context.createDataModel('application');

if (!model) {
  throw new Error('Duplicate model');
}

model.bind('title', 'Inventory');
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

`DataModelConstructor` binds values and callbacks. `getModelHandle()` returns a separate `DataModelHandle` for dirty-root scheduling. `getDataModel(name)` returns the same constructor; `getDataModels()` returns a snapshot. A duplicate name or an absent model returns `null`. `removeDataModel(name)` returns the native boolean result.

Scalar storage belongs to native code. The initial boolean, number, BigInt or string selects its native type. `DataVariable.get()` and `set(value)` call the actual native definition. Conversion follows RmlUi, including its string-to-number `atof` behavior. A write does not automatically dirty the root. Variable handles retain paths and resolve them on every call.

`new DataModelHandle()`, `new DataModelConstructor()` and `new DataVariable()` create invalid handles. `isValid` returns `false`; operations that require a live value throw. A model variable's validity also checks its current path, including array truncation.

`new DataVariable(schema, initialValue)` allocates independently owned native
storage using a checked registered `DataSchema`. Omit the initial value for
native defaults. Scalars, enums, arrays, recursive structs, managed references
and custom payloads use the same definitions as model bindings. Children retain
the root storage and re-resolve after resize or reference reassignment. Numeric
views share native memory; old views preserve their allocation after resize or
shutdown. The variable retains its register and expires with that register.
References and callback targets must use the same register. Payloads and
reference targets are retained through V8-visible edges so unreachable cycles
collect. `model.bindCustomDataVariable(name, variable)` attaches a checked
alias; model updates still require explicit dirty-root notification.

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

`DataAddressEntry(nameOrIndex)` exposes mutable `name` and `index` fields with native defaults: a name sets the index to `-1`, and an index sets the name to `''`. Pass an ordered `DataAddress` to `getVariable()` or one entry to `child()`. Resolution copies both fields, so later edits cannot retarget a retained variable. Explicit entries support member names containing dots without parsing them as paths.

```js
const { DataAddressEntry, makeLiteralIntVariable } = require('sfml.js-rmlui');
const count = model.getVariable([new DataAddressEntry('count')]);

model.bindCustomDataVariable('constant', makeLiteralIntVariable(-7));
const roots = model.getAllVariables();
// roots.count resolves the same live storage; later bound roots are absent.
```

`makeLiteralIntVariable(value)` accepts signed 32-bit integers, including zero and negatives. It calls Core's immutable literal constructor. Reading succeeds, writing returns `false`, size is zero, and children are absent. The literal remains valid after model removal or runtime shutdown; a variable obtained from a model still belongs to that model. `getAllVariables()` snapshots native bound root names through `DataModelConstructorAccessor`.

`DataVariable.getDefinition()` uses `DataVariableAccessor` and returns a checked `DataDefinition`. Registered definitions retain canonical `DataSchema` identity; inferred scalars, function bindings and literals retain their variable lease. `isValid`, `type` and `reflectMemberNames()` check the owner on every operation. A standalone literal definition remains valid after shutdown. A definition obtained from a model becomes invalid when that model or its variable path expires.

`DataSchema.underlying` returns the canonical array element or managed reference target schema; other types return `null`. `DataPointerTraits(schema)` supplies the runtime equivalents of `PointerTraits::is_pointer_v`, `element_type` and `Dereference` through `isPointer`, `elementType` and `dereference(variable)`. Values preserve wrapper identity; references return a checked target or `null`. Mismatched definitions and expired handles reject. C++ raw, unique and shared pointer forms use managed native reference leases in JS; no address crosses the boundary.

`DataTypeRegister.createFamilyId()` allocates a genuine native identity. `registerDefinition(familyId, name, callbacks)` transfers a custom definition to the native register and returns its insertion result. Duplicate identities or names return `false` without retaining rejected callbacks. Reuse an allocated identity across registers in the same runtime generation; invented numbers and old-generation identities reject. `getDefinition(nameOrFamilyId)` returns the canonical registered schema or `null`.

`new DataStructHandle(register, definition)` wraps an existing registered struct
definition. It shares that definition and its register lease without allocating
data storage. A foreign register, scalar, array, reference, custom definition or
expired register is rejected.

Native `ScalarDefinition`, `ScalarFuncDefinition`, `StructDefinition` and
`ArrayDefinition<Container>` correspond to registered scalar, callback, struct
and array schemas. `StructHandle::RegisterMember` maps member objects to stored
members, scalar getters to value callbacks, and pointer/reference getters to
checked variable callbacks. Getter/setter pairs use native scalar conversion
before invoking a void setter. Omitted callbacks implement `VoidMemberFunc`.
Custom `VariableDefinition` subclasses use `DataCustomDefinition` callbacks;
the native register owns the adapter and each bound node retains its payload.
The JS representation uses native storage and checked leases rather than
consumer C++ addresses. C++ template instantiations remain available to native
code through the upstream headers.

For valid targets, managed references forward native Get/Set/Size/Child and
reflection. Upstream `BasePointerDefinition` checks the outer storage address
but does not protect a null pointee; the JS adapter additionally validates the
target and gives null references the documented empty behavior. Numeric range
checks, schema freezing and duplicate-member rejection are checked JS policies,
not claims of identical C++ memory layout.

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

Use single quotes inside native expression literals, for example `{{name | decorate('!')}}` or `data-event-click="increment(3)"`. Omit a `bindFunc` setter for a read-only binding. Native `data-value` controllers call the setter and dirty the bound root. Transforms belong to the context's type register and survive removal of the model that registered them. Duplicate transform names retain the first native registration and do not retain the rejected host callback; built-in transforms follow the same rule.

`model.update(clearDirtyVariables = true)` delegates to native `DataModel::Update`. `Context.update()` also performs model updates. Loading and showing documents can update views synchronously and therefore invoke getters.

Callbacks run synchronously in the runtime's owning Node environment. The first thrown error returns through the host boundary; recursive invocation of the same getter is rejected. Removing a model, context, or runtime during its callback is rejected. Event operations expire when the data callback returns; saved event fields remain readable. Model removal invalidates all its variable and model handles; context destruction and shutdown invalidate every associated model. Native-owned contexts retain callbacks; independently owned contexts use V8-visible ownership edges so callback cycles can be collected.

`DataTypeGetFunc<T>` and `DataTypeSetFunc<T>` describe scalar payload callbacks. `DataEventMemberFunc<T>`, `MemberGetFunc<T>` and `MemberSetFunc<T>` describe host methods; bind their receiver with `.bind(owner)` before passing them to `bindEventCallback()` or `bindFunc()`. `MemberGetterFunc<Object, ReturnType>` and `MemberSetterFunc<Object, AssignType>` describe value/reference methods used with `registerMember()`. `VoidMemberFunc` is represented by an omitted (`undefined`) member callback.

Use the context's default register or create an independent `DataTypeRegister` and pass it as `createDataModel(name, { typeRegister })`. Independent registers can be shared by several contexts and survive their removal. A default register survives model removal and expires with its context. All registers expire at shutdown.

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

Native scalar schemas support `bool`, `string`, `int8`/`uint8`, `int16`/`uint16`, `int32`/`uint32`, `int64`/`uint64`, `float32` and `float64`. Integer conversions check the destination range; rejected writes leave the previous value intact. The same check applies to native two-way controllers. Struct members can refer to arrays of the struct itself. Schemas freeze when storage creation begins. Duplicate type names return `null`; duplicate members return `false`. Definitions from different registers cannot be combined.

`bindFunc` getters and transform callbacks return any owned `DataVariantValue`: null, primitive values, vectors, colours, decoration lists, transform snapshots, animation and transition lists, or typed effect lists. `DataVariable.set()` accepts those same values when the underlying definition supports them. Conversion copies value storage and retains native shared resources. Borrowed element and void pointers require a managed reference definition. Return-value accessors run inside the active callback, with the same recursion and removal checks.

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

`TransformFuncRegister` calls the actual native register, including built-in and model-registered functions. The returned `success` flag distinguishes an absent function from a function returning null; absent functions return `{ success: false, value: null }`. The facade retains the owning type-register lease and shares its lifetime. Input conversion finishes before that lease is resolved.

Numeric arrays expose shared storage through `variable.getNumericView()`. The view type matches the scalar schema. Boolean and string arrays use checked element access. `variable.resize(count)` preserves existing elements, initializes new elements to native defaults, and does not dirty the root. After resize, request a new numeric view; old views keep their original allocation and no longer modify the resized array. A view can outlive model or context destruction without retaining either. Native expressions, views, controllers and JS variable handles resolve array paths anew on each use.

`applyPatch` converts only the specified scalar values before any writes, then marks roots for successful assignments. It also works inside native data-event callbacks. Unregistered record properties are not read during storage creation. Getter conversion failures do not partially apply a patch; the first exception stops subsequent assignments. Rejected writes return `false`. Registering schemas requires execution outside native callbacks. Array `.size`, indexed children, named struct children and reflected member names use the native definitions.

Data event functions may resize registered arrays synchronously. Following statements in the same native event expression see the new size immediately. Getter, setter, transform, custom definition and member callbacks cannot resize arrays; nested ordinary listeners also cannot resize while a data event is active. A getter that dispatches a data event retains this restriction. Dirty the source root after mutation; updates run when control returns to the application.

The official `data-binding` application runs all four upstream models, including synchronous mouse-position recording and subject insertion/removal, native two-way controls and the Invaders simulation. `tree-view` traverses the actual sample directory and preserves the upstream descendant visibility and collapse rules. Both load the original resources:

```sh
node packages/sfml.js-rmlui/examples/official.cjs data-binding
node packages/sfml.js-rmlui/examples/official.cjs tree-view
```

The original forms markup contains `onsubmit="submit_form"`, but the upstream application installs no corresponding handler. This port preserves that behavior; `ElementForm.submit()` still dispatches the native submit event.

`registerReference(name, targetSchema)` registers a nullable managed model reference. Scalar, array and struct targets must match the underlying definition in the same register. Bind a `DataVariable` or `null`, including inside struct members and arrays. Reference-to-reference schemas are rejected, matching the explicit pointer-to-pointer `static_assert` in RmlUi 6.3 `DataTypeRegister::GetDefinition<T>()`. Recursive struct members and arrays containing references are supported.

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

`getReference()` returns the checked target; `setReference(target)` replaces or clears it without dirtying roots. Null scalar references read as null and reject writes; null array references have size 0, and null references have no children. Removed target models and invalid array paths throw. Self-dependent paths have a recursion depth limit. Native storage holds weak paths; V8-visible edges retain targets and release them on clearing, truncation or model removal. Reference cycles between owned contexts can collect. Numeric views and resize follow the current target.

`registerEnum(name, integerKind)` stores native enum values with a checked underlying integer width. It supports all eight signed and unsigned integer kinds, including the full `uint64` range. Numeric array views use that underlying width. It does not impose a named set of allowed enum values. The constructor also exposes `registerScalar`, `registerStruct`, `registerArray` and `registerCustomDataVariableDefinition`, using its native type register.

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

Custom definitions implement actual native `VariableDefinition::Get`, `Set`, `Size`, `Child` and `ReflectMemberNames`. `get(payload)` returns `{ success, value }`; the value is read only on success and must be an owned Variant. `set(payload, value)` returns a boolean. `size(payload)` returns a nonnegative native int. `child(payload, nameOrIndex)` returns a checked `DataVariable` from the same register or `null`; `reflectMemberNames()` returns schema-level names. Omitted methods return native defaults. Array `"size"` children are supplied by the child callback.

`bindCustomDataVariable(name, payload, schema)` retains the original JS payload without serializing it; `getPayload()` returns that same object. Return-value accessors remain inside the active callback. Recursion, destructive mutation and the first exception use the existing runtime checks. Child leases remain alive until the outer native call ends, including later callbacks. Numeric views and resize follow custom child paths to registered native arrays. Custom arrays themselves do not provide native resize storage. Failed binds do not retain payloads; model removal releases them, and owned-context cycles can collect.

`registerMember(name, schema, getter?, setter?)` adds native member accessors. A callback receives a checked `DataVariable` for its current parent, including newly grown array elements. Initial properties for accessor members are not read or retained. Plain scalar and enum values convert through their declared native storage width before a setter runs; custom scalar members exchange owned Variants directly. Omit the setter for a read-only value, or pass `undefined` as the getter for a write-only member.

```js
const accessorTypes = new rmlui.DataTypeRegister();
const real = accessorTypes.registerScalar('Real', 'float64');
const product = accessorTypes.registerStruct('Product');

product.registerMember('price', real);
product.registerMember('doublePrice', real,
  parent => Number(parent.child('price').get()) * 2,
  (parent, value) => parent.child('price').set(Number(value) / 2));
```

Register members before binding storage. For an array or struct schema, the getter returns a checked variable of that exact definition in the same register, or `null`. Use a reference schema for a scalar getter by reference. Reference getters forward reads, writes, children, numeric views and resize to their current target; they cannot take a value setter. Null reads and writes follow managed reference behavior. Returned leases survive the complete native call, while saved parent and child variables re-resolve their paths after resize or model removal.

`registerScalar(name, { get?, set? })` registers scalar type callbacks over retained payloads. Its getter returns an owned Variant directly; its setter has native `void` semantics. This supports enum-to-label mappings without serializing payloads:

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

The two-argument `bindCustomDataVariable(name, variable)` overload binds an advanced alias. It retains a checked target from the same register and resolves that path on every native operation, including array resize and inferred integer range checks. Aliases add no public schema names. Target removal or truncation invalidates access; model removal releases target ownership. Dirty the source and alias roots used by views after writing. Rejected member/scalar registrations and duplicate alias binds do not retain the rejected callbacks or targets.

`DataView` and `DataController` implement real native virtual operations. Create them for a live element, then return them from `DataViewInstancer` or `DataControllerInstancer`. `initialize(model, element, expression, modifier)` receives the actual native model through its checked `DataModelConstructor` facade and returns a boolean. View `update(model)` returns whether the document changed; `getVariableNameList()` supplies root dependencies to Core's native scheduler.

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
// <span data-label="count">Hover for the current count</span>
```

`Factory.registerDataViewInstancer(instancer, name, structural = false)` and `registerDataControllerInstancer(instancer, name)` call the actual native register and return void. First registration wins, including defaults; rejected registrations do not retain their callbacks. Names are exact. A structural registration adds the full `data-` name to the native parser; use that exact attribute to preserve unexpanded children in `rmlui-inner-rml`. Initialization still receives the original attribute expression and modifier.

`Factory.instanceDataView(name, element)` and `instanceDataController(name, element)` return actual owning native defaults or custom instances, or null. Default view types are `attr`, `attrif`, `class`, `if`, `visible`, `rml`, `style`, `text`, `value`, `checked`, `alias` and `for`; default controllers are `checked`, `event` and `value`. An instancer can delegate to these defaults while preserving native behavior and release tracking.

Direct `instanceView(element)` and `instanceController(element)` also return ownership to the caller. RML parsing transfers unique ownership to Core; returning an already transferred, expired, initialized or wrong-element instance throws. Manual `initialize` is allowed once, and does not register model scheduling. Default controllers attach native listeners during initialization and detach them on release. Custom controllers may register host listeners in initialization and remove them in the optional `release()` hook.

`getElement()` uses native observers and returns null after element destruction; `isValid` also checks native release and runtime generations. View `sortOrder` reads the native cached depth and offset. `getVariableNameList()` returns an independent list. `release()` destroys only caller-owned instances and rejects callback reentry or Core ownership, including callbacks running through default native controllers and expressions. Core destruction invalidates borrowed facades. Optional release notifications run after the native frame; captured elements may be invalid. Earlier exceptions and environment cleanup suppress notifications, and GC does not guarantee delivery for unreachable owned instances. Owned context/callback cycles remain collectible.

All twelve default views and three controllers have local interaction fixtures. The four official data-binding models and tree-view application pass scripted state checks.

The repository maintenance tool `node packages/sfml.js-rmlui/tools/performance/measure-data.cjs` verifies 1k/10k/100k real bound elements and 100 native array roots. [Recorded measurements](audit/6.3/data-performance.md) include no-dirty, 1% dirty and all-dirty updates, sparse patches, view mapping and resize. At 100k rows, the single measured model updates took 0.051, 0.201 and 18.781 ms respectively; sparse updating read only 1,000 checked values. Allocation/copy counters cover data storage and numeric resize only. Full performance and platform acceptance remain outstanding.
