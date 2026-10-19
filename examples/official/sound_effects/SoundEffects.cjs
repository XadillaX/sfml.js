'use strict';

// Port of SFML/examples/sound_effects/SoundEffects.cpp; see ../README.md.
const path = require('node:path');
const { setImmediate: nextFrame } = require('node:timers/promises');
const sf = require('../../..');
const width = 800;
const height = 600;
const workerModule = path.join(__dirname, 'Effects.cjs');

/**
 * Clamp a mouse-controlled value to the original range.
 * @param {number} value - Scaled mouse coordinate.
 * @param {number} maximum - Upper bound.
 */
function clamp(value, maximum) {
  return Math.max(0, Math.min(maximum, value));
}

/** Common drawable, resource and playback lifecycle for the nine effects. */
class Effect extends sf.Drawable {
  constructor(name, font, source = new sf.Music()) {
    super();
    this.name = name;
    this.font = font;
    this.source = source;
    this.drawables = [];
    this.listenerPosition = new sf.Vector3f();
  }

  /** Load music or wait for the PCM generator to prepare its first block. */
  async load() {
    if (this.source instanceof sf.Music) {
      const file = path.join(__dirname, 'resources/doodle_pop.ogg');
      if (!await this.source.openFromFile(file)) {
        throw new Error('Failed to load doodle_pop.ogg');
      }
      this.source.setLooping(true);
    } else {
      await this.source.ready;
    }
  }

  /**
   * Add one label to the effect's drawing order.
   * @param {string} string - Label contents.
   * @param {number} x - Left position.
   * @param {number} y - Top position.
   * @param {number} characterSize - Font size in pixels.
   */
  text(string, x, y, characterSize = 30) {
    const label = new sf.Text({ font: this.font, string, characterSize });
    label.setPosition(new sf.Vector2f(x, y));
    this.drawables.push(label);
    return label;
  }

  /** Restore this scene's listener position and begin playback. */
  start() {
    sf.Listener.setPosition(this.listenerPosition);
    this.source.play();
  }

  /** Stop playback when changing scenes. */
  stop() {
    this.source.stop();
  }

  /** Release the audio source after stopping playback. */
  async close() {
    this.stop();
    await this.source.close();
  }

  /** Override in effects with keyboard controls. */
  handleKey() {}

  /**
   * Draw the scene's shapes and labels.
   * @param {object} target - Render target.
   * @param {object} states - Incoming draw state.
   */
  draw(target, states) {
    for (const drawable of this.drawables) target.draw(drawable, states);
  }

  /**
   * Add the red listener and white sound source at their original size.
   * @param {number} offsetY - Optional vertical listener offset.
   */
  spatialShapes(offsetY = 0) {
    this.listener = new sf.CircleShape({ radius: 20 });
    this.listener.setPosition(new sf.Vector2f(
      (width - 20) / 2, (height - 20) / 2 + offsetY
    ));
    this.listener.setFillColor(sf.Color.Red);
    this.soundShape = new sf.CircleShape({ radius: 20 });
    this.listenerPosition = new sf.Vector3f(
      this.listener.getPosition().x, this.listener.getPosition().y, 0
    );
    this.drawables.push(this.listener, this.soundShape);
  }

  /**
   * Move both the visible source and its spatial audio position.
   * @param {number} time - Elapsed scene time.
   * @param {number} x - Normalized mouse position.
   * @param {number} y - Normalized mouse position.
   */
  update(time, x, y) {
    const position = new sf.Vector2f(width * x - 10, height * y - 10);
    this.soundShape.setPosition(position);
    this.source.setPosition(new sf.Vector3f(position.x, position.y, 0));
  }
}

/** Four distance attenuation models and the maximum-distance ring. */
class Surround extends Effect {
  constructor(font) {
    super('Surround / Attenuation', font);
    this.spatialShapes();
    this.model = 0;
    this.models = [
      [ 'Inverse', 0.04 ], [ 'Linear', 1 ],
      [ 'Exponential', 0.5 ], [ 'None', 0 ],
    ];

    const ring = new sf.CircleShape({ radius: 300, pointCount: 100 });
    ring.setOrigin(new sf.Vector2f(300, 300));
    ring.setPosition(new sf.Vector2f(
      this.listenerPosition.x + 20, this.listenerPosition.y + 20
    ));
    ring.setFillColor(sf.Color.Transparent);
    ring.setOutlineColor(new sf.Color(100, 100, 100));
    ring.setOutlineThickness(2);
    this.drawables.unshift(ring);
    this.text(
      'Press up and down arrows to change the attenuation model', 20, 20, 20
    );
    this.currentModel = this.text('', 20, 50, 20);
    this.source.setMaxDistance(300);
    this.applyModel();
  }

