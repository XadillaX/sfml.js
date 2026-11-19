# 外部 Native 对象适配验收

> 17 个外部 C++ 适配场景在 macOS arm64 上通过。
> 完整包退出 0：109 个运行时文件、1,096 条 PASS、零条 FAIL。
> 四语站点的 81 项测试、构建与全部本地链接校验通过。
> 任意 Native ScriptInterface 的登记路径已有后续验收记录。
> 全部模板与 RmlUi 6.3 整体验收继续执行。

## 实际来源

[原生扩展](../../../../packages/sfml.js-rmlui/test/native/external-variant-adapters.cc)
只编译一个小型 Addon，通过 POSIX `dlopen` 使用现有 `rmlui.node` 的实现、
状态和资源注册表。测试没有复制解释器、仓库、依赖或构建环境。

不透明来源是实际 C++ `Payload` 分配。原生检查直接比较 Variant 存储与该分配
的地址，只将布尔结果传给 JS。脚本来源包括通过真实 ElementInstancer 创建的
C++ Element 子类和由 Native 独立持有的 ScriptInterface 子类；两者都实际覆盖
`GetScriptObject()`。不同元素还共用同一个原生返回地址，检验关联是否按接口区分。

[目的类型与生命周期场景](../../../../packages/sfml.js-rmlui/test/external-variant-adapters.cjs)
通过现有公开 Variant、Property、字典、DOM、事件和 Lua 文档路径消费这些来源。
原生扩展接入同一个 RuntimeScope，保持接收者保护、异常传播和边界清理。
它不是公开的 JS 地址注册接口。

## 不透明分配

`native/rmlui-variant-objects.h` 提供 Native 专用登记：

```cpp
auto owner = sfmlrmlui::RegisterNativeObjectVariant(
    allocation, javascript_object);
if (!owner) {
  return;
}

Rml::Variant value;
owner->SetVariant(&value);

owner->Invalidate();
// 此后才释放 allocation；所有原生、JS 和 Lua 副本共享空槽。
```

Native 所有者管理分配，登记对象仅管理身份与失效槽。登记对象析构也会使槽失效，
没有 V8 分配或 JS 回调。复制 Variant 不延长实际 C++ 分配的生命周期。
值拥有者沿用现有私有保活边；纯 Native 资源仍需使用其实际资源拥有者提供的根。

一个 JS 对象只绑定一个不透明身份。已有托管身份、重复 Native 登记和过期身份
再次登记均拒绝，避免多个独立失效者错误共用同一个槽。未登记的裸指针继续拒绝。
成功转换仍调用真实 `GetInto<void*>`，并复制原保护槽。销毁后的成功转换返回
`null`，不使用调用方回退值恢复旧地址。

## 原生脚本覆盖

`native/rmlui-script-object.h` 提供：

```cpp
const bool registered = sfmlrmlui::RegisterNativeScriptObject(
    interface, interface->GetScriptObject(), javascript_object);
```

登记值必须匹配原生虚方法的实际结果。注册表按 ScriptInterface 索引，记录验证
实际返回值及 runtime generation。多个接口可以返回同一个 ScriptObject 地址，
同时保持不同 JS 对象关联。重新登记替换当前关联，旧记录析构不会删除新记录。

原生覆盖保持权威。JS `setScriptObject` 不能覆盖已登记的 Native 适配；
Native 修改返回身份后，读取拒绝旧关联，只有重新登记准确身份后才能读取。

Element 默认使用原生元素的所有权根。转入 Native 树时提升保活，脱离后使用
可回收的 JS 所有者边，Native 销毁时释放。没有 JS 包装器的独立 Native
ScriptInterface 使用实际 Native 根，并在该接口析构后释放关联。

## 聚焦验证

`external-variant-adapters-red-2.log` 复现真实 C++ 分配与覆盖元素的两条拒绝路径。
该初始扩展尚未配置正确的 ElementInstancer，清理告警不计为绑定失败证据；
正式扩展使用真实 Instancer，并在其原生释放方法中删除分配。

`external-variant-adapters-matrix-2.log` 进一步复现两类实际缺陷：
过期空槽仍试图解析已回收的 JS 对象，以及 JS setter 可以覆盖已登记原生适配。
空槽解析现在返回空所有者，原生适配记录明确拒绝 JS 覆盖。
同一次运行的 Lua 脚本路径参数和 RuntimeScope 接入错误属于测试扩展问题；
修正后未改变产品接口契约或降低断言。

`external-variant-adapters-matrix-3.log` 退出 0，17 条 PASS、零条 FAIL，覆盖：

- 实际原生地址、复制、移动、精确引用、重新输入及指针默认值。
- Property、字典、单个与批量属性、事件参数及 Lua 副本。
- 显式失效、Native 来源析构、GC 私有边释放及对象／来源引用环。
- Native 覆盖权威、相同地址的不同接口、重新登记及错误身份拒绝。
- 分离元素引用环、挂接树销毁、独立 Context 环及纯 Native 接口销毁。
- 未登记指针拒绝、shutdown 与 restart、无变更帧计数。

16 帧静态检查中，`callbackSnapshotVisits`、`elementOwnershipVisits`、
`callbackOwnershipPasses.scriptObject` 和 `callbackLeaseVisits.scriptObject`
全部为 0。本记录没有初始化、完整 CPU 帧、malloc 或 GPU 分位数结论。

## 验证范围

三个维护的原生编译单元通过 LLVM 18 命名检查。编译器使用匹配的 C++、资源和
系统 C 头文件；既有配置只对维护代码报告命名问题，日志保留外部头文件诊断计数。
最终 ESLint、clang-format 与原生扩展 cpplint 通过。cpplint 自身输出 Python
弃用警告，不能描述为无工具警告。

`external-variant-adapters-package-1.log` 退出 0，包含 lint、cpplint、Native 与
TypeScript 构建、消费端类型和全部运行时测试。109 个文件记录 1,096 条 PASS，
零条 FAIL，Native 编译器警告与错误均为 0。

`external-variant-adapters-site-1.log` 退出 0：81 项测试通过、零失败、零跳过；
站点验证 152 个本地化页面、每语种 1,595 个 API 页面、303 个重定向及全部
本地链接和资源。TypeDoc 仍保留无关 sfml.js 类型引用警告，没有 RmlUi 类型引用
警告。这不代表浏览器渲染或多尺寸视觉验收。

[完整证据](external-native-adapter-evidence.json) 保存原始声明精确键、
源文件与日志 SHA-256、聚焦及完整包结果和静态计数。只向原有 ScriptInterface
及两个 Lua Utilities 声明补充登记路径证据，没有提升其余模板状态。

聚焦扩展通过独立命令运行，没有纳入通用 `npm test` 的运行时文件计数：

```bash
node test/external-variant-adapters.cjs
```

脚本使用现有编译数据库、C++ 编译器和 Python，把测试二进制写入系统临时目录。
POSIX 扩展的本地结果不能推广为 Windows、Linux、打包后加载或 ABI 稳定性验收。

原始声明分母仍为 3,926；记录不提升八条 Core、十六条 Supplemental 或 Lua
通用模板状态。[外部 ScriptInterface Variant 验收](external-script-variant-acceptance.md)
补充任意 Native 接口的登记槽、真实 Context/Event 子类根与单次 getter 证据。
完整转换目的类型、Lua 描述器与类型边界、可选模块、GPU／平台 IME、应用与视觉、
编辑器、打包 CI 和整体验收继续执行。
