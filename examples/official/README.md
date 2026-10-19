# SFML official examples

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

JavaScript ports of 24 [SFML examples][upstream], covering graphics, native
windows, input, audio and networking. [Android](android/README.md) is not
ported yet.

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

Browse: [Graphics](#graphics) · [Platform integration](#platform) · [Input and events](#input) · [Audio](#audio) · [Networking](#network)

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
        <p><strong>Controls</strong> · Space or touch to start, Up/Down to move, Esc to exit</p>
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

| Example | Platform | Dependencies |
| --- | --- | --- |
| Window / OpenGL | macOS, Linux, Windows | `@wettstein/nodegl`, installed by the root `npm ci` |
| X11 | Linux with X11 | `x11` and `@wettstein/nodegl`, installed by the root `npm ci` |
| Cocoa | macOS | `npm ci --prefix cocoa --ignore-scripts` |
| Win32 | Windows x64, Node.js 20+ | `npm ci --prefix win32 --ignore-scripts` |
| Vulkan | Linux x64 (X11) or Windows x64, Node.js 20+ | `npm ci --prefix vulkan --ignore-scripts` |

Building nodegl requires CMake, a C++ compiler and OpenGL development libraries
(`libgl1-mesa-dev` on Linux). Vulkan also needs a Vulkan loader and a driver
supporting 4× anisotropic filtering.

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
        <p>A rotating six-colored cube in an OpenGL window</p>
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
        <p>SFML background and text with a textured OpenGL cube</p>
        <p><strong>Controls</strong> · mouse moves the cube, Enter toggles mipmapping, Space toggles sRGB, Esc exits</p>
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
        <p>A rotating textured cube rendered with Vulkan</p>
        <p><strong>Controls</strong> · mouse moves the cube, drag the window border to resize, Esc or window close exits</p>
        <p><code>node vulkan/Vulkan.cjs</code></p>
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
        <p>Native macOS controls with an embedded SFML view</p>
        <p><strong>Controls</strong> · Update or Enter applies text; Visible toggles the logo; the dial rotates it; Color selects the background; Up/Down scales it; close, Cmd+Q or Ctrl+C exits</p>
        <p><code>node cocoa/Cocoa.cjs</code></p>
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
        <p>A native Windows window with two animated SFML views and a Quit button</p>
        <p><strong>Controls</strong> · Quit, window close or Ctrl+C exits</p>
        <p><code>node win32/Win32.cjs</code></p>
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
        <p>Two embedded SFML windows with cubes rotating at different speeds</p>
        <p><strong>Controls</strong> · any key, window close or Ctrl+C exits</p>
        <p><code>node X11/X11.cjs</code></p>
      </td>
    </tr>
  </tbody>
</table>

<a id="input"></a>

## Input and events

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

Recording examples need a microphone and recording permission.

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

## Sources and licenses

Based on the [SFML examples][upstream]. Source revisions and asset provenance
are recorded in [provenance.json](provenance.json).

- SFML source: [zlib license](SFML-LICENSE.md).
- Upstream assets and their authors: [asset_licenses.md](asset_licenses.md).
- Noto fonts: [SIL Open Font License 1.1](text/resources/OFL.txt).
- Ported stb Perlin implementation: [MIT/public-domain dual license](island/stb_perlin.LICENSE).

[upstream]: https://github.com/SFML/SFML/tree/14cea1d978b3dce05780b9234925ca8be9373260/examples
