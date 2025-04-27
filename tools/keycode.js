'use strict';

const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const keyboardHpp = fs.readFileSync(
  path.join(__dirname, '../third_party/sfml/include/SFML/Window/Keyboard.hpp'));

// Extract main key value definitions
let current = 0;
const extracted = /enum Key\W+{([\w\W]*)KeyCount,/
  .exec(keyboardHpp)[1]
  .trim()
  .split('\n')
  .map(line => {
    // Match both ///< and //!< comment formats
    line = line.trim().replace(/,\W*(\/\/\/|\/\/!).+/, '');

    const arr = line.split('=').map(c => c.trim());
    if (arr.length >= 2) {
      current = parseInt(arr[1]);
    } else {
      current++;
    }

    return [ arr[0], current ];
  });

// Extract deprecated key mappings
// eslint-disable-next-line
const deprecatedKeysRegex = /(\w+)\s*=\s*(\w+),\s*\/\/!<\s*\\deprecated\s*Use\s*(\w+)\s*instead/g;
const keyboardHppContent = keyboardHpp.toString();
const deprecatedKeys = [];
let match;

while ((match = deprecatedKeysRegex.exec(keyboardHppContent)) !== null) {
  const [ , deprecated, current ] = match;
  deprecatedKeys.push([ deprecated, current ]);
}

const str = `#include <map>
#include <string>

namespace node_sfml {
namespace gen {

std::map<int, std::string> keycode_itoa;
std::map<std::string, int> keycode_atoi;

void InitKeyCode() {
  ${extracted
    .map(([ key, code ]) => {
      return `keycode_itoa[${code}] = "${key}";
  keycode_atoi["${key}"] = ${code};
`;
    })
    .join('  ')
    .trim()}

  // Add deprecated key mappings
  ${deprecatedKeys
    .map(([ deprecated, current ]) => {
      // Find the code corresponding to the current key
      const currentKeyPair = extracted.find(([ key ]) => key === current);
      if (currentKeyPair) {
        const [ , code ] = currentKeyPair;

        // Map deprecated key name to corresponding key value`;
        return `keycode_atoi["${deprecated}"] = ${code};`;
      }
      return '';
    })
    .filter(line => line) // Filter out empty lines
    .join('\n  ')}
}

}  // namespace gen
}  // namespace node_sfml
`;

fs.writeFileSync(path.join(__dirname, '../src/gen/keycode.cc'), str);

if (process.platform !== 'win32') {
  cp.execFileSync(path.join(__dirname, 'clang_format.js'), [
    '-style=file',
    '-i',
    path.join(__dirname, '../src/gen/keycode.cc'),
  ]);
}

console.log('./src/gen/keyboard.cc generated.');
