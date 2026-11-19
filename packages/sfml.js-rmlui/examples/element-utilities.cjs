'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { parseArgs } = require('node:util');
const sfml = require('sfml.js');
const rmlui = require('../dist');

const width = 760;
const height = 480;
const anchors = [
  rmlui.PositionAnchor.TopLeft, rmlui.PositionAnchor.TopRight,
  rmlui.PositionAnchor.BottomRight, rmlui.PositionAnchor.BottomLeft,
];

function loadInspector(context) {
  const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 760px; height: 480px; margin: 0; font-family: LatoLatin;
  font-size: 17px; color: #c4cddd; background: #161e2a; }
div { display: block; }
#heading { position: absolute; left: 32px; top: 26px;
  font-size: 30px; color: #fff; }
#intro { position: absolute; left: 32px; top: 76px; color: #8f9db2; }
#readout { position: absolute; left: 32px; top: 148px;
  width: 300px; line-height: 30px; }
#readout strong { color: #9dd5ff; }
#stage { position: absolute; left: 356px; top: 138px;
  width: 352px; height: 252px; background: #223147;
  border: 1px #496077; border-radius: 16px; overflow: hidden; }
#card { width: 146px; height: 66px; padding: 12px;
  background: #427da4; border: 2px #a7dcff; border-radius: 12px;
  overflow: hidden; font-size: 22px; color: white; }