  /** Apply the selected model and its original demonstration factor. */
  applyModel() {
    const [ name ] = this.models[this.model];
    // This binding exposes inverse attenuation only. Apply distance gain
    // below while retaining native spatial panning.
    this.source.setAttenuation(0);
    this.currentModel.setString('Attenuation model: ' + name);
  }

  /**
   * Apply the original miniaudio attenuation formulas at the source position.
   * @param {number} time - Elapsed time.
   * @param {number} x - Normalized mouse X.
   * @param {number} y - Normalized mouse Y.
   */
  update(time, x, y) {
    super.update(time, x, y);
    const position = this.source.getPosition();
    const minimum = this.source.getMinDistance();
    const maximum = this.source.getMaxDistance();
    const distance = Math.max(minimum, Math.min(maximum, Math.hypot(
      position.x - this.listenerPosition.x,
      position.y - this.listenerPosition.y
    )));
    const [ name, factor ] = this.models[this.model];
    let gain = 1;
    if (name === 'Inverse') {
      gain = minimum / (minimum + factor * (distance - minimum));
    } else if (name === 'Linear') {
      gain = 1 - factor * (distance - minimum) / (maximum - minimum);
    } else if (name === 'Exponential') {
      gain = (distance / minimum) ** -factor;
    }
    this.source.setVolume(gain * 100);
  }

  /**
   * Cycle models in either direction.
   * @param {number} key - SFML key code.
   */
  handleKey(key) {
    if (key === sf.Keyboard.Key.Down) {
      this.model = (this.model + 1) % this.models.length;
    } else if (key === sf.Keyboard.Key.Up) {
      this.model = (this.model + this.models.length - 1) % this.models.length;
    } else {
      return;
    }
    this.applyModel();
  }
}

/** Mouse X controls pitch; mouse Y controls volume. */
class PitchVolume extends Effect {
  constructor(font) {
    super('Pitch / Volume', font);
    this.source.setAttenuation(0);
    this.pitch = this.text('Pitch: 1', width / 2 - 120, height / 2 - 80);
    this.volume = this.text('Volume: 100', width / 2 - 120, height / 2 - 30);
  }

  /**
   * Apply the original [0, 2] pitch and [0, 100] volume ranges.
   * @param {number} time - Elapsed time.
   * @param {number} x - Normalized mouse X.
   * @param {number} y - Normalized mouse Y.
   */
  update(time, x, y) {
    const pitch = clamp(2 * x, 2);
    const volume = clamp(100 * (1 - y), 100);
    this.source.setPitch(pitch);
    this.source.setVolume(volume);
    this.pitch.setString('Pitch: ' + pitch.toFixed(6));
    this.volume.setString('Volume: ' + volume.toFixed(6));
  }
}

/** Directional attenuation with visible 30° inner and 120° outer cones. */
class Attenuation extends Effect {
  constructor(font) {
    super('Attenuation', font);
    this.spatialShapes(100);
    this.soundShape.setFillColor(sf.Color.Magenta);
    this.cones = [];
    for (const [ angle, color ] of [
      [ 120, sf.Color.Black ], [ 30, sf.Color.Cyan ],
    ]) {
      const cone = new sf.ConvexShape(3);
      const x = height * 2 / Math.tan((90 - angle / 2) * Math.PI / 180);
      cone.setPoint(0, new sf.Vector2f());
      cone.setPoint(1, new sf.Vector2f(-x, height * 2));
      cone.setPoint(2, new sf.Vector2f(x, height * 2));
      cone.setFillColor(color);
      this.cones.push(cone);
    }
    this.drawables = [ ...this.cones, this.soundShape, this.listener ];
    this.source.setAttenuation(0.01);
    this.source.setDirection(new sf.Vector3f(0, 1, 0));
    this.source.setCone({
      innerAngle: sf.degrees(30), outerAngle: sf.degrees(120), outerGain: 0,
    });
    this.text(
      'Attenuation factor dampens full volume of sound while within inner ' +
      'cone based on distance to listener.\nCone outer gain determines ' +
      'volume of sound while outside outer cone.\nWhen within outer cone, ' +
      'volume is linearly interpolated between inner and outer volumes.',
      20, 20, 18
    );
  }

  /**
   * Move both sound cones with the source.
   * @param {number} time - Elapsed time.
   * @param {number} x - Normalized mouse X.
   * @param {number} y - Normalized mouse Y.
   */
  update(time, x, y) {
    super.update(time, x, y);
    for (const cone of this.cones) {
      cone.setPosition(new sf.Vector2f(width * x + 10, height * y + 10));
    }
  }
}

