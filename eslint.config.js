import jsxA11y from 'eslint-plugin-jsx-a11y';
import preact from 'eslint-plugin-preact';
import react from 'eslint-plugin-react';
import {defineConfig} from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      preact,
      react,
      'jsx-a11y': jsxA11y
    },
    languageOptions: {
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

      // Preact uses 'class' instead of 'className'
      'react/no-unknown-property': ['error', {ignore: ['class']}]
    }
  },

  {
    ignores: ['dist/**', 'node_modules/**']
  }
]);
