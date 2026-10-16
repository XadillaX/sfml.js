'use strict';

module.exports = {
  root: true,
  extends: [
    'eslint-config-egg',
  ],
  ignorePatterns: [ 'build/', 'dist/', 'third_party/' ],
  rules: {
    'max-len': [ 'error', { code: 80 }],
  },
  overrides: [
    {
      files: [ '**/*.ts' ],
      extends: [
        'eslint-config-egg',
        'eslint-config-egg/typescript',
        'plugin:import/recommended',
        'plugin:import/typescript',
      ],
      parserOptions: {
        project: [ './tsconfig.json', './test/tsconfig.json' ],
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
      rules: {
        '@typescript-eslint/ban-types': 'off',
        'import/no-relative-packages': 'error',
      },
    },
  ],
};