/** Worker-backed tone with four waveforms, frequency and amplitude controls. */
class Tone extends Effect {
  constructor(font, doppler = false) {
    const controls = new Int32Array(new SharedArrayBuffer(16));
    controls.set([ doppler ? 3 : 2, 50000, 220000, 1 ]);
    const source = new sf.SoundStream({
      module: workerModule,
      exportName: 'tone',
      data: { controls: controls.buffer },
      sampleRate: 44100,
      channelCount: 1,
      channelMap: [ sf.SoundChannel.Mono ],
      blockFrames: 441,
    });
    super(doppler ? 'Doppler Shift' : 'Tone Generator', font, source);
    this.controls = controls;

    if (!doppler) {
      this.text('Press up and down arrows to change the current wave type',
        width / 2 - 370, height / 2 - 200);
      this.waveType = this.text('Wave Type: Triangle',
        width / 2 - 150, height / 2 - 100);
      this.amplitude = this.text('Amplitude: 0.05',
        width / 2 - 150, height / 2 - 50);
      this.frequency = this.text('Frequency: 200 Hz',
        width / 2 - 150, height / 2);
    }
  }

  /**
   * Publish controls atomically for the audio Worker.
   * @param {number} time - Elapsed time.
   * @param {number} x - Normalized mouse X.
   * @param {number} y - Normalized mouse Y.
   */
  update(time, x, y) {
    const amplitude = clamp(0.2 * (1 - y), 0.2);
    const frequency = clamp(500 * x, 500);
    Atomics.store(this.controls, 1, Math.round(amplitude * 1e6));
    Atomics.store(this.controls, 2, Math.round(frequency * 1e3));
    this.amplitude.setString('Amplitude: ' + amplitude.toFixed(6));
    this.frequency.setString('Frequency: ' + frequency.toFixed(6) + ' Hz');
  }

  /**
   * Cycle sine, square, triangle and sawtooth.
   * @param {number} key - SFML key code.
   */
  handleKey(key) {
    const delta = key === sf.Keyboard.Key.Down ? 1
      : key === sf.Keyboard.Key.Up ? 3 : 0;
    const type = (Atomics.load(this.controls, 0) + delta) % 4;
    Atomics.store(this.controls, 0, type);
    const names = [ 'Sine', 'Square', 'Triangle', 'Sawtooth' ];
    this.waveType.setString('Wave Type: ' + names[type]);
  }
}

/** A moving sawtooth source with independent velocity and Doppler factor. */
class Doppler extends Tone {
  constructor(font) {
    super(font, true);
    this.spatialShapes();
    this.source.setAttenuation(0.05);
    this.velocity = this.text('Velocity: 0',
      width / 2 - 150, height * 3 / 4 - 50);
    this.factor = this.text('Doppler Factor: 1',
      width / 2 - 150, height * 3 / 4);
  }

  /**
   * Move through the original eight-second trajectory.
   * @param {number} time - Total elapsed seconds.
   * @param {number} x - Normalized mouse X.
   * @param {number} y - Normalized mouse Y.
   */
  update(time, x, y) {
    const velocity = clamp(150 * (1 - y), 150);
    const factor = clamp(x, 1);
    const position = new sf.Vector3f(
      time % 8 * width / 8, (height - 20) / 2 - 40, 0
    );
    this.source.setPosition(position);
    this.source.setVelocity(new sf.Vector3f(velocity, 0, 0));
    this.source.setDopplerFactor(factor);
    this.soundShape.setPosition(new sf.Vector2f(position.x - 20, position.y));
    this.velocity.setString('Velocity: ' + velocity.toFixed(6));
    this.factor.setString('Doppler Factor: ' + factor.toFixed(6));
  }

  /** Doppler uses a fixed sawtooth; keyboard wave selection is disabled. */
  handleKey() {}
}

/** Biquad, echo and reverb scenes sharing spatial drawing and bypass input. */
class Processing extends Effect {
  constructor(name, type, font) {
    super(name, font);
    this.type = type;
    this.controls = new Int32Array(new SharedArrayBuffer(16));
    Atomics.store(this.controls, 3, 1);
    this.spatialShapes();
    this.source.setAttenuation(0);
    this.enabled = this.text('Processing: Enabled',
      width / 2 - 120, height * 3 / 4 - 50);
    this.text('Press Space to enable/disable processing',
      width / 2 - 250, height * 3 / 4);
  }

  /** Attach DSP after music loading and Worker initialization complete. */
  async load() {
    await super.load();
    this.processor = new sf.EffectProcessor({
      module: workerModule,
      exportName: 'processing',
      data: { type: this.type, controls: this.controls.buffer },
    });
    await this.processor.ready;
    this.source.setEffectProcessor(this.processor);
  }

  /**
   * Toggle processing without changing the original DSP state policy.
   * @param {number} key - SFML key code.
   */
  handleKey(key) {
    if (key === sf.Keyboard.Key.Space) {
      Atomics.store(this.controls, 3, 1 - Atomics.load(this.controls, 3));
    }
    this.enabled.setString('Processing: ' +
      (Atomics.load(this.controls, 3) ? 'Enabled' : 'Disabled'));
  }

