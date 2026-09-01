import {defineConfig, minimal2023Preset} from '@vite-pwa/assets-generator/config';

/*
 * Constants.
 */

const preset = {
  ...minimal2023Preset,
  transparent: {
    ...minimal2023Preset.transparent,
    padding: 0
  }
};

/*
 * Config.
 */

export default defineConfig({
  headLinkOptions: {
    preset: '2023'
  },
  preset,
  images: ['public/milktea-icon.png']
});
