# 功能示例

[English](README.md) · **简体中文** · [日本語](README.ja.md) · [한국어](README.ko.md)

> 在 sfml.js 仓库根目录运行。首次执行 `npm ci`，修改源码后执行 `npm run build`。除 Network 外，各入口都会打开图形窗口，需要显示服务与 OpenGL 支持。

[总览](../README.zh-CN.md) · [官方示例](../official/README.zh-CN.md) · [游戏与应用](../projects/README.zh-CN.md)

构建后可直接运行下列命令；package.json 中的 `demo:*` 脚本会按配置重新构建。关闭窗口即可退出，指定帧数的入口也会自动结束。截图只展示特定场景的渲染结果，不代表性能或设备测试。

仅使用公开 API 的应用请从 [快速开始](../../docs/getting-started.zh-CN.md) 入手。辅助文件归在主入口下，不作为独立程序。

<a id="system"></a>

## System

<div class="example-gallery">
  <article class="example-entry" id="sleep-err">
    <a href="../../assets/examples/features/sleep-err.webp">
      <img src="../../assets/examples/features/sleep-err.webp" width="360" alt="异步等待与 SFML 日志输出">
    </a>
    <div class="example-info">
      <p><strong><a href="../sleep-err.cjs">sleep-err.cjs</a></strong></p>
      <p>异步等待与 SFML 日志输出</p>
      <p><code>node examples/sleep-err.cjs</code></p>
      <p>S 等待两秒，W 写日志，N 触发原生诊断；R 将日志重定向到面板，M 静音，D 恢复 stderr。Esc 退出。</p>
      <p>可选帧数限制：<code>--frames=120</code>。</p>
      <p><code>npm run demo:sleep-err</code></p>
    </div>
  </article>
  <article class="example-entry" id="vector-scalars">
    <a href="../../assets/examples/features/vector-scalars.webp">
      <img src="../../assets/examples/features/vector-scalars.webp" width="360" alt="标量向量的实时共享存储与原生比较">
    </a>
    <div class="example-info">
      <p><strong><a href="../vector-scalars.cjs">vector-scalars.cjs</a></strong></p>
      <p>不同数值标量的向量运算</p>
      <p><code>node examples/vector-scalars.cjs</code></p>
      <p>动态展示不同标量类型的 TypedArray 共享存储与原生对比。Esc 退出。</p>
      <p>不支持 <code>--frames</code>，请关闭窗口停止。</p>
      <p><strong>仓库诊断入口：使用内部原生预览或验证接口，不是仅使用公开 API 的应用模板。</strong></p>
    </div>
  </article>
</div>

<a id="window"></a>

## Window

<div class="example-gallery">
  <article class="example-entry" id="window-demo">
    <a href="../../assets/examples/features/window.webp">
      <img src="../../assets/examples/features/window.webp" width="360" alt="窗口事件、光标和输入诊断">
    </a>
    <div class="example-info">
      <p><strong><a href="../window.cjs">window.cjs</a></strong></p>
      <p>窗口事件、光标和输入诊断</p>
      <p><code>node examples/window.cjs</code></p>
      <p>F1 切换光标，F2 切换光标显隐，F3 切换按键重复，F4 切换 VSync，F5 调整窗口尺寸，F6 切换尺寸限制，F7 修改标题，F8 隐藏后恢复窗口，F9 切换事件处理方式，F10 移动窗口。方向键移动标记，输入文字、Backspace 删除，Esc 退出。</p>
      <p>可选帧数限制：<code>--frames=120</code>。</p>
      <p><strong>仓库诊断入口：使用内部原生预览或验证接口，不是仅使用公开 API 的应用模板。</strong></p>
      <p>辅助文件：<a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:window</code></p>
    </div>
  </article>
  <article class="example-entry" id="system-window">
    <a href="../../assets/examples/features/system-window.webp">
      <img src="../../assets/examples/features/system-window.webp" width="360" alt="System 与 Window 接口">
    </a>
    <div class="example-info">
      <p><strong><a href="../system-window.cjs">system-window.cjs</a></strong></p>
      <p>System 与 Window 接口</p>
      <p><code>node examples/system-window.cjs</code></p>
      <p>C 将示例文字写入系统剪贴板，V 读取剪贴板，A 切换 OpenGL 上下文，Esc 退出。Touch 需要受支持的设备；macOS 触控板手势不是 SFML 触摸事件。</p>
      <p>可选帧数限制：<code>--frames=120</code>。</p>
      <p><code>npm run demo:system-window</code></p>
    </div>
  </article>
</div>

<a id="graphics"></a>

## 图形

