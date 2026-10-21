# Feature examples

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

> Run from the sfml.js repository root after `npm ci`; run `npm run build` after source changes. All entries except Network open a graphical window and require a display with OpenGL support.

[Overview](../README.md) · [Official examples](../official/README.md) · [Games and applications](../projects/README.md)

Run the commands below directly after building. The `demo:*` scripts in package.json rebuild as configured. Close the window to exit; entries with a frame limit also finish automatically. Screenshots show a particular rendered scene, not performance or device-test results.

For an application using only public APIs, start with the [Quick start](../../docs/getting-started.md). Helpers are listed with their entry points, not as separate programs.

<a id="system"></a>

## System

<div class="example-gallery">
  <article class="example-entry" id="sleep-err">
    <a href="../../assets/examples/features/sleep-err.webp">
      <img src="../../assets/examples/features/sleep-err.webp" width="360" alt="Asynchronous waiting and SFML log output">
    </a>
    <div class="example-info">
      <p><strong><a href="../sleep-err.cjs">sleep-err.cjs</a></strong></p>
      <p>Asynchronous waiting and SFML log output</p>
      <p><code>node examples/sleep-err.cjs</code></p>
      <p>S waits two seconds; W writes a log; N triggers a native diagnostic; R captures logs in the panel, M mutes them, D restores stderr. Esc exits.</p>
      <p>Optional frame limit: <code>--frames=120</code>.</p>
      <p><code>npm run demo:sleep-err</code></p>
    </div>
  </article>
  <article class="example-entry" id="vector-scalars">
    <a href="../../assets/examples/features/vector-scalars.webp">
      <img src="../../assets/examples/features/vector-scalars.webp" width="360" alt="Live scalar vector storage and native comparisons">
    </a>
    <div class="example-info">
      <p><strong><a href="../vector-scalars.cjs">vector-scalars.cjs</a></strong></p>
      <p>Vector operations with different numeric scalar types</p>
      <p><code>node examples/vector-scalars.cjs</code></p>
      <p>Live TypedArray storage and native comparisons for scalar vector types. Esc exits.</p>
      <p>No <code>--frames</code> option; close the window to stop.</p>
      <p><strong>Repository diagnostic: uses internal native preview or verification APIs, not a public application template.</strong></p>
    </div>
  </article>
</div>

<a id="window"></a>

## Window

<div class="example-gallery">
  <article class="example-entry" id="window-demo">
    <a href="../../assets/examples/features/window.webp">
      <img src="../../assets/examples/features/window.webp" width="360" alt="Window events, cursors and input diagnostics">
    </a>
    <div class="example-info">
      <p><strong><a href="../window.cjs">window.cjs</a></strong></p>
      <p>Window events, cursors and input diagnostics</p>
      <p><code>node examples/window.cjs</code></p>
      <p>F1 cycles cursors, F2 toggles cursor visibility, F3 key repeat, F4 VSync, F5 window size, F6 size limits, F7 title, F8 hides/restores the window, F9 cycles event-handling modes, F10 moves the window. Arrows move the marker; typing edits text, Backspace deletes, Esc exits.</p>
      <p>Optional frame limit: <code>--frames=120</code>.</p>
      <p><strong>Repository diagnostic: uses internal native preview or verification APIs, not a public application template.</strong></p>
      <p>Helpers: <a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:window</code></p>
    </div>
  </article>
  <article class="example-entry" id="system-window">
    <a href="../../assets/examples/features/system-window.webp">
      <img src="../../assets/examples/features/system-window.webp" width="360" alt="System and Window APIs">
    </a>
    <div class="example-info">
      <p><strong><a href="../system-window.cjs">system-window.cjs</a></strong></p>
      <p>System and Window APIs</p>
      <p><code>node examples/system-window.cjs</code></p>
      <p>C copies sample text to the system clipboard, V reads it, A switches OpenGL contexts; Esc exits. Touch needs supported hardware; macOS trackpad gestures are not SFML touches.</p>
      <p>Optional frame limit: <code>--frames=120</code>.</p>
      <p><code>npm run demo:system-window</code></p>
    </div>
  </article>
</div>

<a id="graphics"></a>

## Graphics

