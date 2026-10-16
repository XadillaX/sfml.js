# 旧示例迁移版

本目录对应旧版 `example/` 的 16 个脚本，文件名保留，扩展名使用 `.cjs`。14 个脚本使用新版 API 运行；2 个依赖旧 `drawAsync/displayAsync` 的脚本保留原演示逻辑，但当前无法执行，在启动时报告 `UNSUPPORTED` 并以状态码 2 退出。

迁移只适配导入路径、SFML 3 的参数与方法名、JS 值类型及异步加载。原来的示例数据、输出调用、场景参数、动画公式、绘制顺序、键盘鼠标逻辑、文件输出和帧调度保留。图片、字体和音频复制自原示例，位于 `assets/`。

在项目根目录执行：

```sh
# 首次构建包含 Native 模块
npm run build

# 打开综合窗口
npm run demo:ported

# 运行任意一个迁移脚本
node examples/ported/texture.cjs
node examples/ported/sound_buffer.cjs

# 验证运行结果，分别报告通过与不支持
npm run test:ported
```

## 示例入口

| 文件 | 演示内容 |
|------|----------|
| color.cjs | 颜色构造、分量写入和 JSON 输出 |
| vector2.cjs | 二维向量、标量转换、复制与具名运算 |
| vector3.cjs | 三维向量、标量转换、复制与具名运算 |
| time.cjs | 时间工厂、bigint 微秒与 Time.Zero |
| rect.cjs | position／size、包含与相交区域，保留原非法输入演示 |
| video_mode.cjs | 显示模式、尺寸、NaN 输入、桌面与全屏模式查询 |
| vertex.cjs | 顶点成员视图与 VertexArray 访问 |
| joystick.cjs | 摇杆连接、标识、按钮数与轴查询 |
| sensor.cjs | 全部传感器的可用性、启用和读取 |
| touch.cjs | 触摸状态和位置查询 |
| font.cjs | 失败加载、字体加载、码点 1／字号 10 的字形与行间距 |
| texture.cjs | 失败加载、GIF 加载、裁剪、纹理复制与 Sprite |
| sound_buffer.cjs | WAV 解码、PCM 复制、保存与重新加载 |
| render_window.cjs | 原综合场景的形状、顶点线、渐变像素、裁剪、蒙版、Sprite、中文文字及音频 |
| render_window_display_async.cjs | 不支持：原同步／异步 display 对照，缺少 displayAsync |
| render_window_display_draw_async.cjs | 不支持：原异步绘制综合场景，缺少 drawAsync 和 displayAsync |

## 窗口交互

`render_window.cjs` 使用原来的 `VideoMode.getFullscreenModes()[3]`、标题 `hello` 和 style 5。保留红色背景、原场景布局、默认音量、启动时播放一次 Sound、Music 仅设置循环但不播放。保持 `setFramerateLimit(60)` 和 `setImmediate(frame)` 调度。

| 按键 | 行为 |
|------|------|
| Esc／关闭事件 | 关闭窗口，Esc 同时保留实时查询 |
| Left | 将窗口位置的 x／y 各加 1 |
| LControl | 按住时重建为 800×600，并开启垂直同步 |
| LAlt | 打印上下文设置 |
| RAlt | 修改窗口标题 |
| S | 请求显示虚拟键盘，遵循系统支持情况 |

原鼠标逻辑也保留：每帧读取桌面和窗口相对坐标，限制到原 mode 范围后调用 Mouse.setPosition。原按键重复行为保留。

非 Windows 下综合示例仍保存 `/tmp/xxx.png`。SoundBuffer 示例仍保存到 `os.tmpdir()` 下的 `.game.wav`，随后重新加载，不自动删除。

## 迁移约定

两个名称含 async 的入口不使用同步绘制或固定 sleep 模拟旧接口。display 对照代码保留 10 帧、50 ms 心跳、setImmediate 包装、displayAsync 和关闭后错误检查；综合异步场景保留逐次 await drawAsync/displayAsync。

坐标和尺寸使用 Vector2，旋转使用 Angle，颜色使用 Color，事件通过 `is/getIf` 读取，数值枚举遍历过滤反向映射。加载操作检查 boolean；原来的缺失路径 `abcdefg`／`abc.jpg` 保留。console.log／JSON.stringify 直接接收新版对象，展示形式遵循新版类型本身；整数转换和非法值处理也遵循新版值类型，不在示例层模拟旧校验。

各脚本独立包含演示逻辑，不再使用共享场景或输出格式化辅助函数。原来的同步资源加载改为按原顺序 await，没有改为并行预加载。

`test:ported` 使用独立测试预加载脚本，正常运行示例不加载它。测试期间选择空音频设备，检查鼠标设置但不移动系统指针，文件输出放入隔离目录；虚拟显示器不足四种全屏模式时，测试使用桌面模式补齐选项。综合窗口执行 8 帧后由测试脚本关闭，逐帧检查原布局、颜色、点数、缩放、文字和顶点线。最终分别报告 14 个通过、2 个不支持，不把不支持计为迁移成功。验证环境为 macOS arm64、Node.js 22.22.2。
