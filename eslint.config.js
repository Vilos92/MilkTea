import jsxA11y from 'eslint-plugin-jsx-a11y';
import preact from 'eslint-plugin-preact';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import storybook from 'eslint-plugin-storybook';
import {defineConfig} from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      preact,
      react,
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    settings: {
      react: {version: '18.2'}
    },
    rules: {
      ...jsxA11y.configs.recommended.rules,

      // Require braces for all control flow statements.
      curly: ['error', 'all'],

      // Preact uses 'class' instead of 'className'.
      'react/no-unknown-property': ['error', {ignore: ['class']}],

      // Rules of Hooks (same as React; applies to Preact hooks).
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // Require floating promises to be explicitly handled or voided.
      '@typescript-eslint/no-floating-promises': 'error',

      // Require object shorthand: {param} instead of {param: param}.
      'object-shorthand': 'error'
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**']
  },
  ...storybook.configs['flat/recommended']
]);
