# Native render session observations

`Context::Render` now runs inside a native `RenderSession`. Each frame starts
with transparent RmlUi content in an owned full-size `sf::RenderTexture`.
Successful traversal presents that texture over the host scene using
premultiplied alpha. A callback exception discards the current UI frame.
Both paths restore the host `sf::View`, adapter state and the context render
manager's cached state.

Session ownership, layer operations and stencil attachment verification live
in `native/rendering/layers/`. Pushed layers use `unique_ptr` ownership.
The spare pool retains at most eight size-compatible targets with a 32 MiB
color/stencil storage budget; old-size targets are released at resize
boundaries. Active layer nesting does not inherit the spare-pool limit.

Each newly allocated layer verifies eight-bit stencil behavior with actual
SFML geometry, reference 128 and a mismatching reference zero. The result is
cropped on the GPU before a single pixel is read on the CPU. Allocation or
verification failure throws through the existing native exception boundary.
This checks the allocated target, rather than assuming the requested context
settings describe its actual attachment.

## Pixel and state contracts

| Observation | Concrete assertion |
| --- | --- |
| Transparent UI domain | During a callback the host stays blue; red UI appears only after successful presentation |
| Readable layer zero | Copy base to a pushed layer, replace base from the copy, then apply a brightness self-composite |
| Premultiplied presentation | Half-transparent red filtered by brightness 0.5 produces red 64 and blue 127 over a blue host |
| Base mask lifetime | Capture a positioned alpha mask from layer zero, overwrite that layer and verify only the saved mask's pixels survive |
| Failed callback | Draw geometry, push a layer and throw; host pixels remain blue and the next render succeeds |
| Host view | A scene view with origin `(100, 100)` survives both real UI drawing and a failed callback |
| Manager state | Transform and scissor values survive success and failure, and subsequent direct geometry uses both correctly |
| Frame-external base | Direct manager operations capture the blue host, invert it to yellow and self-invert back to blue |
| Resize | A larger base target starts transparent and carries no pixels from the prior UI frame |

The frame-external host snapshot explicitly activates
`sf::RenderWindow::setActive` before `Texture::update(window)`. The latter
accepts `const Window&`, whose activation alone does not restore the window
framebuffer after an offscreen target. The pixel regression checks this
actual framebuffer transition.

Seven focused runtime scenarios pass on macOS arm64. Existing layer,
render-state and batching suites also pass. The first session run reproduced
three failures for host writes during traversal, base-mask validity and
failed-frame pixel rollback. A separate base-copy regression reproduced
transparent output before explicit host framebuffer activation.

## Evidence limits

This is local session and layer evidence. It does not establish full
perspective transforms, gradient programs, deep/overlapping clip correctness,
all backdrop combinations, large-scale blur/shadow scheduling or unavailable
GPU/allocation-failure behavior. Platform-device, official-application,
VisualTests and independent whole-change acceptance remain open.

The accompanying JSON records exact source, binary and verification-log
fingerprints, including the complete runtime run for this renderer revision.
