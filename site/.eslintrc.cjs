'use strict';

module.exports = {
  root: true,
  extends: [
    'eslint-config-egg',
    '../common/config/eslint/readability.cjs',
  ],
  ignorePatterns: [
    'build/',
    '.vitepress/cache/',
    '.vitepress/dist/',
    '.vitepress/.temp/',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  overrides: [
    {
      files: [ '**/*.mjs' ],
      parserOptions: {
        sourceType: 'module',
      },
    },
    {
      files: [ '.vitepress/theme/**', 'scripts/typedoc/navigation.js' ],
      env: {
        browser: true,
      },
    },
    {
      files: [ '**/*.ts', '**/*.mts', '**/*.vue' ],
      extends: [
        'eslint-config-egg',
        'eslint-config-egg/typescript',
        'plugin:import/recommended',
        'plugin:import/typescript',
        '../common/config/eslint/readability.cjs',
      ],
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
        extraFileExtensions: [ '.vue' ],
      },
    },
    {
      files: [ '**/*.vue' ],
      extends: [ 'plugin:vue/essential' ],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
  ],
};
