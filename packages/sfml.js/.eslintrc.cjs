'use strict';

module.exports = {
  root: true,
  extends: [
    'eslint-config-egg',
    '../../common/config/eslint/readability.cjs',
  ],
  ignorePatterns: [
    'build/',
    'dist/',
    'third_party/',
    'site/.vitepress/cache/',
    'site/.vitepress/dist/',
    'site/.vitepress/.temp/',
  ],
  rules: {
    'jsdoc/check-tag-names': [
      'error',
      {
        definedTags: [ 'zh', 'ja', 'ko' ],
      },
    ],
  },
  overrides: [
    {
      files: [ '**/*.mjs' ],
      parserOptions: {
        sourceType: 'module',
      },
    },
    {
      files: [
        'tools/typedoc/navigation.js',
        'site/.vitepress/theme/hero-light.mjs',
      ],
      env: {
        browser: true,
      },
    },
    {
      files: [ '**/*.ts' ],
      extends: [
        'eslint-config-egg',
        'eslint-config-egg/typescript',
        'plugin:import/recommended',
        'plugin:import/typescript',
        '../../common/config/eslint/readability.cjs',
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
