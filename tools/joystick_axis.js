'use strict';

const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const joystickHpp = fs.readFileSync(
  path.join(__dirname, '../third_party/sfml/include/SFML/Window/Joystick.hpp'));

let current = -1;
const extracted = /enum Axis\W+{([^}]*)\};/
  .exec(joystickHpp)[1]
  .trim()
  .split('\n')
  .map(line => {
    line = line.trim().replace(/(,|)\W*\/\/\/.+/, '');

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

std::map<int, std::string> joystick_axis_itoa;
std::map<std::string, int> joystick_axis_atoi;

void InitJoystickAxis() {
  ${extracted
    .map(([ key, code ]) => {
      return `joystick_axis_itoa[${code}] = "${key}";
  joystick_axis_atoi["${key}"] = ${code};
  `;
    })
    .join('')}
}

}  // namespace node_sfml
}  // namespace gen
`;

fs.writeFileSync(path.join(__dirname, '../src/gen/joystick_axis.cc'), str);

if (process.platform !== 'win32') {
  cp.execFileSync(path.join(__dirname, 'clang_format.js'), [
    '-style=file',
    '-i',
    path.join(__dirname, '../src/gen/joystick_axis.cc'),
  ]);
}

console.log('./src/gen/joystick_axis.cc generated.');
