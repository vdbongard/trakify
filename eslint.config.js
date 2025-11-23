// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 't',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 't',
          style: 'kebab-case',
        },
      ],
      '@typescript-eslint/explicit-member-accessibility': 'off',
      // JavaScript hoists functions to the top, so it should not be an error.
      '@typescript-eslint/no-use-before-define': 'off',
      // Explicit function return types increase the readability, so they should always be included.
      '@typescript-eslint/explicit-function-return-type': 'error',
      // TS ignore is needed for external libraries that are not typed.
      '@typescript-eslint/ban-ts-comment': 'off',
      // Empty function are needed for tests to override functionality.
      '@typescript-eslint/no-empty-function': 'off',
      // Everything should have a type. If not possible disable eslint for the line and case.
      '@typescript-eslint/no-explicit-any': 'error',
      // Unused vars can be removed without problems.
      '@typescript-eslint/no-unused-vars': 'error',
      // Useless constructor can be removed without problems.
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          filter: {
            regex:
              '^(watched_at|trakt-api-version|trakt-api-key|listed_at|Authorization|last_watched_at|start_at|last_watched_at|updated_at|air_date|episode_count|poster_path|season_number|\\[class\\.ticker\\]|\\[style\\.--animated-text-width\\]|\\(mouseenter\\)|\\(mouseleave\\)|\\(pointerdown\\))$',
            match: false,
          },
          leadingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          format: ['camelCase'],
        },
        {
          selector: 'classProperty',
          modifiers: ['protected', 'readonly'],
          format: ['PascalCase'],
        },
        {
          selector: 'property',
          modifiers: ['static'],
          format: ['camelCase'],
        },
        {
          selector: 'property',
          modifiers: ['readonly'],
          format: ['camelCase', 'UPPER_CASE'],
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE'],
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'variable',
          modifiers: ['const'],
          // PascalCase only for custom objects, UPPER_CASE only for CONSTANTS
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        },
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase'],
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      'no-restricted-syntax': [
        'off',
        {
          selector:
            'CallExpression[callee.object.name="console"][callee.property.name=/^(debug|info|time|timeEnd|trace)$/]',
          message: 'Unexpected property on console object was called',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      // it is part of @typescript-eslint/stylistic-type-checked, but it is sometimes not safe to prefer nullish coalescing ("false ?? true" is not the same as "false || true")
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      'no-constant-binary-expression': 'error',
      // it is part of typescript-eslint recommended rules but here two parameters are enabled which are disabled by default
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
      '@angular-eslint/component-class-suffix': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
  {
    ignores: ['dist/', '.angular/', '.vscode/', '.github/'],
  },
]);
