# 字体

初始化前可选定原生 FreeType、HarfBuzz 或位图引擎。未选定时，
初始化自动创建默认 FreeType 引擎：

```js
const rmlui = require('sfml.js-rmlui');
const engine = new rmlui.FontEngineInterface();

rmlui.setFontEngineInterface(engine);
rmlui.initialise(window);
engine.loadFontFace('regular.ttf', 'application-font', rmlui.FontStyle.Normal);
const face = engine.getFontFaceHandle(
  'application-font', rmlui.FontStyle.Normal, rmlui.FontWeight.Normal, 20,
);

if (face) {
  const shaping = new rmlui.TextShapingContext('en');

  shaping.letterSpacing = 1;
  const widths = engine.getStringWidths(face, [ 'one', 'two' ], shaping);
  const metrics = engine.getFontMetrics(face);

  console.log(widths, metrics.ascent, metrics.lineSpacing);
}
```

`getFontEngineInterface()` 返回选定引擎的唯一包装对象，未选定及 shutdown 后为
`null`。初始化前用 `setFontEngineInterface(null)` 恢复自动选择。只有已选定且
运行中的引擎可操作字体。构造额外引擎不会初始化上游的全局 provider；
Initialize 和 Shutdown 均由 Core 调用。默认布局、字形生成和图集管理在 C++ 执行。

字体与特效句柄是不透明 Native 令牌，字体释放、管理器释放或关闭后失效。
`prepareFontEffects(face, effects)` 返回绑定该字体及字体代次的令牌。
`generateString(manager, face, effects, text, position, colour, opacity, shaping)`
返回整数宽度和有序 `TexturedMeshList`。网格持有共享顶点和索引快照；
图集纹理属于其渲染管理器，字体释放后失效。颜色使用预乘 RGBA 字节；
opacity 应用于特效，默认为一。直接生成文本时，Native 先加载冷字形，再构建图集。
加载新字形后重建图集会使旧纹理视图失效；持有的网格字节仍然有效。

`FontMetrics.values` 共享独立 Native 快照，依次为上升、下降、行距、x 高度、
下划线位置和厚度。`TextShapingContext.enums` 共享 Direction 和 FontKerning，
`values` 共享字母间距。原生操作在使用前校验并快照排版参数。
`getStringWidths` 一次进入 Native 测量数组，返回 Native 持有的共享 int32 宽度。
这些数值分配在回收与关闭后仍有效；编辑度量快照不会改变引擎缓存。

`FontMetrics.size` 和 `hasEllipsis` 读取复制后的整数、布尔字段。六个浮点
getter 直接读取对应的 `values` 项，不进入 Native。上升距离以基线上方为正，
下降距离和下划线位置以基线下方为正；下划线位置也可以为负数。

整形参数默认为空语言、`Style.Direction.Auto`、`Style.FontKerning.Auto`
和零间距。数值 getter、setter 使用共享视图；语言读取、替换进入 Native。
自定义回调中替换语言不会改变当前整批调用的冻结参数。上下文可在初始化前
创建，并在关闭后复用；仍受运行时所属环境约束。默认 FreeType 引擎在
`Style.FontKerning.None` 之外启用字偶距，每个字形的字母间距截断为整数。
语言和方向传入字体引擎；FreeType 不执行复杂文字整形，需要具备相应能力的引擎。

重复测量时，一次分配固定的 `FontMeasureBuffer`：

```js
const buffer = new rmlui.FontMeasureBuffer(2, 64);

buffer.append('one');
buffer.append('two');
const widths = engine.measureStrings(face, buffer, shaping);

buffer.clear();
buffer.append('next');
engine.measureStrings(face, buffer, shaping); // 复用同一个 widths。
```

`bytes` 共享打包 UTF-8，`offsets` 保存行边界，`widths` 是固定共享输出。
直接写入字节和边界时，通过 `measureStrings` 的第五个参数指定有效行数。
边界从零开始，不递减，且不能超过字节容量。Native 先校验全部有效 UTF-8
片段，再写入输出；无效行保留原值。公开缓冲的线程转移被拒绝或产生独立拷贝。
直接调用 `ArrayBuffer.transfer()` 会使测量缓冲失效；后续测量拒绝分离视图，
转移后的存储仍保活。
测量复用输入及输出存储；冷字形加载仍可能分配内存。`append` 在准备输入时
执行 UTF-8 编码。

