'use strict';

module.exports = {
  root: true,
  extends: [
    'eslint-config-egg',
    '../../common/config/eslint/readability.cjs',
  ],
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.vsix',
    'syntaxes/',
    'snippets/',
    'language-configuration/',
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
      files: [ '**/*.ts' ],
      extends: [
        'eslint-config-egg',
        'eslint-config-egg/typescript',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'plugin:jsdoc/recommended-typescript-error',
        '../../common/config/eslint/readability.cjs',
      ],
      parserOptions: {
        project: [ './tsconfig.json' ],
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
      settings: {
        jsdoc: {
          mode: 'typescript',
          tagNamePreference: {
            return: 'returns',
            returns: 'returns',
          },
        },
      },
      rules: {
        'import/no-relative-packages': 'error',
        'import/no-unresolved': [
          'error',
          { ignore: [ 'vscode' ] },
        ],
        'jsdoc/no-types': 'error',
        'jsdoc/tag-lines': [ 'error', 'any', { startLines: 1 }],
        'jsdoc/check-tag-names': [
          'error',
          { definedTags: [ 'zh', 'ja', 'ko', 'remarks' ] },
        ],
      },
    },
  ],
};