  /** Detach DSP before releasing its Worker and audio source. */
  async close() {
    this.stop();
    this.source.setEffectProcessor();
    const results = await Promise.allSettled([
      this.processor?.close(), this.source.close(),
    ]);
    const failed = results.find(result => result.status === 'rejected');
    if (failed) throw failed.reason;
  }
}

/** Create the original nine effects and keep the UI event loop asynchronous. */
async function main() {
  const window = new sf.RenderWindow(
    new sf.VideoMode(new sf.Vector2u(width, height)), 'SFML Sound Effects',
    { style: sf.Style.Titlebar + sf.Style.Close }
  );
  window.setVerticalSyncEnabled(true);

  const font = new sf.Font();
  if (!await font.openFromFile(path.join(__dirname, 'resources/tuffy.ttf'))) {
    throw new Error('Failed to load tuffy.ttf');
  }
  const effects = [
    new Surround(font), new PitchVolume(font), new Attenuation(font),
    new Tone(font), new Doppler(font),
    new Processing('High-pass Filter', 'highPass', font),
    new Processing('Low-pass Filter', 'lowPass', font),
    new Processing('Echo', 'echo', font),
    new Processing('Reverb', 'reverb', font),
  ];
  let failure;

  try {
    for (const effect of effects) await effect.load();

    const texture = new sf.Texture();
    if (!await texture.loadFromFile(
      path.join(__dirname, 'resources/text-background.png')
    )) {
      throw new Error('Failed to load text-background.png');
    }
    const background = new sf.Sprite(texture);
    background.setPosition(new sf.Vector2f(0, 520));
    background.setColor(new sf.Color(255, 255, 255, 200));

    const labels = [];
    /**
     * Create one of the original footer labels.
     * @param {string} string - Label contents.
     * @param {number} x - Horizontal position.
     * @param {number} y - Vertical position.
     */
    const label = (string, x, y) => {
      const text = new sf.Text({ font, string, characterSize: 20 });
      text.setPosition(new sf.Vector2f(x, y));
      text.setFillColor(new sf.Color(80, 80, 80));
      labels.push(text);
      return text;
    };

    let current = 0;
    const description = label('Current effect: ' + effects[0].name, 10, 522);
    label('Press left and right arrows to change the current effect', 280, 544);
    const device = label('Current playback device: ' +
      (sf.PlaybackDevice.getDevice() ?? 'None'), 10, 566);
    label('Press F1 to change device', 565, 566);
    effects[current].start();
    const clock = new sf.Clock();

    while (window.isOpen()) {
      for (let event; (event = window.pollEvent());) {
        if (event.is('Closed')) window.close();

        const key = event.getIf('KeyPressed');
        if (!key) continue;

        switch (key.code) {
          case sf.Keyboard.Key.Escape:
            window.close();
            break;
          case sf.Keyboard.Key.Left:
          case sf.Keyboard.Key.Right: {
            effects[current].stop();
            const delta = key.code === sf.Keyboard.Key.Left ? -1 : 1;
            current = (current + delta + effects.length) % effects.length;
            effects[current].start();
            description.setString('Current effect: ' + effects[current].name);
            break;
          }
          case sf.Keyboard.Key.F1: {
            const devices = sf.PlaybackDevice.getAvailableDevices();
            const index = devices.indexOf(sf.PlaybackDevice.getDevice());
            const next = index < 0 ? sf.PlaybackDevice.getDevice()
              : devices[(index + 1) % devices.length];
            if (next && !sf.PlaybackDevice.setDevice(next)) {
              console.error('Failed to set the playback device to: ' + next);
            }
            device.setString('Current playback device: ' +
              (sf.PlaybackDevice.getDevice() ?? 'None'));
            break;
          }
          default:
            effects[current].handleKey(key.code);
            break;
        }
      }
      if (!window.isOpen()) break;

      const mouse = sf.Mouse.getPosition(window);
      const size = window.getSize();
      const effect = effects[current];
      effect.update(clock.getElapsedTime().asSeconds(),
        mouse.x / size.x, mouse.y / size.y);
      const error = effect.source.getWorkerError() ||
        effect.processor?.getWorkerError();
      if (error) throw error;

      window.clear(new sf.Color(50, 50, 50));
      window.draw(effect);
      window.draw(background);
      for (const text of labels) window.draw(text);

      window.display();
      await nextFrame();
    }
  } catch (error) {
    failure = error;
  } finally {
    const results = await Promise.allSettled(
      effects.map(effect => effect.close())
    );
    window.close();
    const failed = results.find(result => result.status === 'rejected');
    failure ||= failed?.reason;
  }

  if (failure) throw failure;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
