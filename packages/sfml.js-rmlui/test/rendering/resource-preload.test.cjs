'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const assets = path.resolve(__dirname,
  '../../third_party/rmlui/Samples/assets');

function counts(native, action) {
  native.beginDataDiagnostics(false);
  let result;
  try {
    action();
  } finally {
    result = native.endDataDiagnostics();
  }
  return result;
}

function document(context, source = 'hello_world.png') {
  const result = context.loadDocumentFromMemory(
    '<rml><head><style>body{margin:0;font-family:prepared;font-size:20px;' +
    'color:white}img{width:64px;height:32px}</style></head>' +
    `<body><img src="${source}"/><p>Ready</p></body></rml>`);
  result.show();
  context.update();
  return result;
}

const cases = {
  'worker-root-dedup-and-ready-first-frame': async options => {
    const { rmlui, native, context, root } = options;
    const resources = {
      textures: [ 'hello_world.png', 'hello_world.png' ],
      fonts: [{ source: 'RobotoMono-Regular.ttf', family: 'prepared' }],
    };
    let heartbeat = false;
    setImmediate(() => {
      heartbeat = true;
    });
    native.beginDataDiagnostics(false);
    await Promise.all([
      rmlui.preloadResources(resources),
      rmlui.preloadResources(resources),
    ]);
    const cold = native.endDataDiagnostics();
    assert.equal(heartbeat, true);
    assert.equal(cold.textureUploads, 1);
    assert.equal(cold.preloadFileReads, 2);
    assert.equal(cold.preloadImageDecodes, 1);
    assert.equal(cold.preloadFontCommits, 1);
    assert.equal(cold.preloadMainThreadPreparations, 0);
    assert.equal(cold.resourceMainThreadReads, 0);
    fs.rmSync(path.join(root, 'hello_world.png'));
    fs.rmSync(path.join(root, 'RobotoMono-Regular.ttf'));
    const hot = counts(native, () => {
      document(context);
      context.render();
    });
    assert.equal(hot.textureUploads, 1); // Font atlas only.
    assert.equal(hot.resourceMainThreadReads, 0);
    assert.equal(hot.preloadTextureCacheHits, 1);
    assert.ok(hot.geometryDraws > 0);
    const clean = counts(native, () => context.render());
    assert.equal(clean.textureUploads, 0);
  },

  'abort-and-shutdown-never-commit': async ({ rmlui, native, window }) => {
    const controller = new AbortController();
    const pending = rmlui.preloadResources(
      { textures: [ 'hello_world.png' ] }, { signal: controller.signal });
    controller.abort();
    await assert.rejects(pending, { name: 'AbortError' });
    const stale = rmlui.preloadResources({ textures: [ 'hello_world.png' ] });
    const rejected = assert.rejects(stale, /runtime|invalidated/i);
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { fileRoot: assets, highDpi: false }));
    await rejected;
    await new Promise(resolve => setImmediate(resolve));
    native.beginDataDiagnostics(false);
    await rmlui.preloadResources({ textures: [ 'hello_world.png' ] });
    assert.equal(native.endDataDiagnostics().textureUploads, 1);
  },

  'release-inflight-and-live-texture-leases': async options => {
    const { rmlui, native, context, sfml, window, root } = options;
    await rmlui.preloadResources({ textures: [ 'hello_world.png' ] });
    const doc = document(context);
    context.render();
    rmlui.releaseTextures();
    native.beginDataDiagnostics(false);
    await rmlui.preloadResources({ textures: [ 'hello_world.png' ] });
    assert.equal(native.endDataDiagnostics().textureUploads, 1);
    doc.close();
    const pending = rmlui.preloadResources({
      fonts: [{ source: 'RobotoMono-Regular.ttf', family: 'cancelled' }],
    });
    const rejected = assert.rejects(pending, /invalidated/i);
    rmlui.releaseFontResources();
    await rejected;
    // Independent render managers hold their loaded raw handles even when
    // Core invalidation only visits the registered context managers.
    const image = new sfml.Image(new sfml.Vector2u(2, 2),
      new sfml.Color(240, 100, 20, 128));
    await image.saveToFile(path.join(root, 'alpha.png'));
    await rmlui.preloadResources({ textures: [ 'alpha.png' ] });
    const manager = new rmlui.RenderManager(rmlui.getRenderInterface());
    const texture = manager.loadTexture('alpha.png');
    assert.deepEqual(texture.getDimensions(), { x: 2, y: 2 });
    const mesh = new rmlui.Mesh(3, 3);
    const vertices = new Float32Array(mesh.vertices.buffer);
    vertices[5] = 100;
    vertices[11] = 100;
    for (let i = 0; i < 3; ++i) {
      mesh.vertices.set([ 255, 255, 255, 255 ], i * 20 + 8);
    }
    mesh.indices.set([ 0, 1, 2 ]);
    const geometry = manager.makeGeometry(mesh);
    rmlui.releaseTexture('alpha.png');
    window.clear(sfml.Color.Black);
    window.flush();
    geometry.render({ x: 0, y: 0 }, texture);
    const capture = new sfml.Texture(window.getSize());
    capture.update(window);
    const color = capture.copyToImage().getPixel(new sfml.Vector2u(20, 20));
    assert.deepEqual([ color.r, color.g, color.b ], [ 120, 50, 10 ]);
    geometry.release();
  },

  'shared-abort-and-independent-renderer-caches': async options => {
    const { rmlui, native } = options;
    const controller = new AbortController();
    const first = rmlui.preloadResources(
      { textures: [ 'hello_world.png' ] }, { signal: controller.signal });
    const second = rmlui.preloadResources({ textures: [ 'hello_world.png' ] });
    controller.abort();
    await assert.rejects(first, { name: 'AbortError' });
    await second;
    const renderer = rmlui.createRenderInterface(options.window);
    native.beginDataDiagnostics(false);
    await rmlui.preloadResources(
      { textures: [ 'hello_world.png' ] }, { renderInterface: renderer });
    assert.equal(native.endDataDiagnostics().textureUploads, 1);
    rmlui.releaseTextures(rmlui.getRenderInterface());
    native.beginDataDiagnostics(false);
    await rmlui.preloadResources(
      { textures: [ 'hello_world.png' ] }, { renderInterface: renderer });
    assert.equal(native.endDataDiagnostics().textureUploads, 0);
  },

  'concurrent-font-failure-and-retry': async ({ rmlui, native, root }) => {
    fs.writeFileSync(path.join(root, 'failed.ttf'), 'invalid');
    const resources = {
      fonts: [{ source: 'failed.ttf', family: 'retried' }],
    };
    native.beginDataDiagnostics(false);
    const results = await Promise.allSettled([
      rmlui.preloadResources(resources),
      rmlui.preloadResources(resources),
    ]);
    const failed = native.endDataDiagnostics();
    assert.equal(failed.preloadFileReads, 1);
    assert.equal(failed.preloadFontCommits, 1);
    for (const result of results) {
      assert.equal(result.status, 'rejected');
      assert.match(result.reason.message, /Cannot commit font: failed.ttf/);
    }
    fs.copyFileSync(path.join(assets, 'RobotoMono-Regular.ttf'),
      path.join(root, 'failed.ttf'));
    native.beginDataDiagnostics(false);
    await rmlui.preloadResources(resources);
    const retried = native.endDataDiagnostics();
    assert.equal(retried.preloadFileReads, 1);
    assert.equal(retried.preloadFontCommits, 1);
  },

  'errors-retry-fallback-and-validation': async ({ rmlui, root }) => {
    await assert.rejects(rmlui.preloadResources({
      textures: [ 'missing.png' ],
    }), /missing.png/);
    fs.copyFileSync(path.join(assets, 'hello_world.png'),
      path.join(root, 'missing.png'));
    await rmlui.preloadResources({ textures: [ 'missing.png' ] });
    await rmlui.preloadResources({
      fonts: [{
        source: path.join(assets, 'RobotoMono-Regular.ttf'), family: 'fallback',
      }],
    });
    fs.writeFileSync(path.join(root, 'invalid.ttf'), 'invalid');
    await assert.rejects(rmlui.preloadResources({
      fonts: [{ source: 'invalid.ttf', family: 'invalid' }],
    }), /font/i);
    assert.throws(() => rmlui.preloadResources({
      fonts: [{ source: 'invalid.ttf', family: 'bad', style: 9 }],
    }), /style/i);
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(rmlui.preloadResources({}, {
      signal: controller.signal,
    }), { name: 'AbortError' });
    await rmlui.preloadResources({});
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const native = require('../../build/Release/rmlui.node');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-preload-'));
  for (const file of [ 'hello_world.png', 'RobotoMono-Regular.ttf' ]) {
    fs.copyFileSync(path.join(assets, file), path.join(root, file));
  }
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Preload contracts');
  try {
    assert.ok(rmlui.initialise(window, { fileRoot: root, highDpi: false }));
    const context = rmlui.createContext('preload', 160, 120);
    await cases[name]({ rmlui, native, sfml, context, window, root });
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
    const result = spawnSync(process.execPath, [ __filename, name ], {
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
  assert.equal(failures, 0);
}