<div class="example-gallery">
  <article class="example-entry" id="all-types">
    <a href="../../assets/examples/features/all-types.webp">
      <img src="../../assets/examples/features/all-types.webp" width="360" alt="Combined scene with value types, transforms, shapes, vertices and text">
    </a>
    <div class="example-info">
      <p><strong><a href="../all-types.cjs">all-types.cjs</a></strong></p>
      <p>Combined scene with value types, transforms, shapes, vertices and text</p>
      <p><code>node examples/all-types.cjs</code></p>
      <p>Optional frame limit: <code>--frames=120</code>.</p>
      <p><strong>Repository diagnostic: uses internal native preview or verification APIs, not a public application template.</strong></p>
      <p>Helpers: <a href="../all-types-scene.cjs">all-types-scene.cjs</a>, <a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:types</code></p>
    </div>
  </article>
  <article class="example-entry" id="sprites">
    <a href="../../assets/examples/features/sprites.webp">
      <img src="../../assets/examples/features/sprites.webp" width="360" alt="Drawing large numbers of sprites">
    </a>
    <div class="example-info">
      <p><strong><a href="../sprites.cjs">sprites.cjs</a></strong></p>
      <p>Drawing large numbers of sprites</p>
      <p><code>node examples/sprites.cjs</code></p>
      <p>256 animated sprites. Optional <code>--uncapped</code> removes the demo timer.</p>
      <p>No <code>--frames</code> option; close the window to stop.</p>
      <p><strong>Repository diagnostic: uses internal native preview or verification APIs, not a public application template.</strong></p>
      <p><code>npm run demo</code></p>
    </div>
  </article>
  <article class="example-entry" id="image">
    <a href="../../assets/examples/features/image.webp">
      <img src="../../assets/examples/features/image.webp" width="360" alt="Pixel editing, copying, masking and codecs">
    </a>
    <div class="example-info">
      <p><strong><a href="../image.cjs">image.cjs</a></strong></p>
      <p>Pixel editing, copying, masking and codecs</p>
      <p><code>node examples/image.cjs</code></p>
      <p>Optional <code>--file=/path/to/image.png</code> supplies an image.</p>
      <p>Optional frame limit: <code>--frames=120</code>.</p>
      <p><strong>Repository diagnostic: uses internal native preview or verification APIs, not a public application template.</strong></p>
      <p>Helpers: <a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:image</code></p>
    </div>
  </article>
  <article class="example-entry" id="texture">
    <a href="../../assets/examples/features/texture.webp">
      <img src="../../assets/examples/features/texture.webp" width="360" alt="Image loading, cropping, partial uploads and sampling">
    </a>
    <div class="example-info">
      <p><strong><a href="../texture.cjs">texture.cjs</a></strong></p>
      <p>Image loading, cropping, partial uploads and sampling</p>
      <p><code>node examples/texture.cjs</code></p>
      <p>Optional frame limit: <code>--frames=120</code>.</p>
      <p><strong>Repository diagnostic: uses internal native preview or verification APIs, not a public application template.</strong></p>
      <p>Helpers: <a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:texture</code></p>
    </div>
  </article>
  <article class="example-entry" id="sprite">
    <a href="../../assets/examples/features/sprite.webp">
      <img src="../../assets/examples/features/sprite.webp" width="360" alt="Sprite animation, flipping, colors and bounds">
    </a>
    <div class="example-info">
      <p><strong><a href="../sprite.cjs">sprite.cjs</a></strong></p>
      <p>Sprite animation, flipping, colors and bounds</p>
      <p><code>node examples/sprite.cjs</code></p>
      <p>Optional frame limit: <code>--frames=120</code>.</p>
      <p><strong>Repository diagnostic: uses internal native preview or verification APIs, not a public application template.</strong></p>
      <p>Helpers: <a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:sprite</code></p>
    </div>
  </article>
  <article class="example-entry" id="render-texture">
    <a href="../../assets/render-texture.png">
      <img src="../../assets/render-texture.png" width="360" alt="Off-screen composition, texture views and draw snapshots">
    </a>
    <div class="example-info">
      <p><strong><a href="../render-texture.cjs">render-texture.cjs</a></strong></p>
      <p>Off-screen composition, texture views and draw snapshots</p>
      <p><code>node examples/render-texture.cjs</code></p>
      <p>Optional frame limit: <code>--frames=120</code>.</p>
      <p><strong>Repository diagnostic: uses internal native preview or verification APIs, not a public application template.</strong></p>
      <p>Helpers: <a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:render-texture</code></p>
    </div>
  </article>
  <article class="example-entry" id="drawable">
    <a href="../../assets/examples/features/drawable.webp">
      <img src="../../assets/examples/features/drawable.webp" width="360" alt="Custom composition, parent-child transforms, blending and stencil">
    </a>
    <div class="example-info">
      <p><strong><a href="../drawable.cjs">drawable.cjs</a></strong></p>
      <p>Custom composition, parent-child transforms, blending and stencil</p>
      <p><code>node examples/drawable.cjs</code></p>
      <p>Optional frame limit: <code>--frames=120</code>.</p>
      <p><strong>Repository diagnostic: uses internal native preview or verification APIs, not a public application template.</strong></p>
      <p>Helpers: <a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:drawable</code></p>
    </div>
  </article>
  <article class="example-entry" id="vertex-array">
    <a href="../../assets/examples/features/vertex-array.webp">
      <img src="../../assets/examples/features/vertex-array.webp" width="360" alt="Dynamic tiles and contiguous vertices">
    </a>
    <div class="example-info">
      <p><strong><a href="../vertex-array.cjs">vertex-array.cjs</a></strong></p>
      <p>Dynamic tiles and contiguous vertices</p>
      <p><code>node examples/vertex-array.cjs</code></p>
      <p>Optional frame limit: <code>--frames=120</code>.</p>
      <p><strong>Repository diagnostic: uses internal native preview or verification APIs, not a public application template.</strong></p>
      <p><code>npm run demo:vertices</code></p>
    </div>
  </article>
  <article class="example-entry" id="text">
    <a href="../../assets/examples/features/text.webp">
      <img src="../../assets/examples/features/text.webp" width="360" alt="Text layout and vertex animation">
    </a>
    <div class="example-info">
      <p><strong><a href="../text.cjs">text.cjs</a></strong></p>
      <p>Text layout and vertex animation</p>
      <p><code>node examples/text.cjs</code></p>
      <p>Optional <code>--font=/path/to/font.ttf</code> and <code>--text=Hello</code> select font and text. The font must contain the requested glyphs. Esc exits.</p>
      <p>Optional frame limit: <code>--frames=120</code>.</p>
      <p><code>npm run demo:text</code></p>
    </div>
  </article>
