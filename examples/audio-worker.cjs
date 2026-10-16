'use strict';

exports.tone = ({ sampleRate }, { frequency = 330 } = {}) => {
  let sample = 0;
  return {
    onGetData(chunk) {
      for (let i = 0; i < chunk.samples.length; i++) {
        chunk.samples[i] = Math.sin(sample++ * 2 * Math.PI *
          frequency / sampleRate) * 10000;
      }
      chunk.sampleCount = chunk.samples.length;
      return true;
    },
    onSeek(time) {
      sample = Number(time.asMicroseconds() * BigInt(sampleRate) / 1000000n);
    },
  };
};

exports.filter = () => {
  const previous = [];
  return {
    process(input, inputFrames, output, outputFrames, channels) {
      const frames = input ? Math.min(inputFrames, outputFrames) : 0;
      for (let frame = 0; frame < frames; frame++) {
        for (let channel = 0; channel < channels; channel++) {
          const index = frame * channels + channel;
          const value = (previous[channel] ?? 0) * 0.8 + input[index] * 0.2;
          previous[channel] = value;
          output[index] = value * 0.55;
        }
      }
      return { inputFrameCount: frames, outputFrameCount: frames };
    },
  };
};
