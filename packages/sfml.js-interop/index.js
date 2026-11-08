'use strict';

const path = require('node:path');

// Same contract as nan: the entry point resolves to the include directory.
module.exports = path.join(__dirname, 'include');
