# SFML official examples

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

JavaScript ports of 18 examples from [SFML/SFML][upstream], pinned to commit
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

Browse: [Graphics](#graphics) · [Input and events](#input) · [Audio](#audio) · [Networking](#network)

Screenshots show native SFML windows on macOS. Click a preview for full resolution or a name for source code.

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
        <p><strong>Controls</strong> · Left/Right selects, mouse controls parameters</p>
        <p><code>node shader/Shader.cjs</code></p>
      </td>
    </tr>
    <tr>
      <td width="44%" valign="top">
        <a href="screenshots/tennis.png">
          <img src="screenshots/tennis.png" width="360"
               alt="Paddles and ball during a tennis game">
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

The seven platform/OpenGL integration examples (`X11`, `android`, `cocoa`,
`opengl`, `vulkan`, `win32`, `window`) remain outside this port: they require
platform UI integration or direct graphics-context APIs.

Validation covers native window rendering, terrain generation, text/keyboard
interaction, audio decoding and Worker DSP, and local network exchanges.
Microphones, physical speaker output, joystick hardware, device hotplug and
external FTP/SFTP services still require testing on the target system.

## Sources and licenses

[provenance.json](provenance.json) records the upstream commit, C++ source
hashes and SHA-256 hashes of all 53 unchanged resource files.

- SFML source: [zlib license](SFML-LICENSE.md).
- Upstream assets and their authors: [asset_licenses.md](asset_licenses.md).
- Noto fonts: [SIL Open Font License 1.1](text/resources/OFL.txt);
  original copyright metadata remains embedded in each font.
- Ported stb Perlin implementation: [MIT/public-domain dual license](island/stb_perlin.LICENSE).

[upstream]: https://github.com/SFML/SFML/tree/14cea1d978b3dce05780b9234925ca8be9373260/examples
