'use strict';

const path = require('node:path');

const root = __dirname;

// Locations of the contract headers and the prebuilt SFML SDK.
module.exports = {
  root,
  include: path.join(root, 'include'),
  sfmlInclude: path.join(root, 'third_party/sfml/include'),
  sfmlLib: path.join(root, 'third_party/sfml/lib'),
  sfmlBin: path.join(root, 'third_party/sfml/bin'),
};
