import type {Meta, StoryObj} from '@storybook/preact-vite';

import {MediabunnyDemo} from './mediabunnyDemo';

/*
 * Types.
 */

type Story = StoryObj<typeof meta>;

/*
 * Meta.
 */

const meta = {
  title: 'Components/MediabunnyDemo',
  component: MediabunnyDemo
} satisfies Meta<typeof MediabunnyDemo>;

export default meta;

/*
 * Stories.
 */

export const Basic: Story = {};
