'use strict';

const { VideoMode } = require('../..');

{
  const mode = new VideoMode();
  console.log(mode);
  mode.size.x = 1024;
  mode.size.y = 768;
  console.log(mode);
  mode.bitsPerPixel = 32;
  console.log(mode);
  mode.size.x = NaN;
  console.log(mode);
}

console.log(VideoMode.getDesktopMode());
console.log(VideoMode.getFullscreenModes());
console.log(JSON.stringify(VideoMode.getFullscreenModes()));