#card-content { position: relative; width: 220px; height: 120px; }
.card-line { font-size: 14px; color: #d0eaff; margin-top: 8px; }
#footer { position: absolute; left: 32px; top: 432px; color: #8f9db2; }
</style></head><body>
<div id="heading">Element inspector</div>
<div id="intro">Native layout, text measurement and clipping snapshots</div>
<div id="readout"/>
<div id="stage"><div id="card"><div id="card-content">
Anchored card<div class="card-line">Rounded native clipping</div>
<div class="card-line">This line extends beyond the card</div>
</div></div></div>
<div id="footer">Space: next corner · Escape: exit · Cyan: border bounds</div>
</body></rml>`);
  document.show();
  return document;
}

function inspect(context, document, anchor) {
  const utilities = rmlui.ElementUtilities;
  const card = utilities.getElementById(document, 'card');
  const content = utilities.getElementById(card, 'card-content');
  assert.ok(utilities.positionElement(card, { x: 18, y: 18 }, anchor));
  const clipping = utilities.getClippingRegion(content, true);
  assert.ok(clipping.clipMask.length > 0);
  let triangles = 0;
  for (const mask of clipping.clipMask) {
    triangles += mask.geometry.getMesh().indices.length / 3;
    mask.geometry.release();
  }
  const bounds = utilities.getBoundingBox(card, rmlui.BoxArea.Border);
  const right = [ rmlui.PositionAnchor.TopRight,
    rmlui.PositionAnchor.BottomRight ].includes(anchor);
  const bottom = [ rmlui.PositionAnchor.BottomRight,
    rmlui.PositionAnchor.BottomLeft ].includes(anchor);
  const expected = {
    x: right ? 517 : 375,
    y: bottom ? 279 : 157,
  };
  assert.deepEqual(bounds.p0, expected);
  const box = utilities.buildBox({ x: 352, y: 252 }, card);
  assert.equal(box.content[0], 146);
  assert.equal(box.content[1], 66);
  const labelWidth = utilities.getStringWidth(card, 'Anchored card');
  assert.ok(labelWidth > 0);
  const count = utilities.getElementsByClassName(card, 'card-line').length;
  assert.equal(count, 2);
  const ratio = utilities.getDensityIndependentPixelRatio(card);
  document.getElementById('readout').innerRML = `
<strong>${rmlui.PositionAnchor[anchor]}</strong><br/>
Content box: ${box.content[0]} × ${box.content[1]}<br/>
Border box: ${bounds.p1.x - bounds.p0.x} × ${bounds.p1.y - bounds.p0.y}<br/>
Text width: ${labelWidth} px<br/>
Density ratio: ${ratio}<br/>
Clipping masks: ${clipping.clipMask.length}<br/>
Mask triangles: ${triangles}<br/>
Class matches: ${count}`;
  context.update();
  utilities.positionElement(card, { x: 18, y: 18 }, anchor);
  return utilities.getBoundingBox(card, rmlui.BoxArea.Border);
}

function makeMarker(manager) {
  const mesh = new rmlui.Mesh(4, 6);
  const floats = new Float32Array(mesh.vertices.buffer);
  const positions = [[ 0, 0 ], [ 240, 0 ], [ 240, 2 ], [ 0, 2 ]];
  for (let i = 0; i < positions.length; ++i) {
    floats[i * 5] = positions[i][0];
    floats[i * 5 + 1] = positions[i][1];
    mesh.vertices.set([ 157, 213, 255, 255 ], i * 20 + 8);
  }
  mesh.indices.set([ 0, 1, 2, 0, 2, 3 ]);
  return manager.makeGeometry(mesh);
}

function renderMarker(manager, marker, document, bounds) {
  const saved = manager.getState();
  const clipping = rmlui.ElementUtilities.getClippingRegion(
    document.getElementById('card-content'), true);
  try {
    manager.setScissorRegion(clipping.region);
    manager.setClipMask(clipping.clipMask);
    const matrix = new Float32Array([
      1, 0, 0, 0, 0, 1, 0, 0,
      0, 0, 1, 0, bounds.p0.x - 20, bounds.p1.y - 18, 0, 1,
    ]);
    manager.setTransform(matrix);
    marker.render({ x: 0, y: 0 });
  } finally {
    manager.setState(saved);
    for (const mask of [ ...saved.clipMaskList, ...clipping.clipMask ]) {
      mask.geometry.release();
    }
  }
  const restored = manager.getState();
  assert.equal(restored.scissorRegion, null);
  assert.equal(restored.clipMaskList.length, 0);
  assert.equal(restored.transform[12], 0);
  assert.equal(restored.transform[13], 0);
}

async function run(frameLimit, screenshotPath, exercise) {
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(width, height)), 'Element inspector',
    { settings: { stencilBits: 8 } });
  window.setFramerateLimit(60);
  try {
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
    const context = rmlui.createContext('element-inspector', width, height);
    const manager = context.getRenderManager();
    const marker = makeMarker(manager);
    const document = loadInspector(context);
    context.update();
    let anchorIndex = 0;
    let dirty = true;
    let running = true;
    let bounds;
    const outline = new sfml.RectangleShape();
    outline.setFillColor(sfml.Color.Transparent);
    outline.setOutlineColor(new sfml.Color(157, 213, 255));
    outline.setOutlineThickness(1);
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
            anchorIndex = (anchorIndex + 1) % anchors.length;
            dirty = true;
          }
        }
        context.processEvent(event);
      }
      if (!running) {
        break;
      }
      if (exercise && frame < anchors.length) {
        anchorIndex = frame;
        dirty = true;
      }
      context.update();
      if (dirty) {
        bounds = inspect(context, document, anchors[anchorIndex]);
        outline.setSize(new sfml.Vector2f(
          bounds.p1.x - bounds.p0.x, bounds.p1.y - bounds.p0.y));
        outline.setPosition(new sfml.Vector2f(bounds.p0.x, bounds.p0.y));
        console.log(`Verified ${rmlui.PositionAnchor[anchors[anchorIndex]]}`,
          JSON.stringify(bounds));
        dirty = false;
      }
      window.clear(sfml.Color.Black);
      window.flush();
      context.render();
      renderMarker(manager, marker, document, bounds);
      window.draw(outline);
      window.flush();
      if (screenshotPath && frame === frameLimit - 1) {
        const texture = new sfml.Texture(new sfml.Vector2u(width, height));
        texture.update(window);
        assert.ok(await texture.copyToImage().saveToFile(screenshotPath));
      }
      window.display();
    }
    marker.release();
    context.remove();
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
