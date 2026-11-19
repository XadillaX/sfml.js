# 渲染资源

使用这些接口前先初始化 RmlUi。资源修改属于运行时的所有者线程，不能在事件回调中调用。

```ts
import * as rmlui from 'sfml.js-rmlui';

const renderer = rmlui.getRenderInterface();
const context = rmlui.createContext('overlay', 800, 600, renderer);
const sources = rmlui.getTextureSourceList();

for (const source of sources) {
  rmlui.releaseTexture(source, context.renderInterface);
}

rmlui.releaseCompiledGeometry(renderer);
```

| 操作 | 效果 |
| --- | --- |
| `getRenderInterface()` | 返回选定或默认原生接口；未选定及 shutdown 后为 null。 |
| `createRenderInterface(window)` | 创建独立的 SFML 渲染接口与资源缓存。 |
| `setRenderInterface(renderer \| null)` | 初始化前选定默认接口；null 恢复自动选择。 |
| `context.renderInterface` | 返回创建此上下文时使用的渲染接口。 |
| `getTextureSourceList()` | 复制全部管理器的文件源 URL，保留原生顺序和重复项。 |
| `releaseTexture(source, renderer?)` | 只有释放了已加载的纹理句柄才返回 true。 |
| `releaseTextures(renderer?)` | 释放已加载的文件纹理和生成纹理，下次使用时重新加载。 |
| `releaseCompiledGeometry(renderer?)` | 释放编译句柄，保留网格供重新编译。 |
| `releaseRenderManagers()` | 释放没有上下文引用的管理器，同时释放字体资源并更新活动上下文。 |

省略渲染接口或传入 `null`，表示释放**所有**渲染接口中的资源。
传入不透明的 `RenderInterface` 可限定操作范围。
即使绑定同一个窗口，独立创建的渲染接口也有独立缓存。
应精确使用 `getTextureSourceList()` 返回的 URL：路径解析可能改变标记中的路径，
包括移除开头的斜杠。列表仍包含句柄已释放的缓存文件源；生成纹理没有源 URL。

移除上下文或清理未使用的管理器后，渲染接口引用仍然有效。
关闭运行时后引用失效，重新初始化也不会恢复。
选定接口及被 Native 管理器、预加载使用的接口持有原生窗口至关闭；
未使用接口可回收。使用中的窗口必须保持打开至关闭。
额外渲染接口不会替换默认系统接口，也不修改窗口的高 DPI 设置。

调用 `releaseRenderManagers()` 前，必须先重新挂载或回收所有脱离树的元素。
它们可能仍持有原生几何或回调纹理；只要存在这样的树，绑定就会拒绝清理。
曾属于某个渲染接口的节点不能移入另一个渲染接口，因为原生资源仍属于原管理器。
可使用 `clone()` 创建独立子树。使用同一渲染接口的上下文之间可迁移节点并保留身份。

字体源数据与缓存的生命周期见 [字体指南](fonts.zh-CN.md)。

## 编译滤镜与着色器

`context.getRenderManager()` 和 `element.getRenderManager()` 返回管理器的
唯一包装器；没有管理器的元素返回 `null`。使用同一渲染接口的上下文共享管理器。
`new RenderManager(renderer)` 创建由运行时持有至关闭的独立原生管理器，
即使 JS 包装器已回收，字体层纹理缓存仍保持有效。
关闭时先释放字体及缓存字形纹理，再销毁这些管理器。

```ts
const manager = context.getRenderManager();
const compiled = manager.compileFilter('blur', { sigma: 2 });
const handles = new rmlui.FilterHandleList();

compiled.addHandleTo(handles);
console.log(compiled.isValid, handles.size);
compiled.release();
handles.clear();
```

