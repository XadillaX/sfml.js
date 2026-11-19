# 原生几何与卷积

`MeshUtilities` 将上游四边形、线条、背景和边框几何追加到 Native 持有的
`Mesh`。`ConvolutionFilter` 在字节视图上执行上游 alpha 滤镜。这些值工具在
初始化前和关闭后仍可使用；创建可渲染 `Geometry` 需要有效的渲染管理器。

## 网格生成

```js
const { Mesh, MeshUtilities, RenderBox } = require('sfml.js-rmlui');
const mesh = new Mesh();
const colour = { red: 60, green: 30, blue: 10, alpha: 120 };

MeshUtilities.generateQuad(mesh, { x: 2, y: 3 }, { x: 4, y: 5 }, colour);
MeshUtilities.generateLine(mesh, { x: 0.4, y: 0.6 }, { x: 2.4, y: 1.6 }, colour);
const box = new RenderBox(
  { x: 30, y: 20 }, { x: 2, y: 3 }, [ 1, 2, 3, 4 ], [ 15, 9, 7, 5 ]);

MeshUtilities.generateBackgroundBorder(
  mesh, box, colour, [ colour, colour, colour, colour ]);
```

颜色必须是已经预乘的 RGBA 字节，接口不自动预乘。`generateQuad` 默认使用
`(0,0)` 和 `(1,1)` 两个 UV 角，也可通过最后两个参数指定。
`generateLine` 将两条边吸附到像素网格。背景使用 `RenderBox` 的边宽、偏移和
圆角半径；alpha 为零的背景或边框不生成几何。

追加时，索引包含已有顶点的偏移。若已导出的顶点或索引视图保活旧分配，
Native 只复制一次前缀，让旧视图保持独立；没有保活视图时，复用网格并按
几何倍数扩容。追加后需重新获取视图。`RenderManager.makeGeometry(mesh)`
会校验并快照生成的网格。

## 共享命令批次

```js
const commands = MeshUtilities.allocateCommands(2);

commands.set([ 0, 2, 3, 4, 5, 60, 30, 10, 120, 0, 0, 1, 1 ]);
commands.set([ 1, 0.4, 0.6, 2.4, 1.6, 60, 30, 10, 120 ],
  MeshUtilities.commandStride);
const batched = new Mesh();

MeshUtilities.append(batched, commands);
```

返回的 `Float32Array` 由 Native 持有，可直接写入。每批只进入 Native 一次，
先校验全部选中记录，再生成几何，不复制命令缓冲区。
`append(mesh, commands, count)` 执行指定前缀；省略 `count` 时执行全部记录。

每条记录包含 `commandStride` 个字段，当前为 40：

| 字段 0 的操作 | 字段布局 |
| --- | --- |
| 四边形：0 | 1–4：x/y/宽/高；5–8：RGBA；9–12：u0/v0/u1/v1 |
| 线条：1 | 1–4：x/y/宽/高；5–8：RGBA |
| 背景：2 | 1–2：填充尺寸；3–4：边框偏移；5–8：边宽；9–12：半径；13–16：RGBA |
| 背景边框：3 | 背景字段，随后 17–32 按上/右/下/左存储 RGBA |

边宽和半径遵循 `RenderBox` 顺序，保留字段忽略。坐标必须有限，颜色必须是
整数字节，填充尺寸、边宽和半径必须非负。拒绝已分离或使用并发共享后备的缓冲区。

## Alpha 卷积

```js
const { ConvolutionFilter, FilterOperation, ColorFormat } =
  require('sfml.js-rmlui');
const filter = new ConvolutionFilter();

filter.initialise({ x: 1, y: 0 }, FilterOperation.Sum);
filter.kernel.set([ 0.25, 0.5, 0.25 ]);
const source = ConvolutionFilter.allocateBytes(3);

source.set([ 40, 80, 120 ]);
const output = ConvolutionFilter.allocateBytes(3);

filter.run(output, { x: 3, y: 1 }, 3, ColorFormat.A8,
  source, { x: 3, y: 1 }, { x: 0, y: 0 }, ColorFormat.A8);
console.log(Array.from(output)); // [40, 80, 80]
```

`initialise(radius, operation)` 创建方形核，x/y 半径创建矩形核。负半径返回
`false` 并保留旧核；无效枚举或超出分配边界会抛出异常。`getRow(index)`
映射经过校验的行。重新初始化会替换存储；已返回的行和核保留原分配，
在包装器回收和运行时关闭后仍有效。

`run` 只进入 Native 一次。源行紧密排列，目标步长以字节计，只有 alpha 改变；
RGBA 颜色通道和行填充不变。源偏移相对目标原点。缓冲区必须是有效、不重叠
且没有并发共享后备的字节视图。核必须已经初始化，权重必须有限且在安全范围内。
`Sum` 在 255 以上饱和。负 Sum 权重需要额外 Native 预检；任何输出 alpha
为负时，在写入前抛出异常。`Dilation` 选择最大加权 alpha，最小值为零。

值类型和资源生命周期见 [API 指南](api.zh-CN.md)。
