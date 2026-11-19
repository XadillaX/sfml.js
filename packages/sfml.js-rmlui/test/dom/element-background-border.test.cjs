'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function extent(geometry) {
  const mesh = geometry.getMesh();
  const points = Array.from({ length: mesh.vertexCount },
    (_, index) => mesh.getVertex(index).position);
  assert.ok(points.length > 0);
  return {
    width: Math.max(...points.map(point => point.x)) -
      Math.min(...points.map(point => point.x)),
    height: Math.max(...points.map(point => point.y)) -
      Math.min(...points.map(point => point.y)),
  };
}

function pixel(options, x, y) {
  const { sfml, window } = options;
  const texture = new sfml.Texture(window.getSize());
  texture.update(window);
  const value = texture.copyToImage().getPixel(new sfml.Vector2u(x, y));
  return [ value.r, value.g, value.b, value.a ];
}

const cases = {
  'canonical-component-and-independent-clip-area-snapshots':
    ({ rmlui, target }) => {
      const background = target.getElementBackgroundBorder();
      assert.ok(background instanceof rmlui.ElementBackgroundBorder);
      assert.strictEqual(target.getElementBackgroundBorder(), background);
      const areas = [
        [ rmlui.BoxArea.Border, 54, 44 ],
        [ rmlui.BoxArea.Padding, 50, 40 ],
        [ rmlui.BoxArea.Content, 40, 30 ],
      ];
      for (const [ area, width, height ] of areas) {
        const first = background.getClipGeometry(area);
        const second = background.getClipGeometry(area);
        assert.ok(first instanceof rmlui.Geometry);
        assert.equal(first.isValid, true);
        assert.deepEqual(extent(first), { width, height });
        first.release();
        assert.deepEqual(extent(second), { width, height });
        second.getMesh().vertices.fill(0);
        assert.deepEqual(extent(background.getClipGeometry(area)),
          { width, height });
      }
      assert.throws(() => background.getClipGeometry(rmlui.BoxArea.Margin),
        /clip area/i);
      assert.throws(() => background.getClipGeometry('content'), /clip area/i);
    },

  'native-background-and-border-render-visible-pixels':
    options => {
      const { context, target, window, sfml } = options;
      const background = target.getElementBackgroundBorder();
      window.clear(sfml.Color.Black);
      window.flush();
      context.getRenderManager().prepareRender({ x: 240, y: 200 });
      background.render();
      assert.deepEqual(pixel(options, 15, 15), [ 255, 0, 0, 255 ]);
      assert.deepEqual(pixel(options, 10, 20), [ 0, 255, 0, 255 ]);
      assert.deepEqual(pixel(options, 90, 90), [ 0, 0, 0, 255 ]);
    },

  'dirty-background-border-and-resize-preserve-old-snapshots':
    options => {
      const { rmlui, context, target, window, sfml } = options;
      const background = target.getElementBackgroundBorder();
      const oldClip = background.getClipGeometry(rmlui.BoxArea.Border);
      target.setProperty('width', '70px');
      target.setProperty('border-width', '4px');
      target.setProperty('background-color', '#0000ff');
      target.setProperty('border-color', '#ff00ff');
      context.update();
      background.dirtyBackground();
      background.dirtyBorder();
      window.clear(sfml.Color.Black);
      window.flush();
      context.getRenderManager().prepareRender({ x: 240, y: 200 });
      background.render();
      assert.deepEqual(extent(background.getClipGeometry(rmlui.BoxArea.Border)),
        { width: 88, height: 48 });
      assert.deepEqual(extent(oldClip), { width: 54, height: 44 });
      assert.deepEqual(pixel(options, 70, 20), [ 0, 0, 255, 255 ]);
      assert.deepEqual(pixel(options, 11, 20), [ 255, 0, 255, 255 ]);
      oldClip.release();
    },

  'rounded-native-clip-mesh-renders-and-retains-rectangular-snapshot':
    options => {
      const { rmlui, context, target, window, sfml } = options;
      const background = target.getElementBackgroundBorder();
      const rectangle = background.getClipGeometry(rmlui.BoxArea.Border);
      target.setProperty('border-radius', '12px');
      context.update();
      background.dirtyBorder();
      background.render();
      const rounded = background.getClipGeometry(rmlui.BoxArea.Border);
      assert.ok(
        rounded.getMesh().vertexCount > rectangle.getMesh().vertexCount);
      window.clear(sfml.Color.Black);
      window.flush();
      context.getRenderManager().prepareRender({
        x: context.dimensions.width, y: context.dimensions.height,
      });
      rounded.render({ x: 10, y: 10 });
      assert.deepEqual(pixel(options, 10, 10), [ 0, 0, 0, 255 ]);
      assert.deepEqual(pixel(options, 30, 15), [ 255, 255, 255, 255 ]);
      rectangle.render({ x: 10, y: 10 });
      assert.deepEqual(pixel(options, 10, 10), [ 255, 255, 255, 255 ]);
      rectangle.release();
      rounded.release();
    },

  'missing-manager-destroyed-element-and-resource-lifetime':
    ({ rmlui, context, document, target }) => {
      const detached = document.createElement('div');
      const own = detached.getElementBackgroundBorder();
      assert.equal(detached.getRenderManager(), null);
      own.dirtyBackground();
      own.dirtyBorder();
      own.render();
      const empty = own.getClipGeometry(rmlui.BoxArea.Content);
      assert.equal(empty.isValid, false);
      document.appendChild(detached);
      const background = target.getElementBackgroundBorder();
      const snapshot = background.getClipGeometry(rmlui.BoxArea.Border);
      const mesh = snapshot.getMesh();
      document.close();
      context.update();
      for (const operation of [
        () => background.render(), () => background.dirtyBackground(),
        () => background.dirtyBorder(),
        () => background.getClipGeometry(rmlui.BoxArea.Content),
      ]) {
        assert.throws(operation, /no longer valid/i);
      }
      assert.deepEqual(extent(snapshot), { width: 54, height: 44 });
      context.remove();
      rmlui.releaseRenderManagers();
      assert.throws(() => snapshot.getMesh(), /no longer valid/i);
      assert.equal(mesh.vertexCount > 0, true);
    },

  'render-rejects-foreign-active-layer-and-effect-reentry':
    ({ rmlui, context, target }) => {
      const background = target.getElementBackgroundBorder();
      const other = new rmlui.RenderManager(rmlui.getRenderInterface());
      other.prepareRender({ x: 240, y: 200 });
      other.pushLayer();
      assert.throws(() => background.render(), /different render manager/i);
      other.popLayer();
      let calls = 0;
      const decorator = new rmlui.Decorator(context.getRenderManager(), {
        generateElementData: () => ({}),
        renderElement() {
          calls++;
          assert.throws(() => background.render(), /callback/i);
          assert.throws(() => background.dirtyBackground(), /callback/i);
          assert.throws(() => background.dirtyBorder(), /callback/i);
          assert.throws(() => background.getClipGeometry(rmlui.BoxArea.Border),
            /callback/i);
        },
        releaseElementData() {},
      });
      rmlui.DecoratorInstancer.register('background-reentry',
        new rmlui.DecoratorInstancer(() => decorator));
      target.setProperty('decorator', 'background-reentry()');
      context.update();
      context.render();
      assert.ok(calls > 0);
      background.render();
    },

  'component-owner-gc-and-snapshot-storage-survive-shutdown':
    async ({ rmlui, document, target }) => {
      let element = document.createElement('div');
      const background = element.getElementBackgroundBorder();
      const weak = new WeakRef(element);
      element = null;
      const geometry = target.getElementBackgroundBorder()
        .getClipGeometry(rmlui.BoxArea.Border);
      const mesh = geometry.getMesh();
      for (let i = 0; i < 12; ++i) {
        await new Promise(resolve => setImmediate(resolve));
        global.gc();
      }
      assert.ok(weak.deref());
      background.dirtyBorder();
      rmlui.shutdown();
      assert.throws(() => background.render(), /initiali[sz]/i);
      assert.throws(() => geometry.getMesh(), /initiali[sz]/i);
      assert.equal(mesh.vertexCount > 0, true);
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(240, 200)), 'Element background');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('background', 240, 200);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 240px; height: 200px; margin: 0; }
#target { display: block; position: absolute; left: 10px; top: 10px;
  width: 40px; height: 30px; padding: 5px; border: 2px #00ff00;
  background-color: #ff0000; }
</style></head><body><div id="target"/></body></rml>`);
    document.show();
    context.update();
    context.render();
    await cases[name]({
      document, context, rmlui, window, sfml,
      target: document.getElementById('target'),
    });
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  run(process.argv[2]).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  let failures = 0;
  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath, [
      '--expose-gc', __filename, name,
    ], { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0 || /Leaking \w+ detected/.test(result.stderr)) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} background regressions failed`);
}
