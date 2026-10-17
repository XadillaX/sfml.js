# API Guide

**English** · [简体中文](api.zh-CN.md) · [日本語](api.ja.md) · [한국어](api.ko.md)

> sfml.js is based on SFML 3.1.0. The handwritten guides explain usage, return values and Node.js adaptations; [TypeDoc](https://sfml.js.org/reference/) generates complete signatures and type constraints from the source.

[Documentation](README.md) · [Quick start](getting-started.md) · [Core concepts](concepts.md)

Import all public APIs from `sfml.js`; see [src/index.ts](../src/index.ts) for the export list. Application code does not need to access `dist/internal` or native module handles.

## Choose by task

| Task | Guide | Main APIs |
| --- | --- | --- |
| Calculate coordinates, angles and frame times | [System](system.md) | Vector2/3, Angle, Time, Clock, named operators |
| Integrate custom file sources | [Input streams](system.md#input-streams) | InputStream, MemoryInputStream, FileInputStream |
| Open windows and receive input | [Window](window.md) | RenderWindow, Window, Event, Keyboard, Mouse |
| Display images and animation | [Graphics](graphics.md) | Image, Texture, Sprite |
| Draw shapes and text | [Graphics](graphics.md) | Shape, Font, Glyph, Text |
| Cameras, off-screen composition and batched geometry | [Graphics](graphics.md) | View, RenderTexture, VertexArray, VertexBuffer |
| Custom drawing and shaders | [Graphics](graphics.md) | Drawable, RenderStates, Shader, Glsl |
| Play, record and process audio | [Audio](audio.md) | SoundBuffer, Sound, Music, SoundStream, SoundRecorder |
| Connect to networks and transfer files | [Network](network.md) | Packet, TcpSocket, UdpSocket, Http, Ftp, Sftp |

## System

`Vector2`/`Vector3` support multiple scalar types; `Vector2i/u/f` and `Vector3i/u/f` are common specializations. `degrees()`/`radians()` create an Angle, and time factories create a Time.

JavaScript does not support C++ operator overloading, so use `add()`, `multiply()`, `equal()` and `*Assign()` for the corresponding operations. This module also includes `Clock`, asynchronous `sleep()`, `TimeoutWithPredicate`, input streams, `Unicode` and error logging APIs.

See [System](system.md).

## Window

`Window` provides a system window and an OpenGL context. For 2D drawing, use `RenderWindow`, which combines Window and RenderTarget capabilities.

Receive events through `pollEvent()`, `handleEvents()` or synchronous `waitEvent()`. Keyboard, mouse, joystick and sensor APIs also provide real-time queries. `Clipboard`, `Cursor`, `Context` and `Vulkan` cover system integration.

See [Window](window.md).

## Graphics

Image stores CPU-side pixels, Texture stores a GPU texture, and Sprite references a texture for drawing. Shape provides circles, rectangles, convex polygons and custom convex shapes; Font and Text provide font loading, layout and editable vertices.

RenderTarget unifies drawing APIs for windows and off-screen targets. View controls the camera and viewport; RenderStates controls transforms, blending, stencil settings, textures and shaders. Vertex arrays and GPU vertex buffers let you organize geometry directly.

See [Graphics](graphics.md) and [draw snapshots](concepts.md#draw-snapshots).

## Audio

Use SoundBuffer + Sound for short effects and Music for long audio. SoundSource provides volume, panning and spatial audio properties; SoundStream, SoundRecorder and EffectProcessor use Worker callbacks to process custom data.

See [Audio](audio.md), paying particular attention to sample counts, channel layout and buffer lifetime.

## Network

Network implements SFML-style APIs using Node.js transports; production code does not call SFML C++ Network. Packet preserves SFML encoding conventions; TCP, UDP, DNS, TLS, HTTP, FTP and SFTP I/O use promises.

See [Network](network.md) for returned statuses, partial sends, protocol limits and shutdown methods.

## Compatibility boundaries

| Feature | Current behavior |
| --- | --- |
| C++ pointers and reference output parameters | Represented as objects, views or returned objects |
| C++ templates and operators | Represented by explicit scalar tags, classes and named functions |
| File loading | Uses promises, preserving each API's specific failure status |
| Destruction | Native ownership works with JS references; explicitly close resources that expose a close method |
| `drawAsync()`/`displayAsync()` | Not provided; legacy examples explicitly report them as unsupported |
| Android SuspendAwareClock | Conditionally compiled API; the current download flow targets desktops |
| Vulkan | Query APIs are exported; availability depends on the SFML platform backend, with no macOS backend |

See the [development guide](development.md#testing) for platform build and test coverage.

<a id="sfml-cpp-reference"></a>

## SFML C++ reference

[TypeDoc](https://sfml.js.org/reference/) is the authority for JavaScript signatures and types. The [SFML 3.1.0 reference index](https://www.sfml-dev.org/documentation/3.1.0/) is the authority for upstream C++ concepts, not a drop-in JavaScript API reference.

Each module guide links to relevant C++ classes and explains binding-specific differences: [System](system.md#sfml-cpp-reference), [Window](window.md#sfml-cpp-reference), [Graphics](graphics.md#sfml-cpp-reference), [Audio](audio.md#sfml-cpp-reference) and [Network](network.md#sfml-cpp-reference).
