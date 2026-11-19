'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

function triangle(rmlui) {
  const mesh = new rmlui.Mesh(3, 3);
  const positions = [[ 10, 10 ], [ 80, 10 ], [ 10, 80 ]];
  const floats = new Float32Array(mesh.vertices.buffer);
  for (let i = 0; i < positions.length; ++i) {
    floats[i * 5] = positions[i][0];
    floats[i * 5 + 1] = positions[i][1];
    mesh.vertices.set([ 255, 0, 0, 255 ], i * 20 + 8);
  }
  mesh.indices.set([ 0, 1, 2 ]);
  return mesh;
}

const cases = {
  'vertex-and-sprite-snapshots-survive-owner-gc': async options => {
    const { rmlui, manager } = options;
    let sprite;
    let listRef;
    let vertexRef;
    let coordinates;
    (() => {
      const sheets = new rmlui.SpritesheetList();
      const source = path.relative(process.cwd(), path.resolve(__dirname,
        '../../third_party/rmlui/Samples/assets/hello_world.png'));
      sheets.addSpriteSheet('gc', source, '', 0, 1,
        [[ 'icon', { p0: { x: 0, y: 0 }, p1: { x: 8, y: 8 } }]]);
      sprite = sheets.getSprite('icon');
      listRef = new WeakRef(sheets);
      const vertex = new rmlui.Vertex();
      vertex.position = { x: 4, y: 5 };
      vertexRef = new WeakRef(vertex);
      coordinates = vertex.positionView;
    })();
    for (let i = 0; i < 12; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(listRef.deref(), undefined);
    assert.equal(vertexRef.deref(), undefined);
    assert.deepEqual([ ...coordinates ], [ 4, 5 ]);
    assert.equal(sprite.spriteSheet.name, 'gc');
    assert.ok(sprite.spriteSheet.textureSource.getTexture(manager)
      .getDimensions().x > 0);
    rmlui.shutdown();
    coordinates[0] = 9;
    assert.deepEqual([ ...coordinates ], [ 9, 5 ]);
  },

  'spritesheet-list-overwrite-merge-and-snapshot': ({ rmlui, manager }) => {
    const filename = path.resolve(__dirname,
      '../../third_party/rmlui/Samples/assets/hello_world.png');
    const documentPath = path.join(path.dirname(filename), 'document.rml');
    const rectangle = { p0: { x: 2, y: 3 }, p1: { x: 12, y: 23 } };
    const sheets = new rmlui.SpritesheetList();
    assert.equal(sheets.numSpriteSheets(), 0);
    assert.equal(sheets.numSprites(), 0);
    assert.equal(sheets.getSprite('missing'), null);
    sheets.reserve(8, 32);
    assert.ok(sheets.addSpriteSheet('main', 'hello_world.png', documentPath,
      14, 0.5, [[ 'icon', rectangle ]]));
    const icon = sheets.getSprite('icon');
    assert.deepEqual(icon.rectangle, rectangle);
    assert.ok(icon.spriteSheet instanceof rmlui.Spritesheet);
    assert.equal(icon.spriteSheet.name, 'main');
    assert.equal(icon.spriteSheet.definitionLineNumber, 14);
    assert.equal(icon.spriteSheet.displayScale, 0.5);
    const texture = icon.spriteSheet.textureSource.getTexture(manager);
    assert.ok(texture.getDimensions().x > 0);
    rectangle.p0.x = 99;
    assert.equal(icon.rectangle.p0.x, 2);
    const second = new rmlui.SpritesheetList();
    assert.ok(second.addSpriteSheet('replacement', 'other.png', 'other.rml',
      20, 2, [[ 'icon', rectangle ], [ 'new', rectangle ]]));
    sheets.merge(second);
    assert.equal(sheets.numSpriteSheets(), 2);
    assert.equal(sheets.numSprites(), 2);
    assert.equal(sheets.getSprite('icon').spriteSheet.name, 'replacement');
    assert.equal(icon.spriteSheet.name, 'main');
    assert.equal(icon.rectangle.p0.x, 2);
    sheets.merge(sheets);
    assert.equal(sheets.numSpriteSheets(), 4);
    assert.equal(sheets.numSprites(), 2);
    assert.ok(sheets.addSpriteSheet('last', 'last.png', '', 0, 1,
      [[ 'new', { p0: { x: 0, y: 0 }, p1: { x: 4, y: 8 } }]]));
    assert.equal(sheets.numSpriteSheets(), 5);
    assert.equal(sheets.numSprites(), 2);
    assert.equal(sheets.getSprite('new').spriteSheet.name, 'last');
    const standalone = new rmlui.Spritesheet(
      'own', 'hello_world.png', documentPath, 7, 1);
    assert.equal(standalone.name, 'own');
    assert.equal(standalone.definitionLineNumber, 7);
    assert.equal(standalone.displayScale, 1);
    assert.ok(standalone.textureSource.getTexture(manager).equals(texture));
    icon.spriteSheet.name = 'snapshot edit';
    assert.equal(sheets.getSprite('icon').spriteSheet.name, 'replacement');
    rmlui.shutdown();
    assert.equal(icon.spriteSheet.name, 'snapshot edit');
    assert.throws(() => sheets.getSprite('icon'), /initial|valid/i);
    assert.throws(() => icon.spriteSheet.textureSource.getTexture(manager),
      /initial|valid/i);
  },

  'spritesheet-validation-and-accessor-reentry': options => {
    const { rmlui, window } = options;
    const sheets = new rmlui.SpritesheetList();
    assert.throws(() => sheets.reserve(-1, 0), /count|range/i);
    assert.throws(() => sheets.addSpriteSheet('a', '', '', 0, NaN, []),
      /scale|finite/i);
    assert.throws(() => sheets.addSpriteSheet('a', '', '', 1.5, 1, []),
      /line|integer/i);
    assert.throws(() => sheets.addSpriteSheet('a', '', '', 0, 1,
      [[ 'x', { p0: { x: 0, y: 0 }, p1: { x: Infinity, y: 1 } }]]),
    /finite/i);
    assert.equal(sheets.numSpriteSheets(), 0);
    const hostile = {
      get p0() {
        rmlui.shutdown();
        assert.ok(rmlui.initialise(window, { highDpi: false }));
        return { x: 0, y: 0 };
      },
      p1: { x: 1, y: 1 },
    };
    assert.throws(() => sheets.addSpriteSheet('a', '', '', 0, 1,
      [[ 'x', hostile ]]), /valid/i);
  },

  'typed-vertex-shared-fields-and-resize-lifetime': ({ rmlui, manager }) => {
    const vertex = new rmlui.Vertex();
    assert.deepEqual(vertex.position, { x: 0, y: 0 });
    assert.deepEqual(vertex.colour, { red: 0, green: 0, blue: 0, alpha: 255 });
    assert.deepEqual(vertex.texCoord, { x: 0, y: 0 });
    vertex.position = { x: 10, y: 20 };
    vertex.colour = { red: 120, green: 50, blue: 20, alpha: 128 };
    vertex.texCoordView.set([ 0.25, 0.75 ]);
    assert.deepEqual(vertex.texCoord, { x: 0.25, y: 0.75 });
    const mesh = triangle(rmlui);
    const first = mesh.getVertex(0);
    first.positionView.set(vertex.positionView);
    first.colour = vertex.colour;
    first.texCoord = vertex.texCoord;
    assert.ok(first.equals(vertex));
    assert.equal(new Float32Array(mesh.vertices.buffer)[1], 20);
    first.position = { x: -0, y: 20 };
    vertex.position = { x: 0, y: 20 };
    assert.ok(first.equals(vertex));
    assert.throws(() => {
      vertex.position = { x: 5, y: Infinity };
    }, /finite/i);
    assert.deepEqual(vertex.position, { x: 0, y: 20 });
    assert.throws(() => {
      vertex.colour = { red: 1, green: 2, blue: 3, alpha: 256 };
    }, /byte/i);
    assert.deepEqual(vertex.colour,
      { red: 120, green: 50, blue: 20, alpha: 128 });
    assert.throws(() => mesh.getVertex(-1), /index/i);
    assert.throws(() => mesh.getVertex(3), /index/i);
    assert.throws(() => mesh.getVertex(0.5), /index/i);
    assert.throws(() => vertex.equals({}), /vertex/i);
    const geometry = manager.makeGeometry(mesh);
    first.position = { x: 99, y: 99 };
    assert.deepEqual(geometry.getMesh().getVertex(0).position,
      { x: -0, y: 20 });
    mesh.resize(1, 0);
    const retained = mesh.getVertex(0);
    mesh.resize(2, 0);
    retained.positionView[0] = 42;
    assert.equal(mesh.getVertex(0).position.x, 0);
    rmlui.shutdown();
    vertex.positionView[0] = NaN;
    assert.equal(vertex.equals(vertex), false);
    assert.equal(retained.position.x, 42);
    assert.ok(new rmlui.Vertex().equals(new rmlui.Vertex()));
  },

  'texture-source-cache-manager-removal-and-aggregate': options => {
    const { rmlui, manager, context, window } = options;
    const filename = path.resolve(__dirname,
      '../../third_party/rmlui/Samples/assets/hello_world.png');
    const documentPath = path.join(path.dirname(filename), 'document.rml');
    const source = new rmlui.TextureSource('hello_world.png', documentPath);
    assert.equal(source.getSource(), 'hello_world.png');
    assert.equal(source.getDefinitionSource(), documentPath);
    const empty = new rmlui.TextureSource();
    assert.equal(empty.getSource(), '');
    assert.equal(empty.getDefinitionSource(), '');
    const texture = source.getTexture(manager);
    assert.ok(texture.equals(source.getTexture(manager)));
    const dimensions = texture.getDimensions();
    assert.ok(dimensions.x > 0);
    const own = new rmlui.RenderManager(rmlui.getRenderInterface());
    const ownedTexture = source.getTexture(own);
    assert.ok(!ownedTexture.equals(texture));
    const aggregate = { mesh: triangle(rmlui), texture: ownedTexture };
    const geometry = own.makeGeometry(aggregate.mesh);
    geometry.render({ x: 0, y: 0 }, aggregate.texture);
    context.remove();
    rmlui.releaseRenderManagers();
    assert.throws(() => texture.getDimensions(), /valid/i);
    assert.ok(source.getTexture(own).equals(ownedTexture));
    for (let i = 0; i < 8; ++i) {
      const next = rmlui.createContext(`source-${i}`, 160, 120);
      const fresh = source.getTexture(next.getRenderManager());
      assert.deepEqual(fresh.getDimensions(), dimensions);
      next.remove();
      rmlui.releaseRenderManagers();
      assert.throws(() => fresh.isValid, /valid/i);
    }
    assert.throws(() => source.getTexture({}), /manager/i);
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => source.getTexture(own), /valid/i);
    assert.throws(() => source.getSource(), /valid/i);
    assert.throws(() => source.getDefinitionSource(), /valid/i);
  },

  'native-mesh-views-and-snapshot-transfer': ({ rmlui, manager }) => {
    const mesh = triangle(rmlui);
    assert.equal(rmlui.Mesh.vertexStride, 20);
    assert.equal(mesh.vertexCount, 3);
    assert.equal(mesh.isValid, true);
    const oldVertices = mesh.vertices;
    const oldIndices = mesh.indices;
    const geometry = manager.makeGeometry(mesh);
    assert.ok(geometry instanceof rmlui.Geometry);
    assert.equal(geometry.isValid, true);
    assert.equal(mesh.isValid, false);
    assert.equal(mesh.vertexCount, 0);
    oldVertices.fill(0);
    oldIndices.fill(0);
    const snapshot = geometry.getMesh();
    assert.deepEqual([ ...snapshot.indices ], [ 0, 1, 2 ]);
    assert.equal(new Float32Array(snapshot.vertices.buffer)[0], 10);
    snapshot.indices.fill(0);
    assert.deepEqual([ ...geometry.getMesh().indices ], [ 0, 1, 2 ]);
    const returned = geometry.release();
    assert.equal(geometry.isValid, false);
    assert.equal(returned.equals(triangle(rmlui)), true);
    assert.equal(geometry.release().isValid, false);
    assert.throws(() => geometry.getMesh(), /empty|released|valid/i);
    const cleared = manager.makeGeometry(returned);
    assert.equal(cleared.release(rmlui.GeometryReleaseMode.ClearMesh).isValid,
      false);
    const empty = new rmlui.Geometry();
    assert.equal(rmlui.Geometry.invalidHandle(), 4294967295);
    assert.equal(empty.isValid, false);
    empty.render({ x: 0, y: 0 });
    assert.equal(new rmlui.Mesh().equals(new rmlui.Mesh()), true);
    const resized = triangle(rmlui);
    const prior = resized.indices;
    resized.resize(4, 6);
    assert.equal(resized.vertexCount, 4);
    assert.deepEqual([ ...resized.indices ], [ 0, 1, 2, 0, 0, 0 ]);
    prior.fill(-1);
    assert.deepEqual([ ...resized.indices ], [ 0, 1, 2, 0, 0, 0 ]);
    const verticesOnly = new rmlui.Mesh(2);
    assert.equal(manager.makeGeometry(verticesOnly).isValid, false);
    assert.equal(verticesOnly.vertexCount, 2);
  },

  'rendered-mesh-pixels-and-submission-snapshot': options => {
    const { rmlui, sfml, window, manager, context } = options;
    const mesh = triangle(rmlui);
    const old = mesh.vertices;
    const geometry = manager.makeGeometry(mesh);
    old.fill(0);
    window.clear(sfml.Color.Black);
    window.flush();
    context.render();
    geometry.render({ x: 0.4, y: 0.6 });
    const capture = new sfml.Texture(window.getSize());
    capture.update(window);
    const image = capture.copyToImage();
    const inside = image.getPixel(new sfml.Vector2u(20, 20));
    const outside = image.getPixel(new sfml.Vector2u(120, 100));
    assert.deepEqual([ inside.r, inside.g, inside.b, inside.a ],
      [ 255, 0, 0, 255 ]);
    assert.deepEqual([ outside.r, outside.g, outside.b ], [ 0, 0, 0 ]);
    geometry.release();
  },

  'textured-and-shaded-geometry-pixels': async options => {
    const { rmlui, sfml, window, manager, context } = options;
    const filename = path.resolve(__dirname,
      '../../third_party/rmlui/Samples/assets/hello_world.png');
    const source = new sfml.Image();
    assert.ok(await source.loadFromFile(filename));
    const pixels = source.pixels;
    let selected = -1;
    for (let i = 0; i < pixels.length; i += 4) {
      const sum = pixels[i] + pixels[i + 1] + pixels[i + 2];
      if (pixels[i + 3] === 255 && sum > 100) {
        selected = i / 4;
        break;
      }
    }
    assert.ok(selected >= 0);
    const size = source.getSize();
    const x = selected % size.x;
    const y = Math.floor(selected / size.x);
    const mesh = triangle(rmlui);
    const floats = new Float32Array(mesh.vertices.buffer);
    for (let i = 0; i < 3; ++i) {
      mesh.vertices.set([ 255, 255, 255, 255 ], i * 20 + 8);
      floats[i * 5 + 3] = (x + 0.5) / size.x;
      floats[i * 5 + 4] = (y + 0.5) / size.y;
    }
    const geometry = manager.makeGeometry(mesh);
    const texture = manager.loadTexture(path.relative(process.cwd(), filename));
    window.clear(sfml.Color.Black);
    window.flush();
    context.render();
    geometry.render({ x: 0, y: 0 }, texture);
    const capture = new sfml.Texture(window.getSize());
    capture.update(window);
    const pixel = capture.copyToImage().getPixel(new sfml.Vector2u(20, 20));
    const expected = source.getPixel(new sfml.Vector2u(x, y));
    for (const channel of [ 'r', 'g', 'b' ]) {
      assert.ok(Math.abs(pixel[channel] - expected[channel]) <= 1, channel);
    }
    const shader = manager.compileShader('solid-green', {
      vertex_shader: 'void main(){gl_Position=gl_ModelViewProjectionMatrix*' +
        'gl_Vertex;}',
      fragment_shader: 'void main(){gl_FragColor=vec4(0.0,1.0,0.0,1.0);}',
    });
    assert.ok(shader.isValid);
    geometry.render({ x: 0, y: 0 }, undefined, shader);
    capture.update(window);
    const green = capture.copyToImage().getPixel(new sfml.Vector2u(20, 20));
    assert.deepEqual([ green.r, green.g, green.b ], [ 0, 255, 0 ]);
    shader.release();
    geometry.release();
  },

  'native-texture-views-sources-and-lazy-loading': ({ rmlui, manager }) => {
    const empty = new rmlui.Texture();
    assert.equal(empty.isValid, false);
    assert.deepEqual(empty.getDimensions(), { x: 0, y: 0 });
    assert.ok(empty.equals(new rmlui.Texture()));
    const absolute = path.resolve(__dirname,
      '../../third_party/rmlui/Samples/assets/hello_world.png');
    const source = path.relative(process.cwd(), absolute);
    const texture = manager.loadTexture(source);
    assert.equal(texture.isValid, true);
    const dimensions = texture.getDimensions();
    assert.ok(dimensions.x > 0 && dimensions.y > 0);
    assert.deepEqual(manager.loadTexture('hello_world.png',
      path.join(path.dirname(absolute), 'document.rml')).getDimensions(),
    dimensions);
    assert.ok(texture.equals(manager.loadTexture(source)));
    assert.ok(!texture.equals(empty));
    assert.ok(rmlui.releaseTexture(source));
    assert.deepEqual(texture.getDimensions(), dimensions);
    const other = new rmlui.RenderManager(rmlui.getRenderInterface());
    assert.ok(!texture.equals(other.loadTexture(source)));
    const missing = manager.loadTexture('/__rmlui_missing_texture__.png');
    assert.equal(missing.isValid, true);
    assert.deepEqual(missing.getDimensions(), { x: 0, y: 0 });
  },

  'geometry-rendering-and-resource-affinity': ({ rmlui, manager, context }) => {
    const mesh = triangle(rmlui);
    const geometry = manager.makeGeometry(mesh);
    context.render();
    geometry.render({ x: 0.4, y: 0.6 });
    const other = new rmlui.RenderManager(rmlui.getRenderInterface());
    const texture = other.loadTexture('unused.png');
    assert.throws(() => geometry.render({ x: 0, y: 0 }, texture), /manager/i);
    const shader = other.compileShader('colour', {
      vertex_shader: 'void main(){gl_Position=gl_ModelViewProjectionMatrix*' +
        'gl_Vertex;}',
      fragment_shader: 'void main(){gl_FragColor=vec4(1.0);}',
    });
    assert.ok(shader.isValid);
    assert.throws(() => geometry.render({ x: 0, y: 0 }, undefined, shader),
      /manager/i);
    shader.release();
    geometry.render({ x: 0, y: 0 }, new rmlui.Texture(),
      new rmlui.CompiledShader());
    rmlui.releaseCompiledGeometry();
    geometry.render({ x: 0, y: 0 });
    geometry.release();
    assert.throws(() => geometry.render({ x: Infinity, y: 0 }), /finite/i);
  },

  'invalid-mesh-and-getter-reentry': ({ rmlui, manager, window }) => {
    const mesh = triangle(rmlui);
    mesh.indices[2] = 3;
    assert.throws(() => manager.makeGeometry(mesh), /index|indices/i);
    assert.equal(mesh.isValid, true);
    mesh.indices[2] = -1;
    assert.throws(() => manager.makeGeometry(mesh), /index|indices/i);
    mesh.indices[2] = 2;
    new Float32Array(mesh.vertices.buffer)[0] = NaN;
    assert.throws(() => manager.makeGeometry(mesh), /finite/i);
    assert.throws(() => new rmlui.Mesh(-1, 3), /count|range/i);
    assert.throws(() => new rmlui.Mesh(3, 2147483648), /count|range/i);
    const incomplete = new rmlui.Mesh(3, 2);
    assert.throws(() => manager.makeGeometry(incomplete), /triangle/i);
    const geometry = manager.makeGeometry(triangle(rmlui));
    assert.throws(() => geometry.render({
      get x() {
        rmlui.shutdown();
        assert.ok(rmlui.initialise(window, { highDpi: false }));
        return 0;
      },
      y: 0,
    }), /valid/i);
    const binding = require('../../dist/internal/native').native;
    assert.throws(() => binding.makeGeometry({}, {}), /manager|mesh/i);
    assert.throws(() => binding.geometryIsValid({}), /geometry/i);
  },

  'views-manager-gc-and-shutdown': async ({ rmlui, context }) => {
    let geometry;
    let texture;
    let meshRef;
    let managerRef;
    let bytes;
    (() => {
      const mesh = triangle(rmlui);
      bytes = mesh.vertices;
      meshRef = new WeakRef(mesh);
      const manager = new rmlui.RenderManager(rmlui.getRenderInterface());
      managerRef = new WeakRef(manager);
      geometry = manager.makeGeometry(mesh);
      texture = manager.loadTexture('unloaded.png');
    })();
    for (let i = 0; i < 12; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(meshRef.deref(), undefined);
    assert.equal(managerRef.deref(), undefined);
    assert.equal(new Float32Array(bytes.buffer)[0], 10);
    assert.equal(geometry.isValid, true);
    const shared = context.getRenderManager();
    const stale = shared.makeGeometry(triangle(rmlui));
    const staleTexture = shared.loadTexture('stale.png');
    context.remove();
    rmlui.releaseRenderManagers();
    assert.throws(() => stale.isValid, /valid/i);
    assert.throws(() => staleTexture.getDimensions(), /valid/i);
    assert.equal(geometry.isValid, true);
    assert.equal(texture.isValid, true);
    rmlui.shutdown();
    assert.throws(() => geometry.release(), /initial|valid/i);
    assert.throws(() => texture.isValid, /initial|valid/i);
    bytes.fill(1);
    assert.equal(bytes[0], 1);
    assert.equal(triangle(rmlui).isValid, true);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Geometry');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('geometry', 160, 120);
  try {
    await cases[name]({
      rmlui, sfml, window, context, manager: context.getRenderManager(),
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
    const result = spawnSync(process.execPath,
      [ '--expose-gc', __filename, name ],
      { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0 || /Leaking \w+ detected/.test(result.stderr)) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} geometry failures`);
}
