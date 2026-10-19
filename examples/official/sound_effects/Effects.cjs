'use strict';

// DSP formulas ported from SFML/examples/sound_effects/SoundEffects.cpp.
// Shared controls: wave type, amplitude × 1e6, frequency × 1e3, enabled.

/**
 * Produce the four original mono waveforms in native 441-sample blocks.
 * @param {object} context - Audio format.
 * @param {object} options - Shared UI controls.
 */
function tone(context, options) {
  const controls = new Int32Array(options.controls);
  let time = 0;
  return {
    /**
     * Fill one native PCM slot while retaining phase between chunks.
     * @param {object} chunk - Writable native PCM slot.
     */
    onGetData(chunk) {
      const type = Atomics.load(controls, 0);
      const amplitude = Atomics.load(controls, 1) / 1e6;
      const frequency = Atomics.load(controls, 2) / 1e3;
      const period = 1 / frequency;
      for (let i = 0; i < chunk.samples.length; ++i) {
        let value = 0;
        if (frequency > 0) {
          switch (type) {
            case 0:
              value = amplitude * Math.sin(2 * Math.PI * frequency * time);
              break;
            case 1:
              value = amplitude * (2 * (2 * Math.floor(frequency * time) -
                Math.floor(2 * frequency * time)) + 1);
              break;
            case 2:
              value = 4 * amplitude / period *
                Math.abs(((time - period / 4) % period + period) % period -
                  period / 2) - amplitude;
              break;
            case 3:
              value = amplitude * 2 *
                (time / period - Math.floor(0.5 + time / period));
              break;
            default:
              break;
          }
        }
        const sample = value * 32767;
        chunk.samples[i] = Math.sign(sample) * Math.round(Math.abs(sample));
        time += 1 / context.sampleRate;
      }
      chunk.sampleCount = chunk.samples.length;
      return true;
    },
    /** Seeking has no meaning for a continuously generated tone. */
    onSeek() {},
  };
}

/**
 * Build one all-pass delay stage with its own circular buffer.
 * @param {number} delay - Delay in samples.
 * @param {number} gain - Feedback gain.
 */
function allPass(delay, gain) {
  const buffer = new Float32Array(delay);
  let cursor = 0;
  return input => {
    const output = buffer[cursor];
    input += gain * output;
    buffer[cursor] = input;
    cursor = (cursor + 1) % buffer.length;
    return -gain * input + output;
  };
}

// The original symmetric, 64-tap low-pass impulse response.
const taps = [
  0.003369, 0.002810, 0.001758, 0.000340, -0.001255, -0.002793,
  -0.004014, -0.004659, -0.004516, -0.003464, -0.001514, 0.001148,
  0.004157, 0.006986, 0.009003, 0.009571, 0.008173, 0.004560,
  -0.001120, -0.008222, -0.015581, -0.021579, -0.024323, -0.021933,
  -0.012904, 0.003500, 0.026890, 0.055537, 0.086377, 0.115331,
  0.137960, 0.150407, 0.150407, 0.137960, 0.115331, 0.086377,
  0.055537, 0.026890, 0.003500, -0.012904, -0.021933, -0.024323,
  -0.021579, -0.015581, -0.008222, -0.001120, 0.004560, 0.008173,
  0.009571, 0.009003, 0.006986, 0.004157, 0.001148, -0.001514,
  -0.003464, -0.004516, -0.004659, -0.004014, -0.002793, -0.001255,
  0.000340, 0.001758, 0.002810, 0.003369,
];

/**
 * Build the original all-pass/FIR reverb for one output channel.
 * @param {number} sampleRate - Engine sample rate in Hz.
 */
