# sfml.js Documentation

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

> These guides cover the SFML 3.1.0 binding in the current repository. Start with "Quick start" if you are new to sfml.js; use [TypeDoc](https://sfml.js.org/reference/) to look up specific method signatures.

## Getting started

| Guide | What it covers |
| --- | --- |
| [Quick start](getting-started.md) | Install dependencies, choose an import style and open your first window |
| [Core concepts](concepts.md) | Copying values and resources, loading completion and when draws take effect |
| [API guide](api.md) | Capabilities of the five modules |
| [Examples](../examples/README.md) | Run complete demonstrations from the repository |

## Module guides

| Module | Contents |
| --- | --- |
| [System](system.md) | Vectors, angles, time, input streams, Unicode and error handling |
| [Window](window.md) | Window lifecycle, events, real-time input, OpenGL and Vulkan |
| [Graphics](graphics.md) | Images, textures, sprites, shapes, text, views and drawing |
| [Audio](audio.md) | Playback, streaming data, effects, recording and codecs |
| [Network](network.md) | Packet, TCP/UDP, DNS, TLS, HTTP, FTP and SFTP |

## Contributing

The [development guide](development.md) explains building, testing, source organization and the existing documentation publishing workflow.

Method signatures and exports are defined by [src/index.ts](../src/index.ts) and its source comments, published through [TypeDoc](https://sfml.js.org/reference/). Use the [SFML 3.1.0 C++ reference](https://www.sfml-dev.org/documentation/3.1.0/) for upstream concepts; use the sfml.js guides and TypeDoc for JavaScript adaptations, including Node.js asynchronous behavior, memory and networking.
