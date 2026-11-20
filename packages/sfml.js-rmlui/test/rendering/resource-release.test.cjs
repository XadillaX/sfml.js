'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// A real, uncompressed 2x2 TGA makes texture-cache invalidation observable.
function writeTexture(file, [ red, green, blue ]) {
  const header = Buffer.alloc(18);
  header[2] = 2;
  header.writeUInt16LE(2, 12);
  header.writeUInt16LE(2, 14);
  header[16] = 24;
  fs.writeFileSync(file, Buffer.concat([
    header, Buffer.from(Array(4).fill([ blue, green, red ]).flat()),
  ]));
}

function scene(context) {
  const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 80px; height: 60px; margin: 0; }
img { position: absolute; left: 0; top: 0; width: 40px; height: 40px; }
</style></head><body><img id="image" src="/texture.tga"/></body></rml>`);
  document.show();
  context.update();
  return document;
}

function capture(sfml, window, context) {
  window.clear(sfml.Color.Black);
  window.flush();
  context.render();
  const size = window.getSize();
  const texture = new sfml.Texture(size);
  texture.update(window);
  const pixels = texture.copyToImage().pixels;
  const offset = (10 * size.x + 10) * 4;
  return [ ...pixels.slice(offset, offset + 3) ];
}

const cases = {
  'backslash-release-invalidates-preloaded-textures': async function({
    rmlui, sfml, window, context, file,
  }) {
    const renderer = rmlui.getRenderInterface();
    await rmlui.preloadResources({ textures: [ 'texture.tga' ] });
    scene(context);
    assert.deepEqual(capture(sfml, window, context), [ 255, 0, 0 ]);

    writeTexture(file, [ 0, 255, 0 ]);
    assert.equal(rmlui.releaseTexture('assets\\..\\texture.tga', renderer),
      true);
    assert.deepEqual(capture(sfml, window, context), [ 0, 255, 0 ]);

    await rmlui.preloadResources({ textures: [ 'texture.tga' ] });
    writeTexture(file, [ 0, 0, 255 ]);
    assert.equal(rmlui.releaseTexture('/texture.tga'), true);
    assert.deepEqual(capture(sfml, window, context), [ 0, 0, 255 ]);
  },

  'release-preserves-custom-canonical-and-special-sources': function({
    rmlui, sfml, window, file,
  }) {
    rmlui.shutdown();
    const system = new rmlui.SystemInterface(window, {
      joinPath(document, source) {
        assert.ok(!source.startsWith('?'), 'special sources bypass JoinPath');
        return `./${source}`;
      },
    });
    rmlui.setSystemInterface(system);
    assert.ok(rmlui.initialise(window, {
      fileRoot: path.dirname(file), highDpi: false,
    }));
    const context = rmlui.createContext('custom-paths', 80, 60);
    const document = context.loadDocumentFromMemory(
      '<rml><body><img src="texture.tga" style="width:40px;height:40px"/>' +
      '</body></rml>');
    document.show();
    context.update();
    assert.deepEqual(capture(sfml, window, context), [ 255, 0, 0 ]);
    assert.deepEqual(rmlui.getTextureSourceList(), [ './texture.tga' ]);

    writeTexture(file, [ 0, 255, 0 ]);
    assert.equal(rmlui.releaseTexture('./texture.tga'), true);
    assert.deepEqual(capture(sfml, window, context), [ 0, 255, 0 ]);

    writeTexture(file, [ 0, 0, 255 ]);
    assert.equal(rmlui.releaseTexture('texture.tga'), true);
    assert.deepEqual(capture(sfml, window, context), [ 0, 0, 255 ]);
    assert.equal(rmlui.releaseTexture('?external-texture'), false);
  },

  'scoped-release-and-source-snapshots': function({
    rmlui, sfml, window, context, file,
  }) {
    window.setSize(new sfml.Vector2u(112, 72));
    const first = rmlui.getRenderInterface();
    assert.strictEqual(context.renderInterface, first);
    const second = rmlui.createRenderInterface(window);
    assert.notStrictEqual(first, second);
    const other = rmlui.createContext('other', 80, 60, second);
    assert.strictEqual(other.renderInterface, second);
    scene(context);
    scene(other);
    assert.deepEqual(capture(sfml, window, context), [ 255, 0, 0 ]);
    assert.deepEqual(capture(sfml, window, other), [ 255, 0, 0 ]);
    const sources = rmlui.getTextureSourceList();
    assert.deepEqual(sources, [ 'texture.tga', 'texture.tga' ]);
    sources.length = 0;
    assert.equal(rmlui.getTextureSourceList().length, 2);
    writeTexture(file, [ 0, 255, 0 ]);
    assert.equal(rmlui.releaseTexture('/missing.tga', first), false);
    assert.equal(rmlui.releaseTexture('texture.tga', first), true);
    assert.equal(rmlui.releaseTexture('texture.tga', first), false);
    assert.deepEqual(capture(sfml, window, other), [ 255, 0, 0 ]);
    assert.deepEqual(capture(sfml, window, context), [ 0, 255, 0 ]);
    assert.equal(rmlui.releaseTextures(second), undefined);
    assert.deepEqual(capture(sfml, window, other), [ 0, 255, 0 ]);
    writeTexture(file, [ 0, 0, 255 ]);
    assert.equal(rmlui.releaseTexture('texture.tga'), true);
    assert.deepEqual(capture(sfml, window, context), [ 0, 0, 255 ]);
    assert.deepEqual(capture(sfml, window, other), [ 0, 0, 255 ]);
    writeTexture(file, [ 255, 255, 0 ]);
    rmlui.releaseTextures(null);
    assert.deepEqual(capture(sfml, window, context), [ 255, 255, 0 ]);
    assert.deepEqual(capture(sfml, window, other), [ 255, 255, 0 ]);
    rmlui.releaseCompiledGeometry(first);
    rmlui.releaseCompiledGeometry(null);
    rmlui.releaseCompiledGeometry();
    assert.deepEqual(capture(sfml, window, context), [ 255, 255, 0 ]);
    assert.deepEqual(capture(sfml, window, other), [ 255, 255, 0 ]);
  },

  'unused-manager-cleanup-and-reuse': function({
    rmlui, sfml, window, context,
  }) {
    const first = rmlui.getRenderInterface();
    const second = rmlui.createRenderInterface(window);
    const other = rmlui.createContext('other', 80, 60, second);
    scene(context);
    scene(other);
    capture(sfml, window, context);
    capture(sfml, window, other);
    other.remove();
    assert.equal(rmlui.getTextureSourceList().length, 2);
    assert.equal(rmlui.releaseRenderManagers(), undefined);
    assert.deepEqual(rmlui.getTextureSourceList(), [ 'texture.tga' ]);
    assert.deepEqual(capture(sfml, window, context), [ 255, 0, 0 ]);
    const next = rmlui.createContext('next', 80, 60, second);
    scene(next);
    assert.deepEqual(capture(sfml, window, next), [ 255, 0, 0 ]);
    context.remove();
    next.remove();
    rmlui.releaseRenderManagers();
    assert.deepEqual(rmlui.getTextureSourceList(), []);
    assert.strictEqual(rmlui.getRenderInterface(), first);
  },

  'detached-resources-block-manager-destruction': function({
    rmlui, sfml, window, context,
  }) {
    const document = scene(context);
    capture(sfml, window, context);
    const image = document.removeChild(document.getElementById('image'));
    context.remove();
    assert.throws(() => rmlui.releaseRenderManagers(), /detached/i);
    const next = rmlui.createContext('next', 80, 60);
    const target = next.createDocument();
    target.appendChild(image);
    target.show();
    next.update();
    rmlui.releaseRenderManagers();
    next.render();
  },

  'scope-validation-generation-and-callbacks': function({
    rmlui, window, context,
  }) {
    const first = rmlui.getRenderInterface();
    for (const value of [{}, 1, false, context, { handle: first }]) {
      assert.throws(() => rmlui.releaseTextures(value), /handle/i);
      assert.throws(() => rmlui.releaseTexture('/texture.tga', value),
        /handle/i);
      assert.throws(() => rmlui.releaseCompiledGeometry(value), /handle/i);
      assert.throws(() => rmlui.createContext('bad', 80, 60, value),
        /handle/i);
    }
    assert.throws(() => rmlui.releaseTexture({}), /source/i);
    assert.throws(() => rmlui.createRenderInterface({}), /RenderWindow/i);
    const document = scene(context);
    document.addEventListener('probe', () => {
      assert.strictEqual(rmlui.getRenderInterface(), first);
      assert.strictEqual(context.renderInterface, first);
      assert.ok(Array.isArray(rmlui.getTextureSourceList()));
      for (const operation of [
        () => rmlui.releaseTextures(),
        () => rmlui.releaseTexture('/texture.tga'),
        () => rmlui.releaseCompiledGeometry(),
        () => rmlui.releaseRenderManagers(),
        () => rmlui.createRenderInterface(window),
      ]) {
        assert.throws(operation, /callback/i);
      }
    });
    document.dispatchEvent('probe');
    rmlui.shutdown();
    assert.equal(rmlui.getRenderInterface(), null);
    assert.throws(() => rmlui.getTextureSourceList(), /initialised/i);
    assert.throws(() => rmlui.releaseRenderManagers(), /initialised/i);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.notStrictEqual(rmlui.getRenderInterface(), first);
    assert.throws(() => rmlui.releaseTextures(first), /valid/i);
    assert.throws(() => rmlui.createContext('old', 80, 60, first), /valid/i);
  },

  'cross-renderer-subtree-transfer-guard': function({
    rmlui, sfml, window, context,
  }) {
    const second = rmlui.createRenderInterface(window);
    const other = rmlui.createContext('other', 80, 60, second);
    const source = scene(context);
    const target = scene(other);
    capture(sfml, window, context);
    const image = source.removeChild(source.getElementById('image'));
    for (const insert of [
      () => target.appendChild(image),
      () => target.insertBefore(image, null),
      () => target.replaceChild(image, target.getElementById('image')),
    ]) {
      assert.throws(insert, /render interface/i);
      assert.equal(image.getParentNode(), null);
    }
    // A neutral wrapper must not conceal the resource origin of a subtree.
    const container = source.createElement('div');
    container.appendChild(image);
    assert.throws(() => target.appendChild(container), /render interface/i);
    source.appendChild(container);
    const sameRenderer = rmlui.createContext('shared', 80, 60);
    const sharedDocument = scene(sameRenderer);
    const moved = source.removeChild(container);
    sharedDocument.appendChild(moved);
    sameRenderer.update();
    assert.deepEqual(capture(sfml, window, sameRenderer), [ 255, 0, 0 ]);
    // Clones have new resource state, so crossing interfaces is safe.
    const clone = container.clone();
    target.appendChild(clone);
    other.update();
    assert.deepEqual(capture(sfml, window, other), [ 255, 0, 0 ]);
  },

  'renderer-and-native-window-lifetime': async function({
    rmlui, sfml, context,
  }) {
    const { windowNativeHandle } = require('../../dist/internal/sfml-interop');
    let secondWindow = new sfml.RenderWindow(
      new sfml.VideoMode(new sfml.Vector2u(80, 60)), 'Owned renderer');
    const nativeWindow = new WeakRef(windowNativeHandle(secondWindow));
    let renderer = rmlui.createRenderInterface(secondWindow);
    const weakRenderer = new WeakRef(renderer);
    const other = rmlui.createContext('owned', 80, 60, renderer);
    scene(other);
    assert.deepEqual(capture(sfml, secondWindow, other), [ 255, 0, 0 ]);
    secondWindow = null;
    renderer = null;
    const collect = async () => {
      for (let attempt = 0; attempt < 8; attempt++) {
        await new Promise(resolve => setImmediate(resolve));
        global.gc();
      }
    };
    await collect();
    assert.equal(weakRenderer.deref(), undefined);
    assert.ok(nativeWindow.deref(), 'native window survives wrapper GC');
    other.update();
    other.render();
    const recovered = other.renderInterface;
    rmlui.releaseTextures(recovered);
    rmlui.releaseCompiledGeometry(recovered);
    other.render();
    context.remove();
    other.remove();
    rmlui.releaseRenderManagers();
    rmlui.shutdown();
    await collect();
    assert.equal(nativeWindow.deref(), undefined);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-release-'));
  const file = path.join(root, 'texture.tga');
  writeTexture(file, [ 255, 0, 0 ]);
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(80, 60)), 'Resource contracts');
  try {
    assert.ok(rmlui.initialise(window, { fileRoot: root, highDpi: false }));
    const context = rmlui.createContext('resources', 80, 60);
    await cases[name]({ rmlui, sfml, window, context, file });
  } finally {
    rmlui.shutdown();
    window.close();
    fs.rmSync(root, { recursive: true, force: true });
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
    const result = spawnSync(process.execPath,
      [ '--expose-gc', __filename, name ], {
        encoding: 'utf8', timeout: 20000,
      });
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} resource-release regressions failed`);
}
