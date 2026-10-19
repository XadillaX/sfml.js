'use strict';

// Port of SFML/examples/shader/Shader.cpp; see ../README.md.
const path = require('node:path');
const sf = require('../../..');

/** Base interface used by the five original shader effects. */
class Effect extends sf.Drawable {

  /**
   * Update shader uniforms for time and normalized cursor coordinates.
   * @param {number} time - Elapsed time in seconds.
   * @param {number} x - Normalized horizontal cursor coordinate.
   * @param {number} y - Normalized vertical cursor coordinate.
   */
  update(time, x, y) {
    void time;
    void x;
    void y;
  }
}

/** Pixelate fragment shader applied to the original butterfly image. */
class Pixelate extends Effect {
  constructor(texture, shader) {
    super();
    this.texture = texture;
    this.shader = shader;
    shader.setUniform('texture', sf.Shader.CurrentTexture);
  }

  update(time, x, y) {
    this.shader.setUniform('pixel_threshold', (x + y) / 30);
  }

  draw(target, states) {
    states.shader = this.shader;
    target.draw(new sf.Sprite(this.texture), states);
  }
}

/** Vertex wave deformation followed by a fragment blur. */
class WaveBlur extends Effect {
  constructor(font, shader) {
    super();
    this.shader = shader;
    this.text = new sf.Text({
      font,
      characterSize: 22,
      string: [
        'Praesent suscipit augue in velit pulvinar ' +
        'hendrerit varius purus aliquam.',
        'Mauris mi odio, bibendum quis fringilla a, laoreet vel orci. ' +
          'Proin vitae vulputate tortor.',
        'Praesent cursus ultrices justo, ut feugiat ante vehicula quis.',
        'Donec fringilla scelerisque mauris et viverra.',
        'Maecenas adipiscing ornare scelerisque. Nullam at libero elit.',
        'Pellentesque habitant morbi tristique senectus et netus et ' +
          'malesuada fames ac turpis egestas.',
        'Nullam leo urna, tincidunt id semper eget, ultricies sed mi.',
        'Morbi mauris massa, commodo id dignissim vel, lobortis et elit.',
        'Fusce vel libero sed neque scelerisque venenatis.',
        'Integer mattis tincidunt quam vitae iaculis.',
        'Vivamus fringilla sem non velit venenatis fermentum.',
        'Vivamus varius tincidunt nisi id vehicula.',
        'Integer ullamcorper, enim vitae euismod ' +
        'rutrum, massa nisl semper ipsum,',
        'vestibulum sodales sem ante in massa.',
        'Vestibulum in augue non felis convallis viverra.',
        'Mauris ultricies dolor sed massa convallis ' +
        'sed aliquet augue fringilla.',
        'Duis erat eros, porta in accumsan in, blandit quis sem.',
        'In hac habitasse platea dictumst. Etiam ' +
        'fringilla est id odio dapibus ' +
          'sit amet semper dui laoreet.',
        '',
      ].join('\n'),
    });
    this.text.setPosition(new sf.Vector2f(30, 20));
  }

  update(time, x, y) {
    this.shader.setUniform('wave_phase', time);
    this.shader.setUniform(
      'wave_amplitude',
      new sf.Vector2f(x * 40, y * 40)
    );
    this.shader.setUniform('blur_radius', (x + y) * 0.008);
  }

  draw(target, states) {
    states.shader = this.shader;
    target.draw(this.text, states);
  }
}

/** Storm deformation and blinking applied to 40,000 colored points. */
class StormBlink extends Effect {
  constructor(shader) {
    super();
    this.shader = shader;
    this.points = new sf.VertexArray(
      sf.PrimitiveType.Points,
      40000
    );
    for (const vertex of this.points) {
      vertex.position = new sf.Vector2f(
        Math.random() * 800,
        Math.random() * 600
      );
      vertex.color = new sf.Color(
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256)
      );
    }
  }

  update(time, x, y) {
    const radius = 200 + Math.cos(time) * 150;
    this.shader.setUniform(
      'storm_position',
      new sf.Vector2f(x * 800, y * 600)
    );
    this.shader.setUniform('storm_inner_radius', radius / 3);
    this.shader.setUniform('storm_total_radius', radius);
    this.shader.setUniform(
      'blink_alpha',
      0.5 + Math.cos(time * 3) * 0.25
    );
  }

  draw(target, states) {
    states.shader = this.shader;
    target.draw(this.points, states);
  }
}

