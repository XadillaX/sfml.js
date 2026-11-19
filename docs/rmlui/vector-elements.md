# SVG and Lottie

`sfml.js-rmlui` compiles the upstream SVG and Lottie plugins into the Native
addon. RmlUi owns their parsing, geometry, textures and playback; regular
`context.update()` and `context.render()` calls execute their Native work.

```xml
<svg id="icon" width="40" height="20" viewBox="0 0 40 20">
  <rect width="40" height="20" fill="#00ff00"/>
</svg>
<svg src="assets/icon.svg" crop-to-content=""/>
<lottie src="assets/animation.json"/>
```

Use RCSS `width` and `height` to set the rendered box. `image-color` tints
the image and `opacity` changes its transparency. An SVG file or Lottie JSON
loads through the selected Native file interface, relative to the document URL.
SVG also supports the `svg("assets/icon.svg" crop-to-content)` decorator.
`crop-to-content` crops SVG to its content bounds.

```js
const { ElementSVG, ElementLottie } = require('sfml.js-rmlui');

const icon = document.getElementById('icon');

if (icon instanceof ElementSVG) {
  icon.innerRML = '<rect width="40" height="20" fill="#ff0000"/>';
  icon.ensureSourceLoaded();
}

const animation = new ElementLottie('lottie');

animation.setAttribute('src', 'assets/animation.json');
document.appendChild(animation);
```

Both classes retain the regular Element methods and checked ownership contract,
including direct construction, native RTTI and `getIntrinsicDimensions()`.
`ensureSourceLoaded()` invokes the upstream public method; layout/update/render
normally loads dirty sources automatically. SVG `innerRML` reads and replaces
inline XML. When `src` is set, upstream returns an empty inner string and ignores
inline replacement.

Lottie follows the Native system clock and loops automatically. Upstream
`renderSync` preserves the animation aspect ratio, centering it when the RCSS
box uses a different ratio. This upstream ElementLottie API provides no per-element
pause, speed or seek methods. A configured shared system clock controls runtime
time; it affects other timed behavior in that runtime too.

The build pins LunaSVG 3.5.0 with bundled PlutoVG 1.3.1 and rlottie 0.2 to exact
commits and archive SHA-256 digests in
[the dependency manifest](../../packages/sfml.js-rmlui/tools/dependencies/optional-dependencies.json).
The image decoder is linked into the addon and handles embedded Lottie PNG
assets without an external loader library. ARM64 uses rlottie's portable
rasterizer because this release's NEON implementation requires ARM32 assembly.

The [local acceptance record](audit/6.3/vector-native-contracts.md) covers
channels, alpha, source replacement, resize, cropping, decorators, animated
frames, embedded images and runtime restart on macOS arm64. Other platforms,
alternate font providers and whole-project acceptance remain separate.