</div>

<a id="audio"></a>

## Audio

<div class="example-gallery">
  <article class="example-entry" id="audio-demo">
    <a href="../../assets/examples/features/audio.webp">
      <img src="../../assets/examples/features/audio.webp" width="360" alt="Sound, Music, Worker data production, effects and recording playback">
    </a>
    <div class="example-info">
      <p><strong><a href="../audio.cjs">audio.cjs</a></strong></p>
      <p>Sound, Music, Worker data production, effects and recording playback</p>
      <p><code>node examples/audio.cjs</code></p>
      <p>1–4 select modes, Space plays/pauses, S stops, E toggles effects, R/T start/stop recording, arrows adjust pan/volume, Esc exits. Recording needs a microphone and permission; ordinary startup waits for input.</p>
      <p>Optional frame limit: <code>--frames=120</code>.</p>
      <p>Helpers: <a href="../audio-worker.cjs">audio-worker.cjs</a></p>
      <p><code>npm run demo:audio</code></p>
    </div>
  </article>
</div>

<a id="network"></a>

## Network

<div class="example-gallery">
  <article class="example-entry" id="network-demo">
    <div class="example-info">
      <p><strong><a href="../network.cjs">network.cjs</a></strong></p>
      <p>Local TCP, Packet, UDP and Selector</p>
      <p><code>node examples/network.cjs</code></p>
      <p>Console-only local TCP, Packet, UDP and SocketSelector exchange on dynamically allocated loopback ports; runs in one terminal and closes its sockets automatically.</p>
      <p><code>npm run demo:network</code></p>
    </div>
  </article>
</div>

<a id="screenshots"></a>

## Screenshots

Graphics examples supporting `SFML_DEMO_SNAPSHOT` can save their rendered output. For example, on macOS/Linux:

```sh
SFML_DEMO_SNAPSHOT=/tmp/sfml-render-texture.png \
  node examples/render-texture.cjs --frames=2
```

PowerShell:

```powershell
$env:SFML_DEMO_SNAPSHOT = "$env:TEMP/sfml-render-texture.png"
node examples/render-texture.cjs --frames=2
Remove-Item Env:SFML_DEMO_SNAPSHOT
```

Built-in snapshots use <code>SFML_DEMO_SNAPSHOT</code>. all-types, sprites, drawable, vertex-array, system-window and sleep-err write PPM regardless of the filename extension; use <code>.ppm</code>. image, texture, sprite, render-texture, window and audio support PNG. text and vector-scalars do not implement this environment variable; their previews were captured with temporary instrumentation.

Use a finite frame count for sleep-err (saved at the last frame) and vertex-array (saved after the loop). system-window, window and audio need at least two frames; other built-in previews may capture the first frame. sprites captures its first frame and keeps running until closed. Capture provenance is recorded in [sources.json](../../assets/examples/features/sources.json).