<div class="example-gallery">
  <article class="example-entry" id="all-types">
    <a href="../../assets/examples/features/all-types.webp">
      <img src="../../assets/examples/features/all-types.webp" width="360" alt="值类型、变换、形状、顶点与文字的综合场景">
    </a>
    <div class="example-info">
      <p><strong><a href="../all-types.cjs">all-types.cjs</a></strong></p>
      <p>值类型、变换、形状、顶点与文字的综合场景</p>
      <p><code>node examples/all-types.cjs</code></p>
      <p>可选帧数限制：<code>--frames=120</code>。</p>
      <p><strong>仓库诊断入口：使用内部原生预览或验证接口，不是仅使用公开 API 的应用模板。</strong></p>
      <p>辅助文件：<a href="../all-types-scene.cjs">all-types-scene.cjs</a>, <a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:types</code></p>
    </div>
  </article>
  <article class="example-entry" id="sprites">
    <a href="../../assets/examples/features/sprites.webp">
      <img src="../../assets/examples/features/sprites.webp" width="360" alt="大量精灵绘制">
    </a>
    <div class="example-info">
      <p><strong><a href="../sprites.cjs">sprites.cjs</a></strong></p>
      <p>大量精灵绘制</p>
      <p><code>node examples/sprites.cjs</code></p>
      <p>256 个动态精灵。可选 <code>--uncapped</code> 移除演示定时器。</p>
      <p>不支持 <code>--frames</code>，请关闭窗口停止。</p>
      <p><strong>仓库诊断入口：使用内部原生预览或验证接口，不是仅使用公开 API 的应用模板。</strong></p>
      <p><code>npm run demo</code></p>
    </div>
  </article>
  <article class="example-entry" id="image">
    <a href="../../assets/examples/features/image.webp">
      <img src="../../assets/examples/features/image.webp" width="360" alt="像素编辑、复制、遮罩与编解码">
    </a>
    <div class="example-info">
      <p><strong><a href="../image.cjs">image.cjs</a></strong></p>
      <p>像素编辑、复制、遮罩与编解码</p>
      <p><code>node examples/image.cjs</code></p>
      <p>可选 <code>--file=/path/to/image.png</code> 指定图片。</p>
      <p>可选帧数限制：<code>--frames=120</code>。</p>
      <p><strong>仓库诊断入口：使用内部原生预览或验证接口，不是仅使用公开 API 的应用模板。</strong></p>
      <p>辅助文件：<a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:image</code></p>
    </div>
  </article>
  <article class="example-entry" id="texture">
    <a href="../../assets/examples/features/texture.webp">
      <img src="../../assets/examples/features/texture.webp" width="360" alt="图片加载、裁剪、局部上传与采样">
    </a>
    <div class="example-info">
      <p><strong><a href="../texture.cjs">texture.cjs</a></strong></p>
      <p>图片加载、裁剪、局部上传与采样</p>
      <p><code>node examples/texture.cjs</code></p>
      <p>可选帧数限制：<code>--frames=120</code>。</p>
      <p><strong>仓库诊断入口：使用内部原生预览或验证接口，不是仅使用公开 API 的应用模板。</strong></p>
      <p>辅助文件：<a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:texture</code></p>
    </div>
  </article>
  <article class="example-entry" id="sprite">
    <a href="../../assets/examples/features/sprite.webp">
      <img src="../../assets/examples/features/sprite.webp" width="360" alt="精灵动画、翻转、颜色与边界">
    </a>
    <div class="example-info">
      <p><strong><a href="../sprite.cjs">sprite.cjs</a></strong></p>
      <p>精灵动画、翻转、颜色与边界</p>
      <p><code>node examples/sprite.cjs</code></p>
      <p>可选帧数限制：<code>--frames=120</code>。</p>
      <p><strong>仓库诊断入口：使用内部原生预览或验证接口，不是仅使用公开 API 的应用模板。</strong></p>
      <p>辅助文件：<a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:sprite</code></p>
    </div>
  </article>
  <article class="example-entry" id="render-texture">
    <a href="../../assets/render-texture.png">
      <img src="../../assets/render-texture.png" width="360" alt="离屏合成、纹理视图与绘制快照">
    </a>
    <div class="example-info">
      <p><strong><a href="../render-texture.cjs">render-texture.cjs</a></strong></p>
      <p>离屏合成、纹理视图与绘制快照</p>
      <p><code>node examples/render-texture.cjs</code></p>
      <p>可选帧数限制：<code>--frames=120</code>。</p>
      <p><strong>仓库诊断入口：使用内部原生预览或验证接口，不是仅使用公开 API 的应用模板。</strong></p>
      <p>辅助文件：<a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:render-texture</code></p>
    </div>
  </article>
  <article class="example-entry" id="drawable">
    <a href="../../assets/examples/features/drawable.webp">
      <img src="../../assets/examples/features/drawable.webp" width="360" alt="自定义组合、父子变换、混合与模板">
    </a>
    <div class="example-info">
      <p><strong><a href="../drawable.cjs">drawable.cjs</a></strong></p>
      <p>自定义组合、父子变换、混合与模板</p>
      <p><code>node examples/drawable.cjs</code></p>
      <p>可选帧数限制：<code>--frames=120</code>。</p>
      <p><strong>仓库诊断入口：使用内部原生预览或验证接口，不是仅使用公开 API 的应用模板。</strong></p>
      <p>辅助文件：<a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:drawable</code></p>
    </div>
  </article>
  <article class="example-entry" id="vertex-array">
    <a href="../../assets/examples/features/vertex-array.webp">
      <img src="../../assets/examples/features/vertex-array.webp" width="360" alt="动态瓦片与连续顶点">
    </a>
    <div class="example-info">
      <p><strong><a href="../vertex-array.cjs">vertex-array.cjs</a></strong></p>
      <p>动态瓦片与连续顶点</p>
      <p><code>node examples/vertex-array.cjs</code></p>
      <p>可选帧数限制：<code>--frames=120</code>。</p>
      <p><strong>仓库诊断入口：使用内部原生预览或验证接口，不是仅使用公开 API 的应用模板。</strong></p>
      <p><code>npm run demo:vertices</code></p>
    </div>
  </article>
  <article class="example-entry" id="text">
    <a href="../../assets/examples/features/text.webp">
      <img src="../../assets/examples/features/text.webp" width="360" alt="文字排版与顶点动画">
    </a>
    <div class="example-info">
      <p><strong><a href="../text.cjs">text.cjs</a></strong></p>
      <p>文字排版与顶点动画</p>
      <p><code>node examples/text.cjs</code></p>
      <p>可选 <code>--font=/path/to/font.ttf</code> 和 <code>--text=中文示例</code> 指定字体与文字；字体需要包含对应字形。Esc 退出。</p>
      <p>可选帧数限制：<code>--frames=120</code>。</p>
      <p><code>npm run demo:text</code></p>
    </div>
  </article>
