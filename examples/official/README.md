# SFML official examples

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

JavaScript ports of 24 [SFML examples][upstream], covering graphics, native
windows, input, audio and networking. [Android](android/README.md) is not
ported yet. · [Feature examples](../features/README.md) · [Games and applications](../projects/README.md)

[All examples](../README.md) · [Build requirements](../../docs/getting-started.md#requirements)

## Quick start

From the repository root:

```sh
npm ci
cd examples/official
node tennis/Tennis.cjs
```

All commands below run from `examples/official`. Each script loads its own
resources. Graphical examples need a display and OpenGL window support.

Browse: [Graphics](#graphics) · [Input and events](#input) · [Audio](#audio) · [Networking](#network) · [Platform integration](#platform)

<a id="graphics"></a>

## Graphics

<div class="example-gallery">
  <article class="example-entry" id="island">
    <a href="screenshots/island.png">
      <img src="screenshots/island.png" width="360" alt="Generated island with terrain parameters">
    </a>
    <div class="example-info">
      <p><strong><a href="island/Island.cjs">Island</a></strong></p>
      <p>Terrain and lighting</p>
      <p><strong>Controls</strong> · arrows edit parameters, Enter regenerates</p>
      <p><code>node island/Island.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="shader">
    <a href="screenshots/shader.png">
      <img src="screenshots/shader.png" width="360" alt="Pixelate shader applied to the butterfly image">
    </a>
    <div class="example-info">
      <p><strong><a href="shader/Shader.cjs">Shader</a></strong></p>
      <p>Five shader scenes</p>
      <p><a href="screenshots/shader-edge.png">sfml.js logo edge-effect preview</a></p>
      <p><strong>Controls</strong> · Left/Right selects, mouse controls parameters</p>
      <p><code>node shader/Shader.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="tennis">
    <a href="screenshots/tennis.png">
      <img src="screenshots/tennis.png" width="360" alt="Tennis gameplay with the ball in an active rally between two paddles">
    </a>
    <div class="example-info">
      <p><strong><a href="tennis/Tennis.cjs">Tennis</a></strong></p>
      <p>Pong</p>
      <p><strong>Controls</strong> · Space or touch to start, Up/Down to move, Esc to exit</p>
      <p><code>node tennis/Tennis.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="stencil">
    <a href="screenshots/stencil.png">
      <img src="screenshots/stencil.png" width="360" alt="Red, green and blue shapes using a stencil mask">
    </a>
    <div class="example-info">
      <p><strong><a href="stencil/Stencil.cjs">Stencil</a></strong></p>
      <p>Animated stencil mask and shapes</p>
      <p><code>node stencil/Stencil.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="text">
    <a href="screenshots/text.png">
      <img src="screenshots/text.png" width="360" alt="Forty multilingual text samples">
    </a>
    <div class="example-info">
      <p><strong><a href="text/Text.cjs">Text</a></strong></p>
      <p>40 multilingual samples</p>
      <p><strong>Controls</strong> · click selects, F1/F2/F3 toggle bounds and cursor, F4 cycles preprocessing, Left/Right moves cursor</p>
      <p><code>node text/Text.cjs</code></p>
    </div>
  </article>
</div>

<a id="input"></a>

## Input and events

<div class="example-gallery">
  <article class="example-entry" id="keyboard">
    <a href="screenshots/keyboard.png">
      <img src="screenshots/keyboard.png" width="360" alt="Keyboard layout with an A key press and text input">
    </a>
    <div class="example-info">
      <p><strong><a href="keyboard/Keyboard.cjs">Keyboard</a></strong></p>
      <p>Physical key layout, key events, text input and sound feedback</p>
      <p><code>node keyboard/Keyboard.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="event-handling">
    <a href="screenshots/event_handling.png">
      <img src="screenshots/event_handling.png" width="360" alt="Keyboard and mouse event log using the Visitor handler">
    </a>
    <div class="example-info">
      <p><strong><a href="event_handling/EventHandling.cjs">Event handling</a></strong></p>
      <p>Five event dispatch forms</p>
      <p><strong>Controls</strong> · Enter switches</p>
      <p><code>node event_handling/EventHandling.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="raw-input">
    <a href="screenshots/raw_input.png">
      <img src="screenshots/raw_input.png" width="360" alt="Raw mouse deltas and cursor position">
    </a>
    <div class="example-info">
      <p><strong><a href="raw_input/RawInput.cjs">Raw input</a></strong></p>
      <p>Raw mouse motion</p>
      <p><code>node raw_input/RawInput.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="joystick">
    <a href="screenshots/joystick.png">
      <img src="screenshots/joystick.png" width="360" alt="Joystick selector with no device connected">
    </a>
    <div class="example-info">
      <p><strong><a href="joystick/Joystick.cjs">Joystick</a></strong></p>
      <p>Axes and buttons</p>
      <p><strong>Controls</strong> · 0–7 selects a joystick, Tab switches generic/gamepad views</p>
      <p><code>node joystick/Joystick.cjs</code></p>
    </div>
  </article>
</div>

<a id="audio"></a>

## Audio

Recording examples need a microphone and recording permission.

<div class="example-gallery">
  <article class="example-entry" id="sound-effects">
    <a href="screenshots/sound_effects.png">
      <img src="screenshots/sound_effects.png" width="360" alt="Listener, sound source and distance attenuation ring">
    </a>
    <div class="example-info">
      <p><strong><a href="sound_effects/SoundEffects.cjs">Sound effects</a></strong></p>
      <p>Nine effects</p>
      <p><strong>Controls</strong> · Left/Right selects, mouse adjusts, Up/Down selects attenuation/waveform, Space bypasses DSP, F1 changes output</p>
      <p><code>node sound_effects/SoundEffects.cjs</code></p>
    </div>
  </article>
</div>

<div class="example-gallery">
  <article class="example-entry" id="sound">
    <div class="example-info">
      <p><strong><a href="sound/Sound.cjs">Sound</a></strong></p>
      <p>WAV sound followed by OGG, FLAC and MP3 music</p>
      <p><code>node sound/Sound.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="sound-capture">
    <div class="example-info">
      <p><strong><a href="sound_capture/SoundCapture.cjs">Sound capture</a></strong></p>
      <p>Choose a device/rate, record, then play or save</p>
      <p><code>node sound_capture/SoundCapture.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="sound-device">
    <div class="example-info">
      <p><strong><a href="sound_device/SoundDevice.cjs">Sound device</a></strong></p>
      <p>Device notifications, automatic routing and device-loss recovery; Ctrl+C exits</p>
      <p><code>node sound_device/SoundDevice.cjs</code></p>
    </div>
  </article>
</div>

<a id="network"></a>

## Networking

<div class="example-gallery">
  <article class="example-entry" id="http">
    <div class="example-info">
      <p><strong><a href="http/Http.cjs">HTTP</a></strong></p>
      <p>Interactive HTTP GET with redirects</p>
      <p><code>node http/Http.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="ftp">
    <div class="example-info">
      <p><strong><a href="ftp/Ftp.cjs">FTP</a></strong></p>
      <p>Interactive FTP client, port 21</p>
      <p><code>node ftp/Ftp.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="sftp">
    <div class="example-info">
      <p><strong><a href="sftp/Sftp.cjs">SFTP</a></strong></p>
      <p>Interactive SFTP client; confirm the host fingerprint, then authenticate</p>
      <p><code>node sftp/Sftp.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="sockets">
    <div class="example-info">
      <p><strong><a href="sockets/Sockets.cjs">Sockets</a></strong></p>
      <p>TCP, TLS or UDP greeting exchange, port 50001</p>
      <p><code>node sockets/Sockets.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="voip">
    <div class="example-info">
      <p><strong><a href="voip/VoIP.cjs">VoIP</a></strong></p>
      <p>TCP voice capture, playback and replay, port 2435</p>
      <p><code>node voip/VoIP.cjs</code></p>
    </div>
  </article>
</div>

For sockets and VoIP, run the entry point in two terminals: select server in one and client in the other. Use `127.0.0.1` for a local exchange.

<a id="platform"></a>

## Platform integration

Building nodegl requires CMake, a C++ compiler and OpenGL development libraries
(`libgl1-mesa-dev` on Linux). Vulkan also needs a Vulkan loader and a driver
supporting 4× anisotropic filtering.

<div class="example-gallery">
  <article class="example-entry" id="window">
    <a href="screenshots/window.png">
      <img src="screenshots/window.png" width="360" alt="A rotating six-colored cube against a black background">
    </a>
    <div class="example-info">
      <p><strong><a href="window/Window.cjs">Window</a></strong></p>
      <p>A rotating six-colored cube in an OpenGL window</p>
      <p><strong>Controls</strong> · resize by dragging the window border; Esc or window close exits</p>
      <p><code>node window/Window.cjs</code></p>
      <p>macOS, Linux, Windows · <code>@wettstein/nodegl</code>, installed by the root <code>npm ci</code></p>
    </div>
  </article>
  <article class="example-entry" id="opengl">
    <a href="screenshots/opengl.png">
      <img src="screenshots/opengl.png" width="360" alt="Textured OpenGL cube over an SFML background with text">
    </a>
    <div class="example-info">
      <p><strong><a href="opengl/OpenGL.cjs">OpenGL</a></strong></p>
      <p>SFML background and text with a textured OpenGL cube</p>
      <p><strong>Controls</strong> · mouse moves the cube, Enter toggles mipmapping, Space toggles sRGB, Esc exits</p>
      <p><code>node opengl/OpenGL.cjs</code></p>
      <p>macOS, Linux, Windows · <code>@wettstein/nodegl</code>, installed by the root <code>npm ci</code></p>
    </div>
  </article>
  <article class="example-entry" id="vulkan">
    <a href="screenshots/vulkan.png">
      <img src="screenshots/vulkan.png" width="360" alt="Original colored cube with the sfml.js logo rendered with Vulkan">
    </a>
    <div class="example-info">
      <p><strong><a href="vulkan/Vulkan.cjs">Vulkan</a></strong></p>
      <p>A rotating textured cube rendered with Vulkan</p>
      <p><strong>Controls</strong> · mouse moves the cube, drag the window border to resize, Esc or window close exits</p>
      <p><code>node vulkan/Vulkan.cjs</code></p>
      <p>Linux x64 (X11) or Windows x64, Node.js 20+ · <code>npm ci --prefix vulkan --ignore-scripts</code></p>
      <p>Vulkan targets Linux/X11 and Windows x64, using <code>nvk</code> 0.8.0 with a Vulkan
loader and a driver/device supporting 4× anisotropic filtering. SFML handles
the window, events and surface; nvk drives Vulkan directly without a custom
native bridge. SFML Graphics still uses OpenGL. SFML's Vulkan integration
is unavailable on macOS at compile time; MoltenVK alone does not enable it.
Native rendering and interaction checks passed on Linux/X11 and Windows.
See the <a href="#platform">platform guide</a> for controls and requirements.</p>
    </div>
  </article>
  <article class="example-entry" id="cocoa">
    <a href="screenshots/cocoa.png">
      <img src="screenshots/cocoa.png" width="360" alt="Cocoa window with native controls and an embedded sfml.js logo">
    </a>
    <div class="example-info">
      <p><strong><a href="cocoa/Cocoa.cjs">Cocoa</a></strong></p>
      <p>Native macOS controls with an embedded SFML view</p>
      <p><strong>Controls</strong> · Update or Enter applies text; Visible toggles the logo; the dial rotates it; Color selects the background; Up/Down scales it; close, Cmd+Q or Ctrl+C exits</p>
      <p><code>node cocoa/Cocoa.cjs</code></p>
      <p>macOS · <code>npm ci --prefix cocoa --ignore-scripts</code></p>
    </div>
  </article>
  <article class="example-entry" id="win32">
    <a href="screenshots/win32.png">
      <img src="screenshots/win32.png" width="360" alt="Two animated SFML images and a Quit button in a native Win32 window">
    </a>
    <div class="example-info">
      <p><strong><a href="win32/Win32.cjs">Win32</a></strong></p>
      <p>A native Windows window with two animated SFML views and a Quit button</p>
      <p><strong>Controls</strong> · Quit, window close or Ctrl+C exits</p>
      <p><code>node win32/Win32.cjs</code></p>
      <p>Windows x64, Node.js 20+ · <code>npm ci --prefix win32 --ignore-scripts</code></p>
    </div>
  </article>
  <article class="example-entry" id="x11">
    <a href="screenshots/x11.png">
      <img src="screenshots/x11.png" width="360" alt="Two SFML child windows with rotating cubes in an X11 parent">
    </a>
    <div class="example-info">
      <p><strong><a href="X11/X11.cjs">X11</a></strong></p>
      <p>Two embedded SFML windows with cubes rotating at different speeds</p>
      <p><strong>Controls</strong> · any key, window close or Ctrl+C exits</p>
      <p><code>node X11/X11.cjs</code></p>
      <p>Linux with X11 · <code>x11</code> and <code>@wettstein/nodegl</code>, installed by the root <code>npm ci</code></p>
    </div>
  </article>
</div>

## Sources and licenses

Based on the [SFML examples][upstream]. Source revisions and asset provenance
are recorded in [provenance.json](provenance.json).

- SFML source: [zlib license](SFML-LICENSE.md).
- Upstream assets and their authors: [asset_licenses.md](asset_licenses.md).
- Noto fonts: [SIL Open Font License 1.1](text/resources/OFL.txt).
- Ported stb Perlin implementation: [MIT/public-domain dual license](island/stb_perlin.LICENSE).

[upstream]: https://github.com/SFML/SFML/tree/14cea1d978b3dce05780b9234925ca8be9373260/examples
