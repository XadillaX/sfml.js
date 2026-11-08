'use strict';

// Extend this after language presets so inherited rules cannot weaken it.
module.exports = {
  rules: {
    curly: [ 'error', 'all' ],
    'brace-style': [ 'error', '1tbs', { allowSingleLine: false }],
    'max-statements-per-line': [ 'error', { max: 1 }],
    'max-len': [ 'error', { code: 80 }],
  },
};