先初始化 RmlUi，再加载字体，最后加载文档。`loadFontFace` 对应
`Rml::LoadFontFace` 的三个重载：

```js
const fs = require('node:fs');
const { loadFontFace, FontStyle, FontWeight } = require('sfml.js-rmlui');

loadFontFace('regular.ttf');
loadFontFace('collection.ttc', false, FontWeight.Normal, 1);
loadFontFace('regular.ttf', 'application-font', FontStyle.Normal);
loadFontFace(
  fs.readFileSync('italic.ttf'),
  'application-font', FontStyle.Italic, 530, true, 0,
);
```

第一种形式使用字体内部的字体族和样式。指定名称的文件及内存形式将参数中的
字体族、样式注册供 RCSS 使用；空字体族恢复元数据中的字体族和样式。
文件路径经当前文件接口解析，包括 `initialise(window, { fileRoot })` 的根目录。

`FontWeight.Auto`（0）自动识别字重，并加载可变字体的所有可用字重。
1–1000 的整数用于选择可变字体的字重，或覆盖静态字体注册时的字重。
`Normal` 为 400，`Bold` 为 700。集合索引默认为 0，字重默认为 Auto，
后备标记默认为 false。后备字体补齐其他字体缺失的字符。
重复注册原生字体不会更新已有字体的后备状态。

布尔返回值遵循 RmlUi：文件不存在、数据无效或集合中没有对应字体时返回 false。
参数类型或范围不合法时抛出异常。加载为同步操作，必须在运行时所属环境中、
事件回调之外执行。

内存输入支持 Buffer、Uint8Array 及其子视图。原生代码只复制视图范围内的字节，
返回后调用方可以修改、转移或回收输入。共享或已分离的缓冲区会被拒绝。
副本保留至 `shutdown` 之后；失败的加载也保留，因为字体集合可能已部分注册。

默认引擎的 `releaseFontResources()` 释放字形和纹理缓存，使原生字体句柄失效并更新所有上下文。
已注册字体和源字节仍然保留，后续布局和渲染可重建缓存。
必须在已初始化的运行时中、事件回调之外调用。

## 内置引擎与能力查询

```js
const engine = new rmlui.FontEngineInterface('harfbuzz');

engine.registerLanguage('ar', 'Arab', 'rtl');
rmlui.setFontEngineInterface(engine);
rmlui.initialise(window);
engine.loadFontFace('Cairo-Regular.ttf', 'arabic', rmlui.FontStyle.Normal);
console.log(engine.kind, rmlui.getCapabilities());
```

构造参数支持 `freetype`、`harfbuzz`、`bitmap` 或同步自定义回调。
`kind` 返回该类型，自定义回调返回 `custom`；关闭后读取旧引擎会报错。
切换引擎需要先关闭运行时，再构造并选定新引擎。

HarfBuzz 15.1.0 在 C++ 中处理文字簇、连接字形和连字，与默认引擎共用
同一份编译后的 FreeType。它遵循语言、方向、字偶距和整数间距；上游实现
忽略测量的前一个字符。`registerLanguage` 将 BCP47 标签映射到四字母
ISO15924 文字代码及 `ltr`／`rtl`，供 Auto 方向使用，须在初始化前调用。
支持文件、指定名称的文件及内存加载；文件重载的适配器保留字节直到引擎关闭。

位图引擎读取上游单页 XML `.fnt` 及相对路径图集，使用图集宽度和字偶距，
测量包含传入的前一个字符。字号由图集固定；字体族、样式和字号使用上游的
宽松最佳匹配。它忽略文字整形、间距、字偶距开关和字体效果，包括特效透明度。
普通内存字体加载返回 false。上游 Debugger 的特殊字体族会报告成功，
但不加载内嵌字体，实际使用已加载的位图字体。

