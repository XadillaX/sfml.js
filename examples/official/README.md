# SFML official examples

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

JavaScript ports of 24 examples from [SFML/SFML][upstream], pinned to commit
`14cea1d978b3dce05780b9234925ca8be9373260`. These are modified sources for
sfml.js, retaining the upstream directory names, scenes, controls and assets.

[All examples](../README.md) · [Build requirements](../../docs/getting-started.md#requirements)

From the repository root, enter the examples directory after building sfml.js:

```sh
cd examples/official
node tennis/Tennis.cjs
```

Resources are resolved relative to each script. These interactive examples
run until closed; they do not implement the other examples' `--frames` flag.
Graphical examples require a display and OpenGL window support. Vulkan uses
its own renderer. Audio input requires a microphone and OS recording permission.

Browse: [Graphics](#graphics) · [Platform integration](#platform) · [Input and events](#input) · [Audio](#audio) · [Networking](#network)

The X11 and Vulkan screenshots come from Linux CI with Xvfb/Mesa, Win32 from Windows CI with Mesa, and the others from native windows on macOS. Click a preview for full resolution or a name for source code.

<a id="graphics"></a>

## Graphics

<table>
  <thead>
    <tr>
      <th width="44%">Preview</th>
      <th>Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/island.png">
          <img src="screenshots/island.png" width="360"
               alt="Generated island with terrain parameters">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="island/Island.cjs">Island</a></strong></p>
        <p>Terrain and lighting</p>
        <p><strong>Controls</strong> · arrows edit parameters, Enter regenerates</p>
        <p><code>node island/Island.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/shader.png">
          <img src="screenshots/shader.png" width="360"
               alt="Pixelate shader applied to the butterfly image">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="shader/Shader.cjs">Shader</a></strong></p>
        <p>Five shader scenes</p>
        <p><a href="screenshots/shader-edge.png">sfml.js logo edge-effect preview</a></p>
        <p><strong>Controls</strong> · Left/Right selects, mouse controls parameters</p>
        <p><code>node shader/Shader.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/tennis.png">
          <img src="screenshots/tennis.png" width="360"
               alt="Tennis start screen with the sfml.js logo">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="tennis/Tennis.cjs">Tennis</a></strong></p>
        <p>Pong</p>
        <p><strong>Controls</strong> · Space to start, Up/Down to move, Esc to exit; touch input retained</p>
        <p><code>node tennis/Tennis.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/stencil.png">
          <img src="screenshots/stencil.png" width="360"
               alt="Red, green and blue shapes using a stencil mask">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="stencil/Stencil.cjs">Stencil</a></strong></p>
        <p>Animated stencil mask and shapes</p>
        <p><code>node stencil/Stencil.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/text.png">
          <img src="screenshots/text.png" width="360"
               alt="Forty multilingual text samples">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="text/Text.cjs">Text</a></strong></p>
        <p>40 multilingual samples</p>
        <p><strong>Controls</strong> · click selects, F1/F2/F3 toggle bounds and cursor, F4 cycles preprocessing, Left/Right moves cursor</p>
        <p><code>node text/Text.cjs</code></p>
      </td>
    </tr>
  </tbody>
</table>

<a id="platform"></a>

## Platform integration

Window, OpenGL and X11 call desktop OpenGL through
[`@wettstein/nodegl`](https://www.npmjs.com/package/@wettstein/nodegl)
using compatibility contexts managed by SFML.
Running `npm ci` at the repository root installs `nodegl` and `x11`.
nodegl 1.2.1 compiles during installation and requires CMake, a C++ toolchain
and OpenGL development headers/libraries. macOS provides OpenGL in its SDK;
Linux needs a package such as `libgl1-mesa-dev`.
X11 additionally needs Linux and an X11 display server (or XWayland).
Window and OpenGL are verified on macOS, Linux (Xvfb/Mesa) and Windows
(Mesa); the X11 native host is verified on Linux.

Cocoa requires macOS and uses third-party [objc-js](https://github.com/iamEvanYT/objc-js).
Install its local dependency using the bundled prebuild (Apple Silicon or Intel):

```sh
# From examples/official
npm ci --prefix cocoa --ignore-scripts
node cocoa/Cocoa.cjs
```

Win32 requires Windows x64 and Node.js 20 or later. It uses
[`wndkit`](https://www.npmjs.com/package/wndkit) 0.1.0 with its bundled x64
native module. Install the example's local dependency:

```sh
# From examples/official
npm ci --prefix win32 --ignore-scripts
node win32/Win32.cjs
```

Vulkan targets Linux/X11 and Windows on x64 with Node.js 20 or later.
It uses [`nvk`](https://www.npmjs.com/package/nvk) 0.8.0 and requires a
Vulkan loader and a driver/device supporting 4× anisotropic filtering.
SFML's Vulkan integration is unavailable on macOS at compile time;
installing MoltenVK alone does not enable it. Install the local dependency:

```sh
# From examples/official
npm ci --prefix vulkan --ignore-scripts
node vulkan/Vulkan.cjs
```

<table>
  <thead>
    <tr>
      <th width="44%">Preview</th>
      <th>Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/window.png">
          <img src="screenshots/window.png" width="360"
               alt="A rotating six-colored cube against a black background">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="window/Window.cjs">Window</a></strong></p>
        <p>640 × 480 OpenGL window, 24-bit depth buffer and six-colored cube</p>
        <p><strong>Controls</strong> · resize by dragging the window border; Esc or window close exits</p>
        <p><code>node window/Window.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/opengl.png">
          <img src="screenshots/opengl.png" width="360"
               alt="Textured OpenGL cube over an SFML background with text">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="opengl/OpenGL.cjs">OpenGL</a></strong></p>
        <p>800 × 600 mixed SFML/OpenGL rendering, textured cube and sRGB</p>
        <p><strong>Controls</strong> · mouse moves the cube; Enter toggles mipmapping; Space recreates the window with sRGB toggled; Esc exits</p>
        <p><code>node opengl/OpenGL.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/vulkan.png">
          <img src="screenshots/vulkan.png" width="360"
               alt="Original colored cube with the sfml.js logo rendered with Vulkan">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="vulkan/Vulkan.cjs">Vulkan</a></strong></p>
        <p>800 × 600 Vulkan rendering of the original colored cube with the sfml.js logo; automatic X/Y/Z rotation at 59/83/109 degrees per second</p>
        <p><strong>Controls</strong> · mouse translates the cube; resizing recreates the swapchain; Esc or window close exits</p>
        <p><code>node vulkan/Vulkan.cjs</code> (Linux/X11 and Windows x64)</p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/cocoa.png">
          <img src="screenshots/cocoa.png" width="360"
               alt="Cocoa window with native controls and an embedded sfml.js logo">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="cocoa/Cocoa.cjs">Cocoa</a></strong></p>
        <p>485 × 379 native window with a 440 × 260 SFML view</p>
        <p><strong>Controls</strong> · Update or Enter applies text; Visible toggles the logo; the dial rotates it; Color selects the background; Up/Down scales it; close, Cmd+Q or Ctrl+C exits</p>
        <p><code>node cocoa/Cocoa.cjs</code> (macOS)</p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/win32.png">
          <img src="screenshots/win32.png" width="360"
               alt="Two animated SFML images and a Quit button in a native Win32 window">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="win32/Win32.cjs">Win32</a></strong></p>
        <p>660 × 520 native window with two 300 × 400 SFML views; the left image rotates and the right image moves horizontally</p>
        <p><strong>Controls</strong> · Quit, window close or Ctrl+C exits</p>
        <p><code>node win32/Win32.cjs</code> (Windows x64)</p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/x11.png">
          <img src="screenshots/x11.png" width="360"
               alt="Two SFML child windows with rotating cubes in an X11 parent">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="X11/X11.cjs">X11</a></strong></p>
        <p>Two 310 × 310 SFML views inside a 650 × 330 parent; the right cube rotates at 30% of the left cube's speed</p>
        <p><strong>Controls</strong> · any key, window close or Ctrl+C exits</p>
        <p><code>node X11/X11.cjs</code></p>
      </td>
    </tr>
  </tbody>
</table>

<a id="input"></a>

## Input and events

Input screenshots use scripted events; the joystick view shows no connected device.

<table>
  <thead>
    <tr>
      <th width="44%">Preview</th>
      <th>Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/keyboard.png">
          <img src="screenshots/keyboard.png" width="360"
               alt="Keyboard layout with an A key press and text input">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="keyboard/Keyboard.cjs">Keyboard</a></strong></p>
        <p>Physical key layout, key events, text input and sound feedback</p>
        <p><code>node keyboard/Keyboard.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/event_handling.png">
          <img src="screenshots/event_handling.png" width="360"
               alt="Keyboard and mouse event log using the Visitor handler">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="event_handling/EventHandling.cjs">Event handling</a></strong></p>
        <p>Five event dispatch forms</p>
        <p><strong>Controls</strong> · Enter switches</p>
        <p><code>node event_handling/EventHandling.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/raw_input.png">
          <img src="screenshots/raw_input.png" width="360"
               alt="Raw mouse deltas and cursor position">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="raw_input/RawInput.cjs">Raw input</a></strong></p>
        <p>Raw mouse motion</p>
        <p><code>node raw_input/RawInput.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/joystick.png">
          <img src="screenshots/joystick.png" width="360"
               alt="Joystick selector with no device connected">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="joystick/Joystick.cjs">Joystick</a></strong></p>
        <p>Axes and buttons</p>
        <p><strong>Controls</strong> · 0–7 selects a joystick, Tab switches generic/gamepad views</p>
        <p><code>node joystick/Joystick.cjs</code></p>
      </td>
    </tr>
  </tbody>
</table>

<a id="audio"></a>

## Audio

The sound-effects screenshot uses the null playback device.

<table>
  <thead>
    <tr>
      <th width="44%">Preview</th>
      <th>Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/sound_effects.png">
          <img src="screenshots/sound_effects.png" width="360"
               alt="Listener, sound source and distance attenuation ring">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="sound_effects/SoundEffects.cjs">Sound effects</a></strong></p>
        <p>Nine effects</p>
        <p><strong>Controls</strong> · Left/Right selects, mouse adjusts, Up/Down selects attenuation/waveform, Space bypasses DSP, F1 changes output</p>
        <p><code>node sound_effects/SoundEffects.cjs</code></p>
      </td>
    </tr>
  </tbody>
</table>

| Example | Run |
| --- | --- |
| **[Sound](sound/Sound.cjs)**<br>WAV sound followed by OGG, FLAC and MP3 music | `node sound/Sound.cjs` |
| **[Sound capture](sound_capture/SoundCapture.cjs)**<br>Choose a device/rate, record, then play or save | `node sound_capture/SoundCapture.cjs` |
| **[Sound device](sound_device/SoundDevice.cjs)**<br>Device notifications, automatic routing and device-loss recovery; Ctrl+C exits | `node sound_device/SoundDevice.cjs` |

<a id="network"></a>

## Networking

| Example | Run |
| --- | --- |
| **[HTTP](http/Http.cjs)**<br>Interactive HTTP GET with redirects | `node http/Http.cjs` |
| **[FTP](ftp/Ftp.cjs)**<br>Interactive FTP client, port 21 | `node ftp/Ftp.cjs` |
| **[SFTP](sftp/Sftp.cjs)**<br>Interactive SFTP client; confirm the host fingerprint, then authenticate | `node sftp/Sftp.cjs` |
| **[Sockets](sockets/Sockets.cjs)**<br>TCP, TLS or UDP greeting exchange, port 50001 | `node sockets/Sockets.cjs` |
| **[VoIP](voip/VoIP.cjs)**<br>TCP voice capture, playback and replay, port 2435 | `node voip/VoIP.cjs` |

For sockets and VoIP, run the entry point in two terminals: select server in one and client in the other. Use `127.0.0.1` for a local exchange.

For FTP/SFTP downloads and saved recordings, enter a temporary or chosen output path at the prompt.

## Node adaptations


- Rendering yields through `setImmediate`; resource loading and networking
  use asynchronous public APIs. Audio callbacks run in audio Workers.
- Island reuses four Workers with the original 32 terrain blocks and
  800 × 600 mesh. Its Perlin noise follows the upstream tables; border
  sampling uses signed coordinates instead of unsigned underflow.
- Text cluster offsets use JavaScript UTF-16 indices. The upstream Noto
  subsets are copied unchanged; see the [font notes](text/resources/readme.md).
- The binding exposes inverse distance attenuation only. The Surround scene
  computes all four upstream distance-gain formulas in JavaScript and keeps
  native spatial panning. Zero-frequency generated tones produce silence.
- TLS uses the public upstream demonstration key with a replacement
  `localhost` certificate containing DNS/IP subject alternatives.
  Verification stays enabled. This bundled key/certificate is for this
  demonstration only, including when the two peers run on different hosts.
- X11 uses third-party `x11` for window ownership,
  `sf.Window(BigInt(xid))` for borrowed-window OpenGL contexts, and `nodegl`
  for desktop GL calls. Zero-copy Buffer views retain the vertex data.
  Cleanup closes SFML contexts, releases Buffer references, destroys the parent, then
  disconnects the X11 client.

- Window calls desktop OpenGL through `nodegl`, retaining the six
  original face colors, 50/30/90 degrees-per-second rotation and a perspective
  projection updated on resize. Vertex Buffer references are released after
  closing the window. Zero-sized viewports suspend drawing.

- OpenGL uses `nodegl` with zero-copy Buffer views of the original position/UV
  vertices. SFML background
  and text drawing each save and restore GL state. Enter reloads or mipmaps
  the cube texture; Space recreates the window and background with the new
  sRGB request. Mipmapping and sRGB depend on the graphics driver.
  Its cube texture uses the current
  [sfml.js symbol](../../assets/branding/sfml-js-symbol-pentagon.svg),
  rasterized to 256 × 256 over the original dark-gray background.

- Vulkan uses SFML for the window, events and surface creation; `nvk` 0.8.0
  drives Vulkan directly, with no custom native bridge. SFML Graphics still
  uses OpenGL. This port uses `sf.Window`, which also creates an unused OpenGL
  context, so OpenGL window support is still required.
  The four original shader files (GLSL and SPIR-V) are unchanged;
  the logo texture uses the current sfml.js symbol as a transparent 256 × 256 PNG.

- Cocoa creates the original XIB layout in JavaScript with `objc-js`.
  `sf.RenderWindow(BigInt(NSView*))` borrows the native view. An `NSTimer`
  renders at 60 Hz in default and event-tracking modes while Node dispatches
  AppKit input. The app menu is reduced to Quit and standard text editing;
  no app bundle or XIB compilation is needed. Cleanup invalidates the timer,
  closes SFML, then closes Cocoa and releases wrappers. The standalone entry
  exits explicitly because objc-js 1.6.0 class callbacks keep Node alive.

- Win32 uses `wndkit` for the parent window, Quit button and two native
  `STATIC` controls. `sf.RenderWindow(BigInt(HWND))` borrows each child.
  `Application.processMessages()` dispatches Win32 input between frames;
  Node yields with `setImmediate`. Control wrappers stay alive until the
  parent is destroyed. The close callback synchronously closes SFML before
  wndkit destroys HWNDs. The original fixed control layout and animations
  are retained; wndkit supplies a standard resizable window frame.

Only `android` remains unported.

Vulkan passed with Node.js 22 and Mesa lavapipe on
[Ubuntu 24.04][vulkan-linux-ci] and
[Windows Server 2022 with Mesa 26.0.3][vulkan-windows-ci].
Checks cover the SFML surface bridge, native pixels, rotation, mouse translation,
wide/tall resizing, minimize/restore, forced GC, Escape and window-close cleanup.
Linux Khronos synchronization validation reported no errors; the Windows runner
had no Khronos validation layer installed. The screenshot uses a fixed clock
sample on Linux. Other GPU drivers remain unverified.

Validation covers native window rendering, terrain generation, text/keyboard
interaction, audio decoding and Worker DSP, and local network exchanges.
Microphones, physical speaker output, joystick hardware, device hotplug and
external FTP/SFTP services still require testing on the target system.

nodegl verification uses Node.js 22 on macOS,
[Ubuntu 24.04 with Xvfb/Mesa 25.2.8][nodegl-linux-ci], and
[Windows Server 2022 with Mesa 26.0.3][nodegl-windows-ci].
Window and OpenGL checks cover native pixels, resizing, mipmap toggles,
sRGB window recreation, Escape/close cleanup and forced GC between frames.
The Linux X11 checks cover both child windows, different rotation speeds,
parent/child key exits and native window cleanup. SIGINT cleanup is verified
on macOS and Linux. Both CI renderers lack sRGB framebuffers; fallback and
recreation pass, while actual sRGB rendering is verified on macOS.
Other GPU drivers and XWayland remain unverified.

Cocoa was verified locally on macOS, including native controls, rendering
in default/event-tracking modes and exit cleanup. Its Up/Down input was
scripted. The Window screenshot uses a fixed clock sample on macOS.

Win32 passed on [Windows Server 2022, Node.js 22 and Mesa 26.0.3][win32-ci].
Checks cover both native child views, textured pixels, animation, forced GC,
Quit and WM_CLOSE input, and SFML cleanup before HWND destruction.
The screenshot uses scripted clock samples and crops the invisible resize
border. Other Windows versions and GPU drivers remain unverified.

## Sources and licenses

[provenance.json](provenance.json) records the upstream commit, source/XIB
hashes and SHA-256 hashes of 63 unchanged resource files, plus the sources
and conversion details for seven sfml.js logo assets in Cocoa, Shader, Tennis,
OpenGL and Vulkan. These assets use the project's approved branding, preserving
the original texture dimensions and transparency.

- SFML source: [zlib license](SFML-LICENSE.md).
- Upstream assets and their authors: [asset_licenses.md](asset_licenses.md).
- Noto fonts: [SIL Open Font License 1.1](text/resources/OFL.txt);
  original copyright metadata remains embedded in each font.
- Ported stb Perlin implementation: [MIT/public-domain dual license](island/stb_perlin.LICENSE).

[upstream]: https://github.com/SFML/SFML/tree/14cea1d978b3dce05780b9234925ca8be9373260/examples
[nodegl-linux-ci]: https://github.com/XadillaX/sfml.js/actions/runs/39219117768
[nodegl-windows-ci]: https://github.com/XadillaX/sfml.js/actions/runs/39218329674/job/117947399653
[win32-ci]: https://github.com/XadillaX/sfml.js/actions/runs/39233764250
[vulkan-linux-ci]: https://github.com/XadillaX/sfml.js/actions/runs/39272976562
[vulkan-windows-ci]: https://github.com/XadillaX/sfml.js/actions/runs/39273977175
