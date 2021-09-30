'use strict';

const { VideoMode } = require('../lib/sfml');

{
  const mode = new VideoMode();
  console.log(mode);

  mode.width = 1024;
  mode.height = 768;
  console.log(mode);

  mode.bitsPerPixel = 32;
  console.log(mode);

  mode.width = NaN;
  console.log(mode);
}

console.log(VideoMode.getDesktopMode());
console.log(VideoMode.getFullscreenModes());
console.log(JSON.stringify(VideoMode.getFullscreenModes()));
