'use strict';

const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const mouseHpp = fs.readFileSync(
  path.join(__dirname, '../third_party/sfml/include/SFML/Window/Mouse.hpp'));

let current = -1;
const extracted = /enum Button\W+{([\w\W]*)ButtonCount/
  .exec(mouseHpp)[1]
  .trim()
  .split('\n')
  .map(line => {
    line = line.trim().replace(/,\W*\/\/\/.+/, '');

    const arr = line.split('=').map(c => c.trim());
    if (arr.length >= 2) {
      current = parseInt(arr[1]);
    } else {
      current++;
    }

    return [ arr[0], current ];
  });

current = -1;
const extracted2 = /enum Wheel\W+{([\w\W]*?)}/
  .exec(mouseHpp)[1]
  .trim()
  .split('\n')
  .map(line => {
    line = line.trim().replace(/(,\W*)?\/\/\/.+/, '');

    const arr = line.split('=').map(c => c.trim());
    if (arr.length >= 2) {
      current = parseInt(arr[1]);
    } else {
      current++;
    }

    return [ arr[0], current ];
  });

const str = `#include <map>
#include <string>

namespace node_sfml {
namespace gen {

std::map<int, std::string> mouse_button_itoa;
std::map<std::string, int> mouse_button_atoi;
std::map<int, std::string> mouse_wheel_itoa;
std::map<std::string, int> mouse_wheel_atoi;

void InitMouseButton() {
  ${extracted
    .map(([ key, code ]) => {
      return `mouse_button_itoa[${code}] = "${key}";
  mouse_button_atoi["${key}"] = ${code};
  `;
    })
    .join('')}
  ${extracted2
    .map(([ key, code ]) => {
      return `mouse_wheel_itoa[${code}] = "${key}";
  mouse_wheel_atoi["${key}"] = ${code};
  `;
    })
    .join('')}
}

}  // namespace node_sfml
}  // namespace gen
`;

fs.writeFileSync(path.join(__dirname, '../src/gen/mouse_button.cc'), str);

if (process.platform !== 'win32') {
  cp.execFileSync(path.join(__dirname, 'clang_format.js'), [
    '-style=file',
    '-i',
    path.join(__dirname, '../src/gen/mouse_button.cc'),
  ]);
}

console.log('./src/gen/mouse_button.cc generated.');