/** Render the six moving entities offscreen, then detect image edges. */
class Edge extends Effect {
  constructor(surface, backgroundTexture, entityTexture, shader) {
    super();
    Object.assign(this, {
      surface,
      backgroundTexture,
      entityTexture,
      shader,
    });
  }

  update(time, x, y) {
    this.shader.setUniform('edge_threshold', 1 - (x + y) / 2);
    this.surface.clear(sf.Color.White);

    const background = new sf.Sprite(this.backgroundTexture);
    background.setPosition(new sf.Vector2f(135, 100));
    this.surface.draw(background);
    for (let i = 0; i < 6; ++i) {
      const entity = new sf.Sprite(
        this.entityTexture,
        new sf.IntRect(
          new sf.Vector2i(96 * i, 0),
          new sf.Vector2i(96, 96)
        )
      );
      entity.setPosition(
        new sf.Vector2f(
          Math.cos(0.25 * (time * i + 6 - i)) * 300 + 350,
          Math.sin(0.25 * (time * (6 - i) + i)) * 200 + 250
        )
      );
      this.surface.draw(entity);
    }

    this.surface.display();
  }

  draw(target, states) {
    states.shader = this.shader;
    target.draw(new sf.Sprite(this.surface.getTexture()), states);
  }
}

/** Geometry shader expands 10,000 points to textured billboards. */
class Geometry extends Effect {
  constructor(logoTexture, shader) {
    super();
    this.logoTexture = logoTexture;
    this.shader = shader;
    this.transform = new sf.Transform();
    this.pointCloud = new sf.VertexArray(
      sf.PrimitiveType.Points,
      10000
    );
    for (const vertex of this.pointCloud) {
      vertex.position = new sf.Vector2f(
        Math.random() * 960 - 480,
        Math.random() * 960 - 480
      );
    }
  }

  update(time, x, y) {
    this.transform = new sf.Transform();
    this.transform.translate(new sf.Vector2f(400, 300));
    this.transform.rotate(sf.degrees(x * 360));

    const size = 25 + Math.abs(y) * 50;
    this.shader.setUniform('size', new sf.Vector2f(size, size));
  }

  draw(target, states) {
    states.shader = this.shader;
    states.texture = this.logoTexture;
    states.transform = this.transform;
    target.draw(this.pointCloud, states);
  }
}

/**
 * Load one of the original textures.
 * @param {string} name - Resource or icon name.
 * @param {boolean} smooth - Enable texture filtering.
 */
async function texture(name, smooth = false) {
  const value = new sf.Texture();
  if (
    !(await value.loadFromFile(
      path.join(__dirname, 'resources', name)
    ))
  ) {
    return undefined;
  }

  value.setSmooth(smooth);

  return value;
}

/**
 * Compile original shader stages, returning undefined on failure.
 * @param {...string} names - Shader filenames in stage order.
 */
async function shader(...names) {
  const value = new sf.Shader();
  const stages = names.map(name =>
    path.join(__dirname, 'resources', name)
  );
  if (stages.length === 1) {
    stages.push(sf.ShaderType.Fragment);
  }

  return (await value.loadFromFile(...stages)) ? value : undefined;
}

