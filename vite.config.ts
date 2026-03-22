/// <reference types="vitest/config" />
import preact from '@preact/preset-vite';
import {storybookTest} from '@storybook/addon-vitest/vitest-plugin';
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import {playwright} from '@vitest/browser-playwright';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    preact(),
    vanillaExtractPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {enabled: true},
      includeAssets: ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png'],
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
          {src: 'android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any'},
          {src: 'android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
          {src: 'android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'}
        ]
      }
    })
  ],
  test: {
    projects: [
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
