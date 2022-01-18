'use strict';

const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const sensorHpp = fs.readFileSync(
  path.join(__dirname, '../third_party/sfml/include/SFML/Window/Sensor.hpp'));

let current = -1;
const extracted = /enum Type\W+{([\w\W]*)Count/
  .exec(sensorHpp)[1]
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

const str = `#include <map>
#include <string>

namespace node_sfml {
namespace gen {

std::map<int, std::string> sensor_type_itoa;
std::map<std::string, int> sensor_type_atoi;

void InitSensorType() {
  ${extracted
    .map(([ key, code ]) => {
      return `sensor_type_itoa[${code}] = "${key}";
  sensor_type_atoi["${key}"] = ${code};
`;
    })
    .join('  ')
    .trim()}
}

}  // namespace gen
}  // namespace node_sfml
`;

fs.writeFileSync(path.join(__dirname, '../src/gen/sensor_type.cc'), str);

if (process.platform !== 'win32') {
  cp.execFileSync(path.join(__dirname, 'clang_format.js'), [
    '-style=file',
    '-i',
    path.join(__dirname, '../src/gen/sensor_type.cc'),
  ]);
}

console.log('./src/gen/sensor_type.cc generated.');