`getCapabilities()` 可在初始化前、运行中及关闭后读取独立快照。
`compiled` 表示已链接到二进制；`available` 表示当前运行时可使用。
模块要求已初始化；字体还要求被选定。初始化前的选择记录在
`selectedFontEngine` 中，此时字体仍不可用。模块可用不表示已创建 Lua 宿主
或显示 Debugger。字体特征标记描述实现语义；使用时仍须检查 `compiled`
和 `available`。自定义引擎的能力由回调实现决定。

两个替代引擎默认参与编译。在现有包目录构建时可关闭：

```sh
GYP_DEFINES="rmlui_harfbuzz=0 rmlui_bitmap_font=0" npm run build
```

两个开关各自使用 0 或 1。构造未编译的引擎会报错，不自动回退。
依赖安装仍校验锁定的归档。各配置复用现有构建目录；跨平台与全项目验收
和本地字体测试分别记录。

## 自定义字体引擎

构造时传入同步的 `FontEngineCallbacks`，实现上游字体虚函数。Core 调用
初始化和关闭回调；三个加载回调分别接收文件元数据、指定名称和独立内存字节。
在初始化或字体选择阶段，通过 `engine.createFontFace(metrics, advances?)`
注册字体。令牌绑定本引擎及字体代次。可选度量、版本回调刷新 Native 数值；
省略时使用注册度量和共享的 `face.version`。

`FontAdvanceTable` 在 Native 存储独立码点宽度。修改 `face.advances` 后递增
`face.version[0]`，使已生成几何失效。该路径支持字距，不计算字偶距或整形。
需要上下文测量时，使用紧凑回调：

```js
let customFace;
const custom = new rmlui.FontEngineInterface({
  initialize() {
    customFace = custom.createFontFace({
      size: 20, ascent: 15, descent: 5, lineSpacing: 20, xHeight: 10,
      underlinePosition: 2, underlineThickness: 1, hasEllipsis: true,
    });
  },
  getFontFaceHandle() {
    return customFace.handle;
  },
  measureStrings(face, packed, count, shaping, priorCharacter) {
    for (let i = 0; i < count; ++i) {
      packed.widths[i] =
        (packed.offsets[i + 1] - packed.offsets[i]) * 7;
    }
  },
});

rmlui.setFontEngineInterface(custom);
rmlui.initialise(window);
```

此例仅按 ASCII 字节计算宽度。渲染自定义文本还需实现 `generateString`，
返回整数宽度和带 Texture 视图的自有网格。`prepareFontEffects` 可返回由
引擎保活的不透明数据，随后传入几何生成回调。Native 接管网格，并校验字体、
特效、纹理的代次。

紧凑回调接收 Native UTF-8 快照、uint32 边界和 int32 结果。每个非空批次
调用一次，不逐文本创建 JS 字符串；上游逐文本请求也走此回调，count 为一。
写满有效宽度并返回 `undefined`。Native 仅在成功且输入、输出仍附加时写回。
抛错、Promise、重入 Core 或分离视图均拒绝本次调用，原始宽度不发生部分写入；
Native 码点表溢出也保留整批原始输出。

工作区按几何级数扩容，稳态调用复用同一对象和数组。仅复制有效输入字节、
边界及输出宽度。后续调用覆盖保留的工作区视图。扩容或分离时替换工作区，
旧数组在 GC、关闭后仍保活纯 Native 存储。Worker 转移被拒绝或产生独立拷贝。
`getStringWidths`、`getStringWidth` 回调保留兼容路径，需生成 JS 字符串；
逐文本回调每行调用一次。

自定义引擎释放资源时，先使字体、特效令牌失效并释放工作区，再调用
`releaseFontResources` 回调。释放后或后续字体选择时重新注册字体。保留的
数值数组仍然内存安全。自定义引擎能力由回调决定；按名称选择内置引擎，
可使用 HarfBuzz 或上游位图引擎。

在包目录执行 `node tools/performance/measure-custom-font-performance.cjs`，
对比 1,000、10,000、100,000 行同输出的 Native、紧凑 JS 和逐文本兼容测量。
计时不包含初始化、布局、渲染、呈现或 GPU；JSON 记录 p50/p95、双向调用、
分配和显式拷贝计数。