function reverb(sampleRate) {
  const filters = [
    allPass(Math.floor(sampleRate / 10), 0.6),
    allPass(Math.floor(sampleRate / 30), -0.6),
    allPass(Math.floor(sampleRate / 90), 0.6),
    allPass(Math.floor(sampleRate / 270), -0.6),
  ];
  const fir = new Float32Array(taps.length);
  const buffer = new Float32Array(Math.floor(sampleRate / 5));
  const interval = Math.floor(buffer.length / 3);
  let firCursor = 0;
  let cursor = 0;

  return input => {
    let output = 0.7 * input + 0.7 * buffer[cursor];
    for (const filter of filters) output = filter(output);

    fir[firCursor] = output;
    firCursor = (firCursor + 1) % fir.length;
    output = 0;
    for (let i = 0; i < taps.length; ++i) {
      output += taps[i] * fir[(firCursor + i) % fir.length];
    }

    buffer[cursor] = output;
    cursor = (cursor + 1) % buffer.length;
    output += 0.5 * buffer[(cursor + interval - 1) % buffer.length];
    output += 0.25 * buffer[(cursor + 2 * interval - 1) % buffer.length];
    output += 0.125 * buffer[(cursor + 3 * interval - 1) % buffer.length];
    return 0.6 * output + input;
  };
}

/**
 * Create the original 2000 Hz high-pass or 500 Hz low-pass biquad.
 * @param {number} sampleRate - Engine sample rate.
 * @param {boolean} highPass - Select high-pass coefficients.
 */
function biquad(sampleRate, highPass) {
  const c = highPass ? Math.tan(Math.PI * 2000 / sampleRate)
    : 1 / Math.tan(Math.PI * 500 / sampleRate);
  const a0 = 1 / (1 + Math.SQRT2 * c + c * c);
  const a1 = (highPass ? -2 : 2) * a0;
  const b1 = 2 * a0 * (highPass ? c * c - 1 : 1 - c * c);
  const b2 = a0 * (1 - Math.SQRT2 * c + c * c);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;

  return input => {
    const output = a0 * input + a1 * x1 + a0 * x2 - b1 * y1 - b2 * y2;
    x2 = x1;
    x1 = input;
    y2 = y1;
    y1 = output;
    return output;
  };
}

/**
 * Create a 200 ms echo channel using the upstream wet/dry/decay formula.
 * @param {number} sampleRate - Engine sample rate.
 */
function echo(sampleRate) {
  const buffer = new Float32Array(Math.floor(sampleRate * 0.2));
  let cursor = 0;
  return input => {
    buffer[cursor] = buffer[cursor] * 0.75 + input;
    const output = buffer[cursor] * 0.8;
    cursor = (cursor + 1) % buffer.length;
    return output;
  };
}

/**
 * Process native float blocks, with independent state per engine channel.
 * @param {object} context - Actual engine format.
 * @param {object} options - Effect name and shared enabled flag.
 */
function processing(context, options) {
  const controls = new Int32Array(options.controls);
  const sampleRate = context.sampleRate || 44100;
  const channels = [];
  const factories = {
    highPass: () => biquad(sampleRate, true),
    lowPass: () => biquad(sampleRate, false),
    echo: () => echo(sampleRate),
    reverb: () => reverb(sampleRate),
  };
  return {
    /**
     * Consume available input, or synthesize the effect tail from silence.
     * @param {Float32Array|null} input - Interleaved input samples.
     * @param {number} inputFrames - Available input frame count.
     * @param {Float32Array} output - Writable native output samples.
     * @param {number} outputFrames - Maximum output frame count.
     * @param {number} channelCount - Engine channels per frame.
     */
    process(input, inputFrames, output, outputFrames, channelCount) {
      while (channels.length < channelCount) {
        channels.push(factories[options.type]());
      }

      const enabled = Atomics.load(controls, 3) !== 0;
      const frames = input ? Math.min(inputFrames, outputFrames) : outputFrames;
      for (let frame = 0; frame < frames; ++frame) {
        for (let channel = 0; channel < channelCount; ++channel) {
          const index = frame * channelCount + channel;
          const value = input ? input[index] : 0;
          // Upstream advances biquad/echo state while bypassed, but freezes
          // reverb state while bypassed.
          const filtered = !enabled && options.type === 'reverb'
            ? value : channels[channel](value);
          output[index] = enabled ? filtered : value;
        }
      }
      return {
        inputFrameCount: input ? frames : 0,
        outputFrameCount: frames,
      };
    },
  };
}

module.exports = { tone, processing };
