import jsxA11y from 'eslint-plugin-jsx-a11y';
import preact from 'eslint-plugin-preact';
import {defineConfig} from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      preact,
      'jsx-a11y': jsxA11y
    },
    languageOptions: {
      parserOptions: {
        projectService: true, // 2026's "auto-find tsconfig" feature
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      ...preact.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      // preact uses 'class' instead of 'className'
      'preact/no-unknown-property': ['error', {ignore: ['class']}]
    }
  },

  {
    ignores: ['dist/**', 'node_modules/**']
  }
]);
