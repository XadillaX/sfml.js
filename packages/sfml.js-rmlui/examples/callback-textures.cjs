'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { parseArgs } = require('node:util');
const sfml = require('sfml.js');
const rmlui = require('../dist');

const width = 760;
const height = 480;
const size = { x: 128, y: 128 };

function quad(manager, dimensions, colour = [ 255, 255, 255, 255 ]) {
  const mesh = new rmlui.Mesh(4, 6);
  const floats = new Float32Array(mesh.vertices.buffer);
  const positions = [[ 0, 0 ], [ dimensions.x, 0 ],
    [ dimensions.x, dimensions.y ], [ 0, dimensions.y ]];
  const uv = [[ 0, 0 ], [ 1, 0 ], [ 1, 1 ], [ 0, 1 ]];
  for (let i = 0; i < positions.length; ++i) {
    floats[i * 5] = positions[i][0];
    floats[i * 5 + 1] = positions[i][1];
    mesh.vertices.set(colour, i * 20 + 8);
    floats[i * 5 + 3] = uv[i][0];
    floats[i * 5 + 4] = uv[i][1];
  }
  mesh.indices.set([ 0, 1, 2, 0, 2, 3 ]);
  return manager.makeGeometry(mesh);
}

function pixels(phase) {
  const bytes = new Uint8Array(size.x * size.y * 4);
  for (let y = 0; y < size.y; ++y) {
    for (let x = 0; x < size.x; ++x) {
      const index = (y * size.x + x) * 4;
      const radius = Math.hypot(x - 64, y - 64);
      const alpha = Math.round(
        255 * Math.max(0, Math.min(1, (61 - radius) / 6)));
      bytes[index] = Math.round((phase ? 75 : 237) * alpha / 255);
      bytes[index + 1] = Math.round((90 + y) * alpha / 255);
      bytes[index + 2] = Math.round((phase ? 229 : 94) * alpha / 255);
      bytes[index + 3] = alpha;
    }
  }
  return bytes;
}

function panel(context) {
  const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width:760px; height:480px; margin:0; background:#161e2a;
  font-family:LatoLatin; font-size:17px; color:#c4cddd; }
div { display:block; }
#heading { position:absolute; left:32px; top:28px;
  color:white; font-size:30px; }
#intro { position:absolute; left:32px; top:76px; color:#8f9db2; }
.panel { position:absolute; top:138px; width:216px; height:246px;
  background:#223147; border:1px #496077; border-radius:16px; }
#generated { left:32px; } #transferred { left:272px; } #snapshot { left:512px; }
.label { position:absolute; left:16px; top:188px;
  font-size:21px; color:white; }
.detail { position:absolute; left:16px; top:219px;
  font-size:14px; color:#8f9db2; }
#footer { position:absolute; left:32px; top:431px; color:#8f9db2; }
</style></head><body>
<div id="heading">Callback textures</div>
<div id="intro">Native ownership · Lazy generation · One submission</div>
<div class="panel" id="generated"><div class="label">RGBA generation</div>
<div class="detail">Premultiplied, cached bytes</div></div>
<div class="panel" id="transferred"><div class="label">Handle transfer</div>
<div class="detail">Checked size and ownership</div></div>
<div class="panel" id="snapshot"><div class="label">Layer snapshot</div>
<div class="detail">Scissored native texture copy</div></div>
<div id="footer">Space: regenerate colours · Escape: exit</div>
</body></rml>`);
  document.show();
  return document;
}

function generate(manager, phase, counters) {
  const bytes = pixels(phase);
  const handle = manager.generateTextureHandle(bytes, size);
  const generated = manager.makeCallbackTexture(api => {
    ++counters.generated;
    return api.generateTexture(bytes, size);
  });
  const transferred = manager.makeCallbackTexture(api => {
    ++counters.transferred;
    api.setTextureHandle(handle, size);
    return true;
  });
  return { generated, transferred, handle };
}

async function run(frameLimit, screenshot, exercise) {
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(width, height)), 'Callback textures',
    { settings: { stencilBits: 8 } });
  window.setFramerateLimit(60);
  try {
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
    const context = rmlui.createContext('callback-textures', width, height);
    const manager = context.getRenderManager();
    const document = panel(context);
    const geometry = quad(manager, size);
    const orange = quad(manager, { x: 70, y: 70 }, [ 245, 152, 59, 255 ]);
    const blue = quad(manager, { x: 70, y: 70 }, [ 72, 166, 222, 255 ]);
    const counters = { generated: 0, transferred: 0 };
    let phase = false;
    let resources = generate(manager, phase, counters);
    let regenerations = 1;
    let running = true;
    for (let frame = 0;
      running && window.isOpen() && frame < frameLimit; ++frame) {
      let regenerate = exercise && frame > 0 && frame % 3 === 0;
      let event;
      while ((event = window.pollEvent()) !== undefined) {
        if (event.is('Closed')) {
          running = false;
        } else if (event.is('KeyPressed')) {
          if (event.data.code === sfml.Keyboard.Key.Escape) {
            running = false;
          }
          if (event.data.code === sfml.Keyboard.Key.Space) {
            regenerate = true;
          }
        }
        context.processEvent(event);
      }
      if (!running) {
        break;
      }
      if (regenerate) {
        const old = resources.generated.toTexture();
        resources.generated.release();
        resources.transferred.release();
        resources.handle.release();
        assert.throws(() => old.getDimensions(), /valid|released/i);
        phase = !phase;
        resources = generate(manager, phase, counters);
        ++regenerations;
      }
      context.update();
      window.clear(sfml.Color.Black);
      window.flush();
      context.render();
      geometry.render({ x: 76, y: 172 }, resources.generated.toTexture());
      geometry.render({ x: 316, y: 172 }, resources.transferred.toTexture());
      assert.equal(resources.handle.isValid, false);
      assert.equal(counters.generated, regenerations);
      assert.equal(counters.transferred, regenerations);
      manager.setScissorRegion({
        p0: { x: 0, y: 0 }, p1: { x: 128, y: 128 },
      });
      manager.pushLayer();
      let captured;
      try {
        orange.render({ x: 12, y: 12 });
        blue.render({ x: 46, y: 46 });
        captured = manager.makeCallbackTexture(api => {
          api.saveLayerAsTexture();
          return true;
        });
        assert.deepEqual(captured.toTexture().getDimensions(), size);
      } finally {
        manager.popLayer();
        manager.resetState();
      }
      geometry.render({ x: 556, y: 172 }, captured.toTexture());
      captured.release();
      if (screenshot && frame === frameLimit - 1) {
        const texture = new sfml.Texture(new sfml.Vector2u(width, height));
        texture.update(window);
        assert.ok(await texture.copyToImage().saveToFile(screenshot));
      }
      window.display();
    }
    resources.generated.release();
    resources.transferred.release();
    resources.handle.release();
    geometry.release();
    orange.release();
    blue.release();
    document.close();
    context.remove();
    console.log('Verified RGBA generation, handle transfer and snapshots');
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

const { values } = parseArgs({
  options: {
    frames: { type: 'string' },
    screenshot: { type: 'string' },
    exercise: { type: 'boolean', default: false },
  },
});
const frameLimit = values.frames === undefined
  ? Infinity : Number(values.frames);
if (values.frames !== undefined &&
    (!Number.isSafeInteger(frameLimit) || frameLimit < 1)) {
  throw new Error('--frames must be a positive integer');
}
run(frameLimit, values.screenshot, values.exercise).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