</div>

<a id="audio"></a>

## 音频

<div class="example-gallery">
  <article class="example-entry" id="audio-demo">
    <a href="../../assets/examples/features/audio.webp">
      <img src="../../assets/examples/features/audio.webp" width="360" alt="Sound、Music、Worker 供数、音效与录音回放">
    </a>
    <div class="example-info">
      <p><strong><a href="../audio.cjs">audio.cjs</a></strong></p>
      <p>Sound、Music、Worker 供数、音效与录音回放</p>
      <p><code>node examples/audio.cjs</code></p>
      <p>1～4 切换模式，Space 播放／暂停，S 停止，E 切换音效，R／T 开始／结束录音，方向键调整声像和音量，Esc 退出。录音需要麦克风与权限；普通启动等待输入。</p>
      <p>可选帧数限制：<code>--frames=120</code>。</p>
      <p>辅助文件：<a href="../audio-worker.cjs">audio-worker.cjs</a></p>
      <p><code>npm run demo:audio</code></p>
    </div>
  </article>
</div>

<a id="network"></a>

## 网络

<div class="example-gallery">
  <article class="example-entry" id="network-demo">
    <div class="example-info">
      <p><strong><a href="../network.cjs">network.cjs</a></strong></p>
      <p>本机 TCP、Packet、UDP、Selector</p>
      <p><code>node examples/network.cjs</code></p>
      <p>纯控制台示例，在动态分配的本机回环端口上交换 TCP、Packet、UDP 和 SocketSelector 数据；单个终端即可运行，结束后自动关闭套接字。</p>
      <p><code>npm run demo:network</code></p>
    </div>
  </article>
</div>

<a id="screenshots"></a>

## 截图

支持 `SFML_DEMO_SNAPSHOT` 的图形示例可保存运行画面。例如在 macOS／Linux：

```sh
SFML_DEMO_SNAPSHOT=/tmp/sfml-render-texture.png \
  node examples/render-texture.cjs --frames=2
```

PowerShell：

```powershell
$env:SFML_DEMO_SNAPSHOT = "$env:TEMP/sfml-render-texture.png"
node examples/render-texture.cjs --frames=2
Remove-Item Env:SFML_DEMO_SNAPSHOT
```

内置截图使用 <code>SFML_DEMO_SNAPSHOT</code>。all-types、sprites、drawable、vertex-array、system-window 和 sleep-err 始终写入 PPM，与文件扩展名无关，请使用 <code>.ppm</code>。image、texture、sprite、render-texture、window 和 audio 支持 PNG。text 与 vector-scalars 未实现此环境变量；两者的预览均通过临时插桩采集。

sleep-err 在最后一帧保存，vertex-array 在循环结束后保存，截图时请指定有限帧数。system-window、window 和 audio 至少需要两帧，其他内置预览可能在首帧保存。sprites 保存首帧后仍持续运行，需关闭窗口。截图来源见 [sources.json](../../assets/examples/features/sources.json)。