/** Initialize effects and retain the original arrow-key/cursor interaction. */
async function main() {
  if (!sf.Shader.isAvailable()) {
    throw new Error(
      'Shaders not supported on current system, aborting'
    );
  }

  const window = new sf.RenderWindow(
    new sf.VideoMode(new sf.Vector2u(800, 600)),
    'SFML Shader',
    {
      style: sf.Style.Titlebar + sf.Style.Close,
    }
  );
  window.setVerticalSyncEnabled(true);

  const font = new sf.Font();
  if (
    !(await font.openFromFile(
      path.join(__dirname, 'resources/tuffy.ttf')
    ))
  ) {
    throw new Error('font');
  }

  const effects = [];
  const pixelTexture = await texture('background.jpg');
  const pixelShader = await shader('pixelate.frag');
  effects.push(
    pixelTexture && pixelShader
      ? new Pixelate(pixelTexture, pixelShader)
      : undefined
  );

  const waveShader = await shader('wave.vert', 'blur.frag');
  effects.push(
    waveShader ? new WaveBlur(font, waveShader) : undefined
  );

  const stormShader = await shader('storm.vert', 'blink.frag');
  effects.push(
    stormShader ? new StormBlink(stormShader) : undefined
  );

  const surface = new sf.RenderTexture();
  const surfaceReady = surface.resize(new sf.Vector2u(800, 600));
  if (surfaceReady) surface.setSmooth(true);

  const background = await texture('sfml.png', true);
  const entities = await texture('devices.png', true);
  const edgeShader = await shader('edge.frag');
  if (edgeShader) {
    edgeShader.setUniform('texture', sf.Shader.CurrentTexture);
  }

  effects.push(
    surfaceReady && background && entities && edgeShader
      ? new Edge(surface, background, entities, edgeShader)
      : undefined
  );

  const logo = sf.Shader.isGeometryAvailable()
    ? await texture('logo.png', true)
    : undefined;
  const geometryShader = logo
    ? await shader(
      'billboard.vert',
      'billboard.geom',
      'billboard.frag'
    )
    : undefined;
  if (geometryShader) {
    geometryShader.setUniform('texture', sf.Shader.CurrentTexture);
    geometryShader.setUniform(
      'resolution',
      new sf.Vector2f(800, 600)
    );
  }

  effects.push(
    logo && geometryShader
      ? new Geometry(logo, geometryShader)
      : undefined
  );

  const effectNames = [
    'Pixelate',
    'Wave + Blur',
    'Storm + Blink',
    'Edge Post-effect',
    'Geometry Shader Billboards',
  ];
  let current = 0;
  const textBackgroundTexture = await texture(
    'text-background.png'
  );
  if (!textBackgroundTexture) {
    throw new Error('text background');
  }

  const textBackground = new sf.Sprite(textBackgroundTexture);
  textBackground.setPosition(new sf.Vector2f(0, 520));
  textBackground.setColor(new sf.Color(255, 255, 255, 200));

  const description = new sf.Text({
    font,
    characterSize: 20,
    string: 'Current effect: ' + effectNames[current],
  });
  description.setPosition(new sf.Vector2f(10, 530));
  description.setFillColor(new sf.Color(80, 80, 80));

  const instructions = new sf.Text({
    font,
    characterSize: 20,
    string:
      'Press left and right arrows to change the current shader',
  });
  instructions.setPosition(new sf.Vector2f(280, 555));
  instructions.setFillColor(new sf.Color(80, 80, 80));

  const clock = new sf.Clock();

  /** Update and draw the selected effect. */
  function frame() {
    for (let event; (event = window.pollEvent());) {
      const key = event.getIf('KeyPressed');
      if (
        event.is('Closed') ||
        key?.code === sf.Keyboard.Key.Escape
      ) {
        window.close();

        return;
      }

      if (key) {
        if (key.code === sf.Keyboard.Key.Left) {
          current = (current + 4) % 5;
        }

        if (key.code === sf.Keyboard.Key.Right) {
          current = (current + 1) % 5;
        }

        description.setString(
          'Current effect: ' + effectNames[current]
        );
      }
    }

    const effect = effects[current];
    if (effect) {
      const mouse = sf.Mouse.getPosition(window);
      const size = window.getSize();
      effect.update(
        clock.getElapsedTime().asSeconds(),
        mouse.x / size.x,
        mouse.y / size.y
      );

      window.clear(
        current === 3 ? sf.Color.White : new sf.Color(50, 50, 50)
      );
      window.draw(effect);
    } else {
      window.clear(new sf.Color(50, 50, 50));

      const error = new sf.Text({
        font,
        characterSize: 36,
        string: 'Shader not\nsupported',
      });
      error.setPosition(new sf.Vector2f(320, 200));

      window.draw(error);
    }

    window.draw(textBackground);
    window.draw(instructions);
    window.draw(description);

    window.display();
    if (window.isOpen()) {
      setImmediate(frame);
    }
  }

  frame();
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
