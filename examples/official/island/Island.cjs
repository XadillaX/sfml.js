'use strict';

// Port of SFML/examples/island/Island.cpp; see ../README.md.
const path = require('node:path');
const { once } = require('node:events');
const { setImmediate: nextFrame } = require('node:timers/promises');
const { Worker } = require('node:worker_threads');
const sf = require('../../..');
const { width, height, rowBlockSize, defaults } = require('./Terrain.cjs');

/** Four persistent workers share a compact grid of colors and normals. */
class TerrainPool {
  constructor() {
    this.buffer = new SharedArrayBuffer((width + 1) * (height + 1) * 5 * 4);
    this.workers = Array.from({ length: 4 }, () =>
      new Worker(path.join(__dirname, 'Terrain.cjs'))
    );
    this.failure = undefined;
    for (const worker of this.workers) {
      worker.on('error', error => { this.failure = error; });
    }
  }

  /**
   * Distribute the original 32 row blocks without recreating workers.
   * @param {object} settings - Immutable parameters for this generation.
   */
  async generate(settings) {
    if (this.failure) throw this.failure;

    let index = 0;
    await Promise.all(this.workers.map(async worker => {
      while (index < 32) {
        const done = once(worker, 'message');
        worker.postMessage({ buffer: this.buffer, index: index++, settings });
        await done;
      }
    }));
    return new Float32Array(this.buffer);
  }

  /** Release every persistent worker when the window closes. */
  async close() {
    await Promise.all(this.workers.map(worker => worker.terminate()));
  }
}

/**
 * Upload six vertices per cell through a reusable public VertexArray.
 * @param {object} terrain - Destination GPU buffer.
 * @param {Float32Array} grid - Completed colors and surface normals.
 * @param {object} window - Window used to stop uploads during shutdown.
 */
async function uploadTerrain(terrain, grid, window) {
  const scratch = new sf.VertexArray(
    sf.PrimitiveType.Triangles, width * rowBlockSize * 6
  );
  const vertex = new sf.Vertex();
  const corners = [[ 0, 0 ], [ 0, 1 ], [ 1, 1 ],
    [ 0, 0 ], [ 1, 1 ], [ 1, 0 ]];

  for (let start = 0; start < height; start += rowBlockSize) {
    if (!window.isOpen()) return;

    const end = Math.min(start + rowBlockSize, height);
    let index = 0;
    for (let y = start; y < end; ++y) {
      for (let x = 0; x < width; ++x) {
        for (const [ dx, dy ] of corners) {
          const offset = ((y + dy) * (width + 1) + x + dx) * 5;
          vertex.position.x = x + dx;
          vertex.position.y = y + dy;
          vertex.color.r = grid[offset];
          vertex.color.g = grid[offset + 1];
          vertex.color.b = grid[offset + 2];
          vertex.texCoords.x = grid[offset + 3];
          vertex.texCoords.y = grid[offset + 4];
          scratch.setVertex(index++, vertex);
        }
      }
    }

    if (!terrain.update(scratch, index, start * width * 6)) {
      throw new Error('Failed to update vertex buffer');
    }
    await nextFrame();
  }
}

/** Render the original terrain, lighting shader and editable parameter HUD. */
async function main() {
  const window = new sf.RenderWindow(
    new sf.VideoMode(new sf.Vector2u(width, height)), 'SFML Island',
    { style: sf.Style.Titlebar + sf.Style.Close }
  );
  window.setVerticalSyncEnabled(true);

  const font = new sf.Font();
  if (!await font.openFromFile(path.join(__dirname, 'resources/tuffy.ttf'))) {
    throw new Error('Failed to load tuffy.ttf');
  }

  const status = new sf.Text({ font, characterSize: 28 });
  const hud = new sf.Text({ font, characterSize: 14 });
  hud.setPosition(new sf.Vector2f(5, 5));
  for (const text of [ status, hud ]) {
    text.setFillColor(sf.Color.White);
    text.setOutlineColor(sf.Color.Black);
    text.setOutlineThickness(2);
  }

  const shader = new sf.Shader();
  const terrain = new sf.VertexBuffer(
    sf.PrimitiveType.Triangles, sf.VertexBuffer.Usage.Static
  );
  let pool;
  if (!sf.VertexBuffer.isAvailable() || !sf.Shader.isAvailable()) {
    status.setString('Shaders and/or Vertex Buffers Unsupported');
  } else if (!await shader.loadFromFile(
    path.join(__dirname, 'resources/terrain.vert'),
    path.join(__dirname, 'resources/terrain.frag')
  )) {
    status.setString('Failed to load shader program');
  } else {
    if (!terrain.create(width * height * 6)) {
      throw new Error('Failed to create vertex buffer');
    }
    pool = new TerrainPool();
    status.setString('Generating Terrain...');
  }

  const bounds = status.getLocalBounds().size;
  status.setPosition(new sf.Vector2f(
    (width - bounds.x) / 2, (height - bounds.y) / 2
  ));
  const states = new sf.RenderStates({ shader });
  const settings = { ...defaults };
  const names = Object.keys(settings);
  const clock = new sf.Clock();
  let currentSetting = 0;
  let requested = !!pool;
  let generating;
  let failure;

  /** Queue a parameter snapshot and upload after every worker finishes. */
  function regenerate() {
    requested = false;
    generating = pool.generate({ ...settings })
      .then(grid => uploadTerrain(terrain, grid, window))
      .catch(error => {
        failure = error;
        window.close();
      })
      .finally(() => { generating = undefined; });
  }

  try {
    while (window.isOpen()) {
      for (let event; (event = window.pollEvent());) {
        const key = event.getIf('KeyPressed');
        if (event.is('Closed') || key?.code === sf.Keyboard.Key.Escape) {
          window.close();
          break;
        }
        if (!pool || !key) continue;

        switch (key.code) {
          case sf.Keyboard.Key.Enter:
            requested = true;
            break;
          case sf.Keyboard.Key.Down:
            currentSetting = (currentSetting + 1) % names.length;
            break;
          case sf.Keyboard.Key.Up:
            currentSetting = (currentSetting + names.length - 1) % names.length;
            break;
          case sf.Keyboard.Key.Left:
            settings[names[currentSetting]] -= 0.1;
            break;
          case sf.Keyboard.Key.Right:
            settings[names[currentSetting]] += 0.1;
            break;
          default:
            break;
        }
      }
      if (!window.isOpen()) break;

      if (requested && !generating) {
        regenerate();
      }

      window.clear();
      window.draw(status);
      if (pool) {
        if (!generating) {
          shader.setUniform('lightFactor', settings.lightFactor);
          window.draw(terrain, states);
        }

        const lines = [
          `Frame:  ${clock.restart().asMilliseconds()}ms`,
          'perlinOctaves:  3\n',
          'Use the arrow keys to change the values.',
          'Use the return key to regenerate the terrain.\n',
        ];
        for (const [ i, name ] of names.entries()) {
          lines.push(
            `${i === currentSetting ? '>>  ' : '       '}${name}:  ` +
            Number(settings[name].toPrecision(6))
          );
        }
        hud.setString(lines.join('\n'));
        window.draw(hud);
      }

      window.display();
      await nextFrame();
    }
  } finally {
    // Let the current generation settle before terminating its workers.
    await generating;
    await pool?.close();
    window.close();
  }
  if (failure) throw failure;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
