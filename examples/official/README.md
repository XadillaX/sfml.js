# SFML official examples

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

JavaScript ports of 22 examples from [SFML/SFML][upstream], pinned to commit
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
Graphical examples require a display and OpenGL. Audio input requires a
microphone and OS recording permission.

Browse: [Graphics](#graphics) · [Platform integration](#platform) · [Input and events](#input) · [Audio](#audio) · [Networking](#network)

The X11 screenshot comes from Linux CI with Xvfb/Mesa; the others show native windows on macOS. Click a preview for full resolution or a name for source code.

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
               alt="Edge post-effect applied to the sfml.js logo">
        </a>
      </td>
      <td valign="top">
        <p><strong><a href="shader/Shader.cjs">Shader</a></strong></p>
        <p>Five shader scenes</p>
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

Window and OpenGL use SFML windows and third-party `koffi` to call system desktop
OpenGL, using compatibility contexts on macOS, Linux and Windows.
macOS and Linux are verified; Windows remains untested.

X11 requires Linux, an X11 display server (or XWayland), and desktop OpenGL.
Running `npm ci` at the repository root installs the `x11` and `koffi`
development dependencies. No additional example module needs compilation.

Cocoa requires macOS and uses third-party [objc-js](https://github.com/iamEvanYT/objc-js).
Install its local dependency using the bundled prebuild (Apple Silicon or Intel):

```sh
# From examples/official
npm ci --prefix cocoa --ignore-scripts
node cocoa/Cocoa.cjs
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
  `sf.Window(BigInt(xid))` for borrowed-window OpenGL contexts, and `koffi`
  for calls into `libGL.so.1`. Vertex storage uses stable Koffi allocations.
  Cleanup closes SFML contexts, frees vertices, destroys the parent, then
  disconnects the X11 client.

- Window calls system OpenGL exports through `koffi`, retaining the six
  original face colors, 50/30/90 degrees-per-second rotation and a perspective
  projection updated on resize. Stable native vertex storage is freed after
  closing the window. Zero-sized viewports suspend drawing.

- OpenGL uses `koffi` with the original position/UV vertices. SFML background
  and text drawing each save and restore GL state. Enter reloads or mipmaps
  the cube texture; Space recreates the window and background with the new
  sRGB request. Mipmapping and sRGB depend on the graphics driver.
  Its cube texture uses the current
  [sfml.js symbol](../../assets/branding/sfml-js-symbol-pentagon.svg),
  rasterized to 256 × 256 over the original dark-gray background.

- Cocoa creates the original XIB layout in JavaScript with `objc-js`.
  `sf.RenderWindow(BigInt(NSView*))` borrows the native view. An `NSTimer`
  renders at 60 Hz in default and event-tracking modes while Node dispatches
  AppKit input. The app menu is reduced to Quit and standard text editing;
  no app bundle or XIB compilation is needed. Cleanup invalidates the timer,
  closes SFML, then closes Cocoa and releases wrappers. The standalone entry
  exits explicitly because objc-js 1.6.0 class callbacks keep Node alive.

Three examples remain unported: `android`, `vulkan`, `win32`.

Validation covers native window rendering, terrain generation, text/keyboard
interaction, audio decoding and Worker DSP, and local network exchanges.
Microphones, physical speaker output, joystick hardware, device hotplug and
external FTP/SFTP services still require testing on the target system.

During migration, X11, Window and OpenGL were verified on Ubuntu 24.04
with Node.js 22, Xvfb and Mesa. Physical GPUs and XWayland were not covered.
Cocoa was verified locally on macOS, including native controls, rendering
in default/event-tracking modes and exit cleanup. Its Up/Down input was
scripted. The Window screenshot uses a fixed clock sample on macOS.

## Sources and licenses

[provenance.json](provenance.json) records the upstream commit, source/XIB
hashes and SHA-256 hashes of 57 unchanged resource files, plus the sources
and conversion details for six sfml.js logo assets in Cocoa, Shader, Tennis
and OpenGL. These assets use the project's approved branding, preserving
the original texture dimensions and transparency.

- SFML source: [zlib license](SFML-LICENSE.md).
- Upstream assets and their authors: [asset_licenses.md](asset_licenses.md).
- Noto fonts: [SIL Open Font License 1.1](text/resources/OFL.txt);
  original copyright metadata remains embedded in each font.
- Ported stb Perlin implementation: [MIT/public-domain dual license](island/stb_perlin.LICENSE).

[upstream]: https://github.com/SFML/SFML/tree/14cea1d978b3dce05780b9234925ca8be9373260/examples
