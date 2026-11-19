'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { parseArgs } = require('node:util');
const sfml = require('sfml.js');
const rmlui = require('../dist');

const width = 760;
const height = 480;

function makeQuad(manager, colour, size) {
  const mesh = new rmlui.Mesh(4, 6);
  const floats = new Float32Array(mesh.vertices.buffer);
  const positions = [[ 0, 0 ], [ size.x, 0 ],
    [ size.x, size.y ], [ 0, size.y ]];
  for (let i = 0; i < positions.length; ++i) {
    floats[i * 5] = positions[i][0];
    floats[i * 5 + 1] = positions[i][1];
    mesh.vertices.set(colour, i * 20 + 8);
  }
  mesh.indices.set([ 0, 1, 2, 0, 2, 3 ]);
  return manager.makeGeometry(mesh);
}

function loadPanel(context) {
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
#blend { left:32px; } #blur { left:272px; } #mask { left:512px; }
.label { position:absolute; left:16px; top:188px;
  font-size:21px; color:white; }
.detail { position:absolute; left:16px; top:219px;
  font-size:14px; color:#8f9db2; }
#footer { position:absolute; left:32px; top:431px; color:#8f9db2; }
</style></head><body>
<div id="heading">Layer composition</div>
<div id="intro">
Native offscreen targets, ordered filters and alpha snapshots</div>
<div class="panel" id="blend"><div class="label">Nested blend</div>
<div class="detail">Premultiplied source over</div></div>
<div class="panel" id="blur"><div class="label">Gaussian blur</div>
<div class="detail">Same-layer filter composition</div></div>
<div class="panel" id="mask"><div class="label">Saved alpha mask</div>
<div class="detail">Snapshot survives source pop</div></div>
<div id="footer">Space: move shapes · Escape: exit · All layers balanced</div>
</body></rml>`);
  document.show();
  return document;
}

function drawLayers(manager, geometry, filters, offset) {
  const base = manager.getTopLayer();
  const outer = manager.pushLayer();
  try {
    geometry.blue.render({ x: 55, y: 180 });
    const inner = manager.pushLayer();
    try {
      geometry.red.render({ x: 94 + offset, y: 210 });
      manager.compositeLayers(inner, outer, rmlui.BlendMode.Blend);
    } finally {
      manager.popLayer();
    }
    manager.compositeLayers(outer, base, rmlui.BlendMode.Blend);
  } finally {
    manager.popLayer();
  }

  const blurred = manager.pushLayer();
  try {
    geometry.orange.render({ x: 326 + offset, y: 195 });
    manager.compositeLayers(blurred, blurred, rmlui.BlendMode.Replace, filters);
    manager.compositeLayers(blurred, base, rmlui.BlendMode.Blend);
  } finally {
    manager.popLayer();
  }

  const saved = manager.getState();
  let mask;
  const maskFilters = new rmlui.FilterHandleList();
  try {
    manager.setScissorRegion({
      p0: { x: 530, y: 160 }, p1: { x: 710, y: 315 },
    });
    manager.pushLayer();
    try {
      geometry.mask.render({ x: 564 + offset, y: 188 });
      mask = manager.saveLayerAsMaskImage();
      assert.ok(mask.isValid);
      mask.addHandleTo(maskFilters);
    } finally {
      manager.popLayer();
    }
    const source = manager.pushLayer();
    try {
      geometry.blue.render({ x: 540, y: 174 });
      geometry.red.render({ x: 575 + offset, y: 215 });
      manager.compositeLayers(source, base, rmlui.BlendMode.Blend, maskFilters);
    } finally {
      manager.popLayer();
    }
  } finally {
    maskFilters.clear();
    mask?.release();
    manager.setState(saved);
    for (const clip of saved.clipMaskList) {
      clip.geometry.release();
    }
  }
  assert.equal(manager.getTopLayer(), base);
  assert.throws(() => manager.getNextLayer(), /empty/i);
}

async function run(frameLimit, screenshot, exercise) {
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(width, height)), 'Layer composition',
    { settings: { stencilBits: 8 } });
  window.setFramerateLimit(60);
  try {
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
    const context = rmlui.createContext('layer-composition', width, height);
    const manager = context.getRenderManager();
    const document = loadPanel(context);
    const geometry = {
      blue: makeQuad(manager, [ 66, 157, 210, 255 ], { x: 140, y: 110 }),
      red: makeQuad(manager, [ 153, 45, 57, 170 ], { x: 110, y: 90 }),
      orange: makeQuad(manager, [ 246, 164, 78, 255 ], { x: 96, y: 96 }),
      mask: makeQuad(manager, [ 255, 255, 255, 255 ], { x: 104, y: 110 }),
    };
    const filters = new rmlui.FilterHandleList();
    const blur = manager.compileFilter('blur', { sigma: 6 });
    assert.ok(blur.isValid);
    blur.addHandleTo(filters);
    let running = true;
    let offset = 0;
    for (let frame = 0;
      running && window.isOpen() && frame < frameLimit; ++frame) {
      let event;
      while ((event = window.pollEvent()) !== undefined) {
        if (event.is('Closed')) {
          running = false;
        } else if (event.is('KeyPressed')) {
          if (event.data.code === sfml.Keyboard.Key.Escape) {
            running = false;
          } else if (event.data.code === sfml.Keyboard.Key.Space) {
            offset = offset === 0 ? 16 : 0;
          }
        }
        context.processEvent(event);
      }
      if (!running) {
        break;
      }
      if (exercise) {
        offset = frame % 2 === 0 ? 16 : 0;
      }
      context.update();
      window.clear(sfml.Color.Black);
      window.flush();
      context.render();
      drawLayers(manager, geometry, filters, offset);
      if (screenshot && frame === frameLimit - 1) {
        const texture = new sfml.Texture(new sfml.Vector2u(width, height));
        texture.update(window);
        assert.ok(await texture.copyToImage().saveToFile(screenshot));
      }
      window.display();
    }
    filters.clear();
    blur.release();
    for (const value of Object.values(geometry)) {
      value.release();
    }
    document.close();
    context.remove();
    console.log('Verified nested blend, self-composite blur and saved mask');
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
