'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

let files;
switch (os.platform()) {
  case 'darwin': {
    files = [
      [
        'libsfml-audio.2.5.1.dylib',
        [
          'third_party/sfml/platform/macOS/lib/libsfml-audio.dylib',
          'third_party/sfml/platform/macOS/lib/libsfml-audio.2.5.dylib',
        ],
      ],
      [
        'libsfml-graphics.2.5.1.dylib',
        [
          'third_party/sfml/platform/macOS/lib/libsfml-graphics.dylib',
          'third_party/sfml/platform/macOS/lib/libsfml-graphics.2.5.dylib',
        ],
      ],
      [
        'libsfml-network.2.5.1.dylib',
        [
          'third_party/sfml/platform/macOS/lib/libsfml-network.dylib',
          'third_party/sfml/platform/macOS/lib/libsfml-network.2.5.dylib',
        ],
      ],
      [
        'libsfml-system.2.5.1.dylib',
        [
          'third_party/sfml/platform/macOS/lib/libsfml-system.dylib',
          'third_party/sfml/platform/macOS/lib/libsfml-system.2.5.dylib',
        ],
      ],
      [
        'libsfml-window.2.5.1.dylib',
        [
          'third_party/sfml/platform/macOS/lib/libsfml-window.dylib',
          'third_party/sfml/platform/macOS/lib/libsfml-window.2.5.dylib',
        ],
      ],
    ];
    break;
  }

  case 'linux': {
    files = [
      [
        'libsfml-audio.so.2.5.1',
        [
          'third_party/sfml/platform/linux/lib/libsfml-audio.so',
          'third_party/sfml/platform/linux/lib/libsfml-audio.so.2.5',
        ],
      ],
      [
        'libsfml-graphics.so.2.5.1',
        [
          'third_party/sfml/platform/linux/lib/libsfml-graphics.so',
          'third_party/sfml/platform/linux/lib/libsfml-graphics.so.2.5',
        ],
      ],
      [
        'libsfml-network.so.2.5.1',
        [
          'third_party/sfml/platform/linux/lib/libsfml-network.so',
          'third_party/sfml/platform/linux/lib/libsfml-network.so.2.5',
        ],
      ],
      [
        'libsfml-system.so.2.5.1',
        [
          'third_party/sfml/platform/linux/lib/libsfml-system.so',
          'third_party/sfml/platform/linux/lib/libsfml-system.so.2.5',
        ],
      ],
      [
        'libsfml-window.so.2.5.1',
        [
          'third_party/sfml/platform/linux/lib/libsfml-window.so',
          'third_party/sfml/platform/linux/lib/libsfml-window.so.2.5',
        ],
      ],
    ];
    break;
  }

  case 'win32': {
    switch (process.arch) {
      case 'x64': {
        files = [];
        break;
      }
      default: {
        console.error(`win32_${process.arch} is not supported yet.`);
        process.exit(4);
      }
    }

    break;
  }

  default: {
    console.error(`${os.platform()} is not supported yet.`);
    process.exit(4);
  }
}

for (const [ src, dests ] of files) {
  for (const dest of dests) {
    const fullDest = path.join(__dirname, '..', dest);

    if (!fs.existsSync(fullDest)) {
      fs.symlinkSync(src, fullDest);
    }

    console.log(`${fullDest} -> ${src} linked.`);
  }
}
