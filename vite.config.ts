import path from 'node:path';
import {fileURLToPath} from 'node:url';

/// <reference types="vite-plus" />
import preact from '@preact/preset-vite';
import {storybookTest} from '@storybook/addon-vitest/vitest-plugin';
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import {VitePWA} from 'vite-plugin-pwa';
import {defineConfig, lazyPlugins} from 'vite-plus';
import {playwright} from 'vite-plus/test/browser-playwright';

/*
 * Constants.
 */

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const REPO_TS_FMT_OPTIONS = {
  arrowParens: 'avoid' as const,
  bracketSpacing: false,
  printWidth: 110,
  trailingComma: 'none' as const,
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  sortImports: true,
  sortPackageJson: true
};

/*
 * Config.
 */

export default defineConfig({
  staged: {
    '*': 'vp check --fix'
  },
  fmt: {
    ...REPO_TS_FMT_OPTIONS,
    ignorePatterns: ['dist/**', 'dev-dist/**', 'public/butterchurn/**']
  },
  lint: {
    plugins: ['typescript', 'react', 'jsx-a11y', 'import'],
    options: {typeAware: true, typeCheck: true},
    ignorePatterns: ['dist/**', 'dev-dist/**'],
    rules: {
      curly: ['error', 'all'],
      'no-nested-ternary': 'error',
      'object-shorthand': 'error',
      // Preact uses `class` instead of `className`.
      'react/no-unknown-property': ['error', {ignore: ['class']}],
      // Off because native `<dialog>` only earns its behaviour through `showModal()`, and these
      // overlays are deliberately rendered and dismissed by the components themselves. The
      // existing `role`/`aria-modal`/`aria-labelledby` markup is already screen-reader complete.
      'jsx-a11y/prefer-tag-over-role': 'off',
      'react/rules-of-hooks': 'error',
      'react/exhaustive-deps': 'error',
      'typescript/no-floating-promises': 'error'
    },
    overrides: [
      {
        // Storybook has no Oxlint port, so its ESLint plugin runs through the JS bridge.
        files: ['**/*.stories.tsx', '.storybook/main.ts'],
        jsPlugins: ['eslint-plugin-storybook']
      }
    ]
  },
  plugins: lazyPlugins(() => [
    preact(),
    vanillaExtractPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      // Use `bun run dev:pwa` when debugging the SW.
      devOptions: {enabled: process.env.PWA_DEV === '1'},
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'pwa-64x64.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-icon-512x512.png',
        'apple-touch-icon-180x180.png'
      ],
      workbox: {
        // - globDirectory is `dist`.
        // - public/ is copied at repo root.
        // - Pre-cache translations and butterchurn presets, which VitePWA does not do by default.
        globPatterns: ['**/*.{js,wasm,css,html}', 'translations/*.json', 'butterchurn/presets/*.json']
      },
      manifest: {
        name: 'MilkTea',
        short_name: 'MilkTea',
        description: 'MilkTea — visual music in the browser.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png'},
          {src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png'},
          {src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
          {src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'}
        ]
      }
    })
  ]),
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.spec.ts'],
          environment: 'node'
        }
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook')
          })
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: 'chromium'
              }
            ]
          },
          setupFiles: ['.storybook/vitest.setup.ts']
        }
      }
    ]
  }
});
