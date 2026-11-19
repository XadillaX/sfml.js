'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function compareFrame(options) {
  const { rmlui, window, element, content, background, time, output, source,
    context, sfml } = options;
  const size = element.getBox().getSize(rmlui.BoxArea.Content);
  const width = Math.round(size.x);
  const height = Math.round(size.y);
  const raw = path.join(output, 'frame.bgra');
  const result = spawnSync(path.join(output, 'lottie-reference'),
    [ source, String(width), String(height), String(time), raw ], {
      encoding: 'utf8', timeout: 20000,
    });
  assert.equal(result.status, 0, result.stderr);
  const reference = fs.readFileSync(raw);
  assert.equal(reference.length, width * height * 4);

  rmlui.getSystemInterface().clock[0] = time;
  context.update();
  window.clear(sfml.Color.Black);
  window.flush();
  context.render();
  const texture = new sfml.Texture(window.getSize());
  texture.update(window);
  const rendered = texture.copyToImage().pixels;
  const offset = element.getAbsoluteOffset(rmlui.BoxArea.Content);
  const viewport = content.getAbsoluteOffset(rmlui.BoxArea.Content);
  const left = Math.round(offset.x);
  const top = Math.round(offset.y);
  const windowWidth = window.getSize().x;
  let compared = 0;
  let mismatches = 0;
  let maxDifference = 0;
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      // The original template clips to its content viewport and scrollbar.
      const screenX = left + x;
      const screenY = top + y;
      if (screenX < Math.ceil(viewport.x) ||
          screenY < Math.ceil(viewport.y) ||
          screenX >= Math.floor(viewport.x + content.clientWidth) ||
          screenY >= Math.floor(viewport.y + content.clientHeight)) {
        continue;
      }
      const sourceOffset = (y * width + x) * 4;
      const targetOffset = (screenY * windowWidth + screenX) * 4;
      const alpha = reference[sourceOffset + 3] / 255;
      for (const [ channel, bgra ] of [ 2, 1, 0 ].entries()) {
        const expected = Math.round(reference[sourceOffset + bgra] +
          background[targetOffset + channel] * (1 - alpha));
        const difference = Math.abs(rendered[targetOffset + channel] -
          expected);
        maxDifference = Math.max(maxDifference, difference);
        if (difference > 2) {
          mismatches++;
        }
        compared++;
      }
    }
  }
  assert.ok(compared > 30000, `original animation area: ${compared} channels`);
  assert.equal(mismatches, 0,
    `${time}s: ${mismatches} mismatched channels, max=${maxDifference}`);
  const metadata = JSON.parse(result.stdout);
  assert.equal(metadata.duration, 88 / 25);
  console.log(`PASS original Lottie ${time}s frame=${metadata.frame} ` +
    `${width}x${height} channels=${compared} max_error=${maxDifference}`);
  return metadata.frame;
}

function run(output) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const { createLottie } =
    require('../../examples/official/basic/lottie/main.cjs');
  const root = path.resolve(__dirname, '../../third_party/rmlui/Samples');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(1024, 768)), 'Lottie application',
    { settings: { stencilBits: 8 } });
  try {
    assert.ok(rmlui.initialise(window, { highDpi: false, fileRoot: root }));
    for (const font of [ 'Regular', 'Italic', 'Bold', 'BoldItalic' ]) {
      assert.ok(rmlui.loadFontFace(`assets/LatoLatin-${font}.ttf`));
    }
    const context = rmlui.createContext('lottie-application', 1024, 768);
    rmlui.getSystemInterface().clock[0] = 0;
    const application = createLottie(context);
    context.update();
    const element = application.document.querySelector('lottie');
    assert.ok(element instanceof rmlui.ElementLottie);
    assert.deepEqual(element.getIntrinsicDimensions().dimensions,
      { x: 300, y: 300 });
    assert.equal(application.document.getElementById('title').innerRML,
      'Lottie');
    const content = application.document.getElementById('content');
    element.setProperty('visibility', 'hidden');
    context.update();
    window.clear(sfml.Color.Black);
    window.flush();
    context.render();
    const texture = new sfml.Texture(window.getSize());
    texture.update(window);
    const background = texture.copyToImage().pixels;
    element.setProperty('visibility', 'visible');
    const frames = [];
    for (const time of [ 0, 0.731, 1.419, 2.783, 3.521, 3.913 ]) {
      frames.push(compareFrame({
        rmlui, sfml, window, context, element, content, background,
        time, output, source: path.join(root,
          'basic/lottie/data/a_mountain.json'),
      }));
    }
    assert.ok(new Set(frames).size >= 5);
    application.close();
    context.update();
    assert.equal(context.getNumDocuments(), 0);
    assert.throws(() => element.ensureSourceLoaded(), /valid/i);
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.platform === 'darwin') {
  const output = path.join(os.tmpdir(), 'sfmljs-rmlui-lottie-reference');
  fs.mkdirSync(output, { recursive: true });
  const build = spawnSync('python3', [
    path.join(__dirname,
      '../native/rendering/reference/build-lottie-reference.py'), output,
  ], { encoding: 'utf8', timeout: 70000 });
  assert.equal(build.status, 0, build.stderr);
  run(output);
} else {
  console.log('SKIP direct rlottie oracle: requires existing macOS archive');
}