`Filter.compileFilter(element)` 使用元素的管理器调用原生虚函数，并解析相对长度。
自定义 `Filter` 回调返回编译滤镜时，所有权会移交 RmlUi，JS 资源变空。
每个返回资源仅能移交一次，且必须属于接收元素的管理器。
`compileFilter` 和 `compileShader` 分别返回自有 `CompiledFilter` 和
`CompiledShader`。两者提供 `isValid`、可重复调用的 `release()` 和返回 `0n`
的 `invalidHandle()`。默认构造创建空资源；编译不受支持或失败时也返回空资源。
缺失或格式错误的必要参数会抛错。参数复制标量、向量、颜色和颜色停靠值。

`addHandleTo` 忽略空资源，保留顺序和重复项。包装器回收后列表仍持有原生资源；
显式释放会清空底层资源，但不删除已追加的条目。`size` 统计条目数，
`clear()` 释放列表的所有权。不暴露指针值。
关闭运行时会先释放所有编译资源，再销毁管理器。
全局 `releaseRenderManagers()` 使闲置的借用管理器及其资源失效，
保留仍被上下文使用的共享管理器和独立管理器。

渲染器已实现十种内置滤镜、保存透明度掩码、图层、渐变、creation 和显式着色器源码。
参数和原生渲染接口约定见[渲染说明](./rendering.zh-CN.md)。
资源生命周期测试只覆盖实际执行的操作。

未缓存的纹理加载会检查两次 seek、文件长度和实际读取字节数。失败或异常时，
已打开句柄只关闭一次；仅上传成功后更新输出尺寸。文件图片的非预乘透明度只转换一次，
生成纹理的 RGBA 字节已预乘。无效尺寸、缺失或过短像素跨度及 GPU resize 失败时，
原生渲染器返回零句柄，且不记录成功上传。应用回调异常经运行时边界传播。

## 网格、几何资源与纹理视图

`new Mesh(vertexCount, indexCount)` 分配原生向量。`vertices` 是可写
`Uint8Array`，每个 `Rml::Vertex` 占 20 字节：0/4 偏移为 float32 x/y，
8–11 为预乘 RGBA 字节，12/16 为 float32 u/v。`indices` 为 `Int32Array`，
每个三角形三个索引。两个视图在网格回收或运行时关闭后仍保活存储。
`resize()` 在新存储中保留共同前缀；调整后需重新获取视图。

`manager.makeGeometry(mesh)` 校验有限坐标、三角形索引数和索引边界，
保存原生向量快照并清空非空源网格。旧视图不能修改几何资源。
索引向量为空时生成空几何资源，源网格保持原状。
`mesh.isValid` 遵循原生布尔转换，仅检查索引是否非空。

`Geometry.render(translation, texture?, shader?)` 使用 RmlUi 对平移取整，
纹理和着色器必须来自同一管理器。直接调用 RmlUi 绘制前，应先 flush 待提交的
sfml.js 窗口命令。`getMesh()` 返回独立可变副本，空资源或已释放资源会抛错。
`release()` 返回原生网格，`GeometryReleaseMode.ClearMesh` 丢弃网格。
重复释放返回空网格；网格相等性使用原生值比较。

`manager.loadTexture(source, documentPath?)` 返回缓存 `Texture` 视图。
默认系统路径解析器会移除 `source` 开头的 `/`；需要时使用相对资源名和文档路径。
纹理延迟加载：`isValid` 表示存在数据库条目，`getDimensions()` 加载图片，
失败时返回零尺寸。`equals()` 比较原生管理器和数据库身份。
`new Texture()` 创建空视图。

