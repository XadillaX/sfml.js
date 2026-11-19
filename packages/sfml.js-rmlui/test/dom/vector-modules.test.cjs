'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function animation(color, animated = true) {
  return {
    v: '5.5.7', fr: 10, ip: 0, op: 20, w: 80, h: 20,
    assets: [],
    layers: [{
      ty: 1, ind: 1, ip: 0, op: 20, st: 0, sr: 1,
      sw: 20, sh: 20, sc: color,
      ks: {
        o: { a: 0, k: 100 }, r: { a: 0, k: 0 },
        a: { a: 0, k: [ 0, 0, 0 ] },
        s: { a: 0, k: [ 100, 100, 100 ] },
        p: animated ? {
          a: 1,
          k: [{
            t: 0, s: [ 0, 0, 0 ], e: [ 60, 0, 0 ],
            o: { x: 0.333, y: 0.333 }, i: { x: 0.667, y: 0.667 },
          }, { t: 10, s: [ 60, 0, 0 ] }],
        } : { a: 0, k: [ 0, 0, 0 ] },
      },
    }],
  };
}

const cases = {
  'native-svg-inline-channels-alpha-and-resize': options => {
    const { rmlui, context, pixel, clear } = options;
    const document = context.loadDocumentFromMemory(
      '<rml><head><style>body{margin:0}svg{display:block;width:40px;' +
      'height:20px}</style></head><body><svg id="vector" width="40" ' +
      'height="20" viewBox="0 0 40 20">' +
      '<rect width="20" height="20" fill="#ff0000"/>' +
      '<rect x="20" width="20" height="20" fill="#0000ff" ' +
      'fill-opacity="0.5"/></svg></body></rml>');
    document.show();
    context.update();

    const element = document.getElementById('vector');
    assert.ok(element instanceof rmlui.ElementSVG);
    assert.ok(element.isClass(rmlui.ElementSVG.getStaticClassIdentifier()));
    element.ensureSourceLoaded();
    assert.deepEqual(element.getIntrinsicDimensions().dimensions,
      { x: 40, y: 20 });
    context.render();
    assert.deepEqual(pixel(5, 5), [ 255, 0, 0 ]);
    assert.ok(Math.abs(pixel(25, 5)[2] - 128) <= 2);
    assert.equal(pixel(25, 5)[0], 0);

    element.setProperty('width', '80px');
    context.update();
    context.render();
    assert.deepEqual(pixel(30, 5), [ 255, 0, 0 ]);
    assert.ok(Math.abs(pixel(65, 5)[2] - 128) <= 2);

    element.innerRML = '<rect width="40" height="20" fill="#00ff00"/>';
    context.update();
    context.render();
    assert.deepEqual(pixel(30, 5), [ 0, 255, 0 ]);
    element.setProperty('opacity', '0.5');
    context.update();
    clear();
    context.render();
    const translucent = pixel(30, 5);
    assert.ok(Math.abs(translucent[1] - 128) <= 2, translucent);
    assert.deepEqual([ translucent[0], translucent[2] ], [ 0, 0 ]);
    document.close();
    context.update();
    assert.throws(() => element.ensureSourceLoaded(), /valid/i);
  },

  'optional-elements-check-native-class-and-owned-construction':
    ({ rmlui, context }) => {
      const svg = new rmlui.ElementSVG('svg');
      const lottie = new rmlui.ElementLottie('lottie');
      assert.ok(svg instanceof rmlui.Element);
      assert.ok(lottie instanceof rmlui.Element);
      assert.equal(svg.getClassIdentifier(),
        rmlui.ElementSVG.getStaticClassIdentifier());
      assert.equal(lottie.getClassIdentifier(),
        rmlui.ElementLottie.getStaticClassIdentifier());
      assert.equal(lottie.isClass(
        rmlui.ElementLottie.getStaticClassIdentifier()),
      true);
      const plain = new rmlui.Element('div');
      assert.throws(() => rmlui.ElementSVG.prototype.ensureSourceLoaded
        .call(plain), /class|type|SVG/i);
      const document = context.createDocument();
      document.appendChild(svg);
      document.appendChild(lottie);
      assert.equal(document.getChild(0), svg);
      assert.equal(document.getChild(1), lottie);
      document.close();
      context.update();
      assert.throws(() => lottie.ensureSourceLoaded(), /valid/i);
    },

  'lottie-native-clock-frames-loop-resize-and-source-replacement':
    ({ rmlui, context, pixel, clear }) => {
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-vector-'));
      try {
        const source = path.join(directory, 'moving.json');
        const blue = path.join(directory, 'blue.json');
        fs.writeFileSync(source, JSON.stringify(animation('#ff0000')));
        fs.writeFileSync(blue, JSON.stringify(animation('#0000ff', false)));
        const relative = path.relative(os.tmpdir(), source);
        const clock = rmlui.getSystemInterface().clock;
        clock[0] = 0;
        const document = context.loadDocumentFromMemory(
          '<rml><head><style>body{margin:0}lottie{display:block;width:80px;' +
          'height:20px}</style></head><body>' +
          `<lottie id="motion" src="${relative}"/></body></rml>`);
        document.show();
        context.update();

        const element = document.getElementById('motion');
        assert.ok(element instanceof rmlui.ElementLottie);
        element.ensureSourceLoaded();
        assert.deepEqual(element.getIntrinsicDimensions().dimensions,
          { x: 80, y: 20 });
        context.render();
        assert.deepEqual(pixel(5, 5), [ 255, 0, 0 ]);
        assert.deepEqual(pixel(65, 5), [ 0, 0, 0 ]);

        clock[0] = 1;
        context.update();
        clear();
        context.render();
        assert.deepEqual(pixel(5, 5), [ 0, 0, 0 ]);
        assert.deepEqual(pixel(65, 5), [ 255, 0, 0 ]);

        // rlottie 0.2 duration is (endFrame - startFrame - 1) / frameRate.
        clock[0] = 1.901;
        context.update();
        clear();
        context.render();
        assert.deepEqual(pixel(5, 5), [ 255, 0, 0 ]);

        element.setAttribute('src', path.relative(os.tmpdir(), blue));
        element.setProperty('width', '160px');
        context.update();
        clear();
        context.render();
        // Upstream renderSync preserves aspect ratio and centers the content.
        assert.deepEqual(pixel(30, 5), [ 0, 0, 0 ]);
        assert.deepEqual(pixel(45, 5), [ 0, 0, 255 ]);
        assert.deepEqual(pixel(65, 5), [ 0, 0, 0 ]);
        element.setProperty('opacity', '0.5');
        context.update();
        clear();
        context.render();
        const translucent = pixel(45, 5);
        assert.ok(Math.abs(translucent[2] - 128) <= 2, translucent);
        document.close();
        context.update();
      } finally {
        fs.rmSync(directory, { recursive: true, force: true });
      }
    },

  'svg-file-source-crop-decorator-and-reload': options => {
    const { context, pixel, clear } = options;
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-vector-'));
    try {
      const source = path.join(directory, 'source.svg');
      const next = path.join(directory, 'next.svg');
      fs.writeFileSync(source,
        '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20">' +
        '<rect x="10" width="20" height="20" fill="#00ff00"/></svg>');
      fs.writeFileSync(next,
        '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20">' +
        '<rect width="40" height="20" fill="#0000ff"/></svg>');
      const relative = path.relative(os.tmpdir(), source);
      const document = context.loadDocumentFromMemory(
        '<rml><head><style>body{margin:0}svg{display:block;width:40px;' +
        'height:20px}#decorated{display:block;width:40px;height:20px;' +
        `decorator:svg("${relative}" crop-to-content);}` +
        '</style></head><body>' +
        `<svg id="file" src="${relative}" crop-to-content=""/>` +
        '<div id="decorated"/></body></rml>');
      document.show();
      context.update();
      context.render();

      const element = document.getElementById('file');
      assert.deepEqual(element.getIntrinsicDimensions().dimensions,
        { x: 20, y: 20 });
      assert.equal(element.innerRML, '');
      assert.deepEqual(pixel(5, 5), [ 0, 255, 0 ]);
      assert.deepEqual(pixel(5, 25), [ 0, 255, 0 ]);
      element.setAttribute('src', path.relative(os.tmpdir(), next));
      context.update();
      clear();
      context.render();
      assert.deepEqual(pixel(5, 5), [ 0, 0, 255 ]);
      assert.deepEqual(pixel(5, 25), [ 0, 255, 0 ]);
      document.close();
      context.update();
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  },

  'lottie-embedded-images-use-packaged-native-decoder': async options => {
    const { sfml, context, pixel } = options;
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-vector-'));
    try {
      const png = path.join(directory, 'asset.png');
      const image = new sfml.Image(new sfml.Vector2u(20, 20), sfml.Color.Red);
      assert.equal(await image.saveToFile(png), true);
      const data = animation('#ffffff', false);
      data.assets = [{
        id: 'image', w: 20, h: 20, u: '', e: 1,
        p: `data:image/png;base64,${fs.readFileSync(png).toString('base64')}`,
      }];
      data.layers[0].ty = 2;
      data.layers[0].refId = 'image';
      const source = path.join(directory, 'image.json');
      fs.writeFileSync(source, JSON.stringify(data));
      const document = context.loadDocumentFromMemory(
        '<rml><head><style>body{margin:0}lottie{display:block;width:80px;' +
        'height:20px}</style></head><body>' +
        `<lottie src="${path.relative(os.tmpdir(), source)}"/></body></rml>`);
      document.show();
      context.update();
      context.render();
      const color = pixel(5, 5);
      assert.ok(Math.abs(color[0] - 255) <= 2, color);
      assert.deepEqual(color.slice(1), [ 0, 0 ]);
      document.close();
      context.update();
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  },

  'vector-plugins-reinitialize-without-retained-elements': options => {
    const { rmlui, context, window } = options;
    const document = context.loadDocumentFromMemory(
      '<rml><body><svg id="svg" width="20" height="20">' +
      '<rect width="20" height="20"/></svg><lottie id="lottie"/></body></rml>');
    document.show();
    context.update();
    const svg = document.getElementById('svg');
    const lottie = document.getElementById('lottie');
    const borrowed = rmlui.Factory.getElementInstancer('svg');
    const detached = borrowed.instanceElement(null, 'svg', {});
    assert.ok(detached instanceof rmlui.ElementSVG);
    borrowed.releaseElement(detached);
    rmlui.shutdown();

    assert.throws(() => svg.ensureSourceLoaded(), /initial|valid/i);
    assert.throws(() => lottie.ensureSourceLoaded(), /initial|valid/i);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const next = rmlui.createContext('vectors-restarted', 160, 120);
    const nextDocument = next.createDocument();
    assert.ok(nextDocument.createElement('svg') instanceof rmlui.ElementSVG);
    assert.ok(nextDocument.createElement('lottie') instanceof
      rmlui.ElementLottie);
    assert.throws(() => svg.ensureSourceLoaded(), /valid/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Vector modules');
  assert.ok(rmlui.initialise(window, {
    highDpi: false, fileRoot: os.tmpdir(),
  }));
  const context = rmlui.createContext('vectors', 160, 120);
  window.clear(sfml.Color.Black);
  window.flush();

  function pixel(x, y) {
    const texture = new sfml.Texture(window.getSize());
    texture.update(window);
    const color = texture.copyToImage().getPixel(new sfml.Vector2u(x, y));
    return [ color.r, color.g, color.b ];
  }

  function clear() {
    window.clear(sfml.Color.Black);
    window.flush();
  }

  try {
    await cases[name]({ rmlui, sfml, window, context, pixel, clear });
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
    const result = spawnSync(process.execPath, [ __filename, name ], {
      encoding: 'utf8', timeout: 20000,
    });
    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${name}`, result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }

  assert.equal(failures, 0, `${failures} vector module failures`);
}