包装器回收后，几何资源和纹理视图仍保留独立管理器。闲置借用管理器被释放或运行时关闭时，
这些资源失效。`releaseTexture` 和 `releaseCompiledGeometry` 仅清理 GPU 数据，
存活视图和网格几何仍可复用。[回调纹理](./render-state.zh-CN.md#callback-textures)
支持延迟字节生成、句柄转移和图层快照，并保留原生所有权。

## 类型化顶点与精灵表

`new Vertex()` 持有一个原生顶点，`mesh.getVertex(index)` 映射已有条目。
`position`、`colour`、`texCoord` 读取时返回字段副本，赋值时写入全部分量；
`positionView`、`colourView`、`texCoordView` 直接共享原生内存。
新增顶点默认为零向量和不透明黑色（`red/green/blue = 0`，`alpha = 255`）。
颜色输入使用预乘字节，不自动预乘。`equals()` 按字段比较，有符号零相等，NaN 不相等。
扩容、几何转移、回收和关闭后，旧顶点视图仍保活原始分配。

`new TextureSource(source?, documentPath?)` 保留两个输入字符串，并按渲染管理器缓存纹理。
`getSource()`、`getDefinitionSource()` 返回原始字符串，
`getTexture(manager)` 返回延迟加载的 `Texture` 视图。
绑定层保活缓存中的管理器，释放闲置管理器时重置缓存，之后可通过有效管理器复用；
关闭运行时使纹理源失效。`TexturedMesh` 是 `{ mesh, texture }` 记录，
`TexturedMeshList` 是有序数组。将网格传入 `makeGeometry()`，纹理传入
`Geometry.render()`。

`SpritesheetList` 持有原生集合。
`addSpriteSheet(name, imageSource, definitionSource, definitionLineNumber,
displayScale, definitions)` 接收像素单位的 `[name, { p0, p1 }]` 精灵二元组，
复制输入并覆盖重名精灵。`merge(other)` 追加精灵表并覆盖重名条目；自合并使用源快照。
`reserve(sheets, sprites)` 预留容量，不改变 `numSpriteSheets()`、`numSprites()`。
`getSprite(name)` 返回 null 或 `{ rectangle, spriteSheet }` 快照。

`Spritesheet` 包含 `name`、`definitionLineNumber`、`displayScale`（resolution 的倒数）
及独立的 `textureSource`，构造函数与上游一致，依次接收名称、源、文档路径、行号、比例。
返回的元数据在插入、合并和列表回收后保持稳定；编辑快照不改变列表。
`SpriteMap` 将名称映射到快照；纹理源仍遵循上述运行时生命周期。

## Decorator 实例化与手动元素数据

`new DecoratorInstancer(callback)` 接收同步
`(name, properties, active) => Decorator | null` 工厂。
使用 `registerProperty`、`registerShorthand` 注册局部属性，再通过
`DecoratorInstancer.register(name, instancer)` 注册工厂。已注册及被替换的实例器
保留至运行时关闭，因为已解析声明仍可能引用它们。未注册的回调循环引用可被回收。

`active` 是仅在此次回调中有效的 `DecoratorInstancerInterface`，也支持嵌套委托。
`getSprite(name)` 返回元数据副本，`getTexture(filename)` 按声明来源解析路径，
`getRenderManager()` 返回受检查的管理器。回调返回或抛错后，保存的接口均不可使用；
返回资源各自遵循其生命周期。缺少属性来源时，纹理为空。

```js
const builtin = rml.DecoratorInstancer.get('horizontal-gradient');
const defaults = new rml.PropertyDictionary();

builtin.getPropertySpecification().setPropertyDefaults(defaults);
rml.DecoratorInstancer.register('delegated',
  new rml.DecoratorInstancer((_name, _properties, active) =>
    builtin.instanceDecorator('horizontal-gradient', defaults, active)));
```

传入字典必须包含所有已注册属性及默认值；回调接收副本。实例化可能在文档加载时发生。
回调中不可修改 DOM、注册属性、关闭运行时或递归调用同一实例器。
RmlUi 可能缓存同一装饰器供多个元素使用，并多次生成元素数据。

`decorator.generateElementData(element, paintArea = BoxArea.Padding)`
返回自有 `DecoratorData` 或 null；区域必须为具体盒区域，不能为 `Auto`。
`renderElement(element, data)` 检查原装饰器、元素及管理器；直接绘制前应 flush
待提交的 SFML 命令。`releaseElementData(data)` 仅释放一次，装饰器有效期间可重复调用，
原元素销毁后也可释放。GC 释放遗弃数据；管理器释放会使装饰器失效，并先释放其手动数据。
手动数据独立于 RmlUi 为样式元素自动管理的数据。

`new Decorator<Data>(manager, callbacks)` 用同步 JavaScript 实现三个原生虚函数。
`generateElementData(element, paintArea)` 返回数据对象或 null，null 禁用绘制。
`renderElement(element, data)` 和 `releaseElementData(data)` 接收同一对象。
不接受 Promise 或基本类型数据。回调可读取元素、创建、绘制和释放几何资源；
不允许修改 DOM、关闭运行时或递归调用同一装饰器回调。

自定义装饰器支持 `addTexture(texture)`、`getNumTextures()` 和
`getTexture(index = 0)`。纹理必须属于同一渲染管理器；添加无效纹理返回 -1，
重复添加复用原索引，越界读取返回无效纹理。这些受保护操作仅开放给自定义装饰器。

原生文档和全局样式缓存保留回调，包括未激活的媒体块。JS 持有的样式表、容器、
显式实例化接口和脱离文档的树通过 GC 可见的引用保留回调，废弃闭包循环仍可回收。
手动数据独立持有资源，保留元素不会保留为它创建的全部手动数据。

显式释放数据会在最外层 RmlUi 调用返回前执行释放回调。原生清理将回调推迟到安全的运行时边界，
不在 GC 析构阶段执行 JavaScript。GC 触发的释放在下次 RmlUi 调用时处理；
数据或闭包已被回收则跳过。需要确定性清理时必须显式释放。关闭运行时先释放
存活的手动数据，再使管理器失效并清除回调闭包。

## 样式表与显式实例化接口

`StyleSheetContainer` 持有解析后的 RCSS 与媒体块。
`loadStyleSheetContainer(source, sourceUrl = '', beginLineNumber = 1)`
从文本加载，URL 用于解析相对资源，正整数行号记录来源位置。
返回上游解析器的布尔值；解析失败时可能保留部分规则。
加载和合并须在编译前完成。`mergeStyleSheetContainer(other)` 拒绝已编译的
接收者和自身合并；`combineStyleSheetContainer(other)` 返回未编译的合并容器。

`updateCompiledStyleSheet(context)` 根据视口、密度和主题计算媒体查询。
`getCompiledStyleSheet()` 在编译前返回 null，编译后返回受检查的只读
`StyleSheet` 视图。更新返回 true 时，此前所有视图均失效，即使对应媒体块仍
被保留；返回 false 时视图保持有效。视图保留原生容器存储，不依赖 JS 包装器。

`sheet.combineStyleSheet(other)` 创建独立的可修改样式表。
仅自有合并结果支持 `mergeStyleSheet(other)` 与 `buildNodeIndex()`；
匹配元素前须构建索引。`getSprite`、`getNamedDecorator` 和 `getKeyframes`
返回独立元数据及属性字典，不存在时返回 null。合并时后面的同名装饰器和动画
覆盖前面的声明。

`getElementDefinition(element)` 根据元素层级匹配选择器，返回不可变的原生
`ElementDefinition`；没有匹配或传入文本节点时返回 null。
`getProperty(id)`、`getCustomProperty(name)`、`getPropertyIds()` 与
`getProperties()` 返回独立副本。元素销毁和后续样式表合并不影响已有定义，
shutdown 使其失效。合并后须重建索引，再查询更新后的定义。

`element.getStyleSheet()` 返回所属文档的编译视图。
`document.getStyleSheetContainer()` 保留只读容器，其 load、merge、update
操作会抛出异常。`document.setStyleSheetContainer(container)` 保留原生容器
并编译媒体查询，null 清除样式表规则；调用 `updateDocument()` 应用样式与布局。
媒体变化会使旧编译视图失效，多个文档共享容器时也适用。文档销毁或替换样式表后，
已保留的容器及未重新编译的视图仍有效。`reloadStyleSheet()` 从仍可读取的
原始文档 URL 重载 style 标签与链接的 RCSS，保留 DOM 和行内属性。

`new DecoratorInstancerInterface(manager, sheet, source = null)` 保留原生
管理器和样式表，并复制 `PropertySource`，可在工厂回调外传给
`instancer.instanceDecorator`。来源为 null 时，文件名纹理请求返回空纹理。
显式接口随样式表或管理器失效；回调提供的接口仍在回调退出时失效。
shutdown 使样式表和容器全部失效。

`sheet.instanceDecorators(manager, declarations, source = null)` 返回共享装饰器
的独立数组。非空声明文本按文本、来源路径和渲染管理器缓存；空文本每次重新实例化。
合并会清空样式表缓存；管理器销毁前释放属于它的缓存实例。返回的装饰器在来源样式表
被回收后仍有效，但始终绑定原管理器。工厂异常会向调用方传递；原生实例化失败返回
空数组。[Stream 输入](./streams.zh-CN.md)支持文件、内存和同步回调。

## Factory 解析与缓存

`Factory.instanceElement(parent, instancer, tag, attributes = {})` 使用独立
标签及自有 Variant 属性调用原生实例器。返回节点保留实际原生子类型，
在 `parent.appendChild(node)` 前保持游离。支持 null 父节点；实例化失败
返回 null。已注册的 `*` 实例器提供上游未知名称回退。属性禁止保存借用元素指针。

`Factory.instanceElementText(parent, text)` 翻译文本、解码实体，并追加原生
文本或 RML 子节点。纯空白不添加子节点。`instanceElementStream(parent, stream)`
使用流当前位置及来源 URL 解析。两者保留原生解析结果及部分写入行为。
RmlUi 6.3 的流辅助函数在语法诊断后仍返回 true；宿主流读取失败会传播异常。
禁止向上下文根节点添加子节点；回调重入时拒绝解析。

`instanceStyleSheetString(text)`、`instanceStyleSheetFile(filename)` 和
`instanceStyleSheetStream(stream)` 返回自有未编译容器，解析失败返回 null。
文件加载使用已安装的原生文件接口，打开失败返回 null。没有解析到规则时返回 null；
语法诊断后仍可能返回部分解析的容器。
通过 `document.setStyleSheetContainer(container)` 应用结果。

`Factory.clearStyleSheetCache()` 和 `Factory.clearTemplateCache()` 影响后续加载，
仍被持有的容器及编译视图保持有效。回调重入时拒绝缓存变更。
`isStructuralDataView(name)` 使用精确无前缀名称，如 `for`；
`getStructuralDataViewAttributeNames()` 返回包含完整 `data-` 属性名的独立数组。
关闭运行时会使返回的原生持有者失效。

[元素工厂](../../packages/sfml.js-rmlui/examples/factory-elements.cjs)
应用验证原生输入控件、解析子节点和缓存清理。

## 元素实例器

`ElementFormControl.createInstancer(valueAttribute = 'value')` 提供不含 JS 回调的
原生表单控件分配器，原生虚方法值保存在指定属性中。它沿用其他实例器的受检
分配、克隆和释放来源记录。共享数据更新、直接分配的属性语义和提交标签规则
见 [表单控件](./controls.zh-CN.md)。

`Factory.getElementInstancer(tag)` 返回唯一 `ElementInstancer` 包装器或 null，
未知标签使用已注册的 `*` 回退。原生注册名转为小写，查询键保持精确匹配。
`Factory.registerElementInstancer(name, instancer)` 保留适配器至关闭，
包括被替换后仍服务于已有元素的适配器。
传入 null 禁用此精确名称；禁用 `*` 时也会移除未知名称回退。

```js
const input = Factory.getElementInstancer('input');
const custom = new ElementInstancer((parent, tag, attributes) =>
  input.instanceElement(parent, tag, attributes), snapshot => {
  console.log('Released', snapshot.tagName, snapshot.attributes);
});

Factory.registerElementInstancer('account-control', custom);
const field = Factory.instanceElement(null, 'account-control', 'account', {
  type: 'text', value: 'Native control',
});

custom.releaseElement(field);
```

分配回调返回 null，或由其他实例器的
`instanceElement(parent, tag, attributes = {})` 创建的游离节点。
直接调用遵循分配器本身的行为；Factory 随后设置属性并通知插件。
Factory 和 clone 保留原生子类型及原始分配器，支持嵌套适配器。
返回借用、已挂接、正在调用或没有分配来源记录的节点时拒绝转移。
回调输入属性和释放通知均使用独立副本。

`releaseElement(element)` 仅接受由此确切适配器分配的自有游离节点，
原生销毁后所有包装器别名失效。原生同步销毁；可选释放通知在随后的安全边界
接收销毁前的 `{ tagName, attributes }` 快照。原生析构不调用 JS，
包括分配回调内部发生 GC 时。GC 通知在下一次原生调用且观察回调仍可达时执行；
已被回收的观察回调和环境清理不调用 JS。通知异常会传播，原生销毁仍完成。

回调可通过其他实例器分配并检查值副本；拒绝 DOM 变更、注册变更和递归。
已注册适配器保活至关闭；未注册适配器通过原生树或游离持有者的可见引用保活，
允许循环垃圾回收。关闭使适配器失效，并在原生池销毁前释放元素。
元素工厂应用验证自定义输入控件的分配和释放。

## 上下文实例器与自有文档流

`new ContextInstancer()` 使用原生上下文构造函数。

`new Context(name, manager, handler)` 直接构造自有原生上下文，
不选择已注册的 Factory 适配器。保留零尺寸及密度 1，不进入 Core 注册表，
不发送插件创建通知，通过 `remove()` 或 GC 释放。输入处理器必须显式传入，
null 保持 null。`context.getTextInputHandler()` 返回确切的受检借用处理器，
或 null。自定义处理器和原生组合输入会话见[文本输入](./text-panels.zh-CN.md)；
真实输入法验收单独记录在 [IME 检查点](./audit/6.3/native-ime-checkpoint.md)中。

上下文构造要求 `*` 实例器返回非空根元素、`body` 实例器返回 `ElementDocument`。
禁用、拒绝分配或错误文档类型会在解引用前抛出异常，回调错误保留原始身份。
构造失败会销毁已分配的部分元素，不会加入 Core 注册表。

`new ContextInstancer(create, release?)` 通过另一有类型的实例器委派分配，
并在原生销毁后的安全边界接收 `{ name }`。返回的分配必须符合请求的名称、
渲染管理器和原生文本输入处理器。null 拒绝创建，回调异常会传播。
嵌套适配器按外层到内层通知释放。

`Factory.registerContextInstancer(instancer)` 选择 `createContext` 使用的适配器，
并将其保活至关闭，包含已被替换的适配器。
`Factory.instanceContext(name, manager, handler)` 和
`instancer.instanceContext(name, manager, handler)` 返回不进入 Core 注册表的
自有上下文。无原生文本输入处理器时传 null。原生默认尺寸为零，
布局前调用 `setDimensions`。子节点通过 V8 可见引用保活上下文，闭包循环可以回收。
`context.remove()` 释放此分配，不移除同名已注册上下文；
`instancer.releaseContext(context)` 还验证确切外层分配器，并拒绝已注册上下文。
全局字体资源或渲染管理器释放前必须先释放自有上下文，
因为上游资源失效处理只遍历已注册的 Core 上下文。

`Factory.instanceDocumentStream(context, stream, documentBaseTag)` 使用流来源 URL
和原生文档头处理解析自有游离文档。基础标签选择文档分配器，源文本仍使用 `body`
等已注册 XML 处理器。创建不插入上下文，也不派发上下文加载通知。
子节点保活文档；上下文移除时，在借用资源释放前销毁这些文档。
流错误抛出异常；原生语法诊断可能产生部分文档。

```js
const custom = new ContextInstancer((name, manager, handler) =>
  new Context(name, manager, handler));

Factory.registerContextInstancer(custom);
const owned = Factory.instanceContext(
  'independent', context.getRenderManager(), null);

owned.setDimensions(760, 480);
const parsed = Factory.instanceDocumentStream(owned, new StreamMemory(
  Buffer.from('<rml><head/><body id="parsed"/></rml>')), 'body');

console.log(parsed.id, owned.getNumDocuments()); // parsed, 0
owned.remove();
```

## 事件实例器与自有事件

`new EventInstancer()` 分配原生事件。自定义创建回调通过另一实例器分配并返回其自有
`RmlEvent`；返回 null 拒绝创建。目标、编号、类型及中断标志必须符合请求，
参数可以自定义。所有权转移后，源事件句柄失效。
`Factory.registerEventInstancer(instancer)` 接入真实原生派发；
已注册适配器（包括被替换者）保活至关闭。

`Factory.instanceEvent(target, id, type, parameters, interruptible)` 及
`instancer.instanceEvent(...)` 返回尚未派发的自有事件。
`event.setPhase(phase)`、`event.setCurrentElement(elementOrNull)` 调用原生设置器，
包含鼠标投影，并更新保留字段。传播和参数方法要求事件仍然有效；
自有事件还校验目标、当前元素及参数元素的原生观察指针。
`event.release()` 释放任意自有事件；`instancer.releaseEvent(event)` 还要求确切的
外层分配器。两者都拒绝派发回调中的借用事件。GC 和关闭也会删除自有事件。
复制字段在释放后仍可读取。释放回调在原生删除后的安全边界接收 `{ type, id }`，
从最外层开始通知。环境清理不调用 JS。

```js
const allocator = new EventInstancer();
const custom = new EventInstancer((...args) =>
  allocator.instanceEvent(...args), snapshot => console.log(snapshot.type));

Factory.registerEventInstancer(custom);
const id = registerEventType('account-save', true, true);
const event = Factory.instanceEvent(input, id, 'account-save',
  { value: input.getValue() }, true);

event.setPhase(EventPhase.Target);
event.setCurrentElement(input);
console.log(event.getParameter('value', ''));
event.release();
```

## 原生事件监听器与内联属性

`new EventListener(process, attach?, detach?)` 创建原生监听器。
将它传给 `element.addEventListener(type, listener, capture?)`，
再用相同参数调用 `removeEventListener` 解绑。同一监听器支持多个元素、
事件类型和捕获阶段；重复注册只生效一次。原生元素持有期间回调保活，
脱离元素树的元素与回调循环可回收。

`EventListenerInstancer(create)` 接收确切的内联属性值和请求元素，
返回活跃 `EventListener` 或 null。
`Factory.registerEventListenerInstancer(instancerOrNull)` 控制真实 RML
`on*` 属性；实例器保活至替换或关闭。属性字符串不会作为 JavaScript 执行。
替换或移除属性会解绑旧监听器。实例化回调可读取元素的 `id`、`tagName`
并创建监听器；禁止修改 DOM。
`Factory.instanceEventListener(value, element)` 和
`instancer.instanceEventListener(value, element)` 返回尚未挂载的监听器，
挂载前必须保留该对象。

挂载与解绑回调接收挂载时复制的 `{ id, tagName }`。
每个真实注册在原生调用栈返回后的外层安全边界通知一次。
环境清理不执行 JavaScript。手动 `listener.onAttach(element)`、
`onDetach(element)` 发送通知；真实注册通过元素派发器完成。
`listener.processEvent(event)` 不派发事件，向回调提供限期借用事件，
处理期间禁止释放、转移或递归处理源事件。
全部解绑后，可用 `listener.release()` 销毁不活动的监听器。
关闭使监听器和实例器失效，并清除回调持有关系。

```js
Factory.registerEventListenerInstancer(new EventListenerInstancer(
  (action, element) => new EventListener(event => {
    if (action === 'save') {
      console.log(element.id, event.type);
    }
  })));
button.setAttribute('onclick', 'save');
button.click();
button.removeAttribute('onclick');
```
